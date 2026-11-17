// The custom properties Harmo's CSS reads or declares, in packages/css/src:
// its tokens, --harmo-*, and its components' variables, --h*, such as
// --hswitch-width. customPropertiesTs() writes them as a type, and as keys of
// React's CSSProperties, so the style prop takes any of them without a cast.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const css = join(import.meta.dir, "..", "..", "css", "src");

export const customProperties = () => {
  const names = new Set<string>();
  for (const file of readdirSync(css, { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith(".scss")) continue;
    // Comments name properties too, in prose; only code counts.
    const source = readFileSync(join(css, file), "utf8").replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, name] of source.matchAll(/var\(\s*(--h[a-z0-9-]*[a-z0-9])/g)) names.add(name!);
    for (const [, name] of source.matchAll(/^\s*(--h[a-z0-9-]*[a-z0-9])\s*:/gm)) names.add(name!);
  }
  return [...names].sort();
};

export const customPropertiesTs = () => {
  const names = customProperties();
  return [
    "// Written by mise run build:tokens, from the custom properties Harmo's CSS",
    "// reads or declares: its tokens, --harmo-*, and its components' variables,",
    "// --h*. React's style prop takes any of them without a cast, such as",
    '// style={{ "--harmo-card-padding": "var(--harmo-space-xs)" }}. Change the CSS,',
    "// then run the task again, rather than editing this file.",
    "",
    "export type HarmoCustomProperty =",
    ...names.map((name, index) => `  | "${name}"${index === names.length - 1 ? ";" : ""}`),
    "",
    'declare module "react" {',
    "  interface CSSProperties {",
    ...names.map((name) => `    "${name}"?: string | number;`),
    "  }",
    "}",
    "",
  ].join("\n");
};
