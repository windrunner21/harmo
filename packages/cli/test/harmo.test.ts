import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, normalize } from "node:path";
import { sharedClasses } from "../shared-styles.js";

// Runs the built CLI in Node, as npx would, in a throwaway project. Those projects
// sit inside this package, so their copies find its React and TypeScript.
const root = join(import.meta.dir, "..");
const cli = join(root, "dist", "harmo.js");
const output = join(root, "test-output");
const harmo = "components/harmo";

let project: string;

beforeEach(() => {
  mkdirSync(output, { recursive: true });
  project = mkdtempSync(join(output, "project-"));
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({ dependencies: { react: "19.3.0", "react-dom": "19.3.0" } }),
  );
});

let copies: string[] = [];

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  for (const copy of copies) rmSync(copy, { recursive: true, force: true });
  copies = [];
});

const runWith = (tool: string, ...args: string[]) => {
  const result = Bun.spawnSync(["node", tool, ...args], { cwd: project });
  return {
    code: result.exitCode,
    out: result.stdout.toString(),
    err: result.stderr.toString(),
  };
};
const run = (...args: string[]) => runWith(cli, ...args);

// A copy of the built CLI with a registry of its own, for what Harmo's doesn't
// hold, such as a pattern with two stylesheets.
interface Item {
  name: string;
  categories?: string[];
  files: { path: string; content: string }[];
}
const cliWith = (items: Item[]) => {
  const copy = mkdtempSync(join(output, "cli-"));
  copies.push(copy);
  cpSync(join(root, "dist"), join(copy, "dist"), { recursive: true });
  cpSync(join(root, "package.json"), join(copy, "package.json"));
  mkdirSync(join(copy, "registry"));
  writeFileSync(
    join(copy, "registry", "registry.json"),
    JSON.stringify({ items: items.map(({ name, categories }) => ({ name, categories })) }),
  );
  for (const item of items)
    writeFileSync(join(copy, "registry", `${item.name}.json`), JSON.stringify(item));
  return join(copy, "dist", "harmo.js");
};
const read = (path: string) => readFileSync(join(project, path), "utf8");
const write = (path: string, text: string) =>
  writeFileSync(join(project, path), text);
const copied = (folder = harmo) =>
  readdirSync(join(project, folder), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      normalize(join(entry.parentPath, entry.name)).slice(
        join(project, folder).length + 1,
      ),
    )
    .sort();
const importsIn = (styles: string) =>
  [...styles.matchAll(/^@import "\.\/(.+)";$/gm)].map((match) => match[1]);

const registry = (name: string) =>
  JSON.parse(readFileSync(join(root, "registry", `${name}.json`), "utf8"));
const names: string[] = registry("registry").items.map(
  (item: { name: string }) => item.name,
);

// Every class Harmo styles anywhere. .hicon has no rules of its own: the control
// around an icon styles it.
const cssFolder = join(root, "..", "css", "dist");
const classesIn = (css: string) =>
  [...css.matchAll(/\.(h[a-z][a-z0-9-]*)/g)].map((match) => match[1] as string);
const harmoClasses = new Set(
  readdirSync(cssFolder)
    .filter((file) => file.endsWith(".css"))
    .flatMap((file) => classesIn(readFileSync(join(cssFolder, file), "utf8"))),
);
harmoClasses.delete("hicon");

