// Example only: a remove button takes its tag away, as an app would, and
// focus moves to the next tag's button, or else the previous one's, or, with
// none left, to what the tags are in.
for (const button of document.querySelectorAll(".htag-remove[data-example-remove]")) {
  button.addEventListener("click", () => {
    const tag = button.closest(".htag");
    if (document.activeElement === button) {
      const next = tag.nextElementSibling?.querySelector(".htag-remove") ?? tag.previousElementSibling?.querySelector(".htag-remove");
      const holder = tag.parentElement;
      if (next) next.focus();
      else if (holder) {
        holder.tabIndex = -1;
        holder.focus();
      }
    }
    tag.remove();
  });
}
