// Example only: what the React Header does. Each .hheader follows the page it
// scrolls in, the nearest scrolling element around it or the window: once
// that has scrolled, it has data-scrolled, which shows the hairline under
// it, and turns a transparent one frosted.
//
// With data-scroll="hide", it moves with the page, by its translate: up as
// you scroll down, as far as its own height, and back as you scroll up. Where
// the scrolling stops, it settles to whichever is nearer, with data-settling,
// "show" or "hide", which its CSS animates; hidden, it has data-hidden. Near
// the top, it stays where scrolling put it, as a header that scrolls with the
// page would be. Focus coming into it, or a popup or menu of it open, shows
// it.
// With reduced motion, nothing follows the scroll: data-hidden fades it away
// as you scroll down past it, by more than 4px, and back as you scroll up.
{
  // The page's own scrolling is the window's, even where <html> or <body>
  // sets its overflow: the document, not the element, gets its scroll events.
  const scrollerOf = (element) => {
    const root = document.documentElement;
    for (let node = element.parentElement; node && node !== root; node = node.parentElement) {
      if (node === document.body && getComputedStyle(root).overflowY === "visible") break;
      if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
    }
    return null;
  };
  const shiftOf = (element) => {
    const y = getComputedStyle(element).translate.split(" ")[1] ?? "0";
    return y.endsWith("%") ? (parseFloat(y) / 100) * element.offsetHeight : parseFloat(y) || 0;
  };
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const header of document.querySelectorAll(".hheader")) {
    const scroller = scrollerOf(header);
    const target = scroller ?? window;
    const top = () => (scroller ? scroller.scrollTop : window.scrollY);
    const hides = header.dataset.scroll === "hide";
    // Open, and shown: a menu's trigger left expanded in a closed panel
    // doesn't count.
    const busy = () =>
      header.matches(":focus-within") ||
      [...header.querySelectorAll(':popover-open, [aria-expanded="true"]')].some((open) => open.checkVisibility());
    let last = top();
    let mark = last;
    let shift = 0;
    let timer;

    const place = (y) => {
      shift = y;
      header.style.translate = `0 ${y}px`;
    };
    // Settled: shown or hidden by its attributes, or, partway near the top,
    // where it is.
    const rest = () => {
      header.removeAttribute("data-settling");
      if (shift < 0 && shift > -header.offsetHeight) return;
      header.style.removeProperty("translate");
      header.toggleAttribute("data-hidden", shift < 0);
    };
    const settle = (to) => {
      if (to === shift) return rest();
      header.setAttribute("data-settling", to < 0 ? "hide" : "show");
      place(to);
    };
    const show = () => {
      shift = 0;
      rest();
    };

    const stopped = () => {
      if (!hides || still()) return;
      const height = header.offsetHeight;
      const now = top();
      if (busy()) return settle(0);
      if (now < height) return settle(Math.max(shift, -now));
      settle(shift > -height / 2 ? 0 : -height);
    };
    const follow = () => {
      const now = top();
      const delta = now - last;
      last = now;
      header.toggleAttribute("data-scrolled", now > 0);
      if (!hides || delta === 0) return;
      const height = header.offsetHeight;
      if (still()) {
        // Reduced motion turned on mid-scroll: no shift left over.
        header.style.removeProperty("translate");
        header.removeAttribute("data-settling");
        shift = 0;
        if (busy() || now <= height) header.removeAttribute("data-hidden");
        else if (now > mark + 4) header.setAttribute("data-hidden", "");
        else if (now < mark - 4) header.removeAttribute("data-hidden");
        if (Math.abs(now - mark) > 4 || now <= 0) mark = now;
        return;
      }
      if (busy()) return show();
      // Scrolled again while it settles, or from hidden: from where it is.
      if (header.hasAttribute("data-settling")) {
        shift = shiftOf(header);
        header.removeAttribute("data-settling");
      } else if (header.hasAttribute("data-hidden")) {
        shift = -height;
        header.removeAttribute("data-hidden");
      }
      place(Math.min(0, Math.max(-height, shift - delta)));
      clearTimeout(timer);
      // Where scrollend isn't fired, scrolling has stopped once 150ms pass
      // without a scroll.
      if (!("onscrollend" in window)) timer = setTimeout(stopped, 150);
    };

    follow();
    target.addEventListener("scroll", follow, { passive: true });
    target.addEventListener("scrollend", stopped);
    header.addEventListener("transitionend", (event) => {
      if (event.target === header && event.propertyName === "translate" && header.hasAttribute("data-settling")) rest();
    });
    header.addEventListener("focusin", show);
  }
}
