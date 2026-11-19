// Builds registry/: one JSON file for each component, holding everything needed
// to copy it into a project, in the format of shadcn's registry items. Reads the
// React source and the built CSS; run through mise run build:cli, which builds
// the CSS first.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, normalize, relative } from "node:path/posix";
import { components } from "./components.js";
import { sharedClasses } from "./shared-styles.js";

const root = import.meta.dirname;
const reactSource = join(root, "..", "react", "src");
// Patterns are written in the React playground, against @harmo-ui/react, each in
// a folder of its own that holds a component, a .tsx file. A folder without
// one is a helper some patterns share: a stylesheet, such as auth-form's look,
// comes with each pattern that uses its classes, and code, such as
// step-motion's hook, with each pattern that imports it.
const patternSource = join(root, "..", "..", "examples", "react", "src", "patterns");
const patternFolders = readdirSync(patternSource, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const patterns = patternFolders.filter((folder) =>
  readdirSync(join(patternSource, folder)).some((file) => file.endsWith(".tsx")),
);
// Each class a shared stylesheet styles, under its helper's prefix, and that
// stylesheet's path in the copy. Shorter names first, so where one helper's
// prefix starts another's, the longest that matches wins, as for components.
const sharedStyles = new Map<string, string>();
for (const folder of patternFolders
  .filter((folder) => !patterns.includes(folder))
  .sort((a, b) => a.length - b.length)) {
  for (const file of readdirSync(join(patternSource, folder)).filter((file) => file.endsWith(".css"))) {
    const css = readFileSync(join(patternSource, folder, file), "utf8");
    for (const name of sharedClasses(folder, css)) sharedStyles.set(name, `patterns/${folder}/${file}`);
  }
}
const cssSource = join(root, "..", "css", "dist");
const registry = join(root, "registry");

// Shared by components, and copied only to those that use them. But
// customProperties.ts, which types Harmo's custom properties for React's style
// prop, comes with every component, as the tokens do.
const helpers = [
  "children.ts",
  "closeIcon.tsx",
  "customProperties.ts",
  "highlight.tsx",
  "icons.ts",
  "milliseconds.ts",
  "modal.tsx",
  "types.ts",
  "useAddedLater.ts",
  "useCurrentValue.ts",
  "useFileDrop.ts",
  "useHold.ts",
  "usePinned.ts",
  "useMergedRef.ts",
  "useWidthChange.ts",
  "withClass.ts",
];

// Stylesheets a component needs without importing that component's code.
const alsoStyledBy: Record<string, string[]> = {
  "account-menu": ["avatar"],
  breadcrumb: ["chevron", "link"],
  combobox: ["input"],
  "command-menu": ["dialog"],
  "file-input": ["avatar", "button"],
  "file-list": ["button"],
  message: ["link"],
  "tag-list": ["tag"],
};

// What harmo-ui list says about a component, from the index of the docs. These have
// no page of their own there.
const descriptions = new Map<string, string>([
  ["chevron", "a static chevron icon, for buttons and links"],
  [
    "provider",
    "sets your router's link component and your framework's image component",
  ],
]);
for (const line of readFileSync(
  join(root, "..", "..", "llms.txt"),
  "utf8",
).split("\n")) {
  const page =
    /^- \[[^\]]+\]\(docs\/(?:components|patterns)\/([a-z-]+)\.md\): (.+)$/.exec(
      line,
    );
  if (page?.[1] && page[2] && (page[1] in components || patterns.includes(page[1])))
    descriptions.set(page[1], page[2]);
}

// Where each source file goes in the copy, and which component it belongs to.
const targets = new Map<string, string>();
const owners = new Map<string, string>();
for (const [name, files] of Object.entries(components)) {
  for (const file of files) {
    targets.set(file, `${name}/${basename(file)}`);
    owners.set(file, name);
  }
}
for (const file of helpers) targets.set(file, `lib/${file}`);

