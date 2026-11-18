# Changelog

What changed in each release of Harmo's three packages, `@harmo-ui/css`,
`@harmo-ui/react`, and `harmo-ui`, which are released together, at the same
version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/): until 1.0, a
minor version may change an API, and says how to upgrade when it does.

## [Unreleased]

### Upgrading

- **React: Toaster's `label` is now `aria-label`.** It was only ever the
  region's name, never shown, and elsewhere `label` means words on screen.
  Rename the prop: `<Toaster label="Notifications (F8)" …>` becomes
  `<Toaster aria-label="Notifications (F8)" …>`. The markup is the same.

### Added

- Chat, a pattern: a conversation with an assistant, in React and HTML. Three
  of them, one for each place a chat sits: an AI chat that fills the page,
  beside a Sidebar of past chats; a copilot, a panel beside your app's content
  that knows what's open there and puts a reply into it with Insert; and a
  support chat, a window over the page's corner, opened by its launcher, that
  hands the conversation to a person. Each gets `respond`, which returns the
  reply whole or streamed a piece at a time. They share the conversation,
  whose replies show paragraphs, lists, code, bold, and links, and the
  composer, with `/` commands, and files attached, dropped, or pasted,
  uploaded as they're added with `upload`. Stop, Try again, Copy, ratings,
  editing your last message, Jump to latest, and a support chat's times,
  quick replies, messages your server pushes, and a count of them on the
  launcher are built in. It's built from the components below: Conversation,
  Message, Prose, Composer, Mentions, Drop Zone, Launcher, and Badge.
  `npx harmo-ui add chat` copies it.
- Footers, a pattern: the foot of a page, in React and HTML. Three of them:
  a site's, its logo and a line about it, groups of links, Social's with
  icons, and the copyright, the address, and a Language Picker of regions;
  one with a
  newsletter sign-up beside its links, which checks the address and says
  once it's subscribed; and a sign-in page's, the copyright and a few small
  links.
- Headers, a pattern: the bar across the top, in React and HTML. Three of
  them: a site's, its logo, a Navigation Menu whose sections open panels, and
  actions, which a Menu Button slides in under the bar at 640px wide, the
  menu scrolling over the actions at its foot; an app's, beside its
  sidebar, with a Command Menu at the start, then Help, notifications with
  an unread count and Mark all as read, Settings, and a round Create with a
  short list of what to make; and a sign-in page's.
  `npx harmo-ui add headers` copies it.
- Footer: the foot of a site's or an app's pages, a brand, groups of links,
  and a bottom row for the copyright and the small print. Wider than 640px,
  the groups sit side by side; 640px wide or less, each folds, as an
  Accordion item does. A Language Picker in the bottom row reads as its
  small print does, at the row's end, and opens above it. In React, `Footer` and `FooterGroup`.
- Header: the bar across the top of a page or an app, a logo, navigation or
  search, and actions in a row. It stays at the top, frosted, with a hairline
  once the page has scrolled; `data-scroll="away"` scrolls it away with the
  page, and `data-scroll="hide"` slides it away as you scroll down and back
  as you scroll up, or as focus comes into it. `data-transparent` keeps it
  clear over a hero until the page scrolls, and `data-bordered` shows its
  hairline from the start, as beside a Sidebar. In React, `scroll`,
  `transparent`, and `bordered`.
- Conversation: the scrolling log a chat's Messages are in. It opens at the
  latest and stays there as messages come and grow, a reply's words as they
  stream in too, unless you've scrolled up to read; then Jump to latest shows
  at its foot. Sending a message brings it back. A hidden status says what
  arrived, for screen readers. `data-align="end"` gathers a short
  conversation at the foot, as in a messenger, and `data-size="large"` gives
  long replies larger text.
- Message: one message in a conversation. Yours sits at the end, in a bubble;
  the assistant's at the start, as plain text, or in a bubble beside its
  avatar with `data-bubble`; a line from the conversation itself, such as
  someone joining, in the middle. It can show its time, its actions, quick
  replies, the files sent with it, "Not sent" with a way to try again, or
  three dots while a reply is on its way. A reply fades in as it arrives.
- Composer: where a message is written and sent. The field and its buttons
  sit in one box, and the field grows with what's written. Enter sends;
  Shift+Enter starts a new line. Send turns into Stop while a reply comes, if
  it can be stopped. Files can be attached or pasted, and listed above the
  field; it can show what the assistant knows about, or a sent message being
  edited, with a bar that quotes it.
- Mentions: a TextArea that lists suggestions as a trigger is typed, such as
  `@` for people, or `/` at the start for commands, in a Listbox, as a
  Combobox's list is. Choosing one puts it in the text. Focus stays in the
  field, and the arrow keys move the caret while the list is closed. For one
  line, such as a task's title, it takes an Input: `singleLine` in React.
- Launcher: a round button in the page's corner that opens a panel above it,
  such as a support chat. The panel is a dialog that isn't modal, growing from
  the corner, and the whole screen on a phone. Focus moves in as it opens and
  back as it closes; Escape closes it. A Badge on the button can count what
  came while it was closed.
- Badge: a count, or a dot, on a Button or beside a label, such as unread
  messages. On a Button, it sits on its corner, ringed in the page's color;
  in React, Button's `badge` takes the number. One added after the page
  loaded settles in, so a new count is noticed.
- Prose: text formatted to read, such as an assistant's reply: paragraphs,
  headings, lists, quotes, code, and links, spaced to read. In React,
  `<Prose text>` formats a small part of Markdown itself, paragraphs, lists,
  code, bold, and links, building elements, never HTML, and linking only web
  and email addresses.
- Drop Zone: an area files can be dropped on, which shows a dashed frame
  over itself, saying where they'll go, while they're dragged over it. It
  takes a drag as a File Input's drop area does, and in React they share it:
  folders are left out, a drop that just misses doesn't open the file in the
  tab, and a field inside the area is the area's.
- Account Menu: who's signed in, with their avatar, their name, and a line
  under it, such as the account they're in, as a button that opens a
  Dropdown Menu of what's theirs: their settings, the accounts they can
  switch to, and signing out. At the top of a Sidebar, collapsed, it's the
  avatar alone, its text fading as the Sidebar's labels do. With `profile`,
  the menu starts with who's signed in again; many accounts go in a submenu,
  so Sign out stays in reach.
- Dropdown Menu: a list of actions and links that a button opens, such as a
  row's More, an account's menu, or a header's Create, in a Popup. Its items
  are links or buttons, each with an optional icon, `destructive` for one
  that destroys something, in groups with labels and between separators.
  `DropdownMenuSub` opens a submenu beside its item: on hover, a moment
  later, and closing a moment after the pointer settles elsewhere, so it can
  cross other items on its way; with →, and back with ←. It's at most 400px
  tall, as a Popup is. A menu taller than it can be scrolls, with arrows at
  its ends while there's more, as a Select's list has.
- Listbox: its scroll arrows' styles are a mixin, `scroll-arrow`, which the
  Dropdown Menu shares; they look and work the same.
  Opened from the keys, focus goes to the first item, or with ↑ to the last;
  the arrows, Home, End, and typing a letter move focus, and the mouse moves
  it too, so only one item is shown. Choosing one closes the menu, and focus
  goes back to its button; Tab closes it and moves on. A disabled item is
  dimmed, and the keys pass it by.
- Button: `size="xsmall"`, or `data-size="xsmall"`, a 24px button with
  12px text, for a dense row or beside icon buttons. It takes presses over
  34px, as a default button does. And `shape="circle"`, or
  `data-shape="circle"`: round, a circle when it's icon only.
- Tokens: `--harmo-control-height-xsmall`, 24px, an extra-small Button's
  height.
- Popup: `align="end"`, or `data-align="end"`, aligns it to its trigger's
  end edge instead of its start, as for one opened from the end of a bar or
  a row. Without room, it aligns to the start.
- Button: a toggle, with `aria-pressed="true"`, shows it's on: a secondary or
  tertiary Button's icon and text in the primary color, and a secondary's
  background and border tinted.
- Showcase Card: a card that shows where it leads before it's opened, for a
  product's news, or a gallery of templates, patterns, or stories. What it leads to sits small, or
  as an image, on a dashed grid, then its title, a description, and an action
  line. The whole card is one link. Hovering or focusing it lifts the front
  and brings the action line up, its chevron turning into an arrow once the
  line is pointed at; on a touch screen, or with reduced motion, nothing
  moves. `data-fold`, or `fold` in React, folds its top corner over.

  ```html
  <a class="hshowcase-card" href="/news/scheduled-messages">
    <div class="hshowcase-card-media" aria-hidden="true" inert>…</div>
    <div class="hshowcase-card-body">
      <h3 class="hshowcase-card-title">Messages that go out on time</h3>
      <p class="hshowcase-card-description">Schedule a reply for later, and it's sent when you chose.</p>
    </div>
    <span class="hshowcase-card-action" aria-hidden="true">Read more …</span>
  </a>
  ```

- Listbox: scroll arrows. A list that has more to show above or below, past
  its 300px, shows an arrow at that end, and resting the pointer on it
  scrolls the list that way. The arrows lie over the list's edge, so no
  option moves as they come and go, and the keyboard keeps the highlighted
  option clear of them. Select, Combobox, Filter Chip, Command Menu, Phone
  Input, and Language Picker get them, but for Language Picker's grid of
  regions. In HTML, the script adds them: `listbox.js` shows how.
- CLI: `npx harmo-ui add` also copies `lib/customProperties.ts`, so a copied
  component's `style` takes Harmo's tokens and variables without a cast, as
  `@harmo-ui/react`'s does.

- React: the `style` prop takes Harmo's custom properties without a cast, its
  tokens and its components' variables, such as
  `style={{ "--harmo-card-padding": "var(--harmo-space-xs)" }}`, and they
  autocomplete. `HarmoCustomProperty` names them all.

- Segmented Control: `data-size="small"`, or `size="small"` in React, for a row
  of small controls such as a toolbar's: options 29px tall, with 13px text, as
  a small Button is. An option its radio names, with `aria-label` or a
  Tooltip, shows only its icon, as a square: 34px, or 29px when small. An icon
  in an option is drawn at 20px.

  ```html preview
  <div class="hsegmented" role="radiogroup" aria-label="Chart range" data-size="small">
    <label class="hsegmented-option"><input type="radio" name="chart-range" value="day" checked />Day</label>
    <label class="hsegmented-option"><input type="radio" name="chart-range" value="week" />Week</label>
    <label class="hsegmented-option"><input type="radio" name="chart-range" value="month" />Month</label>
  </div>
  ```

- Popup: `side="top"`, or `data-preferred-side="top"`, opens it above its
  trigger by preference, as from a bar at the foot of a page or a footer;
  without room above, below it. Language Picker passes its `side` to its
  popup.

### Changed

- Navigation Menu: a trigger's chevron is smaller, about 10px wide at 14px
  text, and as light as the letters beside it. It was as wide as the text is
  tall.
- React: Table of Contents and Pagination take `aria-labelledby`, naming them
  by a visible heading, in place of `aria-label`, as Filter Bar does.
- React: Time Picker's `periodLabel` is needed only where there can be an AM
  and PM column: with `hour12={false}`, leave it out.
- Patterns: the Contact Form's `attachments.ts`, which holds and uploads its
  files, is now shared, in `patterns/attachments/`, as the Chat uses it too.
  `npx harmo-ui add contact-form` copies it there; change the import in a
  copy you already have, or keep both. It makes a preview only of a picture.
- Tokens: the light theme's tertiary text, `--harmo-color-text-tertiary`, is a
  step darker, `#6a707c` from `#6e7480`, so it passes WCAG AA's 4.5:1 on a
  tinted surface too, such as a default Card or a Sidebar: 4.6:1, where it was
  4.34:1. On white it's 4.97:1. The dark theme's is unchanged.
- Language Picker: with three to six regions, its panel has two columns
  rather than three, so a few regions stay compact.

### Fixed

- Popup: in Firefox, a popup that moves to fit, such as one aligned to its
  trigger's other edge near the window's edge, now shows. It stayed unseen:
  Firefox kept the styles it worked out for that position while the popup
  was closed. Select, Combobox, Command Menu, Date Picker, and every other
  popup get the fix; there, it shows without its fade.
- Navigation Menu: moving the pointer from a trigger down to its panel no
  longer closes it on the way. A seam about a pixel tall, between the
  trigger and the bridge under it, let the pointer leave the menu; the open
  trigger now has a bridge of its own, reaching into the panel.

- Listbox: in a grouped list, the divider skips the first group shown by
  counting groups only, and Language Picker's regions count only regions for
  their columns, so neither changes as a scroll arrow comes and goes.


## [0.7.0] - 2026-11-16

Patterns: whole tasks built from the components, copied into an app with
`npx harmo-ui add` and changed there. Sign-in, sign-up, reset password, a
one-time code, and contact forms, in React and HTML, working without
JavaScript given a server action; and OTP Input, the component their codes
are typed in.

### Upgrading

- **In HTML, a Select with a name sends its value from a native `<select>`.**
  Its value used to go in hidden inputs, which a script kept in step. Now a
  `.hselect-fallback`, a native `<select>` just before the trigger, sends it,
  and shows in the trigger's place until a script runs, so the form works
  without one. Replace the hidden inputs with the fallback, as select.md's "In
  a form" shows, and have your script hide it with `hidden` as it starts, and
  keep its options selected to match the list, as "What a script does" says.

  What you'll notice: with a placeholder and nothing chosen, a form now leaves
  the name out rather than sending it empty, so read a missing value as none.

  In 0.6:

  ```html
  <span class="hlabel" id="channel-label">Channel</span>
  <button class="hselect" id="channel" type="button" data-name="channel" role="combobox" …>…</button>
  <div class="hpopup" id="channel-popup" popover style="position-anchor: --channel">…</div>
  <input type="hidden" name="channel" value="whatsapp" />
  ```

  Now:

  ```html
  <span class="hlabel" id="channel-label">Channel</span>
  <span class="hselect-fallback">
    <select name="channel" aria-labelledby="channel-label">
      <option value="whatsapp" selected>WhatsApp</option>
      <option value="telegram">Telegram</option>
    </select>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">…</svg>
  </span>
  <button class="hselect" id="channel" type="button" data-name="channel" role="combobox" …>…</button>
  <div class="hpopup" id="channel-popup" popover style="position-anchor: --channel">…</div>
  ```

  In React, nothing to change: the Select renders the fallback itself.

### Added

- Field: `.hfield-label-end` puts something at the end of the label row, such as a
  "Forgot your password?" link, and a link in the row takes the label's size.
- Tokens: `--harmo-font-weight-semibold`, 600, for text that has to look bolder
  in any font: medium, 500, draws as regular in a font without a medium face,
  such as Windows' Segoe UI, where semibold draws as semibold or bold.
- Field: `data-size="small"`, or `size="small"` in React, on a horizontal Field,
  for a line of fine print, such as agreeing to terms: a 13px label, and a 16px
  checkbox or radio, or a smaller switch, still beside the label's first line.

  ```html preview
  <div class="hfield" data-orientation="horizontal" data-size="small">
    <input class="hcheckbox" type="checkbox" id="product-news" name="product-news" />
    <label class="hlabel" for="product-news">Email me product news and tips</label>
  </div>
  ```

- Field: `data-variant="card"`, or `variant="card"` in React, on a horizontal
  Field, for a choice card: a checkbox or radio and its label as a bordered
  tile, such as a plan to choose, checked by a click anywhere on it, its
  description included, and taking the control's colors once checked.

  ```html preview
  <div class="hfield" role="radiogroup" aria-labelledby="plan-label">
    <span class="hlabel" id="plan-label">Plan</span>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(13rem, 100%), 1fr)); gap: var(--harmo-space-xs)">
      <div class="hfield" data-orientation="horizontal" data-variant="card">
        <input class="hradio" type="radio" name="plan" id="plan-starter" value="starter"
          aria-describedby="plan-starter-description" />
        <div class="hfield-content">
          <label class="hlabel" for="plan-starter">Starter</label>
          <p class="hdescription" id="plan-starter-description">For one person, with up to 3 projects.</p>
        </div>
      </div>
      <div class="hfield" data-orientation="horizontal" data-variant="card">
        <input class="hradio" type="radio" name="plan" id="plan-team" value="team"
          aria-describedby="plan-team-description" checked />
        <div class="hfield-content">
          <label class="hlabel" for="plan-team">Team</label>
          <p class="hdescription" id="plan-team-description">For up to 20 people, with shared projects.</p>
        </div>
      </div>
    </div>
  </div>
  ```

- TextArea: `--htextarea-min-height`, how tall it starts before it grows with
  its text, such as four lines for a longer message; one line, as tall as an
  Input, by default, as before.

  ```html preview
  <div class="hfield">
    <label class="hlabel" for="feedback-text">Feedback</label>
    <textarea class="htextarea" id="feedback-text" name="feedback" placeholder="What could we do better?"
      style="--htextarea-min-height: calc(var(--harmo-control-height) + 3 * 1.25rem)"></textarea>
  </div>
  ```

