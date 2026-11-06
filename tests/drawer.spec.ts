import { expect, type Locator, type Page } from "@playwright/test";
import { boxes, example, onEachPlayground, ready, release, settled, slowDown, test } from "./playgrounds.ts";

// What docs/components/drawer.md says, on the Drawer page: it opens and closes
// as a Dialog does, sits at the window's end edge, slides in and out, and lays
// out its body, footer, and aside.
const isOpen = (drawer: Locator) => drawer.evaluate((node) => (node as HTMLDialogElement).open);

// How far it is from its open place, past the edge it slides from: positive
// past the right edge, negative past the left one on a right-to-left page.
const offset = (drawer: Locator) =>
  drawer.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return document.documentElement.dir === "rtl" ? box.left : box.right - document.documentElement.clientWidth;
  });

const openFrom = async (page: Page, id: string, trigger: string) => {
  const container = await example(page, id);
  const drawer = container.locator("dialog");
  await container.getByRole("button", { name: trigger }).click();
  await expect.poll(() => isOpen(drawer)).toBe(true);
  await settled(drawer);
  return { container, drawer };
};

onEachPlayground("drawer", () => {
  test("its button opens it as a modal at the window's end edge, full height and 480px wide, with focus inside", async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    expect(await drawer.evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(page.getByRole("dialog", { name: "New quick reply" })).toBeVisible();
    const [box] = await boxes(drawer);
    const { width, height } = page.viewportSize()!;
    expect(box.x + box.width).toBeCloseTo(width, 0);
    expect(box.y).toBeCloseTo(0, 0);
    expect(box.height).toBeCloseTo(height, 0);
    expect(box.width).toBeCloseTo(481, 0);
    await expect(drawer.getByLabel("Shortcut")).toBeFocused();
  });

  test("Escape closes it, after it slides out, and returns focus to its button", async ({ page }) => {
    const { container, drawer } = await openFrom(page, "drawer-default", "New quick reply");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(drawer)).toBe(false);
    await expect(container.getByRole("button", { name: "New quick reply" })).toBeFocused();
  });

  test("it slides in from the edge in 200ms, and slides out in 150ms, still open, before it closes", async ({ page }) => {
    const container = await example(page, "drawer-default");
    const drawer = container.locator("dialog");
    await slowDown(drawer);
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    expect(await offset(drawer)).toBeGreaterThan(400);
    await release(drawer);
    await drawer.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    await settled(drawer);
    expect(await offset(drawer)).toBeCloseTo(0, 0);
    expect(await drawer.evaluate((node) => getComputedStyle(node).transitionDuration)).toMatch(/^0\.2s/);

    await slowDown(drawer);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-closing");
    expect(await isOpen(drawer)).toBe(true);
    await drawer.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    expect(await drawer.evaluate((node) => getComputedStyle(node).transitionDuration)).toMatch(/^0\.15s/);
    await release(drawer);
    await expect.poll(() => isOpen(drawer)).toBe(false);
  });

  test("an app that stops the close, such as to confirm unsaved changes, keeps it open", async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    // Before the drawer's own handlers, as React runs an app's onCancel.
    await page.evaluate(() => addEventListener("cancel", (event) => event.preventDefault(), { capture: true, once: true }));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    expect(await isOpen(drawer)).toBe(true);
    await expect(drawer).not.toHaveAttribute("data-closing");
  });

  test("closed some other way while it slides out, then opened again, it stays open", async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    await slowDown(drawer);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("data-closing");
    await drawer.evaluate((node) => {
      const dialog = node as HTMLDialogElement;
      dialog.close();
      dialog.showModal();
    });
    await expect(drawer).not.toHaveAttribute("data-closing");
    await drawer.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    await page.waitForTimeout(400);
    expect(await isOpen(drawer)).toBe(true);
  });

  test("a submit button with its own formmethod sends the form that way, rather than closing it", async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    const held = await drawer.evaluate((node) => {
      const button = document.createElement("button");
      button.formMethod = "get";
      node.querySelector("footer")!.append(button);
      let held: boolean | undefined;
      // After the drawer's own handlers, which are on the document; then
      // stopped, so the page doesn't load.
      addEventListener("submit", (event) => ((held = event.defaultPrevented), event.preventDefault()), { once: true });
      button.click();
      button.remove();
      return held;
    });
    expect(held).toBe(false);
    await expect(drawer).not.toHaveAttribute("data-closing");
    expect(await isOpen(drawer)).toBe(true);
  });

  test("with tabindex=\"0\", an aside that scrolls takes focus, with a ring", async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-with-an-aside", "Edit template");
    const aside = drawer.locator(".hdrawer-aside");
    await aside.evaluate((node) => (node.tabIndex = 0));
    for (let i = 0; i < 10 && !(await aside.evaluate((node) => node === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(aside).toBeFocused();
    expect(await aside.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  });

  test('with closedby="closerequest", a click outside doesn\'t close it; with "any", it does', async ({ page }) => {
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    await page.mouse.click(8, 400);
    await page.waitForTimeout(200);
    expect(await isOpen(drawer)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(drawer)).toBe(false);

    const container = await example(page, "drawer-opened-from-a-link");
    const profile = container.locator("dialog");
    await container.getByRole("link", { name: "Your profile" }).click();
    await expect.poll(() => isOpen(profile)).toBe(true);
    await settled(profile);
    await page.mouse.click(8, 400);
    await expect.poll(() => isOpen(profile)).toBe(false);
  });

  test("its close button, Cancel, and sending its form each close it", async ({ page }) => {
    for (const name of ["Close", "Cancel", "Save"]) {
      const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
      await drawer.getByRole("button", { name, exact: true }).click();
      await expect.poll(() => isOpen(drawer), name).toBe(false);
      await settled(drawer);
    }
  });

  test("something inside with a set width widens it, up to the window, where the body scrolls sideways", async ({ page }) => {
    const container = await example(page, "drawer-default");
    await container.locator(".hdrawer-body").evaluate((body) => {
      const wide = document.createElement("div");
      wide.style.width = "640px";
      wide.style.height = "8px";
      body.append(wide);
    });
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    const [box] = await boxes(drawer);
    expect(box.width).toBeCloseTo(640 + 40 + 1, 0);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(drawer)).toBe(false);
    await settled(drawer);

    await page.setViewportSize({ width: 600, height: 700 });
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    await settled(drawer);
    const [narrow] = await boxes(drawer);
    expect(narrow.width).toBeCloseTo(600, 0);
    expect(await drawer.locator(".hdrawer-body").evaluate((body) => body.scrollWidth > body.clientWidth)).toBe(true);
  });

  test("a long word, such as a key, breaks rather than widening it or its aside", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 860 });
    const key = `sk_live_${"51HqT9xKZ4mBvR2cWnPq8sLdYfE3aGhJ".repeat(3)}`;
    for (const part of ["#reply-drawer .hdrawer-body", "#template-drawer .hdrawer-aside"]) {
      await page.locator(part).evaluate((node, key) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = key;
        node.append(paragraph);
      }, key);
    }
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    const [box] = await boxes(drawer);
    expect(box.width).toBeCloseTo(481, 0);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(drawer)).toBe(false);
    await settled(drawer);

    const { drawer: template } = await openFrom(page, "drawer-with-an-aside", "Edit template");
    const [aside] = await boxes(template.locator(".hdrawer-aside"));
    expect(aside.width).toBeLessThanOrEqual(480);
  });

  test("its body scrolls, and its footer stays under it, in view", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 320 });
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    const body = drawer.locator(".hdrawer-body");
    expect(await body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const [box, footer] = await boxes(drawer, drawer.locator(".hdrawer-footer"));
    expect(footer.y + footer.height).toBeCloseTo(box.y + box.height - 1, 0);
  });

  test("an aside sits beside the body and footer, below the header, scrolling on its own", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 860 });
    const { drawer } = await openFrom(page, "drawer-with-an-aside", "Edit template");
    const [box, header, body, footer, aside] = await boxes(
      drawer,
      drawer.locator(".hdrawer-header"),
      drawer.locator(".hdrawer-body"),
      drawer.locator(".hdrawer-footer"),
      drawer.locator(".hdrawer-aside"),
    );
    expect(box.x + box.width).toBeCloseTo(1440, 0);
    expect(body.width).toBeCloseTo(480, 0);
    expect(aside.x).toBeCloseTo(body.x + body.width, 0);
    expect(aside.y).toBeCloseTo(header.y + header.height, 0);
    expect(aside.y + aside.height).toBeCloseTo(box.y + box.height - 1, 0);
    expect(footer.x + footer.width).toBeCloseTo(aside.x, 0);
    expect(aside.width).toBeLessThanOrEqual(480);
    expect(await drawer.locator(".hdrawer-aside").evaluate((node) => getComputedStyle(node).overflowY)).toBe("auto");
  });

  test("on a narrow window, the aside goes below the body, and the header and footer stay put as it scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 480 });
    const { drawer } = await openFrom(page, "drawer-with-an-aside", "Edit template");
    const parts = [drawer, drawer.locator(".hdrawer-header"), drawer.locator(".hdrawer-footer")] as const;
    const [box, body, aside, footer] = await boxes(drawer, drawer.locator(".hdrawer-body"), drawer.locator(".hdrawer-aside"), parts[2]);
    expect(box.width).toBeCloseTo(390, 0);
    expect(aside.y).toBeGreaterThanOrEqual(body.y + body.height - 1);
    // More than fits, yet the footer is at the bottom before it scrolls, over
    // what's below it, as a footer in the last row wouldn't be.
    expect(await drawer.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    expect(footer.y + footer.height).toBeCloseTo(box.y + box.height - 1, 0);
    expect(await drawer.evaluate((node) => (node.scrollTo(0, node.scrollHeight), node.scrollTop))).toBeGreaterThan(0);
    const [after, header, footerAfter] = await boxes(...parts);
    expect(header.y).toBeCloseTo(after.y + 1, 0);
    expect(footerAfter.y + footerAfter.height).toBeCloseTo(after.y + after.height - 1, 0);
  });

  test("on a right-to-left page, it sits at the left edge and slides from there", async ({ page }) => {
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    const container = await example(page, "drawer-default");
    const drawer = container.locator("dialog");
    await slowDown(drawer);
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    expect(await offset(drawer)).toBeLessThan(-400);
    await release(drawer);
    await settled(drawer);
    const [box] = await boxes(drawer);
    expect(box.x).toBeCloseTo(0, 0);
  });

  test("with reduced motion, it fades in without sliding", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const container = await example(page, "drawer-default");
    const drawer = container.locator("dialog");
    await slowDown(drawer);
    await container.getByRole("button", { name: "New quick reply" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    const style = await drawer.evaluate((node) => ({ translate: getComputedStyle(node).translate, opacity: Number(getComputedStyle(node).opacity) }));
    expect(["none", "0px"]).toContain(style.translate);
    expect(style.opacity).toBeLessThan(0.5);
    await release(drawer);
  });

  test("the page behind doesn't scroll while it's open, and hidden hides it at once", async ({ page }) => {
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    const { drawer } = await openFrom(page, "drawer-default", "New quick reply");
    expect(await overflow()).toBe("hidden");
    expect(await drawer.evaluate((node) => ((node as HTMLElement).hidden = true, getComputedStyle(node).display))).toBe("none");
  });

  test("from a link: the link opens it, closing goes back, and a reload with ?dialog opens it", async ({ page }) => {
    const container = await example(page, "drawer-opened-from-a-link");
    const drawer = container.locator("dialog");
    await container.getByRole("link", { name: "Your profile" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    expect(new URL(page.url()).searchParams.get("dialog")).toBe("profile-drawer");
    await settled(drawer);
    await drawer.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await page.waitForTimeout(300);
    expect(await isOpen(drawer)).toBe(false);

    // Back, then Forward, while it slides out: it stays open.
    await container.getByRole("link", { name: "Your profile" }).click();
    await expect.poll(() => isOpen(drawer)).toBe(true);
    await settled(drawer);
    await slowDown(drawer);
    const linked = page.url();
    await page.evaluate(() => history.back());
    await expect(drawer).toHaveAttribute("data-closing");
    await page.evaluate(() => history.forward());
    await expect(drawer).not.toHaveAttribute("data-closing");
    await drawer.evaluate((node) => (node as HTMLElement).style.removeProperty("transition-duration"));
    await page.waitForTimeout(400);
    expect(await isOpen(drawer)).toBe(true);
    expect(page.url()).toBe(linked);
    await page.keyboard.press("Escape");
    await expect.poll(() => new URL(page.url()).search).toBe("");

    await page.goto(`${page.url()}?dialog=profile-drawer`);
    await ready(page);
    await expect.poll(() => isOpen(page.locator("#profile-drawer"))).toBe(true);
  });
});
