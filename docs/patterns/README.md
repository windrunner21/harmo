# Patterns

A pattern is a whole task, such as signing in, built from Harmo's components.
Unlike a component, it's yours once you have it: copy it into your app, then
change its words, its fields, and what it does, as you would your own code.

| Pattern | Use it for |
| --- | --- |
| [Sign-in Form](sign-in-form.md) | Signing in with an email and password, with an optional two-factor code and other accounts |
| [Sign-up Form](sign-up-form.md) | Creating an account, with optional email confirmation, by link or by code |
| [Reset Password](reset-password.md) | Asking for a reset link, then choosing a new password |
| [Account Forms](account-forms.md) | Sign-in, sign-up, and reset password in one card that switches between them, such as in a Dialog |
| [Verify Code](verify-code.md) | Entering a code sent by email or text, or from an authenticator app |
| [Chat](chat.md) | An AI chat beside your past chats, a copilot beside your app's content, or a support chat that opens from a corner and hands over to a person |
| [Headers](headers.md) | The bar across the top: a site's, with a menu that slides in under it on a phone; an app's, beside its sidebar, with search, notifications, and Create; or a sign-in page's |
| [Contact Form](contact-form.md) | A message, a sales inquiry, a support request, or help with an order, and cards that lead to them |

Each one comes in React and in HTML, with a small stylesheet for its layout,
and is tested as the components are. Each page starts with **Try the demo**,
what to type in the playground to see each answer, and **What you need**,
everything your app and server provide.

## Install

```sh
npx harmo-ui add sign-in-form
```

This copies the pattern into `components/harmo/patterns/`, with the Harmo
components and the shared helpers it uses, and adds its stylesheet to
`harmo.css`, which you import once in your root layout. Each page lists what
it copies.

Without the CLI, copy the pattern's folder, and the shared folders it
imports, such as `form-action/`, from
[examples/react/src/patterns](../../examples/react/src/patterns/). Then:

- install `@harmo-ui/react` and `@harmo-ui/css`, since the files import
  Harmo's components from the package;
- turn on `allowImportingTsExtensions` in your `tsconfig.json`, or take the
  `.ts` and `.tsx` endings off the files' imports of each other.

For HTML, copy the page's markup and the pattern's stylesheet.

## What you need

Every pattern needs:

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript. The CLI copies the Harmo components a pattern uses into your app |
| HTML | Harmo's CSS, and your own script. Each page's **HTML** section says what it does |
| Without JavaScript | For the forms, a framework that runs React server actions, such as Next.js with its App Router. Without one, they need JavaScript; a [Chat](chat.md) always does |
| Node.js | 20 or newer, which Next.js needs anyway. The code in these docs needs nothing newer |

Your server provides the rest, such as where accounts are kept, sessions,
rate limits, and sending email. Each page lists what it needs.

## Actions

Each React form takes `action`, as React 19's `<form>` does; a
[Chat](chat.md) takes `respond`, which its page explains. It's a function
that gets what was sent and returns an answer:

```ts
async function signIn(previous: SignInFormResult, data: FormData): Promise<SignInFormResult> {
  const email = String(data.get("email") ?? "");
  // check it, then answer
  return { form: "The email or password is incorrect.", values: { email } };
}
```

- `data` is the form's `FormData`, each field by its `name`.
- `previous` is your last answer.
- Give it a **server action**, such as Next.js's with `"use server"`, and the
  form also works without JavaScript: the browser posts it, and the page your
  server renders after the post shows the answer.
- Or give it a **plain async function**, which runs once the page's
  JavaScript has loaded.

### Answers

| Return | What the form does |
| --- | --- |
| `undefined` | Nothing changes, as when you `redirect()` or show a toast |
| A string | Shows it in the form's main spot, such as above the button |
| Messages by field, such as `{ email: "…" }` | Shows each under its field, moves focus to the first, and shakes the form. `form` is a message for the whole form, shown in the main spot, as is one for a field the form doesn't show |
| A step, such as `{ step: "sent", email }` | Moves to that step, which shows what the answer carries |