- Tooltip: `data-side="inline-start"` and `"inline-end"`, or `side` in React,
  at the start or end of the trigger's line, following its direction:
  `inline-end` is the right in left-to-right text and the left in
  right-to-left text, a part of a page with `dir="rtl"` included.

  ```html preview="tooltip/Sides"
  <span class="htooltip-trigger">
    <button class="hbutton" data-variant="secondary" type="button" aria-describedby="end-tip">
      <span class="hbutton-label">End</span>
    </button>
    <span class="htooltip" role="tooltip" id="end-tip" data-side="inline-end">After the button, in the text's direction</span>
  </span>
  ```

- OTP Input: a one-time code, such as a sign-in's second step, in one field
  with a slot drawn over it for each character, so pasting, a phone filling the
  code in from a message, undo, and screen readers work as in any field. 4 to 12
  characters, digits, or letters and digits in capitals, optionally in groups
  split by a dash; typing goes over what's after the caret, a press on a slot
  selects its character, and a paste loses spaces and dashes. Without a script,
  it's a plain Input that a form still sends, with `maxlength` and `pattern`. In
  React, `<OtpInput>`, with `length`, `characters`, `groups`, and `onComplete`,
  which can send its form once the code is whole.

  ```html preview="otp-input/Default"
  <div class="hfield">
    <label class="hlabel" for="code">Verification code</label>
    <div class="hotp-input" dir="ltr">
      <input class="hinput" id="code" name="code" type="text" inputmode="numeric"
        autocomplete="one-time-code" autocorrect="off" spellcheck="false"
        maxlength="6" pattern="[0-9]{6}" />
      <div class="hotp-input-slots" aria-hidden="true">
        <span class="hotp-input-slot"></span>
        <span class="hotp-input-slot"></span>
        <span class="hotp-input-slot"></span>
        <span class="hotp-input-slot"></span>
        <span class="hotp-input-slot"></span>
        <span class="hotp-input-slot"></span>
      </div>
    </div>
  </div>
  ```

- Password Input: `labelAccessory` puts your own content in its label row, after
  the strength word, such as that link. With both, the word keeps to the row's
  end and a `.hfield-label-end` follows it.

  ```html preview="password/With a link beside the label"
  <div class="hfield">
    <div class="hfield-label-row">
      <label class="hlabel" for="password">Password</label>
      <a class="hlink hfield-label-end" href="/reset-password">Forgot your password?</a>
    </div>
    <div class="hpassword">…</div>
  </div>
  ```

- Patterns: arrangements of components for a whole task, which you copy into
  your app and change as your own code, in React and HTML. See `docs/patterns`.
  - Sign-in Form: the email and password in a raised Card, "Forgot your
    password?" beside the password's label or under the field, errors under the
    fields, and a shake when signing in fails. It can offer other accounts to
    sign in with, such as Google, under the button, as the Sign-up Form does:
    one to a row, or two with four or more. With `twoFactor`, the right
    password can ask for a code: Verify Code takes the form's place, and
    "Back to sign in" brings the form back as it was typed.
  - Sign-up Form: a name, an email, and a new password with its strength, a
    line of fine print under the button saying that creating an account agrees
    to the terms, and a band along the card's bottom to sign in instead. Its
    email has `autocomplete="email"`, as web.dev's sign-up form best practices
    ask, and the Sign-in Form's `"username"`, as their sign-in ones do. It can
    ask for a checkbox to agree to the terms in the line's place, leave out the
    name or the terms, ask for marketing emails with an unchecked box, and
    offer other accounts to sign up with, such as Google, under the button: one
    to a row, or two with four or more. With `confirmEmail`, it confirms the
    email once the form is sent: by link, "Check your email", as Reset
    Password's sent step reads, with a resend; or by code, Verify Code. Either
    way, "use another email" brings the form back as it was typed.
  - Reset Password, in two forms. One sends a link, then says "Check your email"
    without saying whether an account uses the address, with resend, a submit
    button that posts the address again from a hidden input, try another
    email, a link to the page, and a button that opens Gmail, Outlook, or
    Yahoo. The other sets the new password, with its strength and a
    confirmation. At each step, the card grows or shrinks to the new step's
    height, easing out over 200ms to 350ms, the further the longer, as the new
    step fades in and the link back to sign in moves with its bottom edge;
    under reduced motion, it changes size at once and still fades.
  - Account Forms: the Sign-in Form, the Sign-up Form, and Reset Password's
    request in one place, one shown at a time. Their links stay real links to
    each form's page; a click on one shows that form in place, fading in, with
    its title focused and the email typed so far filled in. The Sign-in Form
    takes `signUpHref` for it: "Don't have an account? Sign up" in a band along
    its bottom. The form that shows starts at the size of the one leaving and
    grows or shrinks to its own, easing out, as its content fades in; under
    reduced motion, it takes its size at once and still fades. `providers`
    puts the same other accounts under both the Sign-in and the Sign-up Forms'
    buttons, and `twoFactor`, `confirmEmail`, and `titleAs` go to them as
    theirs. In a Dialog, which is their card, the forms take off their own
    frame, and their titles step down under the Dialog's `<h2>`, to `<h3>`s
    with `titleAs="h3"`, for a "Sign in to continue" that doesn't leave the
    page.
  - Verify Code: a one-time code in the account forms' look, such as a
    sign-in's second step or one that confirms an email or a phone number: a
    title, where the code went or that it's from an authenticator app, an OTP
    Input that sends the form once the code is whole, Verify, "Send a new code"
    after a wait shown as a countdown, "Send a new code in 0:24", 30 seconds by
    default and again after each, and a way back. Its error goes under the
    code, which takes focus selected, so typing replaces it.
  - Contact Form: forms for a message, a sales inquiry, a support request with
    attachments, and help with a shop's order, each with a thank-you that takes
    its place once sent; and contact options, cards that lead to sales, support,
    and the help center, the support address a semibold link in its sentence.
    Each text field's placeholder is an example of what to type, and a strip to
    drop files on is as wide as the fields. The sales form's website, typed
    with `https://` or without, must be an `http` or `https` address to a host
    with a dot in it, so `javascript:alert(document.domain).com` is turned
    down. In React, each form's action gets
    the form's `FormData`, files included, and answers `{ step: "sent", … }`
    for the thank-you; a message for a field with no error under it goes above
    the button. Given `upload`, the support and order forms upload each file
    straight to your storage as it's added, with its progress, a check once
    it's stored, and "Try again" if it fails, and send the keys they're stored
    under in their place, so a request stays small on any host; sending waits
    for an upload still running. `putFile` puts a file at a signed URL, such
    as S3's or R2's, reporting its progress. Without `upload`, the files go
    with the form. Once sent, the card shrinks to the thank-you's height, easing
    out, as the thank-you fades in; under reduced motion, it changes size at
    once and still fades.
  - In React, every pattern's form takes `action`, a React form action, such as
    a Next.js server action, or a plain async function: `(previous, data) =>
    result`, with `data` the form's `FormData`. Given a server action, it works
    without JavaScript: it posts to the action, nothing going in the page's
    address, and the page the server renders after the post shows the answer.
    The answer, typed for each form, as `SignUpFormResult`: nothing, when
    nothing changes, as after `redirect()`; a message, in the form's main spot;
    messages by field, such as `{ password: "…" }`, each under its field, the
    first taking focus as the form shakes, and `form`, or one for a field the
    form doesn't show, in the main spot; or a step, such as
    `{ step: "sent", email }`, which the form moves to. `initialResult` starts
    a form at a result, such as the step your server says someone is at.
    `twoFactor.backHref` and `confirmEmail.backHref` say where "Back to sign
    in" and "use another email" lead without JavaScript, such as a route that
    ends the pending sign-in or sign-up, so the page doesn't show the step
    again.
  - Messages can carry `values`, what was typed, such as
    `{ form: "The email or password is incorrect.", values: { email } }`:
    without JavaScript, the page after a post starts each field it names with
    its value, as its `defaultValue`, keyed, so a later post fills it in again.
    Each form's type names the fields it fills in, never a password, a
    confirmation, or a code, so TypeScript turns a secret down in `values`
    written out in the answer, or given the form's type, though not in an
    object built before it, such as `Object.fromEntries(data)`, as the docs
    say; files are chosen again. The Sign-up Form's checkboxes come back
    checked with `"on"`, and a resend that fails brings the form back with
    the address it was confirming. With JavaScript, the fields keep what was
    typed. `previous` always comes from the browser, which sends a result
    back with each call, or posts it back from the page without JavaScript,
    so `values` is never trusted, and the Security sections say so.
  - `titleAs`, on every pattern's form, sets its title's tag, and its steps':
    `"h1"` by default for the account forms and Verify Code, `"h2"` for the
    contact forms, whose thank-you follows it. The Sign-in and Sign-up Forms
    pass theirs to Verify Code.
  - With JavaScript, a form checks its fields first, then calls your action
    itself, in a transition, with the button working meanwhile, so what was
    typed stays after a message. An action that throws, or whose promise
    rejects, says "Something went wrong. Try again." in the main spot, and the
    form shakes; Next.js's `redirect()` and `notFound()` go on to Next.js. All
    of it is one helper every form shares, `patterns/form-action/formAction.ts`.
  - In HTML, every form posts, `method="post"`, so one sent before its script
    runs keeps what was typed, a password included, out of the page's address,
    and the example scripts answer as the React forms do, giving a step's title
    its form's title's tag. Each pattern's page says, in a Security section,
    what the form does and what your server must do.
- CLI: `npx harmo-ui add` copies patterns too, into `patterns/<name>/`, with the
  components they use and the helpers they import, each in its own folder,
  such as `patterns/form-action/`, and their stylesheets go last in
  `harmo.css`: first those patterns share, such as `patterns/auth-form/`'s,
  then each pattern's own. `npx harmo-ui list` shows them under their own
  heading, and `--all` still copies only the components.

### Changed

- Password Input: while its Field shows an error, such as "This password has
  appeared in a data breach", the strength word and meter step aside, with
  `hidden`, and the input is described by the error alone, so a green
  "Strong" never sits beside a red error. They come back as the error goes;
  the example script does the same, watching the Field's `.herror`.
- Select: a Select with a name works without JavaScript. Its value is now sent
  by a native `<select>` in a `.hselect-fallback` just before the trigger,
  rather than by hidden inputs. Until a script runs, or if none does, the
  fallback shows in the trigger's place, looking like the closed trigger and
  the same size, so a form can be filled in and sent. The script hides it with
  `hidden` and keeps its options selected to match the list. In React, the
  server render shows the fallback, and the Select hides it once mounted,
  keeping any choice made in it meanwhile. With a placeholder and nothing
  chosen, a form now leaves the name out rather than sending it empty. In HTML,
  replace the hidden inputs with the fallback, as select.md's "In a form" shows.

  Without a script, as here, the native `<select>` shows and sends the value:

  ```html preview
  <div class="hfield">
    <span class="hlabel" id="channel-label">Channel</span>
    <span class="hselect-fallback">
      <select name="channel" aria-labelledby="channel-label">
        <option value="whatsapp" selected>WhatsApp</option>
        <option value="telegram">Telegram</option>
      </select>
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
        <g class="hexpand-chevron-head">
          <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
          <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
        </g>
      </svg>
    </span>
    <button class="hselect" id="channel" type="button" data-name="channel" role="combobox"
      aria-labelledby="channel-label" aria-haspopup="listbox" aria-expanded="false"
      aria-controls="channel-listbox" popovertarget="channel-popup" style="anchor-name: --channel">
      <span class="hselect-value">WhatsApp</span>
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
        <g class="hexpand-chevron-head">
          <line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" />
          <line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" />
        </g>
      </svg>
    </button>
    <div class="hpopup" id="channel-popup" popover style="position-anchor: --channel">
      <ul class="hlistbox" id="channel-listbox" role="listbox" aria-labelledby="channel-label">
        <li class="hoption" id="channel-whatsapp" role="option" data-value="whatsapp" aria-selected="true">
          <span class="hoption-label">WhatsApp</span>
          <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">
            <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" />
          </svg>
        </li>
        <li class="hoption" id="channel-telegram" role="option" data-value="telegram" aria-selected="false">
          <span class="hoption-label">Telegram</span>
        </li>
      </ul>
    </div>
  </div>
  ```

- Password Input: the toggle's tooltip opens at the field's end rather than
  below, `data-side="inline-end"`, so it no longer covers what's under the
  field, such as a form's next field or its button: to its right in a
  left-to-right page, to its left in a right-to-left one, 8px past the field's
  border.
- File Input: the avatar variant's empty picture, a person, has an outline head
  rather than a filled one.
- Password Input: a password that shows is hidden again as its form is sent,
  before the browser reads the form, whether or not a listener cancels the
  send, so the browser never keeps it as a text field's entry; and as the page
  comes back from the back-forward cache, so it isn't showing to whoever
  comes back to it. As before, a reset hides it too. The example script does
  the same.
- CLI: `add` and `theme` refuse to write a file that would land outside the
  folder they write to, as a registry path with `../` or an absolute one
  would, or through a link that leads out of it, and write nothing then.

### Fixed

- Tooltip: one at the left or the right of its trigger, `data-side="left"` or
  `"right"`, and the new inline sides, is placed by the trigger's edges with
  `anchor()` rather than by `position-area`, which Firefox put in the wrong
  place for a trigger in right-to-left text, as far as the window's edge. It
  stays centered on the trigger, 8px from it, and flips only across, to the
  trigger's other side, where there isn't room. The Sidebar's tooltips, on
  the left on a right-to-left page, are placed the same way.

## [0.6.0] - 2026-11-15

Two new components, Table of Contents and Language Picker, and a full audit of
the library: spacing on the golden ratio, motion that's the same everywhere, and
fixes across every component. The version to start with.

### Upgrading

- **With `open` held by you, Dialog, Drawer, and Command Menu ask before they
  open.** While your `open` is `false`, a button that would open one, its
  `trigger` included, and Command Menu's shortcut call `onOpenChange(true)` and
  leave it closed until your `open` is `true`. A close is still the browser's,
  and calls `onOpenChange(false)`, so your `open` must follow it. And
  `onOpenChange` is no longer called as one follows a change you made to `open`.

  What you'll notice: if your `onOpenChange` handles only `false`, its button no
  longer opens it.

  In 0.5, the button opened it, whatever `open` said:

  ```tsx
  <Dialog label="Invite people" closeLabel="Close" trigger={<Button>Invite people</Button>}
    open={open} onOpenChange={(next) => { if (!next) setOpen(false); }}>
  ```

  Now, `open` follows both ways:

  ```tsx
  <Dialog label="Invite people" closeLabel="Close" trigger={<Button>Invite people</Button>}
    open={open} onOpenChange={setOpen}>
  ```

- **Avatar's `alt` is required (React).** `<Avatar>` without `alt` no longer
  compiles, as it rendered an image, or a placeholder with `role="img"`, with no
  name. Pass the person's name, or `alt=""` when the name is shown beside it,
  which hides the avatar from screen readers.

  What you'll notice: a type error where an `<Avatar>` has no `alt`.

  In 0.5, this compiled:

  ```tsx
  <Avatar>JS</Avatar>
  ```

  Now, name it, or hide it beside its name:

  ```tsx
  <Avatar alt="Jane Smith">JS</Avatar>
  <Avatar alt="">JS</Avatar> Jane Smith
  ```

- **Combobox and Date Picker put `className` on their outer element.** In React,
  `className` now goes on `.hcombobox` or `.hdate-picker`, not on the text field
  inside, as it already does on Phone Input and File Input, and on Select's and Time
  Picker's trigger, so a layout class such as `w-40` sizes the whole control. `ref`
  is still the text field.

  What you'll notice: a class that styled the text field itself, such as its text
  color, now lands on the wrapper.

  In 0.5, the class was on the field:

  ```css
  .assignee { color: var(--harmo-color-text-secondary); }
  ```

  Now, reach the field inside it:

  ```css
  .assignee > .hinput { color: var(--harmo-color-text-secondary); }
  ```

- **A Combobox's input names its hidden inputs with `data-name`.** In HTML, the
  example script takes as its own only the hidden inputs right after the popup
  whose `name` is the input's `data-name`, so a hidden input of yours after it is
  left alone. React renders it for you.

  What you'll notice: without `data-name`, a Combobox in pick mode no longer fills
  its hidden input, and one choosing several no longer sends its choices.

  In 0.5:

  ```html
  <input class="hinput" id="assignee" type="text" role="combobox" …>
  …
  <input type="hidden" name="assignee" value="">
  ```

  Now:

  ```html
  <input class="hinput" id="assignee" data-name="assignee" type="text" role="combobox" …>
  …
  <input type="hidden" name="assignee" value="">
  ```

- **Empty State (React) needs a title or a description.** `<EmptyState>` takes
  `label`, `description`, or both, and TypeScript now requires one, as the
  Contract on its page always has.

  What you'll notice: an Empty State with only an icon or actions stops
  compiling.

  In 0.5:

  ```tsx
  <EmptyState icon={<InboxIcon className="hicon" />} />
  ```

  Now:

  ```tsx
  <EmptyState icon={<InboxIcon className="hicon" />} label="No quick replies yet" />
  ```

