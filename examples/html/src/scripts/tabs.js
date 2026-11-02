// Example only: what the React TabNav and Tabs do. The script measures
// the tabs so the hover pill and underline slide. Links move the current tab
// here instead of leaving the page; in a tablist, choosing a tab selects it
// and shows its panel, and the arrow keys, Home, and End move between tabs.
{
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  // Each Tabs' underline: a read of the current tab's box, which returns the
  // write that places the underline there, and a way to make the next
  // placement immediate.
  const indicators = [];
  // After a resize, measure every Tabs first and then place their underlines
  // at once, so no measurement waits on another's update.
  const observer = new ResizeObserver(() => {
    for (const tabs of indicators) tabs.jump();
    for (const place of indicators.map((tabs) => tabs.read())) place();
  });

  for (const tabs of document.querySelectorAll(".htabs:not([data-example-no-script])")) {
    const list = tabs.querySelector(':scope > :is(ul, [role="tablist"])');
    const isTablist = list.getAttribute("role") === "tablist";
    const highlight = tabs.querySelector(".htabs-highlight");
    const indicator = tabs.querySelector(".htabs-indicator");
    const items = () => [...list.querySelectorAll(isTablist ? ':scope > [role="tab"]' : ":scope > li > a")];
    const current = () => list.querySelector('[aria-current="page"], [aria-selected="true"]');
    let hovered = null;

    const measure = (item) => {
      const box = item.getBoundingClientRect();
      const left = box.left - tabs.getBoundingClientRect().left - tabs.clientLeft;
      return { x: `${left}px`, width: `${box.width}px` };
    };
    // A key press places the underline at once; the pointer slides it. With
    // no current tab, the underline shrinks away.
    let instant = false;
    tabs.addEventListener("keydown", () => (instant = true), true);
    tabs.addEventListener("pointerdown", () => (instant = false), true);
    const readIndicator = () => {
      const item = current();
      const box = item && measure(item);
      const jump = instant;
      instant = false;
      return () => {
        if (jump) indicator.style.transition = "none";
        if (box) tabs.style.setProperty("--htabs-indicator-x", box.x);
        tabs.style.setProperty("--htabs-indicator-width", box ? box.width : "0px");
        if (jump) {
          indicator.getBoundingClientRect();
          indicator.style.transition = "";
        }
        highlight.toggleAttribute("data-on-current", Boolean(item) && hovered === item);
      };
    };
    const placeIndicator = () => readIndicator()();
    indicators.push({ read: readIndicator, jump: () => (instant = true) });
    const choose = (item) => {
      if (isTablist) {
        for (const tab of items()) {
          const selected = tab === item;
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
        }
      } else {
        current()?.removeAttribute("aria-current");
        item.setAttribute("aria-current", "page");
      }
      placeIndicator();
    };

    list.addEventListener("pointerover", (event) => {
      const item = event.target.closest('a, [role="tab"]');
      if (!item || !canHover.matches) return;
      const { x, width } = measure(item);
      // Appear in place rather than sliding in from where it last was.
      if (!hovered) highlight.style.transition = "none";
      tabs.style.setProperty("--htabs-highlight-x", x);
      tabs.style.setProperty("--htabs-highlight-width", width);
      if (!hovered) {
        highlight.getBoundingClientRect();
        highlight.style.transition = "";
      }
      tabs.style.setProperty("--htabs-highlight-opacity", "1");
      hovered = item;
      highlight.toggleAttribute("data-on-current", item === current());
    });
    list.addEventListener("pointerleave", () => {
      tabs.style.setProperty("--htabs-highlight-opacity", "0");
      hovered = null;
    });
    list.addEventListener("click", (event) => {
      const item = event.target.closest('a, [role="tab"]');
      if (!item) return;
      event.preventDefault();
      choose(item);
    });

    // Arrow keys follow the reading direction, and selection follows focus.
    if (isTablist) {
      list.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step && event.key !== "Home" && event.key !== "End") return;
        const all = items().filter((tab) => !tab.disabled);
        const index = all.indexOf(document.activeElement);
        if (index < 0) return;
        let next;
        if (event.key === "Home") next = all[0];
        else if (event.key === "End") next = all.at(-1);
        else {
          const rtl = getComputedStyle(list).direction === "rtl";
          next = all[(index + (rtl ? -step : step) + all.length) % all.length];
        }
        event.preventDefault();
        next.focus();
        choose(next);
      });
    }

    placeIndicator();
    tabs.setAttribute("data-ready", "");
    // Their whole boxes, so a change of padding counts as well as of text.
    observer.observe(tabs, { box: "border-box" });
    for (const item of items()) observer.observe(item, { box: "border-box" });
  }
}
