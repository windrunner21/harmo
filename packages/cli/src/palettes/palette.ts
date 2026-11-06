// Turns Harmo's palettes into CSS: the built-in accents, which
// packages/css/accents/generate.ts writes to accents.scss, and a theme for any
// brand color, which harmo-ui theme writes into a project. Both work the same
// way, so a brand color is treated as carefully as the accents are.
import { contrast, hexOf, maxChroma, mixWithBlack, oklchOfHex } from "./color.js";
import { accents, mono, purple, type HandPicked, type Hues } from "./palettes.js";

const WHITE = "#ffffff";
const DARK_PAGE = "#14151b";
// WCAG AA for text, and a little to spare once colors are rounded.
const AA = 4.6;

// A button's light hover and press: the primary mixed with black in OKLab, as
// in tokens.scss. Its dark fills, by the text on them: resting deep enough to
// leave room for a lighter hover, hover still at 4.5:1 or more, pressed deeper.
const LIGHT_HOVER_SHARE = 0.85;
const LIGHT_PRESSED_SHARE = 0.74;
const DARK_FILL = { rest: 5.5, hover: 4.6, pressed: 6.35 };

type Saturation = { C: number; share: number };

const saturation = (hex: string): Saturation => {
  const { L, C, H } = oklchOfHex(hex);
  return { C, share: C / maxChroma(L, H) };
};

const scaled = ({ C, share }: Saturation, k: number): Saturation => ({ C: C * k, share: share * k });

// The lightness at which a hue reaches a contrast against a background, at a
// share of the saturation sRGB can show, and never above a cap.
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

// The purple's contrast in each role, which every accent matches, and its
// saturation, which every accent takes its share of.
const target = {
  primary: contrast(purple.light.primary, WHITE),
  hover: contrast(purple.light.hover, WHITE),
  active: contrast(purple.light.active, WHITE),
  tint: contrast(purple.light.tint, WHITE),
  darkPrimary: contrast(purple.dark.primary, DARK_PAGE),
  darkHover: contrast(purple.dark.hover, DARK_PAGE),
  darkTint: contrast(purple.dark.tint, DARK_PAGE),
};
const purpleSaturation = {
  primary: saturation(purple.light.primary),
  hover: saturation(purple.light.hover),
  active: saturation(purple.light.active),
  tint: saturation(purple.light.tint),
  darkPrimary: saturation(purple.dark.primary),
  darkHover: saturation(purple.dark.hover),
  darkTint: saturation(purple.dark.tint),
  // The dark fills' saturation is the purple's #7a5cf0, its lightest dark fill.
  fill: saturation(purple.dark.fillHover),
};

interface Tuning {
  // How much of the usual saturation to use: less for a muted brand color.
  k?: number;
  // How much the tints are allowed to be warm and buttery, as amber's are.
  amber?: number;
  // The light primary, when it's given rather than worked out.
  primary?: string;
}

// A whole palette from a hue for each role.
const fromHues = (h: Hues, { k = 1, amber = 0, primary }: Tuning = {}): HandPicked => {
  const sat = (s: Saturation) => scaled(s, k);
  const light = {
    primary: primary ?? solve(h.primary, sat(purpleSaturation.primary), WHITE, target.primary),
    hover: solve(h.hover, sat(purpleSaturation.hover), WHITE, target.hover),
    active: solve(h.active, sat(purpleSaturation.active), WHITE, target.active),
    tint: solve(
      h.tint,
      scaled({ C: 0.035 + (0.08 - 0.035) * amber, share: purpleSaturation.tint.share * 2 }, k),
      WHITE,
      target.tint,
    ),
  };
  const darkTint = { C: Math.max(0.05, purpleSaturation.darkTint.C * 0.8), share: purpleSaturation.darkTint.share };
  const fill = sat(purpleSaturation.fill);
  const hover = solve(h.darkHover, sat(purpleSaturation.darkHover), DARK_PAGE, target.darkHover);
  const dark = {
    primary: solve(h.darkPrimary, sat(purpleSaturation.darkPrimary), DARK_PAGE, target.darkPrimary),
    hover,
    active: hover,
    tint: solve(h.darkTint, scaled(darkTint, k), DARK_PAGE, target.darkTint),
    fill: solve(h.darkFill, fill, WHITE, DARK_FILL.rest),
    fillHover: solve(h.darkFill, fill, WHITE, DARK_FILL.hover),
    fillActive: solve(h.darkFill, fill, WHITE, DARK_FILL.pressed),
  };
  return { light, dark };
};

