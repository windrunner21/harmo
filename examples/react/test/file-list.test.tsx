import { describe, expect, test } from "bun:test";
import { FileList, type FileListItem } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/file-list.md says about what it renders.
const markup = (files: FileListItem[], extra: object = {}) =>
  renderToStaticMarkup(<FileList aria-label="Files" files={files} {...extra} />);

describe("FileList", () => {
  test("a named list, focusable only by script, with each file's name in its title", () => {
    const html = markup([{ id: "a", name: "a.pdf", detail: "1 kB" }]);
    expect(html).toStartWith('<ul aria-label="Files" class="hfile-list" role="list" tabindex="-1">');
    expect(html).toContain('title="a.pdf">a.pdf</span>');
    expect(html).toContain('<span class="hfile-list-detail">1 kB</span>');
    expect(html).not.toContain("data-status");
  });

  test("files there from the start aren't marked as new", () => {
    expect(markup([{ id: "a", name: "a.pdf" }])).not.toContain("data-new");
  });

  test("no remove button unless it can remove, named for its file", () => {
    expect(markup([{ id: "a", name: "a.pdf" }])).not.toContain("hfile-list-remove");
    const html = markup([{ id: "a", name: "a.pdf" }], {
      onRemove: () => {},
      removeLabel: (file: FileListItem) => `Remove ${file.name}`,
    });
    expect(html).toContain('aria-label="Remove a.pdf"');
  });

  test("progress is a bar with its value, and a status", () => {
    const html = markup([{ id: "a", name: "a.pdf", progress: 40 }]);
    expect(html).toContain('data-status="uploading"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("--hfile-list-progress:0.4");
    expect(html).not.toContain("hfile-list-done");
  });

  test("progress stays between 0 and 100", () => {
    expect(markup([{ id: "a", name: "a", progress: 140 }])).toContain('aria-valuenow="100"');
    expect(markup([{ id: "a", name: "a", progress: -5 }])).toContain('aria-valuenow="0"');
  });

  test("at 100 it's done, with a check", () => {
    const html = markup([{ id: "a", name: "a.pdf", progress: 100 }]);
    expect(html).toContain('data-status="done"');
    expect(html).toContain("hfile-list-done");
  });

  test("a failure replaces the detail and the bar, and is announced", () => {
    const html = markup([{ id: "a", name: "a.pdf", detail: "1 kB", progress: 40, error: "No." }]);
    expect(html).toContain('data-status="error"');
    expect(html).toContain('<p class="hfile-list-error" role="alert">No.</p>');
    expect(html).not.toContain("hfile-list-detail");
    expect(html).not.toContain("progressbar");
  });

  test("a retry button only beside a failure, and only if it can retry", () => {
    const retry = { onRetry: () => {}, retryLabel: "Again" };
    expect(markup([{ id: "a", name: "a", error: "No." }])).not.toContain("hbutton-label");
    expect(markup([{ id: "a", name: "a", error: "No." }], retry)).toContain('<span class="hbutton-label">Again</span>');
    expect(markup([{ id: "a", name: "a" }], retry)).not.toContain("hbutton-label");
  });

  test("a preview, an icon of your own, or the file icon", () => {
    expect(markup([{ id: "a", name: "a", preview: "a.png" }])).toContain('<img src="a.png" alt=""/>');
    expect(markup([{ id: "a", name: "a", icon: <i id="mine" /> }])).toContain('id="mine"');
    expect(markup([{ id: "a", name: "a" }])).toContain("hicon");
  });

  test("a grid says so, and className goes on the list", () => {
    const html = markup([], { layout: "grid", className: "x" });
    expect(html).toContain('data-layout="grid"');
    expect(html).toContain('class="hfile-list x"');
  });
});
