import { afterEach, describe, expect, spyOn, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { ContactForm } from "../src/patterns/contact-form/ContactForm.tsx";
import { OrderHelpForm } from "../src/patterns/contact-form/OrderHelpForm.tsx";
import { SalesContactForm } from "../src/patterns/contact-form/SalesContactForm.tsx";
import { SupportRequestForm } from "../src/patterns/contact-form/SupportRequestForm.tsx";

// What docs/patterns/contact-form.md says the forms do without JavaScript.
// Given a server action, React renders a form that posts it to the page, as
// multipart, with each control named; the server runs the action and renders
// the page again with its result, as a framework such as Next.js does, here
// through renderToReadableStream's formState, which is how a framework hands
// React the result of a post. A server action is what the framework's bundler
// makes of a "use server" function: here a stand-in with the two hooks React
// reads, $$FORM_ACTION for what the form posts and $$IS_SIGNATURE_EQUAL for
// matching a post to its form, which says yes. Given a function of yours
// instead, React renders a form it holds until it runs.
type Run = (...args: unknown[]) => unknown;

const serverAction = (run: Run): Run => {
  const action = Object.assign((...args: unknown[]) => run(...args), {
    $$FORM_ACTION: (prefix: string) => ({
      name: `$ACTION_REF_${prefix}`,
      method: "POST",
      encType: "multipart/form-data",
      data: new FormData(),
    }),
    $$IS_SIGNATURE_EQUAL: () => true,
  });
  action.bind = (_: unknown, ...bound: unknown[]) => serverAction((...args) => run(...bound, ...args)) as never;
  return action;
};

const render = async (node: ReactNode, formState?: unknown[]) => {
  const stream = await renderToReadableStream(node, formState ? { formState: formState as never } : {});
  await stream.allReady;
  return new Response(stream).text();
};

// The page after a post that the action answered with `result`: React
// matches the post to the form by the key the form posted.
const answered = async (form: (action: never) => ReactNode, result: unknown) => {
  const action = serverAction(async () => result) as never;
  const page = await render(form(action));
  const key = /name="\$ACTION_KEY" value="([^"]+)"/.exec(page)?.[1];
  expect(key, "the key the form posts").toBeDefined();
  return render(form(action), [result, key, "action", 0]);
};

const decode = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const attributesOf = (tag: string) =>
  new Map([...tag.matchAll(/\s([^\s=/>]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name!.toLowerCase(), value ?? ""]));

const formTag = (page: string) => attributesOf(/<form\b[^>]*>/.exec(page)?.[0] ?? "");

// What each control sends, by name, in order: inputs, a Select's native
// select, text areas, and file inputs, less the ones React adds for the post.
const namesIn = (page: string) =>
  [...page.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)]
    .map(([tag]) => attributesOf(tag).get("name"))
    .filter((name) => name !== undefined && !name.startsWith("$ACTION_"));

// The control a field's message is about: its input, or a Select's button.
const controlOf = (page: string, name: string) => {
  const tag = [...page.matchAll(/<(?:input|textarea|button)\b[^>]*>/g)]
    .map(([tag]) => attributesOf(tag))
    .find((tag) => (tag.get("name") === name && tag.get("type") !== "hidden") || tag.get("data-name") === name);
  if (!tag) throw new Error(`no control named ${name}`);
  return tag;
};

const errorOf = (page: string, name: string) => {
  const ids = (controlOf(page, name).get("aria-describedby") ?? "").split(" ");
  for (const [, tag, text] of page.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    const attributes = attributesOf(tag!);
    if (attributes.get("class") === "herror" && ids.includes(attributes.get("id") ?? "")) return decode(text!);
  }
  return undefined;
};

const failureOf = (page: string) =>
  decode(/<div class="hcontact-form-submit"><p class="herror" aria-live="polite">([\s\S]*?)<\/p>/.exec(page)?.[1] ?? "");

const thanksOf = (page: string) => /<div class="hempty-state"( hidden="")?>([\s\S]*?)<\/div><\/div>$/.exec(page);

// What a control starts with: an input's value, a text area's text, or the
// option a <select> has selected.
const valueOf = (page: string, name: string) => {
  const input = [...page.matchAll(/<input\b[^>]*>/g)]
    .map(([tag]) => attributesOf(tag))
    .find((tag) => tag.get("name") === name && tag.get("type") !== "hidden");
  if (input) return input.get("value") === undefined ? undefined : decode(input.get("value")!);
  const area = new RegExp(`<textarea\\b[^>]*\\sname="${name}"[^>]*>([\\s\\S]*?)</textarea>`).exec(page);
  if (area) return decode(area[1]!) || undefined;
  const select = new RegExp(`<select\\b[^>]*\\sname="${name}"[^>]*>([\\s\\S]*?)</select>`).exec(page);
  if (select) return /<option\b(?=[^>]*\sselected="")[^>]*\svalue="([^"]*)"/.exec(select[1]!)?.[1] || undefined;
  throw new Error(`no control named ${name}`);
};

