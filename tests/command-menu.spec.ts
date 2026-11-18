import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, clickAt, example, onEachPlayground, rendered, settled, test } from "./playgrounds.ts";

// What docs/components/command-menu.md says, on the Command Menu page: under
// a Search field, a click, typing, or the shortcut opens the list; in a
// dialog, its trigger or the shortcut opens it, with the field and the list.
// Typing filters by label, description, and keywords and marks what matched;
// the arrow keys move with focus in the field; Enter goes, and empties it.
// How the dialog's trigger lines up, mirrors, and lights up only CSS decides,
// so those tests run on the HTML playground.
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
      // Both at once, so the list can't move between them as it opens.
      const [label, description] = await home.evaluate((option) =>
        [".hoption-label", ".hoption-description"].map((part) => option.querySelector(part)!.getBoundingClientRect().toJSON() as DOMRect),
      );
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
      await expect(picked).toHaveText("Opened /analytics");
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
      await expect(picked).toHaveText("Opened /settings/teams/new");
      await expect(input).toHaveValue("");
    });

    test("a click the app stops, with preventDefault() in its own handler on the option, goes nowhere", async ({ page }) => {
      const { input, popup, listbox, picked } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("new");
      const option = listbox.getByRole("option", { name: "New team Settings" });
      // On the option, so before the list's own handling.
      await option.evaluate((node) => node.addEventListener("click", (event) => event.preventDefault(), { once: true }));
      await clickAt(page, option);
      await expect(picked).toBeHidden();
      await expect(input).toHaveValue("new");
      expect(await isOpen(popup)).toBe(true);
      await expect(input).toBeFocused();

      await clickAt(page, option);
      await expect(picked).toHaveText("Opened /settings/teams/new");
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

    test("↑ opens the list at the last option", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await input.focus();
      expect(await isOpen(popup)).toBe(false);
      await page.keyboard.press("ArrowUp");
      expect(await isOpen(popup)).toBe(true);
      expect(await activeLabel(input)).toBe("New team");
    });

    test("Enter with nothing highlighted is kept from a form around it", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.press("Escape");
      await expect.poll(() => isOpen(popup)).toBe(false);
      await page.evaluate(() =>
        addEventListener("keydown", (event) => {
          if (event.key === "Enter") document.body.dataset.enterPrevented = String(event.defaultPrevented);
        }),
      );
      await page.keyboard.press("Enter");
      await expect(page.locator("body")).toHaveAttribute("data-enter-prevented", "true");
    });

    test("read-only, the list stays closed, and Escape and leaving keep the text", async ({ page }) => {
      const { input, popup } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("plans");
      await page.keyboard.press("Escape");
      await expect.poll(() => isOpen(popup)).toBe(false);
      await input.evaluate((node: HTMLInputElement) => (node.readOnly = true));
      await input.click();
      expect(await isOpen(popup)).toBe(false);
      await page.keyboard.press("ArrowDown");
      expect(await isOpen(popup)).toBe(false);
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Escape");
      await expect(input).toHaveValue("plans");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await expect(input).toHaveValue("plans");
      await page.keyboard.press("/");
      await expect(input).toBeFocused();
      expect(await isOpen(popup)).toBe(false);
    });

    test("becoming read-only, an open list can't be picked from", async ({ page }) => {
      const { input, picked } = await parts(page, "command-menu-default");
      await input.click();
      await page.keyboard.type("plans");
      await input.evaluate((node: HTMLInputElement) => (node.readOnly = true));
      await page.keyboard.press("Enter");
      await expect(picked).toBeHidden();
      await expect(input).toHaveValue("plans");
    });

    test("becoming read-only, an open list closes", async ({ page }, info) => {
      test.skip(!info.titlePath.includes("html"), "sets readonly directly, as an app's own script would");
      const { input, popup } = await parts(page, "command-menu-default");
      await input.click();
      expect(await isOpen(popup)).toBe(true);
      await input.evaluate((node: HTMLInputElement) => (node.readOnly = true));
      await expect.poll(() => isOpen(popup)).toBe(false);
      await expect(input).toHaveAttribute("aria-expanded", "false");
    });

    test("disabled, or inside something hidden, it leaves the shortcut to the page", async ({ page }) => {
      const { container, input, popup } = await parts(page, "command-menu-default");
      const body = page.locator("body");
      // Last to see the key: whether anything took it.
      await page.evaluate(() =>
        addEventListener("keydown", (event) => {
          if (event.key === "/") document.body.dataset.slashPrevented = String(event.defaultPrevented);
        }),
      );
      await input.evaluate((node: HTMLInputElement) => (node.disabled = true));
      await body.click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("/");
      await expect(body).toHaveAttribute("data-slash-prevented", "false");
      expect(await isOpen(popup)).toBe(false);

      await input.evaluate((node: HTMLInputElement) => (node.disabled = false));
      await container.locator(".play-demo").evaluate((node) => node.setAttribute("hidden", ""));
      await body.evaluate((node) => delete node.dataset.slashPrevented);
      await page.keyboard.press("/");
      await expect(body).toHaveAttribute("data-slash-prevented", "false");
      expect(await isOpen(popup)).toBe(false);
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
      await expect(picked).toHaveText("Opened /docs/theming");
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(input).toHaveValue("");
      await expect(shown).toHaveCount(7);
      await page.keyboard.press("ArrowDown");
      expect(await activeLabel(input)).toBe("Theming");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(picked).toHaveText("Opened /docs/theming");

      // Opened again after Escape, it starts at the first option.
      await trigger.click();
      expect(await activeLabel(input)).toBe("Installation");
    });

    test("Enter on an option whose click the app stops goes nowhere, and keeps it open", async ({ page }) => {
      const { container, input, dialog, shown, picked } = await parts(page, "command-menu-in-a-dialog");
      await container.locator(".hcommand-menu-trigger").click();
      await page.keyboard.type("tok");
      await expect(shown).toHaveText(["Theming"]);
      // Enter clicks the highlighted option, so the app's handler sees it.
      await container
        .getByRole("option", { name: /^Theming/ })
        .evaluate((node) => node.addEventListener("click", (event) => event.preventDefault(), { once: true }));
      await page.keyboard.press("Enter");
      await expect(picked).toBeHidden();
      await expect(dialog).toHaveJSProperty("open", true);
      await expect(input).toHaveValue("tok");

      await page.keyboard.press("Enter");
      await expect(picked).toHaveText("Opened /docs/theming");
      await expect(dialog).toHaveJSProperty("open", false);
    });

    test("the dialog opens and closes at once, without a Dialog's fade and grow", async ({ page }) => {
      const { container, dialog } = await parts(page, "command-menu-in-a-dialog");
      const moving = () =>
        dialog.evaluate(async (node) => {
          await new Promise(requestAnimationFrame);
          return {
            animations: node.getAnimations({ subtree: true }).length,
            transitions: [getComputedStyle(node).transitionProperty, getComputedStyle(node, "::backdrop").transitionProperty],
          };
        });
      await container.locator(".hcommand-menu-trigger").click();
      await expect(dialog).toHaveJSProperty("open", true);
      expect(await moving()).toEqual({ animations: 0, transitions: ["none", "none"] });
      await expect(dialog).toHaveCSS("opacity", "1");
      await expect(dialog).toHaveCSS("transform", "none");

      await page.keyboard.press("Escape");
      expect((await moving()).animations, "closing").toBe(0);
      await expect(dialog).toHaveJSProperty("open", false);
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

    test("opened by the shortcut, closing returns focus to what had it", async ({ page }) => {
      const { container, dialog } = await parts(page, "command-menu-in-a-dialog");
      const elsewhere = page.getByRole("switch", { name: "Single-key shortcuts" });
      await elsewhere.focus();
      await page.keyboard.press("Control+k");
      await expect(dialog).toHaveJSProperty("open", true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(elsewhere).toBeFocused();
      await expect(container.locator(".hcommand-menu-trigger")).not.toBeFocused();
    });

    test("the shortcut pressed while it's closing keeps it open", async ({ page }) => {
      const { input, dialog } = await parts(page, "command-menu-in-a-dialog");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("Control+k");
      await expect(dialog).toHaveJSProperty("open", true);
      // A close it holds, as Escape's is, then the shortcut, before the frame
      // on which it would close.
      const closing = await dialog.evaluate((node) => {
        node.dispatchEvent(new Event("cancel", { cancelable: true }));
        const started = node.hasAttribute("data-closing");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
        return { started, after: node.hasAttribute("data-closing") };
      });
      expect(closing).toEqual({ started: true, after: false });
      // Past the frame on which it would have closed.
      await rendered(page);
      await expect(dialog).toHaveJSProperty("open", true);
      await expect(input).toBeFocused();
    });

    test("a disabled trigger looks disabled, and leaves the shortcut to the page", async ({ page }) => {
      const { container, dialog } = await parts(page, "command-menu-in-a-dialog");
      const trigger = container.locator(".hcommand-menu-trigger");
      const tertiary = await page.evaluate(() => {
        const probe = document.createElement("span");
        document.body.append(probe);
        probe.style.color = "var(--harmo-color-text-tertiary)";
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      });
      await trigger.evaluate((node: HTMLButtonElement) => (node.disabled = true));
      await expect(trigger).toHaveCSS("cursor", "not-allowed");
      await expect(trigger).toHaveCSS("color", tertiary);
      const border = await trigger.evaluate((node) => getComputedStyle(node).borderTopColor);
      await trigger.hover({ force: true });
      await settled(trigger);
      await expect(trigger).toHaveCSS("border-top-color", border);

      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await page.keyboard.press("Control+k");
      await rendered(page);
      await expect(dialog).toHaveJSProperty("open", false);
    });

    test("inside something hidden, it leaves the shortcut to the page", async ({ page }) => {
      const { container, dialog } = await parts(page, "command-menu-in-a-dialog");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await container.locator(".play-demo").evaluate((node) => node.setAttribute("hidden", ""));
      await page.keyboard.press("Control+k");
      await rendered(page);
      await expect(dialog).toHaveJSProperty("open", false);
    });

    test("the trigger's magnifier, text, and shortcut are where a Search field's are", { tag: "@css" }, async ({ page }) => {
      // Each one's distance from the start of its box, and the shortcut's from
      // its end.
      const lineup = (root: Locator, text: string) =>
        root.evaluate((node, text) => {
          const box = node.getBoundingClientRect();
          const icon = (node.querySelector(":scope > .hicon") as Element).getBoundingClientRect();
          const kbd = (node.querySelector(":scope > .hkbd") as Element).getBoundingClientRect();
          const words = node.querySelector(text) as HTMLElement;
          const start = words.getBoundingClientRect().left + (words.matches("input") ? parseFloat(getComputedStyle(words).paddingLeft) : 0);
          return { icon: icon.left - box.left, text: start - box.left, kbd: box.right - kbd.right };
        }, text);
      const field = (await example(page, "command-menu-default")).locator(".hsearch");
      const searching = await lineup(field, ":scope > .hinput");
      const trigger = (await example(page, "command-menu-in-a-dialog")).locator(".hcommand-menu-trigger");
      const opening = await lineup(trigger, ":scope > .hcommand-menu-trigger-label");
      expect(opening.icon).toBeCloseTo(searching.icon, 0);
      expect(opening.text).toBeCloseTo(searching.text, 0);
      expect(opening.kbd).toBeCloseTo(searching.kbd, 0);
    });

    test("right to left, the trigger's padding mirrors", { tag: "@css" }, async ({ page }) => {
      const { container } = await parts(page, "command-menu-in-a-dialog");
      const trigger = container.locator(".hcommand-menu-trigger");
      const [start, end] = await trigger.evaluate((node) => [getComputedStyle(node).paddingLeft, getComputedStyle(node).paddingRight]);
      await container.locator(".play-demo").evaluate((node) => node.setAttribute("dir", "rtl"));
      await expect(trigger).toHaveCSS("padding-right", start);
      await expect(trigger).toHaveCSS("padding-left", end);
    });

    test("the trigger lights up on its own hover, not on its Field label's", { tag: "@css" }, async ({ page }) => {
      const { container } = await parts(page, "command-menu-in-a-dialog");
      const trigger = container.locator(".hcommand-menu-trigger");
      const resting = await trigger.evaluate((node) => getComputedStyle(node).borderTopColor);
      // A Field's label for it, as an app might put around a trigger. A
      // browser counts a control as hovered while its label is.
      await container.locator(".play-demo").evaluate((demo) => {
        const button = demo.querySelector(".hcommand-menu-trigger") as HTMLElement;
        button.id ||= "command-menu-trigger";
        demo.classList.add("hfield");
        demo.prepend(Object.assign(document.createElement("label"), { className: "hlabel", htmlFor: button.id, textContent: "Docs" }));
      });
      await container.locator(".hlabel").hover();
      await settled(trigger);
      await expect(trigger).toHaveCSS("border-top-color", resting);
      await trigger.hover();
      await settled(trigger);
      await expect(trigger).not.toHaveCSS("border-top-color", resting);
    });
  });

  test("a key your own handler stops first is left to you: Enter picks nothing", async ({ page }) => {
    const container = await example(page, "command-menu-default");
    const field = container.getByRole("combobox").first();
    // As an app's own keydown handler would, before Harmo's.
    await page.evaluate(() =>
      document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") event.preventDefault();
      }, { capture: true }),
    );
    await field.click();
    await field.pressSequentially("a");
    await expect(container.locator(".hoption[data-active]")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("a");
  });
});
