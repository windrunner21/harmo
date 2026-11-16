import { expect, type Locator, type Page } from "@playwright/test";
import {
  animations,
  boxes,
  example,
  expectPosts,
  expectShakeToEndOnItsOwn,
  fadingIn,
  movedFrom,
  onEachPlayground,
  release,
  resizing,
  settled,
  shakesOf,
  slowDownSteps,
  test,
} from "./playgrounds.ts";

// What docs/patterns/reset-password.md says, on the Reset Password page.
// Asking for a link: a raised Card with the email, Continue, and a link back
// to sign in, in a band along the card's bottom; the email is checked first,
// and an error goes under it, moves focus to it, and shakes the form once,
// unless reduced motion is asked for;
// then "Check your email" takes the form's place, its title taking focus,
// never saying whether an account uses the address, with resend, try another
// email, and, for a known inbox, a button that opens it. Choosing the new
// password: Password Input's strength, a confirmation, an error for each
// thing wrong, then "Your password was updated". At each step, the card's
// height goes from the old step's to the new one's, easing out, the
// new step fading in and the band along its bottom moving with its edge,
// and nothing is left inline; under reduced motion, it changes size at once
// and still fades. A message the app gives for a field goes under that field,
// and a request that fails says "Something went wrong. Try again." Each form
// posts its named fields, so one sent before its script runs keeps what was
// typed out of the page's address; the sent step holds the address in a
// hidden input, which resend, a submit button, posts again, and "try another
// email" is a link to the page. The examples' stand-ins fail to send to an
// address at example.org, say one at gmial.com can't receive email, fail for
// error@example.com, and turn down "Password123!" and "MyOldPassword1!".
const requestParts = async (page: Page, id = "reset-password-default") => {
  const container = await example(page, id);
  const form = container.locator(".hauth-form");
  return {
    form,
    email: form.getByLabel("Email"),
    button: form.getByRole("button", { name: "Continue" }),
    title: form.getByRole("heading"),
    signIn: form.getByRole("link", { name: "Return to sign in" }),
  };
};

const newPasswordParts = async (page: Page) => {
  const container = await example(page, "reset-password-new-password");
  const form = container.locator(".hauth-form");
  return {
    form,
    password: form.getByLabel("New password", { exact: true }),
    confirmation: form.getByLabel("Confirm new password"),
    button: form.getByRole("button", { name: "Reset password" }),
  };
};

const errorOf = (input: Locator) =>
  input.evaluate((node) => document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)?.textContent ?? "");

const sendTo = async (page: Page, address: string, id?: string) => {
  const parts = await requestParts(page, id);
  await parts.email.fill(address);
  await parts.button.click();
  await expect(parts.form.getByRole("heading", { name: "Check your email" })).toBeFocused();
  return parts;
};

