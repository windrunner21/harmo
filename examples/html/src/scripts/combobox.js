// Example only: what the React Combobox does; listbox.js moves through the
// list and picks. Typing opens the list and filters it, highlighting the
// first match, except with free text (data-free-text). A pick shows its label
// in the field and, in pick mode, its data-value in the hidden input; with
// free text, the text is the value. Leaving the field in pick mode, text that
// names an option picks it, an empty field clears the choice, and anything
// else goes back to the chosen label, and so does Enter with the list closed,
// which doesn't send the form when the text named nothing. Escape closes the
// list, or, closed, empties the field. Options the app adds or takes away, such
// as a search's results, count as they change: while what's typed is
// followed, the list opens once there's something to show and closes when
// there's nothing.
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
    // Its hidden inputs are those right after the popup with the name in
    // data-name, and no others, whatever follows them.
    const name = input.dataset.name ?? null;
    const hiddenInputs = () => {
      const found = [];
      for (let next = popup.nextElementSibling; next?.matches('input[type="hidden"]') && next.name === name; next = next.nextElementSibling) found.push(next);
      return found;
    };
    const hidden = multiple || freeText ? null : (hiddenInputs()[0] ?? null);
    const options = () => [...listbox.querySelectorAll(".hoption")];
    const groups = () => [...listbox.querySelectorAll(".hoption-group")];
    // Options and groups the page hides stay hidden, whatever is typed, and
    // so do the options in a group it hides.
    const kept = new Set([...options(), ...groups()].filter((element) => element.hidden));
    const isKept = (option) => kept.has(option) || kept.has(option.closest(".hoption-group"));
    // What typing hid, so one moved within the list isn't taken for one the
    // page hides.
    const filtered = new WeakSet();
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
    // What's typed is being followed: the list opens once there's something
    // to show. Escape, Enter, a pick, and leaving the field stop it, until
    // the next keystroke.
    let following = false;

    // Several: the choices in order, from the hidden inputs the page loaded
    // with.
    let values = multiple ? hiddenInputs().map((field) => field.value) : [];
    const initial = { option: chosen(), text: input.value, values };
    // In pick mode, the chosen label, kept for when its option leaves the
    // list, such as after a new search.
    let pickedLabel = initial.option ? labelOf(initial.option) : "";

    const isOpen = () => popup.matches(":popover-open");
    const open = () => isOpen() || popup.showPopover();
    const close = () => isOpen() && popup.hidePopover();

    // The options whose label, description, or keywords hold the query, the
    // groups left with any, and the empty message when there are none.
    const filter = (text) => {
      const wanted = text.trim().toLowerCase();
      const hide = (element, hidden) => {
        element.hidden = hidden;
        if (hidden && !kept.has(element)) filtered.add(element);
        else filtered.delete(element);
      };
      for (const option of options()) hide(option, isKept(option) || !searchTextOf(option).includes(wanted));
      for (const group of groups()) hide(group, kept.has(group) || !group.querySelector(".hoption:not([hidden])"));
      const none = options().every((option) => option.hidden);
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
      pickedLabel = option ? labelOf(option) : "";
      if (hidden) hidden.value = option?.dataset.value ?? "";
    };

    // Several: an option's value, an option by value, and a choice's label.
    const valueOf = (option) => option.dataset.value ?? labelOf(option);
    const optionOf = (value) => options().find((option) => valueOf(option) === value);
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
    // Disabled by its own attribute or by a disabled fieldset around it.
    const isDisabled = () => input.matches(":disabled");
    // The hidden inputs go with the field: to the form it names, if it names
    // one, and disabled with it.
    const hiddenField = (value) => {
      const field = Object.assign(document.createElement("input"), { type: "hidden", name, value, disabled: input.disabled });
      if (input.hasAttribute("form")) field.setAttribute("form", input.getAttribute("form"));
      return field;
    };
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
          const field = hiddenField(value);
          after.after(field);
          after = field;
        }
      }
      for (const option of options()) option.setAttribute("aria-selected", String(values.includes(valueOf(option))));
      if (required) input.required = values.length === 0;
    };
    const setValues = (next) => {
      values = next;
      render();
    };

    // The option typed text names, if it can be picked; and typed text as a
    // choice: that option, or, with free text, the text itself.
    const optionNamed = (text) => {
      const wanted = text.trim().toLowerCase();
      if (!wanted) return undefined;
      return options().find((option) => option.getAttribute("aria-disabled") !== "true" && !isKept(option) && labelOf(option).toLowerCase() === wanted);
    };
    const resolve = (text) => {
      const wanted = text.trim();
      if (!wanted) return null;
      const named = optionNamed(wanted);
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
        if (event.target !== popup) return;
        if (event.newState === "open" && (input.readOnly || isDisabled() || !filter(query()))) {
          event.preventDefault();
          return;
        }
        input.setAttribute("aria-expanded", String(event.newState === "open"));
      },
      { capture: true },
    );
    // Clicking in the list keeps focus in the field.
    popup.addEventListener("mousedown", (event) => event.preventDefault());

    // With free text, a comma ends a choice, as when addresses are typed or
    // pasted in, and the space after it goes; not while an input method is
    // composing, which may use one, so it's looked for again once it's done.
    const enter = (composing) => {
      typed = true;
      let added = false;
      if (multiple && freeText && !composing && input.value.includes(",")) {
        const parts = input.value.split(",");
        input.value = parts.pop().trimStart();
        added = addTyped(parts);
      }
      following = !(added && !input.value.trim());
      if (!filter(input.value) || !following) {
        close();
        return;
      }
      open();
      highlightFirst();
    };
    const highlightFirst = () => highlight(freeText ? null : listbox.querySelector('.hoption:not([aria-disabled="true"], [hidden])'));
    input.addEventListener("input", (event) => enter(event.isComposing));
    if (multiple && freeText) input.addEventListener("compositionend", () => enter(false));
    input.addEventListener("click", open);

    // listbox.js marks a pick selected (not with free text) and closes; this
    // shows it in the field. A click the app stops, with preventDefault() in
    // its own handler on the option, picks nothing, here as there.
    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (multiple || !option || option.getAttribute("aria-disabled") === "true" || event.defaultPrevented) return;
      typed = false;
      following = false;
      input.value = labelOf(option);
      if (freeText) return;
      pickedLabel = labelOf(option);
      if (hidden) hidden.value = option.dataset.value ?? "";
    });

    // Options that come or go: kept hidden if they arrive hidden, on their own
    // or in a group that arrives with them, and the list opened or closed to
    // match while the text is followed. A list left with nothing to show
    // closes, whatever opened it.
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          for (const element of [node, ...node.querySelectorAll(".hoption, .hoption-group")]) {
            if (element.hidden && !filtered.has(element) && element.matches(".hoption, .hoption-group")) kept.add(element);
          }
        }
      }
      const followed = following && document.activeElement === input;
      if (!isOpen() && !followed) return;
      if (!filter(query())) close();
      else if (!isOpen()) {
        open();
        highlightFirst();
      } else if (!listbox.querySelector(".hoption[data-active]:not([hidden])")) highlightFirst();
    }).observe(listbox, { childList: true, subtree: true });

    // Several: on the popup, so listbox.js has toggled the option first. The
    // text empties for the next choice, and the list stays open on all of
    // them, with the picked option still highlighted.
    popup.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!multiple || !option || option.getAttribute("aria-disabled") === "true" || event.defaultPrevented) return;
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
        following = false;
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
            following = false;
            input.value = "";
            close();
          }
        } else if (isOpen()) {
          event.preventDefault();
          following = false;
          close();
        }
        return;
      }
      // Enter with nothing highlighted closes the list; in pick mode it
      // doesn't send the form, since nothing was picked.
      if (isOpen()) {
        following = false;
        if (!freeText) event.preventDefault();
        close();
        return;
      }
      // Closed, in pick mode after typing, Enter settles the text before a
      // form is sent, so it sends what the field shows. Text that names no
      // option gives way to the chosen label, and the form isn't sent, as
      // the field showed something else. Either way the list stays closed
      // until the next keystroke.
      following = false;
      if (!freeText && typed) {
        if (input.readOnly || (input.value.trim() && !optionNamed(input.value))) event.preventDefault();
        settle();
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
        if (isDisabled() || event.target === input) return;
        const button = event.target.closest(".htag-remove");
        if (button) {
          remove(removeButtons().indexOf(button));
          return;
        }
        input.focus();
        open();
      });
    }

    // Leaving the field, or Enter with the list closed in pick mode. Made
    // read-only while typed in, what's typed is left out: in pick mode the
    // field goes back to the choice, and choosing several it empties.
    const settle = () => {
      typed = false;
      if (input.readOnly) {
        if (multiple) input.value = "";
        else if (!freeText) input.value = pickedLabel;
        return;
      }
      if (multiple) {
        if (input.value.trim()) addTyped([input.value]);
        input.value = "";
        return;
      }
      if (freeText) return;
      if (!input.value.trim()) {
        choose(null);
        input.value = "";
        return;
      }
      const named = optionNamed(input.value);
      if (named) choose(named);
      input.value = pickedLabel;
    };
    input.addEventListener("blur", () => {
      following = false;
      close();
      settle();
    });

    // The "Picked by the app" example's button, as an app's code would pick:
    // the field shows it, unless it's being typed in.
    for (const button of document.querySelectorAll(`[data-example-pick="${input.id}"]`)) {
      button.addEventListener("click", () => {
        const option = options().find((candidate) => candidate.dataset.value === button.dataset.examplePickValue);
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
        following = false;
        if (multiple) setValues(initial.values);
        else if (!freeText) choose(initial.option);
        input.value = initial.text;
      });
    });

    // Disabling the field later disables its hidden inputs, and its remove
    // buttons, as well.
    new MutationObserver(() => {
      if (multiple) render();
      else if (hidden) hidden.disabled = input.disabled;
    }).observe(input, { attributeFilter: ["disabled"] });
  }

  // "Searching as you type" stands in for a search on your server: a moment
  // after each keystroke, the people whose name holds the text, as options,
  // the chosen one checked.
  for (const input of document.querySelectorAll(".hcombobox > input[data-example-late-results]")) {
    const listbox = document.getElementById(input.getAttribute("aria-controls"));
    const hidden = listbox.closest(".hpopup").nextElementSibling;
    const people = input.dataset.exampleLateResults.split(";").map((entry) => entry.split(":"));
    const optionFor = ([value, name]) => {
      const option = document.createElement("li");
      Object.assign(option, { className: "hoption", id: `${input.id}-${value}`, role: "option" });
      option.dataset.value = value;
      option.setAttribute("aria-selected", String(value === hidden.value));
      const label = document.createElement("span");
      label.className = "hoption-label";
      label.textContent = name;
      option.append(label);
      if (value === hidden.value) option.append(template.content.firstElementChild.cloneNode(true));
      return option;
    };
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const wanted = input.value.trim().toLowerCase();
        const found = wanted ? people.filter(([, name]) => name.toLowerCase().includes(wanted)) : [];
        listbox.replaceChildren(...found.map(optionFor));
      }, 300);
    });
  }
}