const titlesIn = (page: string) =>
  [...page.matchAll(/<(h[1-6]) class="(hcontact-form-title|hempty-state-title)"/g)].map(([, tag]) => tag);

type TitleTag = "h1" | "h2" | "h3";

interface Form {
  title: string;
  form: (action: never, titleAs?: TitleTag) => ReactNode;
  names: string[];
  fields: string[];
  elsewhere: Record<string, string>;
  kept: Record<string, string>;
  sent: { result: object; shows: string[] };
}

const forms: Form[] = [
  {
    title: "ContactForm",
    form: (action, titleAs) => <ContactForm action={action} titleAs={titleAs} />,
    names: ["name", "email", "message"],
    fields: ["name", "email", "message"],
    elsewhere: { coupon: "That coupon has run out." },
    kept: { name: "Sam Lee", email: "sam@example.com", message: "Can I change my plan?\nAnd my \"billing\" email & name?" },
    sent: { result: { step: "sent", email: "sam@example.com" }, shows: ["sam@example.com"] },
  },
  {
    title: "SalesContactForm",
    form: (action, titleAs) => <SalesContactForm action={action} privacyHref="/privacy" titleAs={titleAs} />,
    names: ["email", "name", "phone", "country", "website", "message"],
    fields: ["email", "name", "phone", "website"],
    elsewhere: {
      country: "We don't sell there yet.",
      message: "Your message can't have links in it.",
    },
    kept: {
      email: "sam@example.com",
      name: "Sam Lee",
      phone: "+1 415 555 2671",
      country: "FR",
      website: "example.com",
      message: "A team of 40.",
    },
    sent: { result: { step: "sent" }, shows: [] },
  },
  {
    title: "SupportRequestForm",
    form: (action, titleAs) => <SupportRequestForm action={action} titleAs={titleAs} />,
    names: ["email", "topic", "subject", "message", "attachments"],
    fields: ["email", "topic", "subject", "message", "attachments"],
    elsewhere: { coupon: "That coupon has run out." },
    kept: { email: "sam@example.com", topic: "billing", subject: "A double charge", message: "I was charged twice." },
    sent: { result: { step: "sent", email: "sam@example.com" }, shows: ["sam@example.com"] },
  },
  {
    title: "OrderHelpForm",
    form: (action, titleAs) => <OrderHelpForm action={action} titleAs={titleAs} />,
    names: ["order", "email", "problem", "photos", "message"],
    fields: ["order", "email", "problem", "photos"],
    elsewhere: { message: "Your message can't have links in it." },
    kept: { order: "1042", email: "sam@example.com", problem: "missing", message: "The lid is missing." },
    sent: { result: { step: "sent", order: "1042", email: "sam@example.com" }, shows: ["1042", "sam@example.com"] },
  },
];

const errors = spyOn(console, "error");
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockClear();
});

