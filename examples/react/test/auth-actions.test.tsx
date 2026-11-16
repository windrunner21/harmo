import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AccountForms } from "../src/patterns/account-forms/AccountForms.tsx";
import { NewPasswordForm, type NewPasswordFormResult } from "../src/patterns/reset-password/NewPasswordForm.tsx";
import { ResetPasswordForm, type ResetPasswordFormResult } from "../src/patterns/reset-password/ResetPasswordForm.tsx";
import { SignInForm, type SignInFormResult, type SignInFormTwoFactorResult } from "../src/patterns/sign-in-form/SignInForm.tsx";
import { SignUpForm, type SignUpFormConfirmResult } from "../src/patterns/sign-up-form/SignUpForm.tsx";
import { VerifyCodeForm, type VerifyCodeResult } from "../src/patterns/verify-code/VerifyCodeForm.tsx";

// What the account patterns' docs say about working without JavaScript: each
// form posts to its action, and the page the server renders after a post
// shows what the action returned. Here each action is a server action as a
// framework's bundler makes one, such as Next.js's for "use server": a
// function React knows how to post to, with $$FORM_ACTION, so it renders a
// form with method="POST" and hidden fields that name the action; and given
// the form state a framework decodes from a post, React gives the hook that
// posted it the action's result, as on the page after a post. That's React's
// own server rendering, run here; what isn't is a browser sending the form
// and a framework decoding it, which these stand in for.

type Action = ((...args: unknown[]) => Promise<unknown>) & Record<string, unknown>;

const serverAction = (id: string): never => {
  const fields = (name: string, data: FormData | null) => ({
    name,
    method: "POST",
    encType: "multipart/form-data",
    data,
  });
  const action = (async () => undefined) as unknown as Action;
  action.$$FORM_ACTION = () => fields(`$ACTION_ID_${id}`, null);
  action.$$IS_SIGNATURE_EQUAL = (referenceId: string) => referenceId === id;
  action.bind = (_: unknown, ...bound: unknown[]) => {
    const bindings = (async () => undefined) as unknown as Action;
    bindings.$$FORM_ACTION = (prefix: string) => {
      const data = new FormData();
      data.append(`$ACTION_REF_${prefix}`, "");
      data.append(`$ACTION_${prefix}:0`, JSON.stringify({ id, bound }));
      return fields(`$ACTION_REF_${prefix}`, data);
    };
    return bindings;
  };
  return action as never;
};

const render = async (element: ReactNode, formState?: [unknown, string, string, number]) => {
  const stream = await renderToReadableStream(element, formState ? { formState: formState as never } : {});
  await stream.allReady;
  return new Response(stream).text();
};

// The key React gives each form's action state, in the order the forms
// render it, as a framework posts it back.
const keysIn = (markup: string) => [...markup.matchAll(/name="\$ACTION_KEY" value="([^"]+)"/g)].map(([, key]) => key!);

// Renders the page once, then again after a post to the action with this id,
// whose key is the nth in the page, that returned `result`.
const afterPost = async (element: ReactNode, id: string, result: unknown, nth = 0) => {
  const key = keysIn(await render(element))[nth];
  if (!key) throw new Error(`No action state key ${nth} in the page`);
  return render(element, [result, key, id, 1]);
};

// An element by its tag, the attributes it has, in any order and case, as
// React writes them, and its text.
const element = (tag: string, attributes: string[], text: string) =>
  new RegExp(
    `<${tag}${attributes.map((attribute) => `(?=[^>]*\\s${attribute.replace(/[$()]/g, "\\$&")})`).join("")}[^>]*>(?:<input[^>]*>)*${text}</${tag}>`,
    "i",
  );