- **Filters and Filter Bar take one name (React).** `<Filters>` and
  `<FilterBar>` are named with `aria-label`, or now with `aria-labelledby`
  pointing at a heading, and TypeScript requires exactly one.

  What you'll notice: a `<Filters>` or `<FilterBar>` given both stops compiling.

  In 0.5, this compiled, and the browser used the heading:

  ```tsx
  <Filters aria-label="Filters" aria-labelledby="replies-heading" resetLabel="Reset">…</Filters>
  ```

  Now, keep the one that names it, here the heading:

  ```tsx
  <Filters aria-labelledby="replies-heading" resetLabel="Reset">…</Filters>
  ```

- **Your `onClick` and `onKeyDown` on a list or tabs run first, and
  `preventDefault()` in them stops Harmo's handling.** This is your `onClick` on
  an `<Option>`, in any list, a Select's, Combobox's, Filter Chip's, or Command
  Menu's too, and on a `<Tab>`, and your `onKeyDown` on a `<Listbox>`, a
  `<TabList>`, a `<Select>` or `<LanguagePicker>`, a `<Combobox>` or
  `<CommandMenu>`, or the trigger of a `<Popup>` around a Listbox. In 0.5 they ran
  after the choice, the highlight's move, or the selection; now `preventDefault()`
  keeps the option from being chosen, the highlight from moving or the list from
  opening, or the tab from being selected; on a Combobox's or Command Menu's
  field, it also keeps Enter from picking and Escape from closing or emptying.
  A disabled `<Option>` no longer calls `onClick`. In HTML, the example scripts
  leave alone a click on an option, a click or key on a tab, or a key on a
  select's or a language picker's trigger, or on a Combobox's or Command Menu's
  field, that your own handler on it has stopped.

  What you'll notice: a handler that calls `preventDefault()` for another reason,
  such as to keep the page from scrolling, now also stops the choice or the key.
  Harmo already prevents the browser's default for the keys it handles, so call
  `preventDefault()` only for what you handle yourself.

  In 0.5, the arrow keys still moved the highlight:

  ```tsx
  <Listbox aria-label="Assignee" onKeyDown={(event) => {
    event.preventDefault();
    if (event.key === "Delete") unassign();
  }}>
  ```

  Now, prevent only your own key:

  ```tsx
  <Listbox aria-label="Assignee" onKeyDown={(event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      unassign();
    }
  }}>
  ```

- **Meter (React) needs a name.** `<Meter>` takes `aria-label` or
  `aria-labelledby`, and TypeScript now requires one, as the Contract on its page
  always has.

  What you'll notice: a `<Meter>` with neither stops compiling.

  In 0.5:

  ```tsx
  <Meter value={2} max={3} />
  ```

  Now, name it, or give `aria-labelledby` the id of a visible name:

  ```tsx
  <Meter value={2} max={3} aria-label="Password strength" />
  ```

- **TabNav and TabList need a name.** Their types now require `aria-label`, or
  `aria-labelledby` naming a visible heading, as Breadcrumb's and Pagination's
  already do.

  What you'll notice: a `<TabNav>` or `<TabList>` with neither name, or with both,
  no longer compiles.

  In 0.5, this compiled, and rendered an unnamed landmark:

  ```tsx
  <TabNav>…</TabNav>
  ```

  Now, name it:

  ```tsx
  <TabNav aria-label="Settings">…</TabNav>
  <TabList aria-labelledby="replies-heading">…</TabList>
  ```

- **Toast: pressing an action closes its toast.** The Toaster calls your
  `onClick` with the click event, then closes the toast, unless `onClick` calls
  `event.preventDefault()`. A `toast.dismiss(id)` in `onClick` is no longer
  needed.

  What you'll notice: an action meant to keep its toast open, such as one that
  changes it in place, now closes it.

  In 0.5:

  ```tsx
  action: { label: "Try again", onClick: () => toast({ id: "connection", title: "Reconnecting…" }) }
  ```

  Now:

  ```tsx
  action: {
    label: "Try again",
    onClick: (event) => {
      event.preventDefault();
      toast({ id: "connection", title: "Reconnecting…" });
    },
  }
  ```

- **Some props are types now, which an interface can't extend (React).**
  `FilterBarProps`, `MeterProps`, `TabListProps`, and `TabNavProps` require one
  of two names, `EmptyStateProps` a title or a description, and
  `PhoneInputProps` and `SegmentedProps` take a Field's `optional`,
  `description`, and `error` only with its `label`. So each is a union, no longer
  an interface or an object type an interface can extend.

  What you'll notice: `interface … extends PhoneInputProps` stops compiling, with
  "An interface can only extend an object type or intersection of object types
  with statically known members".

  In 0.5:

  ```tsx
  interface ContactPhoneProps extends PhoneInputProps {
    contact: Contact;
  }
  ```

  Now, write a type, with what you add after `&`:

  ```tsx
  type ContactPhoneProps = PhoneInputProps & {
    contact: Contact;
  };
  ```

### Added

- Table of Contents: `.htable-of-contents`, or `<TableOfContents>`, the headings
  of a long page, beside it, with the one you've reached marked.

  ```html preview="table-of-contents/Default"
  <nav class="htable-of-contents" aria-label="On this page">
    <span class="htable-of-contents-marker" aria-hidden="true"></span>
    <ul class="htable-of-contents-list" role="list">
      <li class="htable-of-contents-item"><a class="htable-of-contents-link" href="#overview" aria-current="location">Overview</a></li>
      <li class="htable-of-contents-item"><a class="htable-of-contents-link" href="#milestones">Milestones</a></li>
    </ul>
  </nav>
  ```

- Language Picker: `.hlanguage-picker`, or `<LanguagePicker>`, which switches the
  language a site or app is in. A quiet button shows the language in use, and its
  list names each language in its own, with `lang` so that a screen reader says it
  in that language. Grouped by region, the languages are a panel of regions in
  columns, each with its flag, which your app brings, its name, and its languages
  side by side. Languages can be searched.

  ```html preview="language-picker/Default"
  <button class="hbutton hlanguage-picker" data-variant="tertiary" type="button"
    role="combobox" aria-label="Language" aria-haspopup="listbox" aria-expanded="false"
    aria-controls="language-listbox" popovertarget="language-popup" style="anchor-name: --language">
    <svg class="hicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
    <span class="hbutton-label"><span lang="en">English</span></span>
    <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false">…</svg>
  </button>
  <div class="hpopup" id="language-popup" popover style="position-anchor: --language">
    <ul class="hlistbox" id="language-listbox" role="listbox" aria-label="Language">
      <li class="hoption" id="language-en" role="option" data-value="en" aria-selected="true">
        <span class="hoption-label"><span lang="en">English</span></span>
        <svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false">…</svg>
      </li>
      <li class="hoption" id="language-fr" role="option" data-value="fr" aria-selected="false">
        <span class="hoption-label"><span lang="fr">Français</span></span>
      </li>
    </ul>
  </div>
  ```

- Button: `data-instant`, or `<Button instant>`, makes its width follow a change
  of its text at once, for text that changes often, such as a countdown's
  "Resend code in 30s". `--hbutton-press-duration` sets how long a hold button
  takes to shrink as it's pressed, 160ms by default.
- Combobox: `formatCount`, when choosing several, writes the text of "+N", as on a
  Tag List, such as in your app's digits.
- Date Filter: optional `labels.invalidDate` and `labels.endBeforeStart` explain,
  under the fields, a date that isn't real or two dates out of order. The message
  is a status that also describes Apply; in HTML, it's `.hdate-filter-message`.
  Optional `labels.afterDate` and `labels.beforeDate` word the chip for a date
  with only one side, for languages that put the word after the date.
- Field: `useField`, and its type `FieldControl`, are exported, so a control of
  your own, or another library's, gets a Field's id, its description and error
  in `aria-describedby`, and `aria-invalid`. It passes on the control's own
  `aria-label` too, which names it outside a Field and wins over a Field's label.
- File Input, Phone Input: `label`, `optional`, `description`, and `error`, which
  render the Field, as Select, Combobox, Date Picker, and Time Picker already do.
  A `<Field>` of your own around them still works. File Input shows one message
  below: why a file was refused, or else your `error`.
- Filter Chip: a single-select chip can be cleared. Give it `clearLabel` (in
  HTML, a `.hlistbox-footer` with a button) and, while it has a value, its list
  ends with that button, which empties the chip and calls `onValueChange(null)`.
  `renderValue` shows what you return for the chosen values in the chip, one
  pill each, so option labels written as components, such as a translation, no
  longer show as empty pills. `.hfilter-chip-panel` lays out a panel of the
  chip's own, such as a text filter, with 10px of padding and between its parts;
  use it in place of the inline style the docs showed.
- Filters: `formatCount` writes the count behind More filters, such as in the
  page's own digits; without it, the number shows as before.
- Search: `shortcutHint`, or a Kbd after the input in HTML, shows the shortcut
  that reaches the field, hidden from screen readers. It only shows the hint:
  name the keys with `aria-keyshortcuts` and handle them yourself, as Command
  Menu's `shortcut` does for you. Once there's text, the clear button takes the
  hint's place.
- Segmented Control: `optional`, `description`, and `error`, as on RadioGroup.
  The group is described by them and marked `aria-invalid` while there's an
  error. An `aria-labelledby` you pass now wins over `label`, and inside a
  `<Field control="button">` of your own, that Field's label names the group.
- Sidebar: `<SidebarSubItem>`, a link in a `<SidebarSub>`. It takes text only, so
  TypeScript tells you when an `icon` or `badge` would be dropped. A
  `<SidebarItem>` there still renders as before. `--hsidebar-color-background`
  is the color of its surface.
- Spinner: `--hspinner-duration`, how long a turn takes, 1s, or with reduced
  motion each way of its pulse, so a whole pulse takes 2s; and
  `--hspinner-delay`, how long `data-delay` keeps it hidden, 300ms, set on the
  spinner.
- Table: `--htable-color-background` sets what the headers and footer paint, and
  in a Card they paint the card's background instead of the page's. A
  `.htable-scroll` given a height keeps the headers in view and becomes a named
  region the keyboard can scroll, as a table too wide does; the Table page shows
  how, and says that headers don't stick to the window.
- Tag List: "+N"'s text can be your own, such as Arabic digits, with
  `formatCount` in React, or by your script in HTML; it's `+N` by default, as
  before. Each count it could show is measured as you write it, so the row still
  fits where a smaller count is wider, such as "one other" beside "4 others".
- TextArea: `formatCount` writes the counter in your words and digits, such as
  `` (length, maxLength) => `${maxLength - length} characters left` ``; without
  it, the counter still reads `5/160`.
- Toast: `--htoast-leave-duration` on the region, how long what a changed toast
  showed takes to fade out: 250ms by default, worked out from
  `--harmo-toast-duration`.
- Tokens: `--harmo-control-height-small`, a small Button's 29px;
  `--harmo-font-size-md`, 15px, between `-base` and `-sm`;
  `--harmo-switch-width` and `--harmo-switch-thumb-size`, beside
  `--harmo-switch-height`, all three in rem; and
  `--harmo-color-background-active`, the pressed step past
  `--harmo-color-background-hover`.
- CSS package: `@harmo-ui/css/src/*` reaches the SCSS source, so Dart Sass's
  `pkg:` importer can use the shortcuts, as
  `@use "pkg:@harmo-ui/css/src/_shortcuts.scss" as *`. They write
  `var(--harmo-*)`, so `tokens.css` is still needed on the page.

### Changed

- Accordion: in a small item, the chevron is 10px after the text (was 12px).
- Banner, Spinner: their pages recommend putting a banner or spinner that appears
  after the page loads inside a `role="status"` element that's in the page from
  the start; `role="alert"` on an urgent banner stays as it is.
- Banner, Toast: the action fills with `--harmo-color-background-hover` on hover
  and `--harmo-color-background-active` when pressed, the same in both, and the
  status icon is 20px in both (Banner's was 18px). Where the action doesn't fit
  beside at least 12em of the message, it moves under it, at the end, instead of
  squeezing the message to a word a line. Padding is 10px 16px and gaps 10px
  (were 12px 16px and 12px), from `--harmo-space-xs` and `--harmo-space-sm`;
  spread out, toasts are 10px apart. Toast stays 24px from the window's edges.
- Breadcrumb: the current page now differs from the links in weight as well as
  color. Links are the normal weight, and the current page is medium. The docs
  say the last item is the page's name as plain text.
- Button: while loading or `aria-disabled`, a link Button also ignores a middle
  click, which would open it in a new tab. Its context menu and dragging it still
  work, since only removing its `href` would stop them. The loading spinner's
  fade-in, a hold button's snap-back when let go early, and its fade with reduced
  motion use `--harmo-ease-out-cubic`, so they start a little faster and a
  theme's curve reaches them. A small Button is `--harmo-control-height-small`
  tall (29px, as before), so a theme that changes it resizes small buttons, and
  the room a Copy Field keeps for one.
- Calendar: the weekdays sit 6px above the days, and Previous and Next at least
  6px from the month's name (both were 8px).
- Card: a link or button card is a step darker while pressed, so a tap on a touch
  screen shows.
- Card, Stat: a description, value, or caption sits 6px under what's above it
  (was 4px), a Stat's trend sits at least 6px from its title (was 8px), and a
  Stat's actions are 10px apart (was 8px).
- ChevronToArrow: in React, `width` and `height` size it, 24 when left out;
  before, they were ignored, so a `width` you passed now takes effect. Alone in an
  icon-only Button it's drawn at 20px, as every icon there, which its docs now
  say.
- Combobox: while you type, the list follows the options your app adds or takes
  away, such as a search's results with `filter={false}`. It opens once there's
  something to show and closes when there's nothing; after Escape, Enter, or a
  pick it stays closed until the next keystroke. In pick mode, Enter with the list closed settles
  what's typed, as leaving the field does, so a form sends what the field shows.
  Text that names no option goes back to the pick, and the form isn't sent.
- Command Menu: its dialog opens and closes at once, without a Dialog's fade and
  grow, as its list under a field already does, since a shortcut opens it many
  times a day. In the dialog, the field has 10px above and below (was 12px), the
  empty message 26px (was 24px), and the footer 10px either side (was 12px), with
  6px from a key to its words (was 4px). The trigger's magnifier and shortcut sit
  10px from its ends, and its text 6px after the magnifier (was 8px), where a
  Search field has them.
- Copy Button: it stops saying it's copied as soon as what it copies changes,
  such as a Copy Field's key being regenerated or its form resetting to another,
  rather than up to two seconds later, and a copy that's done only after the
  change doesn't say it's copied at all. In React, that's a new string `value`,
  or a Share Button's new `url`; `onCopy` is still called.
- Date Filter: Apply, or Enter, with nothing changed since the panel opened keeps
  the value exactly as it was, so "the last 30 minutes" or a link's exact range is
  no longer widened to whole days. Enter in a date field applies the filter once
  the fields are complete, as Enter in the amount does; under "is between",
  Enter in the start date only settles it, even with an end date there, and the
  end date's applies. The panel has 10px of padding and between its rows (was
  8px), and its buttons sit 16px below the fields.
- Date Picker: disabled, it renders no popup or Calendar; in HTML, leave out the button's
  `popovertarget` and the popup.
- Dialog: its padding and its distance from the window's edges are 26px
  (`--harmo-space-md`), 16px and 10px on a phone, and its actions sit 10px apart.
  The description sits 6px under the title (was 8px).
- Dialog: an "Unsaved changes" example shows how to keep a dialog open: closing a
  settings form with changes that aren't saved asks first, in a second dialog,
  where Discard fades both out together, in one 150ms exit, and Keep editing goes
  back to the form. The docs explain it: in React, call `preventDefault()` in
  `onCancel`, since `onBeforeToggle` can't stop a close; in HTML, the app's
  `cancel` listener runs before the example script's; and the first closes the
  second as it starts closing, so the second always closes first and focus goes
  back to the button that opened them.
- Drawer: it slides in over 300ms (`--harmo-duration-slow`), since it crosses its
  whole width, and still slides out in 150ms. With reduced motion it fades in
  over 200ms, as before. Its body and footer have 26px padding, as a Dialog has.
  Its header has 16px 26px, with the close button 26px from the title, its
  description sits 6px under the title (was 4px), as a Dialog's, its aside has 42px, and its actions sit
  10px apart.
- Empty State: spacing follows the space scale: 42px above and below and 26px at
  the sides (small: 26px and 10px), the description 6px under the title (was 4px), the icon
  16px above it (small: 10px), and the actions 10px apart, 26px under the text
  (small: 10px).
- Expand Chevron: it folds back down in 150ms (`--harmo-duration-fast`), so it
  finishes with the popup, list, or panel closing with it, in Select, Combobox,
  Accordion, Sidebar, and menu buttons. It still folds up in 200ms.
- Field: its label, control, and error are 6px apart (was 8px), and so are a
  label and what sits beside it, such as the Optional marker, and, in a
  horizontal Field, a checkbox, radio, or switch and its label. A description
  still sits right under its label, and an error with no text takes no room.
