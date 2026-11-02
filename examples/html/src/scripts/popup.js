// Example only: keep each trigger's aria-expanded in sync with its popup, and
// record which side of the trigger the popup is on, so it slides away from
// the trigger. The React Popup does both itself.
{
  for (const popup of document.querySelectorAll(".hpopup[popover]")) {
    const trigger = [...document.querySelectorAll(`[popovertarget="${popup.id}"]`)].find(
      (element) => !popup.contains(element),
    );
    if (!trigger) continue;

    popup.addEventListener("beforetoggle", (event) => {

      trigger.setAttribute("aria-expanded", String(event.newState === "open"));

      // Closed popups stay rendered at their anchored position, so they can
      // be measured before opening.
      const popupBox = popup.getBoundingClientRect();
      const triggerBox = trigger.getBoundingClientRect();
      const side =
        popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2 ? "top" : "bottom";
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
