import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contrast } from "../src/palettes/color.js";
import { accentsScss, theme } from "../src/palettes/palette.js";

// Runs the built CLI in Node, as npx would, in a throwaway project.
const root = join(import.meta.dir, "..");
const cli = join(root, "dist", "harmo.js");
const output = join(root, "test-output");
const file = "components/harmo/harmo-theme.css";
const WHITE = "#ffffff";
const DARK_PAGE = "#14151b";

let project: string;

beforeEach(() => {
  mkdirSync(output, { recursive: true });
  project = mkdtempSync(join(output, "project-"));
  writeFileSync(join(project, "package.json"), JSON.stringify({ dependencies: { react: "19.3.0" } }));
});

afterEach(() => rmSync(project, { recursive: true, force: true }));

const run = (...args: string[]) => {
  const result = Bun.spawnSync(["node", cli, ...args], { cwd: project });
  return { code: result.exitCode, out: result.stdout.toString(), err: result.stderr.toString() };
};
const read = (path: string) => readFileSync(join(project, path), "utf8");

// Each token's light and dark value, from a theme's CSS.
const pairs = (css: string) =>
  Object.fromEntries(
    [...css.matchAll(/--harmo-([a-z-]+): light-dark\((#[0-9a-f]{6}), (#[0-9a-f]{6})\);/g)].map((match) => [
      match[1] as string,
      [match[2] as string, match[3] as string] as const,
    ]),
  );

describe("theme's colors", () => {
  // Blue, teal, green, a light yellow, orange, red, violet, near-black, gray, and white.
  const brands = ["#0f75b6", "#00c2a8", "#16a34a", "#ffd400", "#ff6b00", "#e11d48", "#7c3aed", "#222222", "#6b7280", "#ffffff"];

  for (const brand of brands) {
    test(`${brand}: every role reaches WCAG AA, in light and dark mode`, () => {
      const p = pairs(theme(brand).css);
      const value = (token: string, mode: 0 | 1) => {
        const pair = p[token];
        if (!pair) throw new Error(`no ${token}`);
        return pair[mode];
      };
      for (const mode of [0, 1] as const) {
        const page = mode === 0 ? WHITE : DARK_PAGE;
        const label = p["color-on-primary"]?.[mode] ?? WHITE;
        expect(contrast(value("color-primary", mode), page), "text on the page").toBeGreaterThanOrEqual(4.5);
        expect(contrast(value("color-primary-hover", mode), page), "hovered text").toBeGreaterThanOrEqual(4.5);
        expect(contrast(value("color-primary", mode), value("color-primary-tint", mode)), "marks on the tint").toBeGreaterThanOrEqual(3);
        for (const fill of ["color-primary-fill", "color-primary-fill-hover", "color-primary-fill-active"])
          expect(contrast(label, value(fill, mode)), `text on ${fill}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(value("color-primary-fill", mode), page), "a switch's track").toBeGreaterThanOrEqual(3);
        expect(contrast(value("color-focus", mode), page), "the focus ring").toBeGreaterThanOrEqual(3);
      }
    });
  }

  test("a brand color that reads on white is kept as it is, and adapted from the nearest accent", () => {
    const blue = theme("#0f75b6");
    expect(blue.css).toContain("--harmo-color-primary: light-dark(#0f75b6, ");
    expect(blue.darkened).toBeUndefined();
    expect(blue.basis).toBe("blue");
  });

  test("a color too light for white text is darkened, and the theme says so", () => {
    const yellow = theme("#ffd400");
    expect(yellow.darkened).toBeDefined();
    expect(contrast(yellow.darkened as string, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(yellow.css).toContain(`#ffd400 is too light for white text, so text and buttons use ${yellow.darkened}.`);
  });

  test("a gray adapts from mono, with dark text on dark mode's buttons and links underlined on hover", () => {
    const gray = theme("#6b7280");
    expect(gray.basis).toBe("mono");
    expect(gray.css).toContain("--harmo-color-on-primary: light-dark(#ffffff, #14151b);");
    expect(gray.css).toContain("--harmo-link-hover-text-decoration: underline;");
  });

  test("reads a hex code with or without #, and short ones, and refuses anything else", () => {
    expect(theme("0F75B6").css).toBe(theme("#0f75b6").css);
    expect(theme("#abc").css).toBe(theme("#aabbcc").css);
    for (const input of ["blue", "#0f75b", "rgb(0 0 0)", ""]) expect(() => theme(input)).toThrow();
  });

  test("accents.scss matches the palettes: mise run build:accents writes it", () => {
    expect(readFileSync(join(root, "..", "css", "src", "accents.scss"), "utf8")).toBe(accentsScss());
  });
});

describe("harmo-ui theme", () => {
  test("writes harmo-theme.css in the components folder, and says how to load it", () => {
    const { code, out } = run("theme", "#0f75b6");
    expect(code).toBe(0);
    expect(read(file)).toBe(theme("#0f75b6").css);
    expect(out).toContain("Created components/harmo/harmo-theme.css, adapted from Harmo's blue accent.");
    expect(out).toContain("Import components/harmo/harmo-theme.css once");
  });

  test("uses src/components/harmo in a project with a src folder, or the folder it's given", () => {
    mkdirSync(join(project, "src"));
    run("theme", "#0f75b6");
    expect(existsSync(join(project, "src/components/harmo/harmo-theme.css"))).toBe(true);
    run("theme", "#0f75b6", "--path", "styles");
    expect(existsSync(join(project, "styles/harmo-theme.css"))).toBe(true);
  });

  test("adds itself to harmo.css once, after Harmo's imports, and stays after ones added later", () => {
    run("add", "button");
    const { out } = run("theme", "#0f75b6");
    expect(out).toContain("Added it to components/harmo/harmo.css.");
    run("theme", "#0f75b6");
    run("add", "link");
    const imports = [...read("components/harmo/harmo.css").matchAll(/^@import "\.\/(.+)";$/gm)].map((m) => m[1]);
    expect(imports.filter((path) => path === "harmo-theme.css")).toHaveLength(1);
    expect(imports.at(-1)).toBe("harmo-theme.css");
    expect(imports).toContain("link/link.css");
  });

  test("keeps a theme that differs, until told to replace it", () => {
    run("theme", "#0f75b6");
    const edited = read(file).replace("#0f75b6", "#123456");
    writeFileSync(join(project, file), edited);

    const kept = run("theme", "#0f75b6");
    expect(kept.out).toContain("Kept components/harmo/harmo-theme.css");
    expect(read(file)).toBe(edited);

    const replaced = run("theme", "#0f75b6", "--overwrite");
    expect(replaced.out).toContain("Replaced components/harmo/harmo-theme.css");
    expect(read(file)).toBe(theme("#0f75b6").css);
  });

  test("says when it has nothing to change", () => {
    run("theme", "#0f75b6");
    expect(run("theme", "#0f75b6").out).toContain("already has this theme");
  });

  test("--dry-run shows the theme, and writes nothing", () => {
    const { out } = run("theme", "#ffd400", "--dry-run");
    expect(out).toContain(":root {");
    expect(out).toContain("Would write components/harmo/harmo-theme.css");
    expect(existsSync(join(project, file))).toBe(false);
  });

  test("refuses no color, two colors, or one it can't read, and writes nothing", () => {
    for (const args of [[], ["#0f75b6", "#ffffff"], ["blue"]]) {
      const { code, err } = run("theme", ...args);
      expect(code).toBe(1);
      expect(err.length).toBeGreaterThan(0);
    }
    expect(existsSync(join(project, file))).toBe(false);
  });

  test("refuses to run outside a project", () => {
    rmSync(join(project, "package.json"));
    expect(run("theme", "#0f75b6").code).toBe(1);
  });
});
