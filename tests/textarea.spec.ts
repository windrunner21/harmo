import { expect } from "@playwright/test";
import { example, onEachPlayground, settled, test } from "./playgrounds.ts";

// What docs/components/textarea.md says, on the TextArea page: what a script
// does, the counter's text, and how tall it grows.
onEachPlayground("textarea", () => {
  test("the counter counts toward maxlength as the text changes, and describes the field", async ({ page }) => {
    const container = await example(page, "textarea-with-a-counter");
    const textarea = container.getByLabel("Message");
    const counter = container.locator(".htextarea-counter");
    await expect(counter).toHaveText("0/500");

    await textarea.fill("Hello");
    await expect(counter).toHaveText("5/500");
    await textarea.press("End");
    await textarea.pressSequentially(", there");
    await expect(counter).toHaveText("12/500");
    await expect(textarea).toHaveAccessibleDescription("12/500");
    await textarea.fill("");
    await expect(counter).toHaveText("0/500");
  });

  test("the counter's text is the app's: here, what's left, in its own words", async ({ page }) => {
    const container = await example(page, "textarea-counting-down");
    const textarea = container.getByLabel("Text message");
    const counter = container.locator(".htextarea-counter");
    await expect(counter).toHaveText("160 characters left");
    await textarea.fill("Hello");
    await expect(counter).toHaveText("155 characters left");
    await expect(textarea).toHaveAccessibleDescription("155 characters left");
  });

  test("only the pointer on the field lights its border, not the pointer on its label", async ({ page }) => {
    const container = await example(page, "textarea-long-text");
    const textarea = container.getByLabel("Saved reply");
    const border = () => textarea.evaluate((node) => getComputedStyle(node).borderTopColor);
    const rest = await border();
    await container.locator(".hlabel").hover();
    await settled(textarea);
    expect(await border()).toBe(rest);
    await textarea.hover();
    await settled(textarea);
    expect(await border()).not.toBe(rest);
  });

  test("it starts one line tall, as tall as an Input, with its text as far in as an Input's", async ({ page }) => {
    const textarea = (await example(page, "textarea-with-a-counter")).getByLabel("Message");
    expect((await textarea.boundingBox())!.height).toBeCloseTo(34, 0);
    const padding = await textarea.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    });
    expect(padding).toEqual(["6px", "10px", "6px", "10px"]);

    // A theme's control height reaches it, as it reaches an Input.
    await page.evaluate(() => document.documentElement.style.setProperty("--harmo-control-height", "2.5rem"));
    expect((await textarea.boundingBox())!.height).toBeCloseTo(40, 0);
  });

  test("in a form, a reset puts back the first text, and the counter follows", async ({ page }) => {
    const container = await example(page, "textarea-in-a-form");
    const textarea = container.getByLabel("Reply");
    const counter = container.locator(".htextarea-counter");
    await expect(counter).toHaveText("30/500");

    await textarea.fill("Thanks!");
    await expect(counter).toHaveText("7/500");
    await container.getByRole("button", { name: "Reset" }).click();
    await expect(textarea).toHaveValue("Hello, your order has shipped.");
    await expect(counter).toHaveText("30/500");
    await expect(textarea).toHaveAccessibleDescription("30/500");
  });

  test("a reset of a form it joined after the page loaded still updates the counter", async ({ page }) => {
    const container = await example(page, "textarea-with-a-counter");
    const textarea = container.getByLabel("Message");
    const counter = container.locator(".htextarea-counter");
    await textarea.evaluate((node) => {
      const form = document.createElement("form");
      form.id = "joined-later";
      document.body.append(form);
      node.setAttribute("form", form.id);
    });

    await textarea.fill("Hello");
    await expect(counter).toHaveText("5/500");
    await page.evaluate(() => (document.getElementById("joined-later") as HTMLFormElement).reset());
    await expect(textarea).toHaveValue("");
    await expect(counter).toHaveText("0/500");
  });

  test("--htextarea-min-height starts it taller, four lines here, and it grows with its text from there", async ({ page }) => {
    const textarea = (await example(page, "textarea-taller-to-start")).getByLabel("Feedback");
    const height = async () => (await textarea.boundingBox())!.height;
    await expect(textarea).toHaveCSS("min-height", "94px");
    expect(await height()).toBeCloseTo(94, 0);
    if (await textarea.evaluate(() => CSS.supports("field-sizing", "content"))) {
      await textarea.fill(Array(6).fill("A line").join("\n"));
      expect(await height()).toBeCloseTo(134, 0);
    }
  });

  test("it grows up to 150px; a height in its style, as dragging the corner sets, lifts that, and a line-height doesn't", async ({ page }) => {
    const container = await example(page, "textarea-with-a-counter");
    const textarea = container.getByLabel("Message");
    const cap = () => textarea.evaluate((node) => getComputedStyle(node).maxHeight);
    const height = async () => (await textarea.boundingBox())!.height;
    await textarea.fill("A line\n".repeat(20));
    expect(await cap()).toBe("150px");
    // Growing with the text is field-sizing's, where the browser has it.
    if (await textarea.evaluate(() => CSS.supports("field-sizing", "content"))) {
      expect(await height()).toBeCloseTo(150, 0);
    }

    await textarea.evaluate((node) => node.setAttribute("style", "line-height: 20px"));
    expect(await cap()).toBe("150px");
    await textarea.evaluate((node) => node.setAttribute("style", "height: 300px"));
    expect(await cap()).not.toBe("150px");
    expect(await height()).toBeCloseTo(300, 0);
  });
});
