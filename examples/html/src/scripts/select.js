// Example only: what a script does for a Select, as the React Select does.
// A select with a name starts as its fallback, a native <select> that a form
// sends, in the trigger's place; this script takes over, hiding the fallback,
// so the trigger shows instead. The <select> stays what the form sends: once
// an option is chosen (listbox.js selects it), this shows the chosen labels in
// the trigger, or the placeholder when nothing is chosen, and selects the same
// options in the <select>. listbox.js closes a single select. Your app
// chooses for it, as React's value does, with an example-select event whose
// detail is the option, or null for none; a change it makes is heard as a
// pick's is.
{
  const checkMark = document.createElement("template");
  checkMark.innerHTML = `<svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false"><path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" /></svg>`;

  // Every fallback steps aside, a disabled select's too. Hidden, its <select>
  // can't show the browser's message, so it's no longer required.
  for (const fallback of document.querySelectorAll(".hselect-fallback")) {
    fallback.hidden = true;
    fallback.querySelector(":scope > select").required = false;
  }

  // A Phone Input shows the flag and code in its button; phone-input.js does that.
  for (const trigger of document.querySelectorAll(".hselect[popovertarget]:not(.hphone-input-country)")) {
    const popup = document.getElementById(trigger.getAttribute("popovertarget"));
    const listbox = popup.querySelector(".hlistbox");
    const value = trigger.querySelector(".hselect-value");
    const multiple = listbox.getAttribute("aria-multiselectable") === "true";
    const placeholder = value.dataset.examplePlaceholder ?? (value.hasAttribute("data-placeholder") ? value.textContent : "");
    const fallback = trigger.previousElementSibling?.matches(".hselect-fallback")
      ? trigger.previousElementSibling.querySelector(":scope > select")
      : null;
    const options = () => [...listbox.querySelectorAll(".hoption")];
    const chosen = () => options().filter((option) => option.getAttribute("aria-selected") === "true");
    // What's chosen, to tell a change: an unnamed select's options have no
    // data-value, so their ids.
    const valuesOf = (list) => list.map((option) => option.dataset.value ?? option.id).join("\n");
    const initial = chosen();

    // Chooses these options in the list, a single select's check mark moving
    // with its choice.
    const choose = (picked) => {
      for (const option of options()) option.setAttribute("aria-selected", String(picked.includes(option)));
      if (multiple || !picked[0]) return;
      picked[0].append(listbox.querySelector(".hoption-check") ?? checkMark.content.firstElementChild.cloneNode(true));
    };

    // The options its <select> holds, but its placeholder: a choice made
    // before this script ran, or the one the browser put back as the page
    // loaded, and after a reset, the ones the page loaded with.
    const sent = () => {
      const values = [...fallback.selectedOptions]
        .filter((option) => !(option.disabled && option.value === ""))
        .map((option) => option.value);
      return options().filter((option) => values.includes(option.dataset.value));
    };
    const adopting = fallback && valuesOf(sent()) !== valuesOf(initial);
    if (adopting) choose(sent());
    let held = valuesOf(chosen());

    // Show the chosen labels, and select each chosen data-value in the
    // <select>; with none, a single select's empty option. It's disabled
    // with the trigger.
    const sync = () => {
      const picked = chosen();
      const labels = picked.map((option) => option.querySelector(".hoption-label").textContent.trim());
      value.textContent = labels.length ? labels.join(", ") : placeholder;
      value.toggleAttribute("data-placeholder", labels.length === 0);
      const changed = valuesOf(picked) !== held;
      held = valuesOf(picked);

      if (fallback) {
        const values = picked.map((option) => option.dataset.value ?? "");
        if (multiple) for (const option of fallback.options) option.selected = values.includes(option.value);
        else fallback.value = values[0] ?? "";
        fallback.disabled = trigger.disabled;
      }
      // What an app hears as onValueChange in React: the choice changed, by a
      // pick or a reset. Last, once the list, the trigger, and the <select>
      // all show it, so a listener that chooses again, such as to undo a
      // choice it refuses, isn't undone itself.
      if (changed) trigger.dispatchEvent(new CustomEvent("example-select-change", { bubbles: true }));
    };
    if (adopting) sync();

    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.getAttribute("aria-disabled") === "true") return;
      sync();
    });
    trigger.addEventListener("example-select", (event) => {
      choose(event.detail ? [event.detail] : []);
      sync();
    });

    // A form reset puts the <select> back as the page loaded it, and the
    // list follows it; without one, the list goes back to its first choices.
    // It waits for the reset to happen, since another listener may cancel it.
    trigger.form?.addEventListener("reset", (event) => {
      setTimeout(() => {
        if (event.defaultPrevented) return;
        choose(fallback ? sent() : initial);
        sync();
      });
    });

    // Disabling the trigger later disables its <select> as well.
    if (fallback) new MutationObserver(sync).observe(trigger, { attributeFilter: ["disabled"] });
  }

  // The form example shows what it would send instead of leaving the page,
  // until a choice changes, a reset's included.
  for (const form of document.querySelectorAll("form[data-example-form]")) {
    const output = form.querySelector("[data-example-submitted]");
    const waiting = output.value;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const sent = new URLSearchParams(new FormData(form)).toString();
      output.value = sent ? `Sends ${sent}` : "Sends nothing";
    });
    document.addEventListener("example-select-change", (event) => {
      if (event.target.form === form) output.value = waiting;
    });
  }
}
