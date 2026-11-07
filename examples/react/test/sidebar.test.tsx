import { describe, expect, test } from "bun:test";
import { Sidebar, SidebarGroup, SidebarItem, SidebarSub } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/sidebar.md says about hidden: it hides the whole
// item, its <li>, so the list leaves no gap; and about exclusive: its groups
// share a name.
describe("Sidebar", () => {
  test("hidden hides a link's or a group's whole item", () => {
    const markup = renderToStaticMarkup(
      <Sidebar label="Main">
        <SidebarGroup>
          <SidebarItem href="/home" hidden>
            Home
          </SidebarItem>
          <SidebarSub label="Campaigns" hidden>
            <SidebarItem href="/campaigns/runs" hidden>
              Runs
            </SidebarItem>
          </SidebarSub>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(markup.match(/<li class="htooltip-trigger" hidden="">/g)).toHaveLength(2);
    expect(markup).toMatch(/<li hidden=""><a [^>]*class="hsidebar-sub-item"/);
    expect(markup).not.toMatch(/<(a|details)[^>]*hidden/);
  });

  test("an exclusive Sidebar's groups share one name; otherwise they have none", () => {
    const names = (exclusive: boolean) =>
      [
        ...renderToStaticMarkup(
          <Sidebar label="Main" exclusive={exclusive}>
            <SidebarGroup>
              <SidebarSub label="Campaigns" />
              <SidebarSub label="More" />
            </SidebarGroup>
          </Sidebar>,
        ).matchAll(/<details[^>]*>/g),
      ].map((tag) => / name="([^"]*)"/.exec(tag[0])?.[1] ?? null);
    const [first, second] = names(true);
    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(names(false)).toEqual([null, null]);
  });
});
