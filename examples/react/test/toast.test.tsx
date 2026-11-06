import { describe, expect, test } from "bun:test";
import { toast, Toaster } from "@harmo-ui/react";
import { renderToStaticMarkup } from "react-dom/server";

// What docs/components/toast.md says about the React Toaster and toast(): the
// region is a manual popover named by its label, rendered empty on the server,
// and toast() returns the id that changes or dismisses that toast; the browser
// tests check that the same id changes it in place.
const icon = <svg />;
const icons = { success: icon, error: icon, warning: icon, info: icon };

describe("Toast", () => {
  test("the region is a manual popover, named by its label, empty on the server, with its two announcers", () => {
    toast({ title: "Not rendered on the server" });
    const markup = renderToStaticMarkup(<Toaster label="Avisos (F8)" icons={icons} />);
    expect(markup).toBe(
      '<section class="htoaster" popover="manual" tabindex="-1" aria-label="Avisos (F8)"><ol class="htoaster-list"></ol><div class="htoaster-announce" role="status" aria-atomic="false"></div><div class="htoaster-announce" role="alert" aria-atomic="false"></div></section>',
    );
  });

  test("toast() returns a new id each time, or the id it's given", () => {
    const first = toast({ title: "Saved" });
    const second = toast({ title: "Saved again" });
    expect(first).not.toBe(second);
    expect(toast({ id: "connection", title: "You're offline", duration: Infinity })).toBe("connection");
    expect(toast({ id: "connection", title: "Back online" })).toBe("connection");
  });
});