- Field: an error is a polite live region, so a message set after focus has moved
  on is announced. React's Field does this for you. In HTML, add
  `aria-live="polite"` to every `.herror`. An error opens over 200ms, where it
  took 300ms, as other panels do, and still closes in 150ms.
- Field: in a horizontal Field, as for a checkbox, radio, or switch, the
  description sits right under the label, as in a stacked Field, rather than 4px
  below it.
- File Input, File List: fades follow `--harmo-ease-out-cubic`, as Popup's and
  Dialog's do, so a theme's curve reaches them, and so does File List's progress
  bar as it grows. The check draws itself over 200ms (`--harmo-duration-normal`),
  where it took 300ms, as other things coming in do.
- Filter Bar: cards are 10px apart, with 10px by 16px of padding (was 8px, and
  12px by 16px).
- Filter Chip: a label too long for its room ends with an ellipsis once the values
  have given way, instead of running past the chip and scrolling the page
  sideways. The chip stays 27px tall, and screen readers still hear the whole
  label. There's 6px between its parts and at its sides, and before and between
  its values (was 4px, and 8px at its sides).
- Filters: the filters in the row, and in the More panel, are 10px apart, and the
  panel has 10px of padding (was 8px apart, with 12px of padding).
- Filters, Filter Bar: can be named with `aria-labelledby` pointing at a heading,
  as well as with `aria-label`. One is required.
- Input: a `type="search"` Input no longer shows the browser's own clear button or
  decorations, so every browser shows the same field. For a clear button, use
  Search.
- Input, TextArea, Search, Password Input, Segmented Control: text sits 10px
  (`--harmo-space-xs`) from the field's edge, 2px closer than before, as every
  text field's and select trigger's does. Search's magnifier and clear button, and
  Password Input's eye, move with it. Search's text starts 6px after the
  magnifier and stops 6px before the clear button (both were 8px).
- Listbox: typing to jump leaves out what's `aria-hidden` in an option's label,
  such as a flag before a name. A Tab that takes focus out of a list's popup,
  from the list, its search field, or its footer, closes the popup, as a Select's
  trigger does. In a multi-select, a disabled option's checkbox dims to
  `--harmo-opacity-disabled`, as a disabled Checkbox does. Options have 10px side
  padding and 10px between their parts, so lists are 4px narrower, while rows
  keep their height. A badge sits 16px after its label (was 20px), and the search
  row's field 6px after its icon (was 8px). A group's divider has 10px on each
  side, and the no-matches message 10px 16px of padding.
- Menu Button: its bars turn back in 150ms as the menu closes, and still turn into
  a cross in 200ms, now on `--harmo-ease-out-cubic`, so they move at once on a
  press.
- Meter: segments are 10px apart (were 12px), from `--harmo-space-xs`. In React,
  `value` is kept between 0 and `max`, and `max` is rounded down to a whole number
  of at least 1, as a native `<meter>` does: `max={Infinity}` no longer throws,
  and a value past `max` is shown and announced as `max`. Its page says to show
  the value as text near the meter where the exact value matters, as Password
  Input does.
- Navigation Menu: hover colors fade in 150ms, as every other hover in Harmo does.
  Moving between panels, the frame resizes on the same ease-in-out curve its rows
  slide on, so they move as one. In a vertical menu, such as on a phone, choosing
  a link without a modifier key closes the Popup it's in, so the menu doesn't stay
  open over the new page. The docs say to keep panels short, since they don't
  scroll. Links and triggers have 10px either side (was 12px), a trigger's chevron
  sits 6px after its text (was 4px), a row's icon tile sits 10px before its
  text (was 12px), and its description 6px under its title (was 8px, and 5px on
  a phone).
- Navigation Menu, Tabs: a disabled trigger or tab looks disabled: tertiary text,
  a not-allowed cursor, and no hover color or background. In Tabs it also gets no
  pill, and the pill leaves a tab that becomes disabled while the pointer rests
  on it.
- Pagination: pages are 6px apart and 10px from Previous and Next (they were 4px
  and 8px), on the spacing scale, so seven pages are about 12px wider.
- Password Input: the strength details open 10px under the field, and the hint
  sits 10px under the bars, where both were 12px.
- Section: spaced on the space scale: the content 26px below the header's line
  (was 24px) and 16px apart (was 20px), the line 10px under the header's text (was
  12px), the description 6px under the title (was 4px), and actions 10px apart
  (was 8px).
- Segmented Control: options are 6px apart (was 8px).
- Select, Combobox, Date Picker, Time Picker, Phone Input: a form reset that
  changes the value calls `onValueChange` with the restored value, unless you hold
  the value. File Input calls `onFileChange(null)` when a reset takes away a file.
  Neither is called once the field has gone, as when your `onReset` closes the
  form it's in.
- Select, Phone Input: with a search row, Down and Up on the closed trigger open
  the list, as on a plain Select, and move focus to the search field.
- Select, Time Picker: the text starts 10px from the trigger's edge and the
  chevron sits 16px from its end, as on Phone Input's country button (12px and
  20px before), so they line up in a form. Combobox's chevron moves with them, and
  choosing several with no choice made, its text starts where an Input's does.
- Selection Bar: with `data-new`, it settles in, fading in and moving 4px into
  place over 200ms, as it takes a toolbar's controls' place, and goes at once; a
  bar there as the page loads, without it, doesn't. With reduced motion it only
  fades. `<SelectionBar>` sets it as it mounts in the browser, not when it's
  rendered on the server and hydrated; in HTML, set it on a bar your script
  shows. Deselect shows that it's pressed, turning `--harmo-color-text`, on
  touch screens too. Its parts are 10px apart (was 8px), and Deselect's side
  padding is 6px, so its text sits 16px from the divider, as the count's does.
- Settings List: a setting's title is `--harmo-font-size-md`, still 15px, so a
  theme's type scale reaches it. The description sits 6px under the title (was
  4px), and a control under the text 16px under the description (was 12px).
- Sidebar: collapsing and expanding, its width glides over 200ms on
  `--harmo-ease-in-out-cubic`, with the page beside it. The labels and chevrons
  fade out quickly as it narrows and back in as it finishes widening, instead of
  vanishing at once, and still name their links while faded. Group labels fold
  away and back with the width, so the rows below glide. All of it is CSS, so the
  HTML example script no longer animates it. Its background is now
  `--hsidebar-color-background`, which a collapsed count's ring also takes: set
  it rather than `background-color` so the two match. The toggle's hover moves, its bend and the edge's 8px, use
  `--harmo-ease-out-cubic`. The toggle is named only by what pressing it does,
  "Collapse" or "Expand". It no longer has `aria-expanded` or `aria-controls`, so
  a screen reader hears "Collapse, button" rather than "Collapse, expanded". In
  HTML, remove both from the toggle's button. The React Sidebar no longer adds an
  id of its own to `.hsidebar`. A link's icon and label are 10px apart (were
  12px), a group's label sits 6px above its links (was 8px), groups are 26px
  apart (were 24px), and a collapsed icon's tooltip and a
  group's panel sit 10px past their row (were 12px).
- Spinner: with reduced motion, its pulse uses `--harmo-ease-in-out-cubic`.
- Status: a bordered Status is as tall as a Tag beside it, 25.5px instead of 23px.
- Switch: sized in rem, from `--harmo-switch-width`, `--harmo-switch-height`, and
  `--harmo-switch-thumb-size`, so it grows with the browser's font size as
  Checkbox and Radio do. It's the same 44×24 at the default size. The thumb slides
  on `--harmo-ease-out-cubic`, so it moves at once on a press.
- Table: the footer's text lines up with the cells' text, with 16px at its sides,
  and its parts are 10px and 42px apart (was 8px and 48px), with "Rows per page"
  6px from its Select (was 8px). Headers have 10px under them (was 12px).
- Tabs: the hover pill follows the pointer in 150ms on `--harmo-ease-out-cubic`,
  so it keeps up with a quick sweep. The underline still slides in 200ms. Each tab
  has 10px either side (was 8px).
- Tag List: `.htag-list` has `role="list"`, so Safari keeps it a list and a screen
  reader says how many tags it shows; add it to your markup. The copies of hidden
  tags in "+N"'s tooltip have no remove buttons or ids, so "+N"'s description is
  only the tags' names. In React, give a tag in a Tag List no `id` or `ref`. While
  "+N" has focus, it stays, even as the list widens, so focus isn't lost; the tags
  are counted again once focus leaves. Before it's counted, as on a page rendered
  on the server, the row is cut at its end instead of running into what's beside
  it, such as a table's next column. Tags are 6px apart (was 4px), in the row and
  in "+N"'s tooltip.
- TextArea: it starts one line tall at an Input's height, 34px (was 38px), with
  6px above and below its text (was 8px). Its height follows
  `--harmo-control-height`, so a theme that changes Input's height changes it too.
- Time Picker: the chosen hour, minute, or period moves at once as the arrow keys
  move it, without a fade, even off an option the pointer rests on; only the
  pointer's hover fades in, once it moves.
- Toast: at the top of the window, the newest toast comes first in the page, as on
  screen, so Tab and screen readers go top to bottom.
- Toolbar: controls are 10px apart, and at least 42px from the filters (was 8px
  and 40px).
- Tooltip: an Escape that hides a tooltip inside a Dialog, Drawer, or Popup now
  hides only the tooltip, and the next Escape closes the overlay, so a half-filled
  form isn't lost to it. It does so in a dialog open over another too, such as
  one that asks before discarding changes, where the next Escape closes only that
  dialog. With a list or popup open over the tooltip, one Escape
  still closes that and hides the tooltip together. One that shows with no delay,
  by keyboard focus or as a neighbor's right after another closed, swaps in and
  out at once, without its fade and grow, so two never overlap down a row of
  icons. The first tooltip after a pause keeps its delay and fade. The example
  script sets `data-instant` on the trigger for this. Its padding is 6px
  (`--harmo-space-2xs`), so a one-line tooltip is 2px shorter, and a hint's is 8px
  10px. Popup's and Tooltip's 8px from their trigger stay as they are.
- Tokens: `--harmo-card-padding` is built from `--harmo-space-sm`, still 16px,
  so a theme that changes the space scale on `:root` reaches it.
- CLI: `harmo-ui add` says when your project doesn't list React DOM, which the
  copied components need along with React.
- CLI: `harmo-ui theme` with a gray lightens its tint until the gray reads on it
  at 4.5:1, as on Pagination's current page, and darkens the gray only if that
  isn't enough, saying so in the file.

### Fixed

- Accordion: `onOpenChange` is called only when an item opens or closes itself,
  not as an item first renders open, nor when your `open` changes.
- Accordion, Card, Stat: Accordion's summary, Card's title and description, and
  Stat's label, trend, and value follow `--harmo-font-line-height`, as the rest of
  each component does. A class of your own overrides the line between Accordion
  items, a small Accordion's summary and content, a tinted Card's icon tile, and
  the parts of a Stat in a group more easily, as their selectors are less
  specific.
- Breadcrumb: links take Link's hover color, `--harmo-link-hover-color-text`, so a
  theme that changes it changes them too.
- Breadcrumb, Menu Button, Sidebar: lighter selectors, so one class of your own
  restyles a separator, the bars, or a collapsed count's dot.
- Button: an icon inside a fragment, such as
  `<><TrashIcon className="hicon" /> Delete</>`, stays out of the label and is
  sized and spaced like any icon. An empty fragment no longer counts as a label,
  so an icon-only button stays square. An `aria-busy` you pass without `loading`
  is kept, on a Copy Button and Share Button too. Shown and relabelled in the same
  change, such as `hidden` lifted as its count changes, it appears at its full
  width rather than growing in from nothing, and its width still animates as its
  text changes when you pass an inline `ref` callback. The loading spinner's fade
  and the hold fill's snap-back follow `--harmo-duration-normal`, so a theme that
  changes it reaches them. A hold to confirm no longer acts when a `<fieldset>`
  around the button is disabled during the hold, or in the moment after it. The
  example script ignores a press on any button with `aria-disabled="true"`, as the
  React Button does, so a submit button sends no form and a link goes nowhere. A
  loading spinner goes after the label, before a trailing icon, and a hold button
  disabled mid-hold stops at once.
- Button, Copy Button, ChevronToArrow, Expand Chevron: an app's rule of the same
  weight, loaded after Harmo, now overrides the rules for a button's icons, the
  copied check, and a resting, focused or expanded chevron.
- Calendar: End in December 9999 moves to the 31st, where it used to throw. The
  chosen date's and today's styles are easier to override, and a chosen today is
  still filled. Rendered on the server with no date, its title becomes a live
  region only once the month has filled in, so the month appearing isn't
  announced.
- Card: the docs say that `icon`, `description`, and `chevron` need `label`, and
  how to make an `<article>` or `<section>` card in React.
- Checkbox: a CheckboxGroup's `onValueChange` reports every checked box in the
  group, also when a Field with `role="group"` is nested inside it.
- Checkbox, Radio: in a horizontal Field, a checkbox or radio larger than the
  default is centered on its label's first line. The docs say a toggle from the
  keyboard changes at once, while one with the pointer fades.
- Checkbox, Radio, Segmented Control: a disabled CheckboxGroup, RadioGroup, or
  Segmented Control disables every option in it, and a required one requires every
  option, even one whose own `disabled` or `required` is `false` or `undefined`.
- ChevronToArrow: the docs say it needs a `width` and `height`, which size it, as
  its CSS doesn't, and that 24 is the size it's drawn for.
- Combobox: in a disabled `<fieldset>`, a click on the box of several no longer
  opens the list. Made read-only while something is typed, leaving the field picks
  nothing from it. A comma typed while an input method is composing no longer ends
  a choice. The example script keeps `form` and `disabled` on the hidden inputs it
  makes, disables them when the field is disabled later, and can't pick an option
  in a group the page hid.
- Command Menu: a disabled trigger looks disabled, as a disabled Search field
  does, with no border on hover, and right to left, the trigger's padding mirrors,
  matching a Search field's. The shortcut is left to the page when the menu is
  inside something hidden, or its trigger is disabled, and pressing it while the
  dialog is closing keeps it open. A field that becomes read-only closes its list,
  and nothing can be picked from it.
- Copy Button: in a Copy Field, the button's focus ring stays inside the field.
  The example script works without Button's script, changing its text at once, and
  the docs say which scripts it uses.
- Date Filter: the dates offered run from 0100-01-03 to 9999-12-28, so a day at
  the very ends of the calendar no longer applies as nothing.
- Date Picker: nothing is arranged while an input method is composing, and the
  Enter that ends composing doesn't settle the date. Disabled or made read-only
  while the Calendar is open, it closes and no day can be picked. Without a hidden
  input, the example script opens on the date the field shows.
- Date Picker, Phone Input: the docs say that `required` stops only an empty
  field, and how to check for a date or number that isn't complete.
- Date Picker, Time Picker: a press dragged off the button no longer keeps the
  popup open the next time focus leaves for the button.
- Dialog: the Next.js recipe no longer counts a click that opens the link in a new
  tab as opening the dialog on this page.
- Dialog, Drawer: a long word in the description, such as an email address or a
  key, breaks rather than running under the close button; in a Dialog's body,
  rather than scrolling sideways. A `value` on a `command="request-close"` button
  becomes `returnValue` once the exit has played, rather than being dropped.
- Drawer: a tooltip, or anything fixed, inside an open drawer is no longer cut off
  at the drawer's edges.
- Empty State: sizes an app sets on a part's class, such as
  `.hempty-state-title { font-size }`, now apply to a small Empty State too.
- Expand Chevron: the docs say it also follows `aria-expanded` on an earlier
  sibling, as beside a Combobox's field.
- Field: a RadioGroup or CheckboxGroup keeps the `aria-label`, `aria-labelledby`,
  `aria-describedby`, and `aria-invalid` you pass it; a description you pass is
  combined with the Field's. An error whose closing is cut short, as when its
  field stops showing mid-close, still clears its text, so screen readers don't
  read a stale message. A label row with the Optional marker is 20px tall, as a
  label alone is, so Fields side by side keep their controls in line.
- Field, Password Input: a link's focus ring in an error or a hint is no longer
  cut at the top and bottom, in browsers that support `overflow-clip-margin`.
- Field, Segmented Control: an `optional`, `labelAccessory`, or `error` of 0
  shows, and an `error` of 0 marks the control invalid; a Segmented Control's
  `label` of 0 names it.
- File Input: an avatar's remove button stays beside the circle when something
  around it stretches the avatar's box.
- File Input: the hint of an area or strip describes the input, so a screen reader
  reads the limits with the button. The remove button presses in 150ms, as every
  Button does; it still settles in as before. An area's icon tile and icon are
  sized in rem, so they grow with the text. The example script no longer throws on
  an avatar whose heading has only its choose label.
- File Input, File List: what's on the page as it loads no longer animates in.
  File Input's file name, remove button, check, and picture, and File List's check
  on a finished file, settle in only when a change puts them there, marked
  `data-new`, which the example scripts set.
