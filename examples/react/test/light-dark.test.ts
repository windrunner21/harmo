import { expect, test } from "bun:test";
import { join } from "node:path";

// A bundler that lowers light-dark() for browsers older than it, as Lightning
// CSS does by default in Next.js 16, writes each as two colors, one of which
// two variables turn off: --*-light and --*-dark. It sets them only where it
// sees a color-scheme, so without one every color comes out as two colors
// side by side, which isn't a color, and links, buttons, and focus rings fall
// back to black. tokens.css sets them, for light, on :where(:root), and
// declares no color-scheme, so a <meta> or a layered one still decides the
// page. Bun's CSS bundler lowers it as Lightning CSS does, with --buncss-*.
const dist = join(import.meta.dir, "..", "..", "..", "packages", "css", "dist");

const lowered = async (file: string) => {
  const result = await Bun.build({ entrypoints: [join(dist, file)] });
  expect(result.success).toBe(true);
  return (await result.outputs[0]?.text()) ?? "";
};

for (const file of ["index.css", "tokens.css"]) {
  test(`${file}, lowered for older browsers, sets the variables each color needs on the root`, async () => {
    const css = await lowered(file);
    expect(css).toContain("var(--buncss-light,");
    const root = /:where\(:root\)\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(root).toContain("--buncss-light: initial;");
    expect(root).toContain("--buncss-dark: ;");
    expect(root).toContain("--lightningcss-light: initial;");
    expect(root).toContain("--lightningcss-dark: ;");
    expect(css).not.toMatch(/color-scheme\s*:/);
  });
}

test("an app's own color-scheme, compiled by the same bundler, sets the variables where it's declared, over tokens.css's", async () => {
  const result = await Bun.build({ entrypoints: [join(import.meta.dir, "fixtures", "dark-app.css")] });
  const css = (await result.outputs[0]?.text()) ?? "";
  const root = /\n:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  expect(root).toContain("--buncss-light: ;");
  expect(root).toContain("--buncss-dark: initial;");
});
