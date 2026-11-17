import { expect, type Locator, type Page } from "@playwright/test";
import {
  animations,
  boxes,
  colorOf,
  example,
  expectPosts,
  fadingIn,
  onEachPlayground,
  release,
  resizing,
  settled,
  shakesOf,
  slowDownSteps,
  test,
} from "./playgrounds.ts";

// What docs/patterns/account-forms.md says, on the Account Forms page: the
// Sign-in Form, the Sign-up Form, and Reset Password's request, all in the
// page from the start, one shown at a time. Their links are real links, and a
// plain click on one to another of the three shows that form in place: its
// card starts at the size of the one leaving, which goes at once, and its
// height goes to its own, easing out, as its content fades in, with
// nothing left inline; under reduced motion, it takes its own size at once,
// and still fades in. Its title takes focus, and the email typed so far comes
// with it. A click with a modifier key, or one the app has already handled,
// is left alone. Each form works inside as it does on its own page, with the
// stand-ins of its own examples, a message given for a field included, and
// posts, as it does there. With other accounts, the Sign-in and the
// Sign-up Forms both have the same ones under their buttons, and a click on
// one isn't caught. In a Dialog, which is their card, the forms take off their
// own frame and padding, their titles step down to <h3>s under the Dialog's
// <h2>, the steps' titles too, and they switch in place as anywhere else.
// What only CSS and the markup decide, such as the wrapper's lack of a box
// and the band under the Sign-in Form's button, is tested on the HTML
// playground.
const parts = async (page: Page, id = "account-forms-default") => {
  const container = await example(page, id);
  const root = container.locator(".haccount-forms");
  const form = (index: number) => {
    const form = root.locator(":scope > .haccount-forms-view").nth(index).locator(":scope > .hauth-form");
    return { form, title: form.locator(".hauth-form-title"), email: form.getByLabel("Email", { exact: true }) };
  };
  const signIn = form(0);
  const signUp = form(1);
  const reset = form(2);
  return {
    container,
    root,
    signIn: {
      ...signIn,
      password: signIn.form.getByLabel("Password", { exact: true }),
      button: signIn.form.getByRole("button", { name: "Sign in" }),
      toSignUp: signIn.form.getByRole("link", { name: "Sign up" }),
      toReset: signIn.form.getByRole("link", { name: "Forgot your password?" }),
    },
    signUp: {
      ...signUp,
      name: signUp.form.getByLabel("Name", { exact: true }),
      password: signUp.form.getByLabel("Password", { exact: true }),
      button: signUp.form.getByRole("button", { name: "Create account" }),
      toSignIn: signUp.form.getByRole("link", { name: "Sign in" }),
    },
    reset: {
      ...reset,
      button: reset.form.getByRole("button", { name: "Continue" }),
      toSignIn: reset.form.getByRole("link", { name: "Return to sign in" }),
    },
  };
};
const errorOf = (input: Locator) =>
  input.evaluate((node) => document.getElementById(`${node.getAttribute("aria-describedby")?.split(" ").find((id) => id.endsWith("-error"))}`)?.textContent ?? "");

