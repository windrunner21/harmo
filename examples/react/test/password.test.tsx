import { describe, expect, test } from "bun:test";
import { Link, PasswordInput } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/password.md says about labelAccessory: it goes in the
// label row, after the strength word, and with no strength and no accessory
// the label stands alone, with no row.
const labelRow = (markup: string) => markup.match(/<div class="hfield-label-row">([\s\S]*?)<\/div>/)?.[1];

describe("PasswordInput", () => {
  const texts = { showPasswordLabel: "Show password", hidePasswordLabel: "Hide password" };
  const forgot = (
    <Link href="/reset-password" className="hfield-label-end">
      Forgot your password?
    </Link>
  );

  test("labelAccessory goes in the label row, after the label", () => {
    const row = labelRow(renderToStaticMarkup(<PasswordInput label="Password" labelAccessory={forgot} {...texts} />));
    expect(row).toMatch(/^<label[^>]*>Password<\/label><a [^>]*>Forgot your password\?<\/a>$/);
    expect(row).toContain('class="hlink hfield-label-end"');
  });

  test("with strength, it comes after the strength word", () => {
    const row = labelRow(
      renderToStaticMarkup(
        <PasswordInput
          label="New password"
          labelAccessory={forgot}
          strength={() => ({ level: 1, word: "Too weak" })}
          strengthLabel="Password strength"
          {...texts}
        />,
      ),
    );
    expect(row?.indexOf("hpassword-strength")).toBeLessThan(row?.indexOf("hfield-label-end") ?? -1);
  });

  test("while it shows an error, the strength's word and meter step aside, and the input isn't described by them", () => {
    const strength = () => ({ level: 3 as const, word: "Strong", status: "success" as const });
    const markup = (error?: string) =>
      renderToStaticMarkup(
        <PasswordInput
          label="New password"
          defaultValue="Correct.horse1"
          strength={strength}
          strengthLabel="Password strength"
          error={error}
          {...texts}
        />,
      );
    const shown = markup();
    expect(shown).toMatch(/<span class="hpassword-strength"[^>]*>Strong<\/span>/);
    expect(shown).not.toMatch(/class="hpassword-strength"[^>]*hidden/);
    expect(shown).toMatch(/class="hpassword-details"(?![^>]*hidden)/);
    const erred = markup("This password has appeared in a data breach. Choose another.");
    expect(erred).toMatch(/<span class="hpassword-strength"[^>]*hidden=""[^>]*>Strong<\/span>/);
    expect(erred).toMatch(/class="hpassword-details" hidden=""/);
    const describedBy = /<input[^>]*aria-describedby="([^"]+)"/.exec(erred)?.[1] ?? "";
    expect(describedBy.split(" ")).toHaveLength(1);
    expect(describedBy).toEndWith("-error");
  });

  test("with neither, the label has no row", () => {
    expect(renderToStaticMarkup(<PasswordInput label="Password" {...texts} />)).not.toContain("hfield-label-row");
  });
});
