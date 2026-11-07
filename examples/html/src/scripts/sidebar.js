// Example only: what the React Sidebar does. The toggle collapses the
// sidebar to its icons (data-collapsed), and back: it says which in
// aria-expanded and in its tooltip, the button's name, and closes any group
// that's open. While collapsed, a group's links open beside its icon, one
// group at a time: a click or Enter opens them, as a <details> does, and so
// does hovering, until the pointer leaves the group, whose links' panel
// reaches back to the icon, so the pointer can cross to them; then Escape, a
// press elsewhere, focus moving on, or picking a link closes them. Expanded,
// each group opens and closes on its own, or one at a time with a shared
// name.
//
// With data-example-router, a click on a link moves aria-current="page" to
// it, as an app's router would, rather than leave the page; a click with a
// modifier key is left to the browser.
{
  for (const sidebar of document.querySelectorAll(".hsidebar")) {
    const collapsed = () => sidebar.hasAttribute("data-collapsed");
    const groups = () => [...sidebar.querySelectorAll(".hsidebar-sub")];
    const closeAll = () => {
      for (const group of groups()) group.open = false;
    };

    const button = sidebar.querySelector(":scope > .hsidebar-toggle > .hsidebar-toggle-button");
    if (button) {
      const tip = document.getElementById(button.getAttribute("aria-labelledby"));
      button.addEventListener("click", () => {
        const next = !collapsed();
        sidebar.toggleAttribute("data-collapsed", next);
        button.setAttribute("aria-expanded", String(!next));
        if (tip) tip.textContent = next ? button.dataset.exampleExpandLabel : button.dataset.exampleCollapseLabel;
      });
    }

    // Becoming collapsed, however it happens, such as by your app on a
    // narrow screen, closes the groups that were open, before they'd show as
    // panels beside the icons.
    new MutationObserver(() => {
      if (collapsed()) closeAll();
    }).observe(sidebar, { attributes: true, attributeFilter: ["data-collapsed"] });

    // Collapsed, a group opened by hovering closes as the pointer leaves it,
    // unless a click has kept it open, or focus has gone into it.
    const hovered = new WeakSet();
    for (const group of groups()) {
      const item = group.parentElement;
      const summary = group.querySelector(":scope > summary");
      item.addEventListener("pointerenter", (event) => {
        if (!collapsed() || event.pointerType !== "mouse" || group.open) return;
        group.open = true;
        hovered.add(group);
      });
      item.addEventListener("pointerleave", (event) => {
        if (event.pointerType !== "mouse" || !hovered.has(group)) return;
        hovered.delete(group);
        if (!group.contains(document.activeElement)) group.open = false;
      });
      // However a group closes, it's no longer one a hover opened; and while
      // collapsed, one group's links show at a time.
      group.addEventListener("toggle", () => {
        if (!group.open) hovered.delete(group);
        if (!collapsed() || !group.open) return;
        for (const other of groups()) {
          if (other === group || !other.open) continue;
          hovered.delete(other);
          other.open = false;
        }
      });
      summary.addEventListener("click", (event) => {
        if (!hovered.has(group)) return;
        event.preventDefault();
        hovered.delete(group);
      });
      // Focus moving out of an open group, collapsed, closes it.
      group.addEventListener("focusout", (event) => {
        if (collapsed() && group.open && !group.contains(event.relatedTarget)) group.open = false;
      });
    }

    addEventListener("pointerdown", (event) => {
      if (!collapsed()) return;
      for (const group of groups()) {
        if (group.open && !group.parentElement.contains(event.target)) group.open = false;
      }
    });
    // Collapsed, picking a link closes the group it's in.
    sidebar.addEventListener("click", (event) => {
      const link = event.target.closest(".hsidebar-sub-item");
      if (!link || !collapsed()) return;
      const group = link.closest(".hsidebar-sub");
      hovered.delete(group);
      group.open = false;
    });
    // Escape closes an open group from anywhere, as one a hover opened may
    // be over the page while focus is elsewhere; focus inside goes back to
    // its summary, and focus elsewhere stays.
    addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || !collapsed()) return;
      const group = groups().find((each) => each.open);
      if (!group) return;
      event.preventDefault();
      const inside = group.contains(document.activeElement);
      group.open = false;
      if (inside) group.querySelector(":scope > summary").focus();
    });

    if (sidebar.hasAttribute("data-example-router")) {
      sidebar.addEventListener("click", (event) => {
        const link = event.target.closest("a.hsidebar-item, a.hsidebar-sub-item");
        if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        for (const current of sidebar.querySelectorAll('[aria-current="page"]')) current.removeAttribute("aria-current");
        link.setAttribute("aria-current", "page");
      });
    }
  }
}
