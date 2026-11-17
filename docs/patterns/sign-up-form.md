# Sign-up Form

A form that creates an account with a name, an email, and a password, ready
to copy into your app. It can add a step that confirms the email, by a link
or a code, other accounts to sign up with, such as Google, and checkboxes for
the terms and for marketing emails.

It's a raised [Card](../components/card.md) of
[Fields](../components/field.md): [Inputs](../components/input.md) for the
name and the email, a [Password Input](../components/password.md) that rates
the password, [Buttons](../components/button.md),
[Links](../components/link.md), and, if you like,
[Checkboxes](../components/checkbox.md), in React and in HTML.

## Try the demo

The playground's forms answer as a server would, after a moment. Type these to
see each answer:

| Example | Type | You see |
| --- | --- | --- |
| Any but the two Confirm ones | An email not listed here, with every field filled in and a password of 10 or more characters | The button works for a moment, then a toast says "Account created", where your own action would redirect |
| Any but the two Confirm ones | Email `sam@example.com` | "An account already uses that email." under the email |
| Any | Password `Password123!` | "Strong" as you type, then "This password has appeared in a data breach. Choose another." under the password, in its strength's place |
| Any | Email `error@example.com` | "Something went wrong. Try again." under the email, as when the server can't be reached |
| Any | A password under 10 characters | "Too weak" as you type, and "Choose a stronger password." once you sign up |
| With a terms checkbox | Leave the box unchecked | "Agree to the terms to create your account." under it |
| Confirm by link, Confirm by code | Any email, `sam@example.com` included | The step that confirms it. A real server emails an account's owner instead, so the form never says who has one |
| Confirm by link | An email at `gmail.com`, `outlook.com`, `hotmail.com`, `live.com`, or `yahoo.com` | "Check your email", with an "Open Gmail", "Open Outlook", or "Open Yahoo Mail" button |
| Confirm by link | Press "resend" | "We've sent the link to … again." |
| Confirm by link, Confirm by code | Press "use another email" | The form again, with what you typed |
| Confirm by code | Code `123456` | The form sends itself as the last digit arrives. The button works for a moment, then a toast says "Email confirmed", where your own action would redirect |
| Confirm by code | Another code, such as `111111` | "That code isn't right. Check it, or send a new one." under the code |
| Confirm by code | Code `000000` | "Something went wrong. Try again." under the code, as when the server can't be reached |
| Confirm by code | Wait 30 seconds, then press "Send a new code" | "We've sent a new code to …" |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| Accounts | A user store that keeps each account's email and a password hash, made with a slow hash such as Argon2id, scrypt, or bcrypt |
| Sessions | Somewhere to keep each session, named by a cookie |
| A rate limit | On sign-ups, per email address and per network address, and on resends if you confirm the email |
| A breached-password check | Such as Have I Been Pwned's range API |
| A mail queue | Only if you [confirm the email](#confirm-the-email): the action puts each email on it, and the queue's worker sends it |
| Pending sign-ups | Only if you confirm the email: where each sign-up waits until it's confirmed, with its link or code |
| Other accounts' sign-in | Only for [other accounts](#other-accounts): a route of yours for each, such as `/auth/google`, that starts its sign-in |

[Security](#security) says what each of these must do.

## React

### Install

```sh
npx harmo-ui add sign-up-form
```

It copies into `components/harmo/patterns/`:

- `sign-up-form/`, the form, `SignUpForm.tsx`, and `sign-up-form.css`;
- `auth-form/`, the look and helpers the account forms share, such as their
  inboxes;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card between steps;
- `verify-code/`, [Verify Code](verify-code.md), the step that confirms by
  code.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), and set them
up as [Patterns](README.md#install) says.

### Use it

Write a server action that creates the account and answers. In a Next.js app:

```ts
// app/sign-up/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SignUpFormMessages, SignUpFormResult } from "@/components/harmo/patterns/sign-up-form/SignUpForm";
import { createAccount, startSession } from "@/lib/auth";

export async function signUp(previous: SignUpFormResult, data: FormData): Promise<SignUpFormResult> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const marketing = String(data.get("marketing") ?? "");
  const created = await createAccount({
    name,
    email,
    password: String(data.get("password") ?? ""),
    marketing: marketing === "on",
  });
  const values: SignUpFormMessages["values"] = { name, email, marketing };
  if (created.error === "taken") return { form: "An account already uses that email.", values };
  if (created.error === "breached") {
    return { password: "This password has appeared in a data breach. Choose another.", values };
  }
  if (created.error) return { form: "We couldn't create your account. Try again in a moment.", values };
  (await cookies()).set("session", await startSession(created.user), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}
```

`createAccount` and `startSession` stand for your app's own. Then give the
action to the form:

```tsx
// app/sign-up/page.tsx
import { SignUpForm } from "@/components/harmo/patterns/sign-up-form/SignUpForm";
import { signUp } from "./actions";

export default function Page() {
  return <SignUpForm action={signUp} termsHref="/terms" privacyHref="/privacy" signInHref="/sign-in" />;
}
```

That's all it takes. The form checks the fields, shows the button working
while your action runs, and shows its [answer](#answers). Before you ship it,
go through [Security](#security). "An account already uses that email." tells
anyone who types an address whether it has an account; to keep that private,
[confirm the email](#confirm-the-email) instead.

#### Without a server

Give `action` a plain async function instead. It gets the same `FormData`,
and returns the same answers:

```tsx
<SignUpForm
  signInHref="/sign-in"
  termsHref="/terms"
  privacyHref="/privacy"
  action={async (previous, data) => {
    const response = await fetch("/api/sign-up", { method: "POST", body: data });
    if (!response.ok) return await response.json(); // your API's messages, such as { email: "…" }
    window.location.assign("/");
  }}
/>
```

### Confirm the email

With `confirmEmail`, a step takes the form's place once someone signs up:
"Check your email", with a link to open or a code to type. The account is
made only once the link is opened, or the code is right, so none exists in an
address's name before its owner says so. "Use another email" brings the form
back, with what was typed.

Your action answers `{ step: "confirm", email }` for every address, one that
already has an account too, the same way and in the same time, as
[Security](#security) says:

```ts
// app/sign-up/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SignUpFormConfirmResult, SignUpFormMessages } from "@/components/harmo/patterns/sign-up-form/SignUpForm";
import type { ResendResult } from "@/components/harmo/patterns/verify-code/VerifyCodeForm";
import { clientAddress, hashPassword, isBreached, queueConfirmationAgain, startPendingSignUp } from "@/lib/auth";

export async function signUp(previous: SignUpFormConfirmResult, data: FormData): Promise<SignUpFormConfirmResult> {
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const values: SignUpFormMessages["values"] = { name, email };
  if (password.length < 10) return { password: "Choose a stronger password.", values };
  if (await isBreached(password)) {
    return { password: "This password has appeared in a data breach. Choose another.", values };
  }
  const pending = await startPendingSignUp({ name, email, hash: await hashPassword(password) });
  (await cookies()).set("pending_sign_up", pending, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  return { step: "confirm", email };
}

export async function resendConfirmation(previous: ResendResult): Promise<ResendResult> {
  const pending = (await cookies()).get("pending_sign_up")?.value;
  if (!pending) redirect("/sign-up");
  if (!(await queueConfirmationAgain(pending, await clientAddress()))) {
    return "You've asked for a few links already. Try again in an hour.";
  }
  return { sent: true };
}
```

```tsx
// app/sign-up/page.tsx
import { SignUpForm } from "@/components/harmo/patterns/sign-up-form/SignUpForm";
import { pendingStep } from "@/lib/auth";
import { resendConfirmation, signUp } from "./actions";

export default async function Page() {
  return (
    <SignUpForm
      action={signUp}
      signInHref="/sign-in"
      termsHref="/terms"
      privacyHref="/privacy"
      confirmEmail={{ by: "link", resendAction: resendConfirmation, backHref: "/sign-up/cancel" }}
      initialResult={await pendingStep()}
    />
  );
}
```

`ResendResult` is Verify Code's. The rest stand for your app's own:

- **`isBreached` and `hashPassword`** check the password against breached
  passwords, and hash it with a slow hash.
- **`startPendingSignUp`** keeps the sign-up on your server, named by the
  opaque id it returns, and puts its email on your mail queue. The queue's
  worker sends the link or the code, or, for an address that already has an
  account, a note to its owner: "Someone tried to sign up with your email.
  Sign in, or reset your password, if it was you."
- **`queueConfirmationAgain`** reads the address from the pending sign-up,
  never from the form, counts the resend, and puts the same email on the
  queue again, or says no once there have been a few.
- **`clientAddress`** is the network address the request came from, as your
  host or proxy reports it.
- **`pendingStep`** reads the pending sign-up from its cookie, and answers
  `{ step: "confirm", email }` for one, or nothing, so the page shows the step
  again after a post from it.

`backHref` leads to a route that ends the pending sign-up, for "use another
email" without JavaScript:

```ts
// app/sign-up/cancel/route.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endPendingSignUp } from "@/lib/auth";

export async function GET() {
  await endPendingSignUp();
  (await cookies()).delete("pending_sign_up");
  redirect("/sign-up");
}
```

A new `signUp` replaces any pending sign-up.

#### By link

The step reads "Check your email", then "We've sent a link to
sam@example.com. Open it to confirm your email address.", then "If you didn't
receive an email, check your spam, resend, or use another email."

- **An inbox button**: for an address at Gmail, Outlook (`outlook.com`,
  `hotmail.com`, or `live.com`), or Yahoo, a button opens that inbox in a new
  tab: "Open Gmail", "Open Outlook", or "Open Yahoo Mail".
- **resend** calls `resendAction`. Once it answers `{ sent: true }`, the step
  says "We've sent the link to sam@example.com again." A message brings the
  form back, with the message under the email.
- **Without `resendAction`**, there's no resend: "If you didn't receive an
  email, check your spam, or use another email."

#### By code

```tsx
confirmEmail={{ by: "code", action: confirmCode, resendAction: resendConfirmation, backHref: "/sign-up/cancel" }}
```

The step is [Verify Code](verify-code.md), titled "Check your email": "We
sent a 6-digit code to sam@example.com.", the code, Verify, and "Send a new
code" after a 30-second wait. `length`, `characters`, and `groups` are the
code's, as in Verify Code: 6 digits by default. `action` checks the code;
once it's right, it makes the account, starts the session, and redirects:

```ts
export async function confirmCode(previous: VerifyCodeResult, data: FormData): Promise<VerifyCodeResult> {
  const jar = await cookies();
  const pending = jar.get("pending_sign_up")?.value;
  if (!pending) redirect("/sign-up");
  const user = await confirmSignUp(pending, String(data.get("code") ?? ""));
  if (!user) return { code: "That code isn't right. Check it, or send a new one." };
  jar.delete("pending_sign_up");
  jar.set("session", await startSession(user), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  redirect("/");
}
```

`confirmSignUp`, which makes the account, stands for your app's own, and
`VerifyCodeResult` is Verify Code's, as [its Answers](verify-code.md#answers)
list.

### Other accounts

Pass `providers`, and other accounts to sign up with follow the button:

```tsx
<SignUpForm
  action={signUp}
  signInHref="/sign-in"
  termsHref="/terms"
  privacyHref="/privacy"
  providers={[
    { name: "Google", icon: <GoogleIcon className="hicon" />, href: "/auth/google" },
    { name: "GitHub", icon: <GitHubIcon className="hicon" />, href: "/auth/github" },
  ]}
/>
```

- **Each is a link** to your server's route that starts signing in with that
  account, such as `/auth/google`, as [Security](#security) says.
- **Give the [Sign-in Form](sign-in-form.md) the same accounts**, leading to
  the same routes, so one someone signs up with is there to sign in with.
- **The terms**: the line under the button covers signing up this way too.
  With the terms' checkbox, ask for the terms on your app's next page, if it
  needs them, since the form can't ask first.
- **Bring each logo yourself**, as the account's own sign-in guidelines show
  it: [Google's](https://developers.google.com/identity/branding-guidelines)
  four-color G,
  [Apple's](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
  and [GitHub's](https://github.com/logos) marks in one color, as
  `currentColor`, and
  [Microsoft's](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps)
  four squares.

### Terms and marketing emails

| You pass | The form shows |
| --- | --- |
| `termsHref` and `privacyHref` | A line under the button: "By creating an account, you agree to our Terms of Service and Privacy Policy." |
| Only `termsHref` | The same line, naming only the terms |
| Neither | No line, for an app that has no terms, or asks for them another way |
| `termsAgreement="checkbox"`, with `termsHref` | A checkbox in the line's place, the last field: "I agree to the Terms of Service and Privacy Policy". Signing up needs it checked, or it says "Agree to the terms to create your account." Checked, it posts `terms` as `"on"` |
| `askForMarketing` | A checkbox after the password: "Email me product news and tips". It starts unchecked, since a box checked for someone isn't their consent, and signing up doesn't need it. Checked, it posts `marketing` as `"on"` |

The line is the common way: it's said before someone signs up, and asks
nothing more of them, no control to reach and no error to recover from. Use
the checkbox where a law or your legal team asks for one, and check it on
your server too. Give `terms` or `marketing` back in `values` as `"on"`, and
without JavaScript, its box starts checked.

### Props

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState): a server action, or an async function of yours. It gets `(previous, data)`, `data` holding `name`, unless `askForName` is `false`, `email`, `password`, and `marketing` and `terms` when they're checked, and returns one of the [answers](#answers) |
| `signInHref` | Required. Where "Sign in" leads |
| `termsHref` | Where "Terms of Service" leads. Without it, there's no line or checkbox for the terms |
| `privacyHref` | Where "Privacy Policy" leads, named with the terms. Without it, the line or checkbox names only the terms |
| `termsAgreement` | How someone agrees to the [terms](#terms-and-marketing-emails): `"line"`, the default, or `"checkbox"` |
| `askForName` | `true`, the default, asks for a name first. `false` leaves it out, and the form posts no `name` |
| `askForMarketing` | `true` adds an unchecked checkbox for marketing emails. `false` by default |
| `providers` | [Other accounts](#other-accounts) to sign up with, each `{ name, icon, href }`: its name, such as `"Google"`; its logo, an element with the class `hicon`; and your route that starts signing in with it |
| `confirmEmail` | A [step that confirms the email](#confirm-the-email): `{ by: "link", resendAction?, backHref? }`, or `{ by: "code", action, resendAction?, length?, characters?, groups?, backHref? }` |
| `initialResult` | The answer to show before the action has given one, such as `{ step: "confirm", email }` for a sign-up waiting for its confirmation |
| `titleAs` | The tag of the title and the confirmation step's: `"h1"` by default, or `"h2"` to `"h6"` |

### Answers

Your action returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"An account already uses that email."` | Shows it under the email, moves focus there, and shakes the card |
| Messages by field, such as `{ password: "This password has appeared in a data breach. Choose another." }` | Shows each under its field, moves focus to the first, and shakes the card. `form` goes under the email, as does a message for a field the form doesn't show, such as `terms` without the checkbox |
| The same with `values`, such as `{ form: "An account already uses that email.", values: { name, email } }` | As above, and without JavaScript, fills in the name, the email, and the boxes given as `"on"` again. Never the password |
| `{ step: "confirm", email }` | Only with `confirmEmail`. Shows the step that confirms the email |

If the action throws, or its promise rejects, the form shows "Something went
wrong. Try again." under the email. Next.js's `redirect()` and `notFound()`
work as usual.

```ts
type SignUpFormMessages = {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
  marketing?: string;
  form?: string;
  values?: { name?: string; email?: string; terms?: string; marketing?: string };
};
type SignUpFormResult = undefined | string | SignUpFormMessages;
// With confirmEmail:
type SignUpFormConfirmResult = SignUpFormResult | { step: "confirm"; email: string };
```

TypeScript checks your answers against these types: a message only for a
field the form has, and `values` only for fields it fills in. With
JavaScript, the form calls your action itself, in a transition, rather than
as React's form action, so what was typed stays after a message.
[Patterns](README.md#actions) explains answers in more depth.

### Without JavaScript

Given a server action, the form works before its script runs, or without one:

- It posts its fields to your action, in the request's body, as React renders
  a form for one.
- Your framework runs the action, and renders the page again with its answer:
  a message under its field, or the confirmation step.
- The page is new, so its fields start empty. Answer with `values`, and the
  name, the email, and the boxes start with what was typed. The password
  never does.
- The form's own checks, the password's strength, the shake, and the motion
  don't run. Your action's checks are the ones that count.
- By link, "resend" is a submit button that posts the address, from a hidden
  input, to `resendAction`. By code, Verify Code posts the code and the
  address to its action. On the page after either post, the form starts where
  `initialResult` says, so read the pending sign-up from your cookie with
  `pendingStep`.
- "use another email" is a link to `confirmEmail.backHref`, the page itself
  by default. Point it at a route that ends the pending sign-up, or it shows
  the step again.

Given a function of yours instead, the form needs JavaScript. A submit made
before the script has loaded is held, then sent once it has.

## HTML

### Markup

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <h1 class="hauth-form-title">Create your account</h1>
  <div class="hauth-form-fields">
    <div class="hfield">
      <label class="hlabel" for="sign-up-name">Name</label>
      <input class="hinput" id="sign-up-name" name="name" autocomplete="name"
        aria-describedby="sign-up-name-error" />
      <p class="herror" id="sign-up-name-error" aria-live="polite"></p>
    </div>
    <div class="hfield">
      <label class="hlabel" for="sign-up-email">Email</label>
      <input class="hinput" id="sign-up-email" name="email" type="email"
        autocomplete="email" aria-describedby="sign-up-email-error" />
      <p class="herror" id="sign-up-email-error" aria-live="polite"></p>
    </div>
    <div class="hfield">
      <div class="hfield-label-row">
        <label class="hlabel" for="sign-up-password">Password</label>
        <span class="hpassword-strength" id="sign-up-password-strength" aria-live="polite"></span>
      </div>
      <div class="hpassword">
        <input class="hinput" id="sign-up-password" name="password" type="password"
          autocomplete="new-password"
          aria-describedby="sign-up-password-error sign-up-password-strength sign-up-password-hint" />
        …
      </div>
      <div class="hpassword-details" hidden>…</div>
      <p class="herror" id="sign-up-password-error" aria-live="polite"></p>
    </div>
  </div>
  <button class="hbutton" type="submit" aria-describedby="sign-up-agreement">
    <span class="hbutton-label">Create account</span>
  </button>
  <p class="hsign-up-form-agreement" id="sign-up-agreement">
    By creating an account, you agree to our <a class="hlink" href="/terms">Terms of Service</a>
    and <a class="hlink" href="/privacy">Privacy Policy</a>.
  </p>
  <p class="hauth-form-footer">
    Already have an account? <a class="hlink" data-underlined href="/sign-in">Sign in</a>
  </p>
</form>
```

Give the `<form>` an `action`, your server's endpoint for signing up, and it
creates the account even without a script. The first `…` is
[Password Input](../components/password.md)'s toggle, with its Tooltip, and
the second its meter and hint. The terms' line is the button's description;
without terms, leave out both. Load Harmo's CSS, then `auth-form.css`, then
`sign-up-form.css`, and to confirm by code, `verify-code.css`.

For the terms' checkbox, leave out the line and the button's
`aria-describedby`, and put the checkbox last in `.hauth-form-fields`, as a
small horizontal Field. A horizontal Field holds no error, so the terms'
error follows it, as [File Input](../components/file-input.md)'s does, and
`.hsign-up-form-terms` holds the two:

```html
<div class="hsign-up-form-terms">
  <div class="hfield hsign-up-form-consent" data-orientation="horizontal" data-size="small">
    <input class="hcheckbox" type="checkbox" id="sign-up-terms" name="terms"
      aria-describedby="sign-up-terms-error" />
    <label class="hlabel" for="sign-up-terms">
      I agree to the <a class="hlink" href="/terms">Terms of Service</a>
      and <a class="hlink" href="/privacy">Privacy Policy</a>
    </label>
  </div>
  <p class="herror" id="sign-up-terms-error" aria-live="polite"></p>
</div>
```

For marketing emails, a small horizontal Field after the password, before the
terms' checkbox if there is one, with no error:

```html
<div class="hfield hsign-up-form-consent" data-orientation="horizontal" data-size="small">
  <input class="hcheckbox" type="checkbox" id="sign-up-marketing" name="marketing" />
  <label class="hlabel" for="sign-up-marketing">Email me product news and tips</label>
</div>
```

Other accounts go before the band, under "or": after the terms' line, or
after the button without one:

```html
<p class="hauth-form-divider">or</p>
<div class="hauth-form-providers">
  <a class="hbutton" data-variant="secondary" href="/auth/google">
    <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
    <span class="hbutton-label">Continue with Google</span>
  </a>
  <a class="hbutton" data-variant="secondary" href="/auth/github">
    <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
    <span class="hbutton-label">Continue with GitHub</span>
  </a>
</div>
```

With four or more, each shows only the account's name, and `aria-label` says
the rest:

```html
<a class="hbutton" data-variant="secondary" href="/auth/google" aria-label="Continue with Google">
  <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  <span class="hbutton-label">Google</span>
</a>
```

To confirm the email by link, your script hides the form once the action
answers, and adds "Check your email" after it, with the address in a hidden
input for its resend:

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <div class="hauth-form-header">
    <h1 class="hauth-form-title" tabindex="-1">Check your email</h1>
    <div class="hauth-form-message">
      <p class="hauth-form-description">
        We've sent a link to <strong class="hauth-form-email">sam@gmail.com</strong>.
        Open it to confirm your email address.
      </p>
      <p class="hauth-form-description">
        If you didn't receive an email, check your spam,
        <button class="hlink hauth-form-action" type="submit" data-underlined>resend</button>, or
        <a class="hlink" data-underlined href="">use another email</a>.
      </p>
    </div>
  </div>
  <input type="hidden" name="email" value="sam@gmail.com" />
  <a class="hbutton" href="https://mail.google.com/" target="_blank" rel="noopener noreferrer">
    <span class="hbutton-label">Open Gmail</span>
  </a>
  <p class="hauth-form-footer">
    Already have an account? <a class="hlink" data-underlined href="/sign-in">Sign in</a>
  </p>
</form>
```

Give that `<form>` an `action`, your server's endpoint for sending the link
again. For an address without an inbox button, leave the button out. To
confirm by code, [Verify Code's markup](verify-code.md#markup) follows the
form instead, titled "Check your email", with
`<input type="hidden" name="email">` after its header, and "Use another
email" in its band.

### Classes

| Class or attribute | What it's for |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The form, or a step's card, its parts spaced out, and its `.hbutton` as wide as it |
| `.hauth-form-title` | The title. It shows no focus ring when it takes focus |
| `.hauth-form-fields` | The fields |
| `.hsign-up-form-agreement` | The terms' line, fine print under the button |
| `.hsign-up-form-consent` on a small horizontal `.hfield` | A consent checkbox's Field, its label quieter and its links semibold |
| `.hsign-up-form-terms` | The terms' checkbox Field and its `.herror`, which starts where the label does. An empty error takes no room |
| `.hauth-form-divider` | "or", between two lines |
| `.hauth-form-providers` | The other accounts' Buttons. With four or more not `hidden`, two to a row |
| `.hauth-form-footer` | The band along the card's bottom |
| `.hauth-form-header` | A step's title with what's under it |
| `.hauth-form-message` | A step's paragraphs |
| `.hauth-form-description` | A paragraph under the title |
| `.hauth-form-email` | An address the form sent something to. A long one breaks |
| `.hauth-form-action` on a `.hlink` `<button>` | An action in a sentence, such as "resend", looking like a Link. With `aria-disabled="true"`, it's dimmed |
| `data-shake` on the form | Shakes it once, unless reduced motion is asked for. Remove it at the form's own `animationend`, so the next failure shakes it again |

### What your script does

[sign-up-form.js](../../examples/html/src/scripts/sign-up-form.js) is an
example. The password uses
[Password Input's script](../components/password.md#what-a-script-does),
`password.js`, and the code step Verify Code's, `verify-code.js`. The card's
change of size between steps is `change-step.js`'s, which the forms' scripts
share.

**As the password is typed:** rate it, with its toggle, as Password Input's
script does. That sets `aria-invalid="true"` on it while it's too weak, and
steps its strength's word and meter aside while the field shows an error.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script, so
   the page's own errors show rather than the browser's bubbles.
2. Check each field. Put an error in the `.herror` of each one that fails,
   and clear the others:
   - an empty name: "Enter your name.";
   - an empty email: "Enter your email address."; one that isn't an address:
     "Enter an email address, such as name@example.com.";
   - an empty password: "Enter a password."; one that's too weak: "Choose a
     stronger password.";
   - with the terms' checkbox, one that isn't checked: "Agree to the terms to
     create your account."

   If there's any, show the errors, as in step 6, and stop.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another sign-up meanwhile.
4. Sign up with the form's data: the name, the email, the password, and the
   boxes that are checked.
5. Show the answer:
   - nothing: leave the form as it is, as your server has redirected;
   - a message: put it in the email's `.herror`;
   - messages by field, such as `{ password: "…" }`: put each in its field's
     `.herror`, and one for a field the form doesn't have in the email's;
   - a thrown error: "Something went wrong. Try again." in the email's
     `.herror`;
   - `{ step: "confirm", email }`: show the step, below.
6. For each error, put `aria-invalid="true"` on its input. Move focus to the
   first field with one, in the form's order, and add `data-shake` to the
   form.

**To confirm the email:**

- Add the step's card after the form, its title with the tag of the form's
  own, and the address in it as text, never as markup. Set `hidden` on the
  form. By code, Verify Code's own script sets the card up.
- Move focus to the card's title with `focus({ preventScroll: true })`, then
  `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
  asked for.
- **"use another email"**: on a plain click, with the main button and no
  modifier key, call `preventDefault()`. Remove the card, take `hidden` off
  the form, give its title `tabindex="-1"`, and move focus to it. Any other
  click, such as one for a new tab, follows the link.
- **resend**, by link: call `preventDefault()`, and send the link again with
  the card's data, with `aria-busy="true"` and `aria-disabled="true"` on the
  button meanwhile. Ignore another click. Once it has gone, say "We've sent
  the link to … again.", and move focus to the title. If it fails, bring the
  form back, as for "use another email", with the message under the email.
- Animate each change as
  [Moving between steps](README.md#moving-between-steps) says.

**As people type:** on `input` in a field, or checking the box, take its
error away, and its `aria-invalid`, except on a password that's still too
weak. Remove `data-shake` at the form's own `animationend`, not one that
bubbles up from inside it.

## Security

The form checks fields for the person typing. It's not a defense: anyone can
send your action anything. Your server must:

- **Not tell who has an account, if you confirm the email.** "An account
  already uses that email." tells anyone who types an address whether it has
  one. With `confirmEmail`, answer every address the same way, in the same
  time, as the [Sign-in Form](sign-in-form.md#security) and
  [Reset Password](reset-password.md#security) do: check the password before
  anything depends on whether the address has an account, hash it every time,
  put the email on a queue rather than waiting for it, show the step for every
  address, and email the owner of one that has an account instead.
- **Check the password again**: its length, and against breached passwords,
  such as with Have I Been Pwned's range API. The form's strength check only
  helps someone choose. Hash it with a slow hash, such as Argon2id, scrypt, or
  bcrypt.
- **Check that the terms' box was checked**, if you ask for it, as the form's
  check can be skipped.
- **Limit sign-ups**, per email address and per network address.
- **Make a confirmation link or code random**, expire, and work once, and
  allow a few tries per code, as [Verify Code](verify-code.md#security) says.
- **Limit resends the same way for every address.** Count each one, by the
  pending sign-up and by network address, whether or not the address has an
  account, and answer `{ sent: true }` unless the limit is reached. Report a
  send that fails only when it would fail for any address, such as your queue
  being down; log one that depends on the account, such as its mail bouncing,
  and still answer that it went.
- **Find the pending sign-up from its cookie** in the actions after the
  first. The resend and the code post the address from a hidden input, which
  anyone can change: ignore it, or turn the post down when it doesn't match.
- **Build the link in the email from your site's origin**, set in your
  config, never from the request's `Host` or `X-Forwarded-Host`, as
  [Reset Password](reset-password.md#security) says why.
- **Send the note about an existing account to the address that account
  holds**, never to the one typed, which may only look like it.
- **Leave the name out of an email to an address that isn't confirmed.**
  Anyone can type someone else's address, and a name such as "Claim your prize
  at evil.example" would reach them in your email, from you. If you put it
  in, cap its length, and take out anything that looks like a link.
- **Don't let anyone make an account in someone else's name** before they
  arrive, and keep a way into it. Link a sign-in with another account, such
  as Google, to an account here by its email only when that account's
  address is confirmed, and the other account says its email is verified. If
  your app makes an account before its address is confirmed, whoever typed
  the address chose its password: once the address's owner proves it another
  way, such as by resetting the password, throw that password away, and end
  the account's sessions.
- **Set the session in an httpOnly, Secure, SameSite cookie**, with a new id
  at sign-up, and keep a pending sign-up named by such a cookie.
- **Start each other account's sign-in on your server**, with a `state`
  check, as the [Sign-in Form's](sign-in-form.md#security) does.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#never-trust-previous) explains.
- **Give back in `values` only the name, the email, and the boxes**, naming
  each. TypeScript turns down a password in `values` written out in the
  answer, or given its type, as in the examples, but not in an object built
  elsewhere, such as `Object.fromEntries(data)`, which holds every field the
  form posts. Never pass that.
- **Check the post comes from your site**, against cross-site request
  forgery, as Next.js does for server actions; elsewhere, check the `Origin`
  header, or use a CSRF token.

The form itself:

- **Posts what was typed in the request's body**, never in the page's
  address, so a form sent before its script runs keeps it out of the
  browser's history and the server's logs. It never logs or stores it, and
  never fills in a password from `values`.
- **Holds only the address in the confirmation step**, in a hidden input that
  its resend posts, never the password. The form it hides keeps the password
  only in its own field, in this page, until "use another email" brings it
  back.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **The strength rule**: it's `strength` in `SignUpForm.tsx`. Its lowest
  level, `level: 1`, is the one that stops a sign-up. Change the rule and its
  words there, and in HTML, in your script. Your server decides what it
  accepts.
- **No name**: pass `askForName={false}`, for an app that asks for it once
  someone has signed up. In HTML, leave out the name's Field.
- **A first and a last name**: put two Fields where the name's is, with
  `autocomplete="given-name"` and `"family-name"`, named as your action reads
  them.
- **A line under the title**, such as what the account includes: put the
  title and a `<p class="hauth-form-description">` in a
  `<div class="hauth-form-header">`.
- **The consent labels' color**: they're secondary text by this pattern's
  choice. For a label's usual color, take the color out of
  `sign-up-form.css`.
- **Headings**: titles are `<h1>`. On a page with its own `<h1>`, pass
  `titleAs="h2"`, which the confirmation step's title follows. In HTML, make
  the titles `<h2>`s.
- **Typing at once**: on a page that's only for signing up, add `autoFocus`
  to the first Input, or `autofocus` in HTML.
- **In a Dialog**: in a Dialog's body, the form drops its own card's frame
  and padding, its title steps down to 16px semibold, under the Dialog's, and
  its band spans the form. [Account Forms](account-forms.md) shows it there.

## Accessibility

- Each field is named by its label, and its error is read with it, through
  `aria-describedby`. So are the password's strength word and hint.
- Errors are polite live regions, in the page from the start, empty, so a
  screen reader reads each one as it appears, after the field that takes
  focus. Without JavaScript, the server's messages are in the page as it
  loads, each read with its field.
- A password that's too weak is marked `aria-invalid="true"` as it's typed,
  as its strength says. Its error comes only once someone signs up.
- The terms' line is the button's description, through `aria-describedby`,
  so a screen reader reads it with the button, before someone signs up,
  though the line comes after it.
- The links in the line and in the checkbox's label are semibold rather than
  underlined. Link's purple is 2.03:1 against body text, so color alone
  doesn't tell a link from the words around it, as WCAG 1.4.1 asks (see
  [Link](../components/link.md#accessibility)). An underline would, but it's
  heavy in fine print, so the weight does it: semibold rather than medium,
  since a font without a medium face, such as Windows' Segoe UI, draws medium
  as regular.
- The terms' checkbox is named by its whole label, the links' words included.
  A click on a link opens it rather than checking the box, and Tab reaches
  each link after the checkbox. A checkbox has no invalid look of its own, so
  its error says what's wrong.
- "or" is text a screen reader reads, so the links after it read as another
  way to sign up. Their logos are hidden from it, with `aria-hidden`. Two to a
  row, each link is named "Continue with" its account by `aria-label`, which
  holds the word it shows, so speech input that says "Google" finds it.
- `autocomplete="name"`, `"email"`, and `"new-password"` let the browser fill
  in the name and the email, and a password manager offer a new password and
  save it.
- As the confirmation step shows, its title takes focus: a heading with
  `tabindex="-1"`, which a screen reader reads as it takes focus. It shows no
  focus ring, since it isn't a control. "use another email" moves focus back
  to the form's title.
- The shake only repeats what the errors say, so reduced motion loses
  nothing.

## Design details

**The form:**

- A raised Card, as the [Sign-in Form](sign-in-form.md) is: at most 400px
  wide, with 42px (`--harmo-space-lg`) padding, the title, the fields, and a
  button as wide as the form 26px (`--harmo-space-md`) apart. Fields are 16px
  (`--harmo-space-sm`) apart.
- The title is 20px bold, its line trimmed to the top of its capitals with
  `text-box`.
- "Already have an account? Sign in" sits in a band along the card's bottom
  edge: tinted `--harmo-color-background-secondary`, inset 6px
  (`--harmo-space-2xs`) from the card's sides and bottom, so the card frames
  it, with 4px corners. Its line is 14px, centered, in
  `--harmo-color-text-secondary`, with 16px above and below it, and its link
  is underlined. What's above it ends 42px over it, as the title starts 42px
  under the card's top edge.
- The name is one field, since not every name has a first and a last part.
- The email, which is the account's name, has `autocomplete="email"`, as
  web.dev's
  [sign-up form best practices](https://web.dev/articles/sign-up-form-best-practices#help-password-managers)
  ask of a sign-up form, and as the HTML standard
  [names an email address](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-email).
  The Sign-in Form's has `"username"`, as web.dev's
  [sign-in form best practices](https://web.dev/articles/sign-in-form-best-practices#autofill)
  ask, so a password manager fills the account it saved.
- The password has Password Input's strength as it's typed: a word beside its
  label, a meter, and a hint under it. Under 10 characters is "Too weak".
  Upper case, lower case, digits, and symbols together are "Strong". Anything
  between is "Medium".
- While the password shows a message, its strength's word and meter step
  aside, as [Password Input's](../components/password.md#appearance-and-states)
  do, so "Strong" in green never sits beside "This password has appeared in
  a data breach."
- Signing up checks the fields first, with the messages
  [What your script does](#what-your-script-does) lists. Typing in a field,
  or checking the box, takes its error away.
- While your action runs, the button shows it's working, as a loading
  [Button](../components/button.md) does.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`). Under reduced motion it stays still.

**The terms and marketing emails:**

- The terms' line is fine print under the button: 13px
  (`--harmo-font-size-xs`), centered, in `--harmo-color-text-secondary`, its
  lines balanced. It sits 10px (`--harmo-space-xs`) under the button rather
  than the form's 26px, so it reads as the button's. Its two links are
  semibold (`--harmo-font-weight-semibold`).
- The terms' checkbox is the last field, its links as the line's. Its error
  goes 6px under it, where its label starts, as a description would.
- Both checkboxes are small horizontal Fields, as fine print: a 16px box
  beside a 13px label, still on its first line. Their labels are
  `--harmo-color-text-secondary`, quieter than a label's usual color, a
  choice of this pattern's rather than of the small size's.

**Other accounts:** they follow the button and the terms' line, as the
Sign-in Form's follow its button: "or", 13px in `--harmo-color-text-tertiary`
between two 1px `--harmo-color-border` lines, then a secondary Button for
each, a link with the account's logo, drawn at 20px, before its name. Up to
three read "Continue with Google", each as wide as the form, 10px
(`--harmo-space-xs`) apart. Four or more go two to a row, each showing only
the account's name. Then the band.

**The confirmation step:**

- It takes the form's place. The card grows or shrinks to the step, easing
  out (`--harmo-ease-out-cubic`): 200ms (`--harmo-duration-normal`) for a
  small change, plus half a millisecond per pixel, up to 350ms. The form goes
  at once, and the step fades in over 200ms, laid out where it will end. "use
  another email" changes back the same way. Under reduced motion, the card
  takes its new size at once, and only the fade plays.
- By link, the title, then two paragraphs, 14px in
  `--harmo-color-text-secondary`, 16px apart and 6px under the title, as
  Reset Password's sent step reads. The address is in medium weight, in
  `--harmo-color-text`. Then the inbox button, if there's one, and the band to
  sign in.
- By code, Verify Code's card, titled "Check your email", with "Use another
  email" in its band.
