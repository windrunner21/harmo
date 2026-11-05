// Writes packages/css/src/accents.scss from palettes.ts. Run it with
// mise run build:accents after changing a palette, and commit both.
import { join } from "node:path";
import { contrast, hexOf, maxChroma, mixWithBlack, oklchOfHex } from "./color.ts";
import { accents, mono, purple, type HandPicked, type Hues } from "./palettes.ts";

const WHITE = "#ffffff";
const DARK_PAGE = "#14151b";

// A button's light hover and press: the primary mixed with black in OKLab, the
// same as tokens.scss, so an accent's buttons step like the default's.
const LIGHT_HOVER_SHARE = 0.85;
const LIGHT_PRESSED_SHARE = 0.74;
// A button's dark fills, by white text on them: resting deep enough to leave
// room for a lighter hover, hover still at 4.5:1 or more, pressed deeper.
const DARK_FILL = { rest: 5.5, hover: 4.6, pressed: 6.35 };

type Role = keyof typeof purple.light | keyof typeof purple.dark;
type Saturation = { C: number; share: number };

const saturation = (hex: string): Saturation => {
  const { L, C, H } = oklchOfHex(hex);
  return { C, share: C / maxChroma(L, H) };
};

// The lightness at which a hue reaches a contrast against a background, at the
// purple's share of saturation and never above the purple's own.
const solve = (H: number, { C, share }: Saturation, against: string, wanted: number) => {
  const color = (L: number) => hexOf(L, Math.min(maxChroma(L, H) * share, C), H);
  let lo = 0.05;
  let hi = 0.99;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const tooStrong = contrast(color(mid), against) > wanted;
    if (against === WHITE ? tooStrong : !tooStrong) lo = mid;
    else hi = mid;
  }
  return color(against === WHITE ? lo : hi);
};

const target = (mode: "light" | "dark", role: Role, against: string) =>
  contrast((purple[mode] as Record<string, string>)[role]!, against);

const tintSaturation = (light: boolean, amber: boolean): Saturation => {
  const purpleTint = saturation(light ? purple.light.tint : purple.dark.tint);
  return light
    ? { C: amber ? 0.08 : 0.035, share: purpleTint.share * 2 }
    : { C: Math.max(0.05, purpleTint.C * 0.8), share: purpleTint.share };
};

const generate = (key: string, h: Hues) => {
  const amber = key === "amber";
  const light = {
    primary: solve(h.primary, saturation(purple.light.primary), WHITE, target("light", "primary", WHITE)),
    hover: solve(h.hover, saturation(purple.light.hover), WHITE, target("light", "hover", WHITE)),
    active: solve(h.active, saturation(purple.light.active), WHITE, target("light", "active", WHITE)),
    tint: solve(h.tint, tintSaturation(true, amber), WHITE, target("light", "tint", WHITE)),
  };
  // The dark fills' saturation is the purple's #7a5cf0, its lightest dark fill.
  const fill = saturation(purple.dark.fillHover);
  const dark = {
    primary: solve(h.darkPrimary, saturation(purple.dark.primary), DARK_PAGE, target("dark", "primary", DARK_PAGE)),
    hover: solve(h.darkHover, saturation(purple.dark.hover), DARK_PAGE, target("dark", "hover", DARK_PAGE)),
    tint: solve(h.darkTint, tintSaturation(false, amber), DARK_PAGE, target("dark", "tint", DARK_PAGE)),
    fill: solve(h.darkFill, fill, WHITE, DARK_FILL.rest),
    fillHover: solve(h.darkFill, fill, WHITE, DARK_FILL.hover),
    fillActive: solve(h.darkFill, fill, WHITE, DARK_FILL.pressed),
  };
  return { light, dark: { ...dark, active: dark.hover } };
};

const block = (key: string, { light, dark, underlineLinksOnHover }: HandPicked) => {
  const pair = (a: string, b: string) => `light-dark(${a}, ${b})`;
  const fillHover = mixWithBlack(light.primary, LIGHT_HOVER_SHARE);
  const fillActive = mixWithBlack(light.primary, LIGHT_PRESSED_SHARE);
  const onFill = dark.onFill
    ? [
        `  --harmo-color-on-primary: ${pair(WHITE, dark.onFill)};`,
        `  --harmo-switch-thumb-color-background: ${pair(WHITE, dark.onFill)};`,
      ]
    : [];
  return [
    `:where([data-harmo-accent="${key}"]) {`,
    `  --harmo-color-primary: ${pair(light.primary, dark.primary)};`,
    `  --harmo-color-primary-hover: ${pair(light.hover, dark.hover)};`,
    `  --harmo-color-primary-active: ${pair(light.active, dark.active)};`,
    `  --harmo-color-primary-tint: ${pair(light.tint, dark.tint)};`,
    `  --harmo-color-primary-fill: ${pair(light.primary, dark.fill)};`,
    `  --harmo-color-primary-fill-hover: ${pair(fillHover, dark.fillHover)};`,
    `  --harmo-color-primary-fill-active: ${pair(fillActive, dark.fillActive)};`,
    ...onFill,
    `  --harmo-color-focus: ${pair(light.primary, dark.primary)};`,
    `  --harmo-focus-outline: 2px solid var(--harmo-color-focus);`,
    `  --harmo-link-color-text: ${pair(light.primary, dark.primary)};`,
    `  --harmo-link-visited-color-text: ${pair(light.hover, dark.hover)};`,
    ...(underlineLinksOnHover ? [`  --harmo-link-hover-text-decoration: underline;`] : []),
    `}`,
  ].join("\n");
};

const blocks = [
  block("purple", purple),
  ...Object.entries(accents).map(([key, hues]) => block(key, generate(key, hues))),
  block("mono", mono),
];

const scss = `// Generated by packages/css/accents/generate.ts from palettes.ts; change
// those and run mise run build:accents, rather than editing this file.
//
// Accent palettes. data-harmo-accent on <html>, or on any element, recolors
// what's inside it: the primary for text, links, and checked marks, its tint,
// the fills behind the text on Button and Switch, and the focus ring. Every
// accent has the same contrast as the purple, in light and dark mode; mono is
// black, or near-white in dark mode. :where() keeps them at zero specificity,
// so an app's own values still win.

${blocks.join("\n\n")}
`;

await Bun.write(join(import.meta.dir, "..", "src", "accents.scss"), scss);
console.log(`accents.scss: ${blocks.length} accents`);
