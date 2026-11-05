# Philosophy

Why Harmo is built the way it is. The [README](../README.md) covers what
Harmo is and how to use it; this page covers the principles behind the
components, their APIs, and their motion. Contributors should read this
before adding or changing a component.

## Simple, intuitive, and polished

Aim for the clarity and care associated with Apple's interfaces: familiar
behavior, thoughtful defaults, clear hierarchy, and precise feedback. Apply
that same care to the developer experience.

- **Clarity at the point of use.** A component's name and props should
  explain what it does where it is used. Clarity matters more than the
  shortest spelling.
- **Useful defaults.** Common tasks should need little configuration.
  Additional options should answer real needs rather than expose every
  implementation detail.
- **Familiar vocabulary.** Prefer native HTML names and attributes.
  Introduce new terms only when they make a meaningful distinction.
- **Predictable customization.** Consumers should be able to change a theme
  or component without fighting specificity or understanding the entire
  library.

## Building blocks that compose

Each component should have a clear responsibility and work with other pieces
without knowing product-specific details.

- Button owns an action; Link owns navigation; Tabs move between sibling
  pages.
- Input, TextArea, Checkbox, Radio, and Switch own their native controls.
- Field arranges and connects labels, descriptions, controls, and errors.
  The application owns validation and values.
- Icons, ChevronToArrow, and the Expand chevron compose through children in
  Links and Buttons.
- Breadcrumb provides a complete navigation trail, while standalone
  navigation links remain useful independently.
- Tag says what something is; Status says what state it's in.
- More complex controls compose shared foundations: Popup owns positioning
  and dismissal, Listbox owns option selection, and Select combines them.
  Password input combines Input, a toggle, and Meter.
- Use dashboard interfaces to test these decisions.

Use component families where they help organization. Composition does not
require an atoms/molecules/organisms folder hierarchy.

## API guidelines

- Component names communicate purpose; appearance options do not change
  semantics.
- Preserve native attributes, events, refs, and consumer-provided classes.
- Keep native attributes such as `type`, `disabled`, and `required`
  meaningful.
- Use `children` for content placed in order, such as labels, icons, and
  custom content, as in the HTML. Parts with a fixed place, such as a field's
  label and error, are props. Do not repurpose the native `title` attribute as
  visible button text.
- Build in no text. Every word a component shows or announces, such as a
  password toggle's "Show password", comes from the app as a prop or
  children, as it does in the HTML. Props are required wherever text would
  otherwise be missing, so a translated app can't show a stray English word.
- Prefer value/change callbacks over requiring React state setters.
- Support controlled and uncontrolled usage where the underlying control
  allows it.
- `href` makes a link, a plain anchor by default, and an Avatar's `src` a
  plain `<img>`. An app sets its router's link component and its framework's
  image component once, with `HarmoProvider`, so Harmo's core never requires
  Next.js or another router.
- Provide deliberate keyboard access, focus visibility, and accessible
  naming.

These examples show the React API:

```tsx
<Button type="submit">Save changes</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="tertiary">Show details</Button>

<Button variant="secondary"><ChevronToArrow direction="back" /> Go back</Button>
<Button>Continue <ChevronToArrow /></Button>
<Button variant="tertiary" aria-label="Close"><CloseIcon className="hicon" /></Button>

<Link href="/reports">View reports</Link>
<Button href="/reports" variant="secondary">View reports</Button>

<Link href="/reports">
  View reports <ChevronToArrow />
</Link>

// Once, at the app's root, so links navigate on the client and images load optimized.
// In the Next.js App Router, from a Client Component that wraps the root layout's children.
<HarmoProvider linkComponent={NextLink} imageComponent={NextImage}>
  {children}
</HarmoProvider>

<Field label="Email address" description="We'll send your receipt here." error={emailError}>
  <Input name="email" type="email" />
</Field>
```

## Styling principles

- **One shared styling implementation.** Author SCSS in
  `packages/css/src` and compile it to CSS in `packages/css/dist`. HTML and
  React use the same styles.
- **Explicit component classes.** Hooks such as `.hbutton`, `.hlink`, and
  `.hinput` opt elements into styling. The React components add those
  classes automatically; a containing `data-harmo` element is not required.
- **Palette plus useful roles.** Keep recognizable colors such as white and
  purple, alongside roles such as text, border, focus, and secondary
  background. Different roles may share a default while remaining
  independently customizable.
- **Predictable token names.** Token names are inspired by Stripe's Elements
  Appearance API: what is colored comes first, then the variant, then the
  state — `--harmo-color-text-secondary`, `--harmo-color-background-hover`,
  `--harmo-color-primary-active`. Components prefix their own tokens the
  same way: `--harmo-button-secondary-color-border`,
  `--harmo-input-color-background`. `--harmo-color-*` are roles; plain names
  such as `--harmo-purple` are the palette they default to.
- **Low specificity.** Keep overrides straightforward and scope internal
  selectors to their component. Avoid generic global classes such as
  `.icon` or `.action`.
- **Source ownership.** Aim to publish readable CSS and SCSS source
  alongside copyable React components.

Authoring details (Sass shortcuts, property order, build commands) live in
[CONTRIBUTING.md](../CONTRIBUTING.md). Per-component markup, hooks, states,
and tokens live in [docs/components](components/README.md).

## Interaction and motion

- Motion explains a change or provides useful feedback.
- Frequent actions remain fast; animation must not delay input.
- Interactions remain interruptible during rapid input and changes of
  direction.
- Every component responds clearly to keyboard, pointer, and touch.
  Keyboard feedback is immediate; pointer hover and touch behavior are
  deliberate.
- Reduced motion gets a designed alternative that preserves state feedback.
- Avoid layout shifts, unnecessary rendering, and unbounded
  `transition: all` rules.
- Use native CSS for simple feedback. Keep reusable effects such as
  ChevronToArrow independent of the control containing them.
- Use the installed animations.dev course-based guidance during motion
  work, and validate behavior in a browser rather than treating source
  review as visual approval.
