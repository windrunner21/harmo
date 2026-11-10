import { describe, expect, test } from "bun:test";
import { Field, FileInput } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/file-input.md says about what it renders.
const labels = { chooseLabel: "Choose file", removeLabel: "Remove" };

describe("FileInput", () => {
  test("a Button around a real file input, with the remove button hidden", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} name="a" />);
    expect(markup).toStartWith('<div class="hfile-input"><label class="hbutton" data-variant="secondary"><input');
    expect(markup).toContain('class="hfile-input-control"');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('name="a"');
    expect(markup).toContain('<span class="hbutton-label">Choose file</span>');
    expect(markup).toMatch(/<button[^>]*aria-label="Remove"[^>]*hidden=""/);
    expect(markup).not.toContain("herror");
  });

  test("a file already attached shows its name, and can be removed", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} defaultFileName="a.pdf" />);
    expect(markup).toContain('<span class="hbutton-label" title="a.pdf">a.pdf</span>');
    expect(markup).not.toMatch(/<button[^>]*hidden=""/);
  });

  test("disabled reaches the input and the remove button", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} defaultFileName="a.pdf" disabled />);
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toMatch(/<button[^>]*disabled=""/);
  });

  test("in a Field, the label reaches the input", () => {
    const markup = renderToStaticMarkup(
      <Field label="Attachment">
        <FileInput {...labels} />
      </Field>,
    );
    const id = /<label[^>]*for="([^"]+)"/.exec(markup)![1];
    expect(markup).toMatch(new RegExp(`<input[^>]*id="${id}"`));
  });

  test("with validate, the message's place is connected to the input", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} validate={() => null} />);
    const id = /<p[^>]*id="([^"]+)"[^>]*class="herror"|<p[^>]*class="herror"[^>]*id="([^"]+)"/.exec(markup)!;
    expect(markup).toContain(`aria-describedby="${id[1] ?? id[2]}"`);
  });

  test("a strip shows what tells people they can drop a file", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} variant="strip" dropLabel="or drop it" />);
    expect(markup).toContain('data-variant="strip"');
    expect(markup).toContain('<span class="hfile-input-drop">or drop it</span>');
    expect(markup).not.toContain("hfile-input-icon");
  });

  test("an area has an icon, a heading, a drop text, and a hint, in that order, before the button", () => {
    const markup = renderToStaticMarkup(
      <FileInput {...labels} variant="area" heading="H" dropLabel="D" hint="N" />,
    );
    const order = ["hfile-input-icon", "hfile-input-heading", "hfile-input-drop", "hfile-input-hint", "<label"].map((part) =>
      markup.indexOf(part),
    );
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(markup).not.toContain('<label class="hbutton" data-variant="secondary"><input class="hfile-input-control" type="file"/><svg');
  });

  test("an avatar is a label around the circle and its text", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} variant="avatar" hint="N" />);
    expect(markup).toContain('<label class="hfile-input-target">');
    expect(markup).toContain('class="havatar"');
    expect(markup).not.toContain("hfile-input-preview");
    expect(markup).toMatch(/<button[^>]*hidden=""/);
  });

  test("an avatar with a picture shows it, says so, and can be removed", () => {
    const markup = renderToStaticMarkup(
      <FileInput {...labels} variant="avatar" defaultPreview="a.png" changeLabel="Change" />,
    );
    expect(markup).toContain('src="a.png"');
    expect(markup).toContain('<span data-inactive="">Choose file</span><span>Change</span>');
    expect(markup).not.toMatch(/<button[^>]*hidden=""/);
  });

  test("one file unless asked for several, which has no remove button of its own", () => {
    expect(renderToStaticMarkup(<FileInput {...labels} />)).not.toContain("multiple");
    const markup = renderToStaticMarkup(<FileInput multiple chooseLabel="Add" onFilesAdd={() => {}} />);
    expect(markup).toMatch(/<input[^>]*multiple=""/);
    expect(markup).not.toContain("<button");
  });

  test("only an avatar with two texts stacks them", () => {
    expect(renderToStaticMarkup(<FileInput {...labels} variant="avatar" />)).not.toContain("data-stacked");
    expect(renderToStaticMarkup(<FileInput {...labels} variant="avatar" changeLabel="C" />)).toContain("data-stacked");
    expect(
      renderToStaticMarkup(<FileInput {...labels} variant="area" dropLabel="D" heading={<span>H</span>} />),
    ).not.toContain("data-stacked");
  });

  test("the icon shows an arrow, then a check once there's a file, unless replaced", () => {
    expect(renderToStaticMarkup(<FileInput {...labels} />)).toContain("hfile-input-arrow");
    expect(renderToStaticMarkup(<FileInput {...labels} defaultFileName="a" />)).toContain("hfile-input-check");
    const custom = renderToStaticMarkup(<FileInput {...labels} icon={<i id="mine" />} />);
    expect(custom).toContain('id="mine"');
    expect(custom).not.toContain("hfile-input-arrow");
  });

  test("className and hidden go on the root, and a hidden one has no message", () => {
    const markup = renderToStaticMarkup(<FileInput {...labels} className="x" hidden validate={() => null} />);
    expect(markup).toStartWith('<div class="hfile-input x" hidden="">');
    expect(markup).not.toContain("herror");
  });
});
