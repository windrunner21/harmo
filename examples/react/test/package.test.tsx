import { Switch } from "@harmo-ui/react";
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// What an app gets from npm. Next.js doesn't compile node_modules, so the
// package must be plain JavaScript, in both formats. Each source file stays its
// own file, as merging them would lose each one's "use client".
const root = join(import.meta.dir, "..", "..", "..", "packages", "react");
const sources = [...new Bun.Glob("**/*.{ts,tsx}").scanSync(join(root, "src"))];
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const read = (...path: string[]) => readFileSync(join(root, ...path), "utf8");
// CommonJS output starts with "use strict"; both are markers at the file's top.
const isClient = (text: string) => /^("use strict";\s*)?"use client"/.test(text);
const pathsIn = (value: unknown): string[] =>
  typeof value === "string" ? [value] : Object.values(value as object).flatMap(pathsIn);

describe("the compiled package", () => {
  for (const source of sources) {
    test(source, () => {
      const base = source.replace(/\.tsx?$/, "");
      for (const format of ["esm", "cjs"]) {
        const code = read("dist", format, `${base}.js`);
        expect(existsSync(join(root, "dist", format, `${base}.d.ts`))).toBe(true);
        expect(isClient(code)).toBe(isClient(read("src", source)));
        // Browsers and Node can't load a source file. In the types, TypeScript
        // reads ./Switch.tsx as Switch.d.ts, so those can stay.
        expect(code).not.toMatch(/["']\.[^"']*\.tsx?["']/);
      }
    });
  }

  test("every entry point in its package.json exists", () => {
    const { main, module, types, exports } = manifest;
    for (const file of pathsIn({ main, module, types, exports })) {
      expect(existsSync(join(root, file))).toBe(true);
    }
  });

  test("Node loads it through both import and require, each as its own format", () => {
    const script = `
      const { createElement } = require("react");
      const { renderToStaticMarkup } = require("react-dom/server");
      const required = require("@harmo-ui/react");
      import("@harmo-ui/react").then((imported) => {
        console.log(required.Tag !== imported.Tag);
        for (const { Tag } of [required, imported]) console.log(renderToStaticMarkup(createElement(Tag, null, "New")));
      });
    `;
    const node = Bun.spawnSync(["node", "-e", script], { cwd: import.meta.dir });
    expect(node.stderr.toString()).toBe("");
    expect(node.stdout.toString().trim().split("\n")).toEqual(["true", '<span class="htag">New</span>', '<span class="htag">New</span>']);
  });

  test("its types still check props", () => {
    // Checked by mise run check:react: with the types lost, this would be
    // allowed, and the line below an unused directive, which is an error.
    // @ts-expect-error
    void (<Switch checked="yes" />);
  });
});