onEachPlayground("account-forms", () => {
  test("starts at sign-in, the two other forms in the page but hidden, and its links real links to their pages", async ({ page }) => {
    const { root, signIn, signUp, reset } = await parts(page);
    await expect(root).toHaveCSS("display", "contents");
    await expect(signIn.form).toBeVisible();
    await expect(signUp.form).toBeHidden();
    await expect(reset.form).toBeHidden();
    await expect(signIn.toSignUp).toHaveAttribute("href", "/sign-up");
    await expect(signIn.toReset).toHaveAttribute("href", "/reset-password");
    // The wrapper takes no box, so the form is as wide as on its own page.
    const [box] = await boxes(signIn.form);
    expect(box!.width).toBeCloseTo(400, 0);
    // The form there as the page loads shows at once.
    expect(await animations(signIn.form)).toBe(0);
    expect(await animations(signIn.title)).toBe(0);
  });

  test("hidden hides the wrapper and a view, though neither takes a box", { tag: "@css" }, async ({ page }) => {
    const { root } = await parts(page);
    const view = root.locator(":scope > .haccount-forms-view").first();
    await expect(view).toHaveCSS("display", "contents");
    for (const element of [root, view]) {
      const display = await element.evaluate((node: HTMLElement) => {
        node.hidden = true;
        const { display } = getComputedStyle(node);
        node.hidden = false;
        return display;
      });
      expect(display).toBe("none");
    }
  });

  test("the Sign-in Form's band under its button leads to sign-up, its link underlined", { tag: "@css" }, async ({ page }) => {
    const { signIn } = await parts(page);
    const footer = signIn.form.locator(".hauth-form-footer");
    await expect(footer).toHaveText("Don't have an account? Sign up");
    await expect(footer).toHaveCSS("font-size", "14px");
    await expect(signIn.toSignUp).toHaveCSS("text-decoration-line", "underline");
    const [form, button, line] = await boxes(signIn.form, signIn.button, footer);
    expect(line!.y - (button!.y + button!.height)).toBeCloseTo(42, 0);
    // Inset 6px from the card's sides and bottom, inside its 1px border.
    expect(line!.width).toBeCloseTo(form!.width - 2 * 7, 0);
    expect(line!.y + line!.height).toBeCloseTo(form!.y + form!.height - 7, 0);
  });

  test("Sign up shows the Sign-up Form in place, fading in, its title focused, with the email typed so far", async ({ page }) => {
    const { container, signIn, signUp } = await parts(page);
    await slowDownSteps(container);
    const address = page.url();
    await signIn.email.fill("sam.lee@example.com");
    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();
    await expect(signUp.title).toHaveCSS("outline-style", "none");
    await expect(signIn.form).toBeHidden();
    await expect(signUp.email).toHaveValue("sam.lee@example.com");
    expect(await fadingIn(signUp.title)).toBe(true);
    expect(page.url()).toBe(address);
    const [box] = await boxes(signUp.form);
    expect(box!.width).toBeCloseTo(400, 0);
  });

  test("the card that shows starts at the size of the one leaving, its height going to its own, and nothing is left inline", async ({ page }) => {
    const { container, signIn, signUp } = await parts(page);
    await slowDownSteps(container);
    const [before] = await boxes(signIn.form);
    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();

    const resize = await resizing(signUp.form);
    expect(resize, "a size animation").toBeDefined();
    expect(resize!.from).toBeCloseTo(before!.height, 0);
    expect(resize!.to).toBeGreaterThan(resize!.from);
    expect(resize!.height).toBeLessThan(resize!.to);
    expect(resize!.easing).toBe("cubic-bezier(0.215, 0.61, 0.355, 1)");
    await expect(signUp.form).toHaveCSS("overflow", "clip");
    // The form leaving keeps nothing of the change.
    await expect(signIn.form).not.toHaveAttribute("style");

    await release(signUp.form);
    await expect(signUp.form).not.toHaveAttribute("style");
    const [after] = await boxes(signUp.form);
    expect(after!.height).toBeCloseTo(resize!.to, 0);
  });

  test("Forgot your password? shows Reset Password with the email filled in, and Return to sign in brings it back", async ({ page }) => {
    const { container, signIn, reset } = await parts(page);
    await slowDownSteps(container);
    await signIn.email.fill("sam@example.com");
    await signIn.toReset.click();
    await expect(reset.title).toBeFocused();
    await expect(reset.title).toHaveText("Reset your password");
    await expect(signIn.form).toBeHidden();
    await expect(reset.email).toHaveValue("sam@example.com");

    await reset.email.fill("sam@gmail.com");
    await reset.toSignIn.click();
    await expect(signIn.title).toBeFocused();
    await expect(reset.form).toBeHidden();
    await expect(signIn.email).toHaveValue("sam@gmail.com");
    // The form shown again fades in again.
    expect(await fadingIn(signIn.title)).toBe(true);
  });

  test("an empty email leaves the next form's as it was", async ({ page }) => {
    const { signIn, signUp } = await parts(page);
    await signIn.email.fill("sam@example.com");
    await signIn.toSignUp.click();
    await signUp.email.fill("");
    await signUp.toSignIn.click();
    await expect(signIn.title).toBeFocused();
    await expect(signIn.email).toHaveValue("sam@example.com");
  });

  test("a click with a modifier key, or one the app has already handled, is left alone", async ({ page }) => {
    const { signIn, signUp, reset } = await parts(page);
    await signIn.toSignUp.click({ modifiers: ["ControlOrMeta"] });
    await signIn.toReset.click({ modifiers: ["Shift"] });
    await signIn.toSignUp.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
    await signIn.toSignUp.click();
    await expect(signIn.form).toBeVisible();
    await expect(signUp.form).toBeHidden();
    await expect(reset.form).toBeHidden();
  });

  test("other links in the forms, such as the terms, aren't caught", async ({ page }) => {
    const { signIn, signUp } = await parts(page);
    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();
    await signUp.form.getByRole("link", { name: "Terms of Service" }).click();
    await expect(signUp.form).toBeVisible();
    await expect(signIn.form).toBeHidden();
  });

  test("under reduced motion, the card that shows takes its own size at once, and its content still fades in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const { container, signIn, signUp } = await parts(page);
    await slowDownSteps(container);
    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();
    expect(await resizing(signUp.form)).toBeUndefined();
    expect(await animations(signUp.form)).toBe(0);
    await expect(signUp.form).not.toHaveAttribute("style");
    expect(await fadingIn(signUp.title)).toBe(true);
  });

  test("the Sign-in Form works inside: its fields are checked, and a wrong password says so", async ({ page }) => {
    const { signIn } = await parts(page);
    await signIn.button.click();
    await expect.poll(() => errorOf(signIn.email)).toBe("Enter your email address.");
    await expect(signIn.email).toBeFocused();
    await signIn.email.fill("sam@example.com");
    await signIn.password.fill("wrong");
    await signIn.button.click();
    await expect.poll(() => errorOf(signIn.password)).toBe("The email or password is incorrect.");
    await expect(signIn.password).toBeFocused();
  });

  test("signing in, a toast says so where the app would go on", async ({ page }) => {
    const { signIn } = await parts(page);
    await signIn.email.fill("sam@example.com");
    await signIn.password.fill("harmo");
    await signIn.button.click();
    const toast = page.locator(".htoast:not([data-removed])");
    await expect(toast.locator(".htoast-title")).toHaveText("Signed in");
    await expect(toast.locator(".htoast-description")).toHaveText("Welcome back, sam@example.com.");
  });

  test("a message the app gives for a field reaches that field of its form: the email's, in the Sign-in Form", async ({ page }) => {
    const { signIn } = await parts(page);
    await signIn.email.fill("new@example.com");
    await signIn.password.fill("harmo");
    await signIn.button.click();
    await expect.poll(() => errorOf(signIn.email)).toBe("Confirm your email address first. We've sent you a new link.");
    await expect.poll(() => shakesOf(signIn.form)).toBeGreaterThan(0);
    await expect(signIn.email).toHaveAttribute("aria-invalid", "true");
    await expect(signIn.email).toBeFocused();
    expect(await errorOf(signIn.password)).toBe("");
  });

  test("every form posts, so one sent before its script runs keeps what was typed out of the page's address", async ({ page }) => {
    const forms = page.locator(".play-demo form");
    await expect(forms).toHaveCount(12);
    for (const form of await forms.all()) await expectPosts(form);
    const { signIn, signUp, reset } = await parts(page);
    await expectPosts(signIn.form, ["email", "password"]);
    await expectPosts(signUp.form, ["name", "email", "password"]);
    await expectPosts(reset.form, ["email"]);
  });

  test("the Sign-up Form works inside: its fields are checked, and the password's strength is rated", async ({ page }) => {
    const { signIn, signUp } = await parts(page);
    await signIn.toSignUp.click();
    await settled(signUp.form);
    await signUp.button.click();
    await expect.poll(() => errorOf(signUp.name)).toBe("Enter your name.");
    expect(await errorOf(signUp.email)).toBe("Enter your email address.");
    await expect(signUp.name).toBeFocused();
    await signUp.password.fill("short");
    await expect(signUp.form.locator(".hpassword-strength")).toHaveText("Too weak");
  });

  test("Reset Password works inside: a sent link says so, and Return to sign in still switches back", async ({ page }) => {
    const { signIn, reset } = await parts(page);
    await signIn.email.fill("sam@example.com");
    await signIn.toReset.click();
    await reset.button.click();
    const sent = reset.form.getByRole("heading", { name: "Check your email" });
    await expect(sent).toBeFocused();
    await expect(reset.form.locator(".hauth-form-email")).toHaveText("sam@example.com");
    await reset.toSignIn.click();
    await expect(signIn.title).toBeFocused();
    await expect(reset.form).toBeHidden();
  });

  test("starting at sign-up, Sign in shows the Sign-in Form, with the email typed so far", async ({ page }) => {
    const { signIn, signUp, reset } = await parts(page, "account-forms-starting-at-sign-up");
    await expect(signUp.form).toBeVisible();
    await expect(signIn.form).toBeHidden();
    await expect(reset.form).toBeHidden();
    await expect(signUp.toSignIn).toHaveAttribute("href", "/sign-in");
    await signUp.email.fill("sam.lee@example.com");
    await signUp.toSignIn.click();
    await expect(signIn.title).toBeFocused();
    await expect(signUp.form).toBeHidden();
    await expect(signIn.email).toHaveValue("sam.lee@example.com");
  });

  test("with other accounts, the Sign-in and the Sign-up Forms have the same ones under their buttons, and they aren't caught", async ({ page }) => {
    const { signIn, signUp } = await parts(page, "account-forms-with-other-accounts");
    const names = ["Google", "GitHub", "Apple"];
    // "or" 26px under what's above it, the links 26px under "or", and the
    // band 42px under the last.
    const expectAccounts = async (form: Locator, above: Locator) => {
      const links = names.map((name) => form.getByRole("link", { name: `Continue with ${name}` }));
      for (const [index, link] of links.entries()) {
        await expect(link).toHaveAttribute("href", `/auth/${names[index]!.toLowerCase()}`);
      }
      const [before, divider, first, last, band] = await boxes(
        above,
        form.locator(".hauth-form-divider"),
        links[0]!,
        links[2]!,
        form.locator(".hauth-form-footer"),
      );
      expect(divider!.y - (before!.y + before!.height)).toBeCloseTo(26, 0);
      expect(first!.y - (divider!.y + divider!.height)).toBeCloseTo(26, 0);
      expect(band!.y - (last!.y + last!.height)).toBeCloseTo(42, 0);
    };
    await expectAccounts(signIn.form, signIn.button);

    await signIn.email.fill("sam.lee@example.com");
    await signIn.form.getByRole("link", { name: "Continue with Google" }).click();
    await expect(signIn.form).toBeVisible();
    await expect(signUp.form).toBeHidden();

    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();
    await expect(signUp.email).toHaveValue("sam.lee@example.com");
    await settled(signUp.form);
    await expectAccounts(signUp.form, signUp.form.locator(".hsign-up-form-agreement"));

    await signUp.form.getByRole("link", { name: "Continue with GitHub" }).click();
    await expect(signUp.form).toBeVisible();
    await signUp.toSignIn.click();
    await expect(signIn.title).toBeFocused();
    await expect(signUp.form).toBeHidden();
  });

  test("in a Dialog, a Button opens it, and the forms take off their own frame, their titles stepping down to <h3>s under the Dialog's <h2>", async ({ page }) => {
    const { container, signIn, signUp, reset } = await parts(page, "account-forms-in-a-dialog");
    const dialog = container.locator("dialog.hdialog");
    await expect(dialog).toHaveAttribute("closedby", "closerequest");
    await container.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.getByRole("heading", { level: 2, name: "Sign in to continue" })).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Sign in to continue");
    await expect(dialog.getByRole("heading", { level: 3, name: "Sign in", exact: true })).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 1 })).toHaveCount(0);
    await settled(dialog);
    await expect(signIn.form).toBeVisible();
    await expect(signIn.form).toHaveCSS("padding-top", "0px");
    await expect(signIn.form).toHaveCSS("box-shadow", "none");
    await expect(signIn.form).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(signIn.form).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await expect(signIn.title).toHaveCSS("font-size", "16px");
    await expect(signIn.title).toHaveCSS("font-weight", "600");
    // The band spans the form, inside its 1px border and the Dialog's body.
    const footer = signIn.form.locator(".hauth-form-footer");
    const [form, band, body, button] = await boxes(signIn.form, footer, dialog.locator(".hdialog-body"), signIn.button);
    expect(band!.x).toBeCloseTo(form!.x + 1, 0);
    expect(band!.width).toBeCloseTo(form!.width - 2, 0);
    expect(band!.y - (button!.y + button!.height)).toBeCloseTo(42, 0);
    await expect(footer).toHaveCSS("padding-top", "16px");
    expect(band!.y + band!.height).toBeLessThanOrEqual(body!.y + body!.height);
    await expect(footer).toHaveCSS("background-color", await colorOf(page, "var(--harmo-color-background-secondary)"));

    await signIn.email.fill("sam@example.com");
    await signIn.toSignUp.click();
    await expect(signUp.title).toBeFocused();
    await expect(signUp.title).toHaveJSProperty("localName", "h3");
    await expect(signUp.email).toHaveValue("sam@example.com");
    await expect(dialog).toHaveAttribute("open", "");

    // The step a form moves to has its title at the same level.
    await signUp.toSignIn.click();
    await signIn.toReset.click();
    await expect(reset.email).toHaveValue("sam@example.com");
    await reset.button.click();
    await expect(reset.form.getByRole("heading", { level: 3, name: "Check your email" })).toBeFocused();
  });
});
