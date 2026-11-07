import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, clickAt, example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/command-menu.md says, on the Command Menu page: under
// a Search field, a click, typing, or the shortcut opens the list; in a
// dialog, its trigger or the shortcut opens it, with the field and the list.
// Typing filters by label, description, and keywords and marks what matched;
// the arrow keys move with focus in the field; Enter goes, and empties it.
const isOpen = (popup: Locator) => popup.evaluate((node) => node.matches(":popover-open"));

const parts = async (page: Page, id: string) => {
  const container = await example(page, id);
  const input = container.getByRole("combobox", { includeHidden: true });
  const listbox = container.getByRole("listbox", { includeHidden: true });
  return {
    container,
    input,
    listbox,
    popup: container.locator(".hpopup"),
    dialog: container.locator("dialog"),
    shown: listbox.locator(".hoption:not([hidden])").locator(".hoption-label"),
    groups: listbox.locator(".hoption-group:not([hidden]) > .hoption-group-label"),
    status: container.locator(".hlistbox-empty"),
    footer: container.locator(".hcommand-menu-footer"),
    picked: container.locator(".play-demo > p"),
  };
};

const activeLabel = (input: Locator) =>
  input.evaluate((node) => {
    const id = node.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.querySelector(".hoption-label")?.textContent?.trim() ?? null) : null;
  });

