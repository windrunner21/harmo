import { describe, expect, test } from "bun:test";
import { Tab, TabList, TabPanel, Tabs } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/tabs.md says about the Tab order and hidden panels.
const focusable = (markup: string) =>
  [...markup.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)]
    .filter(([, attributes]) => !/ tabindex="-1"/.test(attributes))
    .map(([, , label]) => label);

describe("Tabs", () => {
  test("only the selected tab is in the Tab order", () => {
    const markup = renderToStaticMarkup(
      <Tabs value="b">
        <TabList aria-label="Panels">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
          <Tab value="c">C</Tab>
        </TabList>
      </Tabs>,
    );
    expect(focusable(markup)).toEqual(["B"]);
  });

  test("with no shown, enabled tab selected, the first that is shown and enabled is in the Tab order", () => {
    const render = (selected: string) =>
      renderToStaticMarkup(
        <Tabs value={selected}>
          <TabList aria-label="Panels">
            <Tab value="a" disabled>
              A
            </Tab>
            <Tab value="b" aria-disabled>
              B
            </Tab>
            <Tab value="c">C</Tab>
            <Tab value="d" hidden>
              D
            </Tab>
            <Tab value="e">E</Tab>
          </TabList>
        </Tabs>,
      );
    expect(focusable(render("d"))).toEqual(["C"]);
    expect(focusable(render("a"))).toEqual(["C"]);
    expect(focusable(render("b"))).toEqual(["C"]);
    expect(focusable(render("none"))).toEqual(["C"]);
    expect(focusable(render("e"))).toEqual(["E"]);
    expect(render("d")).not.toMatch(/aria-selected="true"[^>]*>C</);
  });

  test("a panel with hidden stays hidden, even while its tab is selected", () => {
    const markup = renderToStaticMarkup(
      <Tabs value="a">
        <TabPanel value="a" hidden>
          A
        </TabPanel>
        <TabPanel value="b">B</TabPanel>
      </Tabs>,
    );
    expect(markup.match(/<div[^>]*hidden=""[^>]*>/g)).toHaveLength(2);
  });
});
