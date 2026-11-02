// Example only: keep each trigger's aria-expanded in sync with its popup,
// make each opening find its position afresh, and record which side of the
// trigger the popup is on, so it slides away from the trigger. The React
// Popup does all three itself.
{
  for (const popup of document.querySelectorAll(".hpopup[popover]")) {
    const trigger = [...document.querySelectorAll(`[popovertarget="${popup.id}"]`)].find(
      (element) => !popup.contains(element),
    );
    if (!trigger) continue;

    // Where an opening popup will land, from the room around its trigger, as
    // its CSS decides: above when it fits there and not below. Measured once
    // data-refit has changed, so the popup takes its whole height, not one it
    // was shrunk to where it last fit; its position can't tell where it will
    // land.
    const landing = () => {
      const triggerBox = trigger.getBoundingClientRect();
      const { marginBlockStart, marginBlockEnd } = getComputedStyle(popup);
      const needed = popup.offsetHeight + parseFloat(marginBlockStart) + parseFloat(marginBlockEnd);
      const below = document.documentElement.clientHeight - triggerBox.bottom;
      return below < needed && triggerBox.top >= needed ? "top" : "bottom";
    };

    // Where an open popup is, which scrolling may have changed since it
    // opened.
    const current = () => {
      const popupBox = popup.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      return popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2 ? "top" : "bottom";
    };

    popup.addEventListener("beforetoggle", (event) => {
      const opening = event.newState === "open";
      trigger.setAttribute("aria-expanded", String(opening));
      // A change to its fallbacks makes the browser forget where it last fit;
      // it comes first, so the popup is measured afresh.
      if (opening) popup.toggleAttribute("data-refit");

      const side = opening ? landing() : current();
      if (popup.dataset.side === side) return;

      // Move to the new starting offset without animating, so the opening
      // slide starts from the right side.
      popup.style.transition = "none";
      popup.dataset.side = side;
      popup.getBoundingClientRect();
      popup.style.transition = "";
    });
  }
}
