# Reset Password

Lets someone who has forgotten their password choose a new one, ready to copy
into your app. One form asks for their email and sends a link. The page the
link opens has a second form, which sets the new password:

| Step | React | What it shows |
| --- | --- | --- |
| Asking for a link | `ResetPasswordForm` | The email, then "Check your email" once the link is sent |
| Choosing a new password | `NewPasswordForm` | A new password and a confirmation, then "Your password was updated" |
| A link that has expired | A warning [Banner](../components/banner.md) | "This link to reset your password has expired or can no longer be used", with a link to ask for a new one |

Each form is a raised [Card](../components/card.md), as the
[Sign-in Form](sign-in-form.md) is, with a [Field](../components/field.md) and
[Input](../components/input.md) for the email, or two
[Password Inputs](../components/password.md), a
[Button](../components/button.md), and [Links](../components/link.md), in
React and in HTML.

## Try the demo

The playground's forms answer as a server would, after a moment. Type these to
see each answer:

| Form | Type | You see |
| --- | --- | --- |
| Asking for a link | Any email not listed here | "Check your email", for that address |
| Asking for a link | An email at `gmail.com`, such as the filled-in `sam@gmail.com` | "Check your email", with an "Open Gmail" button. Outlook, Hotmail, Live, and Yahoo addresses get one too |
| Asking for a link | An email at `example.org` | "We couldn't send the email. Try again in a moment." under the email |
| Asking for a link | An email at `gmial.com` | "We can't deliver email to gmial.com. Did you mean gmail.com?" under the email |
| Asking for a link | `error@example.com` | "Something went wrong. Try again." under the email, as when the server can't be reached |
| New password | Any password of 10 characters or more not listed here, twice | "Your password was updated" |
| New password | `Password123!`, twice | "This password is too common. Choose another." under the new password |
| New password | `MyOldPassword1!`, twice | "You've used this password before. Choose a new one." under the new password |