const sources = readdirSync(reactSource, {
  recursive: true,
  encoding: "utf8",
}).filter((file) => /\.tsx?$/.test(file));
for (const source of sources) {
  if (source !== "index.ts" && !targets.has(source)) {
    throw new Error(
      `packages/cli/build-registry.ts doesn't say where packages/react/src/${source} goes`,
    );
  }
}

// A source file as it reads in the copy, and the source files it imports: each
// import points to where that file went, without the .ts or .tsx ending that a
// default TypeScript setup rejects.
const copyOf = (source: string) => {
  const imports: string[] = [];
  const target = targets.get(source) as string;
  const code = readFileSync(join(reactSource, source), "utf8").replace(
    /(from\s+")(\.[^"]+)(")/g,
    (_, before: string, specifier: string, after: string) => {
      const imported = normalize(join(dirname(source), specifier));
      const importedTarget = targets.get(imported);
      if (!importedTarget)
        throw new Error(
          `${source} imports ${specifier}, which isn't in the copy`,
        );
      imports.push(imported);
      const path = relative(dirname(target), importedTarget).replace(
        /\.tsx?$/,
        "",
      );
      return `${before}${path.startsWith(".") ? path : `./${path}`}${after}`;
    },
  );
  return { code, imports };
};

// The files of some components, and of other source files: each component's own
// folder, every component it imports, whole, the helpers those use, the tokens,
// and the accents, as index.css has them, with the tokens' types for React.
const itemFiles = (names: string[], sources: string[] = []) => {
  const files = new Map<string, string>([
    ["tokens.css", readFileSync(join(cssSource, "tokens.css"), "utf8")],
    ["accents.css", readFileSync(join(cssSource, "accents.css"), "utf8")],
  ]);
  const seen = new Set<string>();

  const addStyles = (component: string) => {
    if (component !== "provider") {
      files.set(
        `${component}/${component}.css`,
        readFileSync(join(cssSource, `${component}.css`), "utf8"),
      );
    }
  };
  const addSource = (source: string) => {
    if (seen.has(source)) return;
    seen.add(source);
    const { code, imports } = copyOf(source);
    files.set(targets.get(source) as string, code);
    for (const imported of imports) {
      const owner = owners.get(imported);
      if (owner) addComponent(owner);
      else addSource(imported);
    }
  };
  const addComponent = (component: string) => {
    addStyles(component);
    for (const other of alsoStyledBy[component] ?? []) addStyles(other);
    for (const source of components[component] as string[]) addSource(source);
  };

  addSource("customProperties.ts");
  for (const name of names) addComponent(name);
  for (const source of sources) addSource(source);
  return [...files].sort(([a], [b]) => a.localeCompare(b));
};

mkdirSync(registry, { recursive: true });
const write = (file: string, data: unknown) =>
  writeFileSync(join(registry, file), `${JSON.stringify(data, null, 2)}\n`);

for (const name of Object.keys(components)) {
  write(`${name}.json`, {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:item",
    description: descriptions.get(name),
    files: itemFiles([name]).map(([path, content]) => ({
      path,
      type: "registry:file",
      target: `components/harmo/${path}`,
      content,
    })),
  });
}
// Where @harmo-ui/react exports each name from.
const exported = new Map<string, string>();
for (const [, names = "", file = ""] of readFileSync(
  join(reactSource, "index.ts"),
  "utf8",
).matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*"\.\/([^"]+)"/g)) {
  for (const name of names.split(",")) {
    const bare = name.trim().replace(/^type\s+/, "");
    if (bare) exported.set(bare, file);
  }
}

