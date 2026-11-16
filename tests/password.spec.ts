import { expect, type Locator } from "@playwright/test";
import { animations, boxes, example, onEachPlayground, release, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/password.md says a script does, on the Password Input
// page. The strength rule is the docs' example: under 10 characters is too
// weak; upper case, lower case, digits, and symbols together are strong. A
// form's reset starts the field over. Sending the form, and coming back to the
// page, hide a password that shows. While the field shows an error, the
// strength steps aside. Where a link beside the label sits, which only CSS
// decides, is tested on the HTML playground.
onEachPlayground("password", () => {
  test("a link beside the label sits at the end of its row, at the label's size, and the row stays a label's height", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "password-with-a-link-beside-the-label");
    const row = container.locator(".hfield-label-row");
    const link = container.getByRole("link", { name: "Forgot your password?" });
    const [box, label, end] = await boxes(row, container.locator(".hlabel"), link);
    expect(end!.x + end!.width).toBeCloseTo(box!.x + box!.width, 0);
    expect(end!.x).toBeGreaterThan(label!.x + label!.width);
    expect(box!.height).toBeCloseTo(20, 0);
    await expect(link).toHaveCSS("font-size", "14px");
    await expect(link).toHaveCSS("line-height", "20px");
  });

  test("with its strength, a link beside the label follows the word, which keeps to the row's end; without a word, the link is at the end itself", async ({ page }) => {
    const container = await example(page, "password-with-its-strength-and-a-link");
    const row = container.locator(".hfield-label-row");
    const word = container.locator(".hpassword-strength");
    const link = container.getByRole("link", { name: "Password rules" });
    const fromEnd = async () => {
      const [box, end] = await boxes(row, link);
      return box.x + box.width - (end.x + end.width);
    };
    expect(await fromEnd(), "empty").toBeCloseTo(0, 0);

    await container.getByLabel("New password").fill("short");
    await expect(word).toHaveText("Too weak");
    const [box, label, shown, end] = await boxes(row, container.locator(".hlabel"), word, link);
    expect(label.x).toBeCloseTo(box.x, 0);
    expect(end.x + end.width).toBeCloseTo(box.x + box.width, 0);
    expect(end.x - (shown.x + shown.width), "the row's gap").toBeCloseTo(6, 0);
    expect(shown.x).toBeGreaterThan(label.x + label.width + 6);

    await word.evaluate((node) => node.setAttribute("hidden", ""));
    expect(await fromEnd(), "hidden").toBeCloseTo(0, 0);
  });

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

  test("the toggle's tooltip opens to its right, 8px past the field, so it covers nothing under the field", async ({ page }) => {
    const container = await example(page, "password-current-password");
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    await input.fill("secret");
    await toggle.hover();
    const tooltip = container.locator(".htooltip");
    await expect(tooltip).toHaveCSS("opacity", "1");
    await settled(tooltip);
    const [field, button, tip] = await boxes(input, toggle, tooltip);
    expect(tip!.x).toBeGreaterThan(button!.x + button!.width);
    expect(tip!.x - (field!.x + field!.width)).toBeCloseTo(8, 0);
    expect(tip!.y).toBeLessThan(button!.y + button!.height);
  });

  test("in right-to-left text, set after the page loaded, the toggle's tooltip opens to its left, at the field's end", async ({ page }) => {
    const container = await example(page, "password-current-password");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    await input.fill("secret");
    await toggle.hover();
    const tooltip = container.locator(".htooltip");
    await expect(tooltip).toHaveCSS("opacity", "1");
    await settled(tooltip);
    const [field, button, tip] = await boxes(input, toggle, tooltip);
    expect(button!.x - field!.x, "the toggle is at the field's left").toBeLessThan(field!.width / 2);
    expect(tip!.x + tip!.width).toBeLessThan(button!.x);
    expect(field!.x - (tip!.x + tip!.width)).toBeCloseTo(8, 0);
    expect(tip!.y).toBeLessThan(button!.y + button!.height);
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

    // Emptied, the word clears and the details close, keeping the last meter
    // and hint so that they don't change as they go.
    await input.fill("");
    await expect(details).toBeHidden();
    await expect(container.locator(".hpassword-strength")).toHaveText("");
    await expect(container.locator(".hpassword-strength")).not.toHaveAttribute("data-status");
    await expect(hint).toHaveText("");
    await expect(input).not.toHaveAttribute("aria-invalid");
  });

  test("while its field shows an error, the strength's word and meter step aside, and the input is described by the error alone", async ({ page }) => {
    const container = await example(page, "password-with-an-error");
    const input = container.getByLabel("New password");
    const word = container.locator(".hpassword-strength");
    const details = container.locator(".hpassword-details");
    await expect(container.locator(".herror")).toHaveText("This password has appeared in a data breach. Choose another.");
    await input.fill("Password123!");
    await expect(word).toHaveText("Strong");
    await expect(word).toBeHidden();
    await expect(details).toHaveAttribute("hidden", "");
    await expect(input).toHaveAccessibleDescription("This password has appeared in a data breach. Choose another.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("under reduced motion, closing details fade out in place, then their space closes", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const container = await example(page, "password-new-password");
    const input = container.getByLabel("New password");
    const details = container.locator(".hpassword-details");
    await input.fill("short");
    await expect(details).toBeVisible();
    await settled(details);
    const open = (await details.boundingBox())!.height;
    expect(open).toBeGreaterThan(0);

    await slowDown(details);
    await input.fill("");
    await expect(details).toHaveAttribute("hidden");
    expect(await animations(details), "closing animations").toBeGreaterThan(0);
    expect((await details.boundingBox())!.height).toBeCloseTo(open, 0);

    await release(details);
    await settled(details);
    expect((await details.boundingBox())?.height ?? 0).toBeCloseTo(0, 0);
  });

  test("in a form, a reset empties it, clears the strength, and hides the password again", async ({ page }) => {
    const container = await example(page, "password-in-a-form");
    const input = container.getByLabel("New password");
    const toggle = container.locator(".hpassword-toggle");
    const details = container.locator(".hpassword-details");
    await input.fill("short");
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");
    await expect(details).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await container.getByRole("button", { name: "Reset" }).click();
    await expect(input).toHaveValue("");
    await expect(toggle).toBeHidden();
    await expect(details).toBeHidden();
    await expect(container.locator(".hpassword-strength")).toHaveText("");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(input).toHaveAttribute("type", "password");
    await expect(container.locator(".htooltip")).toHaveText("Show password");

    // So the next password typed doesn't show.
    await input.fill("another");
    await expect(toggle).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("in a form, sending it hides the password again before the browser reads the form, even when a listener cancels the send", async ({ page }) => {
    const container = await example(page, "password-in-a-form");
    const input = container.getByLabel("New password");
    const toggle = container.locator(".hpassword-toggle");
    await input.fill("correct horse");
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");

    // The type as the submit event ends, which is when the browser reads the
    // form; the listener cancels the send, so the page stays.
    const sent = await input.evaluate((node: HTMLInputElement) => {
      node.form!.addEventListener("submit", (event) => event.preventDefault(), { once: true });
      node.form!.requestSubmit();
      return node.type;
    });
    expect(sent).toBe("password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(container.locator(".htooltip")).toHaveText("Show password");
    await expect(input).toHaveValue("correct horse");
  });

  test("coming back to the page from the back-forward cache hides a password that was showing", async ({ page }) => {
    const container = await example(page, "password-current-password");
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    const restore = (persisted: boolean) =>
      page.evaluate((persisted) => dispatchEvent(new PageTransitionEvent("pageshow", { persisted })), persisted);
    await input.fill("secret");
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");

    // A first load isn't a return.
    await restore(false);
    await expect(input).toHaveAttribute("type", "text");

    await restore(true);
    await expect(input).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(container.locator(".htooltip")).toHaveText("Show password");
  });

  test("the eye is as far in as the text starts, and the details open 10px under the input, with the hint 10px under the bars", async ({ page }) => {
    const container = await example(page, "password-new-password");
    const input = container.getByLabel("New password");
    await input.fill("short");
    const details = container.locator(".hpassword-details");
    await settled(details);
    const eye = container.locator(".hpassword-toggle > .hpassword-icon-show");
    const [field, icon, open, meter, hint] = await boxes(input, eye, details, container.locator(".hmeter"), container.locator(".hpassword-hint"));
    const start = await input.evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft));
    expect(start).toBe(10);
    expect(field.x + field.width - (icon.x + icon.width)).toBeCloseTo(start, 0);
    expect(open.y - (field.y + field.height)).toBeCloseTo(10, 0);
    expect(hint.y - (meter.y + meter.height)).toBeCloseTo(10, 0);
  });

  test("at a larger font size, the eye still fits its button, and the text stops before it", async ({ page }) => {
    await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
    const container = await example(page, "password-current-password");
    const input = container.getByLabel("Password", { exact: true });
    const toggle = container.locator(".hpassword-toggle");
    await input.fill("secret");
    const [field, button, eye] = await boxes(input, toggle, toggle.locator(".hpassword-icon-show"));
    expect(eye.width).toBeCloseTo(30, 0);
    expect(eye.width).toBeLessThanOrEqual(button.width);
    const end = await input.evaluate((node) => parseFloat(getComputedStyle(node).paddingRight));
    expect(field.x + field.width - button.x).toBeLessThan(end);
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
