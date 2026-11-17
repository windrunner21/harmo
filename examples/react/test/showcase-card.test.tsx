import { describe, expect, test } from "bun:test";
import { ShowcaseCard } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/showcase-card.md says: the card is one link holding its
// media, hidden and inert, its title and description, and an action line,
// hidden, with a ChevronToArrow; without an action, there's no line, and fold
// folds its corner.
describe("ShowcaseCard", () => {
  test("a link with its media, its title and description, and its action line", () => {
    const markup = renderToStaticMarkup(
      <ShowcaseCard href="/templates/welcome" media={<img src="welcome.png" alt="" />} label="Welcome message" description="Greets a customer." action="Use template" />,
    );
    // React preloads the image ahead of it.
    expect(markup).toContain('<a href="/templates/welcome" class="hshowcase-card">');
    expect(markup).toContain('<div class="hshowcase-card-media" aria-hidden="true" inert=""><img src="welcome.png" alt=""/></div>');
    expect(markup).toContain('<h3 class="hshowcase-card-title">Welcome message</h3>');
    expect(markup).toContain('<p class="hshowcase-card-description">Greets a customer.</p>');
    expect(markup).toContain('<span class="hshowcase-card-action" aria-hidden="true">Use template<svg');
    expect(markup).toContain("hchevron-to-arrow");
  });

  test("without an action there's no line, the title takes labelAs, and fold folds the corner", () => {
    const markup = renderToStaticMarkup(<ShowcaseCard href="/stories/fernhill" label="Fernhill Market" labelAs="p" fold />);
    expect(markup).toStartWith('<a href="/stories/fernhill" class="hshowcase-card" data-fold="">');
    expect(markup).toContain('<p class="hshowcase-card-title">Fernhill Market</p>');
    expect(markup).not.toContain("hshowcase-card-action");
    expect(markup).not.toContain("hshowcase-card-description");
  });
});
