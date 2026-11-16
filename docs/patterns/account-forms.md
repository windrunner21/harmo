# Account Forms

Sign-in, sign-up, and reset password in one card that switches between them
in place, such as in a [Dialog](../components/dialog.md). It holds the
[Sign-in Form](sign-in-form.md), the [Sign-up Form](sign-up-form.md), and
[Reset Password](reset-password.md)'s form that asks for a link, one shown at
a time, and the email typed so far comes along. It comes in React and in
HTML.

## When to use it

- **Most apps** give each form a page of its own, with the three patterns on
  their own: `/sign-in`, `/sign-up`, and `/reset-password`. A page has an
  address to link to and come back to, and the browser's Back goes where
  people expect.
- **Use Account Forms** where the person shouldn't leave the page, such as a
  "Sign in to continue" Dialog over changes not yet saved, or a sign-in panel
  beside a checkout.

Either way, your app needs the three pages. Without JavaScript, or with Ctrl
or ⌘ held, the links between the forms go there.

## Try the demo

The playground's forms answer as a server would, after a moment. The Sign-up
Form checks its fields before it sends, so give it a name and a password of
at least 10 characters. Type these to see each answer:

| Form | Type | You see |
| --- | --- | --- |
| Any | An email, then a link to another form, such as "Sign up" or "Forgot your password?" | That form, in place of the last, with the email filled in. The card grows or shrinks to it, and its title takes focus |
| Any | Nothing, then the button | The form's own checks, before anything is sent, such as "Enter your email address." |
| Any | Email `error@example.com` | "Something went wrong. Try again.", as when the server can't be reached: under the password when signing in, and under the email otherwise |
| Sign in | Any email, and a password other than `harmo` | "The email or password is incorrect." under the password |
| Sign in | Email `new@example.com`, password `harmo` | "Confirm your email address first. We've sent you a new link." under the email |
| Sign in | Any other email, password `harmo` | The button works for a moment, then nothing changes: you're signed in. Your own action would redirect |
| Sign up | Email `sam@example.com` | "An account already uses that email." under the email |
| Sign up | Password `Password123!` | "This password has appeared in a data breach. Choose another." under the password |
| Sign up | Any other email | Nothing changes, as for a sign-in |
| Reset password | An email at `example.org` | "We couldn't send the email. Try again in a moment." under the email |
| Reset password | An email at `gmial.com` | "We can't deliver email to gmial.com. Did you mean gmail.com?" under the email |
| Reset password | Any other email | "Check your email", for that address. One at `gmail.com` gets an "Open Gmail" button, and Outlook, Hotmail, Live, and Yahoo addresses get one too |

