// Builds a playground into a dist/ folder: an overview and one page per
// component. The HTML and React playgrounds share the page: the layout, the
// nav from catalog.ts, and each example's title, note, and options, all read
// from html/src. html/build.ts fills each example with its HTML markup, and
// react/build.ts with its React version. No dependencies beyond Bun.
//
// Partials in html/src/components/<slug>.html are a list of examples written
// with three build-time elements, none of which reach the output:
//
//   <play-example title="…" [layout="stack|wide"] [frame="14rem" [clip]] [dir="…" lang="…"] [replay]>
//     A live example. Its code also appears in a panel to copy, without
//     data-example-* hooks, which only the example scripts read.
//     layout="stack" stacks the example vertically, each part at most 24rem
//     wide, and layout="wide" at full width; frame draws a dashed container
//     of that width around it, and clip makes it hide what overflows; dir and
//     lang set its direction, and wrap the copied code in a <div> with them;
//     replay adds a button that restarts its animations.
//   <play-note>…</play-note>
//     Text under the example's title. It must come first in the example.
//   <play-icon name="close" class="hicon"></play-icon>
//     The SVG in html/src/icons/close.svg, with these attributes added first
//     and replacing the file's own. Icons are declared once and output in
//     full, so every example stays copyable.
//
// Attribute values are double-quoted and can't contain ">". Text inside
// <textarea> and <pre> is kept exactly as written.

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { catalog, type CatalogEntry, type CatalogGroup } from "./catalog.ts";

const src = join(import.meta.dir, "html", "src");
const repo = join(import.meta.dir, "..");

const exampleOptions = new Set(["title", "layout", "frame", "clip", "dir", "lang", "replay"]);

// One example from a partial.
export interface Example {
  slug: string;
  title: string;
  // Unique on its page.
  id: string;
  // The HTML example's markup, with its icons expanded.
  markup: string;
}

// What a playground shows for an example.
export interface Rendered {
  // The live example.
  demo: string;
  // The code to copy, as plain text.
  code: string;
  // React renders the demo on the server and hydrates it in the browser. Its
  // container is then marked with the example's slug and title, holds the
  // demo exactly as rendered, and replays it by mounting it again.
  hydrate?: boolean;
}

export interface Playground {
  out: string;
  // The overview page's title and content.
  title: string;
  overview: string;
  // The footer's sentence about how the examples are made.
  about: string;
  // The code panel's name.
  codeLabel: string;
  // The components this playground has, each with a partial.
  components: Set<string>;
  // Scripts each page loads after playground.js, in order.
  scripts: string[];
  // Files and folders copied from html/src, and files written as they are.
  copy: string[];
  // The Accent picker at the top of the sidebar, in this playground's kind.
  accent: string;
  write?: Record<string, string>;
  // An example's demo and code, or undefined to leave it out.
  render: (example: Example) => Rendered | undefined;
}

// Text inside <textarea> and <pre> is shown exactly as written, so the
// indenting done around it mustn't reach it: it's set aside under a
// placeholder and put back once the page is assembled.
const verbatim: string[] = [];

