// Example only: what the React Listbox does with the pointer and the
// keyboard.
{
  const template = document.createElement("template");
  template.innerHTML = `<svg class="hoption-check" viewBox="5.845 5.87 14 14" aria-hidden="true" focusable="false"><path d="M11.4261 16.455C11.2261 16.455 11.0361 16.375 10.8961 16.235L8.06613 13.405C7.77613 13.115 7.77613 12.635 8.06613 12.345C8.35613 12.055 8.83613 12.055 9.12613 12.345L11.4261 14.645L16.5661 9.505C16.8561 9.215 17.3361 9.215 17.6261 9.505C17.9161 9.795 17.9161 10.275 17.6261 10.565L11.9561 16.235C11.8161 16.375 11.6261 16.455 11.4261 16.455Z" fill="currentColor" /></svg>`;

  // A truncated label gets a native tooltip with its full text; a label that
  // fits gets none. Setting a title doesn't change layout, so measuring every
  // label in turn stays cheap.
  const updateTitles = (listbox) => {
    for (const label of listbox.querySelectorAll(".hoption-label")) {
      if (label.scrollWidth > label.clientWidth) label.title = label.textContent.trim();
      else label.removeAttribute("title");
    }
  };

  const labelOf = (option) => (option.querySelector(".hoption-label") ?? option).textContent.trim().toLowerCase();
  const listboxes = [...document.querySelectorAll(".hlistbox")];

  for (const listbox of listboxes) {
    const popup = listbox.closest(".hpopup");
    const trigger = popup && [...document.querySelectorAll(`[popovertarget="${popup.id}"]`)].find((element) => !popup.contains(element));
    // Focus stays on a select trigger (a combobox) or a Combobox's field,
    // moves to the search field when there is one, and otherwise to the list
    // itself. A Combobox's field is the text field that controls the list;
    // combobox.js does the rest of what it needs.
    const search = popup?.querySelector(".hlistbox-search-input");
    const field = listbox.id ? document.querySelector(`.hcombobox > input[aria-controls="${listbox.id}"]`) : null;
    const freeText = field?.hasAttribute("data-free-text") ?? false;
    const owner = search ?? field ?? (trigger?.getAttribute("role") === "combobox" ? trigger : listbox);
    const enabled = () => [...listbox.querySelectorAll('.hoption:not([aria-disabled="true"], [hidden])')];

    // Highlight one option, or none. Disabled and hidden options are never
    // highlighted.
    let active = listbox.querySelector(".hoption[data-active]");
    const highlight = (option, { scroll = false } = {}) => {
      if (option !== active) {
        active?.removeAttribute("data-active");
        active = option;
        if (option) {
          option.setAttribute("data-active", "");
          owner.setAttribute("aria-activedescendant", option.id);
        } else {
          owner.removeAttribute("aria-activedescendant");
        }
      }
      if (option && scroll) option.scrollIntoView({ block: "nearest" });
    };

    // Type-ahead: letters typed in quick succession jump to the next option
    // whose label starts with them; repeating one letter cycles through the
    // options that start with it. A half-second pause starts over.
    let typed = "";
    let typedTimer;
    const findTyped = (key) => {
      clearTimeout(typedTimer);
      typedTimer = setTimeout(() => (typed = ""), 500);
      typed += key.toLowerCase();
      const cycling = [...typed].every((letter) => letter === typed[0]);
      const text = cycling ? typed[0] : typed;
      const options = enabled();
      // Search from the highlighted option, or the selected one while a
      // select is closed: a new letter starts after it, a longer search may
      // stay on it.
      const from = options.indexOf(active ?? listbox.querySelector('.hoption[aria-selected="true"]'));
      const start = from < 0 ? 0 : from + (cycling ? 1 : 0);
      const ordered = [...options.slice(start), ...options.slice(0, start)];
      return ordered.find((option) => labelOf(option).startsWith(text));
    };

    // Search: hide the options whose label doesn't contain the typed text,
    // and the groups left with none, so the selection stays in the page for
    // every script. When nothing matches, .hlistbox-empty follows the list.
    // The first match is highlighted, and labels shown again are measured.
    if (search) {
      const options = [...listbox.querySelectorAll(".hoption")];
      const groups = [...listbox.querySelectorAll(".hoption-group")];
      // The status after the list, in the page from the start so a screen
      // reader reads the message as it appears.
      const empty = listbox.nextElementSibling?.matches(".hlistbox-empty") ? listbox.nextElementSibling : null;
      search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        for (const option of options) option.hidden = !labelOf(option).includes(query);
        for (const group of groups) group.hidden = !group.querySelector(".hoption:not([hidden])");
        if (empty && options.length) {
          empty.textContent = options.every((option) => option.hidden) ? (search.dataset.exampleEmpty ?? "No results") : "";
        }
        highlight(enabled()[0] ?? null, { scroll: true });
        requestAnimationFrame(() => updateTitles(listbox));
      });
      // Each opening starts from the whole list. Capturing restores it before
      // anything else handles the opening, such as a script that measures the
      // popup.
      popup.addEventListener(
        "beforetoggle",
        (event) => {
          if (event.newState !== "open" || !search.value || !options.length) return;
          search.value = "";
          search.dispatchEvent(new Event("input"));
        },
        { capture: true },
      );
    }

    // A Combobox's script asks for the first match as text is typed; this
    // script alone highlights, so one option at most is ever highlighted.
    listbox.addEventListener("example-highlight", (event) => highlight(event.detail, { scroll: true }));

    // Pointer: highlight the enabled option underneath; leaving clears it,
    // once the pointer has moved in the list. A list that opens or shifts
    // under a pointer at rest isn't being pointed at, so the keyboard's
    // highlight stays.
    let pointing = false;
    listbox.addEventListener("pointermove", (event) => {
      pointing = true;
      const option = event.target.closest(".hoption");
      highlight(option?.getAttribute("aria-disabled") === "true" ? null : option);
    });
    listbox.addEventListener("pointerleave", () => {
      if (pointing) highlight(null);
      pointing = false;
    });
    // Clicking an option mustn't take focus from the trigger, the search
    // field, or the list, so the keyboard keeps working afterwards.
    listbox.addEventListener("mousedown", (event) => {
      if (event.target.closest(".hoption")) event.preventDefault();
    });

    // Choosing an enabled option toggles it in a multi-select, which stays
    // open. In a single select it becomes the selected option and takes the
    // list's one check mark, which stays hidden in an unselected option until
    // it's needed, and the popup closes, even when the option was already
    // selected. Closing returns focus to what opened it. Select and filter
    // chip scripts react to the same click.
    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.getAttribute("aria-disabled") === "true") return;

      if (listbox.getAttribute("aria-multiselectable") === "true") {
        option.setAttribute("aria-selected", String(option.getAttribute("aria-selected") !== "true"));
        return;
      }
      // Free text takes the option's text, and selects nothing.
      if (freeText) {
        popup?.hidePopover();
        return;
      }
      const previous = listbox.querySelector('.hoption[aria-selected="true"]');
      if (previous !== option) {
        const check = listbox.querySelector(".hoption-check") ?? template.content.firstElementChild.cloneNode(true);
        previous?.setAttribute("aria-selected", "false");
        option.setAttribute("aria-selected", "true");
        option.append(check);
      }
      popup?.hidePopover();
    });

    if (!popup) continue;

    // As it opens, highlight the option a key asked for, else the selected
    // option, else the first enabled one. This runs while the popup opens, so
    // a key pressed straight after moves on from it. As it closes, clear the
    // highlight.
    let opening = null;
    popup.addEventListener("beforetoggle", (event) => {
      // An opening another script cancelled, such as a Combobox's with
      // nothing to show.
      if (event.defaultPrevented) {
        opening = null;
        return;
      }
      if (event.newState === "open") {
        const selected = listbox.querySelector('.hoption[aria-selected="true"]:not([aria-disabled="true"], [hidden])');
        // Free text highlights nothing until a key asks, so Enter keeps what
        // was typed.
        highlight(opening ?? (freeText ? null : (selected ?? enabled()[0])));
      } else {
        highlight(null);
        clearTimeout(typedTimer);
        typed = "";
      }
      opening = null;
    });

    // Once it shows: move focus to its owner, scroll the highlighted option
    // into view, and measure the labels now that the list has its width.
    popup.addEventListener("toggle", (event) => {
      if (event.newState !== "open") return;
      if (owner !== trigger && owner !== field) owner.focus();
      active?.scrollIntoView({ block: "nearest" });
      requestAnimationFrame(() => updateTitles(listbox));
    });

    // Space activates a button on release, so a Space that chose an option
    // or was typed must not reopen or close a select.
    let swallowSpace = false;
    owner.addEventListener("keyup", (event) => {
      if (event.key === " " && swallowSpace) {
        event.preventDefault();
        swallowSpace = false;
      }
    });

    owner.addEventListener("keydown", (event) => {
      // Keys that confirm an input method's text belong to the search field.
      if (event.isComposing || event.keyCode === 229) return;
      const open = popup.matches(":popover-open");
      const typing = owner === search || owner === field;
      // Printable keys type ahead, except in the search field; Space counts
      // only in the middle of a search, and otherwise chooses.
      const typeahead =
        !typing &&
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key !== " " || typed !== "");
      const options = typeahead ? [] : enabled();
      const index = options.indexOf(active);
      let next;

      if (typeahead) {
        next = findTyped(event.key);
        if (owner === trigger) swallowSpace = event.key === " ";
        event.preventDefault();
        if (!next) return;
      } else {
        switch (event.key) {
          case "ArrowDown":
            next = index < 0 ? options[0] : options[Math.min(index + 1, options.length - 1)];
            break;
          case "ArrowUp":
            next = index < 0 ? options.at(-1) : options[Math.max(index - 1, 0)];
            break;
          case "Home":
            if (typing) return;
            next = options[0];
            break;
          case "End":
            if (typing) return;
            next = options.at(-1);
            break;
          case "Enter":
          case " ":
            if (event.key === " " && typing) return;
            if (!open) return;
            // With nothing to choose, Enter in the search field must not
            // submit the form around it; a Combobox's field decides itself.
            if (!active) {
              if (owner === search) event.preventDefault();
              return;
            }
            event.preventDefault();
            if (owner === trigger) swallowSpace = event.key === " ";
            active.click();
            return;
          case "Tab":
            // A select trigger closes its list when focus moves on.
            if (open && (owner === trigger || owner === field)) popup.hidePopover();
            return;
          default:
            return;
        }
        event.preventDefault();
      }

      // These keys open a closed select, as in the WAI-ARIA select-only
      // combobox: Down keeps the selected option highlighted, Up and Home
      // highlight the first option, End the last, and typing the match.
      if (!open) {
        // A Combobox's field opens on Down, at the selected option or the
        // first, and on Up, at the last, as in the WAI-ARIA editable
        // combobox.
        if (owner === field && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          const selected = listbox.querySelector('.hoption[aria-selected="true"]:not([aria-disabled="true"], [hidden])');
          opening = event.key === "ArrowUp" ? options.at(-1) : (selected ?? options[0]);
          popup.showPopover();
          return;
        }
        if (owner === trigger) {
          opening = typeahead ? next : ({ ArrowUp: options[0], Home: options[0], End: options.at(-1) }[event.key] ?? null);
          popup.showPopover();
        }
        return;
      }
      highlight(next, { scroll: true });
    });
  }

  // Lists outside a popup, and open ones, are measured now and again after
  // the window resizes, at most once a frame.
  const updateShown = () => {
    for (const listbox of listboxes) {
      if (!listbox.closest(".hpopup:not(:popover-open)")) updateTitles(listbox);
    }
  };
  if (listboxes.length) {
    updateShown();
    let frame = 0;
    addEventListener("resize", () => {
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        updateShown();
      });
    });
  }

  // A footer's Clear filters clears the selection.
  for (const button of document.querySelectorAll("[data-example-clear]")) {
    button.addEventListener("click", () => {
      for (const option of button.closest(".hpopup").querySelectorAll('.hoption[aria-selected="true"]')) {
        option.setAttribute("aria-selected", "false");
      }
    });
  }
}
