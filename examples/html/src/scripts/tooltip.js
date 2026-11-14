// Example only: Escape hides an open tooltip, until a press pins it open
// again, and right after one closes, the next shows without the 300ms wait,
// as the React Tooltip does.
{
  let lastTooltipHide = -Infinity;
  const isShown = (tooltip) => getComputedStyle(tooltip).visibility === "visible";

  // A CSS time, such as "300ms" or "0.3s", in milliseconds.
  const milliseconds = (time) => parseFloat(time) * (time.trim().endsWith("ms") ? 1 : 1000);

  for (const trigger of document.querySelectorAll(".htooltip-trigger")) {
    const tooltip = trigger.querySelector(":scope > .htooltip");
    let entered = 0;
    let delay = 0;
    trigger.addEventListener("pointerenter", () => {
      const recent = performance.now() - lastTooltipHide < 400;
      trigger.style.setProperty("--htooltip-delay", recent ? "0ms" : "");
      entered = performance.now();
      delay = recent ? 0 : milliseconds(getComputedStyle(trigger).getPropertyValue("--harmo-tooltip-delay"));
    });
    // A pointer that stayed for the delay saw the tooltip. Its style can't
    // tell by now: Firefox, which can't fade it out, has already hidden it.
    trigger.addEventListener("pointerleave", () => {
      if (performance.now() - entered >= delay) lastTooltipHide = performance.now();
      tooltip.removeAttribute("data-dismissed");
    });
    trigger.addEventListener("focusout", () => tooltip.removeAttribute("data-dismissed"));
    // A press that pins it open again, as data-open does, such as on a
    // Stat's hint or a Tag List's "+N", shows it again after Escape.
    new MutationObserver((records) => {
      if (trigger.hasAttribute("data-open") && records.some((record) => record.oldValue === null)) {
        tooltip.removeAttribute("data-dismissed");
      }
    }).observe(trigger, { attributeFilter: ["data-open"], attributeOldValue: true });
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
