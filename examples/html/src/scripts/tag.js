// Example only: a remove button takes its tag away, as an app would, and
// focus moves to the next tag's button, or else the previous one's.
for (const button of document.querySelectorAll(".htag-remove[data-example-remove]")) {
  button.addEventListener("click", () => {
    const tag = button.closest(".htag");
    if (document.activeElement === button) {
      const next = tag.nextElementSibling?.querySelector(".htag-remove") ?? tag.previousElementSibling?.querySelector(".htag-remove");
      next?.focus();
    }
    tag.remove();
  });
}
