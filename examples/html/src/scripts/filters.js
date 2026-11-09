// Example only: what the React Filters does. A filter is in force when its chip
// shows a value: the count on the chip that opens the rest says how many of
// those are, and Reset shows while any is. Reset empties every chip, by asking
// each chip's own example script to, and moves focus to the first that can
// take it.
{
  const inForce = ".hfilter-chip-values:not(:empty)";
  const canTakeFocus = ".hfilter-chip:not(:disabled, [hidden])";

  for (const row of document.querySelectorAll(".hfilters")) {
    const more = row.querySelector(":scope > .hfilters-more");
    const count = row.querySelector(":scope > .hfilter-chip .hfilters-count");
    const reset = row.querySelector(":scope > .hfilters-reset");

    const read = () => {
      const behind = more?.querySelectorAll(inForce).length ?? 0;
      if (count) {
        // Only when it changes, since writing it is what's being watched.
        if (count.textContent !== String(behind)) count.textContent = String(behind);
        count.hidden = behind === 0;
      }
      reset.hidden = row.querySelectorAll(inForce).length === 0;
    };

    read();
    new MutationObserver(read).observe(row, { childList: true, subtree: true });

    more?.addEventListener("toggle", (event) => {
      if (event.newState === "open") more.querySelector(canTakeFocus)?.focus();
    });

    reset.addEventListener("click", () => {
      for (const chip of row.querySelectorAll(".hfilter-chip")) {
        chip.dispatchEvent(new CustomEvent("example-filter-reset"));
      }
      more?.hidePopover();
      row.querySelector(canTakeFocus)?.focus();
    });
  }
}
