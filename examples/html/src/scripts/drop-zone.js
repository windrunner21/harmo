// Example only: what the React Drop Zone does, by the rules a File Input's
// drop area follows too, which drag-files.js holds. While files are dragged
// over a .hdrop-zone, it has data-dragging, which shows its frame; dropping
// them there hands them to your app, here as an example-files-add event,
// which file-list.js lists. Dragging anything else, such as text, does
// nothing. And, as your app's: a button marked data-example-pick opens the
// zone's file input, whose files arrive as dropped ones do.
{
  for (const zone of document.querySelectorAll(".hdrop-zone")) {
    const hand = (files) => zone.dispatchEvent(new CustomEvent("example-files-add", { bubbles: true, detail: files }));
    watchFileDrop(zone, {
      show: (state) => zone.toggleAttribute("data-dragging", state === "over"),
      take: hand,
    });

    const picker = zone.querySelector(':scope > input[type="file"]');
    zone.querySelector("[data-example-pick]")?.addEventListener("click", () => picker.click());
    picker?.addEventListener("change", () => {
      hand([...picker.files]);
      picker.value = "";
    });
  }
}
