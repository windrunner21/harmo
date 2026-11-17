import { expect, type Locator, type Page } from "@playwright/test";
import {
  boxes,
  example,
  expectPosts,
  expectPostsElsewhere,
  expectShakeToEndOnItsOwn,
  fadingIn,
  onEachPlayground,
  resizing,
  shakesOf,
  slowDownSteps,
  test,
} from "./playgrounds.ts";

// What docs/patterns/sign-in-form.md says, on the Sign-in Form page: a raised
// Card with the email, the password, and "Forgot your password?" beside its
// label; the fields are checked before signing in; a failed sign-in puts its
// error under the password, moves focus to the field in error, and shakes the
// form once, unless reduced motion is asked for. Other accounts follow the
// button, under "or", one to a row, or two with four or more, as the Sign-up
// Form's do. A message the app gives for a field goes under that field
// instead, and a request that fails says "Something went wrong. Try again."
// The form posts its email and password, so one sent before its script runs
// keeps the password out of the page's address. With a second step, the right
// password asks for a code: Verify Code takes the form's place, the form
// staying hidden with what was typed until "Back to sign in". The examples'
// stand-in signs in with the password "harmo" only, and not as
// new@example.com, whose email it says hasn't been confirmed; it fails for
// error@example.com, and with a second step, 123456 is the code. How the
// form looks, which only CSS and the markup decide, is tested on the HTML
// playground.
const parts = async (page: Page, id = "sign-in-form-default") => {
  const container = await example(page, id);
  const form = container.locator(".hauth-form").first();
  return {
    container,
    form,
    email: form.getByLabel("Email"),
    password: form.getByLabel("Password", { exact: true }),
    button: form.getByRole("button", { name: "Sign in" }),
    link: form.getByRole("link", { name: "Forgot your password?" }),
  };
};
const errorOf = (input: Locator) =>
  input.evaluate((node) => document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)?.textContent ?? "");
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.backgroundColor = `var(${name})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);

onEachPlayground("sign-in-form", () => {
  test("a raised Card: the link at the end of the password's label row, and the button the form's width", { tag: "@css" }, async ({ page }) => {
    const { form, button, link } = await parts(page);
    await expect(form).toHaveAttribute("data-variant", "raised");
    await expect(form).toHaveCSS("padding-top", "42px");
    const [box, submit, row, end] = await boxes(form, button, form.locator(".hfield-label-row"), link);
    expect(submit!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    expect(end!.x + end!.width).toBeCloseTo(row!.x + row!.width, 0);
    await expect(link).toHaveCSS("font-size", "14px");
    await expect(link).toHaveAttribute("href", "/reset-password");
  });

  test("signed in with nothing typed, each field says what's missing, the email takes focus, and the form shakes", async ({ page }) => {
    const { form, email, password, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your email address.");
    expect(await errorOf(password)).toBe("Enter your password.");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBe(1);
  });

  test("the shake ends with its own animation, not with one inside the form, such as the loading button's spinner appearing", async ({ page }) => {
    const { form, button } = await parts(page);
    await expectShakeToEndOnItsOwn(form, () => button.click());
  });

  test("an email that isn't an address says so, and typing in a field takes its error away", async ({ page }) => {
    const { email, password, button } = await parts(page);
    await email.fill("sam");
    await password.fill("secret");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter an email address, such as name@example.com.");
    expect(await errorOf(password)).toBe("");
    await email.pressSequentially("@example.com");
    await expect.poll(() => errorOf(email)).toBe("");
    await expect(email).not.toHaveAttribute("aria-invalid");
  });

  test("a wrong password: the button works for a moment, then the error goes under the password, which takes focus", async ({ page }) => {
    const { form, email, password, button, link } = await parts(page);
    await email.fill("sam@example.com");
    await password.fill("wrong");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect.poll(() => errorOf(password)).toBe("The email or password is incorrect.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(password).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    // The link never carries what was typed.
    await expect(link).toHaveAttribute("href", "/reset-password");
  });

  test("a message the app gives for a field, here the email, goes under that field, which takes focus, and the form shakes", async ({ page }) => {
    const { form, email, password, button } = await parts(page);
    await email.fill("new@example.com");
    await password.fill("harmo");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Confirm your email address first. We've sent you a new link.");
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    expect(await errorOf(password)).toBe("");
    await expect(password).not.toHaveAttribute("aria-invalid");
  });

  test("the right password signs in, with no error, and a toast says so where the app would go on", async ({ page }) => {
    const { email, password, button } = await parts(page);
    await email.fill("sam@example.com");
    await password.fill("harmo");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    expect(await errorOf(password)).toBe("");
    await expect(password).not.toHaveAttribute("aria-invalid");
    const toast = page.locator(".htoast:not([data-removed])");
    await expect(toast.locator(".htoast-title")).toHaveText("Signed in");
    await expect(toast.locator(".htoast-description")).toHaveText("Welcome back, sam@example.com.");
  });

  test("every form posts its email and password, so one sent before its script runs keeps what was typed out of the page's address", async ({ page }) => {
    const forms = page.locator(".play-demo form");
    await expect(forms).toHaveCount(6);
    for (const form of await forms.all()) await expectPosts(form, ["email", "password"]);
    const { email, password } = await parts(page);
    // A password manager fills them in as the account's name and its password.
    await expect(email).toHaveAttribute("autocomplete", "username");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
  });

  test("a request that fails says something went wrong, under the password, and the form shakes", async ({ page }) => {
    const { form, email, password, button } = await parts(page);
    await email.fill("error@example.com");
    await password.fill("harmo");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("Something went wrong. Try again.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(password).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    // Still the form, with what was typed.
    await expect(email).toHaveValue("error@example.com");
  });

  test("under reduced motion, a failed sign-in doesn't shake the form", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { form, email, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your email address.");
    expect(await shakesOf(form)).toBe(0);
  });

  test("with the link below the field, it sits at the field's end, a small step under it, at the label's size", { tag: "@css" }, async ({ page }) => {
    const { form, link } = await parts(page, "sign-in-form-link-below-the-field");
    const field = form.locator(".hauth-form-password > .hfield");
    const [box, end] = await boxes(field, link);
    expect(end!.x + end!.width).toBeCloseTo(box!.x + box!.width, 0);
    expect(end!.y - (box!.y + box!.height)).toBeCloseTo(6, 0);
    await expect(link).toHaveCSS("font-size", "14px");
  });

  test("with other accounts, \"or\" follows the button, then a secondary link to each, as wide as the form, its logo first", { tag: "@css" }, async ({ page }) => {
    await expect((await parts(page)).form.locator(".hauth-form-divider, .hauth-form-providers")).toHaveCount(0);
    const { form, button } = await parts(page, "sign-in-form-with-other-accounts");
    const divider = form.locator(".hauth-form-divider");
    const names = ["Google", "GitHub", "Apple"];
    const links = names.map((name) => form.getByRole("link", { name: `Continue with ${name}` }));
    // A word a screen reader reads, in 13px tertiary text, between two lines.
    await expect(divider).toMatchAriaSnapshot("- paragraph: or");
    await expect(divider).toHaveCSS("font-size", "13px");
    await expect(divider).toHaveCSS("color", await color(page, "--harmo-color-text-tertiary"));
    const border = await color(page, "--harmo-color-border");
    for (const side of ["::before", "::after"]) {
      const line = await divider.evaluate((node, side) => {
        const { borderTopWidth, borderTopStyle, borderTopColor } = getComputedStyle(node, side);
        return `${borderTopWidth} ${borderTopStyle} ${borderTopColor}`;
      }, side);
      expect(line).toBe(`1px solid ${border}`);
    }
    for (const [index, link] of links.entries()) {
      await expect(link).toHaveAttribute("href", `/auth/${names[index]!.toLowerCase()}`);
      await expect(link).toHaveAttribute("data-variant", "secondary");
      await expect(link).not.toHaveAttribute("aria-label");
      await expect(link.locator(".hbutton-label")).toHaveText(`Continue with ${names[index]}`);
    }
    const [box, submit, line, first, second, third, logo, label] = await boxes(
      form,
      button,
      divider,
      ...links,
      links[0]!.locator(":scope > svg.hicon"),
      links[0]!.locator(":scope > .hbutton-label"),
    );
    for (const part of [line, first, second, third]) {
      expect(part!.x).toBeCloseTo(submit!.x, 0);
      expect(part!.width).toBeCloseTo(submit!.width, 0);
    }
    expect(line!.y - (submit!.y + submit!.height)).toBeCloseTo(26, 0);
    expect(first!.y - (line!.y + line!.height)).toBeCloseTo(26, 0);
    expect(second!.y - (first!.y + first!.height)).toBeCloseTo(10, 0);
    expect(third!.y - (second!.y + second!.height)).toBeCloseTo(10, 0);
    // Without a band, the card's padding and its 1px border follow them.
    expect(box!.y + box!.height - (third!.y + third!.height)).toBeCloseTo(43, 0);
    expect(logo!.width).toBeCloseTo(20, 0);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(label!.x + 0.5);
  });

  test("with many other accounts, they go two to a row, each showing its name and named \"Continue with\" it", { tag: "@css" }, async ({ page }) => {
    const { form, button } = await parts(page, "sign-in-form-with-many-other-accounts");
    const names = ["Google", "Apple", "Microsoft", "GitHub", "X", "OpenAI"];
    const links = names.map((name) => form.getByRole("link", { name: `Continue with ${name}`, exact: true }));
    for (const [index, link] of links.entries()) {
      await expect(link.locator(".hbutton-label")).toHaveText(names[index]!);
      await expect(link).toHaveAttribute("href", `/auth/${names[index]!.toLowerCase()}`);
      await expect(link.locator(":scope > svg.hicon")).toHaveCount(1);
    }
    const [submit, ...cells] = await boxes(button, ...links);
    for (let row = 0; row < 3; row++) {
      const [start, end] = [cells[2 * row]!, cells[2 * row + 1]!];
      expect(start.x).toBeCloseTo(submit!.x, 0);
      expect(end.x + end.width).toBeCloseTo(submit!.x + submit!.width, 0);
      expect(end.x - (start.x + start.width)).toBeCloseTo(10, 0);
      expect(end.y).toBeCloseTo(start.y, 0);
    }
    expect(cells[2]!.y - (cells[0]!.y + cells[0]!.height)).toBeCloseTo(10, 0);
  });

  test("with a two-factor code, the right password brings Verify Code in the form's place, its title focused, saying where the code went", async ({ page }) => {
    const container = await example(page, "sign-in-form-with-a-two-factor-code");
    const form = container.locator(".hauth-form").first();
    await slowDownSteps(container);
    const [before] = await boxes(form);
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Password", { exact: true }).fill("harmo");
    await form.getByRole("button", { name: "Sign in" }).click();
    const card = container.locator(".hauth-form:not([hidden])");
    const title = card.getByRole("heading", { name: "Verify it's you" });
    await expect(title).toBeFocused();
    await expect(form).toBeHidden();
    await expect(card.locator(".hauth-form-description")).toHaveText("We sent a 6-digit code to sam@example.com.");
    const code = card.getByLabel("Code");
    await expect(code).toHaveAttribute("name", "code");
    await expect(code).toHaveAttribute("autocomplete", "one-time-code");
    await expectPosts(card, ["code"]);
    // The card it shows grows or shrinks from the form's height, fading in.
    const resize = await resizing(card);
    expect(resize!.from).toBeCloseTo(before!.height, 0);
    expect(await fadingIn(card.locator(".hauth-form-header"))).toBe(true);
  });

  test("with a two-factor code, a wrong code says so under the field, and Back to sign in brings the form back as it was typed", async ({ page }) => {
    const container = await example(page, "sign-in-form-with-a-two-factor-code");
    const form = container.locator(".hauth-form").first();
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Password", { exact: true }).fill("harmo");
    await form.getByRole("button", { name: "Sign in" }).click();
    const card = container.locator(".hauth-form:not([hidden])");
    await expect(card.getByRole("heading", { name: "Verify it's you" })).toBeFocused();
    const code = card.getByLabel("Code");
    // Whole, it sends itself.
    await code.pressSequentially("654321");
    await expect.poll(() => errorOf(code)).toBe("That code isn't right. Check it, or send a new one.");
    await expect(code).toBeFocused();
    await expect.poll(() => shakesOf(card)).toBeGreaterThan(0);
    await code.pressSequentially("123456");
    await expect(card.getByRole("button", { name: "Verify" })).not.toHaveAttribute("aria-busy");
    await expect.poll(() => errorOf(code)).toBe("");
    await expect(page.locator(".htoast:not([data-removed]) .htoast-title")).toHaveText("Signed in");

    const back = card.getByRole("link", { name: "Back to sign in" });
    await expect(back).toHaveAttribute("href", "");
    await back.click();
    await expect(form.getByRole("heading", { name: "Sign in" })).toBeFocused();
    await expect(container.locator(".hauth-form")).toHaveCount(1);
    await expect(form.getByLabel("Email")).toHaveValue("sam@example.com");
    await expect(form.getByLabel("Password", { exact: true })).toHaveValue("harmo");
  });

  test("with a two-factor code, a new code waits 30 seconds, counting down, and waits again once sent", async ({ page }) => {
    const container = await example(page, "sign-in-form-with-a-two-factor-code");
    const form = container.locator(".hauth-form").first();
    await page.clock.install({ time: new Date("2026-01-01T09:00:00") });
    await page.clock.pauseAt(new Date("2026-01-01T09:00:10"));
    await form.getByLabel("Email").fill("sam@example.com");
    await form.getByLabel("Password", { exact: true }).fill("harmo");
    await form.getByRole("button", { name: "Sign in" }).click();
    await page.clock.runFor(800);
    const card = container.locator(".hauth-form:not([hidden])");
    const again = card.getByRole("button", { name: /^Send a new code/ });
    await expect(again).toHaveText("Send a new code in 0:30");
    await expect(again).toHaveAttribute("aria-disabled", "true");
    await expectPostsElsewhere(again);
    await page.clock.runFor(6000);
    await expect(again).toHaveText("Send a new code in 0:24");
    await page.clock.runFor(24000);
    await expect(again).toHaveText("Send a new code");
    await expect(again).not.toHaveAttribute("aria-disabled");
    await again.click();
    await page.clock.runFor(800);
    await expect(card.locator(".hauth-form-description")).toHaveText("We've sent a new code to sam@example.com.");
    await expect(again).toHaveText("Send a new code in 0:30");
  });
});
