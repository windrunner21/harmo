import { describe, expect, test } from "bun:test";
import { EmptyState } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/empty-state.md's Contract requires, a title or a
// description, the React types require too.
describe("EmptyState", () => {
  test("a title, a description, or both", () => {
    expect(renderToStaticMarkup(<EmptyState label="No quick replies yet" />)).toBe(
      '<div class="hempty-state"><h2 class="hempty-state-title">No quick replies yet</h2></div>',
    );
    expect(renderToStaticMarkup(<EmptyState description="No tickets in this column" />)).toBe(
      '<div class="hempty-state"><p class="hempty-state-description">No tickets in this column</p></div>',
    );
    expect(renderToStaticMarkup(<EmptyState label="No files yet" description="Files sent in this chat show here." />)).toContain(
      '<p class="hempty-state-description">Files sent in this chat show here.</p>',
    );
  });

  test("TypeScript requires a title or a description", () => {
    // Checked by mise run check:react: an empty box is an error, and an
    // unused directive would be one too.
    // @ts-expect-error An Empty State needs a title or a description.
    void (<EmptyState />);
    // @ts-expect-error An icon and actions alone aren't enough.
    void (<EmptyState icon={<svg />} actions={<button type="button">Add</button>} />);
  });
});
