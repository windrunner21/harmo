import { describe, expect, test } from "bun:test";
import { SelectionBar, Toolbar } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/toolbar.md and selection-bar.md say about what they render.
describe("Toolbar", () => {
  test("its children, then the controls, and no toolbar role", () => {
    const markup = renderToStaticMarkup(<Toolbar controls={<b>End</b>}>{<i>Start</i>}</Toolbar>);
    expect(markup).toBe('<div class="htoolbar"><i>Start</i><div class="htoolbar-controls"><b>End</b></div></div>');
  });

  test("no controls part when there are none to show", () => {
    expect(renderToStaticMarkup(<Toolbar controls={false} />)).toBe('<div class="htoolbar"></div>');
    expect(renderToStaticMarkup(<Toolbar />)).toBe('<div class="htoolbar"></div>');
  });

  test("other props go to the element", () => {
    expect(renderToStaticMarkup(<Toolbar id="a" className="b" />)).toBe('<div id="a" class="htoolbar b"></div>');
  });
});

describe("SelectionBar", () => {
  test("the count as a status, a button to deselect, then what it's given", () => {
    const markup = renderToStaticMarkup(
      <SelectionBar label="2 selected" deselectLabel="Deselect" onDeselect={() => {}}>
        <b>Assign</b>
      </SelectionBar>,
    );
    expect(markup).toBe(
      '<div class="hselection-bar"><span class="hselection-bar-count" role="status">2 selected</span>' +
        '<button type="button" class="hselection-bar-deselect">Deselect</button><b>Assign</b></div>',
    );
  });
});
