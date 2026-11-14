// Example only: what the React TableOfContents does. Marks the link to the
// heading you've scrolled to, or the last heading once the end is reached, as a
// short last section can never reach the top. A link you follow stays marked
// until you scroll yourself, with a wheel, a touch, a key that scrolls, or a
// press on a scrollbar, as the heading it goes to may not reach the top either.
// In a scrolling box, following a link scrolls only the box, where the
// browser's own jump would scroll the page too, and moves focus to the heading,
// as that jump would move where Tab goes next. data-example-offset is how many
// pixels a sticky header covers.
{
  const scrollerOf = (node) => {
    const root = document.documentElement;
    for (let parent = node.parentElement; parent && parent !== root; parent = parent.parentElement) {
      if (parent === document.body && getComputedStyle(root).overflowY === "visible") return null;
      const { overflowY } = getComputedStyle(parent);
      if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) return parent;
    }
    return null;
  };

  const decoded = (hash) => {
    try {
      return decodeURIComponent(hash.slice(1));
    } catch {
      return hash.slice(1);
    }
  };

  const inPageOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  // The keys that scroll, unless they're typing or pressing a button.
  const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
  const scrollsByKey = (event) => {
    if (event.defaultPrevented || !scrollKeys.includes(event.key)) return false;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return false;
    return !(event.key === " " && target?.closest("button, summary, [role='button']"));
  };

  // What the window shows, inside its scrollbars on whichever side they are,
  // such as on the left right to left, as a fixed box filling it measures.
  // Where the root makes fixed boxes fill itself instead, such as with a
  // filter, the box isn't the window's size, and the scrollbars are taken to
  // be on the right and at the bottom.
  const viewport = () => {
    const root = document.documentElement;
    const probe = document.createElement("div");
    probe.style.cssText = "position: fixed; inset: 0; margin: 0; visibility: hidden; pointer-events: none";
    root.append(probe);
    const box = probe.getBoundingClientRect();
    probe.remove();
    const fills = Math.abs(box.width - root.clientWidth) < 1 && Math.abs(box.height - root.clientHeight) < 1;
    return fills ? box : { left: 0, top: 0, right: root.clientWidth, bottom: root.clientHeight };
  };

  // A press on a scrollbar, such as to drag it, which scrolls without a wheel,
  // a touch, or a key: outside what the window shows, or on a box's, inside
  // its border but outside what it shows. A scrollbar drawn over the content,
  // taking no room, can't be told apart from it, so a press there keeps the
  // link marked.
  const onScrollbar = (event) => {
    const root = document.documentElement;
    const { clientX: x, clientY: y } = event;
    const shown = viewport();
    if (x < shown.left || y < shown.top || x >= shown.right || y >= shown.bottom) return true;
    const target = event.target;
    if (!(target instanceof Element) || target === root) return false;
    if (target.clientWidth === 0 && target.clientHeight === 0) return false;
    const box = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    const inBorder =
      x >= box.left + parseFloat(style.borderLeftWidth) &&
      x < box.right - parseFloat(style.borderRightWidth) &&
      y >= box.top + parseFloat(style.borderTopWidth) &&
      y < box.bottom - parseFloat(style.borderBottomWidth);
    const left = box.left + target.clientLeft;
    const top = box.top + target.clientTop;
    const inContent = x >= left && x < left + target.clientWidth && y >= top && y < top + target.clientHeight;
    return inBorder && !inContent;
  };

  // Where the browser's own jump would put the heading, with its scroll-margin-top
  // and the box's scroll-padding-top, and focus on it, without scrolling again.
  const goTo = (heading, scroller) => {
    const top = scroller.getBoundingClientRect().top + scroller.clientTop;
    const margin = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
    const padding = parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0;
    scroller.scrollBy({
      top: heading.getBoundingClientRect().top - top - margin - padding,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
    if (!heading.hasAttribute("tabindex") && heading.tabIndex < 0) {
      heading.setAttribute("tabindex", "-1");
      heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
    }
    heading.focus({ preventScroll: true });
  };

  for (const toc of document.querySelectorAll(".htable-of-contents")) {
    const links = [...toc.querySelectorAll(".htable-of-contents-link")];
    const line = toc.querySelector(".htable-of-contents-marker");
    const list = toc.querySelector(".htable-of-contents-list");

    // The marker slides to the current link, once it has been placed without
    // sliding as the page loads.
    const place = () => {
      if (!line) return;
      const link = toc.querySelector('.htable-of-contents-link[aria-current]:not([aria-current="false"])');
      toc.style.setProperty("--htable-of-contents-marker-y", `${link?.offsetTop ?? 0}px`);
      toc.style.setProperty("--htable-of-contents-marker-size", String(link?.offsetHeight ?? 0));
      if (!link || toc.hasAttribute("data-ready")) return;
      line.getBoundingClientRect();
      toc.setAttribute("data-ready", "");
    };
    const idOf = (link) => decoded(link.hash);
    const ids = links.map(idOf);
    const headings = () => ids.flatMap((id) => document.getElementById(id) ?? []).sort(inPageOrder);
    let pinned = null;
    let marked = null;

    const mark = (id) => {
      if (id === marked) return;
      marked = id;
      for (const link of links) {
        if (idOf(link) === id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      place();
      const link = toc.querySelector('.htable-of-contents-link[aria-current]:not([aria-current="false"])');
      if (!link || toc.scrollHeight <= toc.clientHeight) return;
      const outer = toc.getBoundingClientRect();
      const inner = link.getBoundingClientRect();
      if (inner.top < outer.top) toc.scrollTop -= outer.top - inner.top;
      else if (inner.bottom > outer.bottom) toc.scrollTop += inner.bottom - outer.bottom;
    };

    const currentId = () => {
      const found = headings();
      if (!found.length) return null;
      const scroller = scrollerOf(found[0]);
      const box = scroller ?? document.documentElement;
      if (box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 1) return found.at(-1).id;
      const top = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0;
      const line = top + (Number(toc.dataset.exampleOffset) || 0) + 8;
      let current = found[0].id;
      for (const heading of found) if (heading.getBoundingClientRect().top <= line) current = heading.id;
      return current;
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      if (!pinned) mark(currentId());
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    const followHash = () => {
      const id = decoded(location.hash);
      if (!ids.includes(id)) {
        pinned = null;
        schedule();
        return;
      }
      pinned = id;
      mark(id);
    };

    for (const link of links) {
      link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const heading = document.getElementById(idOf(link));
        const scroller = heading && scrollerOf(heading);
        if (heading && scroller) {
          event.preventDefault();
          goTo(heading, scroller);
          if (decoded(location.hash) !== idOf(link)) history.pushState(null, "", link.hash);
        }
        pinned = idOf(link);
        mark(pinned);
      });
    }

    // Each link too, as one can change height while the list keeps its own.
    if (list) {
      const sized = new ResizeObserver(place);
      sized.observe(list);
      for (const link of links) sized.observe(link);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    for (const parent of new Set(headings().map((heading) => heading.parentElement))) observer.observe(parent);

    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    for (const type of ["wheel", "touchmove"]) {
      window.addEventListener(type, () => (pinned = null), { passive: true });
    }
    window.addEventListener("keydown", (event) => {
      if (scrollsByKey(event)) pinned = null;
    });
    window.addEventListener(
      "pointerdown",
      (event) => {
        if (pinned && onScrollbar(event)) pinned = null;
      },
      { capture: true, passive: true },
    );

    if (ids.includes(decoded(location.hash))) followHash();
    else update();
  }
}
