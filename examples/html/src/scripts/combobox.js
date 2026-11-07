// Example only: what the React Combobox does; listbox.js moves through the
// list and picks. Typing opens the list and filters it, highlighting the
// first match, except with free text (data-free-text). A pick shows its label
// in the field and, in pick mode, its data-value in the hidden input; with
// free text, the text is the value. Leaving the field in pick mode, text that
// names an option picks it, an empty field clears the choice, and anything
// else goes back to the chosen label. Escape closes the list, or, closed,
// empties the field.
//
// Choosing several (data-multiple on .hcombobox), each choice is a Tag in a
// Tag List before the text, with a remove button, and a hidden input after
// the popup; tag-list.js counts what fits.
// A pick adds an option, or takes it away, and the list stays open; with free
// text, Enter, a comma, or leaving the field makes the text a choice.
// Backspace in an empty field takes the last choice away, and the arrow
// toward the start moves to the remove buttons.
{
  const template = document.createElement("template");
  template.innerHTML = `<svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false"><path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" /></svg>`;
  const removeTemplate = document.createElement("template");
  removeTemplate.innerHTML = `<button class="htag-remove" type="button" tabindex="-1"><svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg></button>`;

  for (const input of document.querySelectorAll('.hcombobox > input[role="combobox"]')) {
    const listbox = document.getElementById(input.getAttribute("aria-controls"));
    if (!listbox) continue;
    const popup = listbox.closest(".hpopup");
    const wrapper = input.closest(".hcombobox");
    const freeText = input.hasAttribute("data-free-text");
    const multiple = wrapper.hasAttribute("data-multiple");
    const hiddenInputs = () => {
      const found = [];
      for (let next = popup.nextElementSibling; next?.matches('input[type="hidden"]'); next = next.nextElementSibling) found.push(next);
      return found;
    };
    const hidden = multiple ? null : (hiddenInputs()[0] ?? null);
    const options = [...listbox.querySelectorAll(".hoption")];
    const groups = [...listbox.querySelectorAll(".hoption-group")];
    // Options and groups the page hides stay hidden, whatever is typed.
    const kept = new Set([...options, ...groups].filter((element) => element.hidden));
    const labelOf = (option) => option.querySelector(".hoption-label").textContent.trim();
    // What typing finds an option by: its label, its description, and its
    // keywords (data-example-keywords).
    const searchTextOf = (option) =>
      [...option.querySelectorAll(".hoption-label, .hoption-description")].map((part) => part.textContent.trim()).concat(option.dataset.exampleKeywords ?? "").join(" ").toLowerCase();
    const chosen = () => listbox.querySelector('.hoption[aria-selected="true"]');
    // The app's status for no matches, after the list, in the page from the
    // start so a screen reader reads it as it fills; without one, the list
    // closes rather than show nothing.
    const message = input.dataset.exampleEmpty;
    const empty = listbox.nextElementSibling?.matches(".hlistbox-empty") ? listbox.nextElementSibling : null;
    // Typed since the last pick: only then does the text filter the list, so
    // opening on a chosen option shows them all. Choosing several, the text
    // is only ever what's typed.
    let typed = false;
    const query = () => (typed || multiple ? input.value : "");

    // Several: the choices in order, from the hidden inputs the page loaded
    // with, and the name they're sent under.
    const name = multiple ? (hiddenInputs()[0]?.name ?? input.dataset.exampleName) : null;
    let values = multiple ? hiddenInputs().map((field) => field.value) : [];
    const initial = { option: chosen(), text: input.value, values };

    const isOpen = () => popup.matches(":popover-open");
    const open = () => isOpen() || popup.showPopover();
    const close = () => isOpen() && popup.hidePopover();

    // The options whose label, description, or keywords hold the query, the
    // groups left with any, and the empty message when there are none.
    const filter = (text) => {
      const wanted = text.trim().toLowerCase();
      for (const option of options) option.hidden = kept.has(option) || !searchTextOf(option).includes(wanted);
      for (const group of groups) group.hidden = kept.has(group) || !group.querySelector(".hoption:not([hidden])");
      const none = options.every((option) => option.hidden);
      if (empty) empty.textContent = none ? (message ?? "") : "";
      return !none || empty !== null;
    };

    // listbox.js highlights; this asks it to.
    const highlight = (option) => listbox.dispatchEvent(new CustomEvent("example-highlight", { detail: option }));

    // The chosen option, or none: its check mark, and the hidden input.
    const choose = (option) => {
      const previous = chosen();
      if (previous !== option) {
        previous?.setAttribute("aria-selected", "false");
        option?.setAttribute("aria-selected", "true");
        if (option) option.append(listbox.querySelector(".hoption-check") ?? template.content.firstElementChild.cloneNode(true));
        else listbox.querySelector(".hoption-check")?.remove();
      }
      if (hidden) hidden.value = option?.dataset.value ?? "";
    };

    // Several: an option's value, an option by value, and a choice's label.
    const valueOf = (option) => option.dataset.value ?? labelOf(option);
    const optionOf = (value) => options.find((option) => valueOf(option) === value);
    const labelFor = (value) => {
      const option = optionOf(value);
      return option ? labelOf(option) : value;
    };
    const tags = multiple ? wrapper.querySelector(":scope > .htag-list") : null;
    const moreItem = tags?.querySelector(":scope > .htag-list-more") ?? null;
    const removeButtons = () => [...wrapper.querySelectorAll(":scope > .htag-list > li > .htag > .htag-remove")];
    // Choosing several, the choices satisfy required, not the text: the page
    // marks it with aria-required, and required holds only while none is
    // made.
    const required = multiple && input.getAttribute("aria-required") === "true";
    const canRemove = () => !input.disabled && !input.readOnly;
    const towardStart = () => (getComputedStyle(wrapper).direction === "rtl" ? "ArrowRight" : "ArrowLeft");
    const towardEnd = () => (towardStart() === "ArrowLeft" ? "ArrowRight" : "ArrowLeft");

    // The choices as Tags in the list before the text, one hidden input each,
    // and the options marked chosen.
    const render = () => {
      for (const item of [...tags.children]) if (item !== moreItem) item.remove();
      for (const value of values) {
        const label = labelFor(value);
        const tag = document.createElement("span");
        tag.className = "htag";
        const button = removeTemplate.content.firstElementChild.cloneNode(true);
        button.setAttribute("aria-label", (input.dataset.exampleRemoveLabel ?? "{label}").replace("{label}", label));
        button.disabled = !canRemove();
        tag.append(label, button);
        const item = document.createElement("li");
        item.append(tag);
        tags.insertBefore(item, moreItem);
      }
      for (const field of hiddenInputs()) field.remove();
      if (name) {
        let after = popup;
        for (const value of values) {
          const field = document.createElement("input");
          field.type = "hidden";
          field.name = name;
          field.value = value;
          after.after(field);
          after = field;
        }
      }
      for (const option of options) option.setAttribute("aria-selected", String(values.includes(valueOf(option))));
      if (required) input.required = values.length === 0;
    };
    const setValues = (next) => {
      values = next;
      render();
    };

    // Typed text as a choice: an option it names that can be picked, or,
    // with free text, the text itself.
    const resolve = (text) => {
      const wanted = text.trim();
      if (!wanted) return null;
      const named = options.find((option) => option.getAttribute("aria-disabled") !== "true" && !kept.has(option) && labelOf(option).toLowerCase() === wanted.toLowerCase());
      return named ? valueOf(named) : freeText ? wanted : null;
    };
    const addTyped = (texts) => {
      const next = [...values];
      for (const text of texts) {
        const value = resolve(text);
        if (value !== null && !next.includes(value)) next.push(value);
      }
      if (next.length !== values.length) setValues(next);
      return texts.some((text) => resolve(text) !== null);
    };
    // Takes a choice away; when its button had focus, focus moves on to the
    // next one, or the previous with Backspace, or the field.
    const remove = (index, { towardPrevious = false } = {}) => {
      const buttons = removeButtons();
      const focused = buttons[index] === document.activeElement;
      setValues(values.filter((_, other) => other !== index));
      if (!focused) return;
      const after = removeButtons();
      const next = towardPrevious ? (after[index - 1] ?? after[index]) : after[index];
      (next ?? input).focus();
    };

    // Opening shows the whole list, or what the typed text matches, and is
    // cancelled with nothing to show, however it was asked for: typing, a
    // click, or Down; a read-only field keeps it closed, so nothing can be
    // picked. This runs before listbox.js and popup.js, so they highlight
    // among what shows, or leave a cancelled opening alone.
    popup.addEventListener(
      "beforetoggle",
      (event) => {
        if (event.newState === "open" && (input.readOnly || !filter(query()))) {
          event.preventDefault();
          return;
        }
        input.setAttribute("aria-expanded", String(event.newState === "open"));
      },
      { capture: true },
    );
    // Clicking in the list keeps focus in the field.
    popup.addEventListener("mousedown", (event) => event.preventDefault());

    input.addEventListener("input", () => {
      typed = true;
      // With free text, a comma ends a choice, as when addresses are typed or
      // pasted in, and the space after it goes.
      let added = false;
      if (multiple && freeText && input.value.includes(",")) {
        const parts = input.value.split(",");
        input.value = parts.pop().trimStart();
        added = addTyped(parts);
      }
      if (!filter(input.value) || (added && !input.value.trim())) {
        close();
        return;
      }
      open();
      highlight(freeText ? null : listbox.querySelector('.hoption:not([aria-disabled="true"], [hidden])'));
    });
    input.addEventListener("click", open);

    // listbox.js marks a pick selected (not with free text) and closes; this
    // shows it in the field.
    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (multiple || !option || option.getAttribute("aria-disabled") === "true") return;
      typed = false;
      input.value = labelOf(option);
      if (!freeText && hidden) hidden.value = option.dataset.value ?? "";
    });

    // Several: on the popup, so listbox.js has toggled the option first. The
    // text empties for the next choice, and the list stays open on all of
    // them, with the picked option still highlighted.
    popup.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!multiple || !option || option.getAttribute("aria-disabled") === "true") return;
      const value = valueOf(option);
      setValues(option.getAttribute("aria-selected") === "true" ? [...values, value] : values.filter((other) => other !== value));
      input.value = "";
      filter("");
    });

    // On the wrapper, so listbox.js has handled the field's keys first.
    wrapper.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;

      // A choice's remove button: the arrows move between them, and back to
      // the field; Backspace and Delete take the choice away; Escape goes
      // back to the field.
      const button = event.target.closest?.(".htag-remove");
      if (button) {
        const buttons = removeButtons();
        const index = buttons.indexOf(button);
        if (event.key === towardStart()) buttons[Math.max(index - 1, 0)].focus();
        else if (event.key === towardEnd()) (buttons[index + 1] ?? input).focus();
        else if (event.key === "Backspace") remove(index, { towardPrevious: true });
        else if (event.key === "Delete") remove(index);
        else if (event.key === "Escape") input.focus();
        else return;
        event.preventDefault();
        return;
      }
      if (event.target !== input) return;

      if (multiple && input.value === "" && values.length && canRemove()) {
        // Backspace takes the last choice away, and the arrow toward the
        // start moves to it. A held Backspace stops at the text.
        if (event.key === "Backspace" && !event.repeat) {
          event.preventDefault();
          setValues(values.slice(0, -1));
          return;
        }
        if (event.key === towardStart()) {
          event.preventDefault();
          removeButtons().at(-1).focus();
          return;
        }
      }

      if (event.key === "Escape") {
        // Either way it stops there, so a dialog around it stays open.
        if (isOpen()) {
          event.preventDefault();
          close();
        } else if (input.value !== "" && !input.readOnly) {
          event.preventDefault();
          typed = false;
          input.value = "";
          if (!freeText && !multiple) choose(null);
        }
        return;
      }
      if (event.key !== "Enter" || event.defaultPrevented) return;
      // Choosing several, Enter with nothing highlighted makes the text a
      // choice, if it can be one, and doesn't send the form.
      if (multiple) {
        if (input.value.trim()) {
          event.preventDefault();
          if (addTyped([input.value])) {
            input.value = "";
            close();
          }
        } else if (isOpen()) {
          event.preventDefault();
          close();
        }
        return;
      }
      // Enter with nothing highlighted closes the list; in pick mode it
      // doesn't send the form, since nothing was picked.
      if (isOpen()) {
        if (!freeText) event.preventDefault();
        close();
      }
    });

    // Several: the box is the field. A press on it, between or on the
    // choices, keeps focus in the text, and a click opens the list; a remove
    // button takes its choice away.
    if (multiple) {
      wrapper.addEventListener("mousedown", (event) => {
        if (event.target !== input) event.preventDefault();
      });
      wrapper.addEventListener("click", (event) => {
        if (input.disabled || event.target === input) return;
        const button = event.target.closest(".htag-remove");
        if (button) {
          remove(removeButtons().indexOf(button));
          return;
        }
        input.focus();
        open();
      });
    }

    input.addEventListener("blur", () => {
      close();
      typed = false;
      if (multiple) {
        if (input.value.trim()) addTyped([input.value]);
        input.value = "";
        return;
      }
      if (freeText) return;
      const text = input.value.trim().toLowerCase();
      if (!text) {
        choose(null);
        input.value = "";
        return;
      }
      const named = options.find((option) => option.getAttribute("aria-disabled") !== "true" && !kept.has(option) && labelOf(option).toLowerCase() === text);
      if (named) choose(named);
      const current = chosen();
      input.value = current ? labelOf(current) : "";
    });

    // The "Picked by the app" example's button, as an app's code would pick:
    // the field shows it, unless it's being typed in.
    for (const button of document.querySelectorAll(`[data-example-pick="${input.id}"]`)) {
      button.addEventListener("click", () => {
        const option = options.find((candidate) => candidate.dataset.value === button.dataset.examplePickValue);
        choose(option ?? null);
        if (!typed) input.value = option ? labelOf(option) : "";
      });
    }

    // A form reset restores the value the page loaded with, once it's
    // happened, since another listener may cancel it.
    input.form?.addEventListener("reset", (event) => {
      setTimeout(() => {
        if (event.defaultPrevented) return;
        typed = false;
        if (multiple) setValues(initial.values);
        else if (!freeText) choose(initial.option);
        input.value = initial.text;
      });
    });
  }
}
