import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/textarea.md says, on the TextArea page: what a script
// does, and how tall it grows.
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
