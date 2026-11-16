import type { CSSProperties } from "react";
import { Card, Section } from "@harmo-ui/react";
import { AnalyticsIcon, InfoIcon, MessagesIcon, SettingsIcon, SuccessIcon, UserIcon } from "../app-icons.tsx";
import type { Upload } from "../patterns/contact-form/attachments.ts";
import { ContactForm, type ContactFormResult } from "../patterns/contact-form/ContactForm.tsx";
import { ContactOptions } from "../patterns/contact-form/ContactOptions.tsx";
import { OrderHelpForm, type OrderHelpFormResult } from "../patterns/contact-form/OrderHelpForm.tsx";
import { SalesContactForm, type SalesContactFormResult } from "../patterns/contact-form/SalesContactForm.tsx";
import { SupportRequestForm, type SupportRequestFormResult } from "../patterns/contact-form/SupportRequestForm.tsx";

const textOf = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

const filesOf = (data: FormData, name: string) =>
  data.getAll(name).filter((entry): entry is File => entry instanceof File && entry.name !== "");

// What was typed in these fields, to give back with a message, as `values`,
// for the page a post renders to fill in again. Files can't be given back.
const typed = <Name extends string>(data: FormData, names: readonly Name[]) =>
  Object.fromEntries(names.map((name) => [name, textOf(data, name)])) as Record<Name, string>;

// Stands in for your app's server, which answers after a moment: what's sent
// from fail@example.com gets a message back, as from a server that's busy,
// and what's sent from error@example.com throws, as a request that can't
// reach the server does. Anything else is sent, but a field the server turns
// down, which it says of that field: an address at gmial.com, which can't
// receive email, in a message or a support request; a personal address, at
// gmail.com, outlook.com, or yahoo.com, or a link in the message, in a sales
// inquiry; a file it can't open in a support request, or a photo that isn't
// a JPEG, PNG, or WebP; and an order it can't find, 9999. The support form
// uploads its files as they're added, and sends their keys; the order form
// sends its photos with the form.
const answer = <Result,>(data: FormData, busy: Result, result: () => Result) =>
  new Promise<Result>((resolve, reject) =>
    setTimeout(() => {
      const email = textOf(data, "email");
      if (email === "error@example.com") reject(new Error("The server can't be reached."));
      else resolve(email === "fail@example.com" ? busy : result());
    }, 800),
  );

const didntSend = "Your message didn't send. Try again in a moment.";

const undeliverable = <Values extends { email: string }>(values: Values) =>
  values.email.endsWith("@gmial.com")
    ? { email: "We can't deliver email to gmial.com. Did you mean gmail.com?", values }
    : undefined;

const sendMessage = (_previous: ContactFormResult, data: FormData) => {
  const values = typed(data, ["name", "email", "message"]);
  return answer<ContactFormResult>(
    data,
    { form: didntSend, values },
    () => undeliverable(values) ?? { step: "sent", email: values.email },
  );
};

const sendInquiry = (_previous: SalesContactFormResult, data: FormData) => {
  const values = typed(data, ["email", "name", "phone", "country", "website", "message"]);
  return answer<SalesContactFormResult>(data, { form: didntSend, values }, () =>
    /@(gmail|outlook|yahoo)\.com$/.test(values.email)
      ? { email: "Use your company email address, not a personal one.", values }
      : /https?:\/\/|www\./i.test(values.message)
        ? { message: "Your message can't have links in it. Take them out, and send it again.", values }
        : { step: "sent" },
  );
};

// Stands in for uploading to your storage: it reports progress over a second
// or so, then gives back the key the file is stored under, which the support
// form sends in the file's place. A file whose name starts with "fail" stops
// halfway the first time, so it can be tried again.
const stored = new Map<string, File>();
const failedOnce = new Set<string>();
let keys = 0;

