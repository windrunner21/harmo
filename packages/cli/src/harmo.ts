#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const usage = `Copy Harmo's components and styles into your project, and make them yours.

Usage:
  harmo add <component...>   Copy components, with their styles and what they need
  harmo add --all            Copy every component
  harmo list                 List the components

Options for add:
  -p, --path <folder>   Where to copy them. By default components/harmo, or
                        src/components/harmo if the project has a src folder
  -o, --overwrite       Replace files that differ from Harmo's, without asking
      --dry-run         Show what would change, and change nothing

  -h, --help            Show this help
  -v, --version         Show the version`;

interface Listing {
  name: string;
  description?: string;
}

interface Item extends Listing {
  files: { path: string; content: string }[];
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

// harmo.css, which a project imports once: the tokens first, then each component,
// in the order of the full bundle. Only adds imports, so anything else in it stays.
const stylesHeader = `/* Harmo's styles. Import this file once. harmo add keeps this list up to date. */`;
const styleOrder = (path: string) => {
  const folder = path.split("/")[0] as string;
  return [
    path === "tokens.css" ? 0 : folder === "settings" ? 2 : 1,
    folder,
  ] as const;
};
const isBefore = (a: string, b: string) => {
  const [rankA, folderA] = styleOrder(a);
  const [rankB, folderB] = styleOrder(b);
  return rankA === rankB ? folderA < folderB : rankA < rankB;
};

// The imports of Harmo's own stylesheets, however a formatter or a person wrote them.
// Comments match first, so an import inside one doesn't count.
const harmoImports = (css: string) =>
  [...css.matchAll(/\/\*[\s\S]*?\*\/|@import\s[^;]*;/g)].flatMap((match) => {
    const path =
      /^@import\s+(?:url\(\s*)?["']?(?:\.\/)?(tokens\.css|([a-z-]+)\/\2\.css)/.exec(
        match[0],
      )?.[1];
    const end = match.index + match[0].length;
    return path ? [{ path, start: match.index, end }] : [];
  });

const withStyles = (existing: string | undefined, paths: string[]) => {
  let css = existing ?? `${stylesHeader}\n`;
  const lineEnding = css.includes("\r\n") ? "\r\n" : "\n";
  const insert = (at: number, text: string) => {
    css = `${css.slice(0, at)}${text}${css.slice(at)}`;
  };

  const listed = harmoImports(css).map(({ path }) => path);
  const missing = paths.filter((path) => !listed.includes(path));
  for (const path of missing.sort((a, b) => (isBefore(a, b) ? -1 : 1))) {
    const line = `@import "./${path}";`;
    const imports = harmoImports(css);
    const next = imports.find((other) => isBefore(path, other.path));
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
const sameText = (a: string, b: string) =>
  a.replaceAll("\r\n", "\n") === b.replaceAll("\r\n", "\n");

const add = async (
  names: string[],
  options: { all: boolean; path?: string; overwrite: boolean; dryRun: boolean },
) => {
  const project = process.cwd();
  const manifestPath = join(project, "package.json");
  if (!existsSync(manifestPath))
    fail(
      "There's no package.json here. Run harmo add from your project's root.",
    );

  const available = listings().map(({ name }) => name);
  const requested = options.all ? available : [...new Set(names)];
  if (requested.length === 0)
    fail(
      "Name a component to add, such as harmo add button. harmo list shows them all.",
    );
  const unknown = requested.filter((name) => !available.includes(name));
  if (unknown.length > 0)
    fail(
      `There's no component called ${unknown.join(", ")}. harmo list shows them all.`,
    );

  const folder =
    options.path ??
    (existsSync(join(project, "src"))
      ? "src/components/harmo"
      : "components/harmo");
  const base = resolve(project, folder);

  // Components share files, such as lib/withClass.ts, so each is written once.
  const files = new Map<string, string>();
  for (const name of requested) {
    for (const { path, content } of readJson<Item>("registry", `${name}.json`)
      .files)
      files.set(path, content);
  }

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
  if (!manifest.dependencies?.react && !manifest.devDependencies?.react) {
    console.log(
      "\nHarmo's components need React 19.3 or later, which this project doesn't list.",
    );
  }
};

const list = () => {
  const items = listings();
  const width = Math.max(...items.map(({ name }) => name.length));
  for (const { name, description } of items)
    console.log(`${name.padEnd(width)}  ${description ?? ""}`.trimEnd());
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
    });
  }
  return fail(`There's no command called ${command}.\n\n${usage}`);
};

await main();
