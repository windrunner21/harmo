// Example only: what the React Footer does. Wider than 640px, each group,
// a <details>, is open, its summary out of the Tab order and a click on it
// doing nothing, as its heading is a plain title there and its links show;
// 640px wide or less, each is closed, and folds, as an Accordion item does.
// It follows the footer's own width, as its CSS does, and changes the groups
// only as that crosses 640px, so a group someone opened stays open.
{
  for (const footer of document.querySelectorAll(".hfooter")) {
    let wide;
    const fit = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const now = footer.clientWidth > 40 * rem;
      if (now === wide) return;
      wide = now;
      for (const group of footer.querySelectorAll(".hfooter-group")) {
        group.open = now;
        const summary = group.querySelector(":scope > .hfooter-summary");
        if (now) summary?.setAttribute("tabindex", "-1");
        else summary?.removeAttribute("tabindex");
      }
    };
    fit();
    new ResizeObserver(fit).observe(footer);
    footer.addEventListener("click", (event) => {
      if (wide && event.target.closest(".hfooter-summary")) event.preventDefault();
    });
  }
}
