// Builds registry/: one JSON file for each component, holding everything needed
// to copy it into a project, in the format of shadcn's registry items. Reads the
// React source and the built CSS; run through mise run build:cli, which builds
// the CSS first.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, normalize, relative } from "node:path/posix";

const root = import.meta.dirname;
const reactSource = join(root, "..", "react", "src");
const cssSource = join(root, "..", "css", "dist");
const registry = join(root, "registry");

// Each component is a folder of its own in the copy, named as harmo-ui add names it,
// with a stylesheet of the same name beside its code.
const components: Record<string, string[]> = {
  accordion: ["Accordion.tsx"],
  avatar: ["Avatar.tsx"],
  banner: ["Banner.tsx"],
  breadcrumb: ["Breadcrumb.tsx"],
  button: ["Button.tsx"],
  calendar: ["calendar/Calendar.tsx", "calendar/dates.ts"],
  card: ["Card.tsx"],
  checkbox: ["Checkbox.tsx", "CheckboxGroup.tsx"],
  chevron: ["Chevron.tsx"],
  "chevron-to-arrow": ["ChevronToArrow.tsx"],
  combobox: ["Combobox.tsx"],
  "command-menu": ["CommandMenu.tsx"],
  copy: ["CopyButton.tsx"],
  "date-filter": ["date-filter/DateFilter.tsx", "date-filter/range.ts"],
  "date-picker": ["date-picker/DatePicker.tsx", "date-picker/typedDate.ts"],
  dialog: ["Dialog.tsx"],
  drawer: ["Drawer.tsx"],
  "empty-state": ["EmptyState.tsx"],
  "expand-chevron": ["ExpandChevron.tsx"],
  field: ["field/Field.tsx", "field/ErrorMessage.tsx"],
  "filter-bar": ["FilterBar.tsx"],
  "filter-chip": ["FilterChip.tsx"],
  filters: ["Filters.tsx"],
  input: ["Input.tsx"],
  kbd: ["Kbd.tsx"],
  link: ["Link.tsx"],
  listbox: [
    "listbox/Listbox.tsx",
    "listbox/Option.tsx",
    "listbox/OptionGroup.tsx",
  ],
  "menu-button": ["MenuButton.tsx"],
  meter: ["Meter.tsx"],
  "navigation-menu": ["NavigationMenu.tsx"],
  pagination: ["pagination/Pagination.tsx", "pagination/PaginationPage.tsx"],
  password: ["PasswordInput.tsx"],
  popup: ["Popup.tsx"],
  provider: ["HarmoProvider.tsx"],
  radio: ["Radio.tsx", "RadioGroup.tsx"],
  search: ["Search.tsx"],
  section: ["Section.tsx"],
  segmented: ["Segmented.tsx"],
  select: ["Select.tsx"],
  "selection-bar": ["SelectionBar.tsx"],
  settings: ["Settings.tsx"],
  sidebar: ["Sidebar.tsx"],
  spinner: ["Spinner.tsx"],
  stat: ["Stat.tsx"],
  status: ["Status.tsx"],
  switch: ["Switch.tsx"],
  table: ["table/DataTable.tsx", "table/useColumnVisibility.ts", "table/useRowSelection.ts"],
  tabs: ["tabs/Tabs.tsx", "tabs/TabNav.tsx", "tabs/useTabsMotion.ts"],
  tag: ["Tag.tsx"],
  "tag-list": ["TagList.tsx"],
  textarea: ["TextArea.tsx"],
  "time-picker": ["time-picker/TimePicker.tsx", "time-picker/clock.ts"],
  toast: ["Toast.tsx"],
  toolbar: ["Toolbar.tsx"],
  tooltip: ["Tooltip.tsx"],
};

// Shared by components, and copied only to those that use them.
const helpers = [
  "children.ts",
  "icons.ts",
  "modal.tsx",
  "useCurrentValue.ts",
  "useHold.ts",
  "usePinned.ts",
  "useMergedRef.ts",
  "useWidthChange.ts",
  "withClass.ts",
];

// Stylesheets a component needs without importing that component's code.
const alsoStyledBy: Record<string, string[]> = {
  breadcrumb: ["chevron"],
  combobox: ["input"],
  "command-menu": ["dialog"],
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
    /^- \[[^\]]+\]\(docs\/components\/([a-z-]+)\.md\): (.+)$/.exec(
      line,
    );
  if (page?.[1] && page[2] && page[1] in components)
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

// A component's files: its own folder, every component it imports, whole, the
// helpers those use, the tokens, and the accents, as index.css has them.
const itemFiles = (name: string) => {
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

  addComponent(name);
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
    files: itemFiles(name).map(([path, content]) => ({
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
  homepage: "https://github.com/windrunner21/harmo",
  items: Object.keys(components).map((name) => ({
    name,
    type: "registry:item",
    description: descriptions.get(name),
  })),
});
