import { expect, type Locator } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/showcase-card.md says: each card is one link, named by
// its title and description, its media and action line hidden; hovering it
// lifts the media 12px and the front 36px, and brings the action line up 24px,
// its chevron turning into an arrow only once the line is pointed at;
// keyboard focus lifts it too, and shows the arrow; with reduced motion asked
// for, nothing moves, and the line has its place under the description; and
// data-fold folds a 42px corner. How it looks only the CSS decides, so those
// tests run on the HTML playground; focus takes a key press, so that runs on
// both.
const transformOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).transform);
const opacityOf = (element: Locator) => element.evaluate((node) => getComputedStyle(node).opacity);
const lifted = (by: number) => `matrix(1, 0, 0, 1, 0, ${-by})`;
const chevron = "matrix(1, 0, 0, 1, -4, 0)";

const partsOf = (card: Locator) => ({
  media: card.locator(".hshowcase-card-media > *").first(),
  body: card.locator(".hshowcase-card-body"),
  action: card.locator(".hshowcase-card-action"),
  head: card.locator(".hchevron-to-arrow-head"),
});

onEachPlayground("showcase-card", () => {
  test("each card is one link, named by its title and description, its media and action line hidden", async ({ page }) => {
    const container = await example(page, "showcase-card-default");
    const links = container.getByRole("link");
    await expect(links).toHaveCount(3);
    await expect(links.first()).toHaveAccessibleName(
      "Messages that go out on time Schedule a reply for later, and it's sent when you chose, even while you're away.",
    );
    const card = container.locator(".hshowcase-card").first();
    await expect(card.locator(".hshowcase-card-media")).toHaveAttribute("aria-hidden", "true");
    await expect(card.locator(".hshowcase-card-action")).toHaveAttribute("aria-hidden", "true");
    // The media can't be reached: Tab goes from one card to the next.
    await card.focus();
    await page.keyboard.press("Tab");
    await expect(container.locator(".hshowcase-card").nth(1)).toBeFocused();
  });

  test("hovering lifts the media and the front, and brings the action line up, its chevron an arrow only over the line", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "showcase-card-default")).locator(".hshowcase-card").first();
    const { media, body, action, head } = partsOf(card);
    expect(await opacityOf(action)).toBe("0");
    await card.locator(".hshowcase-card-title").hover();
    await expect.poll(() => transformOf(media)).toBe(lifted(12));
    await expect.poll(() => transformOf(body)).toBe(lifted(36));
    await expect.poll(() => transformOf(action)).toBe(lifted(24));
    await expect.poll(() => opacityOf(action)).toBe("1");
    await expect.poll(() => transformOf(head)).toBe(chevron);
    await action.hover();
    await expect.poll(() => transformOf(head)).not.toBe(chevron);
  });

  test("keyboard focus lifts the card too, and shows the arrow", async ({ page }) => {
    const container = await example(page, "showcase-card-default");
    const card = container.locator(".hshowcase-card").first();
    const { body, action, head } = partsOf(card);
    await container.locator(".hshowcase-card").nth(1).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(card).toBeFocused();
    await expect.poll(() => transformOf(body)).toBe(lifted(36));
    await expect.poll(() => opacityOf(action)).toBe("1");
    await expect.poll(() => transformOf(head)).not.toBe(chevron);
  });

  test("with reduced motion, nothing moves, and the action line has its place under the description", { tag: "@css" }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const card = (await example(page, "showcase-card-default")).locator(".hshowcase-card").first();
    const { body, action } = partsOf(card);
    expect(await action.evaluate((node) => getComputedStyle(node).position)).toBe("relative");
    await card.hover();
    await expect.poll(() => opacityOf(action)).toBe("1");
    expect(await transformOf(body)).toBe("none");
    const [bodyBox, actionBox] = [await body.boundingBox(), await action.boundingBox()];
    expect(actionBox!.y).toBeGreaterThan(bodyBox!.y);
  });

  test("data-fold folds the top corner at the end over, 42px", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "showcase-card-folded-corner")).locator(".hshowcase-card").first();
    const fold = await card.evaluate((node) => {
      const style = getComputedStyle(node, "::before");
      return { content: style.content, width: style.width, height: style.height, top: style.top, right: style.right };
    });
    expect(fold).toEqual({ content: '""', width: "42px", height: "42px", top: "-1px", right: "-1px" });
  });

  test("an image fills the media, cropped to its shape", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "showcase-card-images")).locator(".hshowcase-card").first();
    const [mediaBox, imageBox] = [await card.locator(".hshowcase-card-media").boundingBox(), await card.locator("img").boundingBox()];
    expect(imageBox!.width).toBeCloseTo(mediaBox!.width, 0);
    expect(imageBox!.height).toBeCloseTo(mediaBox!.height, 0);
    expect(mediaBox!.width / mediaBox!.height).toBeCloseTo(1.618, 1);
  });

  test("an image in a <picture> fills the media too", { tag: "@css" }, async ({ page }) => {
    const card = (await example(page, "showcase-card-images")).locator(".hshowcase-card").first();
    await card.locator(".hshowcase-card-media > img").evaluate((image) => {
      const picture = document.createElement("picture");
      image.replaceWith(picture);
      picture.append(image);
    });
    const [mediaBox, imageBox] = [await card.locator(".hshowcase-card-media").boundingBox(), await card.locator("picture > img").boundingBox()];
    expect(imageBox!.width).toBeCloseTo(mediaBox!.width, 0);
    expect(imageBox!.height).toBeCloseTo(mediaBox!.height, 0);
    expect(await card.locator("picture > img").evaluate((image) => getComputedStyle(image).objectFit)).toBe("cover");
  });
});