// A pattern's source file as it reads in the copy, in patterns/<name>/, or a
// helper's, in patterns/<helper>/: each import from @harmo-ui/react points to
// the copied file of what it imports, and the source files it needs are
// listed, so they come with it. A relative import loses its ending: of
// another pattern, that pattern comes too, and of a helper's file, that file.
const patternCopyOf = (folder: string, file: string) => {
  const needed = new Set<string>();
  const others = new Set<string>();
  const helperFiles = new Set<string>();
  const code = readFileSync(join(patternSource, folder, file), "utf8")
    .replace(/(from\s*")(\.\.?\/[^"]+)(")/g, (_, before: string, specifier: string, after: string) => {
      const path = normalize(join(folder, specifier));
      const owner = path.split("/")[0] ?? "";
      if (patterns.includes(owner)) {
        if (owner !== folder) others.add(owner);
      } else if (!path.startsWith("..") && path.includes("/") && existsSync(join(patternSource, path))) {
        helperFiles.add(path);
      } else {
        throw new Error(`${folder}/${file} imports ${specifier}, which isn't a pattern's or a helper's`);
      }
      return `${before}${specifier.replace(/\.tsx?$/, "")}${after}`;
    })
    .replace(
    /import\s+(type\s+)?\{([^}]*)\}\s*from\s*"@harmo-ui\/react";\n/g,
    (_, typeOnly: string | undefined, names: string) => {
      const bySource = new Map<string, string[]>();
      for (const item of names.split(",").map((name) => name.trim()).filter(Boolean)) {
        const source = exported.get(item.replace(/^type\s+/, ""));
        if (!source)
          throw new Error(
            `${folder}/${file} imports ${item} from @harmo-ui/react, which doesn't export it`,
          );
        needed.add(source);
        bySource.set(source, [...(bySource.get(source) ?? []), item]);
      }
      return [...bySource]
        .map(([source, items]) => {
          const path = relative(
            `patterns/${folder}`,
            targets.get(source) as string,
          ).replace(/\.tsx?$/, "");
          return `import ${typeOnly ?? ""}{ ${items.join(", ")} } from "${path}";\n`;
        })
        .join("");
    },
  );
  if (/from\s*"@harmo-ui\//.test(code))
    throw new Error(
      `${folder}/${file} imports @harmo-ui in a way the copy can't point elsewhere; import names in braces`,
    );
  return { code, needed, others, helperFiles };
};

// The npm packages a pattern's code imports, other than React, which the app
// installs with it, such as dnd-kit for a board: a package's name, without a
// subpath, as three/addons/controls/OrbitControls.js is three's.
const packagesIn = (code: string) => {
  const found = new Set<string>();
  for (const [, specifier = ""] of code.matchAll(/(?:from\s*|import\s*\(\s*|import\s+)"([^".][^"]*)"/g)) {
    const parts = specifier.split("/");
    const name = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? "");
    if (name !== "react" && name !== "react-dom") found.add(name);
  }
  return found;
};

// The version of each that Harmo's tests compile the copies against: the
// CLI's own devDependencies, so what's installed is what was tested.
const tested: Record<string, string> = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).devDependencies ?? {};
const dependenciesOf = (files: [string, string][]) => {
  const names = new Set<string>();
  for (const [path, code] of files) if (/\.tsx?$/.test(path)) for (const name of packagesIn(code)) names.add(name);
  return [...names].sort().map((name) => {
    const version = tested[name];
    if (!version || !/^\d/.test(version))
      throw new Error(`A pattern imports ${name}: add it to packages/cli's devDependencies at an exact version, the one its copies are tested with`);
    return `${name}@${version}`;
  });
};

// The components whose classes some code puts on its own elements, such as
// hcard on a <form>, so their styles come with it: each class names the
// component it starts with, the longest that matches.
const styledBy = (code: string) => {
  const found = new Set<string>();
  for (const [, quoted = "", braced = ""] of code.matchAll(
    /className=(?:"([^"]*)"|\{([^}]*)\})/g,
  )) {
    const text = `${quoted} ${[...braced.matchAll(/"([^"]*)"/g)].map(([, value]) => value).join(" ")}`;
    for (const name of text.split(/\s+/).filter((name) => name.startsWith("h"))) {
      const owner = Object.keys(components)
        .filter((component) => name === `h${component}` || name.startsWith(`h${component}-`))
        .sort((a, b) => b.length - a.length)[0];
      if (owner) found.add(owner);
    }
  }
  return found;
};

