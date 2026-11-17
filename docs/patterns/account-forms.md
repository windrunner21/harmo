# Account Forms

Sign-in, sign-up, and reset password in one card that switches between them
in place, such as in a [Dialog](../components/dialog.md). It holds the
[Sign-in Form](sign-in-form.md), the [Sign-up Form](sign-up-form.md), and
[Reset Password](reset-password.md)'s form that asks for a link, one shown at
a time, and the email typed so far comes along. It comes in React and in
HTML.

Most apps give each form a page of its own, with the three patterns on their
own: a page has an address to link to, and the browser's Back goes where
people expect. Use Account Forms where the person shouldn't leave the page,
such as a "Sign in to continue" Dialog over changes not yet saved. Your app
still needs the three pages: without JavaScript, or with Ctrl or ⌘ held, the
links between the forms go there.

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
| Sign in | Any other email, password `harmo` | The button works for a moment, then a toast says "Signed in", where your own action would redirect |
| Sign up | Email `sam@example.com` | "An account already uses that email." under the email |
| Sign up | Password `Password123!` | "This password has appeared in a data breach. Choose another." under the password |
| Sign up | Any other email | A toast says "Account created", as for a sign-in |
| Reset password | An email at `example.org` | "We couldn't send the email. Try again in a moment." under the email |
| Reset password | An email at `gmial.com` | "We can't deliver email to gmial.com. Did you mean gmail.com?" under the email |
| Reset password | Any other email | "Check your email", for that address. One at `gmail.com` gets an "Open Gmail" button, and Outlook, Hotmail, Live, and Yahoo addresses get one too |

Switch to another form and back: each keeps what you typed, its errors, and
the step it got to.

## What you need

