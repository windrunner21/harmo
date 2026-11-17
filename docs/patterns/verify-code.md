# Verify Code

A form that asks for a one-time code, ready to copy into your app: a
sign-in's second step, or a code that confirms an email or a phone number. It
says where the code went, takes it in an
[OTP Input](../components/otp-input.md), and sends itself once the code is
whole, with "Send a new code" after a wait.

It's a raised [Card](../components/card.md), in React and in HTML. The
[Sign-in Form](sign-in-form.md) uses it for its second step, and the
[Sign-up Form](sign-up-form.md) to confirm an email by code; on a page of its
own, use it as this page says.

## Try the demo

The playground's forms answer as a server would, after a moment. The form
sends itself once the last digit is in. Type these to see each answer:

| Type | You see |
| --- | --- |
| `123456` | The button works for a moment, then a toast says "Code accepted", where your own action would sign the person in and redirect |
| `000000` | "Something went wrong. Try again." under the field, as when the server can't be reached |
| Any other code, such as `111111` | "That code isn't right. Check it, or send a new one." under the field. The field takes focus with the code selected, so typing replaces it, and the card shakes |
| Part of a code, then Verify | "Enter all 6 digits." under the field |
| Nothing, then Verify | "Enter the code." under the field |
| "Send a new code", once its countdown ends | "We've sent a new code to sam@example.com.", and the countdown starts again. The demo always sends one |

The countdown is 30 seconds, or a minute in "Confirming a phone number". "From
an authenticator app" has no new code to send.

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| A pending sign-in | Kept on your server, named by an opaque id in a cookie you set when the password was right. To confirm an email, a pending sign-up instead |
| A way to send codes | Only if you send codes: email or text messages, such as through your mail queue or an SMS provider |
| Stored codes | Only if you send codes: each code's hash, when it expires, and how many tries it's had, such as in your database |
| Authenticator codes | Only if codes come from an authenticator app: a check of each code against the secret the account set up with the app |
| Rate limits | On attempts and on new codes, per account and per network address |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves |

[Security](#security) says what each of these must do.

## React

### Install

```sh
npx harmo-ui add verify-code
```

It copies into `components/harmo/patterns/`:

- `verify-code/`, the form, `VerifyCodeForm.tsx`, and `verify-code.css`;
- `auth-form/`, the look and helpers the account forms share;
- `form-action/formAction.ts`, which runs every pattern form's action.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), and set them
up as [Patterns](README.md#install) says.

### Use it

Write a server action that checks the code, and one that sends a new one. In
a Next.js app:

```ts
// app/sign-in/code/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ResendResult, VerifyCodeResult } from "@/components/harmo/patterns/verify-code/VerifyCodeForm";
import { checkCode, sendCode, startSession } from "@/lib/auth";

export async function verifyCode(previous: VerifyCodeResult, data: FormData): Promise<VerifyCodeResult> {
  const jar = await cookies();
  const pending = jar.get("pending_sign_in")?.value;
  if (!pending) redirect("/sign-in");
  const checked = await checkCode(pending, String(data.get("code") ?? ""));
  if (checked === "expired") return "That code has expired. Send a new one.";
  if (!checked) return { code: "That code isn't right. Check it, or send a new one." };
  jar.delete("pending_sign_in");
  jar.set("session", await startSession(checked.user), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function resendCode(): Promise<ResendResult> {
  const pending = (await cookies()).get("pending_sign_in")?.value;
  if (!pending) redirect("/sign-in");
  if (!(await sendCode(pending))) return "You've asked for a few codes already. Wait a minute, then try again.";
  return { sent: true };
}
```

`checkCode`, `sendCode`, and `startSession` stand for your app's own, and
`pending_sign_in` is the cookie your server set when the password was right.
Then give the actions to the form:

```tsx
// app/sign-in/code/page.tsx
import { VerifyCodeForm } from "@/components/harmo/patterns/verify-code/VerifyCodeForm";
import { pendingAddress } from "@/lib/auth";
import { resendCode, verifyCode } from "./actions";

export default async function Page() {
  return (
    <VerifyCodeForm
      action={verifyCode}
      resendAction={resendCode}
      sentTo={await pendingAddress()}
      back={{ label: "Back to sign in", href: "/sign-in" }}
    />
  );
}
```

That's all it takes. The form sends itself once the code is whole, typed,
pasted, or filled in from a message, and shows your action's
[answer](#answers). Before you ship it, go through [Security](#security).

#### Without a server

Give `action` a plain async function instead, in a client component of yours,
since a server page can't pass a function. It gets the same `FormData`, and
returns the same answers:

```tsx
<VerifyCodeForm
  sentTo="sam@example.com"
  action={async (previous, data) => {
    const response = await fetch("/api/sign-in/code", { method: "POST", body: data });
    if (!response.ok) return "That code isn't right. Check it, or send a new one.";
    window.location.assign("/");
  }}
/>
```

`resendAction` can be a function too.

### Sending a new code

Give the form `resendAction`, and a line under the button offers a new code:
"Didn't get a code? Send a new code". It waits first, counting down, "Send a
new code in 0:24", for `resendAfter` seconds, 30 by default. Then it sends
the form's data through `resendAction`. Once that answers `{ sent: true }`,
the description says "We've sent a new code to sam@example.com.", and the
wait starts again. The wait only spares people from asking too soon: limit
new codes on your server, as [Security](#security) says.

### Codes from an authenticator app

Leave out `sentTo` and `resendAction`:

```tsx
<VerifyCodeForm action={verifyCode} back={{ label: "Back to sign in", href: "/sign-in" }} />
```

The description says "Enter the 6-digit code from your authenticator app.",
and there's no line to send a new code, since the app makes a new one every
30 seconds. Your `checkCode` checks the code against the secret the account
set up with the app.

### Confirming a phone number

Give it a title, the number as people write it, and a way back of yours:

```tsx
<VerifyCodeForm
  action={verifyPhone}
  resendAction={resendPhoneCode}
  resendAfter={60}
  title="Confirm your phone number"
  sentTo="+1 (555) 010-4821"
  groups={[3, 3]}
  back={{ label: "Use another number", href: "/settings/phone" }}
/>
```

`groups={[3, 3]}` splits the code with a dash, 123–456, as your message writes
it, and `resendAfter={60}` waits a minute between codes. End the text message
with your domain, as [Security](#security) says, so a phone offers the code
only on your site.

### Props

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState), which checks the code: a server action, or an async function of yours. It gets `(previous, data)`, `data` holding `code` and any `hiddenValues`, and returns one of the [answers](#answers) |
| `resendAction` | [Sends a new code](#sending-a-new-code), as a form action, with the same `data`. Without it, there's no line to send one |
| `resendAfter` | Seconds to wait before a new code can be sent, and between each: 30 by default |
| `sentTo` | Where the code went, such as an email or a phone number, shown as it is. Without it, the code is from an authenticator app |
| `title` | The title: "Enter the code" by default |
| `titleAs` | The title's tag: `"h1"` by default, or `"h2"` to `"h6"`. The Sign-in and Sign-up Forms pass their own |
| `length` | How many characters: 6 by default, kept from 4 to 12 |
| `characters` | `"numeric"`, the default, for digits only; `"alphanumeric"` for letters and digits, in capitals |
| `groups` | The groups' sizes, such as `[3, 3]`, with a dash after each that ends inside the code. None by default. [OTP Input](../components/otp-input.md#react) says more |
| `back` | The way back, in the band along the card's bottom: `{ label, href }`, a link. With `onBack` too, a plain click calls it instead of following the link; a click with a modifier key, such as for a new tab, still follows it. The Sign-in and Sign-up Forms use it to show their form again |
| `hiddenValues` | Values the form posts with the code and with a resend, each in a hidden input, such as `{ email }`. Never a secret, and never what your action goes by, as [Security](#security) says |
| `initialResult` | The answer to show before the action has given one |
| `ref` | The `<form>` |

### Answers

`action` returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"That code has expired. Send a new one."` | Shows it under the field. The field takes focus with its code selected, so typing replaces it, and the card shakes |
| `{ code: "…" }` | The same |
| `{ form: "…" }`, or a message for any other field | The same: the form has one place for a message, under the field. Several are joined there |

`resendAction` returns one of these:

| Return | The form |
| --- | --- |
| `{ sent: true }` | Says "We've sent a new code to …" in the description, and starts the wait again |
| A string, such as `"You've asked for a few codes already. Wait a minute, then try again."` | Shows it under the field, as above |
| `undefined` | Changes nothing |

If either action throws, or its promise rejects, the form shows "Something
went wrong. Try again." under the field. Next.js's `redirect()` and
`notFound()` work as usual.

```ts
type VerifyCodeResult = undefined | string | { code?: string; form?: string };
type ResendResult = undefined | string | { sent: true };
```

Both come from `VerifyCodeForm`, with `VerifyCodeAction` and `ResendAction`,
the actions' types. There's no `values`, as a code is never filled in again.
With JavaScript, the form calls your action itself, in a transition, rather
than as React's form action. [Patterns](README.md#actions) explains answers in
more depth.

### Without JavaScript

Given a server action, the form works before its script runs, or without one:

- It posts the code, and any hidden values, to your action, in the request's
  body, as React renders a form for one.
- Your framework runs the action, and renders the page again with its answer,
  under the field, which is empty again.
- The form doesn't send itself once the code is whole: Verify, or Enter, does.
  The field is a plain Input, without its slots, and `maxlength` keeps the
  code to its length. With letters, read the code in capitals, without spaces
  and dashes, as they keep the case they're typed in.
- "Send a new code" is a submit button that posts the same form to the resend
  action. It works from the start, with no countdown.
- The form's own checks and the shake don't run. Your action's checks are the
  ones that count.
- The way back is a link.
- In the Sign-in and Sign-up Forms, a post from the step goes to its own
  action, so on the page after it, the parent form starts where its
  `initialResult` says. Read the pending sign-in or sign-up from your cookie,
  and pass the Sign-in Form `{ step: "code", sentTo }`, or the Sign-up Form
  `{ step: "confirm", email }`.

Given a function of yours instead, the form needs JavaScript. A code sent
before the script has loaded is held, then sent once it has.

## HTML

### Markup

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <div class="hauth-form-header">
    <h1 class="hauth-form-title" tabindex="-1">Enter the code</h1>
    <p class="hauth-form-description" id="code-description" aria-live="polite">
      We sent a 6-digit code to <strong class="hauth-form-email">sam@example.com</strong>.
    </p>
  </div>
  <div class="hfield">
    <label class="hlabel" for="code">Code</label>
    <div class="hotp-input" dir="ltr">
      <input class="hinput" id="code" name="code" type="text" inputmode="numeric"
        autocomplete="one-time-code" autocorrect="off" spellcheck="false"
        maxlength="6" pattern="[0-9]{6}" value=""
        aria-describedby="code-error code-description" />
      <div class="hotp-input-slots" aria-hidden="true">…</div>
    </div>
    <p class="herror" id="code-error" aria-live="polite"></p>
  </div>
  <button class="hbutton" type="submit">
    <span class="hbutton-label">Verify</span>
  </button>
  <p class="hverify-code-resend">
    Didn't get a code?
    <button class="hlink hauth-form-action" type="submit" data-underlined formaction="/sign-in/code/resend">Send a new code</button>
  </p>
  <p class="hauth-form-footer">
    <a class="hlink" href="/sign-in">Back to sign in</a>
  </p>
</form>
```

Give the `<form>` an `action`, your server's endpoint for checking the code,
and the resend button a `formaction`, its endpoint for sending a new one. Both
then work even without a script. Load Harmo's CSS, then `auth-form.css` and
`verify-code.css`.

- **The slots**: the `…` is a `.hotp-input-slot` for each character, as
  [OTP Input](../components/otp-input.md#markup) has it.
- **Hidden values**: what the page shows with the code, such as the email
  being confirmed, can go in an `<input type="hidden">` after the header.
- **Without an address**, the description reads "Enter the 6-digit code from
  your authenticator app.", and the form has no `.hverify-code-resend`.

### Classes

| Class or attribute | What it's for |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The card, its parts spaced out, and its button as wide as it |
| `.hauth-form-header` | The title and where the code went |
| `.hauth-form-title` | The title. It shows no focus ring as it takes focus |
| `.hauth-form-description` | Where the code went |
| `.hauth-form-email` | The address. A long one breaks |
| `.hverify-code-resend` | The line under the button, its digits tabular |
| `.hauth-form-action` with `.hlink` on a `<button>` | "Send a new code", looking like a Link. With `aria-disabled="true"`, for the wait, it's dimmed |
| `.hauth-form-footer` | The band along the card's bottom, with the way back |
| `data-shake` on `.hauth-form` | Shakes the card once, unless reduced motion is asked for. Remove it at the form's own `animationend`, so the next failure shakes it again |

### What your script does

[verify-code.js](../../examples/html/src/scripts/verify-code.js) is an
example. The field is OTP Input's, set up as
[its script](../components/otp-input.md#what-a-script-does) does. Set up each
form on the page, and each one a script adds later, such as the Sign-in
Form's code step.

**As it starts:** if the form has a resend button, start the wait, below.

**As people type:** on `input` in the field, once OTP Input's script has
cleaned what was typed, take the error away. When the code is as long as its
`maxlength`, and has changed, call `requestSubmit()`.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script.
2. While the code is being checked, or a new one sent, ignore the submit.
3. Check the code. For nothing typed, put "Enter the code." in the field's
   `.herror`. For part of a code, "Enter all 6 digits.", its `maxlength`; with
   `data-characters="alphanumeric"` on `.hotp-input`, "characters" instead,
   such as "Enter all 8 characters.". Set `aria-invalid="true"` on the input,
   move focus to it, add `data-shake` to the form, and stop.
4. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label.
5. Send the form's data.
6. Show the answer:
   - nothing: leave the form as it is, as your server has redirected;
   - a message, or messages by field: put them in the field's `.herror`, with
     `aria-invalid="true"` on the input. Move focus to the field, select its
     code, so typing replaces it, and add `data-shake`;
   - a thrown error: "Something went wrong. Try again.", the same way.

**The wait:** set the resend button's text to "Send a new code in 0:30", with
`aria-disabled="true"`, and update it as each second passes, until "Send a
new code", without `aria-disabled`.

**On a click on the resend button:**

1. Call `preventDefault()`. While it waits, or while the code is being
   checked, do nothing else.
2. Take the error away. Send a new code with the form's data and the button
   as its submitter, `new FormData(form, button)`, with `aria-busy="true"` and
   `aria-disabled="true"` on the button meanwhile.
3. For `{ sent: true }`: put "We've sent a new code to" before the
   description's address, moving the element, never rewriting it as markup.
   Start the wait again.
4. For a message, or a thrown error's "Something went wrong. Try again.":
   take `aria-disabled` off, and show it as for a code turned down.

**The shake:** remove `data-shake` at the form's own `animationend`, not one
that bubbles up from inside it.

**The way back** is a link. In the Sign-in and Sign-up Forms, their scripts
show the form again.

## Security

The form checks the code's length for the person typing. It's not a defense:
anyone can send your action anything. Your server must:

- **Make each code at random**, with a cryptographic generator, and keep only
  its hash.
- **Make each code short-lived.** It expires, such as after 10 minutes, and
  works once.
- **Limit attempts**, so a 6-digit code can't be guessed: a few per code,
  such as five, then end the code; and a limit per account and per network
  address. Compare codes in constant time.
- **Limit how often a new code is sent**, per account and per address,
  whatever the page shows. The countdown only spares people from asking too
  soon; without JavaScript there's none, and anyone can post the resend as
  often as they like. Answer the same way whether or not the account exists.
- **Keep the pending sign-in on your server**, or the pending confirmation,
  named by an opaque id in an httpOnly, Secure, SameSite cookie, never in the
  page. Once the code is right, start the session with a new id.
- **Go by that cookie, never by the page.** Check the code, and send a new
  one, for what the cookie names. Ignore a hidden value posted with it, such
  as the email being confirmed, or turn the post down when it doesn't match:
  anyone can read and change a hidden value.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#never-trust-previous) explains.
- **Check the post comes from your site**, against cross-site request
  forgery, as Next.js does for server actions; elsewhere, check the `Origin`
  header, or use a CSRF token.
- **Bind text messages to your site.** `autocomplete="one-time-code"` lets a
  phone or a browser offer the code from its message. That's a convenience,
  not a defense: a look-alike site can ask for the code too, and someone can
  type it in. End a text message with your domain and the code, in the
  origin-bound format, `@example.com #123456`, and a phone offers it only on
  your site. Only passkeys resist such phishing.

The form itself keeps nothing. It holds the code only as its field's value,
and sends it in the request's body. It never logs it, stores it, or puts it
in the page's address.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **A recovery code**, with letters: `length={8} characters="alphanumeric"
  groups={[4, 4]}`, and words of your own for where it comes from. In HTML,
  build the field as [OTP Input](../components/otp-input.md#markup) does for
  letters.
- **Headings**: the title is an `<h1>`. On a page with its own `<h1>`, pass
  `titleAs="h2"`. In HTML, make the title an `<h2>`.
- **Start typing at once**: on a page that's only for the code, add
  `autoFocus` to the `OtpInput` in your copy, or `autofocus` to the input in
  HTML.
- **No way back**: leave out `back`. In HTML, leave out `.hauth-form-footer`.

## Accessibility

- The field is named "Code" by its label, and described by its error and by
  where the code went, through `aria-describedby`, so a screen reader reads
  all three on it.
- It's one text field, as an
  [OTP Input](../components/otp-input.md#accessibility) is: a screen reader
  meets one field, with the whole code as its value. The slots are
  `aria-hidden`.
- The error is a polite live region, in the page from the start, empty, so a
  screen reader reads its message as it appears. After an error, focus moves
  to the field, and after your action turns a code down, the code is
  selected. Without JavaScript, the server's message is in the page as it
  loads, read with the field.
- The description is a polite live region too, so "We've sent a new code" is
  read as it appears. The countdown isn't, so it isn't read every second.
- "Send a new code" is a `<button>`, since it does something rather than going
  somewhere. While it waits, it's `aria-disabled` rather than `disabled`, so
  it keeps focus, and pressing it again finds it.
- In the Sign-in and Sign-up Forms, the title takes focus as the step shows,
  so a screen reader reads where the form has got to. `tabindex="-1"` lets a
  script focus it, and keeps it out of the Tab order. It shows no focus ring,
  since it isn't a control.
- The shake only repeats what the error says, so reduced motion loses nothing.

## Design details

- A raised Card, as the [Sign-in Form](sign-in-form.md) is: at most 400px
  wide, with 42px (`--harmo-space-lg`) padding, its parts 26px
  (`--harmo-space-md`) apart.
- The title, "Enter the code" or your own, is 20px bold, its line trimmed to
  the top of its capitals with `text-box`.
- 6px (`--harmo-space-2xs`) under it, where the code went: "We sent a 6-digit
  code to sam@example.com.", 14px in `--harmo-color-text-secondary`, the
  address in medium weight in `--harmo-color-text`. With letters, it says
  "8-character code".
- The code is an OTP Input labelled "Code": 6 digits by default, or 4 to 12,
  digits or letters and digits, in groups split by a dash if you like.
- Verify is a [Button](../components/button.md) as wide as the form, with a
  spinner while your action checks the code.
- An error goes under the field, and shakes the card once: 12px each way, in
  300ms (`--harmo-duration-slow`). Under reduced motion it stays still.
  Typing takes the error away.
- With a way to send a new code, a line 10px (`--harmo-space-xs`) under the
  button, centered, 14px in `--harmo-color-text-secondary`: "Didn't get a
  code? Send a new code". While it waits, "Send a new code in 0:24" is in
  `--harmo-color-text-tertiary`, without its underline. Its digits are
  tabular, so the line doesn't shift as they change.
- A way back, if you give one, is a [Link](../components/link.md) in a tinted
  band along the card's bottom, as the other account forms have: "Back to sign
  in", or "Use another email" in the Sign-up Form.