- File List: in the Table example, removing a file by keyboard moves focus to the
  next row's remove button, or to the File Input. Each retry button is described
  by its file's name, through `aria-describedby`, so several "Try again" buttons
  are told apart; add it to your markup. The docs say to move focus to your File
  Input once the last file has gone.
- Filter Chip, Date Filter: disabling one while it's open closes its popup. In
  React, a disabled one renders without it.
- Filter Chip, Filters: your own class on a chip's value, or on the count, now
  wins over Harmo's while the chip is hovered or open.
- Filters: opening More filters, or pressing Reset, moves focus to the first
  filter that takes it, skipping one inside a wrapper that's hidden or inert. The
  docs' markup shows a filter in force with its count and Reset showing, and the
  docs now say Reset empties every filter, with a React one given a `defaultValue`
  going back to it.
- Filters, Date Filter, Filter Bar, Selection Bar, Table: text follows
  `--harmo-font-line-height`, as Filter Chip's does.
- Icons: the docs say `npx harmo-ui add chevron` copies `<Chevron>`.
- Input, Select, TextArea, Combobox: hovering a Field's label no longer lights its
  control's border, as browsers count a control as hovered while its label is;
  only the pointer on the control itself does.
- Input, TextArea, Search, Password Input: resetting a form the field joined after
  it rendered, through its `form` attribute, now updates the counter, the clear
  button, the strength, and the marked text.
- Link: a link with an icon breaks a long word, such as an address, instead of
  pushing its icon out of its container.
- Listbox: a popover inside a list's popup, such as a Popup in its footer, no
  longer empties the search or moves the highlight as it opens and closes. In
  React too, moving the pointer onto a group's label or the list's edge clears the
  highlight, so Enter doesn't choose an option the pointer has left. A label cut
  short gets its full text as a title also when the options change while the list
  is open, or when the list narrows without the window changing. The example
  script's search keeps hidden the options and groups your app hid, and shows no
  text of its own when you give it no message.
- Listbox, Drawer: a `footer` or `aside` that renders nothing, such as an empty
  fragment, adds no empty part, and `0` goes inside its part rather than loose.
- Listbox, Tooltip, Drawer: rules that depend on their context weigh no more than
  their target, so your own rule of the same weight wins, such as
  `.hoption-label { color: … }` for options with a description.
- Navigation Menu: a panel's rows stay clear of a classic scrollbar at the
  window's edge.
- Password Input: resetting its form hides a password that was showing, so the
  next one typed doesn't show. Under reduced motion, the strength details fade out
  in place before closing, rather than collapsing at once.
- Password Input, TextArea, Search: without React, the example scripts also follow
  a form's reset: the toggle and strength, the counter, and the clear button start
  over with the value the form puts back.
- Phone Input: read-only, the country can't be changed either, so its list no
  longer opens and empties the number.
- Popup: closed while it's still sliding open, it fades where it is, rather than
  jumping a few pixels first. Closed and opened again at once, it leaves focus
  where it is, such as in a list's search field, rather than sending it to the
  trigger. Placed above or below its trigger, it keeps a transition you set on
  it inline, rather than clearing it.
- Radio: `--harmo-checkbox-size` resizes the dot too, not only the circle.
- Search: without React, the example script hides the clear button when the field
  becomes read-only, and disables it with the field. A disabled field looks
  disabled, with a lighter placeholder and a dimmed magnifier. A shortcut's Kbd no
  longer sits under the clear button, and on a touch screen the text no longer
  runs under the clear button's cross.
- Search, Password Input: with a larger browser font size, the text no longer runs
  under the magnifier, and the eye fits its button; the room kept for the icons
  grows with them.
- Segmented Control: a label wider than the whole group wraps on a row of its own
  instead of spilling past the edge, and labels that fit stay on one line. Hover
  no longer outweighs the checked state, so your own rule for the checked option,
  loaded after Harmo, holds on hover.
- Select: outside its form, joined with `form`, the example script keeps sending
  its value once it's changed.
- Select, Combobox, Time Picker: a form reset restores the `defaultValue` they
  have at the time, such as one that arrived after loading, and follows a `form`
  prop that changes.
- Select, Time Picker, Combobox, Date Picker, Phone Input, File Input: each page
  says where `className`, `hidden`, and `ref` go.
- Select, Time Picker: a `ref` still reaches the button after `disabled` is turned
  on and off again.
- Settings List: a Search, a highlighted Input or TextArea, a Combobox, a Phone
  Input, or a Date Picker under a setting's text sits below the description as
  other fields do, and when it's disabled the row's text turns gray.
- Sidebar: in forced colors, the edge and a collapsed count's dot are drawn in
  the system's colors, rather than disappearing. Icons follow the text size, at
  1.25rem, as the labels do; Navigation Menu's row icons do too, at 1rem.
  Collapsed, hovering another icon no longer closes a group while focus is in its
  links, and picking a link returns focus to its group's icon. `exclusive` keeps
  the groups of links in the header and footer to one open at a time too.
- Sidebar, Navigation Menu: an Escape pressed in a dialog or a popup over them is
  that layer's, and no longer closes a collapsed group or an open panel;
  Navigation Menu also leaves an Escape that something else has already handled.
- Stat: the docs say that the hint's focus ring is on its 24px button, with no
  offset.
- Stat, Status: a word too long for its line, such as an ID, breaks in a Stat's
  caption and trend and in a Status, rather than spilling out of a narrow space.
- Table: in a row that links, a press just beside a row's checkbox, in its cell,
  no longer opens the row. With `rowHref`, `onRowClick` is no longer called on a
  Cmd, Ctrl, Shift, or Alt click, which opens the row in a new tab or window. Your
  own class on a cell, such as one that aligns amounts to the end, now wins over
  the table's, and so does your class on a footer under the table. The example
  script names a scroll area that overflows from the table's `aria-labelledby` as
  well as its `aria-label`, and keeps working when storage is blocked. The docs
  list the column of checkboxes and the footer's parts, the truncation limit (the
  smaller of 360px and 42% of the window), and what a script sets on a scroll area
  that overflows.
- Tabs: when the selected tab is hidden or disabled, or none is selected, the
  first tab that's shown and enabled is in the Tab order, so the tabs can still be
  reached. An `aria-disabled` tab is skipped by the arrow keys and can't be
  selected. `<TabPanel hidden>` stays hidden while its tab is selected. The hover
  pill leaves a tab that's hidden while the pointer rests on it.
- Tag: in forced-colors mode, a tag's dot is drawn in the text color rather than
  disappearing. The docs say where focus goes when the last tag is removed by the
  keyboard: to what the tags belong to, such as the field they filter.
- Tag List: in React, tags passed in a fragment are each shown and counted, and a
  hidden tag or an empty string no longer takes a place in the row or counts
  toward "+N". The example script copies a hidden tag into the tooltip again when
  its color or variant changes, not only its text.
- Time Picker: options grow with the text size, and for a period name longer than
  "AM".
- Toast: when focus is on the region itself, as after F8, it goes back where it
  was once the last toast leaves, instead of staying on an empty region. Shown
  while one modal dialog is open inside another, the toasts go into the inner one,
  where they can be clicked, focused and read. A toast whose content changes size
  while it shows, such as a countdown or text spacing a reader sets, is measured
  again, so its text is no longer cut off. A changed toast's old content is
  removed even when a stylesheet turns its fade off, so it no longer stays over
  the new content, and in React, when a toast is changed twice in quick
  succession, each old content fades out on its own, as with the HTML script,
  instead of the first being cut off. In React, a `description` of `0` is shown
  and announced like any other description. `hidden` hides a toast's
  `.htoast-content`, as it does any other part. A `duration` longer than a timer
  can wait (2,147,483,647 ms, about 24.8 days) keeps the toast open instead of
  closing it at once. On a phone in landscape, toasts keep clear of the notch and
  rounded corners at the sides, as they already did at the top and bottom.
  Clicking a toast, or an action that closes its toast, no longer keeps the stack
  spread out, and its toasts from leaving, once the pointer has gone; keyboard
  focus still holds it, and so does F8 pressed after such a click, though focus
  is on the region already. F8 draws the focus ring on the front toast, so you can
  see where focus went, even with one toast. Spread out taller than the window,
  the stack scrolls, with the newest at the edge, instead of older toasts going
  past the top of the window. A toast that arrives while the stack is spread out
  comes in from the edge, as it does when collapsed, instead of only fading in.
  `--harmo-toast-duration: 0ms` now also turns off the fade of a changed toast's
  old content and the sinking of a toast further back, which kept 250ms and
  100ms.
- Toolbar: your own class on what's at the start, such as a fixed width for a
  search field, now wins over the toolbar's. The docs' examples point to Filter
  Chip's page for complete chips, instead of showing chips that can't open.
- Tooltip: after Escape hides a tooltip that a press pins open, such as a Stat's
  hint, a Tag List's "+N", or a Copy Button's "Copied", the next press shows it
  again. `hidden` keeps a tooltip hidden on hover, on keyboard focus, and with
  `data-open` too.
- CLI: `harmo-ui add breadcrumb` copies Link's styles, for the links you put in
  it, and `harmo.css` keeps Settings List's styles in alphabetical order with the
  rest, as the full bundle does.
- Docs: the CDN links in the READMEs load the current version rather than 0.1,
  which had no accents, dark mode, or later components. The README names every
  component that uses the provider's link component, including Card,
  FilterBarItem, NavigationMenuLink, Pagination, SidebarItem, and DataTable's
  `rowHref`. The components overview says which files Dialog, Drawer, Field,
  Toast, and Toolbar need loaded with them, lists the attributes the newer
  components use, says what scripts do for Calendar, Date Picker, Time Picker,
  Filter Bar, Tag, and marked text, and shows its attribute table whole.
- Docs: the components overview gives the spacing scale and the measures kept
  off it, how a disabled control looks, which rules are heavier than the rest,
  and that what's frequent, or moved by arrow keys, changes at once. The README
  lists every token a primary color set by hand needs, and completes its list of
  built tokens. The philosophy page says which counts and punctuation Harmo
  writes itself, and how an app writes them its way.
- llms.txt: names every component that needs a script, every word the React
  components need from you, the components that take `<Option>` children, and
  every component that uses the provider's link component.
- llms.txt: lists the names TypeScript requires on Avatar, Empty State, Meter,
  Filters, Filter Bar, TabNav, and TabList, the optional `formatCount` and Date
  Filter's `labels.afterDate` and `labels.beforeDate`, the controls that render
  their own Field, `useField`, and every token a primary color set by hand
  needs.
- Playground: Phone Input's React code to copy includes its `examples.mobile.json`
  import, so it runs as copied.

## [0.5.2] - 2026-11-10

Three new components for forms and files: File Input, File List, and Phone Input.
Also marking text in an Input or TextArea, and a spacing scale.

### Added

- File Input: `.hfile-input`, or `<FileInput>`, which picks one file for your app
  to upload, shows its name, and removes it, with `validate` to refuse a file and
  `defaultFileName` for one already attached. `variant` makes it take a dropped
  file, as a compact strip, a large area, or an avatar circle, and `multiple` takes
  several for your app to hold.

  ```html preview="file-input/Default"
  <div class="hfile-input">
    <label class="hbutton" data-variant="secondary">
      <input class="hfile-input-control" type="file" aria-label="Attachment" />
      <span class="hbutton-label">Choose file</span>
    </label>
  </div>
  ```

- File List: `.hfile-list`, or `<FileList>`, the files your app is holding or
  sending, as rows or a thumbnail grid, with progress and a way to try again.

  ```html preview="file-list/Default"
  <ul class="hfile-list" role="list" aria-label="Attachments" tabindex="-1">
    <li class="hfile-list-item">
      <div class="hfile-list-text"><span class="hfile-list-name">project-brief.pdf</span></div>
    </li>
  </ul>
  ```

- Phone Input: `.hphone-input`, or `<PhoneInput>`, a phone number with a
  searchable country code, formatted as it's typed, using a parser your app brings
  such as `libphonenumber-js`. Harmo gains no dependency.

  ```html preview="phone-input/Default"
  <div class="hphone-input">
    <input class="hinput" type="tel" aria-label="Phone" />
  </div>
  ```

- Input and TextArea: `highlight`, a regular expression whose matches are marked
  as you type, such as the variables in a template.

- Select: `renderValue`, for what the button shows in place of the chosen labels.

- Tokens: `--harmo-space-2xs` to `--harmo-space-2xl`, a spacing scale whose steps
  grow by the golden ratio.

## [0.5.1] - 2026-11-10

A fix for a Toolbar's controls, and a Date Picker's setup in words, in its docs.

### Fixed

- Toolbar: controls stay beside short filters, rather than going below them in a
  row with room for both.

## [0.5.0] - 2026-11-09

Nine new components for lists and dates: Table, with selecting, row links,
columns, and pages; Toolbar, Selection Bar, Filters, Filter Bar, and Date Filter;
and Calendar, Date Picker, and Time Picker.

### Added

- Table: `.htable` on a normal `<table>`, or `<DataTable>` with `useRowSelection`
  and `useColumnVisibility`: selecting rows, rows that are links all the way
  across, choosing columns, and a footer of pages that stays in view.

  ```html preview="table/Default"
  <table class="htable" aria-label="Tasks">
    <thead><tr><th scope="col">Task</th><th scope="col">Status</th></tr></thead>
    <tbody><tr><th scope="row">Write the brief</th><td>Active</td></tr></tbody>
  </table>
  ```

- Toolbar: `.htoolbar`, or `<Toolbar controls={…}>`, a row above a list with
  filters at the start and controls at the end.
- Selection Bar: `.hselection-bar`, or `<SelectionBar>`, what's selected in a list
  and what can be done with it: a count, a way to deselect, then the actions.

  ```html preview
  <div class="hselection-bar">
    <span class="hselection-bar-count" role="status">3 selected</span>
    <button class="hselection-bar-deselect" type="button">Deselect</button>
    <button class="hbutton" data-variant="secondary" data-size="small" type="button">
      <span class="hbutton-label">Assign</span>
    </button>
  </div>
  ```

- Filters: `<Filters>`, a row of Filter Chips above a list: the first few in the
  row, the rest behind a chip with a count of those in force, and a way to reset
  them all. What's chosen stays in your app or your URL.

  ```html preview="filters/With filters in force"
  <div class="hfilters" role="group" aria-label="Filter tasks">
    <button class="hfilter-chip" type="button">
      <span class="hfilter-chip-label">Status</span>
      <span class="hfilter-chip-values">
        <span class="hfilter-chip-value">Active</span>
      </span>
    </button>
    <button class="hfilter-chip" type="button">
      <span class="hfilter-chip-label">More filters</span>
      <span class="hfilters-count">1</span>
    </button>
    <button class="hfilters-reset" type="button">Reset filters</button>
  </div>
  ```

- Date Filter: `<DateFilter>`, a chip that filters a list by date: within the
  last few minutes or months, on a day, between two days, after a day, or before
  one. Its value is `{ gte, lte }` in Unix seconds, so a link can restore it, and
  the panel reopens on the condition the value describes.

  ```html preview="date-filter/Default"
  <button class="hfilter-chip" type="button" aria-haspopup="dialog">
    <span class="hfilter-chip-label">Due date</span>
    <span class="hfilter-chip-values">
      <span class="hfilter-chip-value">Nov 1 – 9, 2026</span>
    </span>
  </button>
  ```

- Filter Bar: `.hfilter-bar`, or `<FilterBar>` with `<FilterBarItem>`s, quick
  filters above a list, as a row of cards that each show how many items they'd
  leave. Links where the filter is in the URL, so it can be shared, or buttons
  where your app holds it.

  ```html preview
  <nav class="hfilter-bar" aria-label="Task status" style="inline-size: 28rem">
    <a class="hfilter-bar-item" href="#all" aria-current="true">
      <span class="hfilter-bar-label">All</span>
      <span class="hfilter-bar-count">128</span>
    </a>
    <a class="hfilter-bar-item" href="#active">
      <span class="hfilter-bar-label">Active</span>
      <span class="hfilter-bar-count">37</span>
    </a>
    <a class="hfilter-bar-item" href="#done">
      <span class="hfilter-bar-label">Done</span>
      <span class="hfilter-bar-count">85</span>
    </a>
  </nav>
  ```

- Calendar: `.hcalendar`, or `<Calendar>`, a month of days to pick a date from.
  The month's name sits between Previous and Next, and the days are a grid of
  real buttons, always six rows, so it stays the same height from month to
  month. Names come from `Intl`, in the language of `locale`, which also says
  where the week starts. The keyboard moves by a day, a week, a month, or a
  year, and `min` and `max` limit what can be chosen. Dates are strings, as
  `"2026-11-09"`, so a timezone can't move them.

  ```html preview="calendar/Default"
  <div class="hcalendar">
    <div class="hcalendar-header"><!-- Previous, the title, Next --></div>
    <table class="hcalendar-grid" role="grid" aria-labelledby="month-title">
      <!-- the weekdays, then six rows of days -->
    </table>
  </div>
  ```

