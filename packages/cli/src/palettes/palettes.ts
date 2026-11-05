// Harmo's accent palettes: two picked by hand, the purple and mono, and the hue
// of each other accent at each role. palette.ts works out the rest, for the
// built-in accents and for harmo-ui theme alike.
//
// Inspired by Stripe's writing on color, "Designing accessible color systems"
// (2019):
// - every role has the purple's contrast, whatever the hue, so every accent
//   carries the same weight and passes the same checks;
// - each hue turns across its shades, which keeps lighter and darker shades
//   from going dull or muddy;
// - saturation is the purple's share of what sRGB can show, never more than
//   the purple's own, so greens and blues don't glow;
// - a button is one step darker on hover in light mode, and one step lighter
//   in dark mode.

export interface HandPicked {
  // For an accent whose links already have the heading color, which links
  // turn to on hover: they're underlined on hover instead.
  underlineLinksOnHover?: boolean;
  light: { primary: string; hover: string; active: string; tint: string };
  dark: {
    primary: string;
    hover: string;
    active: string;
    tint: string;
    fill: string;
    fillHover: string;
    fillActive: string;
    // What sits on the fill when white can't: text on a Button, and a
    // Switch's thumb.
    onFill?: string;
  };
}

// Harmo's purple. Its light fill hover and press are worked out like every
// other accent's; the rest is fixed.
export const purple: HandPicked = {
  light: { primary: "#5e3de8", hover: "#2e1a8f", active: "#241267", tint: "#ebe8fd" },
  dark: {
    primary: "#a594f7",
    hover: "#c7bcfa",
    active: "#c7bcfa",
    tint: "#2a2352",
    fill: "#6b4de6",
    fillHover: "#7a5cf0",
    fillActive: "#5e3de8",
  },
};

// Black and white, from Harmo's own neutrals: black in light mode, and
// near-white in dark mode, where buttons and a Switch's thumb take the dark
// page color instead of white. Links already have the heading color, so
// they're underlined on hover.
export const mono: HandPicked = {
  underlineLinksOnHover: true,
  light: { primary: "#30313d", hover: "#1a1b25", active: "#10111a", tint: "#ebeef1" },
  dark: {
    primary: "#f1f2f6",
    hover: "#ffffff",
    active: "#ffffff",
    tint: "#30323e",
    fill: "#f1f2f6",
    fillHover: "#ffffff",
    fillActive: "#c5c8d2",
    onFill: "#14151b",
  },
};

// The hue angle (OKLCH) of each role. Lighter shades turn toward the brightest
// hue nearby and darker ones toward red or blue, as in well-tuned palettes:
// light primary, its hover and press, and the tint; then the same in dark
// mode, and the dark fill behind white text.
export interface Hues {
  primary: number;
  hover: number;
  active: number;
  tint: number;
  darkPrimary: number;
  darkHover: number;
  darkTint: number;
  darkFill: number;
}

export const accents: Record<string, Hues> = {
  // Cyan tints, a clear blue in the middle, dark-mode text leaning sky.
  blue: { primary: 257, hover: 253, active: 253, tint: 198, darkPrimary: 228, darkHover: 212, darkTint: 253, darkFill: 256 },
  // Yellow-green tints and a true green in the middle.
  green: { primary: 142, hover: 148, active: 152, tint: 133, darkPrimary: 139, darkHover: 138, darkTint: 150, darkFill: 141 },
  // Crimson in the middle, with tints and darker shades leaning pink.
  red: { primary: 17, hover: 0, active: 353, tint: 352, darkPrimary: 9, darkHover: 357, darkTint: 2, darkFill: 19 },
  // A buttery tint, and a rust in the middle that carries white text, as a
  // bright amber can't.
  amber: { primary: 39, hover: 36, active: 40, tint: 94, darkPrimary: 59, darkHover: 81, darkTint: 38, darkFill: 41 },
  // Tints leaning green, darker shades toward cyan.
  teal: { primary: 186, hover: 192, active: 196, tint: 172, darkPrimary: 178, darkHover: 172, darkTint: 186, darkFill: 186 },
  // Lighter shades leaning magenta, darker ones toward red.
  pink: { primary: 352, hover: 358, active: 2, tint: 326, darkPrimary: 346, darkHover: 340, darkTint: 350, darkFill: 352 },
};
