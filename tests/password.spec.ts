import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/password.md says a script does, on the Password Input
// page. The strength rule is the docs' example: under 10 characters is too
// weak; upper case, lower case, digits, and symbols together are strong.
onEachPlayground("password", () => {
  test("the toggle shows once there's a value, and goes when it's emptied", async ({ page }) => {
    const container = await example(page, "password-current-password");
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    await expect(toggle).toBeHidden();
    await input.fill("a");
    await expect(toggle).toBeVisible();
    await input.fill("");
    await expect(toggle).toBeHidden();
  });

  test("the toggle shows and hides the password, and its tooltip names the next click", async ({ page }) => {
    const container = await example(page, "password-current-password");
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    const tooltip = container.locator(".htooltip");
    await input.fill("secret");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(input).toHaveAttribute("type", "text");
    await expect(tooltip).toHaveText("Hide password");
    // The name stays; aria-pressed says whether the password shows.
    await expect(toggle).toHaveAccessibleName("Show password");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(input).toHaveAttribute("type", "password");
    await expect(tooltip).toHaveText("Show password");
  });

  test("disabling the input disables its toggle, and enabling it brings it back", async ({ page }) => {
    const container = await example(page, "password-disabling");
    const input = container.getByLabel("Export password");
    const toggle = container.locator(".hpassword-toggle");
    const protecting = container.getByLabel("Protect the export with a password");
    await input.fill("secret");
    await expect(toggle).toBeEnabled();

    await protecting.uncheck();
    await expect(input).toBeDisabled();
    await expect(toggle).toBeDisabled();
    await protecting.check();
    await expect(input).toBeEnabled();
    await expect(toggle).toBeEnabled();
  });

  test("the strength word, hint, meter, and status follow the level", async ({ page }) => {
    const container = await example(page, "password-new-password");
    const input = container.getByLabel("New password");
    const details = container.locator(".hpassword-details");
    const hint = container.locator(".hpassword-hint");
    await expect(details).toBeHidden();

    await input.fill("short");
    await expect(details).toBeVisible();
    await expectLevel(container, { word: "Too weak", level: 1, status: "error" });
    await expect(hint).toContainText("at least 10 characters");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await input.fill("longerpassword");
    await expectLevel(container, { word: "Medium", level: 2 });
    await expect(hint).toContainText("multiple words");
    await expect(input).not.toHaveAttribute("aria-invalid");

    await input.fill("Longer-Pass1!");
    await expectLevel(container, { word: "Strong", level: 3, status: "success" });
    await expect(hint).toHaveText("");

    // Emptied, everything clears.
    await input.fill("");
    await expect(details).toBeHidden();
    await expectLevel(container, { word: "", level: 0 });
    await expect(hint).toHaveText("");
    await expect(input).not.toHaveAttribute("aria-invalid");
  });
});

// A strength level: the word, the meter's value, its text (none while there's
// no word) and filled segments, and the same data-status on the word, the
// meter, and the hint, or none.
const expectLevel = async (container: Locator, { word, level, status }: { word: string; level: number; status?: string }) => {
  const meter = container.locator(".hmeter");
  await expect(container.locator(".hpassword-strength")).toHaveText(word);
  await expect(meter).toHaveAttribute("aria-valuenow", String(level));
  if (word) await expect(meter).toHaveAttribute("aria-valuetext", word);
  else await expect(meter).not.toHaveAttribute("aria-valuetext");
  await expect(meter.locator(".hmeter-segment[data-filled]")).toHaveCount(level);
  for (const part of [".hpassword-strength", ".hmeter", ".hpassword-hint"]) {
    if (status) await expect(container.locator(part)).toHaveAttribute("data-status", status);
    else await expect(container.locator(part)).not.toHaveAttribute("data-status");
  }
};
