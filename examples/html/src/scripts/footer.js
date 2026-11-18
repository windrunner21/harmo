// Example only: what the React Footer does. Wider than 640px, each group,
// a <details>, is open, its summary out of the Tab order and a click on it
// doing nothing, as its heading is a plain title there and its links show;
// 640px wide or less, each is closed, and folds, as an Accordion item does.
// Which it is, the CSS says, in --hfooter-layout on the groups' nav, from the
// same container query that lays them out, so the two never disagree. The
// groups change only as that does, so a group someone opened stays open; a
// group added later takes the layout as it's added.
{
  for (const footer of document.querySelectorAll(".hfooter")) {
    const nav = footer.querySelector(":scope > .hfooter-main > .hfooter-groups");
    if (!nav) continue;
    let layout;
    const apply = (group) => {
      const wide = layout === "wide";
      group.open = wide;
      const summary = group.querySelector(":scope > .hfooter-summary");
      if (wide) summary?.setAttribute("tabindex", "-1");
      else summary?.removeAttribute("tabindex");
    };
    const fit = () => {
      const now = getComputedStyle(nav).getPropertyValue("--hfooter-layout").trim();
      if ((now !== "wide" && now !== "folded") || now === layout) return;
      layout = now;
      for (const group of nav.querySelectorAll(":scope > .hfooter-group")) apply(group);
    };
    fit();
    new ResizeObserver(fit).observe(footer);
    new MutationObserver((changes) => {
      if (!layout) return;
      for (const change of changes) {
        for (const node of change.addedNodes) {
          if (node instanceof HTMLDetailsElement && node.matches(".hfooter-group")) apply(node);
        }
      }
    }).observe(nav, { childList: true });
    footer.addEventListener("click", (event) => {
      if (layout === "wide" && event.target.closest(".hfooter-summary")) event.preventDefault();
    });
  }
}
