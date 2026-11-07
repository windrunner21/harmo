// Example only: what the React Search does. The clear button shows once
// there's text; it empties the field, keeps focus in it, and sends an input
// event, as typing does, so filtering code hears it. Escape with text empties
// the field too, and stops there, so a dialog or popup around it stays open;
// on an empty field, Escape is left to them, and while an IME is composing,
// to it. A read-only field has no clear button, and stays as it is. Code that
// sets the value sends an input event too, or the button can't follow it.
{
  const empty = (input) => {
    if (input.readOnly) return;
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  for (const search of document.querySelectorAll(".hsearch")) {
    const input = search.querySelector(".hinput");
    const clear = search.querySelector(".hsearch-clear");
    const update = () => {
      if (clear) clear.hidden = input.value === "" || input.readOnly;
    };
    input.addEventListener("input", update);
    input.form?.addEventListener("reset", () => setTimeout(update));
    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.defaultPrevented || event.key !== "Escape" || input.value === "" || input.readOnly) return;
      event.preventDefault();
      empty(input);
    });
    clear?.addEventListener("click", () => {
      empty(input);
      input.focus();
    });
    update();
  }

  // The "Filtering a list" example's own filter, as an app's would be: the
  // rows whose text holds what's typed.
  for (const input of document.querySelectorAll("[data-example-filter]")) {
    const list = document.getElementById(input.dataset.exampleFilter);
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      for (const row of list.children) row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  }
}
