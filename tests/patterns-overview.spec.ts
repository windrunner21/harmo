import { expect } from "@playwright/test";
import { onEachPlayground, test } from "./playgrounds.ts";

// The patterns' own page in each playground: a card for each pattern, the
// command that copies one, what every pattern needs, and how their forms
// answer, the last two from docs/patterns/README.md. And each pattern's page
// opens with its docs' Try the demo, what to type in its examples, and What
// you need, closed in an Accordion.
// In the nav's order, by name.
const patterns = [
  ["Account Forms", "account-forms"],
  ["Chat", "chat"],
  ["Contact Form", "contact-form"],
  ["Footers", "footers"],
  ["Headers", "headers"],
  ["Reset Password", "reset-password"],
  ["Sign-in Form", "sign-in-form"],
  ["Sign-up Form", "sign-up-form"],
  ["Verify Code", "verify-code"],
];

onEachPlayground("patterns", () => {
  test("lists every pattern as a card that leads to its page, first in the nav's Patterns", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Patterns");
    const nav = page.getByRole("navigation", { name: "Components" });
    const group = nav.getByRole("list", { name: "Patterns" });
    await expect(group.getByRole("link").first()).toHaveText("All patterns");
    await expect(group.getByRole("link", { name: "All patterns" })).toHaveAttribute("aria-current", "page");
    const cards = page.locator(".play-pattern-list .hcard");
    await expect(cards).toHaveCount(patterns.length);
    for (const [index, [title, slug]] of patterns.entries()) {
      await expect(cards.nth(index).locator(".hcard-title")).toHaveText(title);
      await expect(cards.nth(index)).toHaveAttribute("href", `${slug}.html`);
      await expect(cards.nth(index).locator(".hcard-description")).not.toBeEmpty();
    }
  });

  test("has the command that copies a pattern, what every pattern needs, and how the forms answer", async ({ page }) => {
    await expect(page.locator(".play-command code")).toHaveText("npx harmo-ui add sign-in-form");
    await expect(page.locator(".play-command").getByRole("button", { name: "Copy" })).toBeVisible();
    const needs = page.getByRole("table", { name: "What you need" });
    await expect(needs.getByRole("columnheader")).toHaveText(["Need", "Details"]);
    await expect(needs.getByRole("rowheader", { name: "Node.js" })).toBeVisible();
    const answers = page.getByRole("table", { name: "How the forms answer" });
    await expect(answers.getByRole("cell", { name: "undefined", exact: true })).toBeVisible();
  });
});

onEachPlayground("sign-in-form", () => {
  test("opens with what to type in the examples, from the docs, its cells wrapping", async ({ page }) => {
    const table = page.getByRole("table", { name: "Try the demo" });
    await expect(table.getByRole("columnheader")).toHaveText(["Example", "Type", "You see"]);
    await expect(table.getByRole("row").filter({ hasText: "Code 123456" })).toBeVisible();
    await expect(table.locator("code").first()).toBeVisible();
    expect(await table.locator("td").first().evaluate((cell) => getComputedStyle(cell).whiteSpace)).toBe("normal");
    // Before the first example.
    const [guide, example] = await Promise.all(
      [page.locator(".play-guide"), page.locator(".play-example").first()].map((locator) => locator.boundingBox()),
    );
    expect(guide!.y).toBeLessThan(example!.y);
  });

  test("What you need is closed until it's opened, and a link to part of the docs goes there", async ({ page }) => {
    const needs = page.locator(".play-needs");
    await expect(needs).not.toHaveAttribute("open");
    await needs.locator("summary").click();
    const table = needs.getByRole("table", { name: "What you need" });
    await expect(table.getByRole("rowheader", { name: "Accounts" })).toBeVisible();
    await expect(needs.getByRole("link", { name: "Security" }).first()).toHaveAttribute("href", /docs\/patterns\/sign-in-form\.md#security$/);
    // A link to a whole pattern's page goes to its page here.
    await expect(table.getByRole("link", { name: "Verify Code" }).first()).toHaveAttribute("href", "verify-code.html");
  });

  test("a table too wide for its place scrolls, and while it does, is a named region that takes focus", async ({ page }) => {
    const scroll = page.locator(".play-guide-table > .htable-scroll").first();
    await expect(scroll).not.toHaveAttribute("tabindex");
    await scroll.locator("table").evaluate((table) => (table.style.minInlineSize = "200rem"));
    await expect(scroll).toHaveAttribute("tabindex", "0");
    await expect(scroll).toHaveAttribute("role", "region");
    await expect(scroll).toHaveAccessibleName("Try the demo");
    await scroll.locator("table").evaluate((table) => (table.style.minInlineSize = ""));
    await expect(scroll).not.toHaveAttribute("tabindex");
    await expect(scroll).not.toHaveAttribute("role");
  });
});

onEachPlayground("index", () => {
  test("the overview leads to the patterns", async ({ page }) => {
    await expect(page.locator(".play-hero").getByRole("link", { name: "Patterns" })).toHaveAttribute("href", "patterns.html");
  });
});
