import { describe, expect, test } from "bun:test";
import { Sidebar, SidebarGroup, SidebarItem, SidebarSub, SidebarSubItem } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/sidebar.md says about hidden: it hides the whole
// item, its <li>, so the list leaves no gap; about exclusive: its groups
// share a name, wherever they are; about a group's links, text only; and
// about the toggle, named by what it does, with no aria-expanded.
describe("Sidebar", () => {
  test("the toggle is named by its tooltip, what pressing it does, with no aria-expanded or aria-controls", () => {
    const markup = renderToStaticMarkup(
      <Sidebar aria-label="Main" id="main" collapseLabel="Collapse" expandLabel="Expand" defaultCollapsed>
        <SidebarGroup />
      </Sidebar>,
    );
    const button = /<button [^>]*class="hsidebar-toggle-button"[^>]*>/.exec(markup)?.[0] ?? "";
    expect(button).toMatch(/aria-labelledby="[^"]+"/);
    expect(button).not.toContain("aria-expanded");
    expect(button).not.toContain("aria-controls");
    expect(markup).toContain(">Expand</span>");
    expect(markup).toMatch(/^<div id="main" class="hsidebar"/);
  });

  test("a group's links are SidebarSubItems, text only; a SidebarItem there renders as one", () => {
    const markup = renderToStaticMarkup(
      <Sidebar aria-label="Main">
        <SidebarGroup>
          <SidebarSub label="Campaigns">
            <SidebarSubItem href="/campaigns/runs" current>
              Runs
            </SidebarSubItem>
            <SidebarItem href="/campaigns/templates">Templates</SidebarItem>
          </SidebarSub>
        </SidebarGroup>
      </Sidebar>,
    );
    expect(markup).toContain('<li><a href="/campaigns/runs" class="hsidebar-sub-item" aria-current="page">Runs</a></li>');
    expect(markup).toContain('<li><a href="/campaigns/templates" class="hsidebar-sub-item">Templates</a></li>');
    // Checked by mise run check:react: an icon or a count on one is an
    // error, and an unused directive would be one too.
    // @ts-expect-error A group's link has no icon.
    void (<SidebarSubItem href="/a" icon={<svg />}>A</SidebarSubItem>);
    // @ts-expect-error Nor a count.
    void (<SidebarSubItem href="/a" badge="3">A</SidebarSubItem>);
  });

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