On "Check your email", press **resend** to see the step for a second send, or
**try another email** to start over. Switch to another form and back: each
keeps what you typed, its errors, and the step it got to.

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. The CLI copies the Harmo components the pattern uses |
| HTML | Harmo's CSS, each form's own script, and one that switches between them; [HTML](#html) says what it does |
| Without JavaScript | A framework that runs React server actions, such as Next.js with its App Router |
| Node.js | 20 or newer, which Next.js needs anyway. The code on this page needs nothing newer |
| Accounts | Where your users are kept, with a slow hash of each password, to sign in and sign up |
| Sessions | A session for each sign-in and sign-up, named by a cookie that's httpOnly, Secure, and SameSite |
| Rate limits | On sign-in attempts, sign-ups, and reset links, by network address, and by account or by the email typed |
| Email | A mail queue, and a worker that sends each reset link from it, so the action never waits for the email. With `confirmEmail`, the confirmation emails go the same way |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves. Then check the `Origin` header, or use a CSRF token |
| Other accounts | Only with `providers`. A route on your server for each, such as `/auth/google`, that starts its sign-in |
| Codes | Only with `twoFactor`, or `confirmEmail` by code. [Verify Code](verify-code.md#what-you-need)'s actions, which check a code and send a new one |

Each form's page has the details: the
[Sign-in Form's](sign-in-form.md#what-you-need), the
[Sign-up Form's](sign-up-form.md#what-you-need), and
[Reset Password's](reset-password.md#what-you-need).

## Install

```sh
npx harmo-ui add account-forms
```

This copies into `components/harmo/patterns/`:

- `account-forms/`: `AccountForms.tsx` and `account-forms.css`;
- the forms it holds, each in its own folder: `sign-in-form/`,
  `sign-up-form/`, and `reset-password/`, its `NewPasswordForm.tsx` included,
  with `verify-code/`, their code step;
- `auth-form/`: `auth-form.css`, the look the forms share, and `authForm.ts`,
  their inboxes and links;
- `form-action/formAction.ts`, which runs every pattern form's action;
- `step-motion/useStepMotion.ts`, which animates the card from one form to
  the next.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. The Dialog isn't one of them: `npx harmo-ui add dialog` copies
it.

Without the CLI, copy
[AccountForms.tsx](../../examples/react/src/patterns/account-forms/AccountForms.tsx),
[account-forms.css](../../examples/react/src/patterns/account-forms/account-forms.css),
and
[useStepMotion.ts](../../examples/react/src/patterns/step-motion/useStepMotion.ts),
with the three forms' files, as the [Sign-in Form's](sign-in-form.md#install),
[Sign-up Form's](sign-up-form.md#install), and [Reset
Password's](reset-password.md#install) pages say. Then set them up
as [Patterns](README.md#install) says. For HTML, copy the [markup](#markup)
and the stylesheets.

## Use it

In a Next.js app, write the three forms' server actions as their pages show:

| Action | File | Its page |
| --- | --- | --- |
| `signIn` | `app/sign-in/actions.ts` | [Sign-in Form](sign-in-form.md#use-it) |
| `signUp` | `app/sign-up/actions.ts` | [Sign-up Form](sign-up-form.md#use-it) |
| `sendLink` | `app/reset-password/actions.ts` | [Reset Password](reset-password.md#use-it) |

`signIn` and `signUp` set the session in an httpOnly, Secure, SameSite cookie,
and call `redirect()` once they've signed someone in. `sendLink` answers
`{ step: "sent", email }`.

Then give the three pages the forms. Each can hold its form on its own, as
its page shows, or Account Forms, with `initial` set to that page's form, so
the other two are a click away:

```tsx
// app/sign-up/page.tsx
import { AccountForms } from "@/components/harmo/patterns/account-forms/AccountForms";
import { sendLink } from "../reset-password/actions";
import { signIn } from "../sign-in/actions";
import { signUp } from "./actions";

export default function SignUpPage() {
  return (
    <AccountForms
      initial="sign-up"
      signInAction={signIn}
      signUpAction={signUp}
      resetAction={sendLink}
      signInHref="/sign-in"
      signUpHref="/sign-up"
      resetHref="/reset-password"
      termsHref="/terms"
      privacyHref="/privacy"
      supportHref="/contact"
    />
  );
}
```

`initial` is `"sign-in"` by default, for `/sign-in`, and `"reset"` for
`/reset-password`.

That's all it takes. Each form checks its fields, and shows your action's
answer. A click on a link between them shows that form in place. It works
without JavaScript too: the links go to the pages, and each form posts to its
action.

Before you ship it, do what each form's Security section asks, such as its
rate limits, as [Security](#security) says.

### In a Dialog

```tsx
// app/editor/SaveDialog.tsx
"use client";

import { Button } from "@/components/harmo/button/Button";
import { Dialog } from "@/components/harmo/dialog/Dialog";
import { AccountForms } from "@/components/harmo/patterns/account-forms/AccountForms";
import { sendLink } from "../reset-password/actions";
import { signIn } from "../sign-in/actions";
import { signUp } from "../sign-up/actions";

export function SaveDialog() {
  return (
    <Dialog
      label="Sign in to continue"
      closeLabel="Close"
      description="Your changes stay here while you sign in."
      closedby="closerequest"
      trigger={<Button>Save changes</Button>}
    >
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
      />
    </Dialog>
  );
}
```

- **The Dialog is their card.** The forms take off their own frame, and the
  Dialog grows or shrinks with them as they switch.
- **`titleAs="h3"`** makes the forms' titles headings under the Dialog's own,
  an `<h2>`.
- **`closedby="closerequest"`** keeps a stray click outside from closing it
  on a half-typed password.
- **To stay on the page**, your actions can answer with nothing rather than
  call `redirect()`, and your page can save the changes once
  `router.refresh()` shows the person signed in. Refresh before acting on the
  changes, as [Security](#security) says.
- **Without JavaScript**, the Dialog is no place to sign in, as
  [Without JavaScript](#without-javascript) says. Give the page a link to
  `/sign-in` too.

### Without a server

Give each action a plain async function instead. It gets the same `FormData`,
and returns the same answers. The forms then need JavaScript.

```tsx
<AccountForms
  signInAction={async (previous, data) => {
    const response = await fetch("/api/sign-in", { method: "POST", body: data });
    if (!response.ok) return "The email or password is incorrect.";
    window.location.assign("/");
  }}
  signUpAction={async (previous, data) => {
    const response = await fetch("/api/sign-up", { method: "POST", body: data });
    if (!response.ok) return "We couldn't create your account. Try again in a moment.";
    window.location.assign("/");
  }}
  resetAction={async (previous, data) => {
    const response = await fetch("/api/reset-password", { method: "POST", body: data });
    if (!response.ok) return "We couldn't send the email. Try again in a moment.";
    return { step: "sent", email: String(data.get("email")) };
  }}
  signInHref="/sign-in"
  signUpHref="/sign-up"
  resetHref="/reset-password"
  termsHref="/terms"
  privacyHref="/privacy"
  supportHref="/contact"
/>
```

## Props

| Prop | |
| --- | --- |
| `signInAction` | Required. The Sign-in Form's [form action](https://react.dev/reference/react/useActionState): a server action marked `"use server"`, or an async function of yours. It gets `(previous, data)`, where `data` is the form's `FormData`. What it returns is in [Answers](#answers) |
| `signUpAction` | Required. The Sign-up Form's action, the same way |
| `resetAction` | Required. Reset Password's action, which sends the link |
| `signInHref` | Required. The sign-in page, where "Sign in" and "Return to sign in" lead |
| `signUpHref` | Required. The sign-up page, where "Sign up" leads |
| `resetHref` | Required. The page to reset a password, where "Forgot your password?" leads |
| `termsHref` | Required. Where "Terms of Service" leads |
| `privacyHref` | Required. Where "Privacy Policy" leads |
| `supportHref` | Required. Where "contact our support" leads, on Reset Password's step for a second send |
| `twoFactor` | The Sign-in Form's [second step](sign-in-form.md#two-factor-step): `{ action, resendAction?, length?, characters?, groups? }`. `signInAction` can then answer `{ step: "code", sentTo? }` |
| `confirmEmail` | The Sign-up Form's [step that confirms the email](sign-up-form.md#confirm-the-email): `{ by: "link", resendAction? }`, or `{ by: "code", action, resendAction?, length?, characters?, groups? }`. `signUpAction` can then answer `{ step: "confirm", email }` |
| `providers` | [Other accounts](sign-in-form.md#other-accounts) to sign in or sign up with, each `{ name, icon, href }`. The same ones go under both the Sign-in and the Sign-up Forms' buttons, so an account someone signed up with is there to sign in with. Without it, there are none |
| `initial` | The form shown first: `"sign-in"`, the default, `"sign-up"`, or `"reset"` |
| `titleAs` | The tag of the three forms' titles, and of their steps': `"h1"` by default, or `"h2"` to `"h6"`, such as `"h3"` in a Dialog, whose own title is an `<h2>` |

## Answers

Each action returns one of these, as on its form's own page:

| Return | The form |
| --- | --- |
| `undefined` | Changes nothing, as when you've redirected |
| A string, such as `"The email or password is incorrect."` | Shows it in the form's main spot, below, moves focus to that field, and shakes the card |
| Messages by field, such as `{ password: "This password has appeared in a data breach. Choose another." }` | Shows each under its field, moves focus to the first, and shakes the card. `form` is a message for the whole form, shown in its main spot |
| The same with `values`, such as `{ form: "The email or password is incorrect.", values: { email } }` | As above. Without JavaScript, each field `values` names is filled in again on the page after the post |
| A step, such as `{ step: "sent", email }` | Moves to that step, in the form's place |

If the action throws, the form shows "Something went wrong. Try again." in
its main spot. Next.js's `redirect()` and `notFound()` work as usual. A
message for a field that has no error spot goes to the main spot too, so none
is lost.

| Form | Fields it sends | Types | Fields with an error spot | Main spot | Fields `values` fills in | Steps |
| --- | --- | --- | --- | --- | --- | --- |
| Sign-in | `email`, `password` | `SignInFormResult`, `SignInFormMessages`; with `twoFactor`, `SignInFormTwoFactorResult` | `email`, `password` | Under the password | `email` | With `twoFactor`, `{ step: "code", sentTo? }`: Verify Code's card |
| Sign-up | `name`, `email`, `password`; `marketing` and `terms`, if you add their checkboxes and they're checked | `SignUpFormResult`, `SignUpFormMessages`; with `confirmEmail`, `SignUpFormConfirmResult` | `name`, `email`, `password`, and `terms` with its checkbox | Under the email | `name`, `email`, and the checkboxes | With `confirmEmail`, `{ step: "confirm", email }`: "Check your email", or Verify Code's card |
| Reset Password | `email` | `ResetPasswordFormResult`, `ResetPasswordFormMessages` | `email` | Under the email | `email` | `{ step: "sent", email }`: "Check your email" |

On "Check your email", Reset Password's resend posts the email again, to
`resetAction`. Answer `{ step: "sent", email }` again, and it says the link
was sent again, with a link to `supportHref`.

TypeScript checks your answers against these types: a message only for a
field the form has, and `values` only for fields it fills in, so never a
password written out in the answer.

Each form's Answers section has more: the
[Sign-in Form's](sign-in-form.md#answers), the
[Sign-up Form's](sign-up-form.md#answers), and
[Reset Password's](reset-password.md#answers).
[Patterns](README.md#actions) explains answers in more depth.

## Security

Each form's page says what the form does and what your server must do. Read
them before you ship:

- **[Sign-in Form](sign-in-form.md#security)**: the same answer, in the same
  time, for an unknown email and a wrong password; limits on attempts; the
  session cookie; where to send someone after signing in; and other accounts.
- **[Sign-up Form](sign-up-form.md#security)**: what "An account already uses
  that email." tells anyone; checking and hashing the password; limits on
  sign-ups; and the email that confirms an address.
- **[Reset Password](reset-password.md#security)**: the same answer, in the
  same time, whether or not an account uses the address; limits on requests;
  the mail queue; and the link's token.
- **[Verify Code](verify-code.md#security)**: for `twoFactor`, and
  `confirmEmail` by code.

Account Forms adds:

- **Each form posts only to its own action.** A form left for another keeps
  what was typed only in its fields, in this page. The email that comes along
  is copied from field to field, never sent.
- **Refresh after signing in in a Dialog.** The page's data was fetched
  before the person was signed in. Refresh it, as with `router.refresh()`,
  before acting on the changes it holds.
- **Never trust `previous`.** It always comes from the browser, as
  [Patterns](README.md#actions) explains.

## Without JavaScript

Given server actions, Account Forms works before its script runs, or without
one:

- **The links go to the pages.** Each link between the forms is a real link,
  to that form's page, such as `/sign-up`, so your app has the three pages
  anyway.
- **Each form posts to its own action**, as on its own page. What was typed,
  a password included, goes in the request's body, never in the page's
  address. In HTML, give each `<form>` an `action`: your server's endpoint
  for it. In React, give it a server action.
- **The page after the post shows the answer.** Your framework runs the
  action and renders the page again with it, and fills in again what
  `values` gives back. The [Sign-in Form's](sign-in-form.md#without-javascript),
  [Sign-up Form's](sign-up-form.md#without-javascript), and
  [Reset Password's](reset-password.md#without-javascript) pages have the
  details.
- **A Dialog is for pages with JavaScript.** Without it, the forms' links
  leave the page for the forms' own, and each post loads a new page, where
  the Dialog is closed. Give the page a link to `/sign-in` too.
- **The switching needs the script**: showing a form in place, the email that
  comes along, the title's focus, and the motion.

Given functions of yours instead, the forms wait for React: a submit before
it runs is held, then sent.

## Customize

- **Each form's words, fields, and checks**: each form is its own pattern's
  component, so change them there, as its page says.
- **The forms' other props** go where `AccountForms.tsx` renders them, such as
  the Sign-up Form's `askForName`, `askForMarketing`, and `termsAgreement`,
  which [Terms and marketing emails](sign-up-form.md#terms-and-marketing-emails)
  explains.
- **Different accounts on each form**: `providers` goes to both the Sign-in
  and the Sign-up Forms. Give each form its own where `AccountForms.tsx`
  renders them.
- **A form of your own** can take one's place in its view. Give it a
  `.hauth-form-title` to take focus, and, if it has an email field, name it
  `email`, for the email to come along.
- **A router's links**: the click is caught on the wrapper, after the link's
  own handlers have run. A router's link component, set as `HarmoProvider`'s
  `linkComponent`, as [Link](../components/link.md#react) says, usually
  handles its click itself. The forms then leave it alone, and the router
  opens the form's page.
- **Reset Password from the start each time**: rather than at the step it got
  to, give `ResetPasswordForm` a `key` that changes as it shows, and
  `defaultEmail` the email that comes with it.
- **Headings**: the titles are `<h1>`s. On a page with its own `<h1>`, pass
  `titleAs="h2"`; in a Dialog, whose own title is an `<h2>`, `titleAs="h3"`.
  In HTML, change the titles' tags.

## HTML

### Markup

```html
<div class="haccount-forms">
  <div class="haccount-forms-view">
    <form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
      <h1 class="hauth-form-title">Sign in</h1>
      …
      <p class="hauth-form-footer">
        Don't have an account? <a class="hlink" data-underlined href="/sign-up">Sign up</a>
      </p>
    </form>
  </div>
  <div class="haccount-forms-view" hidden>
    <form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
      <h1 class="hauth-form-title">Create your account</h1>
      …
      <p class="hauth-form-footer">
        Already have an account? <a class="hlink" data-underlined href="/sign-in">Sign in</a>
      </p>
    </form>
  </div>
  <div class="haccount-forms-view" hidden>
    <form class="hcard hauth-form" data-variant="raised" method="post" novalidate>
      <div class="hauth-form-header">
        <h1 class="hauth-form-title" tabindex="-1">Reset your password</h1>
        …
      </div>
      …
      <p class="hauth-form-footer">
        <a class="hlink" href="/sign-in">Return to sign in</a>
      </p>
    </form>
  </div>
</div>
```

- Each `…` is the rest of that form, as its page's markup has it: the
  [Sign-in Form's](sign-in-form.md#markup), with its link to sign up, the
  [Sign-up Form's](sign-up-form.md#markup), and
  [Reset Password's](reset-password.md#markup).
- Give each `<form>` an `action`: your server's endpoint for it.
- The form shown first is the one whose view has no `hidden`.
- Give each form's fields ids of their own, so no two on the page share one.
- With other accounts, give the Sign-in and the Sign-up Forms the same ones,
  as their pages' markup has them.
- A form's next step, such as the Sign-in Form's code or the Sign-up Form's
  "Check your email", takes the form's place in the same view, as on its own
  page. The card shown in a view is the one without `hidden`.

In a Dialog, the wrapper goes in the Dialog's body, as
[Dialog's markup](../components/dialog.md#markup) has it, without a form of
the Dialog's own around it, since each form is its own:

```html
<dialog class="hdialog" id="account-dialog" closedby="closerequest"
  aria-labelledby="account-dialog-title" aria-describedby="account-dialog-description">
  <header class="hdialog-header">
    <h2 class="hdialog-title" id="account-dialog-title">Sign in to continue</h2>
    <p class="hdialog-description" id="account-dialog-description">Your changes stay here while you sign in.</p>
    <button class="hbutton hdialog-close" data-variant="tertiary" type="button"
      commandfor="account-dialog" command="request-close" aria-label="Close">…</button>
  </header>
  <div class="hdialog-body">
    <div class="haccount-forms">…</div>
  </div>
</dialog>
```

In a Dialog, each title is an `<h3>`, under the Dialog's `<h2>`, and the
forms' scripts give the steps a form moves to the same tag.

Load Harmo's CSS, then `account-forms.css`, `auth-form.css`,
`sign-up-form.css`, and, for a code step, `verify-code.css`.

### Classes

The forms' own classes are on their pages. Account Forms adds:

| Class or attribute | What it does |
| --- | --- |
| `.haccount-forms` | The wrapper. It takes no box of its own, as `display: contents`, so the form shown lays out as it would alone. `hidden` hides it |
| `.haccount-forms-view` | A form's view, which takes no box of its own either. With `hidden`, it hides its form |
| `.hauth-form-title` with `tabindex="-1"` | A title that takes focus as its form shows, without a focus ring |
| `.hauth-form` in `.hdialog-body` | A form in a Dialog: no border, background, shadow, or padding, 400px wide or as wide as the Dialog allows. Its title steps down to 16px semibold, and the band along its bottom spans the form |

### What your script does

[account-forms.js](../../examples/html/src/scripts/account-forms.js) is an
example. It only switches between the forms. Each form keeps its own script,
as its page says: the
[Sign-in Form's](sign-in-form.md#what-your-script-does), the
[Sign-up Form's](sign-up-form.md#what-your-script-does), and
[Reset Password's](reset-password.md#what-your-script-does). Those find a
form whether it's shown or not, and each puts what your app gives back, a
message or messages by field, where its page says.

In React, `AccountForms` does what this script does. Its motion is
`useStepMotion`'s: it measures the form shown before React renders the
switch, and animates the next one in a layout effect once React has committed
it, before the browser paints.

**On a click:** listen for `click` on `.haccount-forms`, rather than on each
link, so the forms stay as they are. Act only on a link whose `href` is the
page of a form other than the one shown, and only when the event's
`defaultPrevented` isn't set, its button is the main one, and no Ctrl, ⌘,
Shift, or Alt is held. Then:

1. Call `preventDefault()`, so the browser doesn't follow the link.
2. Copy the email typed in the form shown, if there is one, to the next
   form's email field, if it has one. A hidden input doesn't count, and an
   empty email leaves the next form's as it was.
3. Set `hidden` on the view shown, and remove it from the next one's,
   animating the change, below.
4. Move focus to the next form's `.hauth-form-title`. Give it `tabindex="-1"`
   first, since the Sign-in and Sign-up Forms' titles don't have it on their
   own pages. Focus it with `focus({ preventScroll: true })`, then
   `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
   asked for, which scrolls only when it's out of view.

**Animate the switch** as [Moving between steps](README.md#moving-between-steps) says. Reset Password's script animates the same card, the same way, as it changes step, and the animations' ids let each cancel the other's.

## Accessibility

- Only the form shown is there for a screen reader and the keyboard: a
  `hidden` view takes its form out of the accessibility tree and the Tab
  order.
- The form that shows has its title focused, so a screen reader reads which
  form it is, then what follows, and Tab goes on to its first field.
  `tabindex="-1"` lets the script focus it, and keeps it out of the Tab order.
  It isn't a control, so it draws no focus ring.
- The page doesn't jump to the title. If it's out of view, the page scrolls
  it into view, smoothly, or at once under reduced motion.
- The links stay links: a screen reader names them as links, and a reader can
  open one in a new tab or window, which loads that form's page.
- In a Dialog, the forms' titles are headings under the Dialog's own, with
  `titleAs="h3"`.
- Under reduced motion, the form that shows takes its own size at once, and
  nothing moves. Its content still fades in, since only its opacity changes.
- Each form's own accessibility is on its page: the
  [Sign-in Form's](sign-in-form.md#accessibility), the
  [Sign-up Form's](sign-up-form.md#accessibility), and
  [Reset Password's](reset-password.md#accessibility).

## Design details

**The forms**, each as it is on its own page:

- The Sign-in Form, with "Forgot your password?" beside the password's label,
  and "Don't have an account? Sign up" in a band along its bottom.
- The Sign-up Form, with the name, and "Already have an account? Sign in" in
  its band.
- Reset Password's first step, with "Return to sign in" in its band.
- Other accounts, such as Google, if you give them: the same ones under both
  the Sign-in and the Sign-up Forms' buttons.
- Neither the wrapper nor a view takes a box of its own, so the form shown
  lays out as it would alone: at most 400px wide, wherever you put it.

**Switching:**

- A click on a link between the forms shows that form in place of the one
  shown, and the page stays where it is. A click with a modifier key, such as
  Ctrl or ⌘ to open a new tab, or a middle click, goes to the page as the
  reader asked; so does a click your app has already handled. Other links in
  the forms, such as the terms and the other accounts, are left alone.
- The email typed so far comes along: from signing in to signing up or to
  resetting the password, and back. An empty one leaves the next form's
  email as it was.
- While another is shown, each form keeps what was typed in it, its errors,
  and the step it got to. Back at Reset Password once a link has been sent,
  "Check your email" is still there, with "try another email" to ask again.
- Each form works inside as on its own page: its checks, its errors, its
  shake, its button working while your app answers, and Reset Password's card
  moving from step to step.

**The motion:**

- The form that shows starts at the size of the one leaving, which goes at
  once, so the two never overlap. It grows or shrinks to its own height,
  rather than jumping, easing out (`--harmo-ease-out-cubic`), so it moves from
  the first frame, with the new content: over 200ms
  (`--harmo-duration-normal`) for a change of a few pixels, and half a
  millisecond more for each pixel, up to 350ms for 300px or more.
- Its content lays out where it will end, clipped by the card meanwhile, and
  fades in over 200ms, easing out.
- Switching again before it's done starts from the size the card has then.
  Once it's done, nothing of it is left on the card, which sizes itself again.
- The form there as the page loads shows at once.
- Under reduced motion, the form that shows takes its own size at once, and
  nothing moves. Its content still fades in.

**In a Dialog**, which is their card:

- The forms take off their own frame: no border, background, shadow, or
  padding, so the Dialog's padding frames them.
- Their titles step down to 16px (`--harmo-font-size-base`) semibold
  (`--harmo-font-weight-semibold`), a heading under the Dialog's 20px title.
- The band along their bottom spans the form, inside the Dialog's body.
- Each form is 400px wide, or as wide as the Dialog allows, so the Dialog
  keeps its width as they switch, and grows or shrinks in height with them.
