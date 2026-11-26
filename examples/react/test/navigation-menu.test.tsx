import { describe, expect, test } from "bun:test";
import { NavigationMenu, NavigationMenuLink } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/navigation-menu.md says about the page you're on:
// current marks it, aria-current="page", and a link takes your aria-current
// where current isn't set, such as "true" for a section you're in.
describe("NavigationMenu", () => {
  test("current marks the page you're on; a link takes your aria-current otherwise", () => {
    const markup = renderToStaticMarkup(
      <NavigationMenu aria-label="Main">
        <NavigationMenuLink href="/" current>
          Home
        </NavigationMenuLink>
        <NavigationMenuLink href="/blog" aria-current="true">
          Blog
        </NavigationMenuLink>
        <NavigationMenuLink href="/projects">Projects</NavigationMenuLink>
      </NavigationMenu>,
    );
    expect(markup).toMatch(/<a [^>]*href="\/"[^>]*aria-current="page"/);
    expect(markup).toMatch(/<a [^>]*href="\/blog"[^>]*aria-current="true"/);
    expect(markup).not.toMatch(/<a [^>]*href="\/projects"[^>]*aria-current/);
  });
});
