// Example only: once a language is chosen (listbox.js selects it), show it in
// the button, with its region when it has one, as the React Language Picker
// does. In a panel of regions, Left and Right move between languages as Up and
// Down do, the other way round right to left.
{
  for (const trigger of document.querySelectorAll(".hlanguage-picker[popovertarget]")) {
    const popup = document.getElementById(trigger.getAttribute("popovertarget"));
    const listbox = popup.querySelector(".hlistbox");
    const label = trigger.querySelector(".hbutton-label");

    // A region's name, without its picture.
    const nameOf = (regionLabel) =>
      [...regionLabel.childNodes]
        .filter((node) => !(node instanceof Element && node.matches(".hlanguage-picker-icon")))
        .map((node) => node.textContent)
        .join("")
        .trim();

    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.getAttribute("aria-disabled") === "true") return;
      const region = option.closest(".hoption-group")?.querySelector(".hoption-group-label");
      const parts = [option.querySelector(".hoption-label [lang]").cloneNode(true)];
      if (region) parts.unshift(Object.assign(document.createElement("span"), { className: "hlanguage-picker-region", textContent: nameOf(region) }), " ");
      label.replaceChildren(...parts);
    });

    if (!popup.matches(".hlanguage-picker-regions")) continue;
    trigger.addEventListener("keydown", (event) => {
      if ((event.key !== "ArrowLeft" && event.key !== "ArrowRight") || !popup.matches(":popover-open")) return;
      event.preventDefault();
      const back = (event.key === "ArrowLeft") !== (getComputedStyle(listbox).direction === "rtl");
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: back ? "ArrowUp" : "ArrowDown", bubbles: true, cancelable: true }));
    });
  }
}