- Date Picker: `.hdate-picker`, or `<DatePicker>`, a date typed in the locale's
  order, or chosen from a Calendar that a button in the field opens. Digits get
  their separators as you type, a date that doesn't exist stays in the field,
  marked invalid, and `name` sends the date as `2026-11-09`. `natural` takes a
  date parser your app brings, such as `chrono-node`, so "in 2 days" works, and
  `time` keeps the time too, as `2026-11-09T14:00`. Harmo gains no dependency:
  your app installs the parser and passes it in.

  ```html preview="date-picker/Default"
  <div class="hdate-picker">
    <input class="hinput" type="text" inputmode="numeric" autocomplete="off" />
    <!-- the button, and a hidden input with the date -->
  </div>
  <!-- a Popup holding a Calendar -->
  ```

- Time Picker: `.htime-picker`, or `<TimePicker>`, a time of day chosen from a
  column each for the hour, the minute, and, on a 12-hour clock, AM or PM. The locale decides the clock, its digits, and the order of
  the columns, and `name` sends the time as `14:30`.

  ```html preview="time-picker/Default"
  <button class="htime-picker" type="button" aria-haspopup="dialog">
    <span class="htime-picker-value">02:30 PM</span>
  </button>
  <!-- a Popup holding a listbox for each column -->
  ```

### Fixed

- Popup: one inside another no longer marks the outer one as closed, or resets
  what's in it, when it opens or closes.
- Popup: one fading out no longer takes presses from what's under it.
- Popup: Escape from one opened over another hands focus back to what opened it,
  as a browser does only for the first one open.
- Popup: in Firefox, one whose direction isn't the page's, such as a right-to-left
  widget on a left-to-right page, lines up with what opened it.
- Filter Chip: a value keeps its background while the chip is hovered or open.

## [0.4.0] - 2026-11-08

Thirteen new components, among them Sidebar, Command Menu, Combobox, Navigation
Menu, and Pagination, and a card's icon, title, description, and chevron.

### Upgrading

- **A list's message for no matches is a status.** So a screen reader reads it
  as it appears, `.hlistbox-empty` gets `role="status"` and is in the page from
  the start, empty until nothing matches. `<Listbox>`, `<Select>`,
  `<FilterChip>`, and `<Combobox>` do this themselves. In HTML, render it empty
  after the list, and fill it when nothing matches, rather than add it then.

  What you'll notice: if you keep adding it when nothing matches, it looks the
  same, but a screen reader may not read it.

  In 0.3.0, added when nothing matches:

  ```html
  <p class="hlistbox-empty">No agents found</p>
  ```

  In 0.4.0, in the page from the start, and filled when nothing matches:

  ```html
  <p class="hlistbox-empty" role="status"></p>
  ```

### Added

- Accordion: `<details class="haccordion-item">` with its
  `<summary class="haccordion-summary">`, in a `.haccordion`, or
  `<Accordion>` with `<AccordionItem>`s: items that each show or hide their
  content, such as questions and their answers. Items that share a `name`, or
  `<Accordion exclusive>`, open one at a time. It needs no script: the browser
  opens and closes it, and the content grows and shrinks in CSS. One item on
  its own is a panel to show or hide. `data-size="small"`, or `size="small"`,
  makes it compact, with 14px text.

  ```html preview
  <div class="haccordion" style="inline-size: 24rem">
    <details class="haccordion-item" name="changelog-questions" open>
      <summary class="haccordion-summary">
        <span class="haccordion-label">How am I billed?</span>
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
      </summary>
      <div class="haccordion-content">
        <p>Each month, for the conversations your team handled that month.</p>
      </div>
    </details>
    <details class="haccordion-item" name="changelog-questions">
      <summary class="haccordion-summary">
        <span class="haccordion-label">Can I change my plan later?</span>
        <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
      </summary>
      <div class="haccordion-content">
        <p>Yes, at any time, in Settings under Plans.</p>
      </div>
    </details>
  </div>
  ```