// The custom properties of a palette, for a selector. Every palette sets every
// one, those it shares with tokens.scss included, so an accent inside another
// inherits nothing from it: a purple section inside a mono page has white
// text on its buttons, not mono's dark text.
const block = (selector: string, { light, dark, underlineLinksOnHover }: HandPicked) => {
  const pair = (a: string, b: string) => `light-dark(${a}, ${b})`;
  const fillHover = mixWithBlack(light.primary, LIGHT_HOVER_SHARE);
  const fillActive = mixWithBlack(light.primary, LIGHT_PRESSED_SHARE);
  const onFill = dark.onFill ? pair(WHITE, dark.onFill) : "var(--harmo-white)";
  return [
    `${selector} {`,
    `  --harmo-color-primary: ${pair(light.primary, dark.primary)};`,
    `  --harmo-color-primary-hover: ${pair(light.hover, dark.hover)};`,
    `  --harmo-color-primary-active: ${pair(light.active, dark.active)};`,
    `  --harmo-color-primary-tint: ${pair(light.tint, dark.tint)};`,
    `  --harmo-color-primary-fill: ${pair(light.primary, dark.fill)};`,
    `  --harmo-color-primary-fill-hover: ${pair(fillHover, dark.fillHover)};`,
    `  --harmo-color-primary-fill-active: ${pair(fillActive, dark.fillActive)};`,
    `  --harmo-color-on-primary: ${onFill};`,
    `  --harmo-switch-thumb-color-background: ${onFill};`,
    `  --harmo-color-focus: ${pair(light.primary, dark.primary)};`,
    `  --harmo-focus-outline: 2px solid var(--harmo-color-focus);`,
    `  --harmo-link-color-text: ${pair(light.primary, dark.primary)};`,
    `  --harmo-link-visited-color-text: ${pair(light.hover, dark.hover)};`,
    `  --harmo-link-hover-text-decoration: ${underlineLinksOnHover ? "underline" : "none"};`,
    `}`,
  ].join("\n");
};

// The built-in accents, as accents.scss holds them.
export const accentsScss = () => {
  const blocks = [
    block(`:where([data-harmo-accent="purple"])`, purple),
    ...Object.entries(accents).map(([key, hues]) =>
      block(`:where([data-harmo-accent="${key}"])`, fromHues(hues, { amber: key === "amber" ? 1 : 0 })),
    ),
    block(`:where([data-harmo-accent="mono"])`, mono),
  ];
  return `// Generated by packages/css/accents/generate.ts from
// packages/cli/src/palettes/palettes.ts; change that and run
// mise run build:accents, rather than editing this file.
//
// Accent palettes. data-harmo-accent on <html>, or on any element, recolors
// what's inside it: the primary for text, links, and checked marks, its tint,
// the fills behind the text on Button and Switch, and the focus ring. Every
// accent has the same contrast as the purple, in light and dark mode; mono is
// black, or near-white in dark mode. :where() keeps them at zero specificity,
// so an app's own values on the same element still win. An accent on a section
// sets its values there, over what the section inherits, so an app overrides
// those on the section.

${blocks.join("\n\n")}
`;
};

// The hue of each of the purple's roles, so a brand color can start from it too.
const purpleHues = (): Hues => {
  const hue = (hex: string) => oklchOfHex(hex).H;
  return {
    primary: hue(purple.light.primary),
    hover: hue(purple.light.hover),
    active: hue(purple.light.active),
    tint: hue(purple.light.tint),
    darkPrimary: hue(purple.dark.primary),
    darkHover: hue(purple.dark.hover),
    darkTint: hue(purple.dark.tint),
    darkFill: hue(purple.dark.fill),
  };
};

const around = (degrees: number) => ((degrees % 360) + 360) % 360;
const apart = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const turn = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export const parseColor = (input: string) => {
  const hex = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  throw new Error(`${input} isn't a color Harmo can read. Give it as a hex code, such as #0f75b6.`);
};

