// Example only: Escape hides an open tooltip, and right after one closes,
// the next shows without the 300ms wait, as the React Tooltip does.
{
  let lastTooltipHide = -Infinity;
  const isShown = (tooltip) => getComputedStyle(tooltip).visibility === "visible";

  for (const trigger of document.querySelectorAll(".htooltip-trigger")) {
    const tooltip = trigger.querySelector(":scope > .htooltip");
    trigger.addEventListener("pointerenter", () => {
      const recent = performance.now() - lastTooltipHide < 400;
      trigger.style.setProperty("--htooltip-delay", recent ? "0ms" : "");
    });
    trigger.addEventListener("pointerleave", () => {
      if (isShown(tooltip)) lastTooltipHide = performance.now();
      tooltip.removeAttribute("data-dismissed");
    });
    trigger.addEventListener("focusout", () => tooltip.removeAttribute("data-dismissed"));
  }

  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const tooltip of document.querySelectorAll(".htooltip")) {
      if (!isShown(tooltip)) continue;
      tooltip.setAttribute("data-dismissed", "");
      lastTooltipHide = performance.now();
    }
  });
}
