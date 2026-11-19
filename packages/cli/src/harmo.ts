#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { theme as themeFor } from "./palettes/palette.js";

const usage = `Copy Harmo's components and styles into your project, and make them yours.

Usage:
  npx harmo-ui add <name...>        Copy components or patterns, with their styles and
                                    what they need
  npx harmo-ui add --all            Copy every component
  npx harmo-ui list                 List the components and patterns
  npx harmo-ui theme <color>        Write harmo-theme.css: your brand color, as a hex
                                    code, in every role, in light and dark mode

Options for add and theme:
  -p, --path <folder>   Where to write. By default components/harmo, or
                        src/components/harmo if the project has a src folder
  -o, --overwrite       Replace files that differ from Harmo's, without asking
      --dry-run         Show what would change, and change nothing
      --no-install      For a pattern that needs npm packages, such as kanban,
                        print the command that installs them, rather than run it

  -h, --help            Show this help
  -v, --version         Show the version`;

interface Listing {
  name: string;
  categories?: string[];
  description?: string;
}

const isPattern = ({ categories }: Listing) =>
  categories?.includes("pattern") ?? false;

interface Item extends Listing {
  files: { path: string; content: string }[];
  dependencies?: string[];
  devDependencies?: string[];
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = <T>(...path: string[]): T =>
  JSON.parse(readFileSync(join(root, ...path), "utf8"));
const listings = () =>
  readJson<{ items: Listing[] }>("registry", "registry.json").items;

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

// Where a path really is, through any links on the way to it, whether or not
// it's there yet; undefined for a link that leads nowhere.
const realPathOf = (path: string): string | undefined => {
  if (lstatSync(path, { throwIfNoEntry: false })) {
    try {
      return realpathSync(path);
    } catch {
      return undefined;
    }
  }
  const parent = dirname(path);
  if (parent === path) return path;
  const real = realPathOf(parent);
  return real && join(real, basename(path));
};

// The paths, each relative to the folder, that would be written outside it:
// one that leads out, as ../ or an absolute path does, or one reached through a
// link, of a file or of a folder on the way, that leads out of it. The folder
// itself may be a link, as the project chose it.
const outsideOf = (base: string, paths: string[]) => {
  const real = realPathOf(base);
  return paths.filter((path) => {
    const target = resolve(base, path);
    if (!target.startsWith(base + sep)) return true;
    const reached = realPathOf(target);
    return !real || !reached || !reached.startsWith(real + sep);
  });
};

const refuseOutside = (base: string, folder: string, paths: string[]) => {
  const outside = outsideOf(base, paths);
  if (outside.length > 0)
    fail(
      `Nothing was written: ${outside.join(", ")} would be written outside ${folder}, or through a link that leads out of it.`,
    );
};

// harmo.css, which a project imports once: the tokens first, then the accents, then
// each component, in the order of the full bundle, then the stylesheets patterns
// share, from a folder in patterns/ that isn't a pattern, such as auth-form's,
// then each pattern's own; each builds on what comes before it. Only adds
// imports, so anything else in it stays.
const stylesHeader = `/* Harmo's styles. Import this file once. harmo-ui add keeps this list up to date. */`;
const styleOrder = (
  path: string,
  patterns: Set<string>,
): [rank: number, folder: string, file: string] => {
  const [folder = "", name = "", file = ""] = path.split("/");
  if (path === "tokens.css") return [0, "", ""];
  if (path === "accents.css") return [1, "", ""];
  if (folder !== "patterns") return [2, folder, ""];
  return [patterns.has(name) ? 4 : 3, name, file];
};
const isBefore = (a: string, b: string, patterns: Set<string>) => {
  const [rankA, folderA, fileA] = styleOrder(a, patterns);
  const [rankB, folderB, fileB] = styleOrder(b, patterns);
  if (rankA !== rankB) return rankA < rankB;
  return folderA === folderB ? fileA < fileB : folderA < folderB;
};

// Every @import in a stylesheet, with where it starts and ends. Comments, quoted
// strings, and parentheses are read whole, so an import inside a comment doesn't
// count, and a semicolon inside a URL doesn't end one.
const cssImports = (css: string) => {
  const found: { text: string; start: number; end: number }[] = [];
  let start = -1;
  let parens = 0;
  let braces = 0;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === "/" && css[i + 1] === "*") {
      const close = css.indexOf("*/", i + 2);
      i = close === -1 ? css.length : close + 1;
    } else if (char === '"' || char === "'") {
      for (i++; i < css.length && css[i] !== char; i++) if (css[i] === "\\") i++;
    } else if (char === "(") parens++;
    else if (char === ")") parens = Math.max(0, parens - 1);
    else if (char === "{") braces++;
    else if (char === "}") braces = Math.max(0, braces - 1);
    else if (start === -1 && braces === 0 && css.startsWith("@import", i) && /[\s"'u]/.test(css[i + 7] ?? ""))
      start = i;
    else if (char === ";" && start !== -1 && parens === 0) {
      found.push({ text: css.slice(start, i + 1), start, end: i + 1 });
      start = -1;
    }
  }
  return found;
};

// The imports of Harmo's own stylesheets, however a formatter or a person wrote
// them: a component's, named after its folder, and any in a folder in patterns/,
// as a pattern or a helper can hold more than one, named as it likes.
const harmoImports = (css: string) =>
  cssImports(css).flatMap(({ text, start, end }) => {
    const path =
      /^@import\s+(?:url\(\s*)?["']?(?:\.\/)?(tokens\.css|accents\.css|patterns\/[\w-]+\/[\w.-]+\.css|([a-z-]+)\/\2\.css)/.exec(text)?.[1];
    return path ? [{ path, start, end }] : [];
  });

const withStyles = (
  existing: string | undefined,
  paths: string[],
  patterns: Set<string>,
) => {
  const isBeforeIn = (a: string, b: string) => isBefore(a, b, patterns);
  let css = existing ?? `${stylesHeader}\n`;
  const lineEnding = css.includes("\r\n") ? "\r\n" : "\n";
  const insert = (at: number, text: string) => {
    css = `${css.slice(0, at)}${text}${css.slice(at)}`;
  };

  const listed = harmoImports(css).map(({ path }) => path);
  const missing = paths.filter((path) => !listed.includes(path));
  for (const path of missing.sort((a, b) => (isBeforeIn(a, b) ? -1 : 1))) {
    const line = `@import "./${path}";`;
    const imports = harmoImports(css);
    const next = imports.find((other) => isBeforeIn(path, other.path));
    const last = imports.at(-1);
    if (next) insert(next.start, `${line}${lineEnding}`);
    else if (last) insert(last.end, `${lineEnding}${line}`);
    // CSS ignores an @import that follows a rule, so with none to go beside, it
    // goes at the top.
    else {
      const top = css.startsWith(stylesHeader)
        ? stylesHeader.length + lineEnding.length
        : 0;
      insert(top, `${line}${lineEnding}`);
    }
  }
  return css;
};

// A Windows checkout changes every line ending, which isn't an edit worth asking about.
// The project's package manager: the one its package.json names, or the one
// whose lockfile it has, or npm.
const managers = [
  { name: "bun", lockfiles: ["bun.lock", "bun.lockb"], add: ["add"], dev: "--dev" },
  { name: "pnpm", lockfiles: ["pnpm-lock.yaml"], add: ["add"], dev: "--save-dev" },
  { name: "yarn", lockfiles: ["yarn.lock"], add: ["add"], dev: "--dev" },
  { name: "npm", lockfiles: ["package-lock.json"], add: ["install"], dev: "--save-dev" },
] as const;
const manifestAt = (folder: string): { packageManager?: unknown; workspaces?: unknown } => {
  try {
    return JSON.parse(readFileSync(join(folder, "package.json"), "utf8"));
  } catch {
    return {};
  }
};

// The packages pnpm-workspace.yaml lists: the items under its packages key,
// such as - 'apps/*', without quotes or comments.
const pnpmPackages = (text: string) => {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^packages\s*:/.test(line));
  const patterns: string[] = [];
  if (start === -1) return patterns;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    const item = /^\s+-\s*(["']?)(.*?)\1\s*(?:#.*)?$/.exec(line);
    if (!item) break;
    patterns.push(item[2] ?? "");
  }
  return patterns;
};

// The packages a workspace root names, from its package.json or
// pnpm-workspace.yaml, such as apps/*; those after a ! are left out.
const workspacesAt = (folder: string) => {
  const { workspaces } = manifestAt(folder);
  const listed = Array.isArray(workspaces)
    ? workspaces
    : Array.isArray((workspaces as { packages?: unknown } | undefined)?.packages)
      ? (workspaces as { packages: unknown[] }).packages
      : [];
  let pnpm: string[] = [];
  try {
    pnpm = pnpmPackages(readFileSync(join(folder, "pnpm-workspace.yaml"), "utf8"));
  } catch {
    // Not a pnpm workspace.
  }
  const patterns = [...listed, ...pnpm].filter((pattern): pattern is string => typeof pattern === "string" && pattern !== "");
  return {
    included: patterns.filter((pattern) => !pattern.startsWith("!")),
    excluded: patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1)),
  };
};

// A pattern with {a,b} in it, as each pattern it stands for.
const expanded = (pattern: string): string[] => {
  const braces = /\{([^{}]*)\}/.exec(pattern);
  if (!braces) return [pattern];
  const before = pattern.slice(0, braces.index);
  const after = pattern.slice(braces.index + braces[0].length);
  return (braces[1] ?? "").split(",").flatMap((choice) => expanded(before + choice + after));
};

// Whether a path, such as apps/web, is one a workspace pattern names: * is
// one folder, or part of one, and ** any number of them.
const named = (path: string, pattern: string) => {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const wanted = pattern.replace(/^\.\//, "").split("/").filter(Boolean);
  const match = (at: number, from: number): boolean => {
    if (from === wanted.length) return at === parts.length;
    if (wanted[from] === "**") return match(at, from + 1) || (at < parts.length && match(at + 1, from));
    const part = parts[at];
    if (part === undefined) return false;
    const glob = new RegExp(`^${(wanted[from] ?? "").replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return glob.test(part) && match(at + 1, from + 1);
  };
  return match(0, 0);
};

// Whether the workspace whose root is this folder has the project in it.
const memberOf = (root: string, project: string) => {
  const { included, excluded } = workspacesAt(root);
  const path = relative(root, project);
  const matches = (pattern: string) => expanded(pattern).some((each) => named(path, each));
  return included.some(matches) && !excluded.some(matches);
};

const namedIn = (manifest: { packageManager?: unknown }) =>
  typeof manifest.packageManager === "string" ? managers.find(({ name }) => name === String(manifest.packageManager).split("@")[0]) : undefined;
const lockedAt = (folder: string) =>
  managers.find(({ lockfiles }) => lockfiles.some((file) => existsSync(join(folder, file)))) ??
  (existsSync(join(folder, "pnpm-workspace.yaml")) ? managers[1] : undefined);

// The project's package manager: the one its package.json names; inside a
// workspace, the one the workspace's root names, or whose lockfile it has,
// as installing changes the root's lockfile; otherwise the one whose
// lockfile the project has; or npm.
const managerOf = (project: string, manifest: { packageManager?: unknown }) => {
  const own = namedIn(manifest);
  if (own) return own;
  for (let folder = dirname(project); folder !== dirname(folder); folder = dirname(folder)) {
    if (memberOf(folder, project)) return namedIn(manifestAt(folder)) ?? lockedAt(folder) ?? lockedAt(project) ?? managers[3];
  }
  return lockedAt(project) ?? managers[3];
};

// A name and version, such as @dnd-kit/core@6.3.1: its name.
const packageName = (spec: string) => spec.slice(0, spec.lastIndexOf("@") > 0 ? spec.lastIndexOf("@") : spec.length);

const sameText = (a: string, b: string) =>
  a.replaceAll("\r\n", "\n") === b.replaceAll("\r\n", "\n");

const add = async (
  names: string[],
  options: { all: boolean; path?: string; overwrite: boolean; dryRun: boolean; install: boolean },
) => {
  const project = process.cwd();
  const manifestPath = join(project, "package.json");
  if (!existsSync(manifestPath))
    fail(
      "There's no package.json here. Run this from your project's root.",
    );

  const available = listings();
  const requested = options.all
    ? available.filter((listing) => !isPattern(listing)).map(({ name }) => name)
    : [...new Set(names)];
  if (requested.length === 0)
    fail(
      "Name a component or pattern to add, such as npx harmo-ui add button. npx harmo-ui list shows them all.",
    );
  const unknown = requested.filter(
    (name) => !available.some((listing) => listing.name === name),
  );
  if (unknown.length > 0)
    fail(
      `There's no component or pattern called ${unknown.join(", ")}. npx harmo-ui list shows them all.`,
    );

  const folder =
    options.path ??
    (existsSync(join(project, "src"))
      ? "src/components/harmo"
      : "components/harmo");
  const base = resolve(project, folder);

  // Components share files, such as lib/withClass.ts, so each is written once.
  const files = new Map<string, string>();
  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();
  for (const name of requested) {
    const item = readJson<Item>("registry", `${name}.json`);
    for (const { path, content } of item.files) files.set(path, content);
    for (const dependency of item.dependencies ?? []) dependencies.add(dependency);
    for (const dependency of item.devDependencies ?? []) devDependencies.add(dependency);
  }
  refuseOutside(base, folder, [...files.keys(), "harmo.css"]);

  const differing: string[] = [];
  for (const [path, content] of files) {
    const target = join(base, path);
    if (existsSync(target) && !sameText(readFileSync(target, "utf8"), content))
      differing.push(path);
  }

  // A file that differs may be the project's own edit, so it's replaced only when
  // asked. Without a terminal to ask in, it's kept.
  const toReplace: string[] = [];
  const kept: string[] = [];
  if (options.overwrite) {
    toReplace.push(...differing);
  } else if (options.dryRun || !process.stdin.isTTY || !process.stdout.isTTY) {
    kept.push(...differing);
  } else if (differing.length > 0) {
    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    for (const path of differing) {
      const answer = await prompt.question(
        `${folder}/${path} differs from Harmo's. Replace it? [y/N] `,
      );
      (answer.trim().toLowerCase().startsWith("y") ? toReplace : kept).push(
        path,
      );
    }
    prompt.close();
  }

  // Worked out after the prompt, so a file that appeared during it isn't written over.
  const toCreate = [...files.keys()].filter(
    (path) => !existsSync(join(base, path)),
  );

  const stylesPath = join(base, "harmo.css");
  const stylesExisted = existsSync(stylesPath);
  const stylesBefore = stylesExisted
    ? readFileSync(stylesPath, "utf8")
    : undefined;
  const stylesAfter = withStyles(
    stylesBefore,
    [...files.keys()].filter((path) => path.endsWith(".css")),
    new Set(available.filter(isPattern).map(({ name }) => name)),
  );
  const stylesUpdated = stylesExisted && stylesAfter !== stylesBefore;

  if (!options.dryRun) {
    for (const path of [...toCreate, ...toReplace]) {
      const target = join(base, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, files.get(path) as string);
    }
    if (stylesAfter !== stylesBefore) {
      mkdirSync(base, { recursive: true });
      writeFileSync(stylesPath, stylesAfter);
    }
  }

  const created = toCreate.length + (stylesExisted ? 0 : 1);
  if (created > 0)
    console.log(
      `${options.dryRun ? "Would create" : "Created"} ${plural(created, "file")} in ${folder}`,
    );
  if (toReplace.length > 0) {
    console.log(
      `${options.dryRun ? "Would replace" : "Replaced"} ${plural(toReplace.length, "file")}: ${toReplace.join(", ")}`,
    );
  }
  if (kept.length > 0) {
    console.log(
      `Kept ${plural(kept.length, "file")} that ${kept.length === 1 ? "differs" : "differ"} from Harmo's: ${kept.join(", ")}`,
    );
    console.log("Run again with --overwrite to replace.");
  }
  if (stylesUpdated)
    console.log(
      `${options.dryRun ? "Would update" : "Updated"} ${folder}/harmo.css`,
    );
  if (created + toReplace.length + kept.length === 0 && !stylesUpdated)
    console.log("Already up to date.");

  if (!stylesExisted)
    console.log(
      `\nImport ${folder}/harmo.css once, in your root layout or entry file.`,
    );

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const groups = [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies, manifest.optionalDependencies];
  // A package listed as a dependency of any kind, even with the empty range,
  // which npm takes as any version.
  const rangeOf = (name: string) => groups.find((group) => group !== undefined && Object.hasOwn(group, name))?.[name];
  const listed = (name: string) => rangeOf(name) !== undefined;
  const unlisted = ["react", "react-dom"].filter((name) => !listed(name));
  if (unlisted.length > 0) {
    console.log(
      `\nHarmo's components need React and React DOM 19.3 or later, and this project doesn't list ${unlisted.join(" or ")}.`,
    );
  }

  // The npm packages a pattern needs, such as dnd-kit for kanban, at the
  // versions it's tested with, and their types where they come apart, such
  // as @types/three for globe, as dev dependencies. One the project already
  // lists is left as it is.
  const needed = [...dependencies, ...devDependencies].sort();
  const own = needed.filter((spec) => listed(packageName(spec)));
  if (own.length > 0)
    console.log(
      `\nKept your ${own.map((spec) => `${packageName(spec)} ${rangeOf(packageName(spec)) || "*"}`).join(", ")}; Harmo is tested with ${own.join(", ")}.`,
    );
  const manager = managerOf(project, manifest);
  const installs = [
    { specs: [...dependencies].sort(), flags: [] as string[], as: "" },
    { specs: [...devDependencies].sort(), flags: [manager.dev], as: " as dev dependencies" },
  ]
    .map((group) => ({ ...group, specs: group.specs.filter((spec) => !listed(packageName(spec))) }))
    .filter((group) => group.specs.length > 0)
    .map((group) => ({ ...group, command: [manager.name, ...manager.add, ...group.flags, ...group.specs] }));
  if (installs.length === 0) return;
  if (options.dryRun) {
    for (const { specs, as, command } of installs) console.log(`\nWould install ${specs.join(", ")}${as}: ${command.join(" ")}`);
    return;
  }
  if (!options.install) {
    console.log(`\nInstall what it needs:\n${installs.map(({ command }) => `  ${command.join(" ")}`).join("\n")}`);
    return;
  }
  for (const { specs, as, command } of installs) {
    console.log(`\nInstalling ${specs.join(", ")}${as} with ${manager.name}`);
    const result = spawnSync(command[0] as string, command.slice(1), {
      cwd: project,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      console.error(`\nThat didn't install. Run it yourself:\n${installs.map(({ command: each }) => `  ${each.join(" ")}`).join("\n")}`);
      process.exitCode = 1;
      return;
    }
  }
};

// harmo-theme.css: a brand color adapted to every role, as :root overrides of
// Harmo's tokens, which are at zero specificity, so it works wherever it loads.
const themeFile = "harmo-theme.css";

// Adds the theme's import after the last import in harmo.css, once. Imports
// add puts in later go before it, since add only places Harmo's own.
const withTheme = (css: string) => {
  const imports = cssImports(css);
  const theme = /^@import\s+(?:url\(\s*)?["']?(?:\.\/)?harmo-theme\.css/;
  if (imports.some(({ text }) => theme.test(text))) return css;
  const lineEnding = css.includes("\r\n") ? "\r\n" : "\n";
  const line = `@import "./${themeFile}";`;
  const last = imports.at(-1);
  if (!last) return `${line}${lineEnding}${css}`;
  return `${css.slice(0, last.end)}${lineEnding}${line}${css.slice(last.end)}`;
};

const theme = async (
  colors: string[],
  options: { path?: string; overwrite: boolean; dryRun: boolean },
) => {
  const project = process.cwd();
  if (!existsSync(join(project, "package.json")))
    fail("There's no package.json here. Run this from your project's root.");
  if (colors.length !== 1)
    fail('Give one color, as a hex code, such as npx harmo-ui theme "#0f75b6".');

  let generated;
  try {
    generated = themeFor(colors[0] as string);
  } catch (error) {
    return fail((error as Error).message);
  }

  const folder =
    options.path ??
    (existsSync(join(project, "src"))
      ? "src/components/harmo"
      : "components/harmo");
  const base = resolve(project, folder);
  refuseOutside(base, folder, [themeFile, "harmo.css"]);
  const target = join(base, themeFile);
  const existed = existsSync(target);
  const same = existed && sameText(readFileSync(target, "utf8"), generated.css);

  // A theme that differs may hold the project's own edits, so it's replaced
  // only when asked. Without a terminal to ask in, it's kept.
  let write = !existed;
  if (existed && !same) {
    if (options.overwrite) write = true;
    else if (!options.dryRun && process.stdin.isTTY && process.stdout.isTTY) {
      const prompt = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await prompt.question(
        `${folder}/${themeFile} differs from this theme. Replace it? [y/N] `,
      );
      prompt.close();
      write = answer.trim().toLowerCase().startsWith("y");
    }
  }

  const stylesPath = join(base, "harmo.css");
  const stylesBefore = existsSync(stylesPath) ? readFileSync(stylesPath, "utf8") : undefined;
  const stylesAfter = stylesBefore === undefined ? undefined : withTheme(stylesBefore);
  const stylesUpdated = stylesAfter !== stylesBefore;

  if (options.dryRun) console.log(generated.css);
  else {
    if (write) {
      mkdirSync(base, { recursive: true });
      writeFileSync(target, generated.css);
    }
    if (stylesUpdated) writeFileSync(stylesPath, stylesAfter as string);
  }

  const from = generated.basis.includes(" and ")
    ? `Harmo's ${generated.basis} accents`
    : `Harmo's ${generated.basis} accent`;
  if (same) console.log(`${folder}/${themeFile} already has this theme.`);
  else if (write || options.dryRun)
    console.log(
      `${options.dryRun ? "Would write" : existed ? "Replaced" : "Created"} ${folder}/${themeFile}, adapted from ${from}.`,
    );
  else {
    console.log(`Kept ${folder}/${themeFile}, which differs from this theme.`);
    console.log("Run again with --overwrite to replace it.");
  }
  if (generated.darkened)
    console.log(
      `${colors[0]} is too light for ${generated.tooLightFor}, so text and buttons use ${generated.darkened}.`,
    );
  if (stylesUpdated)
    console.log(`${options.dryRun ? "Would add" : "Added"} it to ${folder}/harmo.css.`);
  else if (stylesBefore === undefined && !same)
    console.log(
      `\nImport ${folder}/${themeFile} once, alongside Harmo's styles. Its colors win wherever it loads.`,
    );
};

const list = () => {
  const items = listings();
  const width = Math.max(...items.map(({ name }) => name.length));
  const show = ({ name, description }: Listing) =>
    console.log(`${name.padEnd(width)}  ${description ?? ""}`.trimEnd());
  items.filter((item) => !isPattern(item)).forEach(show);
  const patterns = items.filter(isPattern);
  if (patterns.length > 0) {
    console.log("\nPatterns, to copy and change as your own code:");
    patterns.forEach(show);
  }
};

const main = async () => {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        all: { type: "boolean", short: "a", default: false },
        path: { type: "string", short: "p" },
        overwrite: { type: "boolean", short: "o", default: false },
        "dry-run": { type: "boolean", default: false },
        "no-install": { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    return fail(`${(error as Error).message}\n\n${usage}`);
  }
  const { values, positionals } = parsed;
  const [command, ...names] = positionals;

  if (values.version)
    return console.log(readJson<{ version: string }>("package.json").version);
  if (values.help || !command) return console.log(usage);
  if (command === "list") return list();
  if (command === "add") {
    return add(names, {
      all: values.all,
      path: values.path,
      overwrite: values.overwrite,
      dryRun: values["dry-run"],
      install: !values["no-install"],
    });
  }
  if (command === "theme") {
    return theme(names, {
      path: values.path,
      overwrite: values.overwrite,
      dryRun: values["dry-run"],
    });
  }
  return fail(`There's no command called ${command}.\n\n${usage}`);
};

await main();