export interface Theme {
  css: string;
  // The accent or accents it was adapted from, such as "blue" or "blue and teal".
  basis: string;
  // The color it was darkened to, when the one given was too light for text.
  darkened?: string;
}

// Each built-in accent's light shades, from its tint to its pressed text, as
// lightness and hue: the curve its hue follows as it gets darker.
const references = () =>
  [
    { name: "purple", hues: purpleHues(), palette: purple },
    ...Object.entries(accents).map(([name, hues]) => ({
      name,
      hues,
      palette: fromHues(hues, { amber: name === "amber" ? 1 : 0 }),
    })),
  ].map((reference) => ({
    ...reference,
    curve: (["tint", "primary", "hover", "active"] as const)
      .map((role) => oklchOfHex(reference.palette.light[role]))
      .sort((a, b) => b.L - a.L),
  }));

// An accent's hue at a lightness, along its curve.
const hueAt = (curve: { L: number; H: number }[], L: number) => {
  const first = curve[0] as { L: number; H: number };
  const last = curve.at(-1) as { L: number; H: number };
  if (L >= first.L) return first.H;
  if (L <= last.L) return last.H;
  for (let i = 0; i < curve.length - 1; i++) {
    const [upper, lower] = [curve[i], curve[i + 1]] as [{ L: number; H: number }, { L: number; H: number }];
    if (L <= upper.L && L >= lower.L) {
      const t = (upper.L - L) / (upper.L - lower.L);
      return around(upper.H + t * turn(upper.H, lower.H));
    }
  }
  return last.H;
};

// A theme for a brand color: the brand as the light primary, darkened only if
// white text can't be read on it, and every other role adapted from the
// nearest built-in accent, at the same contrast. The nearest accent is the one
// whose curve passes closest to the brand at the brand's own lightness, so a
// bright yellow follows amber's, as amber's light shades are yellow, and turns
// toward rust as it darkens rather than going olive. A gray adapts from mono.
export const theme = (input: string): Theme => {
  const brand = parseColor(input);
  const { L, C, H } = oklchOfHex(brand);
  const own = saturation(brand);
  const keep = contrast(brand, WHITE) >= 4.5;

  let palette: HandPicked;
  let basis: string;
  let primary: string;
  if (C < 0.03) {
    primary = keep ? brand : solve(H, own, WHITE, AA);
    palette = { ...mono, light: { ...mono.light, primary } };
    basis = "mono";
  } else {
    const nearest = references()
      .map((reference) => {
        const at = hueAt(reference.curve, L);
        return { ...reference, at, distance: apart(H, at) };
      })
      .sort((a, b) => a.distance - b.distance);
    const [a, b] = nearest as [(typeof nearest)[0], (typeof nearest)[0]];
    const total = a.distance + b.distance;
    const weightA = total === 0 ? 1 : b.distance / total;
    const weightB = 1 - weightA;
    // Each role's hue: the brand's, turned as each accent turns from where it
    // meets the brand's lightness to that role.
    const hueOf = (role: keyof Hues) =>
      around(H + weightA * turn(a.at, a.hues[role]) + weightB * turn(b.at, b.hues[role]));
    const hues = Object.fromEntries(
      (Object.keys(a.hues) as (keyof Hues)[]).map((role) => [role, hueOf(role)]),
    ) as unknown as Hues;
    primary = keep ? brand : solve(hues.primary, own, WHITE, AA);
    palette = fromHues(hues, {
      k: Math.min(1, own.share / purpleSaturation.primary.share),
      amber: (a.name === "amber" ? weightA : 0) + (b.name === "amber" ? weightB : 0),
      primary,
    });
    basis = weightA >= 0.75 ? a.name : `${a.name} and ${b.name}`;
  }
  const darkened = keep ? undefined : primary;

  const from = basis.includes(" and ") ? `Harmo's ${basis} accents` : `Harmo's ${basis} accent`;
  const notes = [
    `/* Generated by npx harmo-ui theme ${brand}, adapted from ${from}, at the same`,
    `   contrast in light and dark mode.`,
    ...(darkened
      ? [`   ${brand} is too light for white text, so text and buttons use ${darkened}.`]
      : []),
    `   Change any color here; your values win over Harmo's. */`,
  ];
  return { css: `${notes.join("\n")}\n${block(":root", palette)}\n`, basis, darkened };
};