onEachPlayground("reset-password", () => {
  test("a raised Card: the title and its description, the email, a button the form's width, and the link back in a band under it", async ({ page }) => {
    const { form, email, button, title, signIn } = await requestParts(page);
    await expect(form).toHaveAttribute("data-variant", "raised");
    await expect(form).toHaveCSS("padding-top", "42px");
    await expect(title).toHaveText("Reset your password");
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(email).toHaveValue("");
    const [box, submit, footer, link] = await boxes(form, button, form.locator(".hauth-form-footer"), signIn);
    expect(submit!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    // Inset 6px from the card's sides and bottom, inside its 1px border, as
    // far under the button as the title is under the card's top edge.
    expect(footer!.x).toBeCloseTo(box!.x + 7, 0);
    expect(footer!.width).toBeCloseTo(box!.width - 2 * 7, 0);
    expect(footer!.y + footer!.height).toBeCloseTo(box!.y + box!.height - 7, 0);
    expect(footer!.y - (submit!.y + submit!.height)).toBeCloseTo(42, 0);
    expect(link!.x + link!.width / 2).toBeCloseTo(footer!.x + footer!.width / 2, 0);
    await expect(signIn).toHaveAttribute("href", "/sign-in");
  });

  test("continued with nothing typed, the email says what's missing, takes focus, and the form shakes", async ({ page }) => {
    const { form, email, button } = await requestParts(page);
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your email address.");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    expect(await animations(form)).toBe(1);
  });

  test("the shake ends with its own animation, not with one inside the form, such as the loading button's spinner appearing", async ({ page }) => {
    const request = await requestParts(page);
    await expectShakeToEndOnItsOwn(request.form, () => request.button.click());
    const choosing = await newPasswordParts(page);
    await expectShakeToEndOnItsOwn(choosing.form, () => choosing.button.click());
  });

  test("an email that isn't an address says so, and typing takes the error away", async ({ page }) => {
    const { email, button } = await requestParts(page);
    await email.fill("sam");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter an email address, such as name@example.com.");
    await email.pressSequentially("@example.com");
    await expect.poll(() => errorOf(email)).toBe("");
    await expect(email).not.toHaveAttribute("aria-invalid");
  });

  test("a link that can't be sent: the button works for a moment, then the message goes under the email, which takes focus", async ({ page }) => {
    const { form, email, button } = await requestParts(page);
    await email.fill("sam@example.org");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.locator(".hspinner")).toHaveCount(1);
    await expect.poll(() => errorOf(email)).toBe("We couldn't send the email. Try again in a moment.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(email).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
  });

  test("a message the app gives for the email goes under it, which takes focus, and the form shakes", async ({ page }) => {
    const { form, email, button } = await requestParts(page);
    await email.fill("sam@gmial.com");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("We can't deliver email to gmial.com. Did you mean gmail.com?");
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    await expect(form.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  });

  test("every form posts its named fields, so one sent before its script runs keeps what was typed out of the page's address", async ({ page }) => {
    const forms = page.locator(".play-demo form");
    await expect(forms).toHaveCount(3);
    await expectPosts(forms.nth(0), ["email"]);
    await expectPosts(forms.nth(1), ["email"]);
    await expectPosts(forms.nth(2), ["password", "confirmation"]);
    // Sent, the address goes in a hidden input, the step's only field.
    const { form } = await sendTo(page, "sam@example.com");
    await expectPosts(form, ["email"]);
    await expect(form.locator('input[type="hidden"][name="email"]')).toHaveValue("sam@example.com");
  });

  test("a request that fails says something went wrong, under the email, and the form shakes", async ({ page }) => {
    const { form, email, button } = await requestParts(page);
    await email.fill("error@example.com");
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Something went wrong. Try again.");
    await expect(email).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
  });

  test("a sent link: \"Check your email\" takes the form's place, its title takes focus, and it never says whether an account uses the address", async ({ page }) => {
    const { form, email, signIn } = await sendTo(page, "sam@example.com");
    const title = form.getByRole("heading", { name: "Check your email" });
    await expect(title).toHaveCSS("outline-style", "none");
    await expect(email).toHaveCount(0);
    await expect(form.getByRole("button", { name: "Continue" })).toHaveCount(0);
    await settled(form);
    const [first, second] = await boxes(form.locator(".hauth-form-description").first(), form.locator(".hauth-form-description").nth(1));
    await expect(form.locator(".hauth-form-description").first()).toHaveText(
      "If an account uses sam@example.com, we've sent a link there to reset your password.",
    );
    await expect(form.locator(".hauth-form-description").nth(1)).toHaveText(
      "If you didn't receive an email, check your spam, resend, or try another email.",
    );
    expect(second!.y - (first!.y + first!.height)).toBeCloseTo(16, 0);
    await expect(form.locator(".hauth-form-email")).toHaveCSS("font-weight", "500");
    // No inbox it knows, so no button to open one.
    await expect(form.locator(".hbutton")).toHaveCount(0);
    await expect(signIn).toBeVisible();
  });

  test("a step change animates the card's height from the old step's to the new one's, fading in the new step, moving the band with the card's edge, and leaving nothing inline", async ({ page }) => {
    await slowDownSteps(await example(page, "reset-password-default"));
    const { form, email, button } = await requestParts(page);
    const footer = form.locator(".hauth-form-footer");
    const [before] = await boxes(form);
    await email.fill("sam@example.com");
    await button.click();
    await expect(form.getByRole("heading", { name: "Check your email" })).toBeFocused();

    const resize = await resizing(form);
    expect(resize, "a size animation").toBeDefined();
    expect(resize!.from).toBeCloseTo(before!.height, 0);
    expect(resize!.to).toBeLessThan(resize!.from);
    expect(resize!.height).toBeLessThanOrEqual(resize!.from);
    expect(resize!.height).toBeGreaterThan(resize!.to);
    expect(resize!.easing).toBe("cubic-bezier(0.215, 0.61, 0.355, 1)");
    await expect(form).toHaveCSS("overflow", "clip");
    expect(await fadingIn(form.locator(".hauth-form-header"))).toBe(true);
    // The band stays, so it doesn't fade: it starts where it was, as far
    // under the new step's as the card shrinks.
    expect(await fadingIn(footer)).toBe(false);
    expect(parseFloat((await movedFrom(footer))!.split(" ")[1]!)).toBeCloseTo(resize!.from - resize!.to, 0);

    await release(form);
    await release(footer);
    await expect(form).not.toHaveAttribute("style");
    const [after] = await boxes(form);
    expect(after!.height).toBeCloseTo(resize!.to, 0);
  });

  test("a step change while the card resizes starts from the height it has then", async ({ page }) => {
    await slowDownSteps(await example(page, "reset-password-default"));
    const { form } = await sendTo(page, "sam@example.com");
    const halfway = await form.evaluate((node) => {
      const animation = node.getAnimations().find((each) => each.id === "harmo-step-resize")!;
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
      return parseFloat(getComputedStyle(node).height);
    });
    await form.getByRole("link", { name: "try another email", exact: true }).click();
    await expect(form.getByRole("heading", { name: "Reset your password" })).toBeFocused();
    const resize = await resizing(form);
    expect(resize!.from).toBeCloseTo(halfway, 0);
    expect(resize!.to).toBeGreaterThan(resize!.from);
  });

  test("under reduced motion, a step change sizes the card at once, and the new step still fades in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await slowDownSteps(await example(page, "reset-password-default"));
    const { form } = await sendTo(page, "sam@example.com");
    expect(await resizing(form)).toBeUndefined();
    expect(await animations(form)).toBe(0);
    expect(await animations(form.locator(".hauth-form-footer"))).toBe(0);
    await expect(form).not.toHaveAttribute("style");
    expect(await fadingIn(form.locator(".hauth-form-header"))).toBe(true);
  });

  test("resend is a submit button, and try another email a link to the page, both read as the links beside them", async ({ page }) => {
    const { form, signIn } = await sendTo(page, "sam@example.com");
    // The shorter step brings the band up under the pointer, left where
    // Continue was, which would hover "Return to sign in": its color then
    // fades back once the pointer leaves.
    await page.mouse.move(0, 0);
    await settled(signIn);
    const another = form.getByRole("link", { name: "try another email", exact: true });
    await expect(another).toHaveAttribute("href", "");
    await expect(another).toHaveCSS("text-decoration-line", "underline");
    await expect(another).toHaveCSS("color", await signIn.evaluate((node) => getComputedStyle(node).color));
    for (const name of ["resend"]) {
      const action = form.getByRole("button", { name, exact: true });
      await expect(action).toHaveAttribute("type", "submit");
      await expect(action).toHaveCSS("text-decoration-line", "underline");
      await expect(action).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(action).toHaveCSS("border-top-width", "0px");
      await expect(action).toHaveCSS("padding-left", "0px");
      await expect(action).toHaveCSS("font-size", "14px");
      await expect(action).toHaveCSS("color", await signIn.evaluate((node) => getComputedStyle(node).color));
    }
  });

  test("resent: the same title again takes focus, saying the link went again, with Try another email and a link to support", async ({ page }) => {
    const { form } = await sendTo(page, "sam@example.com");
    const title = form.getByRole("heading", { name: "Check your email" });
    await form.getByRole("button", { name: "resend", exact: true }).click();
    await expect(form.locator(".hauth-form-description").first()).toHaveText(
      "If an account uses sam@example.com, we've sent the link there again.",
    );
    await expect(title).toBeFocused();
    await expect(form.locator(".hauth-form-description").nth(1)).toHaveText(
      "If you still didn't receive an email, this might be the wrong email for your account. Try another email or contact our support.",
    );
    await expect(form.getByRole("button", { name: "resend", exact: true })).toHaveCount(0);
    await expect(form.getByRole("link", { name: "contact our support" })).toHaveAttribute("href", "/contact");
    await expect(form.getByRole("link", { name: "contact our support" })).toHaveAttribute("data-underlined", "");
    await expect(form.getByRole("link", { name: "Return to sign in" })).toBeVisible();
  });

  test("try another email puts the email back as it was typed, and focus on the title", async ({ page }) => {
    const { form, email } = await sendTo(page, "sam@example.com");
    await form.getByRole("link", { name: "try another email", exact: true }).click();
    await expect(form.getByRole("heading", { name: "Reset your password" })).toBeFocused();
    await expect(email).toHaveValue("sam@example.com");
    expect(await errorOf(email)).toBe("");

    await form.getByRole("button", { name: "Continue" }).click();
    await form.getByRole("button", { name: "resend", exact: true }).click();
    await form.getByRole("link", { name: "Try another email", exact: true }).click();
    await expect(form.getByRole("heading", { name: "Reset your password" })).toBeFocused();
    await expect(email).toHaveValue("sam@example.com");
  });

  test("filled in with an address at Gmail, the button opens Gmail's inbox in a new tab, as wide as the form", async ({ page }) => {
    const { form, email, button } = await requestParts(page, "reset-password-with-the-email-filled-in");
    await expect(email).toHaveValue("sam@gmail.com");
    await button.click();
    const open = form.getByRole("link", { name: "Open Gmail" });
    await expect(open).toHaveAttribute("href", "https://mail.google.com/");
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(open).toHaveAttribute("rel", "noopener noreferrer");
    await expect(open).toHaveClass("hbutton");
    const [box, link] = await boxes(form, open);
    expect(link!.width).toBeCloseTo(box!.width - 2 * 43, 0);
    // Sent again, there's no button.
    await form.getByRole("button", { name: "resend", exact: true }).click();
    await expect(form.locator(".hauth-form-description").first()).toContainText("again");
    await expect(open).toHaveCount(0);
  });

  test("Outlook, Hotmail, Live, and Yahoo addresses get a button for their inbox; others don't", async ({ page }) => {
    const inboxes = [
      ["sam@outlook.com", "Open Outlook", "https://outlook.live.com/"],
      ["sam@Hotmail.com", "Open Outlook", "https://outlook.live.com/"],
      ["sam@live.com", "Open Outlook", "https://outlook.live.com/"],
      ["sam@yahoo.co.uk", "Open Yahoo Mail", "https://mail.yahoo.com/"],
      ["sam@gmail.co", undefined, undefined],
    ] as const;
    for (const [address, name, href] of inboxes) {
      const { form } = await sendTo(page, address);
      if (name) await expect(form.getByRole("link", { name })).toHaveAttribute("href", href);
      else await expect(form.locator(".hbutton")).toHaveCount(0);
      await form.getByRole("link", { name: "try another email", exact: true }).click();
    }
  });

  test("under reduced motion, a failed continue doesn't shake the form", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { form, email, button } = await requestParts(page);
    await button.click();
    await expect.poll(() => errorOf(email)).toBe("Enter your email address.");
    expect(await animations(form)).toBe(0);
  });

  test("a new password with nothing typed: each field says what's missing, the new password takes focus, and the form shakes", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("Enter a new password.");
    expect(await errorOf(confirmation)).toBe("Enter the new password again.");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(confirmation).toHaveAttribute("aria-invalid", "true");
    await expect(password).toBeFocused();
    expect(await animations(form)).toBe(1);
  });

  test("a password the meter rates too weak says so, and stays invalid, without the error, until it's long enough", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await password.fill("short");
    await confirmation.fill("short");
    await expect(form.locator(".hpassword-strength")).toHaveText("Too weak");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("Choose a stronger password.");
    expect(await errorOf(confirmation)).toBe("");
    await expect(confirmation).not.toHaveAttribute("aria-invalid");
    await expect(password).toBeFocused();

    await password.press("End");
    await password.pressSequentially("er");
    await expect.poll(() => errorOf(password)).toBe("");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await password.pressSequentially("-still");
    await expect(form.locator(".hpassword-strength")).toHaveText("Medium");
    await expect(password).not.toHaveAttribute("aria-invalid");
  });

  test("two passwords that don't match both say so, and typing in either takes both errors away", async ({ page }) => {
    const { password, confirmation, button } = await newPasswordParts(page);
    await password.fill("Harmo-is-great-1");
    await confirmation.fill("Harmo-is-great-2");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("Passwords must match.");
    expect(await errorOf(confirmation)).toBe("Passwords must match.");
    await expect(password).toBeFocused();

    await confirmation.fill("Harmo-is-great-1");
    await expect.poll(() => errorOf(password)).toBe("");
    expect(await errorOf(confirmation)).toBe("");
    await expect(password).not.toHaveAttribute("aria-invalid");
    await expect(confirmation).not.toHaveAttribute("aria-invalid");
  });

  test("a password the app turns down: the button works for a moment, then its message goes under the new password", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await password.fill("Password123!");
    await confirmation.fill("Password123!");
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect.poll(() => errorOf(password)).toBe("This password is too common. Choose another.");
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(password).toBeFocused();
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
  });

  test("a message the app gives for a field, here the new password, goes under it, which takes focus, and the form shakes", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await password.fill("MyOldPassword1!");
    await confirmation.fill("MyOldPassword1!");
    await button.click();
    await expect.poll(() => errorOf(password)).toBe("You've used this password before. Choose a new one.");
    await expect.poll(() => shakesOf(form)).toBeGreaterThan(0);
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toBeFocused();
    expect(await errorOf(confirmation)).toBe("");
    await expect(confirmation).not.toHaveAttribute("aria-invalid");
    await expect(form.getByRole("heading", { name: "Your password was updated" })).toHaveCount(0);
  });

  test("a saved password: \"Your password was updated\" takes the form's place, its title takes focus, and Continue leads on", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await password.fill("Harmo-is-great-1");
    await confirmation.fill("Harmo-is-great-1");
    await button.click();
    const title = form.getByRole("heading", { name: "Your password was updated" });
    await expect(title).toBeFocused();
    await expect(title).toHaveCSS("outline-style", "none");
    await expect(password).toHaveCount(0);
    const onward = form.getByRole("link", { name: "Continue" });
    await expect(onward).toHaveAttribute("href", "/sign-in");
    const [box, link] = await boxes(form, onward);
    expect(link!.width).toBeCloseTo(box!.width - 2 * 43, 0);
  });

  test("a saved password: the card's height goes to \"Your password was updated\"'s as it fades in, and nothing is left inline", async ({ page }) => {
    const { form, password, confirmation, button } = await newPasswordParts(page);
    await password.fill("Harmo-is-great-1");
    await confirmation.fill("Harmo-is-great-1");
    // The strength's details open as the password is typed, at their own
    // pace, and the card is as tall as they leave it.
    await settled(form.locator(".hpassword-details"));
    await slowDownSteps(await example(page, "reset-password-new-password"));
    const [before] = await boxes(form);
    await button.click();
    const title = form.getByRole("heading", { name: "Your password was updated" });
    await expect(title).toBeFocused();
    const resize = await resizing(form);
    expect(resize!.from).toBeCloseTo(before!.height, 0);
    expect(resize!.to).toBeLessThan(resize!.from);
    expect(await fadingIn(title)).toBe(true);
    await release(form);
    await expect(form).not.toHaveAttribute("style");
    const [after] = await boxes(form);
    expect(after!.height).toBeCloseTo(resize!.to, 0);
  });

  test("an expired link: a warning Banner, with an underlined link to request a new one, centered at the forms' width", async ({ page }) => {
    const container = await example(page, "reset-password-expired-link");
    const banner = container.locator(".hbanner");
    const [demo, box] = await boxes(container.locator(".play-demo"), banner);
    expect(box!.width).toBeCloseTo(400, 0);
    expect(box!.x + box!.width / 2).toBeCloseTo(demo!.x + demo!.width / 2, 0);
    await expect(banner).toHaveAttribute("data-status", "warning");
    await expect(banner.locator(".hbanner-message")).toHaveText(
      "This link to reset your password has expired or can no longer be used. Request a new one.",
    );
    const link = banner.getByRole("link", { name: "Request a new one" });
    await expect(link).toHaveAttribute("href", "/reset-password");
    await expect(link).toHaveCSS("text-decoration-line", "underline");
  });
});
