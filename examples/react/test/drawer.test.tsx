import { describe, expect, test } from "bun:test";
import { Button, Drawer, DrawerClose } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/drawer.md says the React Drawer adds to Dialog's props:
// its aside goes after the body and footer, with its props, and only when
// there is one; DrawerClose closes the drawer it's in.
describe("Drawer", () => {
  test("its aside goes after the form, with its props", () => {
    const markup = renderToStaticMarkup(
      <Drawer
        id="template"
        label="Edit template"
        closeLabel="Close"
        form={{ method: "dialog" }}
        footer={<Button type="submit">Save</Button>}
        aside={<p>Preview</p>}
        asideProps={{ className: "preview", "aria-label": "Preview" }}
      >
        <p>Form</p>
      </Drawer>,
    );
    expect(markup).toMatch(/<\/form><div class="hdrawer-aside preview" aria-label="Preview"><p>Preview<\/p><\/div><\/dialog>/);
  });

  test("without an aside, it has none", () => {
    const markup = renderToStaticMarkup(
      <Drawer id="reply" label="New quick reply" closeLabel="Close" />,
    );
    expect(markup).not.toContain("hdrawer-aside");
  });

  test("its title names it, and its close button is named by closeLabel", () => {
    const markup = renderToStaticMarkup(
      <Drawer id="reply" label="Nueva respuesta" description="Rápida." closeLabel="Cerrar" />,
    );
    expect(markup).toContain('aria-labelledby="reply-title"');
    expect(markup).toContain('aria-describedby="reply-description"');
    expect(markup).toContain('aria-label="Cerrar"');
  });

  test("DrawerClose makes its button close the drawer it's in", () => {
    const markup = renderToStaticMarkup(
      <Drawer id="reply" label="New quick reply" closeLabel="Close">
        <DrawerClose>
          <Button variant="secondary">Cancel</Button>
        </DrawerClose>
      </Drawer>,
    );
    expect(markup).toMatch(/<button[^>]*commandfor="reply"[^>]*command="request-close"[^>]*>(?:(?!<\/button>).)*Cancel/);
  });
});