- Card: given a `.hcard-title`, a card lays out its parts: an icon in a
  `.hcard-icon` tile at the start, the title and a `.hcard-description`
  beside it, and a ChevronToArrow with `hcard-chevron` at the end, which
  turns into an arrow while the card is hovered or focused, as in a list of
  settings pages or help links. Each but the title can be left out. In a card
  that's a link or a button, the title is in the accent. In React, `<Card
  icon label description chevron>`.

  ```html preview
  <div style="display: grid; gap: 4px; inline-size: 24rem">
    <a class="hcard" data-variant="ghost" href="#security">
      <span class="hcard-icon" aria-hidden="true"><svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M18 10.75C17.59 10.75 17.25 10.41 17.25 10V8C17.25 4.85 16.36 2.75 12 2.75C7.64 2.75 6.75 4.85 6.75 8V10C6.75 10.41 6.41 10.75 6 10.75C5.59 10.75 5.25 10.41 5.25 10V8C5.25 5.1 5.95 1.25 12 1.25C18.05 1.25 18.75 5.1 18.75 8V10C18.75 10.41 18.41 10.75 18 10.75Z" fill="currentColor" /> <path d="M12 19.25C10.21 19.25 8.75 17.79 8.75 16C8.75 14.21 10.21 12.75 12 12.75C13.79 12.75 15.25 14.21 15.25 16C15.25 17.79 13.79 19.25 12 19.25ZM12 14.25C11.04 14.25 10.25 15.04 10.25 16C10.25 16.96 11.04 17.75 12 17.75C12.96 17.75 13.75 16.96 13.75 16C13.75 15.04 12.96 14.25 12 14.25Z" fill="currentColor" /> <path d="M17 22.75H7C2.59 22.75 1.25 21.41 1.25 17V15C1.25 10.59 2.59 9.25 7 9.25H17C21.41 9.25 22.75 10.59 22.75 15V17C22.75 21.41 21.41 22.75 17 22.75ZM7 10.75C3.42 10.75 2.75 11.43 2.75 15V17C2.75 20.57 3.42 21.25 7 21.25H17C20.58 21.25 21.25 20.57 21.25 17V15C21.25 11.43 20.58 10.75 17 10.75H7Z" fill="currentColor" /> </svg></span>
      <h3 class="hcard-title">Security</h3>
      <p class="hcard-description">Two-step verification, and the devices signed in to your account.</p>
    </a>
    <a class="hcard" data-variant="ghost" href="#contact">
      <p class="hcard-title">Talk to us</p>
      <p class="hcard-description">Questions about plans or setup? We're glad to help.</p>
      <svg class="hicon hchevron-to-arrow hcard-chevron" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"> <g class="hchevron-to-arrow-head"> <line class="hchevron-to-arrow-upper" x1="12" y1="6" x2="12" y2="12" /> <line class="hchevron-to-arrow-lower" x1="12" y1="18" x2="12" y2="12" /> </g> <line class="hchevron-to-arrow-shaft" x1="6" y1="12" x2="15" y2="12" /> </svg>
    </a>
  </div>
  ```

- Combobox: `<div class="hcombobox">` with an Input of `role="combobox"`, and a
  Listbox in a popup, or `<Combobox>`, a text field that filters a list as you
  type: to pick one of its options, or, with `freeText`, to be helped by it.
  The arrow keys move through the list while focus stays in the field, Enter
  picks, and Escape closes the list, then empties the field. Field's
  `control="combobox"` names the field and its list. With `data-multiple`, or
  `multiple`, it chooses several, each a Tag in the field with a remove
  button, as in an email's To field, and stays one row high: the tags that
  fit, then "+N" for the rest, or, while you're in it, every tag in a row
  that scrolls. With free text too, typed text, such as an address, is a
  choice of its own.

  ```html preview="combobox/Default"
  <div>
    <div class="hcombobox" style="anchor-name: --changelog-assignee">
      <input class="hinput" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-label="Assign to" placeholder="Search agents" value="" />
      <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
    </div>
  </div>
  ```

- Command Menu: `.hcommand-menu`, or `<CommandMenu>`, places to go and
  things to do, found by typing, such as pages, settings, and "New ticket",
  and results your app finds as you type, such as customers. Under a Search
  field, its list opens in a popup, as in a dashboard's header; with `modal`,
  a button that looks like a Search field opens it in a dialog near the top
  of the window, as on a website. Typing filters by each option's label,
  description, and keywords, and marks what matched; the arrow keys move
  while focus stays in the field, and Enter goes to the highlighted one. A
  shortcut, such as ⌘K or /, reaches it from anywhere on the page. Under a
  field, its list opens and closes at once, as it's opened many times a day;
  the dialog fades in as a Dialog does.

  ```html preview="command-menu/Default"
  <div style="display: grid; gap: 12px; inline-size: 20rem">
    <div class="hsearch">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <input class="hinput" type="text" aria-label="Search" placeholder="Search" />
      <kbd class="hkbd" aria-hidden="true">/</kbd>
    </div>
    <button class="hcommand-menu-trigger" type="button">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <span class="hcommand-menu-trigger-label">Search documentation</span>
      <kbd class="hkbd" aria-hidden="true">Ctrl K</kbd>
    </button>
  </div>
  ```

- Copy Button: `<button class="hbutton hcopy">`, or `<CopyButton>`, copies
  text, such as a link or an ID, and says so in place: for two seconds, its
  icon turns into a check, its tooltip or its text says it's copied, and a
  status tells screen readers. `.hcopy-field`, or `<CopyField>`, puts one
  inside a read-only Input in a monospace font, for a value such as a key.
  `<ShareButton>` opens the device's share sheet where the browser has one,
  and elsewhere copies the link. A new token, `--harmo-font-family-mono`, is
  for text that's read character by character.

  ```html preview="copy/With its text"
  <button class="hbutton hcopy" data-variant="secondary" type="button">
    <span class="hicon hcopy-icons" aria-hidden="true"><svg class="hcopy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M10.5 8.5H17.5C18.6 8.5 19.5 9.4 19.5 10.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H10.5C9.4 19.5 8.5 18.6 8.5 17.5V10.5C8.5 9.4 9.4 8.5 10.5 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /> <path d="M6.5 15.5H6C5.17 15.5 4.5 14.83 4.5 14V6C4.5 5.17 5.17 4.5 6 4.5H14C14.83 4.5 15.5 5.17 15.5 6V6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /> </svg><svg class="hcopy-done" viewBox="4.85 4.88 16 16" fill="none" aria-hidden="true" focusable="false"> <path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" /> </svg></span>
    <span class="hbutton-label">Copy</span>
  </button>
  ```

- Empty State: `<div class="hempty-state">`, or `<EmptyState>`, what shows
  where there's nothing yet, such as a list before its first item, a search
  with no results, or a page you're not allowed to see: an icon, a title
  that's a heading, a description, and actions. It's centered, or lined up at
  its start with `data-align="start"`; `data-size="small"` fits it inside a
  page, and `data-variant="dashed"` gives it a dashed border.

  ```html preview
  <div class="hempty-state" style="inline-size: 24rem">
    <div class="hempty-state-icon" aria-hidden="true"><svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17.8701 21.8698C17.5601 21.8698 17.2501 21.7898 16.9701 21.6198L12.9601 19.2397C12.5401 19.2297 12.1201 19.1998 11.7201 19.1398C11.4501 19.0998 11.2201 18.9197 11.1201 18.6597C11.0201 18.3997 11.0701 18.1197 11.2501 17.9097C11.9101 17.1397 12.2501 16.2197 12.2501 15.2397C12.2501 12.8197 10.1201 10.8497 7.50008 10.8497C6.52008 10.8497 5.58007 11.1198 4.79007 11.6398C4.57007 11.7798 4.30007 11.7998 4.06007 11.6898C3.83007 11.5798 3.66008 11.3597 3.63008 11.0997C3.60008 10.8197 3.58008 10.5398 3.58008 10.2498C3.58008 5.28976 7.88008 1.25977 13.1601 1.25977C18.4401 1.25977 22.7401 5.28976 22.7401 10.2498C22.7401 12.9698 21.4801 15.4697 19.2601 17.1797L19.6001 19.8998C19.6801 20.5798 19.3801 21.2198 18.8101 21.5898C18.5301 21.7698 18.2001 21.8698 17.8701 21.8698ZM13.1501 17.7297C13.2901 17.7197 13.4301 17.7598 13.5501 17.8398L17.7401 20.3298C17.8501 20.3998 17.9401 20.3698 18.0001 20.3298C18.0501 20.2998 18.1301 20.2198 18.1101 20.0798L17.7201 16.9197C17.6901 16.6397 17.8101 16.3698 18.0301 16.2098C20.0701 14.7798 21.2401 12.5997 21.2401 10.2297C21.2401 6.09974 17.6201 2.73975 13.1601 2.73975C8.87008 2.73975 5.35007 5.85979 5.09007 9.77979C5.84007 9.48979 6.65008 9.32977 7.49008 9.32977C10.9401 9.32977 13.7401 11.9697 13.7401 15.2197C13.7501 16.0997 13.5401 16.9497 13.1501 17.7297Z" fill="currentColor"/> <path d="M4.57977 22.7498C4.31977 22.7498 4.06977 22.6798 3.83977 22.5298C3.38977 22.2398 3.14978 21.7398 3.20978 21.2098L3.40977 19.6698C2.05977 18.5698 1.25977 16.9398 1.25977 15.2298C1.25977 13.2798 2.27978 11.4598 3.98978 10.3698C5.01978 9.69981 6.23977 9.33984 7.50977 9.33984C10.9598 9.33984 13.7598 11.9798 13.7598 15.2298C13.7598 16.5498 13.2798 17.8498 12.3998 18.8798C11.2698 20.2498 9.57977 21.0498 7.71977 21.1098L5.27977 22.5598C5.05977 22.6898 4.81977 22.7498 4.57977 22.7498ZM7.49977 10.8398C6.51977 10.8398 5.57976 11.1098 4.78976 11.6298C3.50976 12.4498 2.74977 13.7898 2.74977 15.2298C2.74977 16.6198 3.42978 17.8898 4.62978 18.7098C4.85978 18.8698 4.97977 19.1398 4.94977 19.4198L4.72977 21.1298L7.11977 19.7098C7.23977 19.6398 7.36977 19.5998 7.49977 19.5998C8.96977 19.5998 10.3598 18.9698 11.2398 17.8998C11.8998 17.1198 12.2498 16.1998 12.2498 15.2198C12.2498 12.8098 10.1198 10.8398 7.49977 10.8398Z" fill="currentColor"/> </svg></div>
    <h3 class="hempty-state-title">No quick replies yet</h3>
    <p class="hempty-state-description">Save answers you send often, and add them to a chat in two clicks.</p>
    <div class="hempty-state-actions">
      <button class="hbutton" type="button"><svg class="hicon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"> <path d="M12 5V19M5 12H19" /> </svg><span class="hbutton-label">Add quick reply</span></button>
    </div>
  </div>
  ```

- Expand Chevron: in the `<summary>` of an open `<details>`, it points up,
  with no script, as in an Accordion item.

- Listbox: an option's description under its label, as `.hoption-text`
  holding the label and a `.hoption-description`, or `<Option description>`,
  and `<mark class="hoption-match">` for what a search found in either.
  `<Option keywords>` are words a search finds it by that it doesn't show,
  such as "billing" for Plans, and `<OptionGroup filter={false}>` keeps a
  search from hiding its options, such as results your app found for it. A
  search, in a Select, a Combobox, or a Command Menu, finds an option by its
  label, description, and keywords.

  ```html preview
  <div>
    <ul class="hlistbox" role="listbox" aria-label="Go to" style="inline-size: 18rem">
      <li class="hoption" role="option" aria-selected="false" data-active>
        <span class="hoption-text"><span class="hoption-label"><mark class="hoption-match">An</mark>alytics</span> <span class="hoption-description">Reports</span></span>
      </li>
      <li class="hoption" role="option" aria-selected="false">
        <span class="hoption-text"><span class="hoption-label">Pl<mark class="hoption-match">an</mark>s</span> <span class="hoption-description">Settings</span></span>
      </li>
    </ul>
  </div>
  ```

- Menu Button: `<button class="hbutton hmenu-button">`, or `<MenuButton>`, three
  bars that turn into a cross while it's expanded, for opening a site's menu on
  a phone.

  ```html preview="menu-button/Default"
  <button class="hbutton hmenu-button" data-variant="secondary" data-size="small" type="button" aria-label="Menu" aria-expanded="false"><svg class="hicon hmenu-button-bars" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><line class="hmenu-button-top" x1="3" y1="5" x2="17" y2="5" /><line class="hmenu-button-middle" x1="3" y1="10" x2="17" y2="10" /><line class="hmenu-button-bottom" x1="3" y1="15" x2="17" y2="15" /></svg></button>
  ```

- Navigation Menu: `<nav class="hnavigation-menu">`, or `<NavigationMenu>`, a
  site's main navigation: links, and triggers that each open a panel of rows, on
  hover, a click, or Enter. One frame shows the open panel, resizing as you move
  between triggers while the rows slide. Each panel follows its trigger in the
  page, so Tab goes from a trigger into its links. `data-orientation="vertical"`
  stacks the triggers, with each panel opening in place, for a phone.

  ```html preview="navigation-menu/Default"
  <nav class="hnavigation-menu" aria-label="Main">
    <div class="hnavigation-menu-frame" aria-hidden="true"></div>
    <ul class="hnavigation-menu-list">
      <li><a class="hnavigation-menu-link" href="#product">Product</a></li>
      <li><button class="hnavigation-menu-trigger" type="button" aria-expanded="false">Solutions<svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg></button></li>
      <li><button class="hnavigation-menu-trigger" type="button" aria-expanded="false">Resources<svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg></button></li>
    </ul>
  </nav>
  ```

- Pagination: `<nav class="hpagination">`, or `<Pagination>`, moves through
  a list shown a page at a time: Previous and Next, as Buttons, and the page
  numbers between them if you show them, the first and last pages and the one
  you're on with one either side, so the row keeps its width, up to 999
  pages. Each is a link where the page is in the URL, or a button where your
  app holds it. On the first or last page, Previous or Next stays in place,
  disabled. On a phone, only Previous and Next show.

  ```html preview="pagination/Numbered"
  <nav class="hpagination" aria-label="Pages">
    <a class="hbutton" data-variant="secondary" href="?page=4" rel="prev"><svg class="hicon hchevron" data-direction="back" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" /></svg><span class="hbutton-label">Previous</span></a>
    <ul class="hpagination-pages">
      <li><a class="hpagination-page" href="?page=1" aria-label="Page 1">1</a></li>
      <li class="hpagination-ellipsis" aria-hidden="true">…</li>
      <li><a class="hpagination-page" href="?page=4" aria-label="Page 4">4</a></li>
      <li><a class="hpagination-page" href="?page=5" aria-label="Page 5" aria-current="page">5</a></li>
      <li><a class="hpagination-page" href="?page=6" aria-label="Page 6">6</a></li>
      <li class="hpagination-ellipsis" aria-hidden="true">…</li>
      <li><a class="hpagination-page" href="?page=12" aria-label="Page 12">12</a></li>
    </ul>
    <a class="hbutton" data-variant="secondary" href="?page=6" rel="next"><span class="hbutton-label">Next</span><svg class="hicon hchevron" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M8.79048 5C8.58956 5 8.38863 5.07186 8.23001 5.22585C7.92333 5.52355 7.92333 6.01631 8.23001 6.31402L14.0886 12.0013L8.23001 17.6885C7.92333 17.9863 7.92333 18.479 8.23001 18.7767C8.53668 19.0744 9.04428 19.0744 9.35096 18.7767L15.77 12.5454C16.0767 12.2477 16.0767 11.7549 15.77 11.4572L9.35096 5.22585C9.19233 5.07186 8.99141 5 8.79048 5Z" fill="currentColor" /></svg></a>
  </nav>
  ```

- Search: `<div class="hsearch">` around an Input with `type="search"`, or
  `<Search>`, a field for searching, such as above a list: filled in gray,
  with a magnifier at its start and an optional clear button at its end once
  there's text. Escape empties it too, and stops there, so a dialog around it
  stays open. A Kbd after the input shows the shortcut that reaches it, such
  as /.

  ```html preview
  <div>
    <div class="hsearch">
      <svg class="hicon" width="1.125em" height="1.125em" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M11.5 21.75C5.85 21.75 1.25 17.15 1.25 11.5C1.25 5.85 5.85 1.25 11.5 1.25C17.15 1.25 21.75 5.85 21.75 11.5C21.75 17.15 17.15 21.75 11.5 21.75ZM11.5 2.75C6.67 2.75 2.75 6.68 2.75 11.5C2.75 16.32 6.67 20.25 11.5 20.25C16.33 20.25 20.25 16.32 20.25 11.5C20.25 6.68 16.33 2.75 11.5 2.75Z" fill="currentColor" /><path d="M21.9995 22.7499C21.8095 22.7499 21.6195 22.6799 21.4695 22.5299L19.4695 20.5299C19.1795 20.2399 19.1795 19.7599 19.4695 19.4699C19.7595 19.1799 20.2395 19.1799 20.5295 19.4699L22.5295 21.4699C22.8195 21.7599 22.8195 22.2399 22.5295 22.5299C22.3795 22.6799 22.1895 22.7499 21.9995 22.7499Z" fill="currentColor" /></svg>
      <input class="hinput" type="search" placeholder="Search conversations" aria-label="Search conversations" />
    </div>
  </div>
  ```

- Section: `<section class="hsection">`, or `<Section>`, a part of a page,
  such as a group of settings: its title, an optional description, and
  optional actions at its end, over a line, then its content, stacked. It
  styles only its own parts, and names itself by its title, so screen readers
  can jump to it.

  ```html preview
  <div>
    <section class="hsection" aria-labelledby="widget-title">
      <header class="hsection-header">
        <div class="hsection-text">
          <h2 class="hsection-title" id="widget-title">Chat widget</h2>
          <p class="hsection-description">How the widget greets people on your site.</p>
        </div>
        <div class="hsection-actions">
          <button class="hbutton" data-variant="secondary" type="button">
            <span class="hbutton-label">Preview</span>
          </button>
          <button class="hbutton" type="button">
            <span class="hbutton-label">Save changes</span>
          </button>
        </div>
      </header>
      <div class="hsection-body">
        <div class="hfield">
          <label class="hlabel" for="widget-greeting">Greeting</label>
          <input class="hinput" id="widget-greeting" type="text" value="Hi! How can we help?" />
        </div>
      </div>
    </section>
  </div>
  ```

- Sidebar: `.hsidebar` around `<nav class="hsidebar-nav">`, or `<Sidebar>`,
  an app's navigation down the side: links in groups, each an icon and its
  label, with a count such as unread messages, and the page you're on marked
  by `aria-current="page"`. A link can open links under it (a
  `<details class="hsidebar-sub">`), each group on its own, or, sharing a
  `name` or with `<Sidebar exclusive>`, one at a time, with no script.
  A toggle just past its edge collapses it to its icons alone
  (`data-collapsed`), each naming itself in a tooltip, with its groups
  opening beside it, one at a time. On a narrow screen, it can go in a
  Drawer.

  ```html preview
  <div class="hsidebar" style="block-size: auto">
    <nav class="hsidebar-nav" aria-label="Changelog example">
      <div class="hsidebar-group">
        <p class="hsidebar-group-label" id="changelog-sidebar-tools">Tools</p>
        <ul class="hsidebar-list" aria-labelledby="changelog-sidebar-tools">
          <li class="htooltip-trigger">
            <a class="hsidebar-item" href="#">
              <svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17.79 22.75H6.21C3.47 22.75 1.25 20.52 1.25 17.78V10.37C1.25 9.00997 2.09 7.29997 3.17 6.45997L8.56 2.25997C10.18 0.999974 12.77 0.939974 14.45 2.11997L20.63 6.44997C21.82 7.27997 22.75 9.05997 22.75 10.51V17.79C22.75 20.52 20.53 22.75 17.79 22.75ZM9.48 3.43997L4.09 7.63997C3.38 8.19997 2.75 9.46997 2.75 10.37V17.78C2.75 19.69 4.3 21.25 6.21 21.25H17.79C19.7 21.25 21.25 19.7 21.25 17.79V10.51C21.25 9.54997 20.56 8.21997 19.77 7.67997L13.59 3.34997C12.45 2.54997 10.57 2.58997 9.48 3.43997Z" fill="currentColor"/> <path d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18C12.75 18.41 12.41 18.75 12 18.75Z" fill="currentColor"/> </svg>
              <span class="hsidebar-label">Home</span>
            </a>
          </li>
          <li class="htooltip-trigger">
            <a class="hsidebar-item" href="#" aria-current="page">
              <svg class="hicon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"> <path d="M17 20.75H7C2.59 20.75 1.25 19.41 1.25 15V14.5C1.25 14.09 1.59 13.75 2 13.75C2.96 13.75 3.75 12.96 3.75 12C3.75 11.04 2.96 10.25 2 10.25C1.59 10.25 1.25 9.91 1.25 9.5V9C1.25 4.59 2.59 3.25 7 3.25H17C21.41 3.25 22.75 4.59 22.75 9V10C22.75 10.41 22.41 10.75 22 10.75C21.04 10.75 20.25 11.54 20.25 12.5C20.25 13.46 21.04 14.25 22 14.25C22.41 14.25 22.75 14.59 22.75 15C22.75 19.41 21.41 20.75 17 20.75ZM2.75 15.16C2.77 18.6 3.48 19.25 7 19.25H17C20.34 19.25 21.15 18.66 21.24 15.66C19.81 15.32 18.75 14.03 18.75 12.5C18.75 10.97 19.82 9.68 21.25 9.34V9C21.25 5.43 20.58 4.75 17 4.75H7C3.48 4.75 2.77 5.4 2.75 8.84C4.18 9.18 5.25 10.47 5.25 12C5.25 13.53 4.18 14.82 2.75 15.16Z" fill="currentColor"/> <path d="M10 7.25C9.59 7.25 9.25 6.91 9.25 6.5V4C9.25 3.59 9.59 3.25 10 3.25C10.41 3.25 10.75 3.59 10.75 4V6.5C10.75 6.91 10.41 7.25 10 7.25Z" fill="currentColor"/> <path d="M10 14.58C9.59 14.58 9.25 14.24 9.25 13.83V10.16C9.25 9.75003 9.59 9.41003 10 9.41003C10.41 9.41003 10.75 9.75003 10.75 10.16V13.83C10.75 14.25 10.41 14.58 10 14.58Z" fill="currentColor"/> <path d="M10 20.75C9.59 20.75 9.25 20.41 9.25 20V17.5C9.25 17.09 9.59 16.75 10 16.75C10.41 16.75 10.75 17.09 10.75 17.5V20C10.75 20.41 10.41 20.75 10 20.75Z" fill="currentColor"/> </svg>
              <span class="hsidebar-label">Tickets</span>
              <span class="hsidebar-badge">3</span>
            </a>
          </li>
          <li class="htooltip-trigger">
            <details class="hsidebar-sub">
              <summary class="hsidebar-item">
                <svg class="hicon" width="20" height="20" viewBox="0 0 25 25" fill="none" aria-hidden="true" focusable="false"> <path d="M12.6154 14.05C12.4854 14.05 12.3554 14.02 12.2354 13.95L3.40538 8.84C3.05538 8.63 2.92538 8.17 3.13538 7.81C3.34538 7.45 3.80538 7.33 4.16538 7.54L12.6154 12.43L21.0154 7.57C21.3754 7.36 21.8354 7.49 22.0454 7.84C22.2554 8.2 22.1254 8.66 21.7754 8.87L13.0054 13.95C12.8754 14.01 12.7454 14.05 12.6154 14.05Z" fill="currentColor"/> <path d="M12.6154 23.11C12.2054 23.11 11.8654 22.77 11.8654 22.36V13.29C11.8654 12.88 12.2054 12.54 12.6154 12.54C13.0254 12.54 13.3654 12.88 13.3654 13.29V22.36C13.3654 22.77 13.0254 23.11 12.6154 23.11Z" fill="currentColor"/> <path d="M12.6154 23.5C11.7354 23.5 10.8654 23.31 10.1754 22.93L4.83539 19.96C3.38539 19.16 2.25539 17.23 2.25539 15.57V9.92C2.25539 8.26 3.38539 6.34 4.83539 5.53L10.1754 2.57C11.5454 1.81 13.6854 1.81 15.0554 2.57L20.3954 5.54C21.8454 6.34 22.9754 8.27 22.9754 9.93V15.58C22.9754 17.24 21.8454 19.16 20.3954 19.97L15.0554 22.93C14.3654 23.31 13.4954 23.5 12.6154 23.5ZM12.6154 3.5C11.9854 3.5 11.3654 3.63 10.9054 3.88L5.56539 6.85C4.60539 7.38 3.75539 8.82 3.75539 9.92V15.57C3.75539 16.67 4.60539 18.11 5.56539 18.65L10.9054 21.62C11.8154 22.13 13.4154 22.13 14.3254 21.62L19.6654 18.65C20.6254 18.11 21.4754 16.68 21.4754 15.57V9.92C21.4754 8.82 20.6254 7.38 19.6654 6.84L14.3254 3.87C13.8654 3.63 13.2454 3.5 12.6154 3.5Z" fill="currentColor"/> </svg>
                <span class="hsidebar-label">Campaigns</span>
                <svg class="hexpand-chevron" viewBox="0 0 16 12" aria-hidden="true" focusable="false"><g class="hexpand-chevron-head"><line class="hexpand-chevron-left" x1="0" y1="6" x2="8" y2="6" /><line class="hexpand-chevron-right" x1="16" y1="6" x2="8" y2="6" /></g></svg>
              </summary>
              <ul class="hsidebar-sub-list">
                <li class="hsidebar-sub-heading" aria-hidden="true">Campaigns</li>
                <li><a class="hsidebar-sub-item" href="#">Runs</a></li>
                <li><a class="hsidebar-sub-item" href="#">Templates</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </nav>
  </div>
  ```

- Stat: `<div class="hstat">`, or `<Stat>`, a number to watch, such as the
  tickets that came in today: its label, which is a heading, how it has
  changed, such as "+12%", the number, and a caption, with an info button
  whose tooltip explains it, and an action, such as a link. The trend is
  neutral, since whether up is good depends on the number; with a hint, such
  as the periods it compares, it's a button for its tooltip. A press pins a
  tooltip open, for a touch screen. In a `.hstat-group`, or `<StatGroup>`,
  each Stat is a tile on a tray, as many to a row as fit, with numbers and
  captions lined up across a row.

  ```html preview
  <div class="hstat-group" style="inline-size: 32rem">
    <div class="hstat">
      <div class="hstat-header">
        <div class="hstat-title"><h3 class="hstat-label">New tickets</h3></div>
        <span class="hstat-trend" data-direction="up"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4.28326 17C3.95708 17 3.6309 16.8815 3.37339 16.6275C2.87554 16.1366 2.87554 15.324 3.37339 14.833L8.86695 9.41554C9.14163 9.14467 9.50215 9.00923 9.897 9.04309C10.2747 9.07695 10.618 9.28011 10.8412 9.60177L12.7124 12.3782L18.8069 6.36822C19.3047 5.87726 20.1288 5.87726 20.6266 6.36822C21.1245 6.85918 21.1245 7.6718 20.6266 8.16275L13.4163 15.2732C13.1416 15.5441 12.7811 15.6795 12.3863 15.6456C12.0086 15.6118 11.6652 15.4086 11.4421 15.087L9.57082 12.3105L5.19313 16.6275C4.93562 16.8815 4.60944 17 4.28326 17Z" fill="currentColor" /><path d="M19.7143 12C19.0114 12 18.4286 11.4171 18.4286 10.7143V8.57143H16.2857C15.5829 8.57143 15 7.98857 15 7.28571C15 6.58286 15.5829 6 16.2857 6H19.7143C20.4171 6 21 6.58286 21 7.28571V10.7143C21 11.4171 20.4171 12 19.7143 12Z" fill="currentColor" /></svg>+12%</span>
      </div>
      <p class="hstat-value">128</p>
      <p class="hstat-caption">Compared to yesterday</p>
    </div>
    <div class="hstat">
      <div class="hstat-header">
        <div class="hstat-title"><h3 class="hstat-label">First response time</h3></div>
        <span class="hstat-trend" data-direction="down"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M19.7167 17C19.3906 17 19.0644 16.8815 18.8069 16.6275L12.7124 10.6175L10.8412 13.394C10.6352 13.7157 10.2747 13.9188 9.897 13.9527C9.50215 13.9865 9.12446 13.8511 8.86695 13.5802L3.37339 8.16275C2.87554 7.6718 2.87554 6.85918 3.37339 6.36822C3.87124 5.87726 4.69528 5.87726 5.19313 6.36822L9.57082 10.6853L11.4421 7.90881C11.6481 7.60408 11.9914 7.40092 12.3863 7.35013C12.7811 7.31628 13.1588 7.45171 13.4163 7.72259L20.6266 14.833C21.1245 15.324 21.1245 16.1366 20.6266 16.6275C20.3691 16.8815 20.0429 17 19.7167 17Z" fill="currentColor" /><path d="M19.7143 17H16.2857C15.5829 17 15 16.4171 15 15.7143C15 15.0114 15.5829 14.4286 16.2857 14.4286H18.4286V12.2857C18.4286 11.5829 19.0114 11 19.7143 11C20.4171 11 21 11.5829 21 12.2857V15.7143C21 16.4171 20.4171 17 19.7143 17Z" fill="currentColor" /></svg>−18%</span>
      </div>
      <p class="hstat-value">4m 12s</p>
      <p class="hstat-caption">Median, in working hours</p>
    </div>
  </div>
  ```

- Tag: `.htag-remove`, or `<TagRemove>`, a button after the text that
  removes the tag, such as a filter: a 12px cross with a 24px target, named
  in your app's language.

  ```html preview="tag/With a remove button"
  <div>
    <span class="htag">
      Billing
      <button class="htag-remove" type="button" aria-label="Remove Billing">
        <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
      </button>
    </span>
  </div>
  ```

- Tag List: `<ul class="htag-list">`, or `<TagList>`, tags in one row that
  never wraps, such as a ticket's tags in a table: as many as fit its width,
  then "+N" for the rest, which shows them on hover and keyboard focus. It
  counts again as the width changes.

  ```html preview
  <div>
    <ul class="htag-list">
      <li>
        <span class="htag" style="--htag-color: var(--harmo-amber)">
          <span class="htag-dot" aria-hidden="true"></span>Billing
        </span>
      </li>
      <li><span class="htag">Refund</span></li>
      <li hidden><span class="htag">Partner</span></li>
      <li hidden><span class="htag">Urgent</span></li>
      <li class="htag-list-more">
        <span class="htooltip-trigger">
          <button class="htag-list-count" type="button" aria-label="2 more" aria-describedby="changelog-tags-more">+2</button>
          <span class="htooltip" data-variant="hint" role="tooltip" id="changelog-tags-more">
            <span class="htag-list-rest">
              <span class="htag">Partner</span>
              <span class="htag">Urgent</span>
            </span>
          </span>
        </span>
      </li>
    </ul>
  </div>
  ```

- Tooltip: `data-open` on `.htooltip-trigger` shows it until removed, for a
  tooltip a press pins open, as on a touch screen, which neither hovers nor
  shows keyboard focus. A Tag List's "+N" uses it.

  ```html
  <div>
    <span class="htooltip-trigger" data-open>
      <button class="hbutton" data-variant="secondary" type="button" aria-describedby="changelog-pinned-tip">
        <span class="hbutton-label">Export</span>
      </button>
      <span class="htooltip" role="tooltip" id="changelog-pinned-tip">Download the current view as CSV</span>
    </span>
  </div>
  ```

### Changed

- Button: an icon beside the label is drawn at 20px, as an icon-only
  button's is, whatever size its SVG declares, so icons from different sets
  match each other and the loading spinner. In 0.3.0 it kept its SVG's own
  size, so a 24px icon beside a label looked bigger than an 18px one.
  ChevronToArrow and the Expand Chevron keep their own sizes.

### Fixed

- A list, in a Select or a popup, keeps its keyboard highlight when it opens
  or moves under a pointer at rest; leaving it clears the highlight only once
  the pointer has moved in it.
- `<OptionGroup hidden>` hides the group and its options: it showed them,
  and the arrow keys reached them. The example script, `listbox.js`, skips
  the options of a hidden group too.
- React: a part given something that draws nothing, such as `true`, `[]`,
  or an empty fragment, is left out, as one given `null` is, rather than
  rendered empty, such as a Tooltip with no text or an Option's empty
  description.
- `<Tooltip label={0}>` or `description={0}` names or describes its control
  and shows 0 in the tooltip: a 0 was taken for no text, leaving the control
  unnamed and a stray 0 beside it.

## [0.3.0] - 2026-11-07

Three overlays, Dialog, Drawer, and Toast, and destructive buttons, with
hold to confirm.

### Added

- Dialog: `<dialog class="hdialog">`, or `<Dialog>`, a modal window for a task
  or a decision. A button opens it with `commandfor` and
  `command="show-modal"`, or with React's `trigger`; code or a URL can open it
  with `open` and `onOpenChange`. The browser holds the page behind, moves
  focus in and back out, and closes it on Escape, and with `closedby="any"`, on
  a click outside. It opens in 200ms, growing from 95%, and fades out in 150ms
  before it closes, in every browser: the React Dialog, or the example script
  with plain HTML, holds the close until the fade has played.
  `<DialogClose>` makes a button close it.

  ```html preview
  <div>
    <button class="hbutton" type="button" commandfor="invite-dialog" command="show-modal">
      <span class="hbutton-label">Invite people</span>
    </button>
    <dialog class="hdialog" id="invite-dialog" closedby="any"
      aria-labelledby="invite-dialog-title" aria-describedby="invite-dialog-description">
      <header class="hdialog-header">
        <h2 class="hdialog-title" id="invite-dialog-title">Invite people</h2>
        <p class="hdialog-description" id="invite-dialog-description">
          They get an email with a link to join this workspace.
        </p>
        <button class="hbutton hdialog-close" data-variant="tertiary" type="button"
          commandfor="invite-dialog" command="request-close" aria-label="Close">
          <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
        </button>
      </header>
      <form method="dialog">
        <div class="hdialog-body">
          <div class="hfield">
            <label class="hlabel" for="invite-email">Email</label>
            <input class="hinput" id="invite-email" name="email" type="email" autocomplete="email" autofocus />
          </div>
        </div>
        <footer class="hdialog-footer">
          <button class="hbutton" data-variant="secondary" type="button"
            commandfor="invite-dialog" command="request-close">
            <span class="hbutton-label">Cancel</span>
          </button>
          <button class="hbutton" type="submit">
            <span class="hbutton-label">Send invite</span>
          </button>
        </footer>
      </form>
    </dialog>
  </div>
  ```
- Drawer: `<dialog class="hdrawer">`, or `<Drawer>`, a modal panel at the
  window's end edge, the full height of the window, for a form or details. It
  opens, closes, and takes focus as Dialog does, slides in and out, and has a
  body that scrolls, a footer under it, and an optional aside beside them,
  such as a preview. `<DrawerClose>` makes a button close it.

  ```html preview
  <div>
    <button class="hbutton" type="button" commandfor="reply-drawer" command="show-modal">
      <span class="hbutton-label">New quick reply</span>
    </button>
    <dialog class="hdrawer" id="reply-drawer" closedby="closerequest"
      aria-labelledby="reply-drawer-title">
      <header class="hdrawer-header">
        <h2 class="hdrawer-title" id="reply-drawer-title">New quick reply</h2>
        <button class="hbutton hdrawer-close" data-variant="tertiary" type="button"
          commandfor="reply-drawer" command="request-close" aria-label="Close">
          <svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>
        </button>
      </header>
      <form method="dialog">
        <div class="hdrawer-body">
          <div class="hfield">
            <label class="hlabel" for="reply-shortcut">Shortcut</label>
            <input class="hinput" id="reply-shortcut" name="shortcut" type="text" autofocus />
          </div>
        </div>
        <footer class="hdrawer-footer">
          <button class="hbutton" data-variant="secondary" type="button"
            commandfor="reply-drawer" command="request-close">
            <span class="hbutton-label">Cancel</span>
          </button>
          <button class="hbutton" type="submit">
            <span class="hbutton-label">Save</span>
          </button>
        </footer>
      </form>
    </dialog>
  </div>
  ```
- Toast: `toast()` and `<Toaster>`, or `<section class="htoaster">` with a
  script, a short message at the bottom of the window that goes away by
  itself, with an icon by status, an optional description, and an optional
  action. Toasts stack, newest in front, spread out on hover, a tap, or F8,
  and leave one at a time; the same id changes a toast in place, and its box
  changes shape with a spring. They show at the bottom center, or at the top
  or bottom, at the start, center, or end. While a Dialog or Drawer is open,
  toasts show inside it, where they can be used. Inspired by
  [Sonner](https://sonner.emilkowal.ski), by
  [Emil Kowalski](https://emilkowal.ski), and its change of shape by the
  Dynamic Island in his [Animations on the Web](https://animations.dev)
  course.

  ```html preview
  <div>
    <button
      class="hbutton"
      data-variant="secondary"
      type="button"
      data-example-toast-status="success"
      data-example-toast-title="Quick reply saved"
      data-example-toast-description="Type /ship in a chat to use it."
    >
      <span class="hbutton-label">Save quick reply</span>
    </button>
  </div>
  ```

  In an app, `toast()` sends one, with `<Toaster>` once near the root:

  ```tsx
  toast({
    status: "success",
    title: "Quick reply saved",
    description: "Type /ship in a chat to use it.",
  });
  ```
- Destructive buttons: Button's `destructive`, or `data-destructive`, red in
  any variant, for an action that destroys something.

  ```html preview
  <div>
    <button class="hbutton" data-destructive type="button">
      <span class="hbutton-label">Delete workspace</span>
    </button>
    <button class="hbutton" data-variant="secondary" data-destructive type="button">
      <span class="hbutton-label">Remove member</span>
    </button>
    <button class="hbutton" data-variant="tertiary" data-destructive type="button">
      <span class="hbutton-label">Discard draft</span>
    </button>
  </div>
  ```
- Hold to confirm: Button's `onHold`, or `data-hold` with a `.hbutton-hold`
  fill, for an action that's hard to undo, such as "Hold to delete". Held
  for 1.5 seconds (`holdDuration`), by pointer or by Enter or Space, its
  fill wipes across, red on a destructive button and the accent on any
  other, and the action runs. A screen reader's press runs it at once.

  At rest, and held all the way (`data-held`). Its script does the holding;
  this one has none, so it shows the two looks without holding:

  ```html preview
  <div>
    <button class="hbutton" data-variant="secondary" data-size="small" data-destructive type="button" data-hold>
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
      <span class="hbutton-label">Hold to delete</span>
      <span class="hbutton-hold" aria-hidden="true">
        <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
        <span class="hbutton-label">Hold to delete</span>
      </span>
    </button>
    <button class="hbutton" data-variant="secondary" data-size="small" data-destructive type="button" data-hold data-held>
      <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
      <span class="hbutton-label">Hold to delete</span>
      <span class="hbutton-hold" aria-hidden="true">
        <svg class="hicon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 6.75H19.5" /><path d="M9.75 6.75V5.25C9.75 4.42 10.42 3.75 11.25 3.75H12.75C13.58 3.75 14.25 4.42 14.25 5.25V6.75" /><path d="M6.75 6.75L7.5 18C7.56 19.24 8.34 20.25 9.75 20.25H14.25C15.66 20.25 16.44 19.24 16.5 18L17.25 6.75" /><path d="M10.5 10.5V16.5" /><path d="M13.5 10.5V16.5" /></svg>
        <span class="hbutton-label">Hold to delete</span>
      </span>
    </button>
  </div>
  ```

  In React:

  ```tsx
  <Button variant="secondary" size="small" destructive loading={deleting} onHold={remove}>
    <TrashIcon className="hicon" />
    {deleting ? "Deleting" : "Hold to delete"}
  </Button>
  ```
- Button's `commandfor` and `command` props, for the button's command on
  another element, such as opening a dialog:

  ```tsx
  <Button commandfor="invite-dialog" command="show-modal">
    Invite people
  </Button>
  ```
- Tokens: `--harmo-dialog-backdrop-color`, and `--harmo-font-size-lg`, 20px,
  for a dialog's title; `--harmo-ease-spring`, a spring with about 3%
  overshoot; and `--harmo-toast-duration`, `--harmo-toast-ease`, and
  `--harmo-toast-morph-duration`; `--harmo-color-danger-background` and
  `--harmo-color-danger-border`, a tint and border around danger text; and
  `--harmo-color-danger-fill`, `-hover`, `-active`, and
  `--harmo-color-on-danger`, for a destructive button.

### Changed

- A Button's width changes over 200ms when its text or loading state does,
  rather than jumping, and its spinner fades in.
- An icon beside a Button's label sits 3px further in, so it looks as far
  from the border as the label's text.
- The Settings list is a component, under Forms, rather than a pattern. Its
  page moved to `docs/components/settings.md`.

## [0.2.0] - 2026-11-06

Dark mode, eight accents, a theme for any brand color with
`npx harmo-ui theme`, and two new components, Kbd and Card.

### Upgrading

- **Buttons and switches use the new fill tokens.** A primary button's colors
  are now `--harmo-color-primary-fill`, `--harmo-color-primary-fill-hover`, and
  `--harmo-color-primary-fill-active`, and a switch's is
  `--harmo-color-primary-fill`. On `:root` they follow your
  `--harmo-color-primary`: the fill is the primary, one step darker on hover and
  another when pressed.

  What you'll notice: if you set `--harmo-color-primary-hover` or
  `--harmo-color-primary-active` to restyle buttons, they now hover one step
  darker than your primary, not in your hover color. Set the fill tokens
  instead; the other two still color text and links.

  In 0.1.1:

  ```css title="globals.css"
  :root {
    --harmo-color-primary: #0f75b6;
    --harmo-color-primary-hover: #0265a0;
    --harmo-color-primary-active: #005589;
  }
  ```

  In 0.2.0:

  ```css title="globals.css"
  :root {
    --harmo-color-primary: #0f75b6;
    --harmo-color-primary-fill-hover: #0265a0;
    --harmo-color-primary-fill-active: #005589;
  }
  ```

  Or run `npx harmo-ui theme "#0f75b6"`, which sets every role, in light and
  dark mode.
- **A theme on an element needs the fill tokens there too.** A token built from
  another is worked out on `:root`, so on an element, the fills don't follow a
  primary set there.

  What you'll notice: in a section you colored with `--harmo-color-primary`,
  what uses the primary itself takes the color, such as an accent tag, but
  buttons and switches stay purple:

  ```html preview
  <section style="--harmo-color-primary: light-dark(#0f75b6, #30aed9)">
    <span class="htag" data-variant="accent">Unread</span>
    <button class="hbutton" type="button">
      <span class="hbutton-label">Save</span>
    </button>
    <input class="hswitch" type="checkbox" role="switch" checked aria-label="Email recaps" />
  </section>
  ```

  Set the fills on the section as well:

  ```html preview
  <section
    style="
      --harmo-color-primary: light-dark(#0f75b6, #30aed9);
      --harmo-color-primary-fill: light-dark(#0f75b6, #1f6bb0);
      --harmo-color-primary-fill-hover: light-dark(#0a5d92, #2478c4);
      --harmo-color-primary-fill-active: light-dark(#064c79, #1b62a0);
    "
  >
    <span class="htag" data-variant="accent">Unread</span>
    <button class="hbutton" type="button">
      <span class="hbutton-label">Save</span>
    </button>
    <input class="hswitch" type="checkbox" role="switch" checked aria-label="Email recaps" />
  </section>
  ```

  An accent on the section, such as `data-harmo-accent="blue"`, sets them for
  you.

### Added

- Dark mode. Every color is a light and dark pair, through `light-dark()`. A
  page stays light until it opts in with `color-scheme: dark`, or
  `color-scheme: light dark` to follow the system, on `:root` or on any part of
  the page.
- Accents. `data-harmo-accent` on `<html>`, or on any element, recolors what's
  inside it: `purple` (the default), `blue`, `teal`, `green`, `amber`, `red`,
  `pink`, or `mono`, which is black, or near-white in dark mode. Each passes
  WCAG AA in every role, in both modes. `index.css` includes them, and
  `npx harmo-ui add` copies `accents.css` with `tokens.css`; with
  per-component imports, load `accents.css` after `tokens.css`.
- `npx harmo-ui theme "<hex>"`, which writes `harmo-theme.css`: your brand
  color in every role, in light and dark mode, at WCAG AA, adapted from the
  nearest accent. It adds the file to `harmo.css` when there is one.
- Kbd: `<kbd class="hkbd">`, or `<Kbd>`, for a key or shortcut, such as Enter
  or ⌘K, in text or on a button.
- Card: `.hcard`, or `<Card>`, a frame around a group of content, tinted by
  default, `raised`, or `ghost` for rows that lead somewhere.
- Tokens: `--harmo-color-primary-fill`, `-fill-hover`, and `-fill-active`, for
  what has white text on it, Button and Switch;
  `--harmo-link-hover-text-decoration`; and `--harmo-card-padding`.

### Changed

- A primary button is one step darker on hover and another when pressed, and
  in dark mode one step lighter on hover, instead of turning dark purple.
- `@harmo-ui/react` declares `"sideEffects": false`, so a bundler can leave out
  the components an app doesn't use.
- The packages' npm pages link to [harmo-ui.com](https://harmo-ui.com).

### Fixed

- A popup, and the list inside it, stay 8px from the window's edge, as on a
  phone, and a list fills a popup wider than its 32rem cap.
- An open list no longer shows the browser's own focus ring, clipped by its
  popup. When the list has keyboard focus and no option is highlighted, its
  popup shows Harmo's focus ring.
- The React README shows `HarmoProvider` in a Client Component, as the Next.js
  App Router needs.

## [0.1.1] - 2026-11-03

The first release on npm: 26 components and the Settings list pattern, in
CSS and React, and `npx harmo-ui add`.

### Added

- `@harmo-ui/css`: Avatar, Banner, Breadcrumb, Button, Checkbox,
  ChevronToArrow, Expand chevron, Field, Filter chip, Icons, Input, Link,
  Listbox, Meter, Password input, Popup, Radio, Segmented control, Select,
  Spinner, Status, Switch, Tabs, Tag, TextArea, and Tooltip, and the Settings
  list pattern, themed with `--harmo-*` custom properties.
- `@harmo-ui/react`: the same components in React, rendering the same markup.
- `harmo-ui`: `npx harmo-ui add <component>`, which copies components, with
  their styles and what they need, into a project.

[Unreleased]: https://github.com/windrunner21/harmo/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/windrunner21/harmo/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/windrunner21/harmo/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/windrunner21/harmo/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/windrunner21/harmo/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/windrunner21/harmo/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/windrunner21/harmo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/windrunner21/harmo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/windrunner21/harmo/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/windrunner21/harmo/releases/tag/v0.1.1
