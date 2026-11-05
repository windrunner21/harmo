# harmo-ui

Copy the components of [Harmo](https://harmo-ui.com), a CSS-first
UI library for dashboards and applications, into your project, with their styles,
and make them yours.

## Use

From your project's root:

```sh
npx harmo-ui add tabs
```

That copies Tabs, its styles, and whatever it needs:

```text
src/components/harmo/
  harmo.css
  tokens.css
  tabs/Tabs.tsx
  tabs/TabNav.tsx
  tabs/useTabsMotion.ts
  tabs/tabs.css
  provider/HarmoProvider.tsx
  lib/children.ts
  lib/withClass.ts
```

Import `harmo.css` once, in your root layout or entry file. It lists the tokens and
each component's styles, and `npx harmo-ui add` keeps it up to date. Then use the
component:

```tsx
import "@/components/harmo/harmo.css";
import { Tabs, TabList, Tab, TabPanel } from "@/components/harmo/tabs/Tabs";
```

`@/` is the path alias a default Next.js project sets up. Without one, use a relative
path.

The files are yours to change, and only React is left to depend on. They need React
19.3 or later and TypeScript.

## Commands

| Command | Effect |
| --- | --- |
| `npx harmo-ui add <component...>` | Copies components, with their styles and what they need |
| `npx harmo-ui add --all` | Copies every component |
| `npx harmo-ui list` | Lists the components |
| `npx harmo-ui theme <color>` | Writes `harmo-theme.css`: your brand color, as a hex code, in every role, in light and dark mode |

| Option for `add` and `theme` | Effect |
| --- | --- |
| `-p`, `--path <folder>` | Where to write. By default `components/harmo`, or `src/components/harmo` if the project has a `src` folder. Pass it each time you use another folder |
| `-o`, `--overwrite` | Replaces files that differ from Harmo's, without asking |
| `--dry-run` | Shows what would change, and changes nothing |

## Your brand color

```sh
npx harmo-ui theme "#0f75b6"
```

That writes `harmo-theme.css` next to `harmo.css`, and adds it there: your color in
every role, in light and dark mode, adapted from the nearest of Harmo's accents at
the same contrast, so text and buttons pass WCAG AA. A color too light for white
text, such as a bright yellow, is darkened for text and buttons, and the file says
so. Change any line you like; running it again asks before replacing a file you've
changed.

## Updates

Copied files don't update on their own, so they don't get Harmo's fixes either.
To take a newer version, run `npx harmo-ui@latest add <component>`. It never replaces a
file you've changed without asking, and files it can't ask about stay as they are.

For updates through your package manager instead, install the packages:

```sh
bun add @harmo-ui/css @harmo-ui/react
```

Choose one way for a project: copied components and installed ones each have their
own `HarmoProvider`, so a project using both needs to wrap its app in both.

## Learn more

- [Components](https://github.com/windrunner21/harmo/blob/master/docs/components/README.md):
  each one's props, under its React section
- [Theming](https://github.com/windrunner21/harmo#theming): change the copied
  `tokens.css`, or override its custom properties

Harmo is at `0.x`, so its APIs may still change between releases.

## License

[MIT](LICENSE)
