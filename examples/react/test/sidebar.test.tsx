import { describe, expect, test } from "bun:test";
import { Sidebar, SidebarGroup, SidebarItem, SidebarSub } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/sidebar.md says about hidden: it hides the whole
// item, its <li>, so the list leaves no gap; and about exclusive: its groups
// share a name, wherever they are.
describe("Sidebar", () => {
  test("hidden hides a link's or a group's whole item", () => {
    const markup = renderToStaticMarkup(
      <Sidebar aria-label="Main">
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

  test("an exclusive Sidebar's groups share one name, in the header and footer too; otherwise they have none", () => {
    const names = (exclusive: boolean) =>
      [
        ...renderToStaticMarkup(
          <Sidebar
            aria-label="Main"
            exclusive={exclusive}
            header={
              <SidebarGroup>
                <SidebarSub label="Account" />
              </SidebarGroup>
            }
            footer={
              <SidebarGroup>
                <SidebarSub label="Help" />
              </SidebarGroup>
            }
          >
            <SidebarGroup>
              <SidebarSub label="Campaigns" />
              <SidebarSub label="More" />
            </SidebarGroup>
          </Sidebar>,
        ).matchAll(/<details[^>]*>/g),
      ].map((tag) => / name="([^"]*)"/.exec(tag[0])?.[1] ?? null);
    const [first, ...others] = names(true);
    expect(first).toBeTruthy();
    expect(others).toEqual([first, first, first]);
    expect(names(false)).toEqual([null, null, null, null]);
  });
});
