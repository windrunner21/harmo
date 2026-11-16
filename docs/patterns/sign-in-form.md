# Sign-in Form

A form that signs someone in with their email and password, with a link to
reset the password, ready to copy into your app. You can add a two-factor
code, and other accounts to sign in with, such as Google.

It's a raised [Card](../components/card.md) with a
[Field](../components/field.md) and [Input](../components/input.md) for the
email, a [Password Input](../components/password.md), a
[Link](../components/link.md), and [Buttons](../components/button.md). It
comes in React and in HTML.

## Try the demo

The playground's examples answer as a server would, after a moment. Type these
to see each answer:

| Example | Type | You see |
| --- | --- | --- |
| Any | Nothing, or an email such as `sam@example` | The form's own checks, before anything is sent: "Enter your email address." or "Enter an email address, such as name@example.com." under the email, and "Enter your password." under an empty password |
| Any | Any email but `error@example.com`, and a password other than `harmo` | "The email or password is incorrect." under the password, which takes focus, and the card shakes |
| All but the two-factor one | Email `new@example.com`, password `harmo` | "Confirm your email address first. We've sent you a new link." under the email, which takes focus |
| All but the two-factor one | Email `error@example.com`, any password | "Something went wrong. Try again." under the password, as when the server can't be reached |
| All but the two-factor one | Any other email, password `harmo` | The button works for a moment, then nothing changes: you're signed in. Your own action would redirect |
| With a two-factor code | Any email, password `harmo` | The code step, "Verify it's you", saying "We sent a 6-digit code to" the email you typed |
| With a two-factor code | Code `123456` | The form sends itself as the last digit arrives, then nothing changes: the code is right. Your own action would redirect |
| With a two-factor code | Any other six digits, such as `111111` | "That code isn't right. Check it, or send a new one." under the code, which is selected, so typing replaces it |
| With a two-factor code | Code `000000` | "Something went wrong. Try again." under the code, as when the server can't be reached |
| With a two-factor code | Fewer than six digits, then Verify | "Enter all 6 digits." under the code |
| With a two-factor code | "Send a new code", once its 30-second wait ends | "We've sent a new code to" the email, and the wait starts again |
| With a two-factor code | "Back to sign in" | The form again, with what you typed |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. The CLI copies the Harmo components the pattern uses |
| HTML | Harmo's CSS, and your own script; [HTML](#html) says what it does |
| Without JavaScript | A framework that runs React server actions, such as Next.js with its App Router |
| Node.js | 20 or newer, which Next.js needs anyway. The code on this page needs nothing newer |
| Accounts | Where your users are kept, with a hash of each password, and whether each email is confirmed |
| Sessions | Somewhere to keep each session, named by a cookie that's httpOnly, Secure, and SameSite, with a new id at each sign-in |
| A rate limit | On sign-in attempts, per account and per network address, as [Security](#security) says |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves. Then check the `Origin` header, or use a CSRF token |
| Email | Only if your action sends a new confirmation link to an email that isn't confirmed yet, as the example's message says |
| Codes | Only for the [two-factor step](#two-factor-step). Where each code comes from: an email or text message your server sends, or an authenticator app. And [Verify Code](verify-code.md)'s actions, which check a code and send a new one |
| Pending sign-ins | Only for the two-factor step. Server state for a sign-in whose password was right, until its code is, named by an opaque, short-lived id in a cookie |
| A sign-in route per account | Only for [other accounts](#other-accounts). A route on your server for each, such as `/auth/google`, that starts its sign-in, and the route the account sends people back to. And each account's logo |
| Your site's origin | Only if you send people back where they came from after signing in, such as `?next=/reports`. From your config, as [Security](#security) says |

## Install

```sh
npx harmo-ui add sign-in-form
```

This copies into `components/harmo/patterns/`:

- `sign-in-form/SignInForm.tsx`, the form;
- `auth-form/`: `auth-form.css`, the look the account forms share, and
  `authForm.ts`, their shared helpers for inboxes and links;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card to its code step;
- `verify-code/`: [Verify Code](verify-code.md), the code step,
  `VerifyCodeForm.tsx` and `verify-code.css`.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`.

Without the CLI, copy
[SignInForm.tsx](../../examples/react/src/patterns/sign-in-form/SignInForm.tsx),
[auth-form.css](../../examples/react/src/patterns/auth-form/auth-form.css),
[authForm.ts](../../examples/react/src/patterns/auth-form/authForm.ts),
[formAction.ts](../../examples/react/src/patterns/form-action/formAction.ts),
[useStepMotion.ts](../../examples/react/src/patterns/step-motion/useStepMotion.ts),
and Verify Code's files, as [its page](verify-code.md#install) says. Then set
them up as [Patterns](README.md#install) says. For HTML, copy the
[markup](#markup) and the stylesheets.

## Use it

In a Next.js app, write a server action that checks the password and answers:

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

`checkPassword` and `startSession` stand for your app's own. `checkPassword`
answers the same way, in the same time, for an unknown email and a wrong
password.

Then give it to the form:

```tsx
// app/sign-in/page.tsx
import { SignInForm } from "@/components/harmo/patterns/sign-in-form/SignInForm";
import { signIn } from "./actions";

export default function SignInPage() {
  return <SignInForm action={signIn} forgotPasswordHref="/reset-password" signUpHref="/sign-up" />;
}
```

That's all it takes. When someone signs in, the form checks the fields first,
shows the button working while your action runs, and shows its answer. It
works without JavaScript too: the browser posts the form, and the page Next.js
renders after the post shows the answer, with the email `values` gives back
filled in again.

Before you ship it, add a rate limit, as [Security](#security) says. To send
people back where they came from, check where first, as it says too.

### Without a server

Give `action` a plain async function instead. It gets the same `FormData`, and
returns the same answers. The form then needs JavaScript: React holds a submit
made before the page's JavaScript has loaded, and sends it once it has.

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

## Two-factor step

Pass `twoFactor`, and the right password can ask for a code. Your action
answers `{ step: "code", sentTo }`, and [Verify Code](verify-code.md) takes the
form's place:

- Its title is "Verify it's you". It says where the code went, "We sent a
  6-digit code to sam@example.com.", or, without `sentTo`, that the code is
  from an authenticator app.
- The card grows or shrinks from the form's size to its own, as
  [Reset Password](reset-password.md)'s steps do, its content fading in, and
  its title takes focus.
- The form stays in the page, `hidden`, with what was typed. "Back to sign
  in", in the band along the card's bottom, brings it back, and moves focus to
  its title.

In the action, once the password is right, start a pending sign-in on your
server, put its id in an httpOnly cookie, send the code, and answer with the
step:

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

The code step needs two more actions: `verifyCode`, which reads the cookie and
checks the code, and `resendCode`, which sends a new one. Write them as
[Verify Code](verify-code.md) does, in `app/sign-in/code/actions.ts`. Then give
all three to the form:

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
      twoFactor={{ action: verifyCode, resendAction: resendCode }}
      initialResult={(await pendingSignIn()) ? { step: "code", sentTo: await pendingAddress() } : undefined}
    />
  );
}
```

`startPendingSignIn`, `sendCode`, `pendingSignIn`, and `pendingAddress` stand
for your app's own.

`initialResult` matters without JavaScript. The code's form posts to Verify
Code's action, not to `signIn`, so the page after that post renders the
Sign-in Form again. Read the pending sign-in from your cookie, as above, and
the form starts at the code step.

For the same reason, "Back to sign in" needs a way to end the pending
sign-in without JavaScript. Otherwise it reloads the page, which reads the
cookie, and shows the code step again. Give `twoFactor.backHref` a route that
deletes the cookie and comes back:

```ts
// app/sign-in/cancel/route.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endPendingSignIn } from "@/lib/auth";

export async function GET() {
  await endPendingSignIn(); // yours: forgets the pending sign-in on your server
  (await cookies()).delete("pending_sign_in");
  redirect("/sign-in");
}
```

```tsx
twoFactor={{ action: verifyCode, resendAction: resendCode, backHref: "/sign-in/cancel" }}
```

With JavaScript, "Back to sign in" brings the form back in place, without
following the link. Your next `signIn` replaces the pending sign-in.

`twoFactor` takes:

| Key | |
| --- | --- |
| `action` | Required. Verify Code's [`action`](verify-code.md#props), which checks the code |
| `resendAction` | Verify Code's `resendAction`, which sends a new code. Without it, there's no "Send a new code" |
| `length`, `characters`, `groups` | The code's length, characters, and groups, as Verify Code's are: 6 digits by default |
| `backHref` | Where "Back to sign in" leads without JavaScript, such as a route that ends the pending sign-in. The page itself by default |

## Other accounts

Pass `providers` to add other accounts to sign in with, under the button:

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
  account, such as `/auth/google`. It's the same route the
  [Sign-up Form](sign-up-form.md)'s Button for it leads to.
  [Security](#security) says what the route does. Being links, they need no
  script, and work without JavaScript.
- **Up to three** read "Continue with Google", each as wide as the form.
- **Four or more** go two to a row, each showing the account's name, "Google".
  `aria-label` still names it "Continue with Google", so it says what it does.
- **Give the Sign-up Form the same accounts**, so one someone signed up with is
  there to sign in with. Both read "Continue with Google", so an account reads
  the same on both forms. With [Account Forms](account-forms.md), its
  `providers` goes to both.
- **Bring each logo yourself**, as the account's own sign-in guidelines show
  it: [Google's](https://developers.google.com/identity/branding-guidelines)
  four-color G,
  [Apple's](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
  and [GitHub's](https://github.com/logos) marks in one color, as
  `currentColor`, and
  [Microsoft's](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps)
  four squares. A Button draws any `.hicon` at 20px.

## Props

| Prop | |
| --- | --- |
| `action` | Required. Your [form action](https://react.dev/reference/react/useActionState): a server action marked `"use server"`, or an async function of yours. It gets `(previous, data)`, where `data` is the form's `FormData`, with its `email` and `password`. What it returns is in [Answers](#answers) |
| `forgotPasswordHref` | Required. Where "Forgot your password?" leads |
| `forgotPasswordAt` | Where the link sits: `"label"`, the default, beside the password's label; or `"below"`, under the field |
| `signUpHref` | Where "Sign up" leads, in a band under the button: "Don't have an account? Sign up". Without it, there's no band |
| `providers` | Other accounts to sign in with, under the button, each `{ name, icon, href }`: the account's name, such as `"Google"`; its logo, an element with the class `hicon`; and your server's route that starts signing in with it. [Other accounts](#other-accounts) has more |
| `twoFactor` | A code step after the password: `{ action, resendAction?, length?, characters?, groups?, backHref? }`, as [Two-factor step](#two-factor-step) says. Without it, there's no such step, and `action`'s type has none |
| `initialResult` | The answer to show before the action has given one, such as `{ step: "code", sentTo }` for a sign-in your server says is waiting for its code |
| `titleAs` | The tag of the title and the code step's: `"h1"` by default, or `"h2"` to `"h6"`, such as `"h2"` on a page with its own `<h1>` |

The types of `providers`' items and of `twoFactor` are `SignInProvider` and
`SignInTwoFactor`.

## Answers

Your action returns one of these:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"The email or password is incorrect."` | Shows it under the password, moves focus there, and shakes the card |
| Messages by field, such as `{ email: "Confirm your email address first. We've sent you a new link." }` | Shows each under its field, `email` or `password`, moves focus to the first, the email first, and shakes the card. `form`, or a message for a field the form doesn't have, goes under the password |
| The same with `values: { email }` | As above. Without JavaScript, the email is filled in again on the page after the post. Never the password |
| `{ step: "code", sentTo? }` | Only with `twoFactor`. Shows the code step, as [Two-factor step](#two-factor-step) says |

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

TypeScript checks your answers against these types. With JavaScript, the form
calls your action itself, in a transition, rather than as React's form action.
So what was typed stays after a message, and a thrown error shows the message
rather than your error boundary. [Patterns](README.md#actions) explains
answers in more depth.

## Security

The form checks fields for the person typing. It's not a defense: anyone can
send your action anything. Your server must:

- **Answer an unknown email and a wrong password the same way**, in the same
  time, checking a password hash for an unknown email too. The examples'
  message, "The email or password is incorrect.", doesn't say which was wrong.
  Keep yours that way, so the form can't tell anyone which emails have
  accounts. Say more, such as that an email isn't confirmed, only once the
  password is right.
- **Limit attempts**, per account and per network address, slowing or
  stopping them after a few, so passwords can't be guessed.
- **Set the session in an httpOnly, Secure, SameSite cookie**, with a new id
  at sign-in.
- **With the two-factor step, keep the pending sign-in on the server**, named
  by an opaque, short-lived id in such a cookie, until the code is right, as
  [Verify Code](verify-code.md#security) says.
- **Send people on only to a page on your own site.** Otherwise a link could
  sign someone in, then send them to a look-alike site. If you send them back
  where they came from, such as `?next=/reports`, read `next` against your
  site's origin, from your config, and go on to it only if it stays there:

  ```ts
  const url = URL.canParse(next, origin) ? new URL(next, origin) : null; // origin: "https://app.example.com", from your config
  redirect(url?.origin === origin ? url.href : "/");
  ```

  Checking the text itself isn't enough: `?next=/%09/evil.example` reads as
  `/`, a tab, then `/evil.example`, and the browser drops the tab, which
  leaves `//evil.example`, another site. Nor is checking the path alone:
  `/.//evil.example` stays on your origin, but its path is `//evil.example`,
  which a browser reads as that site again. So redirect to the whole
  `url.href`.
- **Start each other account's sign-in on your server.** Make its `href` a
  route of yours, such as `/auth/google`. It makes a random `state` and a PKCE
  verifier, keeps them in an httpOnly cookie, and sends the reader on. The
  route the account sends them back to checks the `state` matches before it
  signs anyone in. Never put a secret in the `href`.
- **Link another account to one here by its email only when both are
  confirmed**: your account's address is confirmed, and the other account says
  its email is verified, as the [Sign-up Form](sign-up-form.md#security) says.
  Otherwise someone could make an account in someone else's name first, and
  keep a way into it.
- **Never trust `previous`.** It always comes from the browser, as the
  action's first argument. With JavaScript, the form sends your last answer
  back with each call; without it, React writes the answer into the page,
  `values` and all, and the browser posts it back.
- **Give back in `values` only the email.** `SignInFormMessages` has no
  password there, so TypeScript turns one down in an object written out in the
  answer, `values: { email }`, or in one given its type,
  `const values: SignInFormMessages["values"] = { email }`. It doesn't in an
  object built without that type and passed in later, such as
  `const values = { email, password }`, or `Object.fromEntries(data)`, which
  holds every field the form posts. Name each field you give back, and never
  pass `Object.fromEntries(data)`.
- **Check the post comes from your site**, against cross-site request
  forgery. Next.js does for server actions, comparing the `Origin` header with
  the host. Elsewhere, check it, or use a CSRF token.

The form itself:

- **Posts the email and password in the request's body**, never in the
  address. So a form sent before its script runs, as on a slow connection or
  when the script fails to load, keeps them out of the browser's history and
  the server's logs.
- **Keeps what was typed out of "Forgot your password?"**: the link never
  carries it, since an email in its address would end up in the server's logs
  and the browser's history.
- **Never logs or stores what's typed.** The password is only the field's
  value, sent with the form.
- **Fills in only the email from `values`**, and never reads a password from
  it.
- **Names the account for password managers**: `autocomplete="username"` and
  `"current-password"` let one fill the account it saved for this site, and
  only for it.
- **With the two-factor step, posts only the code** from the code's form.
  Nothing secret is in the page.

## Without JavaScript

Given a server action, the React form works before its script runs, or
without one:

- The form posts its email and password to your server action, as React
  renders a form for one: `method="POST"`, with hidden fields that name the
  action. Nothing goes in the page's address.
- Your framework runs the action, and renders the page again with its answer:
  a message under its field, or the code step.
- The page is new, so its fields start empty. Answer with `values: { email }`,
  and the email starts with what was typed, as its `defaultValue`. The
  password is always empty again: the form never fills it in, so it's never
  in the page.
- The form's own checks and the shake don't run. Your action's checks are the
  ones that count.
- "Forgot your password?", "Sign up", and the other accounts are links, so
  they work as usual.
- The code step's form posts to Verify Code's action. On the page after that
  post, the Sign-in Form starts where `initialResult` says, so read the
  pending sign-in from your cookie, as in
  [Two-factor step](#two-factor-step). "Back to sign in" is a link to
  `twoFactor.backHref`, the page itself by default. Point it at a route that
  ends the pending sign-in, or it shows the code step again.

Given a function of yours instead, React renders a form that the browser never
sends. A submit made before the page's JavaScript has loaded is held, then
sent once it has.

In HTML, the form is `method="post"`. Give the `<form>` an `action`, your
server's endpoint for signing in, and it signs someone in even without a
script.

## Customize

- **Words**: they're written in, in English. Change them in your copy, or put
  your app's translation calls in their place.
- **The email check**: the form only checks that it looks like an address.
  Your server decides the rest. Its message goes under the password, or, given
  by field, under the field it's about.
- **Focus on load**: on a page that's only for signing in, add `autoFocus` to
  the email's Input, or `autofocus` in HTML, so typing can start at once.
- **Headings**: the title is an `<h1>`. On a page with its own `<h1>`, pass
  `titleAs="h2"`, which the code step's title follows too. In HTML, make the
  titles `<h2>`s.
- **The link under the field**: pass `forgotPasswordAt="below"`. To put it at
  the field's start rather than its end, change `.hauth-form-forgot`'s
  `justify-self` to `start`.
- **In a Dialog**: inside a Dialog's body, the form drops its own frame and
  padding, and its title steps down to 16px semibold, under the Dialog's
  title. [Account Forms](account-forms.md) shows sign-in in a Dialog.

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

Give the `<form>` an `action`: your server's endpoint for signing in. The `…`
is [Password Input](../components/password.md)'s toggle, with its Tooltip.
Each `.herror` is in the page from the start, empty, so a screen reader reads
its message as it appears.

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

For other accounts, "or" and their links go after the button:

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

With a link to sign up, a band goes last, after the button or the other
accounts:

```html
<p class="hauth-form-footer">
  Don't have an account? <a class="hlink" data-underlined href="/sign-up">Sign up</a>
</p>
```

With the two-factor step, once the password is right, the form gets `hidden`,
and [Verify Code's markup](verify-code.md#markup) follows it, titled "Verify
it's you", with "Back to sign in" in its band, a link to this page.

Load Harmo's CSS, then `auth-form.css`, and with the two-factor step,
`verify-code.css`.

### Classes

| Class or attribute | What it does |
| --- | --- |
| `.hauth-form` on a raised `.hcard` `<form>` | The form: at most 400px wide, with 42px padding, its parts 26px apart, and its `.hbutton` as wide as it |
| `.hauth-form-title` | The title, 20px bold. It shows no focus ring when it takes focus |
| `.hauth-form-fields` | The fields, 16px apart |
| `.hauth-form-password` | The password field and the link under it, 6px apart, at the label's size |
| `.hauth-form-forgot` | The link under the field, at its end |
| `.hauth-form-divider` | "or", 13px in `--harmo-color-text-tertiary`, between two lines that fill the form's width |
| `.hauth-form-providers` | The other accounts' Buttons, 10px apart, each as wide as the form. With four or more not `hidden`, two to a row |
| `.hauth-form-footer` | A tinted band at the card's bottom, inset 6px (`--harmo-space-2xs`) from its sides and bottom, so the card frames it, with 4px corners. Its line is 14px, centered, in `--harmo-color-text-secondary`, 42px under what's above it |
| `data-shake` on the form | Shakes it once, unless reduced motion is asked for. Remove it at the form's own `animationend`, so the next failure shakes it again |

### What your script does

[sign-in-form.js](../../examples/html/src/scripts/sign-in-form.js) is an
example. The password's toggle uses Password Input's example script,
`password.js`. The code step uses Verify Code's, `verify-code.js`, which sets
up its card as it arrives.

**On submit:**

1. Call `preventDefault()`. `novalidate` leaves the checks to the script, and
   the page's own errors replace the browser's bubbles.
2. Check each field. Put an error in the `.herror` of each one that's empty,
   "Enter your email address." or "Enter your password.", or, for the email,
   isn't an address, "Enter an email address, such as name@example.com.", with
   `aria-invalid="true"` on its input, and clear the other. Move focus to the
   first field in error, the email first. Add `data-shake` to the form, and
   stop. Once both are fine, clear both errors.
3. Show the button working: `aria-busy="true"`, `aria-disabled="true"`, and a
   `.hspinner` after its label. Ignore another sign-in meanwhile.
4. Send the email and password.
5. Show the answer:
   - nothing, or an empty object: leave the form as it is;
   - a message: put it in the password's `.herror`;
   - messages by field, such as `{ email: "…" }`: put each in its own field's
     `.herror`. One for a field the form doesn't have goes in the password's;
   - a request that fails: "Something went wrong. Try again." in the
     password's `.herror`;
   - with the two-factor step, `{ step: "code", sentTo }`: show the code step,
     below.

   For each error, put `aria-invalid="true"` on its input, move focus to the
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
  `hidden`. Move focus to the form's title the same way, giving it
  `tabindex="-1"` first.

**Animate each change**, to the code step and back, as [Moving between steps](README.md#moving-between-steps) says.

**As people type:** on `input` in a field, take its error away. Remove
`data-shake` at the form's own `animationend`, not one that bubbles up from
inside it.

The other accounts are links, so they need nothing from the script.

## Accessibility

- Each field is named by its label, and its error is read with it, through
  `aria-describedby`.
- Errors are polite live regions, in the page from the start, so a screen
  reader reads each one as it appears, after the field that takes focus.
- `autocomplete="username"` and `"current-password"` let a password manager
  fill the form in: the email is the account's name, for it.
- "Forgot your password?" is a link that Tab reaches. Beside the label, it
  comes before the password field, so Tab reaches it first; under the field,
  after it.
- "or" is text a screen reader reads, so the links after it read as another
  way to sign in. Their logos are hidden from it, with `aria-hidden`.
- Two to a row, each link's name, from `aria-label`, is "Continue with" its
  account. It holds the word the link shows, so speech input that says
  "Google" finds it.
- The shake only repeats what the error says, so reduced motion loses
  nothing: the form stays still, and the error says what went wrong.
- At the code step, the form is hidden, so focus moves to the step's title: a
  heading with `tabindex="-1"`, which a screen reader reads as it takes focus.
  "Back to sign in" moves focus to the form's title the same way. Neither
  shows a focus ring, since a title isn't a control.
- Under reduced motion, the card takes the new step's size at once; the step
  still fades in, since only its opacity changes.

## Design details

- A raised Card, at most 400px wide, with 42px (`--harmo-space-lg`) padding:
  the title, the fields, and a button as wide as the form, 26px
  (`--harmo-space-md`) apart. The fields are 16px (`--harmo-space-sm`) apart.
- The title is 20px bold, its line trimmed to the top of its capitals with
  `text-box`, so the padding above it reads as the padding below the button
  does. Firefox doesn't trim it yet, and leaves a few pixels more.
- "Forgot your password?" sits at the end of the password's label row, at the
  label's size, as `.hfield-label-end`. Or it sits under the field, at its
  end, 6px under it.
- An empty field, or an email that isn't an address, gets an error under it,
  and its input `aria-invalid="true"`. Typing in a field takes its error away.
- While your action runs, the button shows it's working, as a loading
  [Button](../components/button.md) does.
- An error shakes the card once: 12px each way, in 300ms
  (`--harmo-duration-slow`). Under reduced motion it stays still.
- Other accounts follow the button, as the
  [Sign-up Form](sign-up-form.md)'s follow its own: "or", 13px in
  `--harmo-color-text-tertiary`, between two 1px `--harmo-color-border`
  lines, then a secondary Button for each, a link with the account's logo
  before its name. Up to three are each as wide as the form, 10px
  (`--harmo-space-xs`) apart. Four or more go two to a row.
- With a page to sign up on, "Don't have an account? Sign up" sits in a band
  along the card's bottom edge, as the Sign-up Form's line to sign in does:
  tinted `--harmo-color-background-secondary`, inset 6px (`--harmo-space-2xs`)
  from the card's sides and bottom, so the card frames it, with 4px corners.
  Its line is at the label's size, 14px, centered, with 16px above and below
  it, and its link is underlined. What's above it, the button or the other
  accounts, ends 42px over it, as the title starts 42px under the card's top
  edge. Without a page to sign up on, there's no band.
- The card resizes to the code step and back, easing out
  (`--harmo-ease-out-cubic`): 200ms (`--harmo-duration-normal`) for a small
  change, plus half a millisecond per pixel, up to 350ms. What leaves goes at
  once, and what arrives fades in over 200ms, laid out where it will end.
