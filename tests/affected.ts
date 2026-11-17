// Which browser tests a change needs: the specs of the playground pages it
// touches, and those pages' share of pages.spec.ts, rather than all of them.
//
//   bun tests/affected.ts [--base <ref> | --files <a,b> | --all] [--list] [--github] [-- <command...>]
//
// Without --base, the change is everything since origin/master: commits not
// pushed yet, and what isn't committed. With --base, as CI passes it, what
// changed from that commit to HEAD. --files names the changed files, to see
// what a change would run, and --all chooses everything. --list prints what
// it chose, and --github writes it to GITHUB_OUTPUT for CI's browser jobs:
// whether to run, the specs, the pages, and how many jobs a browser's tests
// split into. After --,
// the command that runs Playwright, such as mise's, which it runs with the
// chosen specs appended, and HARMO_PAGES set to the chosen pages for
// pages.spec.ts; with nothing chosen, it doesn't run it.
//
// A page is touched when a file it's built from changes, or a component it
// uses does: its markup in html/src/components has one of the classes that
// component's stylesheet defines. A component changes with its stylesheet,
// its React files (as packages/cli/components.ts lists them, and what
// they import), its example script, and a pattern with its folder and the
// patterns that import it. A spec runs when a page it opens is touched, or
// it changed itself. What every page shares, such as the tokens, the
// playground, or the tests' helpers, runs everything. Docs, the CLI, and the
// unit tests run no browser test, but a pattern's docs, which its page shows.

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";
import { components } from "../packages/cli/components.ts";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const list = (folder: string) => (existsSync(join(root, folder)) ? readdirSync(join(root, folder)) : []);
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

// Files that change what every page shows or how every test runs.
const everything = [
  /^packages\/css\/src\/(tokens|accents|index|_shortcuts)\.scss$/,
  /^packages\/react\/src\/(index\.ts|HarmoProvider\.tsx)$/,
  /^examples\/(playground|catalog)\.ts$/,
  /^examples\/(html|react)\/build\.ts$/,
  /^examples\/react\/src\/(client\.tsx|examples\.ts|AccentPicker\.tsx|Ready\.tsx|app-icons\.tsx)$/,
  /^examples\/html\/src\/(layout\.html|playground\.(css|js))$/,
  /^tests\/(playgrounds|axe)\.ts$/,
  /^tests\/(playwright\.config\.ts|package\.json|tsconfig\.json)$/,
  /^(package\.json|bun\.lock|mise\.toml)$/,
  /^\.github\/workflows\//,
];

// Files no browser test reads.
const nothing = [
  /^docs\/(?!patterns\/)/,
  /^[^/]+\.(md|txt)$/,
  /^packages\/cli\//,
  /^packages\/(css|react)\/(README\.md|package\.json|tsconfig\.json)$/,
  /^examples\/react\/test\//,
  /^tests\/affected\.ts$/,
  /^\.gitignore$/,
  /^LICENSE$/,
];

// The change's files.
const changedFiles = (base: string | undefined) => {
  if (base !== undefined) {
    if (/^0+$/.test(base)) return undefined;
    try {
      return git("diff", "--name-only", base, "HEAD").split("\n").filter(Boolean);
    } catch {
      return undefined;
    }
  }
  let since = "HEAD";
  try {
    since = git("merge-base", "HEAD", "origin/master");
  } catch {}
  return [
    ...git("diff", "--name-only", since).split("\n"),
    ...git("ls-files", "--others", "--exclude-standard").split("\n"),
  ].filter(Boolean);
};

// The playground's pages, and the classes each one's markup uses.
const pageSlugs = list("examples/html/src/components")
  .filter((file) => file.endsWith(".html"))
  .map((file) => basename(file, ".html"));
const classesOf = new Map(
  pageSlugs.map((slug) => {
    const markup = read(`examples/html/src/components/${slug}.html`);
    const classes = new Set([...markup.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1]!.split(/\s+/)));
    return [slug, classes] as const;
  }),
);
const iconsOf = new Map(
  pageSlugs.map((slug) => [
    slug,
    new Set([...read(`examples/html/src/components/${slug}.html`).matchAll(/<play-icon name="([^"]+)"/g)].map((match) => match[1]!)),
  ]),
);

// The pages whose markup uses a component's classes: those named after it,
// such as hselect and hselect-fallback for Select. Its stylesheet styles
// others' parts too, such as the expand chevron in its trigger, but a page
// with only those doesn't have a Select.
const pagesUsing = (prefix: string) =>
  pageSlugs.filter((slug) =>
    [...classesOf.get(slug)!].some((name) => name === prefix || name.startsWith(`${prefix}-`)),
  );

// What a stylesheet's partials are used by, for a change to a partial.
const scssUsers = (partial: string): string[] => {
  const name = partial.replace(/^_/, "").replace(/\.scss$/, "");
  return list("packages/css/src")
    .filter((file) => file.endsWith(".scss") && new RegExp(`@use "${name}"`).test(read(`packages/css/src/${file}`)))
    .flatMap((file) => (file.startsWith("_") ? scssUsers(file) : [file]));
};

// The React files of each component, from the CLI's list of them.
const componentFiles = new Map<string, string>();
for (const [name, files] of Object.entries(components)) {
  for (const file of files) componentFiles.set(file, name);
}

// The React files that import a file, and those that import them, and so on.
const reactSource = "packages/react/src";
const reactFiles = (folder = ""): string[] =>
  list(join(reactSource, folder)).flatMap((entry) =>
    statSync(join(root, reactSource, folder, entry)).isDirectory()
      ? reactFiles(join(folder, entry))
      : /\.tsx?$/.test(entry)
        ? [join(folder, entry)]
        : [],
  );
const importsOf = (folder: string, file: string) =>
  [...read(join(folder, file)).matchAll(/from\s*"(\.\.?\/[^"]+)"/g)].map((match) =>
    normalize(join(dirname(file), match[1]!)),
  );
