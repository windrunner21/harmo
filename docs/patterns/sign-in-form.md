# Sign-in Form

A form that signs someone in with their email and password, with a link to
reset the password, ready to copy into your app. It can ask for a two-factor
code, and offer other accounts to sign in with, such as Google.

It's a raised [Card](../components/card.md) with a
[Field](../components/field.md) and [Input](../components/input.md) for the
email, a [Password Input](../components/password.md), a
[Link](../components/link.md), and [Buttons](../components/button.md), in
React and in HTML.

## Try the demo

The playground's examples answer as a server would, after a moment. Type these
to see each answer:

| Example | Type | You see |
| --- | --- | --- |
| Any | Nothing, or an email such as `sam@example` | The form's own checks, before anything is sent: "Enter your email address." or "Enter an email address, such as name@example.com." under the email, and "Enter your password." under an empty password |
| Any | Any email but `error@example.com`, and a password other than `harmo` | "The email or password is incorrect." under the password, which takes focus, and the card shakes |
| All but the two-factor one | Email `new@example.com`, password `harmo` | "Confirm your email address first. We've sent you a new link." under the email, which takes focus |
| All but the two-factor one | Email `error@example.com`, any password | "Something went wrong. Try again." under the password, as when the server can't be reached |
| All but the two-factor one | Any other email, password `harmo` | The button works for a moment, then a toast says "Signed in", where your own action would redirect |
| With a two-factor code | Any email, password `harmo` | The code step, "Verify it's you", saying "We sent a 6-digit code to" the email you typed |
| With a two-factor code | Code `123456` | The form sends itself as the last digit arrives, then a toast says "Signed in", where your own action would redirect |
| With a two-factor code | Any other six digits, such as `111111` | "That code isn't right. Check it, or send a new one." under the code, which is selected, so typing replaces it |
| With a two-factor code | Code `000000` | "Something went wrong. Try again." under the code, as when the server can't be reached |
| With a two-factor code | Fewer than six digits, then Verify | "Enter all 6 digits." under the code |
| With a two-factor code | "Send a new code", once its 30-second wait ends | "We've sent a new code to" the email, and the wait starts again |
| With a two-factor code | "Back to sign in" | The form again, with what you typed |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, and a script of your own, as [HTML](#html) says |
| Accounts | Where your users are kept, with a hash of each password, and whether each email is confirmed |
| Sessions | Somewhere to keep each session, named by a cookie |
| A rate limit | On sign-in attempts, per account and per network address |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves |
| Email | Only to send a new confirmation link to an email that isn't confirmed yet, as the example's message says |
| Codes | Only for the [two-factor step](#two-factor-step): an email or text message your server sends, or an authenticator app, and [Verify Code](verify-code.md)'s actions, which check a code and send a new one |
| Pending sign-ins | Only for the two-factor step: server state for a sign-in whose password was right, until its code is |
| A sign-in route per account | Only for [other accounts](#other-accounts): a route of yours for each, such as `/auth/google`, the route the account sends people back to, and its logo |
| Your site's origin | Only to send people back where they came from after signing in, such as `?next=/reports`, from your config |

[Security](#security) says what each of these must do.

## React

### Install

```sh
npx harmo-ui add sign-in-form
```

It copies into `components/harmo/patterns/`:

- `sign-in-form/SignInForm.tsx`, the form;
- `auth-form/`, the look and helpers the account forms share;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card between steps;
- `verify-code/`, [Verify Code](verify-code.md), the code step.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), and set them
up as [Patterns](README.md#install) says.

### Use it

Write a server action that checks the password and answers. In a Next.js app:

```ts
// app/sign-in/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SignInFormResult } from "@/components/harmo/patterns/sign-in-form/SignInForm";
import { checkPassword, startSession } from "@/lib/auth";

export async function signIn(previous: SignInFormResult, data: FormData): Promise<SignInFormResult> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const user = await checkPassword(email, password);
  if (!user) return { form: "The email or password is incorrect.", values: { email } };
  if (!user.emailConfirmed) {
    return { email: "Confirm your email address first. We've sent you a new link.", values: { email } };
  }
  (await cookies()).set("session", await startSession(user), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}
```

`checkPassword` and `startSession` stand for your app's own. Then give the
action to the form:

```tsx
// app/sign-in/page.tsx
import { SignInForm } from "@/components/harmo/patterns/sign-in-form/SignInForm";
import { signIn } from "./actions";

export default function SignInPage() {
  return <SignInForm action={signIn} forgotPasswordHref="/reset-password" signUpHref="/sign-up" />;
}
```

That's all it takes. The form checks the fields, shows the button working
while your action runs, and shows its [answer](#answers). Before you ship it,
go through [Security](#security).

#### Without a server

Give `action` a plain async function instead. It gets the same `FormData`, and
returns the same answers:

```tsx
<SignInForm
  action={async (previous, data) => {
    const response = await fetch("/api/sign-in", { method: "POST", body: data });
    if (!response.ok) return "The email or password is incorrect.";
    window.location.assign("/");
  }}
  forgotPasswordHref="/reset-password"
/>
```

### Two-factor step

Pass `twoFactor`, and the right password can ask for a code. Your action
answers `{ step: "code", sentTo }`, and [Verify Code](verify-code.md) takes the
form's place, titled "Verify it's you" and saying where the code went: "We sent
a 6-digit code to sam@example.com.", or, without `sentTo`, that the code is
from an authenticator app. "Back to sign in" brings the form back, with what
was typed.

Once the password is right, start a pending sign-in on your server, put its id
in a cookie, send the code, and answer with the step:

```ts
// app/sign-in/actions.ts
"use server";

import { cookies } from "next/headers";
import type { SignInFormTwoFactorResult } from "@/components/harmo/patterns/sign-in-form/SignInForm";
import { checkPassword, sendCode, startPendingSignIn } from "@/lib/auth";

export async function signIn(previous: SignInFormTwoFactorResult, data: FormData): Promise<SignInFormTwoFactorResult> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const user = await checkPassword(email, String(data.get("password") ?? ""));
  if (!user) return { form: "The email or password is incorrect.", values: { email } };
  (await cookies()).set("pending_sign_in", await startPendingSignIn(user), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  await sendCode(user);
  return { step: "code", sentTo: user.email };
}
```

The code step needs two more actions, `verifyCode`, which reads the cookie and
checks the code, and `resendCode`, which sends a new one. Write them as
[Verify Code](verify-code.md#use-it) does, in `app/sign-in/code/actions.ts`,
then give all three to the form:

```tsx
// app/sign-in/page.tsx
import { SignInForm } from "@/components/harmo/patterns/sign-in-form/SignInForm";
import { pendingAddress, pendingSignIn } from "@/lib/auth";
import { signIn } from "./actions";
import { resendCode, verifyCode } from "./code/actions";

export default async function SignInPage() {
  return (
    <SignInForm
      action={signIn}
      forgotPasswordHref="/reset-password"
      twoFactor={{ action: verifyCode, resendAction: resendCode, backHref: "/sign-in/cancel" }}
      initialResult={(await pendingSignIn()) ? { step: "code", sentTo: await pendingAddress() } : undefined}
    />
  );
}
```

`initialResult` and `backHref` keep the step working without JavaScript, as
[Without JavaScript](#without-javascript) says. `backHref` leads to a route
that ends the pending sign-in:

```ts
// app/sign-in/cancel/route.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endPendingSignIn } from "@/lib/auth";

export async function GET() {
  await endPendingSignIn();
  (await cookies()).delete("pending_sign_in");
  redirect("/sign-in");
}
```

`startPendingSignIn`, `sendCode`, `pendingSignIn`, `pendingAddress`, and
`endPendingSignIn` stand for your app's own. A new `signIn` replaces any
pending sign-in.

`twoFactor` takes:

| Key | |
| --- | --- |
| `action` | Required. Verify Code's [`action`](verify-code.md#props), which checks the code |
| `resendAction` | Verify Code's `resendAction`, which sends a new code. Without it, there's no "Send a new code" |
| `length`, `characters`, `groups` | The code's length, characters, and groups, as Verify Code's are: 6 digits by default |
| `backHref` | Where "Back to sign in" leads without JavaScript. The page itself by default |

### Other accounts

Pass `providers`, and other accounts to sign in with follow the button:

```tsx
<SignInForm
  action={signIn}
  forgotPasswordHref="/reset-password"
  providers={[
    { name: "Google", icon: <GoogleIcon className="hicon" />, href: "/auth/google" },
    { name: "GitHub", icon: <GitHubIcon className="hicon" />, href: "/auth/github" },
  ]}
/>
```

- **Each is a link** to your server's route that starts signing in with that
  account, such as `/auth/google`, as [Security](#security) says.
- **Give the [Sign-up Form](sign-up-form.md) the same accounts**, leading to
  the same routes, so one someone signed up with is there to sign in with.
  [Account Forms](account-forms.md) gives its `providers` to both.
- **Bring each logo yourself**, as the account's own sign-in guidelines show
  it: [Google's](https://developers.google.com/identity/branding-guidelines)
  four-color G,
  [Apple's](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
  and [GitHub's](https://github.com/logos) marks in one color, as
  `currentColor`, and
  [Microsoft's](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps)
  four squares.

### Props

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState): a server action, or an async function of yours. It gets `(previous, data)`, `data` holding the `email` and `password`, and returns one of the [answers](#answers) |
| `forgotPasswordHref` | Required. Where "Forgot your password?" leads |
| `forgotPasswordAt` | Where that link sits: `"label"`, beside the password's label, by default; or `"below"`, under the field |
| `signUpHref` | Where "Sign up" leads, in a band under the button: "Don't have an account? Sign up". Without it, there's no band |
| `providers` | [Other accounts](#other-accounts) to sign in with, each `{ name, icon, href }`: its name, such as `"Google"`; its logo, an element with the class `hicon`; and your route that starts signing in with it. Their type is `SignInProvider` |
| `twoFactor` | A [code step](#two-factor-step) after the password: `{ action, resendAction?, length?, characters?, groups?, backHref? }`. Its type is `SignInTwoFactor` |
| `initialResult` | The answer to show before the action has given one, such as `{ step: "code", sentTo }` for a sign-in waiting for its code |
| `titleAs` | The tag of the title and the code step's: `"h1"` by default, or `"h2"` to `"h6"` |

### Answers

Your action returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"The email or password is incorrect."` | Shows it under the password, moves focus there, and shakes the card |
| Messages by field, such as `{ email: "Confirm your email address first. We've sent you a new link." }` | Shows each under its field, `email` or `password`, moves focus to the first, the email first, and shakes the card. `form`, or a message for a field the form doesn't have, goes under the password |
| The same with `values: { email }` | As above, and without JavaScript, fills in the email again. Never the password |
| `{ step: "code", sentTo? }` | Only with `twoFactor`. Shows the code step |

If the action throws, or its promise rejects, the form shows "Something went
wrong. Try again." under the password. Next.js's `redirect()` and `notFound()`
work as usual.

```ts
type SignInFormMessages = {
  email?: string;
  password?: string;
  form?: string;
  values?: { email?: string };
};
type SignInFormResult = undefined | string | SignInFormMessages;
// With twoFactor:
type SignInFormTwoFactorResult = SignInFormResult | { step: "code"; sentTo?: string };
```

With JavaScript, the form calls your action itself, in a transition, rather
than as React's form action, so what was typed stays after a message.
[Patterns](README.md#actions) explains answers in more depth.

### Without JavaScript

Given a server action, the form works before its script runs, or without one:

- It posts the email and password to your action, in the request's body, as
  React renders a form for one.
- Your framework runs the action, and renders the page again with its answer.
  The page is new, so the fields start empty: answer with `values: { email }`,
  and the email is filled in again. The password never is.
- The form's own checks and the shake don't run. Your action's checks are the
  ones that count.
- The links, "Forgot your password?", "Sign up", and the other accounts, work
  as usual.
- With the two-factor step, the code's form posts to Verify Code's action, and
  the page after it renders the Sign-in Form again. Read the pending sign-in
  from your cookie into `initialResult`, and it starts at the code step.
  "Back to sign in" is a link to `twoFactor.backHref`: point it at a route
  that ends the pending sign-in, or it shows the code step again.

Given a function of yours instead, the form needs JavaScript. A submit made
before the script has loaded is held, then sent once it has.

## HTML

### Markup

```html
<form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
  <h1 class="hauth-form-title">Sign in</h1>
  <div class="hauth-form-fields">
    <div class="hfield">
      <label class="hlabel" for="sign-in-email">Email</label>
      <input class="hinput" id="sign-in-email" name="email" type="email"
        autocomplete="username" aria-describedby="sign-in-email-error" />
      <p class="herror" id="sign-in-email-error" aria-live="polite"></p>
    </div>
    <div class="hfield">
      <div class="hfield-label-row">
        <label class="hlabel" for="sign-in-password">Password</label>
        <a class="hlink hfield-label-end" href="/reset-password">Forgot your password?</a>
      </div>
      <div class="hpassword">
        <input class="hinput" id="sign-in-password" name="password" type="password"
          autocomplete="current-password" aria-describedby="sign-in-password-error" />
        …
      </div>
      <p class="herror" id="sign-in-password-error" aria-live="polite"></p>
    </div>
  </div>
  <button class="hbutton" type="submit">
    <span class="hbutton-label">Sign in</span>
  </button>
</form>
```

Give the `<form>` an `action`, your server's endpoint for signing in, and it
signs someone in even without a script. The `…` is
[Password Input](../components/password.md)'s toggle, with its Tooltip. Load
Harmo's CSS, then `auth-form.css`, and with the two-factor step,
`verify-code.css`.

With the link under the field, the field and the link go in
`.hauth-form-password`:

```html
<div class="hauth-form-password">
  <div class="hfield">
    <label class="hlabel" for="sign-in-password">Password</label>
    …
  </div>
  <a class="hlink hauth-form-forgot" href="/reset-password">Forgot your password?</a>
</div>
```

Other accounts go after the button, under "or":

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

A link to sign up goes last, in a band:

```html
<p class="hauth-form-footer">
  Don't have an account? <a class="hlink" data-underlined href="/sign-up">Sign up</a>
</p>
```

For the two-factor step, your script adds
[Verify Code's markup](verify-code.md#markup) after the form once the password
is right, titled "Verify it's you", with "Back to sign in" in its band, a link
to this page.

### Classes

| Class or attribute | What it's for |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The form, its parts spaced out, and its `.hbutton` as wide as it |
| `.hauth-form-title` | The title. It shows no focus ring when it takes focus |
| `.hauth-form-fields` | The fields |
| `.hauth-form-password` | The password field with the link under it |
| `.hauth-form-forgot` | The link under the field |
| `.hauth-form-divider` | "or", between two lines |
| `.hauth-form-providers` | The other accounts' Buttons. With four or more not `hidden`, two to a row |
| `.hauth-form-footer` | The band along the card's bottom |
| `data-shake` on the form | Shakes it once, unless reduced motion is asked for. Remove it at the form's own `animationend`, so the next failure shakes it again |

### What your script does

[sign-in-form.js](../../examples/html/src/scripts/sign-in-form.js) is an
example. The password's toggle uses Password Input's example script,
`password.js`, and the code step Verify Code's, `verify-code.js`, which sets up
its card as it arrives. The card's change of size between steps is
`change-step.js`'s, which the forms' scripts share.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script, so
   the page's own errors show rather than the browser's bubbles.
2. Check each field. Put an error in the `.herror` of each one that's empty,
   "Enter your email address." or "Enter your password.", or, for the email,
   isn't an address, "Enter an email address, such as name@example.com.", and
   clear the other's. If either has one, show the errors, as in step 6, and
   stop.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another sign-in meanwhile.
4. Send the email and password.
5. Show the answer:
   - nothing: leave the form as it is, as your server has redirected;
   - a message: put it in the password's `.herror`;
   - messages by field, such as `{ email: "…" }`: put each in its own field's
     `.herror`, and one for a field the form doesn't have in the password's;
   - a request that fails: "Something went wrong. Try again." in the
     password's `.herror`;
   - with the two-factor step, `{ step: "code", sentTo }`: show the code step,
     below.
6. For each error, put `aria-invalid="true"` on its input. Move focus to the
   first field with one, the email first, and add `data-shake` to the form.

**The code step:**

- Add Verify Code's card after the form, its title with the tag of the form's
  own, and the address in it as text, never as markup. Set `hidden` on the
  form.
- Move focus to the card's title with `focus({ preventScroll: true })`, then
  `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
  asked for.
- On a plain click on "Back to sign in", with the main button and no modifier
  key, keep the browser from following it. Remove the card and the form's
  `hidden`, and move focus to the form's title the same way, giving it
  `tabindex="-1"` first.
- Animate each change, to the code step and back, as
  [Moving between steps](README.md#moving-between-steps) says.

**As people type:** on `input` in a field, take its error away. Remove
`data-shake` at the form's own `animationend`, not one that bubbles up from
inside it.

## Security

The form checks fields for the person typing. It's not a defense: anyone can
send your action anything. Your server must:

- **Answer an unknown email and a wrong password the same way**, in the same
  time, checking a password hash for an unknown email too. "The email or
  password is incorrect." doesn't say which was wrong, so the form can't tell
  anyone which emails have accounts. Say more, such as that an email isn't
  confirmed, only once the password is right.
- **Limit attempts**, per account and per network address, slowing or
  stopping them after a few, so passwords can't be guessed.
- **Set the session in an httpOnly, Secure, SameSite cookie**, with a new id
  at each sign-in.
- **Keep a pending sign-in on the server**, with the two-factor step, named by
  an opaque, short-lived id in such a cookie, until its code is right, as
  [Verify Code](verify-code.md#security) says.
- **Send people on only to a page on your own site.** Otherwise a link could
  sign someone in, then send them to a look-alike site. To send them back
  where they came from, such as `?next=/reports`, read `next` against your
  site's origin, from your config, and go on to it only if it stays there:

  ```ts
  const url = URL.canParse(next, origin) ? new URL(next, origin) : null; // origin: "https://app.example.com", from your config
  redirect(url?.origin === origin ? url.href : "/");
  ```

  Checking the text isn't enough: `?next=/%09/evil.example` reads as `/`, a
  tab, then `/evil.example`, and the browser drops the tab, which leaves
  `//evil.example`, another site. Nor is checking the path alone:
  `/.//evil.example` stays on your origin, but its path, `//evil.example`, is
  that site again. So redirect to the whole `url.href`.
- **Start each other account's sign-in on your server**, at a route of yours
  such as `/auth/google`. It makes a random `state` and a PKCE verifier, keeps
  them in an httpOnly cookie, and sends the person on. The route the account
  sends them back to checks the `state` matches before it signs anyone in.
  Never put a secret in the `href`.
- **Link another account to one here by its email only when both are
  confirmed**: your account's address is confirmed, and the other account says
  its email is verified, as the [Sign-up Form](sign-up-form.md#security) says.
  Otherwise someone could make an account in someone else's name first, and
  keep a way into it.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#never-trust-previous) explains.
- **Give back in `values` only the email**, naming it. TypeScript turns down a
  password in `values` written out in the answer, but not in an object built
  elsewhere, such as `Object.fromEntries(data)`, which holds every field the
  form posts. Never pass that.
- **Check the post comes from your site**, against cross-site request
  forgery, as Next.js does for server actions; elsewhere, check the `Origin`
  header, or use a CSRF token.

The form itself:

- **Posts the email and password in the request's body**, never in the
  address, so a form sent before its script runs keeps them out of the
  browser's history and the server's logs.
- **Keeps what was typed out of its links**: "Forgot your password?" never
  carries the email.
- **Never logs or stores what's typed.** The password is only the field's
  value, sent with the form, and never filled in from `values`.
- **Posts only the code** from the code step's form. Nothing secret is in the
  page.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **Focus on load**: on a page that's only for signing in, add `autoFocus` to
  the email's Input, or `autofocus` in HTML, so typing can start at once.
- **Headings**: the title is an `<h1>`. On a page with its own `<h1>`, pass
  `titleAs="h2"`, which the code step's title follows too. In HTML, make both
  titles `<h2>`s.
- **The link's place**: under the field, it sits at the field's end. To put it
  at the start, change `.hauth-form-forgot`'s `justify-self` to `start`.
- **In a Dialog**: inside a Dialog's body, the form drops its own frame and
  padding, and its title steps down to 16px semibold, under the Dialog's
  title. [Account Forms](account-forms.md) shows sign-in in a Dialog.

## Accessibility

- Each field is named by its label, and its error is read with it, through
  `aria-describedby`.
- Errors are polite live regions, in the page from the start, empty, so a
  screen reader reads each one as it appears, after the field that takes
  focus.
- `autocomplete="username"` and `"current-password"` let a password manager
  fill in the account it saved for this site, and only for it.
- "Forgot your password?" is a link that Tab reaches. Beside the label, it
  comes before the password field; under the field, after it.
- "or" is text a screen reader reads, so the links after it read as another
  way to sign in. Their logos are hidden from it, with `aria-hidden`.
- Two to a row, each link is named "Continue with" its account by
  `aria-label`, which holds the word it shows, so speech input that says
  "Google" finds it.
- The shake only repeats what the error says, so reduced motion loses
  nothing: the form stays still, and the error says what went wrong.
- At the code step, focus moves to the step's title: a heading with
  `tabindex="-1"`, which a screen reader reads as it takes focus. "Back to
  sign in" moves focus to the form's title the same way. Neither shows a
  focus ring, since a title isn't a control.

## Design details

- A raised Card, at most 400px wide, with 42px (`--harmo-space-lg`) padding:
  the title, the fields, and a button as wide as the form, 26px
  (`--harmo-space-md`) apart. The fields are 16px (`--harmo-space-sm`) apart.
- The title is 20px bold, its line trimmed to the top of its capitals with
  `text-box`, so the padding above it reads as the padding below the button
  does. Firefox doesn't trim it yet, and leaves a few pixels more.
- "Forgot your password?" sits at the end of the password's label row, at the
  label's size. Or it sits under the field, at its end, 6px under it.
- While your action runs, the button shows it's working, as a loading
  [Button](../components/button.md) does.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`). Under reduced motion it stays still.
- Other accounts follow the button, as the
  [Sign-up Form](sign-up-form.md)'s do: "or", 13px in
  `--harmo-color-text-tertiary`, between two 1px `--harmo-color-border` lines
  that fill the form's width, then a secondary Button for each, a link with
  the account's logo, drawn at 20px, before its name. Up to three read
  "Continue with Google", each as wide as the form, 10px (`--harmo-space-xs`)
  apart. Four or more go two to a row, each showing only the account's name.
- With a page to sign up on, "Don't have an account? Sign up" sits in a band
  along the card's bottom edge, as the Sign-up Form's line to sign in does:
  tinted `--harmo-color-background-secondary`, inset 6px (`--harmo-space-2xs`)
  from the card's sides and bottom, so the card frames it, with 4px corners.
  Its line is 14px, centered, in `--harmo-color-text-secondary`, with 16px
  above and below it, and its link is underlined. What's above it ends 42px
  over it, as the title starts 42px under the card's top edge.
- The code step takes the form's place: the card grows or shrinks to its
  size, easing out (`--harmo-ease-out-cubic`), 200ms
  (`--harmo-duration-normal`) for a small change, plus half a millisecond per
  pixel, up to 350ms. What leaves goes at once, and what arrives fades in over
  200ms, laid out where it will end. Under reduced motion, the card takes its
  new size at once, and only the fade plays.
