import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, clickAt, colorOf, example, onEachPlayground, playgrounds, test, url } from "./playgrounds.ts";

// What docs/components/otp-input.md says, on the OTP Input page: one field
// holds the code, and the slots over it show it once the script, or React,
// is ready. Typing fills the slots from the caret, over what's there; a
// press on a slot selects its character, or goes to the end; a paste loses
// spaces, dashes, and what the code can't hold.
onEachPlayground("otp-input", () => {
  test("typing fills the slots from the caret, and the caret's slot shows focus, with a caret in it", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-default");
    await input.focus();
    await expect(slots.nth(0)).toHaveAttribute("data-active");
    await page.keyboard.type("48");
    await expect(slots).toHaveText(["4", "8", "", "", "", ""]);
    await expect(slots.locator(":scope[data-filled]")).toHaveCount(2);
    await expect(slots.locator(":scope[data-active]")).toHaveCount(1);
    await expect(slots.nth(2)).toHaveAttribute("data-active");
    await expect(slots.nth(2)).toHaveCSS("border-color", await colorOf(page, "var(--harmo-color-focus)"));
    expect(await caretOf(slots.nth(2)), "the caret").not.toBe("none");
    expect(await caretOf(slots.nth(1)), "no caret in a filled slot").toBe("none");

    await input.blur();
    await expect(slots.locator(":scope[data-active]")).toHaveCount(0);
  });

  test("the field is the slots' size, is named by its label, and is at least 16px, so iOS doesn't zoom in", async ({ page }) => {
    const { container, input, root } = await parts(page, "otp-input-default");
    await expect(root).toHaveAttribute("data-ready");
    await expect(container.getByRole("textbox", { name: "Verification code" })).toHaveCount(1);
    await expect(input).toHaveAccessibleName("Verification code");
    await expect(container.locator(".hotp-input-slots")).toHaveAttribute("aria-hidden", "true");
    await expect(input).toHaveCSS("font-size", "16px");
    await expect(input).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    const [field, row] = await boxes(input, container.locator(".hotp-input-slots"));
    expect(field).toEqual(row);
    expect(row.width).toBeCloseTo(6 * 40 + 5 * 6, 0);
    expect(row.height).toBeCloseTo(44, 0);
  });

  test("a character the code can't hold is dropped, and letters are typed in capitals when it takes them", async ({ page }) => {
    const numeric = await parts(page, "otp-input-default");
    await numeric.input.focus();
    await page.keyboard.type("1a 2-b3");
    await expect(numeric.input).toHaveValue("123");

    const letters = await parts(page, "otp-input-letters-and-digits");
    await letters.input.focus();
    await page.keyboard.type("k7qx-m2pa9");
    await expect(letters.input).toHaveValue("K7QXM2PA");
    await expect(letters.slots).toHaveText(["K", "7", "Q", "X", "M", "2", "P", "A"]);
  });

  test("Backspace and Delete delete as in a field", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-default");
    await input.focus();
    await page.keyboard.type("1234");
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("123");
    await expect(slots.nth(3)).toHaveAttribute("data-active");

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(slots.nth(1)).toHaveAttribute("data-active");
    await page.keyboard.press("Delete");
    await expect(input).toHaveValue("13");
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("3");
    await expect(slots).toHaveText(["3", "", "", "", "", ""]);
    await expect(slots.nth(0)).toHaveAttribute("data-active");
  });

  test("typing before a character types over it, rather than pushing the rest along", async ({ page }) => {
    const { input } = await parts(page, "otp-input-default");
    await input.focus();
    await page.keyboard.type("123456");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("90");
    await expect(input).toHaveValue("190456");
    await page.keyboard.press("End");
    await page.keyboard.type("7");
    await expect(input).toHaveValue("190456");
  });

  test("pressing a slot selects its character, so the next key replaces it; past what's typed, the caret goes to the end", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-default");
    await input.focus();
    await page.keyboard.type("123");
    await clickAt(page, slots.nth(5));
    await expect(input).toHaveJSProperty("selectionStart", 3);
    await expect(input).toHaveJSProperty("selectionEnd", 3);
    await expect(slots.nth(3)).toHaveAttribute("data-active");

    await clickAt(page, slots.nth(1));
    await expect(input).toHaveJSProperty("selectionStart", 1);
    await expect(input).toHaveJSProperty("selectionEnd", 2);
    await expect(slots.nth(1)).toHaveAttribute("data-active");
    await page.keyboard.type("7");
    await expect(input).toHaveValue("173");
    await clickAt(page, slots.nth(0));
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("73");
  });

  test("a paste loses spaces, dashes, and what the code can't hold, and a whole code replaces the one there", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-default");
    await input.focus();
    await paste(input, " 482-913 ");
    await expect(input).toHaveValue("482913");
    await expect(slots).toHaveText(["4", "8", "2", "9", "1", "3"]);

    await paste(input, "123 456 789");
    await expect(input).toHaveValue("123456");

    await input.fill("");
    await paste(input, "1a2b");
    await expect(input).toHaveValue("12");
    await paste(input, "3 4");
    await expect(input).toHaveValue("1234");
    await expect(slots.nth(4)).toHaveAttribute("data-active");
  });

  test("length sets the slots, maxlength, and pattern: four digits, or eight letters and digits", async ({ page }) => {
    const four = await parts(page, "otp-input-four-digits");
    await expect(four.slots).toHaveCount(4);
    await expect(four.input).toHaveAttribute("maxlength", "4");
    await expect(four.input).toHaveAttribute("pattern", "[0-9]{4}");
    await expect(four.input).toHaveAttribute("inputmode", "numeric");
    await four.input.focus();
    await page.keyboard.type("123456");
    await expect(four.input).toHaveValue("1234");

    const eight = await parts(page, "otp-input-letters-and-digits");
    await expect(eight.slots).toHaveCount(8);
    await expect(eight.input).toHaveAttribute("maxlength", "8");
    await expect(eight.input).toHaveAttribute("pattern", "[A-Za-z0-9]{8}");
    await expect(eight.input).toHaveAttribute("inputmode", "text");
    await expect(eight.input).toHaveAttribute("autocapitalize", "characters");
  });

  test("groups are split by a dash, the slots' gap on each side, and the value has none", async ({ page }) => {
    const { container, input, slots } = await parts(page, "otp-input-grouped");
    const dash = container.locator(".hotp-input-separator");
    await expect(dash).toHaveCount(1);
    const [third, line, fourth] = await boxes(slots.nth(2), dash, slots.nth(3));
    expect(line.x - (third.x + third.width)).toBeCloseTo(6, 0);
    expect(fourth.x - (line.x + line.width)).toBeCloseTo(6, 0);
    await input.focus();
    await page.keyboard.type("482913");
    await expect(input).toHaveValue("482913");
  });

  test("the last character sends its form, once; a reset empties the slots", async ({ page }) => {
    const { container, input, slots } = await parts(page, "otp-input-in-a-form");
    const form = container.locator("form");
    const status = container.locator(".hstatus");
    // So a code sent before the script runs stays out of the page's address.
    await expect(form).toHaveAttribute("method", "post");
    await form.evaluate((node) => {
      node.dataset.sent = "0";
      node.addEventListener("submit", () => (node.dataset.sent = String(Number(node.dataset.sent) + 1)));
    });
    await input.focus();
    await page.keyboard.type("48291");
    await expect(slots.nth(4)).toHaveText("1");
    await expect(form).toHaveAttribute("data-sent", "0");
    await expect(status).toHaveText("Not sent yet");

    await page.keyboard.type("3");
    await expect(status).toHaveText("Sent 482913");
    await expect(form).toHaveAttribute("data-sent", "1");
    await page.keyboard.type("5");
    await input.blur();
    await expect(form).toHaveAttribute("data-sent", "1");

    await container.getByRole("button", { name: "Reset" }).click();
    await expect(input).toHaveValue("");
    await expect(slots).toHaveText(["", "", "", "", "", ""]);
    await expect(slots.locator(":scope[data-filled]")).toHaveCount(0);
    await expect(status).toHaveText("Not sent yet");

    await input.focus();
    await paste(input, "123456");
    await expect(status).toHaveText("Sent 123456");
    await expect(form).toHaveAttribute("data-sent", "2");
  });

  test("a Field's error marks every slot invalid, and its description and error describe the field", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-with-a-description-and-an-error");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleName("Verification code");
    await expect(input).toHaveAccessibleDescription(
      "Enter the 6-digit code we sent to your phone. That code has expired. Send a new one.",
    );
    const danger = await colorOf(page, "var(--harmo-color-danger)");
    for (const slot of await slots.all()) await expect(slot).toHaveCSS("border-color", danger);
    await input.focus();
    await expect(slots.locator(":scope[data-active]")).toHaveCount(1);
    await expect(slots.locator(":scope[data-active]")).toHaveCSS("border-color", danger);
  });

  test("disabled, the slots are gray and nothing can be typed; read-only, the code can be selected but not changed", async ({ page }) => {
    const container = await example(page, "otp-input-read-only-and-disabled");
    const disabled = container.getByLabel("Verification code");
    const disabledSlots = container.locator(".hotp-input").nth(1).locator(".hotp-input-slot");
    await expect(disabled).toBeDisabled();
    const gray = await colorOf(page, "var(--harmo-color-background-secondary)");
    await expect(disabledSlots.first()).toHaveCSS("background-color", gray);
    await expect(disabledSlots.first()).toHaveCSS("color", await colorOf(page, "var(--harmo-color-text-tertiary)"));

    const readOnly = container.getByLabel("Pairing code");
    const readOnlySlots = container.locator(".hotp-input").nth(0).locator(".hotp-input-slot");
    await expect(readOnlySlots.first()).toHaveCSS("background-color", gray);
    await clickAt(page, readOnlySlots.nth(2));
    await expect(readOnly).toBeFocused();
    await expect(readOnly).toHaveJSProperty("selectionStart", 2);
    await expect(readOnly).toHaveJSProperty("selectionEnd", 3);
    await page.keyboard.type("5");
    await paste(readOnly, "111111");
    await expect(readOnly).toHaveValue("731904");
  });

  test("in right-to-left text, the code still reads left to right, at the field's start", async ({ page }) => {
    const { container, input, root, slots } = await parts(page, "otp-input-default");
    await container.locator(".play-demo").evaluate((demo) => demo.setAttribute("dir", "rtl"));
    await expect(root).toHaveAttribute("dir", "ltr");
    await input.focus();
    await page.keyboard.type("12");
    const [first, second, field, label] = await boxes(slots.nth(0), slots.nth(1), root, container.locator(".hlabel"));
    expect(first.x).toBeLessThan(second.x);
    await expect(slots.nth(0)).toHaveText("1");
    expect(field.x + field.width).toBeCloseTo(label.x + label.width, 0);
  });

  test("the caret blinks, and under reduced motion it holds still", async ({ page }) => {
    const { input, slots } = await parts(page, "otp-input-default");
    await input.focus();
    await expect(slots.nth(0)).toHaveAttribute("data-active");
    expect(await caretAnimations(slots.nth(0))).toBe(1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await caretAnimations(slots.nth(0))).toBe(0);
    expect(await caretOf(slots.nth(0))).not.toBe("none");
  });
});