onEachPlayground("command-menu", () => {
  test.describe("under a Search field", () => {
    test("a click opens every place and action, the first highlighted, with the keys to use", async ({ page }) => {
      const { input, popup, listbox, shown, groups, footer } = await parts(page, "command-menu-default");
      await expect(input).toHaveAccessibleName("Search");
      await expect(input).toHaveAttribute("aria-keyshortcuts", "/");
      expect(await isOpen(popup)).toBe(false);

      await input.click();
      expect(await isOpen(popup)).toBe(true);
      await expect(input).toHaveAttribute("aria-expanded", "true");
      await expect(listbox).toHaveAccessibleName("Search");
      await expect(shown).toHaveText(["Home", "Tickets", "Analytics", "Plans", "Team members", "New ticket", "New team"]);
      await expect(groups).toHaveText(["Go to", "Create"]);
      expect(await activeLabel(input)).toBe("Home");
      await expect(footer).toBeVisible();
      await expect(footer).toContainText("to open");
      // A place's option is named with where it is, and the badge.
      await expect(listbox.getByRole("option", { name: "Tickets All tickets Current" })).toBeVisible();
    });

    test("each label sits above its description", async ({ page }) => {
      const { input, listbox } = await parts(page, "command-menu-default");
      await input.click();
      const home = listbox.getByRole("option", { name: "Home Overview" });
      const [label, description] = await boxes(home.locator(".hoption-label"), home.locator(".hoption-description"));
      expect(description.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
      expect(Math.abs(description.x - label.x)).toBeLessThan(1);
    });

    test("the list is as wide as its field, and at least 24rem where the window has room", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      const field = input.locator("xpath=..");
      const room = Math.min(384, (page.viewportSize()?.width ?? 0) - 16);
      for (const width of ["200px", "30rem"]) {
        await field.evaluate((node, width) => ((node as HTMLElement).style.inlineSize = width), width);
        await field.evaluate((node) => (node as HTMLElement).style.setProperty("max-inline-size", "none"));
        await input.click();
        const [box, list] = await boxes(field, popup);
        expect(list.width).toBeGreaterThanOrEqual(Math.max(box.width, room) - 1);
        await page.keyboard.press("Escape");
      }
    });

    test("the list opens and closes at once, without a popup's fade", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await input.click();
      expect(await popup.evaluate((node) => node.getAnimations().length)).toBe(0);
      await expect(popup).toHaveCSS("opacity", "1");
      await page.keyboard.press("Escape");
      expect(await popup.evaluate((node) => node.getAnimations().length)).toBe(0);
      await expect(popup).toHaveCSS("visibility", "hidden");
    });

    test("typing filters by label, description, and keywords, marks the match, and highlights the first", async ({ page }) => {
      const { input, listbox, shown, groups } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("set");
      await expect(shown).toHaveText(["Plans", "Team members", "New team"]);
      await expect(listbox.locator(".hoption:not([hidden]) .hoption-match")).toHaveText(["Set", "Set", "Set"]);
      expect(await activeLabel(input)).toBe("Plans");

      // "billing" is one of Plans' keywords, which aren't shown, so nothing
      // is marked.
      await input.fill("");
      await page.keyboard.type("bill");
      await expect(shown).toHaveText(["Plans"]);
      await expect(groups).toHaveText(["Go to"]);
      await expect(listbox.locator(".hoption-match")).toHaveCount(0);
      await expect(input).toBeFocused();
    });

    test("from two letters, the app's results follow, with Searching… until they come, then No results", async ({ page }) => {
      const { input, shown, groups, status, footer } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("lee");
      await expect(status).toHaveText("Searching…");
      await expect(shown).toHaveText([]);
      await expect(footer).toBeHidden();
      await expect(shown).toHaveText(["Lee Chen", "View all customers"]);
      await expect(groups).toHaveText(["Customers"]);
      await expect(status).toHaveText("");
      expect(await activeLabel(input)).toBe("Lee Chen");

      // The app's results are as it sends them: "partner" isn't in the name,
      // but the app matched the email.
      await input.fill("");
      await page.keyboard.type("partner");
      await expect(shown).toHaveText(["Lee Chen", "View all customers"]);

      await input.fill("");
      await page.keyboard.type("zzq");
      await expect(status).toHaveText("Searching…");
      await expect(status).toHaveText("No results");
      await expect(status).toHaveAttribute("role", "status");
    });

    test("the arrows move; Enter goes, empties the field, and closes the list", async ({ page }) => {
      const { input, popup, picked } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      expect(await activeLabel(input)).toBe("Analytics");
      await page.keyboard.press("Enter");
      await expect(picked).toHaveText("Opened Analytics");
      await expect(input).toHaveValue("");
      await expect.poll(() => isOpen(popup)).toBe(false);
      await expect(input).toBeFocused();

      // Down opens it again, at the first.
      await page.keyboard.press("ArrowDown");
      expect(await isOpen(popup)).toBe(true);
      expect(await activeLabel(input)).toBe("Home");
    });

    test("a click on an option goes there", async ({ page }) => {
      const { input, listbox, picked } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("new");
      await clickAt(page, listbox.getByRole("option", { name: "New team Settings" }));
      await expect(picked).toHaveText("Opened New team");
      await expect(input).toHaveValue("");
    });

    test("Escape closes the list, then empties the field; leaving it does both", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("plans");
      await page.keyboard.press("Escape");
      await expect.poll(() => isOpen(popup)).toBe(false);
      await expect(input).toHaveValue("plans");
      await page.keyboard.press("Escape");
      await expect(input).toHaveValue("");

      await page.keyboard.type("plans");
      expect(await isOpen(popup)).toBe(true);
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await expect.poll(() => isOpen(popup)).toBe(false);
      await expect(input).toHaveValue("");
    });

    test("/ reaches the field and opens the list; in the field, it's text", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("/");
      await expect(input).toBeFocused();
      expect(await isOpen(popup)).toBe(true);
      await expect(input).toHaveValue("");
      await page.keyboard.press("/");
      await expect(input).toHaveValue("/");
    });

    test("the switch turns the single-key shortcut off, and its hint with it", async ({ page }) => {
      const { container, input, popup } = await parts(page, "command-menu-default");
      const toggle = container.getByRole("switch", { name: "Single-key shortcuts" });
      await expect(toggle).toBeChecked();
      await toggle.click();
      await expect(input).not.toHaveAttribute("aria-keyshortcuts");
      await expect(container.locator(".hsearch > .hkbd")).toBeHidden();
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("/");
      await expect(input).not.toBeFocused();
      expect(await isOpen(popup)).toBe(false);

      await toggle.click();
      await expect(input).toHaveAttribute("aria-keyshortcuts", "/");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("/");
      await expect(input).toBeFocused();
    });
  });

  test.describe("in a dialog", () => {
    test("its trigger opens it near the top, with the field focused and the first option highlighted", async ({ page }) => {
      const { container, input, dialog, shown, footer } = await parts(page, "command-menu-in-a-dialog");
      const trigger = container.locator(".hcommand-menu-trigger");
      await expect(trigger).toHaveAccessibleName("Search documentation");
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      // Not an Apple device, in the tests.
      await expect(trigger).toHaveAttribute("aria-keyshortcuts", "Control+K");
      await expect(trigger.locator(".hkbd")).toHaveText("Ctrl K");

      await trigger.click();
      await expect(dialog).toHaveJSProperty("open", true);
      await expect(dialog).toHaveAccessibleName("Search documentation");
      await expect(input).toBeFocused();
      await expect(input).toHaveAttribute("aria-expanded", "true");
      await expect(shown).toHaveText(["Installation", "Theming", "Button", "Combobox", "Command Menu", "Dialog", "Tag List"]);
      expect(await activeLabel(input)).toBe("Installation");
      await expect(footer).toBeVisible();

      // Near the top rather than centered: filtering leaves the field where
      // it is.
      await settled(dialog);
      const [before] = await boxes(dialog);
      const height = page.viewportSize()?.height ?? 0;
      expect(before.y).toBeLessThanOrEqual(Math.min(height * 0.12, 120) + 1);
      await page.keyboard.type("modal");
      await expect(shown).toHaveText(["Dialog"]);
      const [after] = await boxes(dialog);
      expect(after.y).toBeCloseTo(before.y, 0);
    });

    test("Enter goes, and closes it; it opens again from an empty field and the whole list", async ({ page }) => {
      const { container, input, dialog, shown, picked } = await parts(page, "command-menu-in-a-dialog");
      const trigger = container.locator(".hcommand-menu-trigger");
      await trigger.click();
      await page.keyboard.type("tok");
      await expect(shown).toHaveText(["Theming"]);
      await page.keyboard.press("Enter");
      await expect(picked).toHaveText("Opened Theming");
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(input).toHaveValue("");
      await expect(shown).toHaveCount(7);
      await page.keyboard.press("ArrowDown");
      expect(await activeLabel(input)).toBe("Theming");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(picked).toHaveText("Opened Theming");

      // Opened again after Escape, it starts at the first option.
      await trigger.click();
      expect(await activeLabel(input)).toBe("Installation");
    });

    test("it keeps a dialog's fade and scale as it opens", async ({ page }) => {
      const { container, dialog } = await parts(page, "command-menu-in-a-dialog");
      await container.locator(".hcommand-menu-trigger").click();
      await expect(dialog).toHaveJSProperty("open", true);
      expect(await dialog.evaluate((node) => getComputedStyle(node).transitionDuration)).toContain("0.2s");
    });

    test("with nothing found, it says so, and the keys go", async ({ page }) => {
      const { container, status, footer } = await parts(page, "command-menu-in-a-dialog");
      await container.locator(".hcommand-menu-trigger").click();
      await page.keyboard.type("zzq");
      await expect(status).toHaveText("No results");
      await expect(footer).toBeHidden();
    });

    test("Ctrl+K opens it from anywhere; again, it takes focus back to the field", async ({ page }) => {
      const { input, dialog } = await parts(page, "command-menu-in-a-dialog");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("Control+k");
      await expect(dialog).toHaveJSProperty("open", true);
      await expect(input).toBeFocused();
      await page.keyboard.type("but");
      await input.evaluate((node) => node.blur());
      await page.keyboard.press("Control+k");
      await expect(dialog).toHaveJSProperty("open", true);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("but");
    });

    test("a click outside closes it without going anywhere", async ({ page }) => {
      const { container, dialog, picked } = await parts(page, "command-menu-in-a-dialog");
      await container.locator(".hcommand-menu-trigger").click();
      await settled(dialog);
      await page.mouse.click(4, 4);
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(picked).toBeHidden();
    });
  });
});