const reactImporters = (file: string, seen = new Set<string>()): string[] => {
  for (const other of reactFiles()) {
    if (seen.has(other) || !importsOf(reactSource, other).includes(file)) continue;
    seen.add(other);
    reactImporters(other, seen);
  }
  return [...seen];
};

// The pattern folders that import from a folder, and those that import them.
const patternSource = "examples/react/src/patterns";
const patternImporters = (folder: string, seen = new Set<string>()): string[] => {
  for (const other of list(patternSource)) {
    if (seen.has(other) || other === folder) continue;
    const uses = list(join(patternSource, other)).some((file) =>
      importsOf(join(patternSource, other), file).some((target) => target.split("/")[0] === ".." && target.split("/")[1] === folder),
    );
    if (!uses) continue;
    seen.add(other);
    patternImporters(other, seen);
  }
  return [...seen];
};

// The names a component's React files export, such as OtpInput.
const exportsOf = (name: string) =>
  new Set(
    [...componentFiles]
      .filter(([, owner]) => owner === name)
      .flatMap(([file]) =>
        existsSync(join(root, reactSource, file))
          ? [...read(join(reactSource, file)).matchAll(/export (?:const|function) (\w+)/g)].map((match) => match[1]!)
          : [],
      ),
  );

// What a file imports from @harmo-ui/react.
const harmoImports = (path: string) =>
  [...read(path).matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*"@harmo-ui\/react"/g)].flatMap((match) =>
    match[1]!.split(",").map((item) => item.trim().replace(/^type\s+/, "")),
  );

// The pages a component touches: its own; those whose markup uses its
// classes; those whose script makes markup with them, such as the Sign-in
// Form's code step with OTP Input's; and those whose React example, or a
// pattern it shows, imports it.
const componentPages = (name: string) => {
  const pages = new Set(pagesUsing(`h${name}`));
  if (pageSlugs.includes(name)) pages.add(name);
  const named = new RegExp(`\\bh${name}(?![a-z0-9])`);
  for (const slug of pageSlugs) {
    const script = `examples/html/src/scripts/${slug}.js`;
    if (existsSync(join(root, script)) && named.test(read(script))) pages.add(slug);
  }
  const exported = exportsOf(name);
  if (exported.size > 0) {
    for (const slug of pageSlugs) {
      const example = `examples/react/src/components/${slug}.tsx`;
      if (existsSync(join(root, example)) && harmoImports(example).some((item) => exported.has(item))) pages.add(slug);
    }
    for (const folder of list(patternSource)) {
      const uses = list(join(patternSource, folder)).some(
        (file) => /\.tsx?$/.test(file) && harmoImports(join(patternSource, folder, file)).some((item) => exported.has(item)),
      );
      if (uses) for (const page of patternPages(folder)) pages.add(page);
    }
  }
  return pages;
};

// A pattern's, and those of the patterns that import it, such as Account
// Forms for the Sign-in Form, or every form for form-action/; with the pages
// that use a helper's look by its classes, such as hauth-form.
const patternPages = (folder: string) =>
  new Set([folder, ...patternImporters(folder)].flatMap((each) => [...componentPages(each)]));