export function buildPlayground(playground: Playground) {
  const { out } = playground;
  const href = (path: string) => relative(out, path);
  const icons = loadIcons();
  const layout = readFileSync(join(src, "layout.html"), "utf8");
  const version = JSON.parse(readFileSync(join(repo, "packages/css/package.json"), "utf8")).version;
  for (const slug of playground.components) {
    if (!readdirSync(join(src, "components")).includes(`${slug}.html`)) {
      throw new Error(`${slug} has no partial in html/src/components`);
    }
  }

  // Every page is assembled and checked before dist/ is touched, so a failed
  // build leaves the last good one in place.
  const pages = new Map<string, string>();
  const left: string[] = [];
  const page = (file: string, title: string, current: string, content: string) => {
    const html = expandIcons(
      fill(layout, {
        title,
        version: `v${version}`,
        harmo: href(join(repo, "packages/css/dist/index.css")),
        docs: href(join(repo, "docs/components/README.md")),
        scripts: playground.scripts.map((script) => `<script src="${script}" defer></script>`).join("\n"),
        about: playground.about,
        accent: playground.accent,
        nav: renderNav(playground.components, current),
        content,
      }),
      icons,
    );
    // Checked while <textarea> and <pre> text is still set aside, so text
    // that looks like markup there isn't taken for markup.
    checkPage(file, html);
    pages.set(file, restoreVerbatim(html));
  };

  for (const group of catalog) {
    for (const entry of group.entries.filter((entry) => playground.components.has(entry.slug))) {
      const content = renderComponent(entry, group, icons, playground, href, (title) => left.push(`${entry.title} › ${title}`));
      page(`${entry.slug}.html`, `${entry.title} — Harmo`, entry.slug, content);
    }
  }
  page("index.html", playground.title, "index", readFileSync(playground.overview, "utf8").trim());

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out);
  for (const name of playground.copy) cpSync(join(src, name), join(out, name), { recursive: true });
  for (const [file, text] of Object.entries(playground.write ?? {})) writeFileSync(join(out, file), text);
  for (const [file, html] of pages) writeFileSync(join(out, file), html);

  const pending = catalog.flatMap((group) => group.entries).filter((entry) => !playground.components.has(entry.slug));
  console.log(`Built ${pages.size} pages into ${relative(repo, out)}`);
  if (pending.length) console.log(`Not in the playground yet: ${pending.map((entry) => entry.title).join(", ")}`);
  if (left.length) console.log(`Examples left out: ${left.join(", ")}`);
}

// Runs a build script, then again in a fresh process whenever a watched
// folder changes, so changes to modules it imports are picked up too.
export function watchPlayground(script: string, folders: string[]) {
  const rebuild = () => Bun.spawnSync([process.execPath, script], { stdio: ["inherit", "inherit", "inherit"] });
  let timer: Timer | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 50);
  };
  rebuild();
  for (const folder of folders) watch(folder, { recursive: true }, schedule);
  // The folder rather than the file, since editors often save by replacing it.
  watch(import.meta.dir, (_, file) => {
    if (file === "catalog.ts" || file === "playground.ts") schedule();
  });
  console.log(`Watching ${[...folders.map((folder) => relative(repo, folder)), "examples/catalog.ts"].join(", ")}`);
}

