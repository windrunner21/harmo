# @harmo-ui/react

React components for [Harmo](https://github.com/windrunner21/harmo), a CSS-first
UI library for dashboards and applications. They render the same markup as
Harmo's HTML examples, with the behavior built in.

## Install

```sh
bun add @harmo-ui/css @harmo-ui/react
# or: npm install @harmo-ui/css @harmo-ui/react
```

It needs React 19.3 or later, and ships as both ES modules and CommonJS.

## Use

Load the CSS once, then use the components:

```tsx
import "@harmo-ui/css";
import { Button, Field, Input } from "@harmo-ui/react";

<Field label="Email address" description="We'll send your receipt here.">
  <Input name="email" type="email" />
</Field>

<Button type="submit">Save changes</Button>
```

Set your router's link component and your framework's image component once, at
the root:

```tsx
<HarmoProvider linkComponent={NextLink} imageComponent={NextImage}>
  {children}
</HarmoProvider>
```

Harmo builds in no text: every word a component shows or announces comes from
you.

## Learn more

- [Components](https://github.com/windrunner21/harmo/blob/master/docs/components/README.md):
  each one's props, under its React section
- [Theming](https://github.com/windrunner21/harmo#theming)

Harmo is at `0.x`, so its APIs may still change between releases.

## License

[MIT](LICENSE)