const upload: Upload = (file, { progress, signal }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done += 20;
      if (file.name.startsWith("fail") && done === 60 && !failedOnce.has(file.name)) {
        failedOnce.add(file.name);
        clearInterval(timer);
        return reject(new Error("The upload failed."));
      }
      if (done < 100) return progress(done);
      clearInterval(timer);
      const key = `uploads/${(keys += 1)}`;
      stored.set(key, file);
      resolve(key);
    }, 250);
    signal.addEventListener("abort", () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

// The files the keys sent name, as your server would look them up.
const uploadedOf = (data: FormData, name: string) =>
  data.getAll(name).flatMap((key) => (typeof key === "string" && stored.has(key) ? [stored.get(key)!] : []));

const sendRequest = (_previous: SupportRequestFormResult, data: FormData) => {
  const values = typed(data, ["email", "topic", "subject", "message"]);
  return answer<SupportRequestFormResult>(data, { form: didntSend, values }, () => {
    const unopenable = uploadedOf(data, "attachments").find((file) => !/^(image\/|text\/|application\/pdf$)/.test(file.type));
    return (
      undeliverable(values) ??
      (unopenable
        ? { attachments: `${unopenable.name} isn't a file we can open. Send screenshots, PDFs, or text files.`, values }
        : { step: "sent", email: values.email })
    );
  });
};

const sendOrderHelp = (_previous: OrderHelpFormResult, data: FormData) => {
  const values = typed(data, ["order", "email", "problem", "message"]);
  return answer<OrderHelpFormResult>(data, { form: didntSend, values }, () => {
    const unopenable = filesOf(data, "photos").find((file) => !/^image\/(jpeg|png|webp)$/.test(file.type));
    return values.order === "9999"
      ? { order: "We can't find order 9999. Check the number in your order confirmation.", values }
      : unopenable
        ? { photos: `${unopenable.name} isn't a photo we can open. Send a JPEG, PNG, or WebP.`, values }
        : { step: "sent", order: values.order, email: values.email };
  });
};

const sent = <SuccessIcon className="hicon" />;

export const examples = {
  Default: () => <ContactForm action={sendMessage} sentIcon={sent} />,

  "Sales inquiry": () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(20rem, 100%), 1fr))",
        gap: "var(--harmo-space-lg)",
        alignItems: "start",
      }}
    >
      <Section
        label="Let's find the right plan for your team"
        description="Get a demo tailored to you, and see how it fits the way your team works."
      >
        <ul
          style={
            {
              "--harmo-card-padding": "0",
              display: "grid",
              gap: "var(--harmo-space-sm)",
              margin: 0,
              padding: 0,
              listStyle: "none",
            } as CSSProperties
          }
        >
          <li>
            <Card
              variant="ghost"
              icon={<UserIcon className="hicon" />}
              label="A demo built around you"
              labelAs="p"
              description="We'll show you what matters to your team, not a slide deck."
            />
          </li>
          <li>
            <Card
              variant="ghost"
              icon={<AnalyticsIcon className="hicon" />}
              label="Pricing for your volume"
              labelAs="p"
              description="A plan sized to your team and how you'll use it, with no surprises."
            />
          </li>
          <li>
            <Card
              variant="ghost"
              icon={<SettingsIcon className="hicon" />}
              label="Help getting set up"
              labelAs="p"
              description="We'll help you start, and bring over what you already have."
            />
          </li>
        </ul>
      </Section>
      <SalesContactForm action={sendInquiry} privacyHref="/privacy" sentIcon={sent} />
    </div>
  ),

  "Support request": () => <SupportRequestForm action={sendRequest} upload={upload} sentIcon={sent} />,

  "Order help": () => <OrderHelpForm action={sendOrderHelp} sentIcon={sent} />,

  "Contact options": () => (
    <ContactOptions
      salesHref="/contact/sales"
      supportEmail="support@example.com"
      helpHref="/help"
      salesIcon={<UserIcon className="hicon" />}
      supportIcon={<MessagesIcon className="hicon" />}
      helpIcon={<InfoIcon className="hicon" />}
    />
  ),
};
