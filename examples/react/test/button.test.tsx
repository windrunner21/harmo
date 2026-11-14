import { describe, expect, test } from "bun:test";
import { Button, CopyButton } from "@harmo-ui/react";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/button.md says the React Button does: a loading or
// aria-disabled one ignores a press, and prevents its default, such as sending
// a form; holdDuration sets --hbutton-hold-duration; an icon first or last,
// inside a fragment too, stays out of the label, and a child that draws
// nothing isn't one; and an aria-busy you pass is kept. And what copy.md says:
// an aria-disabled Copy Button copies nothing.

interface Click {
  defaultPrevented: boolean;
  preventDefault: () => void;
}

// Presses the first .hbutton an element renders, with a click whose default
// can be prevented. The server's markup leaves the click handler out, so the
// element is rendered as the server would, with each component called in
// place, down to the .hbutton, whose handler is kept.
const press = (element: ReactNode) => {
  let onClick: ((event: Click) => unknown) | undefined;
  let found = false;
  const find = (node: ReactNode): void => {
    if (found) return;
    if (Array.isArray(node)) {
      for (const child of node) find(child);
      return;
    }
    if (!isValidElement<{ className?: string; children?: ReactNode; onClick?: typeof onClick }>(node)) return;
    if (typeof node.type === "function") {
      find((node.type as (props: object) => ReactNode)(node.props));
      return;
    }
    if (typeof node.type === "string" && node.props.className?.split(" ").includes("hbutton")) {
      found = true;
      onClick = node.props.onClick;
      return;
    }
    find(node.props.children);
  };
  const Probe = () => {
    find(element);
    return null;
  };
  renderToStaticMarkup(<Probe />);
  if (!found) throw new Error("press: no .hbutton rendered");

  const click: Click = {
    defaultPrevented: false,
    preventDefault: () => {
      click.defaultPrevented = true;
    },
  };
  onClick?.(click);
  return click;
};

// Records what's copied, on a clipboard that Bun doesn't have.
const copied: string[] = [];
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText: async (text: string) => {
      copied.push(text);
    },
  },
});

describe("Button", () => {
  test("a press calls onClick, and leaves its default alone", () => {
    const pressed: unknown[] = [];
    const click = press(<Button onClick={(event) => pressed.push(event)}>Save</Button>);
    expect(pressed).toHaveLength(1);
    expect(click.defaultPrevented).toBe(false);
  });

  test("loading, a press is ignored: onClick isn't called, and its default, such as sending a form, is prevented", () => {
    const pressed: unknown[] = [];
    const click = press(
      <Button type="submit" loading onClick={(event) => pressed.push(event)}>
        Saving
      </Button>,
    );
    expect(pressed).toEqual([]);
    expect(click.defaultPrevented).toBe(true);
  });

  test("with aria-disabled, a press is ignored, a link's too", () => {
    const pressed: unknown[] = [];
    const record = (event: unknown) => pressed.push(event);
    const clicks = [
      press(<Button aria-disabled="true" onClick={record}>Publish</Button>),
      press(<Button aria-disabled onClick={record}>Publish</Button>),
      press(<Button href="/reports" aria-disabled="true" onClick={record}>Reports</Button>),
    ];
    expect(pressed).toEqual([]);
    for (const click of clicks) expect(click.defaultPrevented).toBe(true);
  });

  test("holdDuration sets --hbutton-hold-duration, in milliseconds", () => {
    const markup = renderToStaticMarkup(
      <Button onHold={() => {}} holdDuration={3000}>
        Hold to delete
      </Button>,
    );
    expect(markup).toContain('style="--hbutton-hold-duration:3000ms"');
  });

  test("an icon first or last stays out of the label, and the label's spaces around it go", () => {
    const markup = renderToStaticMarkup(
      <Button>
        <svg className="hicon" id="start" /> Delete <svg className="hicon" id="end" />
      </Button>,
    );
    expect(markup).toBe(
      '<button type="button" class="hbutton"><svg class="hicon" id="start"></svg><span class="hbutton-label">Delete</span><svg class="hicon" id="end"></svg></button>',
    );
  });

  test("an icon inside a fragment stays out of the label too", () => {
    const deleting = false as boolean;
    const markup = renderToStaticMarkup(
      <Button>
        {deleting ? (
          <>Deleting</>
        ) : (
          <>
            <svg className="hicon" id="start" /> Delete
          </>
        )}
      </Button>,
    );
    expect(markup).toBe(
      '<button type="button" class="hbutton"><svg class="hicon" id="start"></svg><span class="hbutton-label">Delete</span></button>',
    );
  });

  test("a child that draws nothing, such as an empty fragment, isn't a label, so an icon-only button stays square", () => {
    for (const nothing of [<></>, <>{null}</>, <>{false}</>, false]) {
      const markup = renderToStaticMarkup(
        <Button aria-label="Delete">
          <svg className="hicon" />
          {nothing}
        </Button>,
      );
      expect(markup).toBe('<button type="button" aria-label="Delete" class="hbutton"><svg class="hicon"></svg></button>');
    }
  });

  test("loading, the spinner follows the label, before an icon after it", () => {
    const markup = renderToStaticMarkup(
      <Button loading>
        Next
        <svg className="hicon" id="end" />
      </Button>,
    );
    const [label, spinner, icon] = ["hbutton-label", "hspinner", 'id="end"'].map((part) => markup.indexOf(part));
    expect(label).toBeGreaterThan(-1);
    expect(spinner).toBeGreaterThan(label);
    expect(icon).toBeGreaterThan(spinner);
  });

  test("an aria-busy you pass is kept, without loading, and without making it disabled", () => {
    const markup = renderToStaticMarkup(<Button aria-busy>Syncing</Button>);
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("aria-disabled");
    expect(renderToStaticMarkup(<CopyButton aria-busy value="x" label="Copy link" copiedLabel="Copied" />)).toContain(
      'aria-busy="true"',
    );
  });
});

describe("CopyButton", () => {
  test("a press copies its value", async () => {
    copied.length = 0;
    press(<CopyButton value="https://example.com/a" label="Copy link" copiedLabel="Copied" />);
    await Promise.resolve();
    expect(copied).toEqual(["https://example.com/a"]);
  });

  test("with aria-disabled, a press copies nothing, with its text or without", async () => {
    copied.length = 0;
    const clicks = [
      press(<CopyButton aria-disabled value="https://example.com/a" label="Copy link" copiedLabel="Copied" />),
      press(<CopyButton aria-disabled showLabel value="npm install" label="Copy" copiedLabel="Copied" />),
    ];
    await Promise.resolve();
    expect(copied).toEqual([]);
    for (const click of clicks) expect(click.defaultPrevented).toBe(true);
  });
});
