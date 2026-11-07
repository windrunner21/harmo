// Reads the HTML playground's examples and puts markup in a canonical form,
// so a React example can be compared with the HTML example it ports. See
// docs/internal/testing.md for why.

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const html = join(import.meta.dir, "..", "..", "html", "src");

// The examples in components/<slug>.html, by title, without their notes and
// with each <play-icon> expanded to its SVG, as the playground build does.
export const htmlExamples = (slug: string) => {
  const source = readFileSync(join(html, "components", `${slug}.html`), "utf8");
  const examples = new Map<string, string>();
  for (const [, attributes, content] of source.matchAll(
    /<play-example\b([^>]*)>([\s\S]*?)<\/play-example>/g,
  )) {
    const title = parseAttributes(attributes).get("title") ?? "";
    const markup = content.replace(/^\s*<play-note>[\s\S]*?<\/play-note>/, "");
    examples.set(title, expandIcons(markup));
  }
  return examples;
};

// A playground icon's attributes and inner markup.
const icon = (name: string) => {
  const source = readFileSync(join(html, "icons", `${name}.svg`), "utf8");
  const match = source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
  if (!match) throw new Error(`icons/${name}.svg is not an <svg>`);
  return { attributes: parseAttributes(match[1]), body: match[2] };
};

const iconNames = new Set(
  readdirSync(join(html, "icons")).map((file) => basename(file, ".svg")),
);

const expandIcons = (markup: string) =>
  markup.replace(
    /<play-icon\b([^>]*?)\s*(?:\/>|><\/play-icon>)/g,
    (_, source: string) => {
      const attributes = parseAttributes(source);
      const name = attributes.get("name") ?? "";
      if (!iconNames.has(name)) throw new Error(`Unknown icon "${name}"`);
      attributes.delete("name");
      const svg = icon(name);
      for (const [key, value] of svg.attributes) {
        if (!attributes.has(key)) attributes.set(key, value);
      }
      const parts = [...attributes].map(([key, value]) =>
        value === undefined ? key : `${key}="${value}"`,
      );
      return `<svg ${parts.join(" ")}>${svg.body}</svg>`;
    },
  );

const parseAttributes = (source: string) => {
  const attributes = new Map<string, string | undefined>();
  for (const [, name, value] of source.matchAll(
    /([^\s="'>/]+)(?:="([^"]*)")?/g,
  )) {
    attributes.set(name, value);
  }
  return attributes;
};

// Attributes whose values are ids, or lists of ids.
const idAttributes = new Set([
  "id",
  "for",
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-labelledby",
  "commandfor",
  "popovertarget",
]);

const voidElements = new Set(["br", "hr", "img", "input", "meta", "link"]);

// One line per tag and text, indented by depth, so a failing comparison
// shows a readable diff. Markup that renders the same way normalizes to the
// same text:
// - attribute names are lowercased, as HTML reads them case-insensitively
//   (React writes popoverTarget), then sorted, and a bare attribute equals
//   an empty one;
// - class names are sorted, and style declarations are spaced the same way;
// - ids and anchor names are numbered in order of appearance, since React
//   generates its own;
// - whitespace between tags is dropped and whitespace in text collapsed;
// - <path /> equals <path></path>, and character references are decoded;
// - data-example-* hooks, which only the playground's scripts read, are left
//   out.
export const normalize = (markup: string) => {
  const ids = new Map<string, string>();
  const anchors = new Map<string, string>();
  const idOf = (token: string) => {
    if (!ids.has(token)) ids.set(token, `#${ids.size + 1}`);
    return ids.get(token) as string;
  };
  const anchorOf = (token: string) => {
    if (!anchors.has(token)) anchors.set(token, `--anchor-${anchors.size + 1}`);
    return anchors.get(token) as string;
  };

  const attribute = (name: string, value = "") => {
    if (name === "class") return value.split(/\s+/).filter(Boolean).sort().join(" ");
    if (idAttributes.has(name)) {
      return value.split(/\s+/).filter(Boolean).map(idOf).join(" ");
    }
    if (name === "style") {
      return value
        .split(";")
        .map((declaration) => declaration.trim())
        .filter(Boolean)
        .map((declaration) => {
          const colon = declaration.indexOf(":");
          const property = declaration.slice(0, colon).trim();
          const text = declaration.slice(colon + 1).trim();
          const anchored = /^(anchor-name|position-anchor)$/.test(property);
          return `${property}: ${anchored ? text.replace(/--[\w-]+/g, anchorOf) : text}`;
        })
        .join("; ");
    }
    return value;
  };

  const lines: string[] = [];
  let depth = 0;
  const line = (text: string) => lines.push(`${"  ".repeat(depth)}${text}`);

  for (const [, closing, tag, source, selfClosing, text] of markup.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g,
  )) {
    if (text !== undefined) {
      const content = decode(text).replace(/\s+/g, " ").trim();
      if (content) line(JSON.stringify(content));
      continue;
    }
    if (!tag) continue;
    const name = tag.toLowerCase();
    if (closing) {
      depth--;
      line(`</${name}>`);
      continue;
    }

    const attributes = [...parseAttributes(source)]
      .map(([key, value]) => [key.toLowerCase(), value] as const)
      .filter(([key]) => !key.startsWith("data-example-"))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => ` ${key}="${attribute(key, decode(value ?? ""))}"`);
    line(`<${name}${attributes.join("")}>`);

    if (voidElements.has(name)) continue;
    if (selfClosing) {
      line(`</${name}>`);
      continue;
    }
    depth++;
  }

  return lines.join("\n");
};

const decode = (text: string) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number(decimal)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