// The pages one file touches, or "all".
const pagesOf = (file: string): Set<string> | "all" => {
  const none = new Set<string>();
  if (everything.some((pattern) => pattern.test(file))) return "all";
  if (nothing.some((pattern) => pattern.test(file))) return none;
  let match: RegExpMatchArray | null;
  if ((match = file.match(/^packages\/css\/src\/(_?[a-z0-9-]+)\.scss$/))) {
    const [, name] = match;
    if (name!.startsWith("_")) {
      const users = scssUsers(`${name}.scss`);
      return users.length ? new Set(users.flatMap((user) => [...componentPages(basename(user, ".scss"))])) : "all";
    }
    return componentPages(name!);
  }
  if ((match = file.match(/^packages\/react\/src\/(.+)$/))) {
    const files = [match[1]!, ...reactImporters(match[1]!)];
    const names = new Set(files.map((each) => componentFiles.get(each)).filter((name) => name !== undefined));
    if (names.size === 0) return "all";
    return new Set([...names].flatMap((name) => [...componentPages(name)]));
  }
  if ((match = file.match(/^examples\/html\/src\/components\/([a-z0-9-]+)\.html$/))) return new Set([match[1]!]);
  if ((match = file.match(/^examples\/react\/src\/components\/([a-z0-9-]+)\.tsx$/))) return new Set([match[1]!]);
  if ((match = file.match(/^examples\/html\/src\/scripts\/([a-z0-9-]+)\.js$/))) return componentPages(match[1]!);
  if ((match = file.match(/^examples\/react\/src\/patterns\/([a-z0-9-]+)\//))) return patternPages(match[1]!);
  if ((match = file.match(/^examples\/html\/src\/icons\/([a-z0-9-]+)\.svg$/))) {
    const icon = match[1]!;
    return new Set(pageSlugs.filter((slug) => iconsOf.get(slug)!.has(icon)));
  }
  if (/^examples\/(html|react)\/src\/overview\.html$/.test(file)) return new Set(["index"]);
  if (file === "examples/html/src/patterns.html" || file === "docs/patterns/README.md") return new Set(["patterns"]);
  if ((match = file.match(/^docs\/patterns\/([a-z0-9-]+)\.md$/))) return new Set([match[1]!]);
  if (/^tests\/[a-z0-9-]+\.spec\.ts$/.test(file)) return none;
  // Anything else the playgrounds or the tests are built from, to be safe.
  if (/^(examples|packages\/(css|react)|tests)\//.test(file)) return "all";
  return none;
};

// The pages each spec opens.
const specs = list("tests").filter((file) => file.endsWith(".spec.ts"));
const pagesOpened = new Map(
  specs.map((spec) => {
    const source = read(`tests/${spec}`);
    const opened = [
      ...source.matchAll(/(?:onEachPlayground\(|url\(\w+, |open\(\w+, \w+, )"([a-z0-9-]+)"/g),
    ].map((match) => match[1]!);
    return [spec, new Set(opened)] as const;
  }),
);

const choose = (files: string[] | undefined) => {
  if (files === undefined) return "all" as const;
  const pages = new Set<string>();
  const chosen = new Set<string>();
  for (const file of files) {
    const touched = pagesOf(file);
    if (touched === "all") return "all" as const;
    for (const page of touched) pages.add(page);
    if (/^tests\/[a-z0-9-]+\.spec\.ts$/.test(file) && existsSync(join(root, file))) chosen.add(basename(file));
  }
  for (const [spec, opened] of pagesOpened) {
    if ([...opened].some((page) => pages.has(page))) chosen.add(spec);
  }
  // Every page's, when the spec itself changed.
  const allPages = chosen.has("pages.spec.ts");
  if (pages.size > 0) chosen.add("pages.spec.ts");
  return { specs: [...chosen].sort(), pages: [...pages].sort(), allPages };
};

const args = process.argv.slice(2);
const at = args.indexOf("--");
const options = at === -1 ? args : args.slice(0, at);
const command = at === -1 ? [] : args.slice(at + 1);
const base = options.includes("--base") ? options[options.indexOf("--base") + 1] : undefined;
const given = options.includes("--files") ? options[options.indexOf("--files") + 1]!.split(",") : undefined;
const chosen = options.includes("--all") ? ("all" as const) : choose(given ?? changedFiles(base));

if (options.includes("--github")) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error("--github writes to GITHUB_OUTPUT, which only CI sets");
  const some = chosen === "all" ? undefined : chosen;
  // A quarter each for everything, as one job's third of WebKit's ran past
  // 15 minutes; fewer for fewer.
  const total = some === undefined || some.specs.length > 24 ? 4 : some.specs.length > 8 ? 2 : 1;
  appendFileSync(
    output,
    [
      `run=${some === undefined || some.specs.length > 0}`,
      `specs=${some?.specs.join(" ") ?? ""}`,
      `pages=${some === undefined || some.allPages ? "" : some.pages.join(",")}`,
      `shards=${JSON.stringify(Array.from({ length: total }, (_, index) => index + 1))}`,
      `total=${JSON.stringify([total])}`,
      "",
    ].join("\n"),
  );
}

if (options.includes("--list") || command.length === 0) {
  if (chosen === "all") console.log("Everything: the change touches what every page shares.");
  else if (chosen.specs.length === 0) console.log("Nothing: the change touches no page or spec.");
  else console.log(`Specs: ${chosen.specs.join(" ")}\nPages: ${chosen.allPages ? "all" : chosen.pages.join(" ") || "none"}`);
}

if (command.length > 0) {
  if (chosen !== "all" && chosen.specs.length === 0) {
    console.log("No browser test covers what changed.");
    process.exit(0);
  }
  const specArgs = chosen === "all" ? [] : chosen.specs;
  const env = { ...process.env };
  if (chosen !== "all" && !chosen.allPages) env.HARMO_PAGES = chosen.pages.join(",");
  const result = spawnSync("sh", ["-c", `${command.join(" ")} ${specArgs.join(" ")}`], { env, stdio: "inherit" });
  process.exit(result.status ?? 1);
}
