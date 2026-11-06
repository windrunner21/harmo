import { describe, expect, test } from "bun:test";
import { Dialog } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/dialog.md says the React Dialog does with the app's own
// naming: its title and description name and describe it, and an app's
// aria-labelledby or aria-describedby is kept, not replaced.
const dialogTag = (element: React.ReactElement) =>
  /<dialog[^>]*>/.exec(renderToStaticMarkup(element))?.[0] ?? "";

describe("Dialog", () => {
  test("its title names it, and its description describes it", () => {
    const tag = dialogTag(
      <Dialog id="export" label="Export" description="As a CSV file." closeLabel="Close" />,
    );
    expect(tag).toContain('aria-labelledby="export-title"');
    expect(tag).toContain('aria-describedby="export-description"');
  });

  test("an app's aria-describedby is kept, after the description", () => {
    const tag = dialogTag(
      <Dialog
        id="delete"
        label="Delete workspace"
        description="This can't be undone."
        closeLabel="Close"
        aria-describedby="delete-warning"
      />,
    );
    expect(tag).toContain('aria-describedby="delete-description delete-warning"');
  });

  test("without a description, an app's aria-describedby is used alone", () => {
    const tag = dialogTag(
      <Dialog id="delete" label="Delete workspace" closeLabel="Close" aria-describedby="delete-warning" />,
    );
    expect(tag).toContain('aria-describedby="delete-warning"');
  });

  test("an app's aria-labelledby replaces the title's", () => {
    const tag = dialogTag(
      <Dialog id="delete" label="Delete" closeLabel="Close" aria-labelledby="delete-heading" />,
    );
    expect(tag).toContain('aria-labelledby="delete-heading"');
  });

  test("the close button is named by closeLabel, in the app's language", () => {
    const markup = renderToStaticMarkup(
      <Dialog id="export" label="Exportar" closeLabel="Cerrar" />,
    );
    expect(markup).toContain('aria-label="Cerrar"');
    expect(markup).not.toContain('aria-label="Close"');
  });
});