describe("add", () => {
  test("copies a component, its styles, and what it needs, each in its folder", () => {
    const { code, out } = run("add", "tabs");
    expect(code).toBe(0);
    expect(out).toContain(`Created 11 files in ${harmo}`);
    expect(out).toContain(`Import ${harmo}/harmo.css once`);
    expect(copied()).toEqual(
      [
        "harmo.css",
        "lib/children.ts",
        "lib/types.ts",
        "lib/withClass.ts",
        "provider/HarmoProvider.tsx",
        "tabs/TabNav.tsx",
        "tabs/Tabs.tsx",
        "tabs/tabs.css",
        "tabs/useTabsMotion.ts",
        "tokens.css",
        "accents.css",
      ].sort(),
    );
    expect(importsIn(read(`${harmo}/harmo.css`))).toEqual([
      "tokens.css",
      "accents.css",
      "tabs/tabs.css",
    ]);
  });

  test("copies the built CSS as it is, and keeps each file's use client or lack of one", () => {
    run("add", "password", "tag", "kbd");
    expect(read(`${harmo}/tag/tag.css`)).toBe(
      readFileSync(join(cssFolder, "tag.css"), "utf8"),
    );
    expect(read(`${harmo}/accents.css`)).toBe(
      readFileSync(join(cssFolder, "accents.css"), "utf8"),
    );
    expect(
      read(`${harmo}/password/PasswordInput.tsx`).startsWith('"use client"'),
    ).toBe(true);
    expect(read(`${harmo}/kbd/Kbd.tsx`).startsWith('"use client"')).toBe(false);
  });

  test("points each import to where the file went, without its ending", () => {
    run("add", "password");
    const code = read(`${harmo}/password/PasswordInput.tsx`);
    expect(code).toContain('from "../field/Field"');
    expect(code).toContain('from "../lib/icons"');
    expect(code).not.toMatch(/from "\.[^"]*\.tsx?"/);
  });

  test("breadcrumb brings link.css, for the links you put in it", () => {
    run("add", "breadcrumb");
    expect(copied()).toContain("link/link.css");
    expect(importsIn(read(`${harmo}/harmo.css`))).toContain("link/link.css");
  });

  for (const name of names) {
    test(`${name} brings every file it imports, and the styles of every class it uses`, () => {
      expect(run("add", name).code).toBe(0);
      const files = copied();
      const code = files.filter((file) => /\.tsx?$/.test(file));
      const styles = files
        .filter((file) => file.endsWith(".css"))
        .map((file) => read(`${harmo}/${file}`));
      const styled = new Set(styles.flatMap(classesIn));

      for (const file of code) {
        const text = read(`${harmo}/${file}`);
        for (const [, specifier] of text.matchAll(/from\s+"(\.[^"]+)"/g)) {
          const target = normalize(join(dirname(file), specifier as string));
          expect(files, `${file} imports ${specifier}`).toContainAnyValues([
            `${target}.ts`,
            `${target}.tsx`,
          ]);
        }
        for (const [, used] of text.matchAll(
          /["'`\s](h[a-z][a-z0-9-]*)(?=["'`\s])/g,
        )) {
          if (!harmoClasses.has(used as string)) continue;
          // A class with a stylesheet of its own, such as .hinput and
          // input.css, needs that stylesheet: another one that only places
          // it, as combobox.css places .hinput, isn't its look.
          const own = (used as string).slice(1);
          if (existsSync(join(cssFolder, `${own}.css`))) {
            expect(files, `${file} uses .${used}`).toContain(`${own}/${own}.css`);
          } else {
            expect(styled.has(used as string), `${file} uses .${used}`).toBe(
              true,
            );
          }
        }
      }
    });
  }

  test("a pattern goes in patterns/<name>, with what it uses, its imports pointing to the copies, and its styles after the components'", () => {
    expect(run("add", "sign-in-form").code).toBe(0);
    const files = copied();
    expect(files).toContain("patterns/sign-in-form/SignInForm.tsx");
    expect(files).toContain("patterns/auth-form/auth-form.css");
    // Its frame is a class on its <form>, not Card's code, and still comes.
    expect(files).toContain("card/card.css");
    const code = read(`${harmo}/patterns/sign-in-form/SignInForm.tsx`);
    expect(code).not.toContain("@harmo-ui/");
    expect(code).toContain('import { PasswordInput } from "../../password/PasswordInput";');
    // Its code step is Verify Code, another pattern, which comes whole, and
    // the helpers they share, with their imports pointing to the copies: the
    // account forms' own, and the one every form's action runs through,
    // which the account forms' imports too.
    expect(files).toContain("patterns/verify-code/VerifyCodeForm.tsx");
    expect(files).toContain("patterns/auth-form/authForm.ts");
    expect(files).toContain("patterns/form-action/formAction.ts");
    expect(code).toContain('from "../verify-code/VerifyCodeForm";');
    expect(code).toContain('from "../auth-form/authForm";');
    expect(code).toContain('from "../form-action/formAction";');
    expect(read(`${harmo}/patterns/auth-form/authForm.ts`)).toContain('from "../form-action/formAction";');

    run("add", "tag");
    const imports = importsIn(read(`${harmo}/harmo.css`));
    expect(imports.slice(-2)).toEqual(["patterns/auth-form/auth-form.css", "patterns/verify-code/verify-code.css"]);
    expect(imports).toContain("tag/tag.css");
  });

  test("a pattern's import from a helper's folder copies that file into patterns/<folder>/, and the helper isn't a pattern", () => {
    expect(run("add", "contact-form").code).toBe(0);
    const files = copied();
    expect(files).toContain("patterns/step-motion/useStepMotion.ts");
    expect(files).toContain("patterns/form-action/formAction.ts");
    expect(files).not.toContain("patterns/auth-form/authForm.ts");
    const hook = read(`${harmo}/patterns/contact-form/useContactForm.ts`);
    expect(hook).toContain('from "../step-motion/useStepMotion";');
    expect(hook).toContain('from "../form-action/formAction";');
    expect(read(`${harmo}/patterns/contact-form/ContactForm.tsx`)).toContain('from "../form-action/formAction";');
    expect(read(`${harmo}/patterns/step-motion/useStepMotion.ts`)).not.toContain("@harmo-ui/");
    expect(read(`${harmo}/patterns/form-action/formAction.ts`)).not.toContain("@harmo-ui/");
    expect(names).not.toContain("step-motion");
    expect(names).not.toContain("form-action");
    // The type-check below adds every pattern, so each one that uses it
    // type-checks with it as copied.
  });

  test("every pattern brings form-action, which its forms' actions run through, and only the account forms bring auth-form's code", () => {
    const paths = (name: string) => registry(name).files.map(({ path }: { path: string }) => path);
    for (const name of ["sign-in-form", "sign-up-form", "reset-password", "account-forms", "verify-code", "contact-form"]) {
      expect(paths(name), name).toContain("patterns/form-action/formAction.ts");
    }
    for (const name of ["sign-in-form", "sign-up-form", "reset-password", "account-forms", "verify-code"]) {
      expect(paths(name), name).toContain("patterns/auth-form/authForm.ts");
    }
    expect(paths("contact-form")).not.toContain("patterns/auth-form/authForm.ts");
  });

  test("a stylesheet in a pattern's folder, whatever its name, is imported once, however often it's added", () => {
    const file = (path: string) => ({ path, content: `/* ${path} */\n` });
    const tool = cliWith([
      {
        name: "plans",
        categories: ["pattern"],
        files: ["tokens.css", "accents.css", "patterns/plans/plans.css", "patterns/plans/plan-card.css"].map(file),
      },
    ]);
    expect(runWith(tool, "add", "plans").code).toBe(0);
    expect(runWith(tool, "add", "plans").out).toContain("Already up to date.");
    expect(importsIn(read(`${harmo}/harmo.css`))).toEqual([
      "tokens.css",
      "accents.css",
      "patterns/plans/plan-card.css",
      "patterns/plans/plans.css",
    ]);
  });

  test("a shared stylesheet comes only with the patterns that use a class under its own prefix", () => {
    const authForm = readFileSync(
      join(root, "..", "..", "examples", "react", "src", "patterns", "auth-form", "auth-form.css"),
      "utf8",
    );
    // It places .hbutton, Button's, and a comment names .hlink, Link's: a
    // pattern with a Button or a Link but none of its classes gets none of it.
    expect(authForm).toContain(".hbutton");
    expect(authForm).toContain(".hlink");
    const claimed = sharedClasses("auth-form", authForm);
    expect(claimed).toContain("hauth-form");
    expect(claimed).toContain("hauth-form-title");
    expect(claimed).not.toContain("hbutton");
    expect(claimed).not.toContain("hlink");
    expect(sharedClasses("auth-form", ".hbutton, .hauth-formal { color: red; }")).toEqual([]);

    const paths = (name: string) => registry(name).files.map(({ path }: { path: string }) => path);
    for (const name of ["sign-in-form", "sign-up-form", "reset-password", "account-forms", "verify-code"])
      expect(paths(name), name).toContain("patterns/auth-form/auth-form.css");
    expect(paths("contact-form")).not.toContain("patterns/auth-form/auth-form.css");

    // And each shared stylesheet a pattern brings styles a class its code uses.
    const patterns = new Set(
      registry("registry").items
        .filter((item: { categories?: string[] }) => item.categories?.includes("pattern"))
        .map((item: { name: string }) => item.name),
    );
    for (const name of patterns) {
      const { files } = registry(name as string) as Item;
      const code = files.filter(({ path }) => /\.tsx?$/.test(path)).map(({ content }) => content).join("\n");
      for (const { path, content } of files) {
        const [, helper = ""] = /^patterns\/([^/]+)\/[^/]+\.css$/.exec(path) ?? [];
        if (!helper || patterns.has(helper)) continue;
        expect(
          sharedClasses(helper, content).some((own) => new RegExp(`["'\`\\s]${own}["'\`\\s]`).test(code)),
          `${name} brings ${path}`,
        ).toBe(true);
      }
    }
  });

  test("in harmo.css, the stylesheets patterns share come after the components' and before each pattern's own", () => {
    run("add", "sign-up-form");
    run("add", "account-forms");
    const imports = importsIn(read(`${harmo}/harmo.css`));
    const patterns = [
      "patterns/auth-form/auth-form.css",
      "patterns/account-forms/account-forms.css",
      "patterns/sign-up-form/sign-up-form.css",
      "patterns/verify-code/verify-code.css",
    ];
    expect(imports.filter((path) => path?.startsWith("patterns/"))).toEqual(patterns);
    expect(imports.slice(-patterns.length)).toEqual(patterns);
  });

  test("--all copies every component, and no pattern", () => {
    expect(run("add", "--all").code).toBe(0);
    expect(existsSync(join(project, harmo, "patterns"))).toBe(false);
  });

  test("list shows the patterns after the components, under their own heading", () => {
    const { out } = run("list");
    const heading = out.indexOf("Patterns");
    expect(heading).toBeGreaterThan(out.indexOf("tooltip"));
    expect(out.indexOf("sign-in-form")).toBeGreaterThan(heading);
  });

  test("everything copied type-checks under a default Next.js setup", () => {
    expect(run("add", "--all").code).toBe(0);
    const patterns = registry("registry").items
      .filter((item: { categories?: string[] }) => item.categories?.includes("pattern"))
      .map((item: { name: string }) => item.name);
    expect(patterns.length).toBeGreaterThan(1);
    expect(run("add", ...patterns).code).toBe(0);
    write(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "react-jsx",
        },
        include: ["**/*.ts", "**/*.tsx"],
      }),
    );
    const tsc = Bun.spawnSync(
      [join(root, "node_modules", ".bin", "tsc"), "-p", "tsconfig.json"],
      { cwd: project },
    );
    expect(tsc.stdout.toString()).toBe("");
    expect(tsc.exitCode).toBe(0);
  }, 60_000);

  test("uses src/components/harmo in a project with a src folder, or the folder it's given", () => {
    mkdirSync(join(project, "src"));
    run("add", "tag");
    expect(existsSync(join(project, "src/components/harmo/tag/Tag.tsx"))).toBe(
      true,
    );

    run("add", "tag", "--path", "app/ui");
    expect(existsSync(join(project, "app/ui/tag/Tag.tsx"))).toBe(true);
  });

  test("adding again changes nothing", () => {
    run("add", "tabs");
    const before = copied().map((file) => read(`${harmo}/${file}`));
    const { out } = run("add", "tabs");
    expect(out).toContain("Already up to date.");
    expect(out).not.toContain("Import");
    expect(copied().map((file) => read(`${harmo}/${file}`))).toEqual(before);
  });

  test("keeps a file you changed, until told to replace it", () => {
    run("add", "tag");
    write(`${harmo}/tag/tag.css`, ".htag { color: red; }\n");

    const kept = run("add", "tag");
    expect(kept.code).toBe(0);
    expect(kept.out).toContain(
      "Kept 1 file that differs from Harmo's: tag/tag.css",
    );
    expect(read(`${harmo}/tag/tag.css`)).toBe(".htag { color: red; }\n");

    const replaced = run("add", "tag", "--overwrite");
    expect(replaced.out).toContain("Replaced 1 file: tag/tag.css");
    expect(read(`${harmo}/tag/tag.css`)).toBe(
      readFileSync(join(cssFolder, "tag.css"), "utf8"),
    );
  });

  test("adds to harmo.css in the bundle's order, and leaves anything else in it", () => {
    run("add", "tag");
    write(
      `${harmo}/harmo.css`,
      `${read(`${harmo}/harmo.css`)}\n.mine { color: red; }\n`,
    );
    run("add", "settings", "avatar", "chevron-to-arrow", "chevron");

    const styles = read(`${harmo}/harmo.css`);
    expect(importsIn(styles)).toEqual([
      "tokens.css",
      "accents.css",
      "avatar/avatar.css",
      "chevron/chevron.css",
      "chevron-to-arrow/chevron-to-arrow.css",
      "field/field.css",
      "settings/settings.css",
      "tag/tag.css",
    ]);
    expect(styles).toContain(".mine { color: red; }");
    expect(styles.lastIndexOf("@import")).toBeLessThan(styles.indexOf(".mine"));
  });

  for (const [written, change] of [
    [
      "single quotes, as Prettier can write them",
      (line: string) => line.replace(/"/g, "'"),
    ],
    ["url()", (line: string) => line.replace(/"(.+)"/, 'url("$1")')],
    ["a layer", (line: string) => line.replace(";", " layer(harmo);")],
    ["an indent", (line: string) => `  ${line}`],
    ["no ./", (line: string) => line.replace("./", "")],
    [
      "its condition on another line",
      (line: string) => line.replace(";", "\n  screen and (width > 40rem);"),
    ],
  ] as const) {
    test(`reads an import in harmo.css written with ${written}`, () => {
      run("add", "tag");
      const lines = read(`${harmo}/harmo.css`).split("\n");
      const edited = `${lines.map((line) => (line.startsWith("@import") ? change(line) : line)).join("\n")}.mine { color: red; }\n`;
      write(`${harmo}/harmo.css`, edited);

      expect(run("add", "tag").out).toContain("Already up to date.");
      expect(read(`${harmo}/harmo.css`)).toBe(edited);

      run("add", "avatar", "tooltip");
      const styles = read(`${harmo}/harmo.css`);
      expect(styles.match(/tokens\.css/g)).toHaveLength(1);
      expect(styles).toContain(change('@import "./tag/tag.css";').trim());
      for (const path of ["avatar/avatar.css", "tooltip/tooltip.css"]) {
        expect(styles).toContain(`@import "./${path}";`);
        expect(styles.indexOf(path)).toBeLessThan(styles.indexOf(".mine"));
      }
    });
  }

  test("doesn't count an import in a comment, or put one inside it", () => {
    run("add", "tag");
    const off = `/* Off for now\n@import "./tag/tag.css";\n*/\n`;
    write(`${harmo}/harmo.css`, `@import "./tokens.css";\n${off}`);
    run("add", "avatar");
    expect(read(`${harmo}/harmo.css`)).toBe(
      `@import "./tokens.css";\n@import "./accents.css";\n@import "./avatar/avatar.css";\n${off}`,
    );
  });

  test("keeps other imports where they are, so overrides still come last", () => {
    run("add", "tag");
    write(
      `${harmo}/harmo.css`,
      [
        '@import "./reset.css";',
        '@import "./tokens.css";',
        '@import "./tag/tag.css";',
        '@import "./overrides.css";',
        "",
      ].join("\n"),
    );
    run("add", "tooltip", "avatar");
    expect(importsIn(read(`${harmo}/harmo.css`))).toEqual([
      "reset.css",
      "tokens.css",
      "accents.css",
      "avatar/avatar.css",
      "tag/tag.css",
      "tooltip/tooltip.css",
      "overrides.css",
    ]);
  });

  test("keeps harmo.css's line endings, and its imports before its rules", () => {
    run("add", "tag");
    const before = read(`${harmo}/harmo.css`);
    const header = before.split("\n")[0];
    write(`${harmo}/harmo.css`, `${before}.mine { color: red; }\n`.replaceAll("\n", "\r\n"));
    run("add", "avatar");

    expect(read(`${harmo}/harmo.css`).split("\r\n")).toEqual([
      header as string,
      '@import "./tokens.css";',
      '@import "./accents.css";',
      '@import "./avatar/avatar.css";',
      '@import "./tag/tag.css";',
      ".mine { color: red; }",
      "",
    ]);
  });

  test("leaves harmo.css as it is when it already lists everything", () => {
    run("add", "tag");
    const spaced = `${read(`${harmo}/harmo.css`)}\n\n`;
    write(`${harmo}/harmo.css`, spaced);
    expect(run("add", "tag").out).toContain("Already up to date.");
    expect(read(`${harmo}/harmo.css`)).toBe(spaced);
  });

  test("puts imports before the rules of a harmo.css that has only rules", () => {
    mkdirSync(join(project, harmo), { recursive: true });
    write(`${harmo}/harmo.css`, ".mine { color: red; }\n");
    run("add", "tag");
    expect(read(`${harmo}/harmo.css`).startsWith('@import "./tokens.css";\n@import "./accents.css";\n@import "./tag/tag.css";\n.mine')).toBe(true);
  });

  test("doesn't take other line endings for a file you changed", () => {
    run("add", "tag");
    const before = read(`${harmo}/tag/tag.css`);
    write(`${harmo}/tag/tag.css`, before.replaceAll("\n", "\r\n"));
    expect(run("add", "tag").out).toContain("Already up to date.");
    expect(read(`${harmo}/tag/tag.css`)).toBe(before.replaceAll("\n", "\r\n"));
  });

  test("uses an absolute --path as it is", () => {
    const outside = mkdtempSync(join(output, "outside-"));
    const { out } = run("add", "tag", "--path", outside);
    expect(out).toContain(`Created 7 files in ${outside}`);
    expect(existsSync(join(outside, "tag/Tag.tsx"))).toBe(true);
    expect(copied(".").filter((file) => file !== "package.json")).toEqual([]);
    rmSync(outside, { recursive: true, force: true });
  });

  test("--dry-run says what would change, and changes nothing", () => {
    const { out } = run("add", "tag", "--dry-run");
    expect(out).toContain(`Would create 7 files in ${harmo}`);
    expect(existsSync(join(project, harmo))).toBe(false);
  });

  test("says so when only harmo.css has to change", () => {
    run("add", "tag");
    const without = read(`${harmo}/harmo.css`).replace('@import "./tag/tag.css";\n', "");
    write(`${harmo}/harmo.css`, without);

    expect(run("add", "tag", "--dry-run").out.trim()).toBe(`Would update ${harmo}/harmo.css`);
    expect(read(`${harmo}/harmo.css`)).toBe(without);

    expect(run("add", "tag").out.trim()).toBe(`Updated ${harmo}/harmo.css`);
    expect(importsIn(read(`${harmo}/harmo.css`))).toEqual(["tokens.css", "accents.css", "tag/tag.css"]);
  });

  test("refuses an unknown component, or no component, and writes nothing", () => {
    const unknown = run("add", "tag", "nope");
    expect(unknown.code).toBe(1);
    expect(unknown.err).toContain("There's no component or pattern called nope.");
    expect(run("add").code).toBe(1);
    expect(existsSync(join(project, harmo))).toBe(false);
  });

  test("refuses a registry file that would land outside the folder, through ../, an absolute path, or a link, and writes nothing", () => {
    const outside = mkdtempSync(join(output, "outside-"));
    copies.push(outside);
    const tool = cliWith([
      { name: "climb", files: [{ path: "tag/Tag.tsx", content: "" }, { path: "../../escaped.ts", content: "// escaped\n" }] },
      { name: "absolute", files: [{ path: join(outside, "absolute.ts"), content: "// escaped\n" }] },
      { name: "linked", files: [{ path: "lib/linked.ts", content: "// escaped\n" }] },
      { name: "file-link", files: [{ path: "tag/tag.css", content: "/* escaped */\n" }] },
    ]);

    for (const name of ["climb", "absolute"]) {
      const { code, err } = runWith(tool, "add", name);
      expect(code, name).toBe(1);
      expect(err).toContain(`would be written outside ${harmo}`);
    }
    expect(existsSync(join(project, "escaped.ts"))).toBe(false);
    expect(existsSync(join(project, harmo))).toBe(false);
    expect(readdirSync(outside)).toEqual([]);

    // A folder on the way that's a link out of it, and a file that's one, even
    // to a file that isn't there yet.
    mkdirSync(join(project, harmo, "tag"), { recursive: true });
    symlinkSync(outside, join(project, harmo, "lib"));
    symlinkSync(join(outside, "tag.css"), join(project, harmo, "tag", "tag.css"));
    for (const name of ["linked", "file-link"]) {
      const { code, err } = runWith(tool, "add", name, "--overwrite");
      expect(code, name).toBe(1);
      expect(err).toContain("or through a link that leads out of it");
    }
    expect(readdirSync(outside)).toEqual([]);
    expect(existsSync(join(project, harmo, "harmo.css"))).toBe(false);
  });

  test("follows a folder it's given that's a link, as the project chose it", () => {
    const elsewhere = mkdtempSync(join(output, "elsewhere-"));
    copies.push(elsewhere);
    mkdirSync(join(project, "components"));
    symlinkSync(elsewhere, join(project, harmo));
    expect(run("add", "tag").code).toBe(0);
    expect(existsSync(join(elsewhere, "tag/Tag.tsx"))).toBe(true);
  });

  test("refuses to run outside a project", () => {
    rmSync(join(project, "package.json"));
    const { code, err } = run("add", "tag");
    expect(code).toBe(1);
    expect(err).toContain("There's no package.json here.");
  });

  test("says when the project doesn't list React or React DOM", () => {
    write("package.json", "{}");
    expect(run("add", "tag").out).toContain(
      "need React and React DOM 19.3 or later, and this project doesn't list react or react-dom",
    );
    write("package.json", JSON.stringify({ dependencies: { react: "^19.3.0" } }));
    expect(run("add", "tag").out).toContain("this project doesn't list react-dom.");
  });
});

describe("the other commands", () => {
  test("list names every component", () => {
    const { out } = run("list");
    for (const name of names) expect(out).toContain(name);
    expect(out).toContain("switches between sibling pages or panels");
  });

  test("--version gives the package's version, and an unknown command fails", () => {
    expect(run("--version").out.trim()).toBe(
      JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version,
    );
    expect(run("remove").code).toBe(1);
  });
});

// shadcn's CLI installs an item in any project, without its own setup, if the item
// is of this type and says where every file goes.
test("every item is in the format of a universal shadcn registry item", () => {
  for (const name of names) {
    const item = registry(name);
    expect(item.type).toBe("registry:item");
    for (const file of item.files) {
      expect(file.type).toBe("registry:file");
      expect(file.target).toBe(`${harmo}/${file.path}`);
      expect(typeof file.content).toBe("string");
    }
  }
});