// Without JavaScript, before a script runs or if it never does, it's a plain
// Input that a form sends: its text shows, and the slots don't.
for (const playground of playgrounds) {
  test(`${playground}: without JavaScript, it's a plain field, as wide as the slots, that can be typed in and sent`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(url(playground, "otp-input"));
      const container = page.locator('[id="otp-input-default"]');
      const root = container.locator(".hotp-input");
      const input = container.getByLabel("Verification code");
      await expect(root).not.toHaveAttribute("data-ready");
      await expect(container.locator(".hotp-input-slots")).toBeHidden();
      await expect(input).toBeVisible();
      await expect(input).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
      const box = await input.boundingBox();
      expect(box?.width).toBeCloseTo(6 * 40 + 5 * 6, 0);
      expect(box?.height).toBeCloseTo(44, 0);

      await input.pressSequentially("482913");
      await expect(input).toHaveValue("482913");
      await expect(input).toHaveAttribute("name", "code");
      await expect(input).toHaveAttribute("autocomplete", "one-time-code");
      await expect(input).toHaveAttribute("inputmode", "numeric");
      await expect(input).toHaveAttribute("maxlength", "6");
      await expect(input).toHaveAttribute("pattern", "[0-9]{6}");

      const four = page.locator('[id="otp-input-four-digits"]').getByLabel("Confirmation code");
      await expect(four).toHaveAttribute("maxlength", "4");
      await expect(four).toHaveAttribute("pattern", "[0-9]{4}");
      const letters = page.locator('[id="otp-input-letters-and-digits"]').getByLabel("Recovery code");
      await expect(letters).toHaveAttribute("maxlength", "8");
      await expect(letters).toHaveAttribute("pattern", "[A-Za-z0-9]{8}");
      await expect(letters).toHaveAttribute("inputmode", "text");
    } finally {
      await context.close();
    }
  });
}

const parts = async (page: Page, id: string) => {
  const container = await example(page, id);
  const root = container.locator(".hotp-input").first();
  return { container, root, input: root.locator(".hinput"), slots: root.locator(".hotp-input-slot") };
};

// A paste of text, as the browser sends it.
const paste = (input: Locator, text: string) =>
  input.evaluate((node, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    node.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }));
  }, text);

// What a slot's caret shows: its ::after's content, "none" without one.
const caretOf = (slot: Locator) => slot.evaluate((node) => getComputedStyle(node, "::after").content);

const caretAnimations = (slot: Locator) =>
  slot.evaluate(
    (node) =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.target === node &&
            animation.effect.pseudoElement === "::after",
        ).length,
  );