const forms = (markup: string) => [...markup.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)].map(([, attributes = "", content = ""]) => ({ attributes, content }));
const textOf = (markup: string) => markup.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/\s+/g, " ");
const errorFor = (markup: string, name: string) => {
  const input = new RegExp(`<input\\b[^>]*name="${name}"[^>]*>`).exec(markup)?.[0] ?? "";
  const ids = /aria-describedby="([^"]+)"/.exec(input)?.[1]?.split(" ") ?? [];
  const id = ids.find((each) => each.endsWith("-error"));
  return { input, error: id ? textOf(new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</p>`).exec(markup)?.[1] ?? "").trim() : undefined };
};

// An input's value, as the page after a post fills it in, or undefined.
const valueOf = (markup: string, name: string) =>
  /\svalue="([^"]*)"/.exec(errorFor(markup, name).input)?.[1]?.replace(/&#x27;/g, "'");

// Each form's title, and each of its steps', by its tag.
const titlesIn = (markup: string) =>
  [...markup.matchAll(/<(h[1-6]) class="hauth-form-title"[^>]*>/g)].map(([, tag]) => tag);

const signIn = serverAction("sign-in");
const verify = serverAction("verify");
const resend = serverAction("resend");
const signUp = serverAction("sign-up");
const sendLink = serverAction("send-link");
const savePassword = serverAction("save-password");

describe("Sign-in Form, without JavaScript", () => {
  const page = <SignInForm action={signIn} forgotPasswordHref="/reset-password" />;

  test("posts to its action, with nothing in the address, and names its fields", async () => {
    const [form] = forms(await render(page));
    expect(form!.attributes).toContain('method="POST"');
    expect(form!.attributes).toMatch(/enctype="multipart\/form-data"/i);
    expect(form!.attributes).not.toContain("javascript:");
    expect(form!.content).toMatch(/<input type="hidden" name="\$ACTION_REF_/);
    expect(form!.content).toMatch(/<input(?=[^>]*name="email")[^>]*autocomplete="username"/i);
    expect(form!.content).toMatch(/autocomplete="current-password"/i);
    expect(form!.content).toContain('name="password"');
  });

  test("after a message, it goes under the password", async () => {
    const markup = await afterPost(page, "sign-in", "The email or password is incorrect.");
    const { input, error } = errorFor(markup, "password");
    expect(error).toBe("The email or password is incorrect.");
    expect(input).toContain('aria-invalid="true"');
    expect(errorFor(markup, "email").error).toBe("");
  });

  test("after messages by field, each goes under its own", async () => {
    const markup = await afterPost(page, "sign-in", { email: "Confirm your email address first." });
    expect(errorFor(markup, "email").error).toBe("Confirm your email address first.");
    expect(errorFor(markup, "password").error).toBe("");
  });

  test("after messages with values, the email is filled in again, and the password never is; `form` goes in the main spot", async () => {
    const markup = await afterPost(page, "sign-in", {
      form: "The email or password is incorrect.",
      values: { email: "sam@example.com", password: "hunter2" },
    });
    expect(errorFor(markup, "password").error).toBe("The email or password is incorrect.");
    expect(valueOf(markup, "email")).toBe("sam@example.com");
    expect(valueOf(markup, "password")).toBeUndefined();
  });

  test("after nothing, nothing changes", async () => {
    const markup = await afterPost(page, "sign-in", undefined);
    expect(errorFor(markup, "email").error).toBe("");
    expect(errorFor(markup, "password").error).toBe("");
    expect(forms(markup)).toHaveLength(1);
  });

  const twoFactor = (
    <SignInForm
      action={signIn}
      forgotPasswordHref="/reset-password"
      twoFactor={{ action: verify, resendAction: resend }}
    />
  );

  test("after the code step, the form is hidden and Verify Code shows where the code went, posting to its own action", async () => {
    const markup = await afterPost(twoFactor, "sign-in", { step: "code", sentTo: "sam@example.com" });
    const [signInCard, codeCard] = forms(markup);
    expect(signInCard!.attributes).toMatch(/\bhidden=""/);
    expect(codeCard!.attributes).not.toMatch(/\bhidden=""/);
    expect(textOf(codeCard!.content)).toContain("Verify it's you");
    expect(textOf(codeCard!.content)).toContain("We sent a 6-digit code to sam@example.com.");
    expect(codeCard!.attributes).toContain('method="POST"');
    expect(codeCard!.content).toMatch(/name="code"/);
    expect(codeCard!.content).toMatch(/autocomplete="one-time-code"/i);
    expect(codeCard!.content).not.toContain('name="password"');
    // The resend posts to its own action, from a submit button, without the
    // countdown a script would show.
    expect(codeCard!.content).toMatch(
      element("button", ['type="submit"', 'formaction=""', 'formmethod="POST"', 'name="$ACTION_REF_'], "Send a new code"),
    );
    // Back to sign in is a link to the page.
    expect(codeCard!.content).toMatch(element("a", ['class="hlink"', 'href=""'], "Back to sign in"));
  });

  test("titleAs sets the title's tag, and its code step's", async () => {
    const first = await render(
      <SignInForm action={signIn} forgotPasswordHref="/reset-password" twoFactor={{ action: verify }} titleAs="h2" />,
    );
    expect(titlesIn(first)).toEqual(["h2"]);
    const markup = await afterPost(
      <SignInForm action={signIn} forgotPasswordHref="/reset-password" twoFactor={{ action: verify }} titleAs="h2" />,
      "sign-in",
      { step: "code", sentTo: "sam@example.com" },
    );
    expect(titlesIn(markup)).toEqual(["h2", "h2"]);
    expect(titlesIn(await render(page))).toEqual(["h1"]);
  });

  test("backHref is where Back to sign in leads without JavaScript, such as a route that ends the pending sign-in", async () => {
    const markup = await afterPost(
      <SignInForm
        action={signIn}
        forgotPasswordHref="/reset-password"
        twoFactor={{ action: verify, backHref: "/sign-in/cancel" }}
      />,
      "sign-in",
      { step: "code", sentTo: "sam@example.com" },
    );
    expect(forms(markup)[1]!.content).toMatch(element("a", ['class="hlink"', 'href="/sign-in/cancel"'], "Back to sign in"));
  });

  test("without twoFactor, a code step isn't one", async () => {
    const markup = await afterPost(page, "sign-in", { step: "code" });
    expect(forms(markup)).toHaveLength(1);
    expect(forms(markup)[0]!.attributes).not.toMatch(/\bhidden=""/);
  });

  test("initialResult starts at the code step, as a page does that read the pending sign-in from its cookie; a post to the code's action then shows its message", async () => {
    const pending = (
      <SignInForm
        action={signIn}
        forgotPasswordHref="/reset-password"
        twoFactor={{ action: verify }}
        initialResult={{ step: "code" }}
      />
    );
    const first = await render(pending);
    expect(textOf(first)).toContain("Enter the 6-digit code from your authenticator app.");
    const markup = await afterPost(pending, "verify", { code: "That code isn't right." }, 1);
    expect(errorFor(markup, "code").error).toBe("That code isn't right.");
    expect(errorFor(markup, "code").input).toContain('aria-invalid="true"');
  });
});

describe("Verify Code, without JavaScript", () => {
  const page = (
    <VerifyCodeForm
      action={verify}
      resendAction={resend}
      sentTo="+1 (555) 010-4821"
      hiddenValues={{ email: "sam@example.com" }}
      back={{ label: "Back to sign in", href: "/sign-in" }}
    />
  );

  test("posts the code and its hidden values, and resends from a submit button", async () => {
    const [form] = forms(await render(page));
    expect(form!.attributes).toContain('method="POST"');
    expect(form!.content).toContain('<input type="hidden" name="email" value="sam@example.com"/>');
    expect(form!.content).toMatch(/name="code"/);
    expect(form!.content).toMatch(/maxlength="6"/i);
    expect(form!.content).toMatch(/>Send a new code<\/button>/);
  });

  test("after a message, it goes under the code", async () => {
    const markup = await afterPost(page, "verify", "That code has expired. Send a new one.");
    expect(errorFor(markup, "code").error).toBe("That code has expired. Send a new one.");
  });

  test("after a message for another field, it goes under the code too", async () => {
    const markup = await afterPost(page, "verify", { email: "Start again." });
    expect(errorFor(markup, "code").error).toBe("Start again.");
  });

  test("after messages with values, the code is never filled in", async () => {
    const markup = await afterPost(page, "verify", { code: "That code isn't right.", values: { code: "123456" } });
    expect(errorFor(markup, "code").error).toBe("That code isn't right.");
    expect(valueOf(markup, "code") ?? "").toBe("");
  });

  test("titleAs sets the title's tag", async () => {
    expect(titlesIn(await render(page))).toEqual(["h1"]);
    expect(titlesIn(await render(<VerifyCodeForm action={verify} titleAs="h3" />))).toEqual(["h3"]);
  });

  test("after a resend, it says a new code went", async () => {
    const markup = await afterPost(page, "resend", { sent: true }, 1);
    expect(textOf(markup)).toContain("We've sent a new code to +1 (555) 010-4821.");
  });

  test("after a resend that fails, its message goes under the code", async () => {
    const markup = await afterPost(page, "resend", "Wait a minute before asking again.", 1);
    expect(errorFor(markup, "code").error).toBe("Wait a minute before asking again.");
  });
});

describe("Sign-up Form, without JavaScript", () => {
  const plain = <SignUpForm action={signUp} signInHref="/sign-in" />;

  test("posts its named fields: the name, the email, and a new password", async () => {
    const [form] = forms(await render(plain));
    expect(form!.attributes).toContain('method="POST"');
    for (const name of ["name", "email", "password"]) expect(form!.content).toContain(`name="${name}"`);
    expect(form!.content).toMatch(/autocomplete="new-password"/i);
  });

  test("after a message, it goes under the email; one for a field it doesn't show, such as the terms, too", async () => {
    expect(errorFor(await afterPost(plain, "sign-up", "We couldn't create your account."), "email").error).toBe(
      "We couldn't create your account.",
    );
    expect(errorFor(await afterPost(plain, "sign-up", { terms: "Agree to the terms first." }), "email").error).toBe(
      "Agree to the terms first.",
    );
  });

  test("after messages with values, the name and the email are filled in again, and the password never is", async () => {
    const markup = await afterPost(plain, "sign-up", {
      form: "An account already uses that email.",
      values: { name: "Sam Lee", email: "sam@example.com", password: "Correct horse battery staple" },
    });
    expect(errorFor(markup, "email").error).toBe("An account already uses that email.");
    expect(valueOf(markup, "name")).toBe("Sam Lee");
    expect(valueOf(markup, "email")).toBe("sam@example.com");
    expect(valueOf(markup, "password")).toBeUndefined();
  });

  test("after messages with values, a checkbox they give \"on\" starts checked, and one they don't, unchecked", async () => {
    const boxes = (
      <SignUpForm action={signUp} signInHref="/sign-in" termsHref="/terms" termsAgreement="checkbox" askForMarketing />
    );
    const checked = (markup: string, name: string) =>
      /\schecked=""/.test(new RegExp(`<input\\b[^>]*name="${name}"[^>]*>`).exec(markup)?.[0] ?? "");
    const both = await afterPost(boxes, "sign-up", { password: "Choose another.", values: { terms: "on", marketing: "on" } });
    expect(checked(both, "terms")).toBe(true);
    expect(checked(both, "marketing")).toBe(true);
    const neither = await afterPost(boxes, "sign-up", { password: "Choose another.", values: { terms: "", email: "sam@example.com" } });
    expect(checked(neither, "terms")).toBe(false);
    expect(checked(neither, "marketing")).toBe(false);
    expect(checked(await render(boxes), "terms")).toBe(false);
  });

  test("its email is an email to fill in, and its password a new one", async () => {
    const [form] = forms(await render(plain));
    expect(form!.content).toMatch(/<input(?=[^>]*name="email")[^>]*autocomplete="email"/i);
    expect(form!.content).toMatch(/<input(?=[^>]*name="password")[^>]*autocomplete="new-password"/i);
  });

  test("after a message for the password, its strength steps aside", async () => {
    const markup = await afterPost(plain, "sign-up", { password: "This password has appeared in a data breach." });
    const { input, error } = errorFor(markup, "password");
    expect(error).toBe("This password has appeared in a data breach.");
    expect(markup).toMatch(/class="hpassword-strength"[^>]*hidden=""/);
    expect(input).not.toMatch(/aria-describedby="[^"]*strength/);
  });

  const byLink = (
    <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "link", resendAction: resend }} />
  );

  test("after the confirm step, by link, \"Check your email\" holds the address in a hidden input, for its resend", async () => {
    const markup = await afterPost(byLink, "sign-up", { step: "confirm", email: "sam@gmail.com" });
    const [signUpCard, confirmCard] = forms(markup);
    expect(signUpCard!.attributes).toMatch(/\bhidden=""/);
    expect(textOf(confirmCard!.content)).toContain("Check your email");
    expect(textOf(confirmCard!.content)).toContain("We've sent a link to sam@gmail.com.");
    expect(confirmCard!.attributes).toContain('method="POST"');
    expect(confirmCard!.content).toContain('<input type="hidden" name="email" value="sam@gmail.com"/>');
    expect(confirmCard!.content).not.toContain('name="password"');
    expect(confirmCard!.content).toContain('href="https://mail.google.com/"');
    expect(confirmCard!.content).toMatch(element("a", ['class="hlink"', 'data-underlined=""', 'href=""'], "use another email"));
  });

  test("after a resend, by link, it says the link went again; after one that fails, the form is back, with the message under the email", async () => {
    const pending = (
      <SignUpForm
        action={signUp}
        signInHref="/sign-in"
        confirmEmail={{ by: "link", resendAction: resend }}
        initialResult={{ step: "confirm", email: "sam@example.com" }}
      />
    );
    expect(textOf(await afterPost(pending, "resend", { sent: true }, 1))).toContain(
      "We've sent the link to sam@example.com again.",
    );
    const failed = await afterPost(pending, "resend", "We couldn't send the email.", 1);
    expect(forms(failed)).toHaveLength(1);
    expect(errorFor(failed, "email").error).toBe("We couldn't send the email.");
    // With the address it was confirming, as the form had it.
    expect(valueOf(failed, "email")).toBe("sam@example.com");
  });

  test("titleAs sets the title's tag, and its confirmation step's, by link or by code", async () => {
    const step = { step: "confirm", email: "sam@example.com" };
    const link = await afterPost(
      <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "link" }} titleAs="h2" />,
      "sign-up",
      step,
    );
    expect(titlesIn(link)).toEqual(["h2", "h2"]);
    const code = await afterPost(
      <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "code", action: verify }} titleAs="h3" />,
      "sign-up",
      step,
    );
    expect(titlesIn(code)).toEqual(["h3", "h3"]);
  });

  test("after the confirm step, by code, Verify Code posts the code with the address", async () => {
    const byCode = (
      <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "code", action: verify }} />
    );
    const markup = await afterPost(byCode, "sign-up", { step: "confirm", email: "sam@example.com" });
    const [, codeCard] = forms(markup);
    expect(textOf(codeCard!.content)).toContain("We sent a 6-digit code to sam@example.com.");
    expect(codeCard!.content).toContain('<input type="hidden" name="email" value="sam@example.com"/>');
    expect(codeCard!.content).toMatch(/name="code"/);
    expect(codeCard!.content).toMatch(element("a", ['class="hlink"', 'href=""'], "Use another email"));
  });

  test("backHref is where use another email leads without JavaScript, by link or by code", async () => {
    const step = { step: "confirm", email: "sam@example.com" };
    const link = await afterPost(
      <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "link", backHref: "/sign-up/cancel" }} />,
      "sign-up",
      step,
    );
    expect(forms(link)[1]!.content).toMatch(
      element("a", ['class="hlink"', 'data-underlined=""', 'href="/sign-up/cancel"'], "use another email"),
    );
    const code = await afterPost(
      <SignUpForm action={signUp} signInHref="/sign-in" confirmEmail={{ by: "code", action: verify, backHref: "/sign-up/cancel" }} />,
      "sign-up",
      step,
    );
    expect(forms(code)[1]!.content).toMatch(element("a", ['class="hlink"', 'href="/sign-up/cancel"'], "Use another email"));
  });
});

describe("Reset Password, without JavaScript", () => {
  const page = <ResetPasswordForm action={sendLink} signInHref="/sign-in" supportHref="/contact" />;

  test("after a message, it goes under the email", async () => {
    expect(errorFor(await afterPost(page, "send-link", "We couldn't send the email."), "email").error).toBe(
      "We couldn't send the email.",
    );
  });

  test("after messages with values, the email is filled in again", async () => {
    const markup = await afterPost(page, "send-link", {
      email: "We can't deliver email to gmial.com.",
      values: { email: "sam@gmial.com" },
    });
    expect(errorFor(markup, "email").error).toBe("We can't deliver email to gmial.com.");
    expect(valueOf(markup, "email")).toBe("sam@gmial.com");
  });

  test("titleAs sets the titles' tag, at each step", async () => {
    const at = (titleAs?: "h2") => <ResetPasswordForm action={sendLink} signInHref="/sign-in" supportHref="/contact" titleAs={titleAs} />;
    expect(titlesIn(await render(at()))).toEqual(["h1"]);
    expect(titlesIn(await afterPost(at("h2"), "send-link", { step: "sent", email: "sam@example.com" }))).toEqual(["h2"]);
    const saved = await afterPost(
      <NewPasswordForm action={savePassword} continueHref="/sign-in" titleAs="h2" />,
      "save-password",
      { step: "saved" },
    );
    expect(titlesIn(saved)).toEqual(["h2"]);
  });

  test("after the sent step, the address is in a hidden input, which resend, a submit button, posts to the same action", async () => {
    const markup = await afterPost(page, "send-link", { step: "sent", email: "sam@yahoo.com" });
    const [form] = forms(markup);
    expect(textOf(form!.content)).toContain("If an account uses sam@yahoo.com, we've sent a link there to reset your password.");
    expect(form!.content).toContain('<input type="hidden" name="email" value="sam@yahoo.com"/>');
    expect(form!.content).toMatch(element("button", ['type="submit"', 'class="hlink hauth-form-action"'], "resend"));
    expect(form!.content).not.toMatch(/<button[^>]*formaction[^>]*>resend/i);
    expect(form!.content).toMatch(element("a", ['class="hlink"', 'data-underlined=""', 'href=""'], "try another email"));
    expect(form!.content).toContain('href="https://mail.yahoo.com/"');
  });

  test("New Password: after a message by field, it goes under that field; after the saved step, it says so", async () => {
    const choose = <NewPasswordForm action={savePassword} continueHref="/sign-in" />;
    expect(errorFor(await afterPost(choose, "save-password", { confirmation: "Type it again." }), "confirmation").error).toBe(
      "Type it again.",
    );
    const saved = await afterPost(choose, "save-password", { step: "saved" });
    expect(textOf(saved)).toContain("Your password was updated");
    expect(saved).toContain('href="/sign-in"');
    expect(saved).not.toContain('name="password"');
  });

  test("New Password: after messages with values, neither password is filled in", async () => {
    const choose = <NewPasswordForm action={savePassword} continueHref="/sign-in" />;
    const markup = await afterPost(choose, "save-password", {
      password: "You've used this password before.",
      values: { password: "MyOldPassword1!", confirmation: "MyOldPassword1!" },
    });
    expect(errorFor(markup, "password").error).toBe("You've used this password before.");
    expect(valueOf(markup, "password")).toBeUndefined();
    expect(valueOf(markup, "confirmation")).toBeUndefined();
  });
});

describe("Account Forms, without JavaScript", () => {
  test("each form posts to its own action", async () => {
    const markup = await render(
      <AccountForms
        signInAction={signIn}
        signUpAction={signUp}
        resetAction={sendLink}
        signInHref="/sign-in"
        signUpHref="/sign-up"
        resetHref="/reset-password"
        termsHref="/terms"
        privacyHref="/privacy"
        supportHref="/contact"
      />,
    );
    const all = forms(markup);
    expect(all).toHaveLength(3);
    for (const form of all) expect(form.attributes).toContain('method="POST"');
    expect(titlesIn(markup)).toEqual(["h1", "h1", "h1"]);
  });

  test("titleAs goes to each form, as in a Dialog, whose own title is an <h2>", async () => {
    const markup = await render(
      <AccountForms
        signInAction={signIn}
        signUpAction={signUp}
        resetAction={sendLink}
        signInHref="/sign-in"
        signUpHref="/sign-up"
        resetHref="/reset-password"
        termsHref="/terms"
        privacyHref="/privacy"
        supportHref="/contact"
        titleAs="h3"
      />,
    );
    expect(titlesIn(markup)).toEqual(["h3", "h3", "h3"]);
  });
});

// What TypeScript says of a result: `values` holds only the fields a form
// fills in again, so a password, a confirmation, or a code can't go in it,
// and a form with none of those to keep has no `values`.
export const typed: unknown[] = [
  { form: "The email or password is incorrect.", values: { email: "sam@example.com" } } satisfies SignInFormResult,
  { email: "Check it.", values: { name: "Sam", email: "sam@example.com" } } satisfies SignUpFormConfirmResult,
  { form: "We couldn't send it.", values: { email: "sam@example.com" } } satisfies ResetPasswordFormResult,
  // @ts-expect-error A password isn't a value to fill in again.
  { form: "The email or password is incorrect.", values: { password: "hunter2" } } satisfies SignInFormTwoFactorResult,
  // @ts-expect-error Nor is a new one.
  { email: "Check it.", values: { password: "hunter2" } } satisfies SignUpFormConfirmResult,
  // @ts-expect-error The new password form fills nothing in again.
  { password: "Choose another.", values: {} } satisfies NewPasswordFormResult,
  // @ts-expect-error Nor does Verify Code.
  { code: "That code isn't right.", values: { code: "123456" } } satisfies VerifyCodeResult,
  // @ts-expect-error A step has no values.
  { step: "sent", email: "sam@example.com", values: { email: "sam@example.com" } } satisfies ResetPasswordFormResult,
];
