import { expect } from "@playwright/test";
import { boxes, example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/patterns/footers.md says: a site's footer has its groups of
// links, a Social group whose links open a new tab, a Language Picker, and
// the copyright and address; on a phone its groups fold; the newsletter's
// Subscribe checks the address, shows it's working, and says once it's
// subscribed, or what's wrong under the field; a sign-in page's footer is its
// bottom row.
onEachPlayground("footers", () => {
  test("a site's footer has its groups, a Language Picker, Social links that open a new tab, and the small print", async ({ page }) => {
    const container = await example(page, "footers-site-footer");
    const nav = container.getByRole("navigation", { name: "Footer" });
    await expect(nav.getByRole("heading", { level: 2 })).toHaveText(["Shop", "Company", "Legal", "Social"]);
    const instagram = nav.getByRole("link", { name: "Instagram" });
    await expect(instagram).toHaveAttribute("target", "_blank");
    await expect(instagram).toHaveAttribute("rel", "noreferrer");
    await expect(container.getByRole("combobox", { name: "Language" })).toBeVisible();
    await expect(container.locator(".hfooter-bottom")).toContainText("© 2026 Speedwagon Ltd.");
    await expect(container.locator(".hfooter-bottom address")).toHaveText("1 Joestar Lane, Morioh");
  });

  test("on a phone, its groups fold, each opening under its heading", async ({ page }) => {
    const container = await example(page, "footers-site-footer-on-a-phone");
    const social = container.locator(".hfooter-group").filter({ hasText: "Social" });
    await expect(social.getByRole("link", { name: "Instagram" })).toBeHidden();
    await social.locator(".hfooter-summary").click();
    await expect(social.getByRole("link", { name: "Instagram" })).toBeVisible();
  });

  test("Subscribe checks the address first, then says once it's subscribed, or what's wrong", async ({ page }) => {
    const container = await example(page, "footers-newsletter-footer");
    const field = container.getByRole("textbox", { name: "Email" });
    const subscribe = container.getByRole("button", { name: "Subscribe" });
    const status = container.getByRole("status");
    await subscribe.click();
    await expect(field).toHaveAccessibleDescription("Enter your email address.");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toBeFocused();
    await field.fill("anna");
    await expect(field).not.toHaveAttribute("aria-invalid");
    await subscribe.click();
    await expect(field).toHaveAccessibleDescription("Enter an email address, such as name@example.com.");
    await field.fill("taken@example.com");
    await subscribe.click();
    await expect(subscribe).toHaveAttribute("aria-busy", "true");
    await expect(field).toHaveAccessibleDescription("That address is already subscribed.");
    await expect(subscribe).not.toHaveAttribute("aria-busy");
    await field.fill("anna@example.com");
    await subscribe.click();
    await expect(status).toHaveText("Subscribed. The next one goes to anna@example.com.");
    await expect(field).toHaveValue("");
    await expect(field).not.toHaveAttribute("aria-invalid");
  });

  test("the newsletter's Subscribe is level with its input, 6px from it", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "footers-newsletter-footer");
    const [input, button] = await boxes(container.getByRole("textbox", { name: "Email" }), container.getByRole("button", { name: "Subscribe" }));
    expect(Math.round(button.y)).toBe(Math.round(input.y));
    expect(Math.round(button.x - (input.x + input.width))).toBe(6);
  });

  test("a link with an icon takes the same room as one without", { tag: "@css" }, async ({ page }) => {
    const container = await example(page, "footers-site-footer");
    const nav = container.getByRole("navigation", { name: "Footer" });
    const [privacy, terms, instagram, youtube] = await boxes(
      nav.getByRole("link", { name: "Privacy" }),
      nav.getByRole("link", { name: "Terms" }),
      nav.getByRole("link", { name: "Instagram" }),
      nav.getByRole("link", { name: "YouTube" }),
    );
    expect(Math.round(youtube.y - instagram.y)).toBe(Math.round(terms.y - privacy.y));
  });

  test("a sign-in page's footer is its bottom row: the copyright and its links", async ({ page }) => {
    const container = await example(page, "footers-simple-footer");
    await expect(container.locator(".hfooter-main")).toHaveCount(0);
    await expect(container.getByRole("navigation", { name: "Legal" }).getByRole("link")).toHaveText(["Privacy", "Terms", "Help"]);
    await expect(container.locator(".hfooter-bottom")).toContainText("© 2026 Speedwagon Ltd.");
  });
});