// Runs a build, and on failure prints why and exits with an error.
export function runBuild(build: () => void) {
  try {
    build();
  } catch (error) {
    console.error(`Playground build failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Pages ---------------------------------------------------------------------

// A component's header and examples, the content of its page.
function renderComponent(
  entry: CatalogEntry,
  group: CatalogGroup,
  icons: Icons,
  playground: Playground,
  href: (path: string) => string,
  leaveOut: (title: string) => void,
) {
  const source = readFileSync(join(src, "components", `${entry.slug}.html`), "utf8");
  const pattern = /<play-example\b([^>]*)>([\s\S]*?)<\/play-example>/g;
  const examples = [...source.matchAll(pattern)];
  if (examples.length === 0) throw new Error(`components/${entry.slug}.html has no <play-example>`);
  // Anything outside the examples would be dropped, such as a misspelled or
  // unclosed <play-example>, so it stops the build instead.
  const rest = source.replace(pattern, "").trim();
  if (rest) throw new Error(`components/${entry.slug}.html has content outside an example: "${rest.slice(0, 60)}"`);

  const docs = href(join(repo, "docs", `components/${entry.slug}.md`));
  return [
    `<article class="play-component" id="${entry.slug}" aria-labelledby="${entry.slug}-title">`,
    `  <header class="play-component-header">`,
    `    <p class="play-eyebrow">${group.title}</p>`,
    `    <h1 class="play-component-title" id="${entry.slug}-title">${entry.title}</h1>`,
    `    <p class="play-purpose">${entry.purpose}</p>`,
    `    <a class="hlink play-docs-link" href="${docs}">`,
    `      Documentation`,
    `      <play-icon name="chevron-to-arrow" class="hicon hchevron-to-arrow"></play-icon>`,
    `    </a>`,
    `  </header>`,
    ...examples
      .map(([, attributes, content]) => renderExample(entry.slug, attributes, content, icons, playground, leaveOut))
      .filter((example) => example !== undefined)
      .map((example) => indent(example, "  ")),
    `</article>`,
  ].join("\n");
}

function renderExample(
  slug: string,
  attributeSource: string,
  content: string,
  icons: Icons,
  playground: Playground,
  leaveOut: (title: string) => void,
) {
  const where = `An example in components/${slug}.html`;
  const attributes = parseAttributes(attributeSource);
  const title = attributes.get("title");
  if (!title) throw new Error(`${where} has no title`);
  for (const key of attributes.keys()) {
    if (!exampleOptions.has(key)) throw new Error(`${where} ("${title}") has an unknown option "${key}"`);
  }
  const layout = attributes.get("layout");
  if (attributes.has("layout") && layout !== "stack" && layout !== "wide") {
    throw new Error(`${where} ("${title}") has layout="${layout}"; use "stack" or "wide"`);
  }
  if (attributes.has("clip") && !attributes.has("frame")) throw new Error(`${where} ("${title}") has clip without a frame`);

  const id = `${slug}-${slugify(title)}`;
  const note = content.match(/^\s*<play-note>([\s\S]*?)<\/play-note>/);
  const markup = expandIcons(dedent(keepVerbatim(note ? content.slice(note[0].length) : content)), icons);
  const rendered = playground.render({ slug, title, id, markup });
  if (!rendered) {
    leaveOut(title);
    return undefined;
  }
  const { demo, hydrate } = rendered;

  const container: Attributes = new Map([["class", "play-demo"]]);
  if (layout) container.set("data-layout", layout);
  if (attributes.has("dir")) container.set("dir", attributes.get("dir"));
  if (attributes.has("lang")) container.set("lang", attributes.get("lang"));
  const frame = attributes.get("frame");
  // A hydrated demo's container holds exactly what React rendered, with no
  // whitespace around it.
  const root: Attributes = new Map([
    ["data-play-root", slug],
    ["data-play-example", escape(title)],
  ]);
  const frameAttributes: Attributes = new Map([
    ["class", "play-frame"],
    ["style", `inline-size: ${frame}${attributes.has("clip") ? "; overflow: hidden" : ""}`],
  ]);
  if (hydrate) for (const [key, value] of root) (frame ? frameAttributes : container).set(key, value);

  // The copied code keeps the demo's dir and lang, so a right-to-left
  // example stays right to left when pasted.
  const direction = ["dir", "lang"].filter((key) => attributes.has(key));
  const copied = direction.length
    ? [`<div ${direction.map((key) => `${key}="${attributes.get(key)}"`).join(" ")}>`, indent(rendered.code, "  "), `</div>`].join("\n")
    : rendered.code;
  // The code is one line, with newlines as &#10;, so indenting the page
  // around it can't add spaces inside <pre>.
  const code = restoreVerbatim(highlight(copied), escape).replaceAll("\n", "&#10;");

  const live = frame
    ? hydrate
      ? `      ${openTag("div", frameAttributes, "      ")}${demo}</div>`
      : [`      ${openTag("div", frameAttributes, "      ")}`, indent(demo, "        "), `      </div>`].join("\n")
    : indent(demo, "      ");
  const demoBlock =
    hydrate && !frame
      ? `    ${openTag("div", container, "    ")}${demo}</div>`
      : [`    ${openTag("div", container, "    ")}`, live, `    </div>`].join("\n");

  return [
    `<section class="play-example" id="${id}" aria-labelledby="${id}-title">`,
    `  <h2 class="play-example-title" id="${id}-title">${title}</h2>`,
    note ? `  <p class="play-note">${note[1].trim().replace(/\s+/g, " ")}</p>` : "",
    `  <div class="play-specimen">`,
    attributes.has("replay")
      ? [
          `    <button class="hbutton play-replay" data-variant="tertiary" data-size="small" type="button" ${hydrate ? "data-play-remount" : "data-play-replay"}>`,
          `      <span class="hbutton-label">Replay</span>`,
          `    </button>`,
        ].join("\n")
      : "",
    demoBlock,
    `    <details class="play-code">`,
    `      <summary>`,
    `        <play-icon name="chevron" class="play-code-chevron"></play-icon>`,
    `        ${playground.codeLabel}`,
    `      </summary>`,
    `      <div class="play-code-body">`,
    `        <button class="hbutton play-copy" data-variant="tertiary" data-size="small" type="button" data-play-copy>`,
    `          <span class="hbutton-label" aria-live="polite">Copy</span>`,
    `        </button>`,
    `        <pre><code>${code}</code></pre>`,
    `      </div>`,
    `    </details>`,
    `  </div>`,
    `</section>`,
  ]
    .filter(Boolean)
    .join("\n");
}

// The playground's own Sidebar: the overview, then every group of the
// catalog, linking to each component's page. Components without a page yet
// are listed but not linked.
function renderNav(components: Set<string>, current: string) {
  const link = (href: string, label: string, isCurrent: boolean) =>
    `<li><a class="hsidebar-item" href="${href}"${isCurrent ? ` aria-current="page"` : ""}><span class="hsidebar-label">${label}</span></a></li>`;
  const groups = catalog.map((group) => {
    const id = `nav-${slugify(group.title)}`;
    const items = group.entries.map((entry) =>
      components.has(entry.slug)
        ? `    ${link(`${entry.slug}.html`, entry.title, entry.slug === current)}`
        : `    <li><span class="hsidebar-item play-nav-pending"><span class="hsidebar-label">${entry.title}</span></span></li>`,
    );
    return [
      `<div class="hsidebar-group">`,
      `  <p class="hsidebar-group-label" id="${id}">${group.title}</p>`,
      `  <ul class="hsidebar-list" aria-labelledby="${id}">`,
      ...items,
      `  </ul>`,
      `</div>`,
    ].join("\n");
  });
  const overview = [`<div class="hsidebar-group">`, `  <ul class="hsidebar-list">`, `    ${link("index.html", "Overview", current === "index")}`, `  </ul>`, `</div>`].join("\n");
  return [overview, ...groups].join("\n");
}

// Icons -----------------------------------------------------------------------

type Attributes = Map<string, string | undefined>;
type Icons = Map<string, { attributes: Attributes; body: string }>;

function loadIcons(): Icons {
  const icons: Icons = new Map();
  for (const file of readdirSync(join(src, "icons"))) {
    const match = readFileSync(join(src, "icons", file), "utf8").match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
    if (!match) throw new Error(`icons/${file} is not an <svg>`);
    icons.set(basename(file, ".svg"), { attributes: parseAttributes(match[1]), body: dedent(match[2]) });
  }
  return icons;
}

// Replaces each <play-icon> with its full SVG, indented to match its line.
function expandIcons(html: string, icons: Icons) {
  return html.replace(/<play-icon\b([^>]*?)\s*(?:\/>|><\/play-icon>)/g, (_, source: string, offset: number) => {
    const attributes = parseAttributes(source);
    const name = attributes.get("name") ?? "";
    const icon = icons.get(name);
    if (!icon) throw new Error(`Unknown icon "${name}"`);

    attributes.delete("name");
    for (const [key, value] of icon.attributes) if (!attributes.has(key)) attributes.set(key, value);

    const indentation = html.slice(html.lastIndexOf("\n", offset - 1) + 1).match(/^ */)![0];
    return [openTag("svg", attributes, indentation), indent(icon.body, `${indentation}  `), `${indentation}</svg>`].join("\n");
  });
}

// Markup ----------------------------------------------------------------------

function parseAttributes(source: string): Attributes {
  const attributes: Attributes = new Map();
  for (const [, name, value] of source.matchAll(/([^\s="'>/]+)(?:="([^"]*)")?/g)) attributes.set(name, value);
  return attributes;
}

// One line when it fits in 80 columns, otherwise one attribute per line.
function openTag(name: string, attributes: Attributes, indentation: string) {
  const parts = [...attributes].map(([key, value]) => (value === undefined ? key : `${key}="${value}"`));
  const line = `<${name} ${parts.join(" ")}>`;
  if (indentation.length + line.length <= 80) return line;
  return [`<${name}`, ...parts.map((part) => `${indentation}  ${part}`), `${indentation}>`].join("\n");
}

// The copyable markup leaves out the hooks only example scripts read.
export function stripExampleHooks(html: string) {
  return html.replace(/\n *data-example-[\w-]+(?:="[^"]*")?(?=\n)/g, "").replace(/ data-example-[\w-]+(?:="[^"]*")?/g, "");
}

function escape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function highlight(code: string) {
  const token = (kind: string, html: string) => `<span class="play-code-${kind}">${html}</span>`;
  return code.replace(
    /<(\/?)([\w-]+)([^>]*?)(\/?)>|[^<]+|[\s\S]/g,
    (match, slash: string, name: string | undefined, attributes: string, selfClosing: string) => {
      if (name === undefined) return escape(match);
      const attributeHtml = attributes.replace(
        /([^\s=]+)(?:=("[^"]*"))?/g,
        (_, key: string, value?: string) =>
          token("attribute", escape(key)) + (value ? token("punctuation", "=") + token("value", escape(value)) : ""),
      );
      return token("punctuation", `&lt;${slash}`) + token("tag", name) + attributeHtml + token("punctuation", `${selfClosing}&gt;`);
    },
  );
}

// Text ------------------------------------------------------------------------

function keepVerbatim(html: string) {
  return html.replace(
    /(<(textarea|pre)\b[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (_, open: string, _tag: string, text: string, close: string) => `${open}\u0000${verbatim.push(text) - 1}\u0000${close}`,
  );
}

function restoreVerbatim(html: string, encode = (text: string) => text) {
  return html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => encode(verbatim[Number(index)]));
}

export function dedent(text: string) {
  const lines = text.replace(/^\s*\n|\s+$/g, "").split("\n");
  const margin = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)![0].length));
  return lines.map((line) => line.slice(margin)).join("\n");
}

function indent(text: string, indentation: string) {
  return text
    .split("\n")
    .map((line) => (line ? indentation + line : line))
    .join("\n");
}

// Fills {{key}} placeholders in one pass, so placeholder-like text in the
// values, such as a template's {{1}}, is left alone. A placeholder alone on
// its line takes that line's indentation for every line of its value.
function fill(template: string, values: Record<string, string>) {
  const value = (key: string) => {
    if (!(key in values)) throw new Error(`layout.html uses an unknown placeholder {{${key}}}`);
    return values[key];
  };
  return template.replace(
    /^( *)\{\{(\w+)\}\}$|\{\{(\w+)\}\}/gm,
    (_, indentation: string | undefined, lineKey: string | undefined, inlineKey: string) =>
      lineKey ? indent(value(lineKey), indentation ?? "") : value(inlineKey),
  );
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Checks ----------------------------------------------------------------------

// Every build-time element was replaced, ids don't repeat on a page (the
// layout's own included), every reference points to an element, and each
// popup's anchor name is used once. Attribute names are matched in any case,
// as HTML reads them; React writes popoverTarget.
function checkPage(file: string, html: string) {
  const leftover = html.match(/<\/?play-[\w-]+/);
  if (leftover) throw new Error(`${file} still contains ${leftover[0]}>; check its spelling and that it's closed`);

  const live = html.replace(/<pre><code>[\s\S]*?<\/code><\/pre>/g, "");
  const known = new Set<string>();
  const duplicates = new Set<string>();
  for (const [, id] of live.matchAll(/\sid="([^"]+)"/g)) (known.has(id) ? duplicates : known).add(id);
  if (duplicates.size) throw new Error(`${file} repeats the id ${[...duplicates].join(", ")}`);

  for (const [, attribute, value] of live.matchAll(/\s(aria-labelledby|aria-describedby|aria-controls|for|popovertarget)="([^"]+)"/gi)) {
    for (const id of value.split(/\s+/)) {
      if (!known.has(id)) throw new Error(`${file} has ${attribute}="${id}", but no element has that id`);
    }
  }

  const anchors = new Set<string>();
  const repeated = new Set<string>();
  for (const [, name] of live.matchAll(/anchor-name:\s*(--[\w-]+)/g)) (anchors.has(name) ? repeated : anchors).add(name);
  if (repeated.size) throw new Error(`${file} repeats the anchor name ${[...repeated].join(", ")}`);
  for (const [, name] of live.matchAll(/position-anchor:\s*(--[\w-]+)/g)) {
    if (!anchors.has(name)) throw new Error(`${file} has position-anchor: ${name}, but no trigger has that anchor name`);
  }
}
