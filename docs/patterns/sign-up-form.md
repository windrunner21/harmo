# Sign-up Form

A form that creates an account with a name, an email, and a password, ready
to copy into your app. You can add a step that confirms the email, by a link
or a code, other accounts to sign up with, such as Google, and checkboxes for
the terms and for marketing emails.

It's a raised [Card](../components/card.md) of
[Fields](../components/field.md): [Inputs](../components/input.md) for the
name and the email, a [Password Input](../components/password.md) that rates
the password, [Buttons](../components/button.md),
[Links](../components/link.md), and, if you like,
[Checkboxes](../components/checkbox.md). It comes in React and in HTML.

## Try the demo

The playground's forms answer as a server would, after a moment. Type these to
see each answer:

| Example | Type | You see |
| --- | --- | --- |
| Any but the two Confirm ones | An email not listed here, with every field filled in and a password of 10 or more characters | The button works for a moment, then nothing changes, as when your action redirects |
| Any but the two Confirm ones | Email `sam@example.com` | "An account already uses that email." under the email |
| Any | Password `Password123!` | "Strong" as you type, then "This password has appeared in a data breach. Choose another." under the password, in its strength's place |
| Any | Email `error@example.com` | "Something went wrong. Try again." under the email, as when the server can't be reached |
| Any | A password under 10 characters | "Too weak" as you type, and "Choose a stronger password." once you sign up |
| With a terms checkbox | Leave the box unchecked | "Agree to the terms to create your account." under it |
| Confirm by link, Confirm by code | Any email, `sam@example.com` included | The step that confirms it. A real server emails an account's owner instead, so the form never says who has one |
| Confirm by link | An email at `gmail.com`, `outlook.com`, `hotmail.com`, `live.com`, or `yahoo.com` | "Check your email", with an "Open Gmail", "Open Outlook", or "Open Yahoo Mail" button |
| Confirm by link | Press "resend" | "We've sent the link to … again." |
| Confirm by link, Confirm by code | Press "use another email" | The form again, with what you typed |
| Confirm by code | Code `123456` | The form sends itself as the last digit arrives. The button works for a moment, then nothing changes, as when your action redirects |
| Confirm by code | Another code, such as `111111` | "That code isn't right. Check it, or send a new one." under the code |
| Confirm by code | Code `000000` | "Something went wrong. Try again." under the code, as when the server can't be reached |
| Confirm by code | Wait 30 seconds, then press "Send a new code" | "We've sent a new code to …" |