What each of the three forms needs: the
[Sign-in Form's](sign-in-form.md#what-you-need), the
[Sign-up Form's](sign-up-form.md#what-you-need), and
[Reset Password's](reset-password.md#what-you-need). In short:

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. To work without JavaScript, a framework that runs React server actions, such as Next.js with its App Router, on Node.js 20 or newer |
| HTML | Harmo's CSS, each form's own script, and one that switches between them, as [HTML](#html) says |
| Accounts and sessions | Where your users are kept, with a slow hash of each password, and a session for each sign-in and sign-up, named by a cookie |
| Rate limits | On sign-in attempts, sign-ups, and reset links |
| Email | A mail queue, and a worker that sends each reset link, and each confirmation with `confirmEmail` |
| CSRF checks | Only if your actions aren't Next.js server actions, which check where a post came from themselves |

## React

### Install

```sh
npx harmo-ui add account-forms
```

It copies into `components/harmo/patterns/`:

- `account-forms/`, the switcher, `AccountForms.tsx`, and
  `account-forms.css`;
- the forms it holds, each in its own folder, `sign-in-form/`,
  `sign-up-form/`, and `reset-password/`, with `verify-code/`, their code
  step;
- `auth-form/`, `form-action/`, and `step-motion/`, which the forms share.

It also copies the Harmo components they use, and adds the stylesheets to
`harmo.css`. The Dialog isn't one of them: `npx harmo-ui add dialog` copies
it. Without the CLI, copy the same files from
[examples/react/src/patterns](../../examples/react/src/patterns), and set them
up as [Patterns](README.md#install) says.

### Use it

Write the three forms' server actions as their pages show: `signIn` in
`app/sign-in/actions.ts`, as the [Sign-in Form](sign-in-form.md#use-it) does;
`signUp` in `app/sign-up/actions.ts`, as the
[Sign-up Form](sign-up-form.md#use-it) does; and `sendLink` in
`app/reset-password/actions.ts`, as [Reset Password](reset-password.md#use-it)
does. Then give a page the forms, with `initial` set to that page's form:

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

That's all it takes. Each form checks its fields and shows your action's
answer, and a click on a link between them shows that form in place. Before
you ship it, go through each form's Security, as [Security](#security) lists.

#### Without a server

Give each action a plain async function instead, as each form's page shows.
The forms then need JavaScript.

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
- **`titleAs="h3"`** makes the forms' titles headings under the Dialog's own
  `<h2>`.
- **`closedby="closerequest"`** keeps a stray click outside from closing it
  on a half-typed password.
- **To stay on the page**, your actions can answer with nothing rather than
  call `redirect()`, and your page can save the changes once
  `router.refresh()` shows the person signed in.
- **Without JavaScript**, a Dialog can't open, so give the page a link to
  `/sign-in` too.

### Props

| Prop | |
| --- | --- |
| `signInAction` | Required. The Sign-in Form's [form action](https://react.dev/reference/react/useActionState), as its [Props](sign-in-form.md#props) say |
| `signUpAction` | Required. The Sign-up Form's action, the same way |
| `resetAction` | Required. Reset Password's action, which sends the link |
| `signInHref` | Required. The sign-in page, where "Sign in" and "Return to sign in" lead |
| `signUpHref` | Required. The sign-up page, where "Sign up" leads |
| `resetHref` | Required. The page to reset a password, where "Forgot your password?" leads |
| `termsHref` | Required. Where "Terms of Service" leads |
| `privacyHref` | Required. Where "Privacy Policy" leads |
| `supportHref` | Required. Where "contact our support" leads, after a second reset link |
| `twoFactor` | The Sign-in Form's [code step](sign-in-form.md#two-factor-step): `{ action, resendAction?, length?, characters?, groups? }` |
| `confirmEmail` | The Sign-up Form's [step that confirms the email](sign-up-form.md#confirm-the-email): `{ by: "link", resendAction? }`, or `{ by: "code", action, resendAction?, length?, characters?, groups? }` |
| `providers` | [Other accounts](sign-in-form.md#other-accounts), each `{ name, icon, href }`, under both the Sign-in and the Sign-up Forms' buttons |
| `initial` | The form shown first: `"sign-in"`, the default, `"sign-up"`, or `"reset"` |
| `titleAs` | The tag of the forms' titles, and of their steps': `"h1"` by default, or `"h2"` to `"h6"` |

### Answers

Each action answers as on its form's own page: the
[Sign-in Form's](sign-in-form.md#answers), the
[Sign-up Form's](sign-up-form.md#answers), and
[Reset Password's](reset-password.md#answers). TypeScript checks each against
its form's types.

### Without JavaScript

Given server actions, Account Forms works before its script runs, or without
one. Each link between the forms is a real link, to that form's page, and
each form posts to its own action, as on its own page. Only the switching
needs the script: showing a form in place, the email that comes along, the
title's focus, and the motion.

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

Each `…` is the rest of that form, as its page's markup has it: the
[Sign-in Form's](sign-in-form.md#markup), the
[Sign-up Form's](sign-up-form.md#markup), and
[Reset Password's](reset-password.md#markup). Give each `<form>` an `action`,
your server's endpoint for it, and each field an id no other on the page
shares. The form shown first is the one whose view has no `hidden`. Load
Harmo's CSS, then `account-forms.css`, `auth-form.css`, `sign-up-form.css`,
and, for a code step, `verify-code.css`.

In a Dialog, the wrapper goes in the Dialog's body, as
[Dialog's markup](../components/dialog.md#markup) has it, without a form of
the Dialog's own around it, and each title is an `<h3>`:

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

### Classes

The forms' own classes are on their pages. Account Forms adds:

| Class or attribute | What it's for |
| --- | --- |
| `.haccount-forms` | The wrapper. It takes no box of its own, so the form shown lays out as it would alone |
| `.haccount-forms-view` | A form's view, which takes no box of its own either. With `hidden`, it hides its form |
| `.hauth-form` in `.hdialog-body` | A form in a Dialog, without its own frame |

### What your script does

[account-forms.js](../../examples/html/src/scripts/account-forms.js) is an
example. It only switches between the forms; each keeps its own script, as
its page says.

**On a click:** listen for `click` on `.haccount-forms`, rather than on each
link. Act only on a link whose `href` is the page of a form other than the
one shown, and only when the event's `defaultPrevented` isn't set, its button
is the main one, and no Ctrl, ⌘, Shift, or Alt is held. Then:

1. Call `preventDefault()`, so the browser doesn't follow the link.
2. Copy the email typed in the form shown, if there is one, to the next
   form's email field, if it has one. An empty email leaves the next form's
   as it was.
3. Set `hidden` on the view shown, and remove it from the next one's,
   animating the change as
   [Moving between steps](README.md#moving-between-steps) says.
4. Give the next form's `.hauth-form-title` `tabindex="-1"`, and move focus to
   it with `focus({ preventScroll: true })`, then
   `scrollIntoView({ block: "nearest" })`, smoothly unless reduced motion is
   asked for.

## Security

Each form's page says what the form does and what your server must do:

- **[Sign-in Form](sign-in-form.md#security)**: the same answer for an unknown
  email and a wrong password, limits on attempts, the session cookie, and
  where to send someone after signing in.
- **[Sign-up Form](sign-up-form.md#security)**: what "An account already uses
  that email." tells anyone, checking and hashing the password, and limits on
  sign-ups.
- **[Reset Password](reset-password.md#security)**: the same answer whether or
  not an account uses the address, limits on requests, and the link's token.
- **[Verify Code](verify-code.md#security)**: for `twoFactor`, and
  `confirmEmail` by code.

Account Forms adds:

- **Each form posts only to its own action.** A form left for another keeps
  what was typed only in its fields, in this page. The email that comes along
  is copied from field to field, never sent.
- **Refresh after signing in in a Dialog.** The page's data was fetched
  before the person was signed in. Refresh it, as with `router.refresh()`,
  before acting on the changes it holds.

## Customize

- **Each form's words, fields, and checks**: change them in that form's own
  component, as its page says. Its other props, such as the Sign-up Form's
  `askForMarketing`, go where `AccountForms.tsx` renders it.
- **Different accounts on each form**: give each its own `providers` where
  `AccountForms.tsx` renders them.
- **A form of your own** can take one's place in its view. Give it a
  `.hauth-form-title` to take focus, and name its email field `email`, for
  the email to come along.
- **A router's links**: a link component set as `HarmoProvider`'s
  `linkComponent`, as [Link](../components/link.md#react) says, usually
  handles its own click. The forms then leave it alone, and the router opens
  the form's page.
- **Reset Password from the start each time**: give `ResetPasswordForm` a
  `key` that changes as it shows, and `defaultEmail` the email that comes with
  it.
- **Headings**: the titles are `<h1>`s. On a page with its own `<h1>`, pass
  `titleAs="h2"`; in a Dialog, `titleAs="h3"`. In HTML, change the titles'
  tags.

## Accessibility

- Only the form shown is there for a screen reader and the keyboard: a
  `hidden` view takes its form out of the accessibility tree and the Tab
  order.
- The form that shows has its title focused, so a screen reader reads which
  form it is, then what follows, and Tab goes on to its first field. The page
  doesn't jump to it, and scrolls only if it's out of view. The title isn't a
  control, so it draws no focus ring.
- The links stay links: a screen reader names them as links, and a reader can
  open one in a new tab, which loads that form's page.
- Each form's own accessibility is on its page.

## Design details

- The three forms are as on their own pages, with the same other accounts,
  if you give them, under both the Sign-in and the Sign-up Forms' buttons.
  Neither the wrapper nor a view takes a box of its own, so the form shown is
  at most 400px wide, wherever you put it.
- A click on a link between the forms shows that form in place, and the page
  stays where it is. A click with a modifier key, or a middle click, goes to
  the page as the reader asked; so does one your app has already handled.
  Other links in the forms, such as the terms, are left alone.
- The email typed so far comes along, from any form to another. While another
  is shown, each form keeps what was typed in it, its errors, and the step it
  got to.
- The form that shows starts at the size of the one leaving, which goes at
  once, and grows or shrinks to its own, easing out
  (`--harmo-ease-out-cubic`): 200ms (`--harmo-duration-normal`) for a small
  change, plus half a millisecond per pixel, up to 350ms. Its content fades
  in over 200ms, laid out where it will end. Switching again before it's done
  starts from the size the card has then. Under reduced motion, it takes its
  size at once, and only the fade plays.
- In a Dialog, which is their card, the forms have no border, background,
  shadow, or padding. Their titles step down to 16px
  (`--harmo-font-size-base`) semibold, under the Dialog's 20px title, and the
  band along their bottom spans the form. Each is 400px wide, or as wide as
  the Dialog allows, so the Dialog keeps its width as they switch.
