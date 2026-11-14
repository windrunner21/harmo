import { describe, expect, test } from "bun:test";
import { Avatar, HarmoProvider } from "@harmo-ui/react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/avatar.md says about the React Avatar: a placeholder
// is an image named by alt, or hidden from screen readers with alt=""; with
// src, it's an image, through HarmoProvider's imageComponent.
const FrameworkImage = (props: ComponentProps<"img">) => <img {...props} data-framework-image="" />;

describe("Avatar", () => {
  test("a placeholder is an image named by alt", () => {
    expect(renderToStaticMarkup(<Avatar alt="Jane Smith">JS</Avatar>)).toBe(
      '<span role="img" aria-label="Jane Smith" class="havatar">JS</span>',
    );
  });

  test('with alt="", a placeholder is hidden from screen readers, and no image', () => {
    expect(renderToStaticMarkup(<Avatar alt="">JS</Avatar>)).toBe(
      '<span aria-hidden="true" class="havatar">JS</span>',
    );
  });

  test("with src, it's the provider's image component, given the src and alt", () => {
    const markup = renderToStaticMarkup(
      <HarmoProvider imageComponent={FrameworkImage}>
        <Avatar src="images/jane.svg" alt="Jane Smith" />
      </HarmoProvider>,
    );
    expect(markup).toContain("data-framework-image");
    expect(markup).toContain('class="havatar"');
    expect(markup).toContain('src="images/jane.svg"');
    expect(markup).toContain('alt="Jane Smith"');
  });

  test("with src and no provider, it's an <img>", () => {
    expect(renderToStaticMarkup(<Avatar src="images/jane.svg" alt="" />)).toContain(
      '<img class="havatar" src="images/jane.svg" alt=""/>',
    );
  });
});
