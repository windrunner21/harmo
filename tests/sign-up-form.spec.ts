import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, expectPosts, expectPostsElsewhere, expectShakeToEndOnItsOwn, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/patterns/sign-up-form.md says, on the Sign-up Form page: a raised
// Card with the name, the email, a new password with its strength, a line of
// fine print under the button that creating an account agrees to the terms,
// and a band along its bottom to sign in instead; the fields are checked
// before signing up; a failed sign-up puts its error under the email, moves
// focus to the first field in error, and shakes the form once, unless reduced
// motion is asked for. Without the terms, there's no line; with a checkbox for
// them instead, signing up needs it checked. That checkbox and the box for
// marketing emails, which starts unchecked and isn't needed, are small
// Fields, their labels secondary text; the links in the line and in the
// terms' label are medium rather than underlined. Other accounts follow the
// line, under "or", one to a row, or two with four or more. A message the app
// gives for a field goes under that field instead, its strength stepping
// aside while it shows, and a request that fails says "Something went wrong.
// Try again." The form posts its named fields, so one sent before its script
// runs keeps the password out of the page's address. Asked to confirm the
// email, every address goes to the next step: "Check your email", by link, or
// Verify Code, by code, in the form's place, the form staying hidden with
// what was typed until "use another email". The examples' stand-in finds an
// account already using sam@example.com, but for those that confirm the
// email, says "Password123!" has appeared in a data breach, fails for
// error@example.com, and signs up anything else; 123456 is the code.
const parts = async (page: Page, id = "sign-up-form-default") => {
  const container = await example(page, id);
  const form = container.locator(".hauth-form").first();
  return {
    form,
    name: form.getByLabel("Name", { exact: true }),
    email: form.getByLabel("Email", { exact: true }),
    password: form.getByLabel("Password", { exact: true }),
    terms: form.getByRole("checkbox", { name: /^I agree to the Terms of Service/ }),
    agreement: form.locator(".hsign-up-form-agreement"),
    button: form.getByRole("button", { name: "Create account" }),
    signIn: form.getByRole("link", { name: "Sign in" }),
  };
};
const errorElement = async (input: Locator) => {
  const id = (await input.getAttribute("aria-describedby"))?.split(" ").find((id) => id.endsWith("-error"));
  return input.page().locator(`[id="${id}"]`);
};
const color = (page: Page, name: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.backgroundColor = `var(${name})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);
const errorOf = (input: Locator) =>
  input.evaluate((node) => document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)?.textContent ?? "");

// Fills in every field so that it passes, but for what a test changes after,
// and checks the terms' box, in a form with one.
const fillIn = async ({ name, email, password, terms }: Awaited<ReturnType<typeof parts>>) => {
  await name.fill("Sam Lee");
  await email.fill("sam.lee@example.com");
  await password.fill("Correct.horse1");
  if (await terms.count()) await terms.check();
};
// A consent checkbox's Field is small: a 16px box beside a 13px label in
// secondary text, whose links are medium rather than underlined.
const expectSmall = async (checkbox: Locator) => {
  const row = checkbox.locator("xpath=..");
  const label = row.locator(":scope > .hlabel");
  await expect(row).toHaveAttribute("data-orientation", "horizontal");
  await expect(row).toHaveAttribute("data-size", "small");
  const [box] = await boxes(checkbox);
  expect(box!.width).toBeCloseTo(16, 0);
  expect(box!.height).toBeCloseTo(16, 0);
  await expect(label).toHaveCSS("font-size", "13px");
  await expect(label).toHaveCSS("color", await color(checkbox.page(), "--harmo-color-text-secondary"));
  for (const link of await label.locator(".hlink").all()) {
    await expect(link).toHaveCSS("font-weight", "600");
    await expect(link).toHaveCSS("text-decoration-line", "none");
  }
};

onEachPlayground("sign-up-form", () => {
  test("a raised Card: the terms' line and the band link out, and the button is the form's width", async ({ page }) => {
    const { form, button, signIn } = await parts(page);
    await expect(form.getByRole("checkbox")).toHaveCount(0);
    await expect(form).toHaveAttribute("data-variant", "raised");
    await expect(form).toHaveCSS("padding-top", "42px");
    const [box, submit] = await boxes(form, button);
    expect(submit!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    await expect(form.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    await expect(form.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    await expect(signIn).toHaveAttribute("href", "/sign-in");
    await expect(form.locator(".hauth-form-footer")).toHaveText("Already have an account? Sign in");
  });

  test("the terms' line is 13px secondary text, centered 10px under the button, which it describes", async ({ page }) => {
    const { form, button, agreement } = await parts(page);
    const words = "By creating an account, you agree to our Terms of Service and Privacy Policy.";
    await expect(agreement).toHaveText(words);
    await expect(button).toHaveAccessibleDescription(words);
    await expect(agreement).toHaveCSS("font-size", "13px");
    await expect(agreement).toHaveCSS("font-weight", "400");
    await expect(agreement).toHaveCSS("text-align", "center");
    await expect(agreement).toHaveCSS("color", await color(page, "--harmo-color-text-secondary"));
    const [submit, line] = await boxes(button, agreement);
    expect(line!.y - (submit!.y + submit!.height)).toBeCloseTo(10, 0);
    expect(line!.x).toBeCloseTo(submit!.x, 0);
    expect(line!.width).toBeCloseTo(submit!.width, 0);
    // Told from the text around them by weight, not only color.
    for (const link of [form.getByRole("link", { name: "Terms of Service" }), form.getByRole("link", { name: "Privacy Policy" })]) {
      await expect(link).toHaveCSS("font-weight", "600");
      await expect(link).toHaveCSS("text-decoration-line", "none");
    }
  });

  test("the line to sign in is a tinted band inset a small step from the card's sides and bottom, 42px under the terms' line", async ({ page }) => {
    const { form, agreement, signIn } = await parts(page);
    const footer = form.locator(".hauth-form-footer");
    const [box, line, band] = await boxes(form, agreement, footer);
    // 6px inside the card's 1px border, so the card frames it on all sides.
    expect(band!.x).toBeCloseTo(box!.x + 7, 0);
    expect(band!.width).toBeCloseTo(box!.width - 2 * 7, 0);
    expect(band!.y + band!.height).toBeCloseTo(box!.y + box!.height - 7, 0);
    // As far under what's above it as the title is under the card's top edge.
    expect(band!.y - (line!.y + line!.height)).toBeCloseTo(42, 0);
    await expect(footer).toHaveCSS("padding", "16px 36px");
    await expect(footer).toHaveCSS("text-align", "center");
    await expect(footer).toHaveCSS("font-size", "14px");
    await expect(footer).toHaveCSS("color", await color(page, "--harmo-color-text-secondary"));
    await expect(footer).toHaveCSS("background-color", await color(page, "--harmo-color-background-secondary"));
    await expect(footer).toHaveCSS("border-top-width", "0px");
    for (const corner of ["top-left", "top-right", "bottom-left", "bottom-right"])
      await expect(footer).toHaveCSS(`border-${corner}-radius`, "4px");
    await expect(signIn).toHaveCSS("text-decoration-line", "underline");
    await expect(signIn).toHaveCSS("font-weight", "400");
  });

  test("signed up with nothing typed, each field says what's missing, the name takes focus, and the form shakes", async ({ page }) => {
    const { form, name, email, password, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(name)).toBe("Enter your name.");
    expect(await errorOf(email)).toBe("Enter your email address.");
    expect(await errorOf(password)).toBe("Enter a password.");
    for (const input of [name, email, password]) await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    expect(await form.evaluate((node) => node.getAnimations().length)).toBe(1);
  });

  test("the shake ends with its own animation, not with one inside the form, such as the loading button's spinner appearing", async ({ page }) => {
    const { form, button } = await parts(page);
    await expectShakeToEndOnItsOwn(form, () => button.click());
  });

  test("with a terms checkbox, there's no line, and the box is small, its label secondary text, its links medium", async ({ page }) => {
    const { form, terms, button, agreement } = await parts(page, "sign-up-form-with-a-terms-checkbox");
    await expect(agreement).toHaveCount(0);
    await expect(button).not.toHaveAttribute("aria-describedby");
    await expect(terms).not.toBeChecked();
    await expect(terms).toHaveAttribute("name", "terms");
    await expectSmall(terms);
    await expect(form.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    await expect(form.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    const [box, submit] = await boxes(terms, button);
    expect(box!.y).toBeLessThan(submit!.y);
    // Its quieter color gives way to a label's hover color.
    const label = form.locator(".hsign-up-form-terms .hlabel");
    await label.hover({ position: { x: 4, y: 10 } });
    await expect(label).toHaveCSS("color", await color(page, "--harmo-color-primary-hover"));
  });

  test("with a terms checkbox, signing up needs it: its error is 6px under it, where its label starts, and checking it takes the error away", async ({ page }) => {
    const elements = await parts(page, "sign-up-form-with-a-terms-checkbox");
    const { form, name, terms, button } = elements;
    const block = form.locator(".hsign-up-form-terms");
    const row = block.locator(":scope > .hfield");
    // An empty error takes no room.
    const [before, line] = await boxes(block, row);
    expect(before!.height).toBeCloseTo(line!.height, 0);

    await button.click();
    const error = await errorElement(terms);
    await expect(error).toHaveText("Agree to the terms to create your account.");
    await expect(terms).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    await settled(form);
    await settled(error);
    const [after, label, message] = await boxes(row, row.locator(".hlabel"), error);
    expect(message!.x).toBeCloseTo(label!.x, 0);
    expect(message!.y - (after!.y + after!.height)).toBeCloseTo(6, 0);

    await terms.check();
    await expect.poll(() => errorOf(terms)).toBe("");
    await expect(terms).not.toHaveAttribute("aria-invalid");

    await fillIn(elements);
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    expect(await errorOf(terms)).toBe("");
  });

  test("an email that isn't an address says so, and typing in it takes its error away", async ({ page }) => {
    const elements = await parts(page);
    const { name, email, password, button } = elements;
    await fillIn(elements);
    await email.fill("sam");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter an email address, such as name@example.com.");
    for (const input of [name, password]) expect(await errorOf(input)).toBe("");
    await expect(email).toBeFocused();
    await email.pressSequentially("@example.com");
    await expect.poll(() => errorOf(email)).toBe("");
    await expect(email).not.toHaveAttribute("aria-invalid");
  });

  test("a password that's too weak says so; typing takes the error away, and it stays invalid while it's too weak", async ({ page }) => {
    const elements = await parts(page);
    const { form, password, button } = elements;
    await fillIn(elements);
    await password.fill("short");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("Choose a stronger password.");
    await expect(form.locator(".hpassword-strength")).toHaveText("Too weak");
    await expect(password).toBeFocused();
    await password.pressSequentially("er");
    await expect.poll(() => errorOf(password)).toBe("");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await password.fill("Shorter.by1");
    await expect(password).not.toHaveAttribute("aria-invalid");
  });

  test("an email with an account: the button works for a moment, then the error goes under the email, which takes focus", async ({ page }) => {
    const elements = await parts(page);
    const { form, email, password, button } = elements;
    await fillIn(elements);
    await email.fill("sam@example.com");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect.poll(() => errorOf(email)).toBe("An account already uses that email.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(email).toBeFocused();
    await expect(form).toHaveAttribute("data-shake", "");
    expect(await errorOf(password)).toBe("");
  });

  test("a message the app gives for a field, here the password, goes under that field, which takes focus, and the form shakes", async ({ page }) => {
    const elements = await parts(page);
    const { form, name, email, password, button } = elements;
    await fillIn(elements);
    await password.fill("Password123!");
    await expect(form.locator(".hpassword-strength")).toHaveText("Strong");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("This password has appeared in a data breach. Choose another.");
    await expect(form).toHaveAttribute("data-shake", "");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toBeFocused();
    for (const input of [name, email]) {
      expect(await errorOf(input)).toBe("");
      await expect(input).not.toHaveAttribute("aria-invalid");
    }
  });

  test("any other email signs up, with no error", async ({ page }) => {
    const elements = await parts(page);
    const { name, email, password, button } = elements;
    await fillIn(elements);
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    for (const input of [name, email, password]) {
      expect(await errorOf(input)).toBe("");
      await expect(input).not.toHaveAttribute("aria-invalid");
    }
  });

  test("every form posts its named fields, so one sent before its script runs keeps what was typed out of the page's address", async ({ page }) => {
    const forms = page.locator(".play-demo form");
    await expect(forms).toHaveCount(9);
    for (const form of await forms.all()) await expectPosts(form);
    const { form, email, password, terms } = await parts(page, "sign-up-form-with-a-terms-checkbox");
    await expectPosts(form, ["name", "email", "password"]);
    await terms.check();
    await expectPosts(form, ["name", "email", "password", "terms"]);
    const marketing = (await parts(page, "sign-up-form-with-marketing-emails")).form;
    await marketing.getByRole("checkbox", { name: "Email me product news and tips" }).check();
    await expectPosts(marketing, ["name", "email", "password", "marketing"]);
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(password).toHaveAttribute("autocomplete", "new-password");
  });

  test("a request that fails says something went wrong, under the email, and the form shakes", async ({ page }) => {
    const elements = await parts(page);
    const { form, email, button } = elements;
    await fillIn(elements);
    await email.fill("error@example.com");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Something went wrong. Try again.");
    await expect(email).toBeFocused();
    await expect(form).toHaveAttribute("data-shake", "");
  });

  test("while the password shows a message, its strength steps aside, and comes back once typing takes the message away", async ({ page }) => {
    const elements = await parts(page);
    const { form, password, button } = elements;
    const word = form.locator(".hpassword-strength");
    const details = form.locator(".hpassword-details");
    await fillIn(elements);
    await password.fill("Password123!");
    await expect(word).toHaveText("Strong");
    await expect(word).toBeVisible();
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("This password has appeared in a data breach. Choose another.");
    await expect(word).toBeHidden();
    await expect(details).toHaveAttribute("hidden", "");
    expect((await password.getAttribute("aria-describedby"))?.split(" ")).toHaveLength(1);
    await password.press("End");
    await password.pressSequentially("x");
    await expect.poll(() => errorOf(password)).toBe("");
    await expect(word).toBeVisible();
    await expect(details).not.toHaveAttribute("hidden");
    expect((await password.getAttribute("aria-describedby"))?.split(" ")).toHaveLength(3);
  });

  test("under reduced motion, a failed sign-up doesn't shake the form", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { form, name, button } = await parts(page);
    await button.click();
    await expect.poll(() => errorOf(name)).toBe("Enter your name.");
    expect(await form.evaluate((node) => node.getAnimations().length)).toBe(0);
  });

  test("without the name, there's no name field, and the email is the first to take focus", async ({ page }) => {
    const { form, name, email, button } = await parts(page, "sign-up-form-without-the-name");
    await expect(name).toHaveCount(0);
    await expect(form.locator(".hfield:not([data-orientation])")).toHaveCount(2);
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your email address.");
    await expect(email).toBeFocused();
  });

  test("without the terms, there's no line or checkbox for them, and signing up doesn't ask for them", async ({ page }) => {
    const { form, name, email, password, button, agreement } = await parts(page, "sign-up-form-without-the-terms");
    await expect(agreement).toHaveCount(0);
    await expect(form.getByRole("checkbox")).toHaveCount(0);
    await expect(form.getByRole("link", { name: "Terms of Service" })).toHaveCount(0);
    await expect(button).not.toHaveAttribute("aria-describedby");
    await name.fill("Sam Lee");
    await email.fill("sam.lee@example.com");
    await password.fill("Correct.horse1");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    for (const input of [name, email, password]) expect(await errorOf(input)).toBe("");
  });

  test("with marketing emails, a small box after the password starts unchecked, and signing up doesn't need it", async ({ page }) => {
    const elements = await parts(page, "sign-up-form-with-marketing-emails");
    const { form, name, password, button, agreement } = elements;
    const marketing = form.getByRole("checkbox", { name: "Email me product news and tips" });
    await expect(form.getByRole("checkbox")).toHaveCount(1);
    await expect(marketing).not.toBeChecked();
    await expect(marketing).toHaveAttribute("name", "marketing");
    await expectSmall(marketing);
    const [field, box, submit] = await boxes(password, marketing, button);
    expect(box!.y).toBeGreaterThan(field!.y);
    expect(box!.y).toBeLessThan(submit!.y);
    await expect(agreement).toHaveCount(1);

    await button.click();
    await expect.poll(() => errorOf(name)).toBe("Enter your name.");
    await expect(marketing).not.toHaveAttribute("aria-invalid");

    await fillIn(elements);
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).not.toHaveAttribute("aria-busy");
    for (const input of [name, password]) expect(await errorOf(input)).toBe("");
    await marketing.check();
    await expect(marketing).toBeChecked();
  });

  test("with other accounts, \"or\" follows the terms' line, then a secondary link to each, as wide as the form, its logo first", async ({ page }) => {
    const { form, button, agreement } = await parts(page, "sign-up-form-with-other-accounts");
    const divider = form.locator(".hauth-form-divider");
    const footer = form.locator(".hauth-form-footer");
    const google = form.getByRole("link", { name: "Continue with Google" });
    const github = form.getByRole("link", { name: "Continue with GitHub" });
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
    for (const [link, slug] of [[google, "google"], [github, "github"]] as const) {
      await expect(link).toHaveAttribute("href", `/auth/${slug}`);
      await expect(link).toHaveAttribute("data-variant", "secondary");
      await expect(link).not.toHaveAttribute("aria-label");
    }
    await expect(google.locator(".hbutton-label")).toHaveText("Continue with Google");
    const [submit, terms, line, first, second, band, logo, label] = await boxes(
      button,
      agreement,
      divider,
      google,
      github,
      footer,
      google.locator(":scope > svg.hicon"),
      google.locator(":scope > .hbutton-label"),
    );
    for (const part of [line, first, second]) {
      expect(part!.x).toBeCloseTo(submit!.x, 0);
      expect(part!.width).toBeCloseTo(submit!.width, 0);
    }
    expect(terms!.y - (submit!.y + submit!.height)).toBeCloseTo(10, 0);
    expect(line!.y - (terms!.y + terms!.height)).toBeCloseTo(26, 0);
    expect(first!.y - (line!.y + line!.height)).toBeCloseTo(26, 0);
    expect(second!.y - (first!.y + first!.height)).toBeCloseTo(10, 0);
    expect(band!.y - (second!.y + second!.height)).toBeCloseTo(42, 0);
    expect(logo!.width).toBeCloseTo(20, 0);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(label!.x + 0.5);
  });

  test("with many other accounts, they go two to a row, each showing its name and named \"Continue with\" it", async ({ page }) => {
    const { form, button } = await parts(page, "sign-up-form-with-many-other-accounts");
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

  test("confirming by link, an address with an account still gets \"Check your email\", in the form's place, its title focused", async ({ page }) => {
    const elements = await parts(page, "sign-up-form-confirm-by-link");
    const { form, email, button } = elements;
    await fillIn(elements);
    await email.fill("sam@example.com");
    await button.click();
    const container = await example(page, "sign-up-form-confirm-by-link");
    const card = container.locator(".hauth-form:not([hidden])");
    await expect(card.getByRole("heading", { name: "Check your email" })).toBeFocused();
    await expect(form).toBeHidden();
    const [first, second] = await card.locator(".hauth-form-description").all();
    await expect(first!).toHaveText("We've sent a link to sam@example.com. Open it to confirm your email address.");
    await expect(second!).toHaveText("If you didn't receive an email, check your spam, resend, or use another email.");
    await expect(card.locator(".hauth-form-email")).toHaveCSS("font-weight", "500");
    // It holds the address, for its resend, and nothing else.
    await expectPosts(card, ["email"]);
    await expect(card.locator('input[type="hidden"][name="email"]')).toHaveValue("sam@example.com");
    await expect(card.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
    await expect(card.getByRole("link", { name: /^Open/ })).toHaveCount(0);
  });

  test("confirming by link, resend says the link went again, and use another email brings the form back as it was typed", async ({ page }) => {
    const elements = await parts(page, "sign-up-form-confirm-by-link");
    const { form, name, email, button } = elements;
    await fillIn(elements);
    await email.fill("sam@gmail.com");
    await button.click();
    const container = await example(page, "sign-up-form-confirm-by-link");
    const card = container.locator(".hauth-form:not([hidden])");
    const title = card.getByRole("heading", { name: "Check your email" });
    await expect(title).toBeFocused();
    const open = card.getByRole("link", { name: "Open Gmail" });
    await expect(open).toHaveAttribute("href", "https://mail.google.com/");
    await expect(open).toHaveAttribute("target", "_blank");

    const resend = card.getByRole("button", { name: "resend", exact: true });
    await expect(resend).toHaveAttribute("type", "submit");
    await resend.click();
    await expect(card.locator(".hauth-form-description").first()).toHaveText("We've sent the link to sam@gmail.com again.");
    await expect(title).toBeFocused();

    const another = card.getByRole("link", { name: "use another email" });
    await expect(another).toHaveAttribute("href", "");
    await another.click();
    await expect(form.getByRole("heading", { name: "Create your account" })).toBeFocused();
    await expect(container.locator(".hauth-form")).toHaveCount(1);
    await expect(name).toHaveValue("Sam Lee");
    await expect(email).toHaveValue("sam@gmail.com");
  });

  test("confirming by code, Verify Code takes the form's place, posting the code with the address, and Use another email brings the form back", async ({ page }) => {
    const elements = await parts(page, "sign-up-form-confirm-by-code");
    const { form, email, button } = elements;
    await fillIn(elements);
    await button.click();
    const container = await example(page, "sign-up-form-confirm-by-code");
    const card = container.locator(".hauth-form:not([hidden])");
    await expect(card.getByRole("heading", { name: "Check your email" })).toBeFocused();
    await expect(card.locator(".hauth-form-description")).toHaveText("We sent a 6-digit code to sam.lee@example.com.");
    await expectPosts(card, ["email", "code"]);
    await expectPostsElsewhere(card.getByRole("button", { name: /^Send a new code/ }));
    const code = card.getByLabel("Code");
    await code.pressSequentially("111111");
    await expect.poll(() => errorOf(code)).toBe("That code isn't right. Check it, or send a new one.");
    await code.pressSequentially("123456");
    await expect(card.getByRole("button", { name: "Verify" })).not.toHaveAttribute("aria-busy");
    await expect.poll(() => errorOf(code)).toBe("");
    await card.getByRole("link", { name: "Use another email" }).click();
    await expect(form.getByRole("heading", { name: "Create your account" })).toBeFocused();
    await expect(email).toHaveValue("sam.lee@example.com");
  });
});
