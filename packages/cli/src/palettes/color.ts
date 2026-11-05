// OKLCH, OKLab, and WCAG contrast, for generating the accent palettes. sRGB
// only: every color is mapped into it by lowering its chroma, never clipped.

type Rgb = [number, number, number];

const toLinear = (L: number, C: number, H: number): Rgb => {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-7 && v <= 1 + 1e-7);

// The most chroma sRGB can show at a lightness and hue.
export const maxChroma = (L: number, H: number) => {
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(toLinear(L, mid, H))) lo = mid;
    else hi = mid;
  }
  return lo;
};

const encode = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

const hexOfLinear = (rgb: Rgb) =>
  "#" + rgb.map((v) => Math.round(encode(v) * 255).toString(16).padStart(2, "0")).join("");

export const hexOf = (L: number, C: number, H: number) => hexOfLinear(toLinear(L, Math.min(C, maxChroma(L, H)), H));

const linearOfHex = (hex: string): Rgb => [1, 3, 5].map((i) => decode(parseInt(hex.slice(i, i + 2), 16) / 255)) as Rgb;

export const contrast = (a: string, b: string) => {
  const lum = (hex: string) => {
    const [r, g, b] = linearOfHex(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export const oklchOfHex = (hex: string) => {
  const [r, g, b] = linearOfHex(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
};

// What CSS's color-mix(in oklab, color share, black) gives: black is the
// origin in OKLab, so each axis scales by the share.
export const mixWithBlack = (hex: string, share: number) => {
  const { L, C, H } = oklchOfHex(hex);
  return hexOf(L * share, C * share, H);
};
