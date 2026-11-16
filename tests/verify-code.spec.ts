import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, expectPosts, expectPostsElsewhere, expectShakeToEndOnItsOwn, onEachPlayground, ready, shakesOf, test } from "./playgrounds.ts";

// What docs/patterns/verify-code.md says, on the Verify Code page: a raised
// Card with a title, where the code went, or that it comes from an
// authenticator app, the code in an OTP Input, labelled "Code" and described
// by where it went, Verify as wide as the form, "Send a new code", and a way
// back in a band along the card's bottom. The form sends itself once the
// code is whole. It checks the code first, and an error goes under it, moves
// focus to it with the code selected, and shakes the form once. "Send a new
// code" waits 30 seconds, or the example's own, counting down, then sends one
// and waits again. The form posts the code, so it works before its script
// runs. The examples' stand-in accepts 123456, fails as a request that can't
// reach the server does for 000000, and always sends a new code. What the
// authenticator app's markup alone says is tested on the HTML playground.
const parts = async (page: Page, id = "verify-code-default") => {
  const container = await example(page, id);
  const form = container.locator(".hauth-form");
  return {
    form,
    title: form.getByRole("heading"),
    description: form.locator(".hauth-form-header > .hauth-form-description"),
    code: form.getByLabel("Code"),
    button: form.getByRole("button", { name: "Verify" }),
    again: form.getByRole("button", { name: /^Send a new code/ }),
    back: form.locator(".hauth-form-footer > .hlink"),
  };
};
const errorOf = (input: Locator) =>
  input.evaluate((node) => document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)?.textContent ?? "");

// Reloads the page with its clock paused, so a countdown starts at a known
// time and moves only as a test moves it.
const pausedAt = async (page: Page) => {
  await page.clock.install({ time: new Date("2026-01-01T09:00:00") });
  await page.clock.pauseAt(new Date("2026-01-01T09:00:10"));
  await page.reload();
  await ready(page);
};

