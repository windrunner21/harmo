// Example only: keep each trigger's aria-expanded in sync with its popup,
// make each opening find its position afresh, record which side of the
// trigger the popup is on, so it slides away from the trigger, keep a closing
// popup where it is, and hand focus back when one over another closes. The
// React Popup does all of this itself. A
// popup with no popovertarget button, such as a Combobox's, is placed by the
// element it's anchored to, whose own script keeps its aria-expanded.
{
  for (const popup of document.querySelectorAll(".hpopup[popover]")) {
    const invoker = [...document.querySelectorAll(`[popovertarget="${popup.id}"]`)].find(
      (element) => !popup.contains(element),
    );
    const anchor = popup.style.getPropertyValue("position-anchor").trim();
    const trigger =
      invoker ??
      [...document.querySelectorAll('[style*="anchor-name"]')].find(
        (element) => anchor && element.style.getPropertyValue("anchor-name").trim() === anchor,
      );
    if (!trigger) continue;

    // Where an opening popup will land, from the room around its trigger, as
    // its CSS decides: above when it fits there and not below. Measured once
    // data-refit has changed, so the popup takes its whole height, not one it
    // was shrunk to where it last fit; its position can't tell where it will
    // land.
    const landing = () => {
      const triggerBox = trigger.getBoundingClientRect();
      const { marginBlockStart, marginBlockEnd } = getComputedStyle(popup);
      const needed = popup.offsetHeight + parseFloat(marginBlockStart) + parseFloat(marginBlockEnd);
      const below = document.documentElement.clientHeight - triggerBox.bottom;
      return below < needed && triggerBox.top >= needed ? "top" : "bottom";
    };

    // Where an open popup is, which scrolling may have changed since it
    // opened.
    const current = () => {
      const popupBox = popup.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      return popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2 ? "top" : "bottom";
    };

    // Pins a closing popup to its box, so it fades where it is.
    const pin = () => {
      const box = popup.getBoundingClientRect();
      for (const [name, value] of Object.entries({ top: box.top, left: box.left, width: box.width, height: box.height })) {
        popup.style.setProperty(`--hpopup-pinned-${name}`, `${value}px`);
      }
      popup.setAttribute("data-pinned", "");
    };
    const unpin = () => {
      popup.removeAttribute("data-pinned");
      for (const name of ["top", "left", "width", "height"]) popup.style.removeProperty(`--hpopup-pinned-${name}`);
    };

    popup.addEventListener("beforetoggle", (event) => {
      if (event.defaultPrevented) return;
      const opening = event.newState === "open";
      if (invoker) trigger.setAttribute("aria-expanded", String(opening));
      // A change to its fallbacks makes the browser forget where it last fit;
      // it comes first, so the popup is measured afresh.
      if (opening) {
        unpin();
        popup.toggleAttribute("data-refit");
      }

      // A browser hands focus back only for the first popup open, not one
      // opened over another.
      if (!opening && popup.contains(document.activeElement)) {
        popup.addEventListener(
          "toggle",
          () => {
            if (document.activeElement === document.body || popup.contains(document.activeElement)) trigger.focus();
          },
          { once: true },
        );
      }

      const side = opening ? landing() : current();
      if (!opening) pin();
      if (popup.dataset.side === side) return;

      // Move to the new starting offset without animating, so the opening
      // slide starts from the right side.
      popup.style.transition = "none";
      popup.dataset.side = side;
      popup.getBoundingClientRect();
      popup.style.transition = "";
    });
  }
}
