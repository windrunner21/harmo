import { expect } from "@playwright/test";
import { example, onEachPlayground, test } from "./playgrounds.ts";

// What docs/components/textarea.md says a script does, on the TextArea page.
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
});