// A pattern's files: its own, in patterns/<name>/, the helpers' files it
// imports, in patterns/<helper>/, those of every component they import, as a
// component's are, and the styles of every component whose class they use.
const patternFiles = (pattern: string): [string, string][] => {
  const own: [string, string][] = [];
  const needed = new Set<string>();
  const styled = new Set<string>();
  const others = new Set<string>();
  const shared = new Set<string>();
  const copied = new Set<string>();
  const addCode = (folder: string, file: string) => {
    const copy = patternCopyOf(folder, file);
    own.push([`patterns/${folder}/${file}`, copy.code]);
    for (const source of copy.needed) needed.add(source);
    for (const component of styledBy(copy.code)) styled.add(component);
    for (const other of copy.others) if (other !== pattern) others.add(other);
    for (const [, quoted = "", braced = ""] of copy.code.matchAll(/className=(?:"([^"]*)"|\{([^}]*)\})/g)) {
      for (const name of `${quoted} ${braced}`.match(/h[a-z][a-z0-9-]*/g) ?? []) {
        const path = sharedStyles.get(name);
        if (path) shared.add(path);
      }
    }
    for (const path of copy.helperFiles) {
      if (copied.has(path)) continue;
      copied.add(path);
      addCode(dirname(path), basename(path));
    }
  };
  for (const file of readdirSync(join(patternSource, pattern)).sort()) {
    if (/\.tsx?$/.test(file)) {
      addCode(pattern, file);
    } else if (file.endsWith(".css")) {
      own.push([
        `patterns/${pattern}/${file}`,
        readFileSync(join(patternSource, pattern, file), "utf8"),
      ]);
    }
  }
  const used = [...needed].flatMap((source) => owners.get(source) ?? []);
  const helpers = [...needed].filter((source) => !owners.has(source));
  const files = new Map(itemFiles([...new Set(used)], helpers));
  for (const component of styled) {
    if (component !== "provider" && !files.has(`${component}/${component}.css`))
      files.set(
        `${component}/${component}.css`,
        readFileSync(join(cssSource, `${component}.css`), "utf8"),
      );
  }
  for (const path of shared)
    files.set(path, readFileSync(join(patternSource, path.slice("patterns/".length)), "utf8"));
  for (const other of others)
    for (const [path, content] of patternFiles(other)) files.set(path, content);
  for (const [path, content] of own) files.set(path, content);
  return [...files].sort(([a], [b]) => a.localeCompare(b));
};

for (const pattern of patterns) {
  if (pattern in components)
    throw new Error(`The pattern ${pattern} has a component's name`);
  // A universal item, as a component's is, which shadcn's CLI can install too;
  // its category marks it as a pattern, and its dependencies are the npm
  // packages it needs, at the versions it's tested with.
  const files = patternFiles(pattern);
  const dependencies = dependenciesOf(files);
  write(`${pattern}.json`, {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: pattern,
    type: "registry:item",
    categories: ["pattern"],
    description: descriptions.get(pattern),
    ...(dependencies.length > 0 ? { dependencies } : {}),
    files: files.map(([path, content]) => ({
      path,
      type: "registry:file",
      target: `components/harmo/${path}`,
      content,
    })),
  });
}

write("registry.json", {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "harmo",
  homepage: "https://harmo-ui.com",
  items: [
    ...Object.keys(components).map((name) => ({
      name,
      type: "registry:item",
      description: descriptions.get(name),
    })),
    ...patterns.map((name) => ({
      name,
      type: "registry:item",
      categories: ["pattern"],
      description: descriptions.get(name),
    })),
  ],
});
