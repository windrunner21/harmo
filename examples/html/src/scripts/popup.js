// Example only: keep each trigger's aria-expanded in sync with its popup,
// make each opening find its position afresh, record which side of the
// trigger the popup is on, so it slides away from the trigger, keep a closing
// popup where it is, and hand focus back when one over another closes. The
// React Popup does all of this itself. A
// popup with no popovertarget button, such as a Combobox's, is placed by the
// element it's anchored to, whose own script keeps its aria-expanded. A
// Mentions' list keeps the side it's given, data-side, as the React Mentions
// does, so it's left alone.
{
  for (const popup of document.querySelectorAll(".hpopup[popover]:not(.hmentions > .hpopup)")) {
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

    // Pins a closing popup to its box, so it fades where it is: the box
    // without the slide still under way, if it closes as it opens, since the
    // closing slide carries on from there.
    const pin = () => {
      const box = popup.getBoundingClientRect();
      const { transform } = getComputedStyle(popup);
      const slide = new DOMMatrixReadOnly(transform === "none" ? undefined : transform);
      const place = { top: box.top - slide.m42, left: box.left - slide.m41, width: box.width, height: box.height };
      for (const [name, value] of Object.entries(place)) {
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
        // Once open, and again once its opening fade is over, they change
        // again. At a fallback position, Firefox keeps the styles it worked
        // out when it placed the popup there, until they change: while it was
        // closed, as a closed popup stays laid out for its fade, or partway
        // through the fade, so it would stay unseen or faint.
        const refit = () => {
          if (popup.matches(":popover-open")) popup.toggleAttribute("data-refit");
        };
        popup.addEventListener(
          "toggle",
          (event) => {
            if (event.newState === "open") refit();
          },
          { once: true },
        );
        const faded = (event) => {
          if (event.target !== popup || event.propertyName !== "opacity") return;
          popup.removeEventListener("transitionend", faded);
          popup.removeEventListener("transitioncancel", faded);
          refit();
        };
        popup.addEventListener("transitionend", faded);
        popup.addEventListener("transitioncancel", faded);
      }

      // A browser hands focus back only for the first popup open, not one
      // opened over another. Not when it opened again at once, which sends
      // one toggle event, for the opening.
      if (!opening && popup.contains(document.activeElement)) {
        popup.addEventListener(
          "toggle",
          (event) => {
            if (event.newState !== "closed") return;
            if (document.activeElement === document.body || popup.contains(document.activeElement)) trigger.focus();
          },
          { once: true },
        );
      }

      const side = opening ? landing() : current();
      if (!opening) pin();
      if (popup.dataset.side === side) return;

      // Move to the new starting offset without animating, so the opening
      // slide starts from the right side. Only which properties transition
      // is changed, and put back, so a transition set on the popup inline
      // stays as it was.
      const transitions = popup.style.transitionProperty;
      popup.style.transitionProperty = "none";
      popup.dataset.side = side;
      popup.getBoundingClientRect();
      popup.style.transitionProperty = transitions;
    });
  }
}
