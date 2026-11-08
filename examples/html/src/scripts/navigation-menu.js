// Example only: what the React NavigationMenu does. The pointer opens a panel
// on a trigger and leaves it closing, unless the keyboard is in it; a click, or
// Enter, opens one that stays, and a click on a panel the pointer opened keeps
// it open. Moving between triggers resizes the frame while the rows slide.
// Escape, a press outside, focus leaving, and choosing a link close it. A
// vertical menu is part of the page, as an Accordion is, so those are for
// whatever it's in.
{
  for (const nav of document.querySelectorAll(".hnavigation-menu")) {
    const vertical = () => nav.dataset.orientation === "vertical";
    const triggers = [...nav.querySelectorAll(":scope > ul > li > .hnavigation-menu-trigger")];
    const panelOf = (trigger) => document.getElementById(trigger.getAttribute("aria-controls"));
    const inactive = (trigger) => trigger.disabled || trigger.getAttribute("aria-disabled") === "true";
    const keyboardInside = () => !!open?.parentElement.querySelector(":focus-visible");
    let open = null;
    let pinned = false;

    // The frame's size, from the rows', and how far to move it to stay 8px
    // inside the window.
    const place = () => {
      if (!open || vertical()) return;
      const rows = panelOf(open).querySelector(".hnavigation-menu-rows");
      nav.style.setProperty("--hnavigation-menu-width", `${rows.offsetWidth}px`);
      nav.style.setProperty("--hnavigation-menu-height", `${rows.offsetHeight}px`);
      const width = rows.offsetWidth + 18;
      const box = nav.getBoundingClientRect();
      const rtl = getComputedStyle(nav).direction === "rtl";
      const atEnd = nav.dataset.align !== "start";
      const left = rtl === atEnd ? box.left : box.right - width;
      const furthest = Math.max(document.documentElement.clientWidth - 8 - width, 8);
      nav.style.setProperty("--hnavigation-menu-shift", `${Math.min(Math.max(left, 8), furthest) - left}px`);
    };
    const watcher = new ResizeObserver(place);
    addEventListener("resize", place);

    const show = (trigger, pin) => {
      // The pointer coming back over its own trigger doesn't unpin a panel.
      if (trigger === open) {
        pinned ||= pin;
        return;
      }
      pinned = pin;
      nav.toggleAttribute("data-moving", open !== null);
      if (open) {
        open.setAttribute("aria-expanded", "false");
        panelOf(open).inert = true;
      }
      open = trigger;
      trigger.setAttribute("aria-expanded", "true");
      panelOf(trigger).inert = false;
      nav.setAttribute("data-open", "");
      if (vertical()) return;

      // The other panels wait to the side their triggers are on.
      const index = triggers.indexOf(trigger);
      triggers.forEach((other, position) => {
        const panel = panelOf(other);
        if (position === index) panel.removeAttribute("data-position");
        else panel.setAttribute("data-position", position < index ? "before" : "after");
      });
      place();
      watcher.disconnect();
      watcher.observe(panelOf(trigger).querySelector(".hnavigation-menu-rows"));
    };

    // data-moving stays, so a move that's under way finishes as it fades.
    const hide = () => {
      if (!open) return;
      open.setAttribute("aria-expanded", "false");
      panelOf(open).inert = true;
      open = null;
      pinned = false;
      nav.removeAttribute("data-open");
      watcher.disconnect();
    };

    for (const item of nav.querySelectorAll(":scope > ul > li")) {
      item.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse" || vertical() || keyboardInside()) return;
        const trigger = item.querySelector(":scope > .hnavigation-menu-trigger");
        if (trigger && inactive(trigger)) return;
        if (trigger) show(trigger, false);
        else if (!pinned) hide();
      });
    }

    nav.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse" || vertical() || pinned || keyboardInside()) return;
      hide();
    });

    nav.addEventListener("click", (event) => {
      const trigger = event.target.closest(".hnavigation-menu-trigger");
      if (trigger) {
        if (inactive(trigger)) return;
        if (trigger !== open) show(trigger, true);
        else if (pinned) hide();
        else pinned = true;
        return;
      }
      if (vertical() || !event.target.closest("a")) return;
      // A click with a modifier key opens a new tab, and this one stays.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const returning = open;
      const inside = open?.parentElement.contains(document.activeElement);
      hide();
      if (inside) returning.focus();
    });

    nav.addEventListener("focusin", (event) => {
      if (!vertical() && open && !open.parentElement.contains(event.target)) hide();
    });
    nav.addEventListener("focusout", (event) => {
      if (!vertical() && event.relatedTarget && !nav.contains(event.relatedTarget)) hide();
    });

    // A panel takes Escape for itself, so whatever it's in stays open.
    addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !open || vertical()) return;
      event.preventDefault();
      const trigger = open;
      const inside = nav.contains(document.activeElement);
      hide();
      if (inside) trigger.focus();
    });
    addEventListener("pointerdown", (event) => {
      if (open && !vertical() && !nav.contains(event.target)) hide();
    });

    // In a Popup, it starts closed each time the Popup opens.
    nav.closest("[popover]")?.addEventListener("toggle", (event) => {
      if (event.newState === "closed") hide();
    });
  }
}