Each form's types, such as `SignInFormResult`, say exactly which answers it
takes, so TypeScript checks yours.

If your action throws, the form shows "Something went wrong. Try again." in
its main spot. Next.js's `redirect()` and `notFound()` work as usual.

### Filling fields in again

Without JavaScript, the page after a post is a new one, so its fields are
empty. Give back what was typed as `values`, and those fields are filled in
again:

```ts
return { form: "The email or password is incorrect.", values: { email } };
```

- With JavaScript, the fields keep what was typed, and `values` changes
  nothing.
- Each form's type says which fields `values` can hold: never a password, a
  confirmation, or a code. A form with only those, such as Verify Code, has no
  `values`. Files can't be given back; they're chosen again.
- TypeScript turns a password down only in an object written out in the
  answer, as above, or in a const given the form's type, such as
  `const values: SignUpFormMessages["values"] = { name, email }`. An object
  built some other way gets through, so name each field you give back, and
  never pass `Object.fromEntries(data)`, which holds every field posted.

### Never trust `previous`

`previous` always comes from the browser. With JavaScript, the form sends your
last answer back with each call; without it, the page holds the answer, and
the browser posts it back. Never put a secret in an answer, and never trust
`previous`. Each page's **Security** section says what the form does, and what
your server must do.

### How it works

With JavaScript, the form checks its fields first, then calls your action
itself, in a transition, so what was typed stays after a message. Without
JavaScript, React renders a form that posts to your server action. The code
for both is `formAction.ts`, in `patterns/form-action/`, which every form
shares.

## Moving between steps

When a form changes step, such as from "Forgot your password?" to "Check
your email", its card grows or shrinks to the new step, rather than jumping,
as the new step fades in. In React, `useStepMotion`, in
`patterns/step-motion/`, does this for every pattern. In HTML, your script
animates each change:

1. **Before the change**, read the card's computed `width` and `height`, which
   mid-animation are where it has got to, and the offset of each child it
   shows. Set `overflow-anchor: none` on the card, so the browser's scroll
   anchoring doesn't scroll the page while the new step is measured.
2. **Make the change.** Then cancel any size or move animation still playing
   on the card or its children, found by its id, `harmo-step-resize` or
   `harmo-step-move`, and read the new size and offsets.
3. **Fade in** each child that wasn't shown before: `opacity` from 0 to 1,
   over `--harmo-duration-normal`, with `--harmo-ease-out-cubic`, under reduced
   motion too.
4. **Resize**, unless reduced motion is asked for: animate the card's
   `height`, and its `width` if it changed, from the old size to the new, with
   `element.animate()`: over `--harmo-duration-normal` plus half a millisecond
   for each pixel, up to 150ms more, with `--harmo-ease-out-cubic`, and the id
   `harmo-step-resize`. With the same timing and the id `harmo-step-move`,
   animate `translate` on each child that stays, such as a footer, from its
   old offset to its new one.
5. **Meanwhile**, set `overflow: clip` and `align-content: start` on the card,
   so the new step lays out where it will end, clipped. Take these and
   `overflow-anchor` away once the animation ends or is cancelled, and leave
   no size inline, so the card sizes itself again.
6. **Start together**: set each animation's `startTime` to
   `document.timeline.currentTime`, so they start on the same frame.
   Otherwise the card can stay at its old size, empty, for a frame or two.

The ids let one script cancel another's animation on the same card, as when
Account Forms switches to Reset Password, which then changes step. Then move
focus to the new step's title with `focus({ preventScroll: true })`, and
bring it into view with `scrollIntoView({ block: "nearest" })`, smoothly
unless reduced motion is asked for.

[change-step.js](../../examples/html/src/scripts/change-step.js) has a
`changeStep` function that does all of this, ready to copy; the forms'
example scripts share it.
