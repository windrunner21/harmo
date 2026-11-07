import { describe, expect, test } from "bun:test";
import { CommandMenu, Option, OptionGroup } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/command-menu.md and listbox.md say that a browser test
// can't reach through the examples: the trigger's name, the shortcut's
// grammar, and groups inside groups.
describe("CommandMenu", () => {
  test("in a dialog, an empty placeholder leaves the trigger named by its label", () => {
    const markup = renderToStaticMarkup(<CommandMenu modal label="Search documentation" placeholder=" " />);
    expect(markup).toContain('<span class="hcommand-menu-trigger-label">Search documentation</span>');
  });

  test("a shortcut names Control and Meta as aria-keyshortcuts does, and Mod as Ctrl off Apple devices", () => {
    const named = (keys: string) =>
      renderToStaticMarkup(<CommandMenu label="Search" shortcut={{ keys, label: keys }} />).match(
        /aria-keyshortcuts="([^"]*)"/,
      )?.[1];
    expect(named("Mod+K")).toBe("Control+K");
    expect(named("Control+K")).toBe("Control+K");
    expect(named("Meta+Shift+P")).toBe("Meta+Shift+P");
    expect(named("/")).toBe("/");
  });

  test("a modifier it doesn't know is an error, not a key alone", () => {
    expect(() => renderToStaticMarkup(<CommandMenu label="Search" shortcut={{ keys: "Ctrl+K", label: "Ctrl K" }} />)).toThrow(
      /"Ctrl"/,
    );
  });

  test("a group inside a hidden group is hidden, with its options", () => {
    const markup = renderToStaticMarkup(
      <CommandMenu label="Search">
        <OptionGroup label="Outer" hidden>
          <OptionGroup label="Inner">
            <Option value="one">One</Option>
          </OptionGroup>
        </OptionGroup>
      </CommandMenu>,
    );
    expect(markup).toMatch(/<li[^>]*class="hoption"[^>]*hidden=""/);
    expect(markup.match(/<li[^>]*class="hoption-group"[^>]*hidden=""/g)).toHaveLength(2);
  });

  test("a group inside an unfiltered group isn't filtered either", () => {
    const markup = renderToStaticMarkup(
      <CommandMenu label="Search" inputValue="zzq">
        <OptionGroup label="Found" filter={false}>
          <OptionGroup label="Customers">
            <Option value="ana">Ana Lopez</Option>
          </OptionGroup>
        </OptionGroup>
        <OptionGroup label="Go to">
          <Option value="home">Home</Option>
        </OptionGroup>
      </CommandMenu>,
    );
    expect(markup).toMatch(/<li[^>]*class="hoption"(?![^>]*hidden)[^>]*>(?:(?!<\/li>).)*Ana Lopez/);
    expect(markup).toMatch(/<li[^>]*class="hoption"[^>]*hidden=""[^>]*>(?:(?!<\/li>).)*Home/);
  });
});
