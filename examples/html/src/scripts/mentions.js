// Example only: what the React Mentions does; listbox.js highlights and
// moves through the list, as for a Combobox. Typing the trigger, "@" or the
// field's data-example-trigger, and a few letters, with nothing but letters
// between them and the caret, lists the options whose label or description
// has them, and opens the list; with data-example-at-start, only at the start
// of the field. Choosing one, by a click, Enter, or Tab, puts the trigger, its
// data-example-value, and a space in place of what was typed, the caret after
// it. Escape closes the list until the text changes; leaving the field
// closes it too, as does moving the caret off what was typed. Focus stays in
// the field throughout. In an Input, ↓ or ↑ opens the list again with the
// trigger typed, as there are no lines for them to move between. Keys an
// input method uses while composing text are left to it.
{
  for (const wrapper of document.querySelectorAll(".hmentions")) {
    const field = wrapper.querySelector(":scope > :is(.htextarea, .hinput)");
    const singleLine = field.matches(".hinput");
    const popup = wrapper.querySelector(".hpopup");
    const listbox = popup.querySelector(".hlistbox");
    const options = [...listbox.querySelectorAll(".hoption")];
    const trigger = field.dataset.exampleTrigger ?? "@";
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(field.hasAttribute("data-example-at-start") ? `^${escaped}(\\S*)$` : `(?:^|\\s)${escaped}(\\S*)$`);
    const searchTextOf = (option) =>
      [...option.querySelectorAll(".hoption-label, .hoption-description")].map((part) => part.textContent.trim()).join(" ").toLowerCase();
    let token = null;
    let dismissed = false;

    const isOpen = () => popup.matches(":popover-open");
    // The trigger and what's typed after it, up to the caret, if any.
    const tokenHere = () => {
      const position = field.selectionStart;
      const match = pattern.exec(field.value.slice(0, position));
      return match ? { start: position - match[1].length - trigger.length, end: position, query: match[1].toLowerCase() } : null;
    };
    const follow = () => {
      token = tokenHere();
      for (const option of options) option.hidden = token !== null && !searchTextOf(option).includes(token.query);
      const shows = token !== null && !dismissed && options.some((option) => !option.hidden);
      if (shows && !isOpen()) popup.showPopover();
      if (!shows && isOpen()) popup.hidePopover();
      // A new query starts from its first match.
      if (shows) listbox.dispatchEvent(new CustomEvent("example-highlight", { detail: options.find((option) => !option.hidden) }));
    };

    // Where the caret is now, as it may have moved since the list opened.
    const choose = (option) => {
      const here = tokenHere();
      token = null;
      if (isOpen()) popup.hidePopover();
      if (!here) return;
      const inserted = `${trigger}${option.dataset.exampleValue} `;
      field.value = field.value.slice(0, here.start) + inserted + field.value.slice(here.end);
      const caret = here.start + inserted.length;
      field.setSelectionRange(caret, caret);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };

    field.addEventListener("input", () => {
      dismissed = false;
      follow();
    });
    // The caret moved without the text changing, by a key or a click.
    const moved = () => {
      const here = tokenHere();
      if (here?.start !== token?.start || here?.end !== token?.end) follow();
    };
    field.addEventListener("keyup", moved);
    field.addEventListener("click", moved);
    field.addEventListener("blur", () => {
      dismissed = true;
      if (isOpen()) popup.hidePopover();
    });
    // Before listbox.js, so Escape and Tab are the list's while it's open.
    field.addEventListener(
      "keydown",
      (event) => {
        if (event.isComposing || event.keyCode === 229) return;
        if (!isOpen()) {
          if (!singleLine || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
          dismissed = false;
          follow();
          if (isOpen()) event.preventDefault();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          dismissed = true;
          popup.hidePopover();
        } else if (event.key === "Tab" && !event.shiftKey) {
          const active = document.getElementById(field.getAttribute("aria-activedescendant") ?? "");
          if (!active) return;
          event.preventDefault();
          choose(active);
        }
      },
      { capture: true },
    );
    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (option) choose(option);
    });
    popup.addEventListener("mousedown", (event) => event.preventDefault());
  }
}