On "Check your email", press **resend** to see the step for a second send, or
**try another email** to start over. The last example shows the Banner for a
link that has expired.

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| Accounts | Where your accounts are kept: to find one by its email, and to save a new password with a slow hash |
| Sessions | To end an account's other sessions once its password is saved |
| Reset tokens | Random ones, kept only as hashes, such as in your database |
| A route for the link | `/reset-password/link`, as [The link](#the-link) says |
| Email | A mail queue, and a worker that sends the link from it, so your action never waits for the email |
| Your site's origin | In your config, such as `APP_ORIGIN`, to build the link from |
| A rate limit | By the address typed, and by the network address your host or proxy reports |
| A breached-password check | To check each new password against breached passwords, on your server |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves |

[Security](#security) says what each of these must do.

## React

### Install

```sh
npx harmo-ui add reset-password
```

It copies into `components/harmo/patterns/`:

- `reset-password/`, the two forms, `ResetPasswordForm.tsx` and
  `NewPasswordForm.tsx`;
- `auth-form/`, the look and helpers the account forms share, such as their
  inboxes;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card between steps.

It also copies the Harmo components they use, and adds the stylesheet to
`harmo.css`. The Banner for an expired link isn't one of them:
`npx harmo-ui add banner` copies it. Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), and set them
up as [Patterns](README.md#install) says.

### Use it

Write two server actions: one sends the link, and the other saves the new
password. In a Next.js app:

```ts
// app/reset-password/actions.ts
"use server";

import { cookies } from "next/headers";
import type { ResetPasswordFormResult } from "@/components/harmo/patterns/reset-password/ResetPasswordForm";
import type { NewPasswordFormResult } from "@/components/harmo/patterns/reset-password/NewPasswordForm";
import { clientAddress, countResetRequest, endOtherSessions, queueResetLink, setPassword } from "@/lib/auth";

export async function sendLink(previous: ResetPasswordFormResult, data: FormData): Promise<ResetPasswordFormResult> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  if (!(await countResetRequest(email, await clientAddress()))) {
    return { form: "You've asked for a few links already. Try again in an hour.", values: { email } };
  }
  await queueResetLink(email);
  return { step: "sent", email };
}

export async function savePassword(previous: NewPasswordFormResult, data: FormData): Promise<NewPasswordFormResult> {
  const jar = await cookies();
  const token = jar.get("reset_token")?.value;
  if (!token) return "This link has expired. Ask for a new one.";
  const saved = await setPassword(token, String(data.get("password") ?? ""));
  if (saved === "reused") return { password: "You've used this password before. Choose a new one." };
  if (!saved) return "This link has expired. Ask for a new one.";
  jar.delete("reset_token");
  await endOtherSessions(saved.user);
  return { step: "saved" };
}
```

The functions from `@/lib/auth` stand for your app's own:

| Function | What it does |
| --- | --- |
| `clientAddress()` | Returns the network address the request came from, as your host or proxy reports it |
| `countResetRequest(email, address)` | Counts every request, by the address typed and by network address, whether or not an account uses the address. Says no once either has asked a few times |
| `queueResetLink(email)` | Only puts the request on your mail queue, so the action answers in the same time either way. [The link](#the-link) shows the worker that sends it |
| `setPassword(token, password)` | Checks the token, checks the new password again, and saves it. Returns an object with the account's `user`; `"reused"` for a password the account has used before; or nothing once the token has expired or been used |
| `endOtherSessions(user)` | Ends the account's other sessions |

Then give each action its form, on its own page:

```tsx
// app/reset-password/page.tsx
import { ResetPasswordForm } from "@/components/harmo/patterns/reset-password/ResetPasswordForm";
import { sendLink } from "./actions";

export default function Page() {
  return <ResetPasswordForm action={sendLink} signInHref="/sign-in" supportHref="/contact" />;
}
```

```tsx
// app/reset-password/new/page.tsx
import { NewPasswordForm } from "@/components/harmo/patterns/reset-password/NewPasswordForm";
import { savePassword } from "../actions";

export default function Page() {
  return <NewPasswordForm action={savePassword} continueHref="/sign-in" />;
}
```

That's all it takes. The first page asks for the email; the link in the email
leads to the second, through a route of yours, as [The link](#the-link) says.
Each form checks its fields, shows the button working while your action runs,
and shows its [answer](#answers). Before you ship it, go through
[Security](#security): most of what keeps this pattern safe is on your server.

#### Without a server

Give `action` a plain async function instead, in a client component of yours.
It gets the same `FormData`, and returns the same answers:

```tsx
<ResetPasswordForm
  action={async (previous, data) => {
    const response = await fetch("/api/reset-password", { method: "POST", body: data });
    if (!response.ok) return "We couldn't send the email. Try again in a moment.";
    return { step: "sent", email: String(data.get("email") ?? "").trim() };
  }}
  signInHref="/sign-in"
  supportHref="/contact"
/>
```

### When the link has expired

A link that has expired, or has been used, gets a page with a warning Banner
in place of the form, as wide as the forms:

```tsx
import { Banner } from "@/components/harmo/banner/Banner";
import { Link } from "@/components/harmo/link/Link";

<Banner status="warning" icon={<WarningIcon />} style={{ inlineSize: "100%", maxInlineSize: "25rem" }}>
  This link to reset your password has expired or can no longer be used.{" "}
  <Link href="/reset-password" underlined>
    Request a new one
  </Link>
  .
</Banner>
```

`WarningIcon` is your app's. A link that stops working while the form is open
gets `savePassword`'s "This link has expired. Ask for a new one." under the
new password instead.

### Props

`ResetPasswordForm` takes:

| Prop | |
| --- | --- |
| `action` | Required. Sends the link, and again on resend. Your [form action](https://react.dev/reference/react/useActionState): a server action, or an async function of yours. It gets `(previous, data)`, `data` holding `email`, and returns one of the [answers](#answers) |
| `signInHref` | Required. Where "Return to sign in" leads |
| `supportHref` | Required. Where "contact our support" leads, after a resend |
| `defaultEmail` | The email to start with, such as a signed-in person's. Never take it from the page's address, where it would end up in the server's logs and the browser's history |
| `initialResult` | The answer to show before your action has given one |
| `titleAs` | The title's tag, at every step: `"h1"` by default, or `"h2"` to `"h6"` |

`NewPasswordForm` takes:

| Prop | |
| --- | --- |
| `action` | Required. Saves the new password, as a form action, as above. `data` holds `password` and `confirmation` |
| `continueHref` | Required. Where Continue leads once the password is saved |
| `initialResult` | The answer to show before your action has given one |
| `titleAs` | The title's tag, and the saved step's: `"h1"` by default, or `"h2"` to `"h6"` |

### Answers

Your action returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"This password is too common. Choose another."` | Shows it under the email, or under the new password. That field takes focus, and the card shakes |
| Messages by field, such as `{ password: "You've used this password before. Choose a new one." }` | Shows each under its field, moves focus to the first, and shakes the card. `form`, or a message for a field the form doesn't have, goes under the email, or the new password |
| The same with `values: { email }`, only for `ResetPasswordForm` | As above, and without JavaScript, fills in the email again. A password never is |
| `{ step: "sent", email }`, for `ResetPasswordForm` | Shows "Check your email" for that address. Return it once you've sent the link, or would have: whether or not an account uses the address |
| `{ step: "saved" }`, for `NewPasswordForm` | Shows "Your password was updated" |

A message after a resend takes the form back to its first step, with the
message under the email. If the action throws, or its promise rejects, the
form shows "Something went wrong. Try again." under the email, or the new
password. Next.js's `redirect()` and `notFound()` work as usual.

```ts
type ResetPasswordFormResult =
  | undefined
  | string
  | { email?: string; form?: string; values?: { email?: string } }
  | { step: "sent"; email: string };
type NewPasswordFormResult =
  | undefined
  | string
  | { password?: string; confirmation?: string; form?: string }
  | { step: "saved" };
```

Each form's messages, without the steps, are `ResetPasswordFormMessages` and
`NewPasswordFormMessages`. With JavaScript, each form calls your action
itself, in a transition, rather than as React's form action, so what was
typed stays after a message. [Patterns](README.md#actions) explains answers in
more depth.

### Without JavaScript

Given a server action, each form works before its script runs, or without
one:

- It posts to your action, in the request's body, as React renders a form for
  one.
- Your framework runs the action, and renders the page again with its answer:
  a message under its field, "Check your email", or "Your password was
  updated".
- The page is new, so its fields start empty. Answer the request for a link
  with `values: { email }`, and the email is filled in again. The new
  passwords never are.
- "Check your email" holds the address in a hidden input. Resend is a submit
  button, so it posts the address again, and "Try another email" is a link to
  the page itself, `href=""`, so it starts over.
- The form's own checks, the shake, and the motion don't run. Your action's
  checks are the ones that count.

Given a function of yours instead, the form needs JavaScript. A submit made
before the script has loaded is held, then sent once it has.

## HTML

### Markup

Asking for a link:

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <div class="hauth-form-header">
    <h1 class="hauth-form-title" tabindex="-1">Reset your password</h1>
    <p class="hauth-form-description">
      Enter the email address of your account, and we'll send you a link to reset your password.
    </p>
  </div>
  <div class="hfield">
    <label class="hlabel" for="reset-email">Email</label>
    <input class="hinput" id="reset-email" name="email" type="email"
      autocomplete="email" aria-describedby="reset-email-error" />
    <p class="herror" id="reset-email-error" aria-live="polite"></p>
  </div>
  <button class="hbutton" type="submit">
    <span class="hbutton-label">Continue</span>
  </button>
  <p class="hauth-form-footer">
    <a class="hlink" href="/sign-in">Return to sign in</a>
  </p>
</form>
```

Give each `<form>` an `action`, your server's endpoint for sending the link,
or for saving the password, and it works even without a script. Load Harmo's
CSS, then `auth-form.css`.

Once the link is sent, the form holds this in place of everything above its
footer:

```html
<div class="hauth-form-header">
  <h1 class="hauth-form-title" tabindex="-1">Check your email</h1>
  <div class="hauth-form-message">
    <p class="hauth-form-description">
      If an account uses <strong class="hauth-form-email">sam@gmail.com</strong>,
      we've sent a link there to reset your password.
    </p>
    <p class="hauth-form-description">
      If you didn't receive an email, check your spam,
      <button class="hlink hauth-form-action" type="submit" data-underlined>resend</button>, or
      <a class="hlink" data-underlined href="">try another email</a>.
    </p>
  </div>
</div>
<input type="hidden" name="email" value="sam@gmail.com" />
<a class="hbutton" href="https://mail.google.com/" target="_blank" rel="noopener noreferrer">
  <span class="hbutton-label">Open Gmail</span>
</a>
```

Sent again, the paragraphs read as below, and there's no inbox button:

```html
<p class="hauth-form-description">
  If an account uses <strong class="hauth-form-email">sam@gmail.com</strong>,
  we've sent the link there again.
</p>
<p class="hauth-form-description">
  If you still didn't receive an email, this might be the wrong email for your account.
  <a class="hlink" data-underlined href="">Try another email</a>
  or <a class="hlink" data-underlined href="/contact">contact our support</a>.
</p>
```

Choosing the new password:

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <h1 class="hauth-form-title">Reset password</h1>
  <div class="hauth-form-fields">
    <div class="hfield">
      <div class="hfield-label-row">
        <label class="hlabel" for="new-password">New password</label>
        <span class="hpassword-strength" id="new-password-strength" aria-live="polite"></span>
      </div>
      <div class="hpassword">
        <input class="hinput" id="new-password" name="password" type="password"
          autocomplete="new-password"
          aria-describedby="new-password-error new-password-strength new-password-hint" />
        …
      </div>
      <div class="hpassword-details" hidden>…</div>
      <p class="herror" id="new-password-error" aria-live="polite"></p>
    </div>
    <div class="hfield">
      <label class="hlabel" for="confirm-password">Confirm new password</label>
      <div class="hpassword">
        <input class="hinput" id="confirm-password" name="confirmation" type="password"
          autocomplete="new-password" aria-describedby="confirm-password-error" />
        …
      </div>
      <p class="herror" id="confirm-password-error" aria-live="polite"></p>
    </div>
  </div>
  <button class="hbutton" type="submit">
    <span class="hbutton-label">Reset password</span>
  </button>
</form>
```

The `…` in `.hpassword` is [Password Input](../components/password.md)'s
toggle, with its Tooltip, and the one in `.hpassword-details` its Meter and
hint. Once the password is saved, the form holds:

```html
<h1 class="hauth-form-title" tabindex="-1">Your password was updated</h1>
<a class="hbutton" href="/sign-in">
  <span class="hbutton-label">Continue</span>
</a>
```

A link that has expired, or has been used, gets a page with a warning Banner
in place of the form:

```html
<div class="hbanner" data-status="warning">
  <svg class="hbanner-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
  <p class="hbanner-message">
    This link to reset your password has expired or can no longer be used.
    <a class="hlink" data-underlined href="/reset-password">Request a new one</a>.
  </p>
</div>
```

### Classes

| Class or attribute | What it's for |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The form, its parts spaced out, and its `.hbutton` as wide as it |
| `.hauth-form-header` | The title and the text under it |
| `.hauth-form-title` | The title. With `tabindex="-1"`, it takes focus as its step shows, without a focus ring |
| `.hauth-form-description` | The text under the title |
| `.hauth-form-message` | The paragraphs under the title |
| `.hauth-form-email` | The address. A long one breaks |
| `.hauth-form-action` with `.hlink` on a `<button>` | An action inside a sentence, such as "resend", looking like a Link. With `aria-disabled="true"`, it's dimmed |
| `.hauth-form-fields` | The fields |
| `.hauth-form-footer` | The band along the card's bottom |
| `data-shake` on the form | Shakes it once, unless reduced motion is asked for. Remove it at the form's own `animationend`, so the next failure shakes it again |

### What your script does

[reset-password.js](../../examples/html/src/scripts/reset-password.js) is an
example. The Password Inputs' toggle and strength use that component's
example script, `password.js`.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script.
2. Check each field, with the messages in [Design details](#design-details).
   Put an error in the `.herror` of each one that's wrong, with
   `aria-invalid="true"` on its input, and clear the others. Keep the new
   password's `aria-invalid` while its strength is too weak, as Password
   Input's script sets it. Move focus to the first field in error, add
   `data-shake` to the form, and stop.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another submit meanwhile.
4. Send the form's data, each field by its `name`.
5. Show the answer:
   - nothing: leave the form as it is, as your server has redirected;
   - a message: put it in the email's `.herror`, or the new password's, move
     focus there, and shake the form;
   - messages by field, an object such as `{ password: "…" }`: put each in its
     field's `.herror`, with `aria-invalid="true"` on its input, move focus to
     the first, and shake the form. One for a field the form doesn't have joins
     the first field's;
   - a request that fails: "Something went wrong. Try again." in the email's
     `.herror`, or the new password's;
   - `{ step: "sent", email }` or `{ step: "saved" }`: show the next step,
     below.

**The next step:**

- Replace the form's children, but for the footer, with the next step's.
- Make its title a heading with the tag of the form's own, such as `<h3>` in
  a Dialog.
- Fill in the address as text, never as markup, since it's what was typed,
  and as the value of the step's hidden `email` input.
- Add the inbox button only on the first "Check your email", and only for an
  inbox the list knows.
- Write the step's links, to support and onward, into your markup or
  script. Never fill them in from the page's address.
- Move focus to its title with `focus({ preventScroll: true })`, then
  `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
  asked for.
- Animate the change as
  [Moving between steps](README.md#moving-between-steps) says. The footer is a
  child that stays, so it moves with the card's bottom edge.

**Resend and try another email:**

- Resend is a submit button. On a click, call `preventDefault()`, and send
  again with the form's data, which holds the hidden address. Meanwhile put
  `aria-busy="true"` and `aria-disabled="true"` on the button, and ignore
  another click. Then show "Check your email" again, with the paragraphs for
  a second send. If the resend fails, put the first step's elements back, with
  the message under the email, and move focus to the email.
- "Try another email" is a link to the page. On a plain click, with the main
  button and no modifier key, call `preventDefault()`. Then put the first
  step's elements back, with the field as it was, and move focus to its
  title. Any other click, such as one for a new tab, follows the link.

**As people type:** on `input`, take the field's error away. When it's
"Passwords must match.", take both fields' away. Remove `data-shake` at the
form's own `animationend`, not one that bubbles up from inside it.

## The link

`queueResetLink` only queues the request. Your queue's worker sends the link,
if an account uses the address:

```ts
// lib/mail-worker.ts, run by your queue
export async function sendResetLink(typed: string) {
  const account = await findAccountByEmail(typed);
  if (!account) return;
  const link = new URL("/reset-password/link", process.env.APP_ORIGIN);
  link.searchParams.set("token", await createResetToken(account));
  await sendMail({ to: account.email, subject: "Reset your password", text: `To reset your password, open ${link}` });
}
```

`findAccountByEmail`, `createResetToken`, and `sendMail` are your app's own.
It builds the link from your site's origin, never from the request, and sends
it to the address the account holds, never to the one typed, as
[Security](#security) says why.

The link opens a route of yours, `/reset-password/link?token=…`, with a
`no-referrer` Referrer Policy. It checks the token, keeps it in an httpOnly,
Secure, SameSite cookie, `reset_token`, and redirects to the new password's
page. So the token is neither in that page nor in its address.
`savePassword` reads the token from the cookie, and deletes the cookie once
the password is saved. A link that has expired, or has been used, leads to a
page with the [Banner](#when-the-link-has-expired) instead.

## Security

The forms check fields for the person typing. That's not a defense: anyone can
send your action anything. Your server must:

- **Answer the same way, in the same time, whether or not an account uses the
  address.** That's the promise "Check your email" makes, "If an account uses
  sam@example.com, we've sent a link there.", as OWASP's
  [Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
  asks:
  - Limit requests by the address typed, trimmed and in lower case, and by
    network address. Count each one, whether or not an account uses the
    address: a limit that counts only the links sent says no only to
    addresses with accounts, and so tells anyone which do.
  - Send the email from a queue, as [The link](#the-link) does, rather than
    waiting for it in the action. Otherwise an address with an account takes
    longer to answer.
  - Give back a message only when the limit is reached, or when the send
    would fail for any address alike, such as your queue being down. For a
    failure that depends on the account, such as its mail bouncing, log it,
    and still answer that the link was sent.
- **Build the link from your site's origin**, set in your config. Never use
  the request's `Host` or `X-Forwarded-Host`: whoever sends the request sets
  those. A forged `Host`, with an `Origin` to match, passes Next.js's check of
  where a post came from, and a link built from it would send the token to
  their site.
- **Send the link to the address the account holds**, never to the one typed.
  Otherwise an address that only matches it, by case or by a look-alike
  Unicode character, gets the link, as in Django's
  [CVE-2019-19844](https://www.djangoproject.com/weblog/2019/dec/18/security-releases/).
- **Make each token random**, with a cryptographic generator. Keep only its
  hash, and make it work once and expire, such as after an hour.
- **Keep the token out of the page.** The page the link opens has a
  `no-referrer` Referrer Policy, so the token doesn't reach another site in a
  request's `Referer`, and the token moves into a cookie, as
  [The link](#the-link) does.
- **Check the new password again**: its length, and against breached
  passwords. Hash it with a slow hash, and end the account's other sessions
  once it's saved.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#never-trust-previous) explains.
- **Give back in `values` only the email**, naming it. TypeScript turns down a
  password in `values` written out in the answer, but not in an object built
  elsewhere, such as `Object.fromEntries(data)`, which holds every field the
  form posts. Never pass that.
- **Check the post comes from your site**, against cross-site request
  forgery, as Next.js does for server actions; elsewhere, check the `Origin`
  header, or use a CSRF token.

The forms themselves:

- **Never say whether an account uses the address.** Keep your action's
  answer the same either way.
- **Post what's typed in the request's body**, never in the page's address,
  so a form sent before its script runs keeps it out of the browser's history
  and the server's logs. Only the address, which the person typed, is in the
  sent step's hidden input.
- **Never log or store what's typed**, and never fill in a password from
  `values`.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **Inboxes**: they're a list in `auth-form/authForm.ts`, which the Sign-up
  Form's "Check your email" shares. Add one with the domain it serves, its
  button's words, and its plain inbox address.
- **The strength rule**: it's `strength` in `NewPasswordForm.tsx`, as in
  [Password Input](../components/password.md). A password at its lowest level
  is too weak. In HTML, it's your Password Input script's rule; the example's
  is in `password.js`.
- **Focus on load**: on a page that has only the form, add `autoFocus` to the
  email's Input, or the new password's, or `autofocus` in HTML, so typing can
  start at once.
- **Headings**: titles are `<h1>`. On a page with its own `<h1>`, pass
  `titleAs="h2"` to each form, and its steps' titles follow. In HTML, make the
  titles `<h2>`s.
- **A step of your own**: each step is a keyed `Fragment`, so its elements
  are new, and fade in, rather than being reused. Make the change through the
  function `useStepMotion` returns. It measures the card before React renders
  the change, and animates it in a layout effect once React has committed it,
  before the browser paints.

## Accessibility

- Each step's title takes focus as it shows, without the page jumping to it,
  so a screen reader reads where the form has got to, then what follows. If
  it's out of view, the page scrolls it into view, smoothly. `tabindex="-1"`
  lets a script focus it, and keeps it out of the Tab order. It isn't a
  control, so it draws no focus ring.
- Each field is named by its label, and its error is read with it, through
  `aria-describedby`.
- Errors are polite live regions, in the page from the start, empty, so a
  screen reader reads each one as it appears, after the field that takes
  focus.
- `autocomplete="email"` lets the browser fill in the address.
  `autocomplete="new-password"` on both password fields lets a password
  manager suggest a strong one, and save it.
- "resend" is a button, and "try another email" a link. Tab reaches them in
  the sentence's order. Enter presses either, and Space the button too. Their
  underline marks them in the sentence, as a Link there needs.
- A Banner that's on the page when it loads needs no role. One shown later
  needs one, as [Banner](../components/banner.md#accessibility) says.
- The shake only repeats what the error says, so reduced motion loses
  nothing.

## Design details

**Both forms:**

- A raised Card, as the Sign-in Form is: at most 400px wide, with 42px
  (`--harmo-space-lg`) padding, its parts 26px (`--harmo-space-md`) apart,
  and a button as wide as the form. The fields are 16px (`--harmo-space-sm`)
  apart.
- The title is 20px bold, with a description 6px (`--harmo-space-2xs`) under
  it, 14px in `--harmo-color-text-secondary`.
- While your action runs, the button shows it's working.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`), unless reduced motion is asked for. Typing takes
  the error away.

**Asking for a link**, `ResetPasswordForm`:

- The title, "Reset your password", its description, then the email and
  Continue.
- "Return to sign in" stays under every step, in a band along the card's
  bottom edge, as the Sign-in Form's line to sign up is: tinted
  `--harmo-color-background-secondary`, inset 6px from the card's sides and
  bottom, so the card frames it, with 4px corners, the link centered at 14px.
  What's above it ends 42px over it, as the title starts 42px under the
  card's top edge.
- Continue checks the email first: "Enter your email address." when it's
  empty, and "Enter an email address, such as name@example.com." when it isn't
  an address.

**Check your email**, once the link is sent:

- It says the link went to the address if an account uses it, the address in
  medium weight in `--harmo-color-text`.
- 16px (`--harmo-space-sm`) under that: "If you didn't receive an email, check
  your spam, resend, or try another email." "resend" is a button, since it
  sends the link again; "try another email" is a link to the page, since it
  starts over, with the address filled in again. Both look like the Links
  beside them, underlined.
- After a resend, the same title takes focus again, and the text says so:
  "we've sent the link there again". Then: "If you still didn't receive an
  email, this might be the wrong email for your account. Try another email or
  contact our support."
- For an address at a known inbox, the first "Check your email" has a button
  that opens that inbox at its plain address, in a new tab, so the form stays
  where it was:

| Address at | Button | Opens |
| --- | --- | --- |
| `gmail.com` | "Open Gmail" | `https://mail.google.com/` |
| `outlook.com`, `hotmail.com`, or `live.com` | "Open Outlook" | `https://outlook.live.com/` |
| `yahoo.` and any ending, such as `yahoo.com` | "Open Yahoo Mail" | `https://mail.yahoo.com/` |

**Choosing the new password**, `NewPasswordForm`:

- The title, "Reset password", then "New password", with Password Input's
  strength, "Confirm new password", and the button, "Reset password".
- The strength is "Too weak" under 10 characters, "Strong" with an uppercase
  and a lowercase letter, a digit, and a symbol, and "Medium" otherwise. The
  password needs to be above "Too weak".
- The button checks each field first: "Enter a new password." when it's
  empty, "Choose a stronger password." when it's too weak, and "Enter the new
  password again." when the confirmation is empty. Once both are fine but
  differ, "Passwords must match." goes under both, and typing in either takes
  it away from both. The first field in error takes focus.
- Once it's saved, "Your password was updated" takes the form's place, with
  Continue, a link onward, as wide as the form.

**Moving between steps:** the card grows or shrinks to the new step's size,
easing out (`--harmo-ease-out-cubic`), 200ms (`--harmo-duration-normal`) for
a small change, plus half a millisecond per pixel, up to 350ms. What the old
step showed goes at once, and the new one fades in over 200ms, laid out where
it will end. The band moves with the card's bottom edge. A step that comes
while the card is still resizing starts from the size it has then. Under
reduced motion, the card takes its new size at once, and only the fade plays.
