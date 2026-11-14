import { describe, expect, test } from "bun:test";
import { ChevronToArrow } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/chevron-to-arrow.md says: it's 24px, the size it's
// drawn for, unless its width and height say otherwise, as any icon's can.
describe("ChevronToArrow", () => {
  test("it's 24px when its width and height are left out", () => {
    const markup = renderToStaticMarkup(<ChevronToArrow />);
    expect(markup).toContain('width="24"');
    expect(markup).toContain('height="24"');
  });

  test("a width and height you pass size it", () => {
    const markup = renderToStaticMarkup(<ChevronToArrow width={20} height={20} />);
    expect(markup).toContain('width="20"');
    expect(markup).toContain('height="20"');
    expect(markup).not.toContain('width="24"');
  });
});
