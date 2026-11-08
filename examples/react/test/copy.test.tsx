import { describe, expect, test } from "bun:test";
import { CopyButton } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/copy.md says: hidden hides the tooltip and the status
// with the button, and it's always a button.
const tag = (markup: string, className: string) => new RegExp(`<[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`).exec(markup)?.[0] ?? "";

describe("CopyButton", () => {
  test("hidden hides its tooltip's trigger and its status", () => {
    const markup = renderToStaticMarkup(<CopyButton hidden value="x" label="Copy link" copiedLabel="Copied" />);
    expect(tag(markup, "htooltip-trigger")).toContain("hidden");
    expect(tag(markup, "hcopy-status")).toContain("hidden");
  });

  test("with its text, hidden hides the button and its status", () => {
    const markup = renderToStaticMarkup(<CopyButton hidden showLabel value="x" label="Copy" copiedLabel="Copied" />);
    expect(tag(markup, "hcopy")).toContain("hidden");
    expect(tag(markup, "hcopy-status")).toContain("hidden");
  });

  test("not hidden, nothing is", () => {
    const markup = renderToStaticMarkup(<CopyButton value="x" label="Copy link" copiedLabel="Copied" />);
    expect(markup).not.toMatch(/\shidden[=\s>]/);
  });

  test("it's always a plain button, whatever a spread brings", () => {
    const spread: object = { href: "/somewhere", type: "submit", onHold: () => {} };
    const markup = renderToStaticMarkup(<CopyButton {...spread} value="x" label="Copy link" copiedLabel="Copied" />);
    expect(markup).toContain('<button type="button"');
    expect(markup).not.toContain("href");
    expect(markup).not.toContain('type="submit"');
    expect(markup).not.toContain("data-hold");
  });
});
