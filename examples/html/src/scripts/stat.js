// Example only: a press on a Stat's hint or trend pins its tooltip open, as
// a touch screen neither hovers nor shows keyboard focus, until a press
// again, a press elsewhere, Escape, or focus leaving, as the React Stat does.
{
  for (const button of document.querySelectorAll(".hstat-header .htooltip-trigger > button")) {
    const trigger = button.parentElement;
    const unpin = () => trigger.removeAttribute("data-open");
    button.addEventListener("click", () => trigger.toggleAttribute("data-open"));
    trigger.addEventListener("focusout", unpin);
    addEventListener("pointerdown", (event) => {
      if (!trigger.contains(event.target)) unpin();
    });
    addEventListener("keydown", (event) => {
      if (event.key === "Escape") unpin();
    });
  }
}
