// Example only: an app's own search over a list. When nothing matches, the
// list hides and the empty state shows, in its status, so a screen reader
// reads it; Clear search empties the field, as typing would, and returns to
// it.
{
  for (const field of document.querySelectorAll("[data-example-results]")) {
    const list = document.getElementById(field.dataset.exampleResults);
    const items = [...list.children];
    const empty = list.parentElement.querySelector('[role="status"] > .hempty-state');
    field.addEventListener("input", () => {
      const wanted = field.value.trim().toLowerCase();
      for (const item of items) item.hidden = !item.textContent.toLowerCase().includes(wanted);
      const none = items.every((item) => item.hidden);
      list.hidden = none;
      empty.hidden = !none;
    });
  }

  for (const button of document.querySelectorAll("[data-example-clear-search]")) {
    const field = document.getElementById(button.dataset.exampleClearSearch);
    button.addEventListener("click", () => {
      field.value = "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.focus();
    });
  }
}