onEachPlayground("verify-code", () => {
  test("a raised Card: the title, where the code went, the code's field, Verify the form's width, a new code under it, and the way back in a band", async ({ page }) => {
    const { form, title, description, code, button, again, back } = await parts(page);
    await expect(form).toHaveAttribute("data-variant", "raised");
    await expect(form).toHaveCSS("padding-top", "42px");
    await expect(title).toHaveText("Enter the code");
    await expect(description).toHaveText("We sent a 6-digit code to sam@example.com.");
    await expect(form.locator(".hauth-form-email")).toHaveCSS("font-weight", "500");
    await expect(code).toHaveAttribute("name", "code");
    await expect(code).toHaveAttribute("autocomplete", "one-time-code");
    await expect(code).toHaveAttribute("inputmode", "numeric");
    await expect(code).toHaveAttribute("maxlength", "6");
    await expect(code).toHaveAccessibleDescription("We sent a 6-digit code to sam@example.com.");
    await expect(form.locator(".hotp-input")).toHaveAttribute("data-ready", "");
    await expect(again).toHaveAttribute("type", "submit");
    await expectPostsElsewhere(again);
    await expect(back).toHaveText("Back to sign in");
    await expect(back).toHaveAttribute("href", "/sign-in");
    const line = form.locator(".hverify-code-resend");
    await expect(line).toHaveCSS("text-align", "center");
    await expect(line).toHaveCSS("font-size", "14px");
    const [box, submit, row, band] = await boxes(form, button, line, form.locator(".hauth-form-footer"));
    expect(submit!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    expect(row!.y - (submit!.y + submit!.height)).toBeCloseTo(10, 0);
    expect(band!.y - (row!.y + row!.height)).toBeCloseTo(42, 0);
    expect(band!.y + band!.height).toBeCloseTo(box!.y + box!.height - 7, 0);
  });

  test("the form posts the code, so it works before its script runs", async ({ page }) => {
    for (const form of await page.locator(".play-demo form").all()) await expectPosts(form, ["code"]);
  });

  test("verified with nothing typed, or part of the code, it says what's missing, the field takes focus, and the form shakes", async ({ page }) => {
    const { form, code, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(code)).toBe("Enter the code.");
    await expect(code).toHaveAttribute("aria-invalid", "true");
    await expect(code).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    await code.pressSequentially("482");
    await expect.poll(() => errorOf(code)).toBe("");
    await button.click();
    await expect.poll(() => errorOf(code)).toBe("Enter all 6 digits.");
  });

  test("the shake ends with its own animation, not with one inside the form", async ({ page }) => {
    const { form, button } = await parts(page);
    await expectShakeToEndOnItsOwn(form, () => button.click());
  });

  test("a whole code sends itself: the button works for a moment, then a wrong one's message goes under the field, which takes focus with the code selected", async ({ page }) => {
    const { form, code, button } = await parts(page);
    await code.pressSequentially("482913");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect.poll(() => errorOf(code)).toBe("That code isn't right. Check it, or send a new one.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(code).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    expect(await code.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual([0, 6]);
    await expect(form.locator(".hotp-input-slot[data-active]")).toHaveCount(6);
    // Typing replaces it, and takes the message away.
    await code.pressSequentially("1");
    await expect(code).toHaveValue("1");
    await expect.poll(() => errorOf(code)).toBe("");
  });

  test("the right code verifies, with no error", async ({ page }) => {
    const { code, button } = await parts(page);
    await code.pressSequentially("123456");
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    expect(await errorOf(code)).toBe("");
    await expect(code).not.toHaveAttribute("aria-invalid");
  });

  test("a request that fails says something went wrong, under the field", async ({ page }) => {
    const { form, code } = await parts(page);
    await code.pressSequentially("000000");
    await expect.poll(() => errorOf(code)).toBe("Something went wrong. Try again.");
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
  });

  test("a new code waits 30 seconds, counting down, then sends one, says so, and waits again", async ({ page }) => {
    await pausedAt(page);
    const { description, again } = await parts(page);
    await expect(again).toHaveText("Send a new code in 0:30");
    await expect(again).toHaveAttribute("aria-disabled", "true");
    await expect(again).toHaveCSS("text-decoration-line", "none");
    // Pressed while it waits, it does nothing.
    await again.dispatchEvent("click");
    await page.clock.runFor(1000);
    await expect(again).toHaveText("Send a new code in 0:29");
    await page.clock.runFor(5000);
    await expect(again).toHaveText("Send a new code in 0:24");
    await page.clock.runFor(24000);
    await expect(again).toHaveText("Send a new code");
    await expect(again).not.toHaveAttribute("aria-disabled");
    await expect(again).toHaveCSS("text-decoration-line", "underline");
    await again.click();
    await expect(again).toHaveAttribute("aria-busy", "true");
    await page.clock.runFor(800);
    await expect(description).toHaveText("We've sent a new code to sam@example.com.");
    await expect(again).toHaveText("Send a new code in 0:30");
    await expect(again).not.toHaveAttribute("aria-busy");
  });

  test("from an authenticator app, it says so, and there's no new code to send", { tag: "@css" }, async ({ page }) => {
    const { description, again, back } = await parts(page, "verify-code-from-an-authenticator-app");
    await expect(description).toHaveText("Enter the 6-digit code from your authenticator app.");
    await expect(again).toHaveCount(0);
    await expect(back).toHaveAttribute("href", "/sign-in");
  });

  test("confirming a phone number: its own title, the code in two groups, a minute between new codes, and its own way back", async ({ page }) => {
    await pausedAt(page);
    const { form, title, description, again, back } = await parts(page, "verify-code-confirming-a-phone-number");
    await expect(title).toHaveText("Confirm your phone number");
    await expect(description).toHaveText("We sent a 6-digit code to +1 (555) 010-4821.");
    await expect(form.locator(".hotp-input-slots > *")).toHaveCount(7);
    await expect(form.locator(".hotp-input-slots > :nth-child(4)")).toHaveClass("hotp-input-separator");
    await expect(again).toHaveText("Send a new code in 1:00");
    await page.clock.runFor(31000);
    await expect(again).toHaveText("Send a new code in 0:29");
    await expect(back).toHaveText("Use another number");
    await expect(back).toHaveAttribute("href", "/settings/phone");
  });
});
