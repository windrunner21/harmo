// Example only: keep each trigger's aria-expanded in sync with its popup,
// keep a closing popup laid out until its fade ends, with data-closing, and
// make each opening find its position afresh, record which side of the
// trigger the popup is on, so it slides away from the trigger, keep a closing
// popup where it is, and hand focus back when one over another closes. The
// React Popup does all of this itself. A
// popup with no popovertarget button, such as a Combobox's, is placed by the
// element it's anchored to, whose own script keeps its aria-expanded. A
// Mentions' list keeps the side it's given, data-side, as the React Mentions
// does, so it's only refit.
{
  for (const popup of document.querySelectorAll(".hpopup[popover]")) {
    // As it opens, its fallbacks change: that makes the browser forget where
    // it last fit, so it's placed afresh, and comes before measuring it. They
    // change again once it's open, and once its opening fade is over if it
    // didn't end fully shown: at a fallback position, Firefox keeps the
    // styles it worked out when it placed the popup there, until they change:
    // while it was closed, as it stays laid out for its closing fade, or
    // partway through the opening fade, so it would stay unseen or faint.
    // Each opening or closing voids what an earlier one left to do,
    // including one in the same task, which shares its toggle event.
    let openings = 0;
    let closings = 0;
    popup.addEventListener("beforetoggle", (event) => {
      if (event.defaultPrevented) return;
      const opened = ++openings;
      // Closing, it stays laid out with data-closing until its fade ends, so
      // it fades in every browser: Firefox and Safari don't keep a closing
      // popover laid out themselves.
      if (event.newState !== "open") {
        const closed = ++closings;
        popup.setAttribute("data-closing", "");
        popup.addEventListener(
          "toggle",
          (event) => {
            if (event.newState !== "closed") return;
            const release = () => {
              if (closed === closings && !popup.matches(":popover-open")) popup.removeAttribute("data-closing");
            };
            const fadeOf = () =>
              popup
                .getAnimations()
                .find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "opacity");
            const wait = (fade) => {
              if (fade) fade.finished.then(release, release);
              else release();
            };
            // Safari may start the fade a frame late.
            const fade = fadeOf();
            if (fade) wait(fade);
            else requestAnimationFrame(() => wait(fadeOf()));
          },
          { once: true },
        );
        return;
      }
      // Opened again as it fades out, it stays laid out until it's open, so
      // its fade carries on from where it is. Only an opening that happens
      // voids the closing: not one another listener turns down.
      popup.addEventListener(
        "toggle",
        (event) => {
          if (event.newState !== "open" || !popup.matches(":popover-open")) return;
          closings += 1;
          popup.removeAttribute("data-closing");
        },
        { once: true },
      );
      const current = () => opened === openings && popup.matches(":popover-open");
      popup.toggleAttribute("data-refit");
      popup.addEventListener(
        "toggle",
        (event) => {
          if (event.newState !== "open" || !current()) return;
          popup.toggleAttribute("data-refit");
          const fade = popup
            .getAnimations()
            .find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "opacity");
          fade?.finished
            .catch(() => {})
            .then(() => {
              if (current() && getComputedStyle(popup).opacity !== "1") popup.toggleAttribute("data-refit");
            });
        },
        { once: true },
      );
    });
    if (popup.matches(".hmentions > .hpopup")) continue;

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
    // its CSS decides: above when it fits there and not below; or, with
    // data-preferred-side="top", whenever it fits there. Without room on
    // either side, it shrinks below. Measured once
    // data-refit has changed, so the popup takes its whole height, not one it
    // was shrunk to where it last fit; its position can't tell where it will
    // land. Still closed, it isn't laid out: data-measuring lays it out for
    // this, unseen.
    const landing = () => {
      const triggerBox = trigger.getBoundingClientRect();
      popup.setAttribute("data-measuring", "");
      const { marginBlockStart, marginBlockEnd } = getComputedStyle(popup);
      const needed = popup.offsetHeight + parseFloat(marginBlockStart) + parseFloat(marginBlockEnd);
      popup.removeAttribute("data-measuring");
      const below = document.documentElement.clientHeight - triggerBox.bottom;
      const above = triggerBox.top >= needed;
      return above && (popup.dataset.preferredSide === "top" || below < needed) ? "top" : "bottom";
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
      if (opening) unpin();

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
      // slide starts from the right side; opened again as it fades out, its
      // fade carries on. Only which properties transition is changed, and
      // put back, so a transition set on the popup inline stays as it was.
      const transitions = popup.style.transitionProperty;
      popup.style.transitionProperty = getComputedStyle(popup)
        .transitionProperty.split(", ")
        .map((property) => (property === "transform" ? "--hpopup-held" : property))
        .join(", ");
      popup.dataset.side = side;
      popup.getBoundingClientRect();
      popup.style.transitionProperty = transitions;
    });
  }
}