[Confirm the email](#confirm-the-email) explains both steps.

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. The CLI copies the Harmo components the pattern uses |
| HTML | Harmo's CSS, and your own script; [HTML](#html) says what it does |
| Without JavaScript | A framework that runs React server actions, such as Next.js with its App Router |
| Node.js | 20 or newer, which Next.js needs anyway. The code on this page needs nothing newer |
| Accounts | A user store that keeps each account's email and a password hash, made with a slow hash such as Argon2id, scrypt, or bcrypt |
| Sessions | A session in an httpOnly, Secure, SameSite cookie, with a new id at sign-up |
| A rate limit | On sign-ups, per email address and per network address, and on resends if you confirm the email, as [Security](#security) says |
| A breached-password check | Such as Have I Been Pwned's range API |
| A mail queue | Only if you confirm the email. The action puts each email on it rather than waiting for it to send, and the queue's worker sends it |
| Pending sign-ups | Only if you confirm the email. Where each sign-up waits until it's confirmed, named by an opaque id in an httpOnly cookie, with its link or code |
| Other accounts' sign-in | Only if you offer other accounts. A route for each, such as `/auth/google`, that starts its sign-in with a `state` check |

## Install

```sh
npx harmo-ui add sign-up-form
```

This copies into `components/harmo/patterns/`:

- `sign-up-form/`: `SignUpForm.tsx` and `sign-up-form.css`;
- `auth-form/`: `auth-form.css`, the look the account forms share, and
  `authForm.ts`, their inbox buttons and links;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card to its
  confirmation step;
- `verify-code/`: [Verify Code](verify-code.md), the step that confirms by
  code.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`.

Without the CLI, copy
[SignUpForm.tsx](../../examples/react/src/patterns/sign-up-form/SignUpForm.tsx),
[sign-up-form.css](../../examples/react/src/patterns/sign-up-form/sign-up-form.css),
[auth-form.css](../../examples/react/src/patterns/auth-form/auth-form.css),
[authForm.ts](../../examples/react/src/patterns/auth-form/authForm.ts),
[formAction.ts](../../examples/react/src/patterns/form-action/formAction.ts),
[useStepMotion.ts](../../examples/react/src/patterns/step-motion/useStepMotion.ts),
and Verify Code's files, as [its page](verify-code.md#install) says. Then set
them up as [Patterns](README.md#install) says. For HTML, copy the
[markup](#markup) and the stylesheets.

## Use it

In a Next.js app, write a server action that creates the account and answers:

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

`createAccount` and `startSession` are yours. `createAccount` checks the
password again, and hashes it, as [Security](#security) says.

Then give the action to the form:

```tsx
// app/sign-up/page.tsx
import { SignUpForm } from "@/components/harmo/patterns/sign-up-form/SignUpForm";
import { signUp } from "./actions";

export default function Page() {
  return <SignUpForm action={signUp} termsHref="/terms" privacyHref="/privacy" signInHref="/sign-in" />;
}
```

That's all it takes. When someone signs up, the form checks the fields, shows
the button working while your action runs, and shows its answer. It works
without JavaScript too: the browser posts the form, and the page Next.js
renders shows the answer, with the name, the email, and the marketing box
filled in again from `values`.

Before you ship it:

- **Add a rate limit** on sign-ups, as [Security](#security) says.
- **Know what "An account already uses that email." tells.** Anyone who types
  an address learns whether it has an account. To keep that private,
  [confirm the email](#confirm-the-email) instead.

### Without a server

Give `action` a plain async function instead. It gets the same `FormData`,
and returns the same answers. The form then needs JavaScript: React holds a
sign-up sent before the page's JavaScript has loaded, and sends it once it
has.

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

## Confirm the email

With `confirmEmail`, a step takes the form's place once someone signs up:
"Check your email", with a link to open or a code to type. The account is
made only once the link is opened, or the code is right, so none exists in an
address's name before its owner says so.

Your action answers `{ step: "confirm", email }` for every address, one that
already has an account too, the same way and in the same time, as the
[Sign-in Form](sign-in-form.md#security) and
[Reset Password](reset-password.md#security) answer theirs. So it checks the
password before anything depends on whether the address has an account,
hashes it every time, and leaves the email to your mail queue:

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
      confirmEmail={{ by: "link", resendAction: resendConfirmation }}
      initialResult={await pendingStep()}
    />
  );
}
```

`ResendResult` is Verify Code's. The rest are yours:

- **`isBreached` and `hashPassword`** check the password against breached
  passwords, and hash it with a slow hash, as [Security](#security) says.
- **`startPendingSignUp`** keeps the sign-up on your server, named by the
  opaque id it returns, and puts its email on your mail queue, rather than
  sending it while the action waits. The queue's worker sends the code, or
  the link to confirm, built from your site's origin, set in your config. For an
  address that already has an account, it sends a note instead, to the
  address that account holds: "Someone tried to sign up with your email. Sign
  in, or reset your password, if it was you." Neither email has the name in
  it.
- **`queueConfirmationAgain`** reads the address from the pending sign-up,
  never from the form, whose hidden `email` is only what the page shows. It
  counts each resend, by the pending sign-up and by network address, whether
  or not the address has an account, and says no once either has had a few.
  Then it puts the same email on the queue again.
- **`clientAddress`** is the network address the request came from, as your
  host or proxy reports it.
- **`pendingStep`** reads the pending sign-up from its cookie, and answers
  `{ step: "confirm", email }` for one, or nothing. So the page shows the
  step again after a post from it.

### By link

The step reads "Check your email", then "We've sent a link to
sam@example.com. Open it to confirm your email address.", then "If you didn't
receive an email, check your spam, resend, or use another email." The band
along its bottom links to sign in.

- **The inbox button**: for an address at Gmail, Outlook (`outlook.com`,
  `hotmail.com`, or `live.com`), or Yahoo, a button opens that inbox in a new
  tab: "Open Gmail", "Open Outlook", or "Open Yahoo Mail".
- **resend** calls `resendAction`. Once it answers `{ sent: true }`, the step
  says "We've sent the link to sam@example.com again." A message brings the
  form back, with the message under the email, and the address it was
  confirming in it.
- **Without `resendAction`**, there's no resend: "If you didn't receive an
  email, check your spam, or use another email."

### By code

```tsx
<SignUpForm
  action={signUp}
  signInHref="/sign-in"
  termsHref="/terms"
  privacyHref="/privacy"
  confirmEmail={{ by: "code", action: confirmCode, resendAction: resendConfirmation }}
  initialResult={await pendingStep()}
/>
```

The step is [Verify Code](verify-code.md), titled "Check your email": "We
sent a 6-digit code to sam@example.com.", the code, Verify, and "Send a new
code" after a 30-second wait. "Use another email" is in its band.

- **`action`** checks the code, posted with the email from a hidden input.
  Find the pending sign-up from its cookie, never from that email. Once the
  code is right, make the account, start the session, and redirect:

  ```ts
  export async function confirmCode(previous: VerifyCodeResult, data: FormData): Promise<VerifyCodeResult> {
    const jar = await cookies();
    const pending = jar.get("pending_sign_up")?.value;
    if (!pending) redirect("/sign-up");
    const user = await confirmSignUp(pending, String(data.get("code") ?? "")); // yours: makes the account
    if (!user) return { code: "That code isn't right. Check it, or send a new one." };
    jar.delete("pending_sign_up");
    jar.set("session", await startSession(user), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    redirect("/");
  }
  ```

  `VerifyCodeResult` is Verify Code's too, and
  [its Answers](verify-code.md#answers) lists what it can return.
  `confirmSignUp` and `startSession` are yours.
- **`resendAction`** sends a new code, and answers as for the link. A
  message shows under the code, as in Verify Code.
- **`length`, `characters`, and `groups`** are the code's, as in Verify
  Code: 6 digits by default.
- **`backHref`**, by link or by code, is where "use another email" leads
  without JavaScript, as [Either way](#either-way) says.

### Either way

- The form stays in the page, `hidden`, with what was typed. "Use another
  email" brings it back, and moves focus to its title.
- The card grows or shrinks to the step, its content fades in, and the
  step's title takes focus.
- **Without JavaScript, "use another email" needs a way to end the pending
  sign-up.** Otherwise it reloads the page, which reads the cookie, and shows
  the step again. Give `confirmEmail.backHref` a route that deletes the
  cookie and comes back:

  ```ts
  // app/sign-up/cancel/route.ts
  import { cookies } from "next/headers";
  import { redirect } from "next/navigation";
  import { endPendingSignUp } from "@/lib/auth";

  export async function GET() {
    await endPendingSignUp(); // yours: forgets the pending sign-up on your server
    (await cookies()).delete("pending_sign_up");
    redirect("/sign-up");
  }
  ```

  ```tsx
  confirmEmail={{ by: "link", resendAction: resendConfirmation, backHref: "/sign-up/cancel" }}
  ```

  With JavaScript, it brings the form back in place, without following the
  link. Your next `signUp` replaces the pending sign-up.

## Other accounts

Pass `providers` to offer other accounts to sign up with:

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

After the button and the terms' line comes "or", then a secondary Button for
each account, with its logo before its name. Up to three read "Continue with
Google", each as wide as the form. Four or more go two to a row, each showing
only the name, "Google", and named "Continue with Google" with `aria-label`.

- **`href`** is your server's route that starts signing in with that
  account, and sends the reader there and back. It needs a `state` check, as
  [Security](#security) says.
- **Logos**: bring each yourself, as its own sign-in guidelines show it:
  [Google's](https://developers.google.com/identity/branding-guidelines)
  four-color G,
  [Apple's](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
  and [GitHub's](https://github.com/logos) marks in one color, as
  `currentColor`, and
  [Microsoft's](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps)
  four squares. A Button draws any `.hicon` at 20px.
- **The terms**: the line under the button covers signing up this way too.
  With the terms' checkbox, someone who signs up this way agrees to the terms
  on your app's next page, if it needs them, since the form can't ask first.
- **Signing in**: offer the same accounts on the
  [Sign-in Form](sign-in-form.md), with its own `providers`, so someone who
  signs up with one can sign in with it.

## Terms and marketing emails

| You pass | The form shows |
| --- | --- |
| `termsHref` and `privacyHref` | A line under the button: "By creating an account, you agree to our Terms of Service and Privacy Policy." |
| Only `termsHref` | The same line, naming only the terms |
| Neither | No line, for an app that has no terms, or asks for them another way |
| `termsAgreement="checkbox"`, with `termsHref` | A checkbox in the line's place, the last field: "I agree to the Terms of Service and Privacy Policy". Signing up needs it checked, or it says "Agree to the terms to create your account." Checked, it posts `terms` as `"on"` |
| `askForMarketing` | A checkbox after the password, before the terms' checkbox: "Email me product news and tips". It starts unchecked, and signing up doesn't need it. Checked, it posts `marketing` as `"on"` |

- **The line or the checkbox?** The line is the common way: it's said before
  someone signs up, and asks nothing more of them. Use the checkbox where a
  law or your legal team asks for one. In HTML, use the checkbox's
  [markup](#markup), which your script checks.
- **Check the box on your server too**, if you ask for it. The form's check
  can be skipped.
- **Marketing starts unchecked**, since a box checked for someone isn't their
  consent.
- **Filling them in again**: give `terms` or `marketing` back in `values` as
  `"on"`, and without JavaScript its box starts checked.

## Props

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState): a server action marked `"use server"`, or an async function of yours. It gets `(previous, data)`, where `data` is the form's `FormData`: `name`, unless `askForName` is `false`, `email`, `password`, and `marketing` and `terms` when they're checked. What it returns is in [Answers](#answers) |
| `signInHref` | Required. Where "Sign in" leads |
| `termsHref` | Where "Terms of Service" leads. Without it, there's no line or checkbox for the terms |
| `privacyHref` | Where "Privacy Policy" leads, named with the terms. Without it, the line or checkbox names only the terms |
| `termsAgreement` | How someone agrees to the terms: `"line"`, the default, a line under the button; or `"checkbox"`, a checkbox that signing up needs checked. [Terms and marketing emails](#terms-and-marketing-emails) compares them |
| `askForName` | `true`, the default, asks for a name first. `false` leaves it out, and the form posts no `name` |
| `askForMarketing` | `true` adds an unchecked checkbox for marketing emails. `false` by default |
| `providers` | Other accounts to sign up with, each `{ name, icon, href }`: the account's name, such as `"Google"`; its logo, an element with the class `hicon`; and your server's route that starts signing in with it. See [Other accounts](#other-accounts) |
| `confirmEmail` | A step that confirms the email, once the action answers `{ step: "confirm", email }`: `{ by: "link", resendAction?, backHref? }`, or `{ by: "code", action, resendAction?, length?, characters?, groups?, backHref? }`. See [Confirm the email](#confirm-the-email). Without it, there's no such step, and `action`'s type has none |
| `initialResult` | The answer to show before the action has given one, such as `{ step: "confirm", email }` for a sign-up your server says is waiting for its confirmation |
| `titleAs` | The tag of the title and the confirmation step's: `"h1"` by default. Use `"h2"` to `"h6"` on a page with its own `<h1>` |

## Answers

Your action returns one of these. `SignUpFormResult` says exactly which, and
`SignUpFormConfirmResult` with `confirmEmail`.

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"An account already uses that email."` | Shows it under the email, moves focus there, and shakes the card |
| Messages by field, such as `{ password: "This password has appeared in a data breach. Choose another." }` | Shows each under its field, moves focus to the first, and shakes the card. `form` goes under the email, as does a message for a field the form doesn't show, such as `terms` without the checkbox |
| The same with `values`, such as `{ form: "An account already uses that email.", values: { name, email } }` | As above. Without JavaScript, the name and the email are filled in again, and `terms` or `marketing` given as `"on"` checks its box. Never the password |
| `{ step: "confirm", email }` | Only with `confirmEmail`. Shows the step that confirms the email |

If the action throws, or its promise rejects, the form shows "Something went
wrong. Try again." under the email. Next.js's `redirect()` and `notFound()`
work as usual. Several messages for the email's spot show there together.

| | |
| --- | --- |
| Fields it sends | `name`, unless `askForName` is `false`; `email`; `password`; and `marketing` and `terms`, as `"on"`, when they're checked |
| Fields with an error spot | `name`, `email`, `password`, and `terms` with the checkbox |
| Fields `values` fills in | `name`, `email`, `terms`, and `marketing` |

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
field the form has, and `values` only for fields it fills in, never the
password. [Patterns](README.md#actions) explains answers in more depth.

With JavaScript, the form calls your action itself, in a transition, rather
than as React's form action. So what was typed stays after a message, and a
thrown error shows the message rather than your error boundary.

## Security

The form checks fields for the person typing. It's not a defense: anyone can
send your action anything.

What the form does:

- **It keeps what was typed private.** It posts it in the request's body,
  never in the page's address, and never logs or stores it.
- **Its strength check only helps someone choose.** It doesn't stop anyone
  posting a weak password.
- **`autocomplete="new-password"`** lets a password manager offer a strong
  password, and save it.
- **`values` fills in only the name, the email, and the checkboxes**, and the
  form never reads a password from it. `SignUpFormMessages` has no password
  there, so TypeScript turns one down in an object written out in the answer,
  `values: { name, email }`, or in one given its type, as in the examples,
  `const values: SignUpFormMessages["values"] = { name, email }`. It doesn't
  in an object built without that type and passed in later, such as
  `const values = { name, email, password }`, or `Object.fromEntries(data)`,
  which holds every field the form posts. Name each field you give back, and
  never pass `Object.fromEntries(data)`.
- **The confirmation step holds only the address**, in a hidden input that
  its resend posts, never the password. The form it hides keeps the password
  only in its own field, in this page, until "use another email" brings it
  back.

Your server must:

- **Not tell who has an account, if you confirm the email.** "An account
  already uses that email." tells anyone who types an address whether it has
  one. With `confirmEmail`, answer every address the same way, in the same
  time, as the Sign-in Form's and Reset Password's pages ask. Check the
  password's length, and against breached passwords, before anything depends
  on whether the address has an account. Hash it every time. Put the email
  on a queue rather than waiting for it to send. Show the confirmation step
  for every address, and email the owner of one that has an account instead.
- **Check the password again**: its length, and against breached passwords,
  such as with Have I Been Pwned's range API. Hash it with a slow hash, such
  as Argon2id, scrypt, or bcrypt.
- **Check that the terms' box was checked**, if you ask for it, as the form's
  check can be skipped.
- **Make a confirmation link or code random**, expire, and work once, and
  allow a few tries per code, as [Verify Code](verify-code.md#security) says.
- **Limit resends the same way for every address.** Count each one, by the
  pending sign-up and by network address, whether or not the address has an
  account, and answer `{ sent: true }` unless the limit is reached. Report a
  send that fails only when it would fail for any address, such as your queue
  being down. Log one that depends on the account, such as its mail bouncing,
  and still answer that it went.
- **Find the pending sign-up from its cookie** in the actions after the
  first. The resend and Verify Code post the address from a hidden input,
  which anyone can change. Ignore it, or turn the post down when it doesn't
  match, as [Verify Code](verify-code.md#security) says.
- **Build the link in the email from your site's origin**, set in your
  config. Never build it from the request's `Host` or `X-Forwarded-Host`,
  which whoever sends the request can set, with an `Origin` to match, past
  Next.js's check.
- **Send the note about an existing account to the address that account
  holds**, never to the one typed, which may only look like it, as
  [Reset Password](reset-password.md#security) says.
- **Leave the name out of an email to an address that isn't confirmed.**
  Anyone can type someone else's address, and a name such as "Claim your prize
  at evil.example" would reach them in your email, from you. If you put it
  in, cap its length, and take out anything that looks like a link.
- **Don't let anyone make an account in someone else's name** before they
  arrive, and keep a way into it. Link a sign-in with another account, such
  as Google, to an account here by its email only when that account's
  address is confirmed, and the other account says its email is verified. If
  your app makes an account before its address is confirmed, whoever typed
  the address chose its password. Once the address's owner proves it another
  way, such as by resetting the password, or by signing in with another
  account whose email is verified, throw that password away, and end the
  account's sessions.
- **Limit sign-ups**, per email address and per network address.
- **Set the session in an httpOnly, Secure, SameSite cookie**, with a new id
  at sign-up.
- **Make each other account's `href` a route that starts its sign-in with a
  `state` check**, as the [Sign-in Form's](sign-in-form.md#security) does.
- **Never trust `previous`.** It always comes from the browser, as the
  action's first argument. With JavaScript, the form sends your last answer
  back with each call; without it, React writes the answer into the page,
  `values` and all, and the browser posts it back.
- **Check the post comes from your site**, against cross-site request
  forgery. Next.js does for server actions, comparing the `Origin` header with
  the host. Elsewhere, check it, or use a CSRF token.

## Without JavaScript

Given a server action, the form works before its script runs, or without one:

- The form posts its fields to your server action, as React renders a form
  for one: `method="POST"`, with hidden fields that name the action. Nothing
  goes in the page's address.
- The page your server renders after the post shows the answer: a message
  under its field, or the confirmation step.
- That page is new, so its fields start empty. Answer with
  `values: { name, email }`, and they start with what was typed, as their
  `defaultValue`. Give `terms` or `marketing` as `"on"`, and its checkbox
  starts checked. The password is always empty again, as the form never fills
  it in.
- The form's own checks, the password's strength, the shake, and the motion
  don't run. Your action's checks are the ones that count.

The confirmation step:

- **By link, "resend"** is a submit button that posts the address, from a
  hidden input, to `resendAction`.
- **By code**, Verify Code posts the code and the address to its action.
- **On the page after either post**, the Sign-up Form starts where
  `initialResult` says. So read the pending sign-up from your session, and
  pass `{ step: "confirm", email }`. After a resend that works, the step says
  the link went again. After one that fails, the form is back, with its email
  filled in from that step.
- **Neither action goes by the address posted**, which anyone can change in
  the page. Each finds the pending sign-up from its cookie, and ignores the
  address, or turns the post down when it doesn't match.
- **"use another email"** is a link to `confirmEmail.backHref`, the page
  itself by default. Point it at a route that ends the pending sign-up, as
  [Either way](#either-way) says, or it shows the step again.

Given a function of yours instead, React renders a form the browser never
sends. A submit before the page's JavaScript has loaded is held, then sent.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **The strength rule**: it's `strength` in `SignUpForm.tsx`. Its lowest
  level, `level: 1`, is the one that stops a sign-up. Change the rule and its
  words there, and in HTML, in your script. Your server decides what it
  accepts. Its message goes under the email, or, given by field, under the
  field it's about.
- **The email check**: it's only whether it looks like an address.
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

- **Give the `<form>` an `action`**: your server's endpoint for signing up.
  With `method="post"`, a form sent before its script runs, as on a slow
  connection or when the script fails to load, still creates the account, and
  keeps what was typed, the password included, out of the page's address,
  where the browser's history and the server's logs would keep it.
- **The password**: the first `…` is
  [Password Input](../components/password.md)'s toggle, with its Tooltip, and
  the second its meter and hint, as a new password has them. The password's
  error comes after them, at the end of its Field.
- **The terms' line** is the button's description, connected by
  `aria-describedby`. Without terms, leave out the line and the button's
  `aria-describedby`.

For a checkbox in the line's place, leave out the line and the button's
`aria-describedby`, and put the checkbox last in `.hauth-form-fields`, as a
small horizontal Field. A horizontal Field holds no error, so the terms'
error follows the Field, as [File Input](../components/file-input.md)'s does,
connected by `aria-describedby`. `.hsign-up-form-terms` holds the two:

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

For other accounts, "or" and their links go before the footer: after the
terms' line, or after the button without one:

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

With four or more, each shows the account's name, and `aria-label` names it:

```html
<a class="hbutton" data-variant="secondary" href="/auth/google" aria-label="Continue with Google">
  <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  <span class="hbutton-label">Google</span>
</a>
```

To confirm the email by link, once the action answers, the form gets
`hidden`, and "Check your email" follows it, holding the address in a hidden
input, for its resend:

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

Give that `<form>` an `action`: your server's endpoint for sending the link
again. "use another email" is a link to the page itself. For an address
without an inbox button, leave the button out.

To confirm by code, [Verify Code's markup](verify-code.md#markup) follows the
form instead, titled "Check your email", with
`<input type="hidden" name="email">` after its header, and "Use another
email" in its band.

Load Harmo's CSS, then `auth-form.css`, then `sign-up-form.css`, and to
confirm by code, `verify-code.css`.

### Classes

| Class or attribute | What it does |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The form, or a step's card: at most 400px wide, with 42px padding, its parts 26px apart, and its `.hbutton` as wide as it. `hidden` hides it |
| `.hauth-form-title` | The title, 20px bold, its line trimmed to the top of its capitals. It shows no focus ring, since it isn't a control |
| `.hauth-form-fields` | The fields, 16px apart |
| `.hsign-up-form-agreement` | The terms' line: 13px, centered, its lines balanced, in `--harmo-color-text-secondary`, 10px under the button, its `.hlink`s semibold |
| `.hsign-up-form-consent` on a small horizontal `.hfield` | A consent checkbox's Field: its label in `--harmo-color-text-secondary`, which a label's hover and disabled colors still take over, and its `.hlink`s semibold |
| `.hsign-up-form-terms` | The terms' checkbox Field and its `.herror`, 6px apart. The error starts where the label does, past the small Field's 16px box. An empty error takes no room |
| `.hauth-form-divider` | "or", 13px in `--harmo-color-text-tertiary`, between two lines that fill the form's width |
| `.hauth-form-providers` | The other accounts' Buttons, 10px apart, each as wide as the form. With four or more not `hidden`, two to a row |
| `.hauth-form-footer` | The band at the card's bottom: tinted, inset 6px (`--harmo-space-2xs`) from its sides and bottom, so the card frames it, with 4px corners. Its line is 14px, centered, in `--harmo-color-text-secondary`, 42px under what's above it |
| `.hauth-form-header` | A title with what's under it, 6px apart |
| `.hauth-form-message` | A step's paragraphs, 16px apart |
| `.hauth-form-description` | A paragraph under the title, 14px, in `--harmo-color-text-secondary` |
| `.hauth-form-email` | An address the form sent something to, medium weight, in `--harmo-color-text`. A long one breaks rather than overflowing the form |
| `.hauth-form-action` on a `.hlink` `<button>` | An action in a sentence, such as "resend": a button with the look of the Link beside it. With `aria-disabled="true"`, tertiary text, without the underline |
| `data-shake` on the form | Shakes it once, unless reduced motion is asked for. Remove it at `animationend`, so the next failure shakes it again |

### What your script does

[sign-up-form.js](../../examples/html/src/scripts/sign-up-form.js) is an
example. The password uses
[Password Input's script](../components/password.md#what-a-script-does),
`password.js`, and the code step uses Verify Code's, `verify-code.js`.

**As the password is typed:** rate it, with its toggle, as Password Input's
script does. That sets `aria-invalid="true"` on it while it's too weak, and
steps its strength's word and meter aside while the field shows an error.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script, so
   the page's own errors replace the browser's bubbles.
2. Check each field. Put an error in the `.herror` of each one that fails,
   with `aria-invalid="true"` on its input, and clear the others:
   - an empty name: "Enter your name.";
   - an empty email: "Enter your email address."; one that isn't an address:
     "Enter an email address, such as name@example.com.";
   - an empty password: "Enter a password."; one that's too weak: "Choose a
     stronger password.";
   - with the terms' checkbox, one that isn't checked: "Agree to the terms to
     create your account."

   If there's any, move focus to the first field with one, in the form's
   order, add `data-shake` to the form, and stop.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another sign-up meanwhile.
4. Sign up with the form's data: the name, the email, the password, and the
   boxes that are checked, marketing's among them.
5. Show the answer:
   - nothing, or an empty object: leave the form as it is;
   - a message: put it in the email's `.herror`;
   - messages by field, such as `{ password: "…" }`: put each in its field's
     `.herror`, with `aria-invalid="true"` on its input. One for a field the
     form doesn't have goes in the email's;
   - a thrown error: "Something went wrong. Try again." in the email's
     `.herror`;
   - `{ step: "confirm", email }`: show the step, below.

   For any message, move focus to the first field with one, and add
   `data-shake` to the form.

**To confirm the email:**

- Add the step's card after the form, its title with the tag of the form's
  own. Put the address in as text, never as markup: it's what was typed.
- Set `hidden` on the form, and animate the change, below. Move focus to the
  card's title with `focus({ preventScroll: true })`, then
  `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
  asked for.
- By code, Verify Code's own script sets the card up.
- **"use another email":** on a plain click, with the main button and no
  modifier key, call `preventDefault()`. Remove the card, and take `hidden`
  off the form, animating it the same way. Give the form's title
  `tabindex="-1"`, and move focus to it. Any other click, such as one that
  opens a new tab, follows the link.
- **resend**, by link: call `preventDefault()`, and send the link again with
  the card's data, with `aria-busy="true"` and `aria-disabled="true"` on the
  button meanwhile. Ignore another click. Once it has gone, say "We've sent
  the link to … again.", and move focus to the title. If it fails, bring the
  form back, as for "use another email", with the message under the email,
  as for a failed sign-up.

**Animate each change** as [Moving between steps](README.md#moving-between-steps) says.

**As people type:** on `input` in a field, or checking the box, take its
error away, and its `aria-invalid`, except on a password that's still too
weak. Remove `data-shake` at the form's own `animationend`, not one that
bubbles up from inside it.

**Other accounts** are links, so they need nothing from it.

## Accessibility

- Each field is named by its label, and its error is read with it, through
  `aria-describedby`. So are the password's strength word and hint.
- Errors are polite live regions, in the page from the start, so a screen
  reader reads each one as it appears, after the field that takes focus.
- A password that's too weak is marked `aria-invalid="true"` as it's typed,
  as its strength says. Its error comes only once someone signs up.
- Without JavaScript, the server's messages are in the page as it loads, each
  read with its field, which is marked `aria-invalid="true"`.
- A line by the button is the common way to agree to terms. It's said before
  someone signs up, and asks nothing more of them: no control to reach, and
  no error to recover from. The checkbox is for where a law or your legal
  team asks for one.
- The line is the button's description, through `aria-describedby`, so a
  screen reader reads it with the button, before someone signs up, though
  the line comes after it.
- The links in the line and in the checkbox's label are semibold rather than
  underlined. Link's purple is 2.03:1 against body text, so color alone
  doesn't tell a link from the words around it, as WCAG 1.4.1 asks (see
  [Link](../components/link.md#accessibility)). An underline would, as in
  running text elsewhere, but it's heavy in fine print, so the weight does it.
  Semibold rather than medium, since a font without a medium face, such as
  Windows' Segoe UI, draws medium as regular. One without a semibold face
  draws semibold as bold, so the links are bolder either way.
- The terms' checkbox is named by its whole label, the links' words included.
  A click on a link opens it rather than checking the box, and Tab reaches
  each link after the checkbox. A checkbox has no invalid look of its own, so
  its error says what's wrong.
- The box for marketing emails starts unchecked, and nothing checks it but
  the reader.
- "or" is text a screen reader reads, so the links after it read as another
  way to sign up. Their logos are hidden from it, with `aria-hidden`.
- Two to a row, each link is named "Continue with" its account, through
  `aria-label`. The name holds the word it shows, so speech input that says
  "Google" finds it.
- `autocomplete="name"`, `"email"`, and `"new-password"` let the browser fill
  in the name and the email, and a password manager offer a new password and
  save it.
- As the confirmation step shows, its title takes focus: a heading with
  `tabindex="-1"`, which a screen reader reads as it takes focus. It shows no
  focus ring, since it isn't a control. "use another email" moves focus back
  to the form's title.
- The shake only repeats what the errors say, so reduced motion loses
  nothing. Under reduced motion, the card takes the step's size at once; the
  step still fades in, since only its opacity changes.

## Design details

**The form:**

- A raised Card, at most 400px wide, with 42px (`--harmo-space-lg`) padding:
  the title, the fields, and a button as wide as the form, 26px
  (`--harmo-space-md`) apart. Fields are 16px (`--harmo-space-sm`) apart. The
  title and the card are the [Sign-in Form](sign-in-form.md)'s.
- The title is 20px bold, its line trimmed to the top of its capitals with
  `text-box`.
- "Already have an account? Sign in" sits in a band along the card's bottom
  edge: tinted `--harmo-color-background-secondary`, inset 6px
  (`--harmo-space-2xs`) from the card's sides and bottom, so the card frames
  it, with 4px corners. Its line is 14px, centered, in
  `--harmo-color-text-secondary`, with 16px above and below it, and its link
  is underlined. What's above it ends 42px over it, as the title starts 42px
  under the card's top edge.
- The name is one field, with `autocomplete="name"`, since not every name has
  a first and a last part. Or there's no name, for an app that asks for it
  once someone has signed up.
- The email, which is the account's name, has `autocomplete="email"`, as
  web.dev's
  [sign-up form best practices](https://web.dev/articles/sign-up-form-best-practices#help-password-managers)
  ask of a sign-up form's other fields, and as the HTML standard
  [names an email address](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-autocomplete-email).
  `"username"` is for a username of its own. The Sign-in Form's email has
  `"username"`, as web.dev's
  [sign-in form best practices](https://web.dev/articles/sign-in-form-best-practices#autofill)
  ask, so a password manager fills the account it saved.
- The password is a new one, `autocomplete="new-password"`, with Password
  Input's strength as it's typed: a word beside its label, a meter, and a
  hint under it. Under 10 characters is "Too weak". Upper case, lower case,
  digits, and symbols together are "Strong". Anything between is "Medium".
- While the password shows a message, its strength's word and meter step
  aside, as [Password Input's](../components/password.md#appearance-and-states)
  do, so "Strong" in green never sits beside "This password has appeared in
  a data breach."
- Signing up checks the fields first. An empty name, email, or password, an
  email that isn't an address, a password that's too weak, and, with the
  checkbox, terms that aren't agreed to each get an error under them.
  [What your script does](#what-your-script-does) lists the messages. Typing
  in a field, or checking the box, takes its error away.
- While your action runs, the button shows it's working, as a loading
  [Button](../components/button.md) does.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`). Under reduced motion it stays still, and the
  errors say what went wrong.

**The terms and marketing emails:**

- The terms' line is fine print under the button: 13px
  (`--harmo-font-size-xs`), centered, in `--harmo-color-text-secondary`, its
  lines balanced. It sits 10px (`--harmo-space-xs`) under the button rather
  than the form's 26px, so it reads as the button's. Its two links are
  semibold (`--harmo-font-weight-semibold`) rather than underlined.
- The terms' checkbox is the last field, its links as the line's. Its error
  goes 6px under it, where its label starts, as a description would. An empty
  one takes no room.
- Both checkboxes are small horizontal Fields, as fine print: a 16px box
  beside a 13px label, still on its first line. Their labels are
  `--harmo-color-text-secondary`, quieter than a label's usual color, a
  choice of this pattern's rather than of the small size's.

**Other accounts:**

- They follow the button and the terms' line: "or", 13px in
  `--harmo-color-text-tertiary` between two 1px `--harmo-color-border` lines,
  then a secondary Button for each, a link with the account's logo before its
  name. Then the band.
- Up to three are each as wide as the form, 10px (`--harmo-space-xs`) apart.
  Four or more go two to a row.

**The confirmation step:**

- It takes the form's place. The card resizes from the form to the step,
  easing out (`--harmo-ease-out-cubic`): 200ms (`--harmo-duration-normal`)
  for a small change, plus half a millisecond per pixel, up to 350ms. The
  form goes at once, and the step fades in over 200ms, laid out where it will
  end. "use another email" changes back the same way.
- By link, the title, then two paragraphs, 14px in
  `--harmo-color-text-secondary`, 16px apart and 6px under the title, as
  Reset Password's sent step reads. The address is in medium weight, in
  `--harmo-color-text`, and a long one breaks rather than overflowing. Then
  the inbox button, if there's one, and the band to sign in.
- By code, Verify Code's card, titled "Check your email", with "Use another
  email" in its band.
