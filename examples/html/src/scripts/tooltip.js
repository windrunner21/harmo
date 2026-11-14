// Example only: Escape hides an open tooltip, until a press pins it open
// again, and right after one closes, the next shows without the 300ms wait,
// as the React Tooltip does.
{
  let lastTooltipHide = -Infinity;
  // The trigger whose tooltip showed last, which a neighbor's replaces.
  let lastTrigger = null;
  // On screen: visible, and not in something with display: none, such as a
  // Sidebar group's tooltip while the group is open.
  const isShown = (tooltip) => tooltip.checkVisibility({ visibilityProperty: true });

  // When each popup and dialog last opened, as Escape closes the one that
  // opened last. One open before this script ran counts as the first.
  const openedAt = new WeakMap();
  let openings = 0;
  document.addEventListener(
    "beforetoggle",
    (event) => {
      if (event.newState === "open") openedAt.set(event.target, ++openings);
    },
    true,
  );

  // Whether the popup or dialog that Escape closes, the one open that opened
  // last, holds the tooltip, or none is open: then the Escape is the
  // tooltip's alone. One that opened after the tooltip's, such as a Select's
  // list opened from its control, takes it instead. One under it doesn't
  // count, such as the dialog a second one asks over before it closes, and
  // neither does a manual popover, such as a Toaster, which stays open on
  // Escape.
  const isTopmost = (tooltip) => {
    const open = [...document.querySelectorAll(':popover-open:not([popover="manual"]), dialog:modal')];
    const order = (layer) => openedAt.get(layer) ?? 0;
    const latest = Math.max(...open.map(order));
    return open.every((layer) => order(layer) < latest || layer.contains(tooltip));
  };

  // A CSS time, such as "300ms" or "0.3s", in milliseconds.
  const milliseconds = (time) => parseFloat(time) * (time.trim().endsWith("ms") ? 1 : 1000);

  for (const trigger of document.querySelectorAll(".htooltip-trigger")) {
    const tooltip = trigger.querySelector(":scope > .htooltip");
    let entered = 0;
    let delay = 0;
    // Right after another closes, this one shows without the wait, and it and
    // the one it replaces change at once, with data-instant, so two never
    // fade over each other.
    trigger.addEventListener("pointerenter", () => {
      const recent = performance.now() - lastTooltipHide < 400;
      trigger.style.setProperty("--htooltip-delay", recent ? "0ms" : "");
      trigger.toggleAttribute("data-instant", recent);
      if (recent && lastTrigger !== trigger) lastTrigger?.setAttribute("data-instant", "");
      entered = performance.now();
      delay = recent ? 0 : milliseconds(getComputedStyle(trigger).getPropertyValue("--harmo-tooltip-delay"));
    });
    // A pointer that stayed for the delay saw the tooltip. Its style can't
    // tell by now: Firefox, which can't fade it out, has already hidden it.
    trigger.addEventListener("pointerleave", () => {
      if (performance.now() - entered >= delay) {
        lastTooltipHide = performance.now();
        lastTrigger = trigger;
      }
      tooltip.removeAttribute("data-dismissed");
    });
    // Shown by keyboard focus, which CSS shows at once, it also hides at once
    // as focus moves on.
    trigger.addEventListener("focusin", () => {
      if (trigger.matches(":has(:focus-visible)")) trigger.setAttribute("data-instant", "");
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

  // An Escape that hides a tooltip is the tooltip's, so the Dialog, Drawer, or
  // Popup it's in stays open until the next one.
  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const tooltip of document.querySelectorAll(".htooltip")) {
      if (!isShown(tooltip)) continue;
      tooltip.setAttribute("data-dismissed", "");
      lastTooltipHide = performance.now();
      if (isTopmost(tooltip)) event.preventDefault();
    }
  });
}
