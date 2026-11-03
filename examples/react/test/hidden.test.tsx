import { describe, expect, test } from "bun:test";
import {
  Listbox,
  Option,
  PasswordInput,
  Segmented,
  SegmentedOption,
  Select,
  Tab,
  TabLink,
  TabList,
  TabNav,
  Tabs,
  TextArea,
} from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// hidden on a component hides all of it, also where its other props go to an
// element inside: nothing it renders stays on the page.
const parts = (element: React.ReactElement) =>
  [...renderToStaticMarkup(element).matchAll(/<([a-z]+)([^>]*)>/g)].map(([, tag, attributes = ""]) => ({
    tag,
    className: /class="([^"]*)"/.exec(attributes)?.[1] ?? "",
    hidden: / hidden=""/.test(attributes),
  }));

const hiddenPart = (element: React.ReactElement, className: string) =>
  parts(element).find((part) => part.className === className)?.hidden;

describe("hidden", () => {
  test("PasswordInput hides its whole field, label included", () => {
    const input = <PasswordInput label="Password" showPasswordLabel="Show" hidePasswordLabel="Hide" hidden />;
    expect(hiddenPart(input, "hfield")).toBe(true);
  });

  test("Select with a label hides its whole field, and without one its button", () => {
    expect(hiddenPart(<Select label="Plan" hidden />, "hfield")).toBe(true);
    expect(hiddenPart(<Select aria-label="Plan" hidden />, "hselect")).toBe(true);
  });

  test("Segmented with a label hides its whole field, and without one the group", () => {
    expect(hiddenPart(<Segmented label="Size" hidden />, "hfield")).toBe(true);
    expect(hiddenPart(<Segmented aria-label="Size" hidden />, "hsegmented")).toBe(true);
  });

  test("SegmentedOption hides its label, with the radio inside", () => {
    const group = (
      <Segmented aria-label="Size">
        <SegmentedOption value="small" hidden>
          Small
        </SegmentedOption>
      </Segmented>
    );
    expect(hiddenPart(group, "hsegmented-option")).toBe(true);
  });

  test("TextArea hides its counter too", () => {
    const area = <TextArea aria-label="Note" maxLength={10} hidden />;
    expect(hiddenPart(area, "htextarea")).toBe(true);
    expect(hiddenPart(area, "htextarea-counter")).toBe(true);
  });

  test("Listbox hides its search and footer too", () => {
    const list = (
      <Listbox aria-label="Plan" multiple searchLabel="Search" emptyMessage="None" footer={<button type="button" />} hidden>
        <Option value="free">Free</Option>
      </Listbox>
    );
    for (const className of ["hlistbox-search", "hlistbox", "hlistbox-footer"]) {
      expect(hiddenPart(list, className)).toBe(true);
    }
  });

  test("TabLink hides its list item, so no gap is left", () => {
    const nav = (
      <TabNav aria-label="Pages">
        <TabLink href="/a">A</TabLink>
        <TabLink href="/b" hidden>
          B
        </TabLink>
        <TabLink href="/c">C</TabLink>
      </TabNav>
    );
    expect(parts(nav).filter((part) => part.tag === "li").map((part) => part.hidden)).toEqual([false, true, false]);
  });

  test("a strip with one tab left shown is hidden, as one with one tab is", () => {
    const links = (
      <TabNav aria-label="Pages">
        <TabLink href="/a">A</TabLink>
        <TabLink href="/b" hidden>
          B
        </TabLink>
      </TabNav>
    );
    expect(hiddenPart(links, "htabs")).toBe(true);

    const tabs = (
      <Tabs defaultValue="a">
        <TabList aria-label="Panels">
          <Tab value="a">A</Tab>
          <Tab value="b" hidden>
            B
          </Tab>
        </TabList>
      </Tabs>
    );
    expect(hiddenPart(tabs, "htabs")).toBe(true);
  });
});