for (const { title, form, names, fields, elsewhere, kept, sent } of forms) {
  describe(title, () => {
    test("given a server action, it posts to the page, as multipart, with every control named", async () => {
      const page = await render(form(serverAction(async () => undefined) as never));
      const tag = formTag(page);
      expect(tag.get("method")).toBe("POST");
      expect(tag.get("enctype")).toBe("multipart/form-data");
      expect(tag.get("action")).toBe("");
      expect(namesIn(page)).toEqual(names);
      for (const file of page.match(/<input\b[^>]*type="file"[^>]*>/g) ?? []) {
        expect(attributesOf(file).has("multiple")).toBe(true);
        expect(attributesOf(file).get("name")).toBeTruthy();
      }
    });

    test("given a function of yours, it's React's form, which doesn't submit before React runs, and has no method", async () => {
      const page = await render(form((async () => undefined) as never));
      const tag = formTag(page);
      expect(tag.get("action")).toStartWith("javascript:");
      expect(tag.has("method")).toBe(false);
      expect(namesIn(page)).toEqual(names);
    });

    test("posted, an answer of nothing changes nothing", async () => {
      const page = await answered(form, undefined);
      expect(formTag(page).has("hidden")).toBe(false);
      expect(thanksOf(page)?.[1]).toBe(' hidden=""');
      expect(failureOf(page)).toBe("");
      for (const name of fields) expect(errorOf(page, name)).toBe("");
      expect(page).not.toContain('aria-invalid="true"');
    });

    test("posted, a message goes above the button", async () => {
      const page = await answered(form, "Your message didn't send. Try again in a moment.");
      expect(failureOf(page)).toBe("Your message didn't send. Try again in a moment.");
      expect(page).not.toContain('aria-invalid="true"');
      expect(thanksOf(page)?.[1]).toBe(' hidden=""');
    });

    test("posted, each field's message goes under it, and marks its control invalid", async () => {
      const messages = Object.fromEntries(fields.map((name) => [name, `Check the ${name}.`]));
      const page = await answered(form, messages);
      for (const name of fields) {
        expect(errorOf(page, name)).toBe(`Check the ${name}.`);
        expect(controlOf(page, name).get("aria-invalid")).toBe("true");
      }
      expect(failureOf(page)).toBe("");
      expect(formTag(page).has("hidden")).toBe(false);
    });

    test("posted, a message for a field with no error of its own, or one it doesn't have, goes above the button", async () => {
      const [first] = fields;
      const page = await answered(form, { [first!]: "Check this.", ...elsewhere });
      expect(failureOf(page)).toBe(Object.values(elsewhere).join(" "));
      expect(errorOf(page, first!)).toBe("Check this.");
      expect(thanksOf(page)?.[1]).toBe(' hidden=""');
    });

    test("posted, a message for the form with values goes above the button, and each field it keeps starts with its value", async () => {
      const page = await answered(form, { form: "Your message didn't send. Try again in a moment.", values: kept });
      expect(failureOf(page)).toBe("Your message didn't send. Try again in a moment.");
      for (const [name, value] of Object.entries(kept)) expect(valueOf(page, name), name).toBe(value);
      for (const name of names.filter((name) => !(name in kept))) expect(valueOf(page, name), name).toBeUndefined();
      expect(page).not.toContain('aria-invalid="true"');
    });

    test("posted, an answer without values leaves the fields empty", async () => {
      const page = await answered(form, Object.fromEntries(fields.map((name) => [name, `Check the ${name}.`])));
      for (const name of names) expect(valueOf(page, name), name).toBeUndefined();
    });

    test("titleAs sets the tag of its title and the thank-you's", async () => {
      expect(titlesIn(await render(form(serverAction(async () => undefined) as never)))).toEqual(["h2", "h2"]);
      expect(titlesIn(await render(form(serverAction(async () => undefined) as never, "h1")))).toEqual(["h1", "h1"]);
    });

    test("posted, the thank-you takes the form's place, with what the answer gives it", async () => {
      const page = await answered(form, sent.result);
      expect(formTag(page).has("hidden")).toBe(true);
      const thanks = thanksOf(page);
      expect(thanks?.[1]).toBeUndefined();
      expect([...(thanks?.[2] ?? "").matchAll(/<strong>([^<]*)<\/strong>/g)].map(([, text]) => text)).toEqual(sent.shows);
    });
  });
}

test("only text is a message, so values never shows as one, and an answer with a step other than sent isn't a thank-you", async () => {
  const page = await answered((action) => <ContactForm action={action} />, {
    email: "Check it.",
    name: 42,
    values: { email: "sam@example.com" },
  });
  expect(errorOf(page, "email")).toBe("Check it.");
  expect(errorOf(page, "name")).toBe("");
  expect(failureOf(page)).toBe("");
  const other = await answered((action) => <ContactForm action={action} />, { step: "maybe", email: "Check it." });
  expect(formTag(other).has("hidden")).toBe(false);
  expect(thanksOf(other)?.[1]).toBe(' hidden=""');
  expect(errorOf(other, "email")).toBe("");
});

test("given upload, the files field is hidden until the script runs, since uploading needs it; without it, the files go with the form", async () => {
  const upload = async () => "uploads/1";
  const hidden = (page: string, label: string) =>
    page.match(new RegExp(`<div([^>]*)><div class="hfield-label-row"><label class="hlabel" for="[^"]*">${label}<`))?.[1].includes('hidden=""');
  for (const [form, label] of [
    [(given?: typeof upload) => <SupportRequestForm action={serverAction(async () => undefined) as never} upload={given} />, "Attachments"],
    [(given?: typeof upload) => <OrderHelpForm action={serverAction(async () => undefined) as never} upload={given} />, "Photos"],
  ] as const) {
    expect(hidden(await render(form(upload)), label)).toBe(true);
    expect(hidden(await render(form()), label)).toBe(false);
  }
});
