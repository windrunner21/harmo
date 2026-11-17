import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { customProperties, customPropertiesTs } from "../../../packages/react/tokens/customProperties.ts";

// The React package types the custom properties Harmo's CSS reads or declares,
// so the style prop takes them without a cast. The list is written from the
// CSS, so it mustn't fall behind it.
test("customProperties.ts matches the CSS: mise run build:tokens writes it", () => {
  const written = readFileSync(join(import.meta.dir, "..", "..", "..", "packages", "react", "src", "customProperties.ts"), "utf8");
  expect(written).toBe(customPropertiesTs());
});

test("it holds the tokens and the components' variables that examples set", () => {
  const names = customProperties();
  for (const name of ["--harmo-card-padding", "--harmo-space-xs", "--hswitch-width", "--htextarea-min-height"]) {
    expect(names).toContain(name);
  }
});
