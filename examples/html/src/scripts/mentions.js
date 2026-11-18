// Example only: what the React Mentions does; listbox.js highlights and
// moves through each list, as for a Combobox, and highlight.js draws the
// mentions marked in the text. Each popup is a trigger's list: its
// data-example-trigger, "@" without one, and with data-example-at-start, only
// at the start of the field. Typing a trigger and a few letters, with nothing
// but letters between them and the caret, lists that trigger's options whose
// label or description has them, and opens its list; the trigger nearest the
// caret wins, and at the same place, the longest. Choosing one, by a click,
// Enter, or Tab, puts the trigger, its
// data-example-value, and a space in place of what was typed, the caret after
// it. Escape closes the list until the text changes; leaving the field
// closes it too, as does moving the caret off what was typed. Focus stays in
// the field throughout, and its aria-controls names the list in use. In an
// Input, ↓ or ↑ opens the list again with the trigger typed, as there are no
// lines for them to move between. Keys an input method uses while composing
// text are left to it. The highlight's pattern, on its backdrop, is made from
// the lists' values, as React's is, and again as a list's options change,
// such as ones that arrive later.
{
  const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // As mentionsIn.ts: a mention starts the text or follows a space, and ends
  // at the end, a space, or punctuation or a symbol, but for "_" and "-"; the
  // longest trigger first.
  const patternOf = (lists) =>
    lists
      .map((list) => ({ ...list, values: list.options().map((option) => option.dataset.exampleValue) }))
      .filter((list) => list.values.length > 0)
      .sort((a, b) => b.trigger.length - a.trigger.length)
      .map(({ trigger, values, atStart }) => {
        const names = [...values].sort((a, b) => b.length - a.length).map(escaped).join("|");
        return `${atStart ? "^" : "(?<!\\S)"}(${escaped(trigger)}(?:${names}))(?=$|[\\s\\p{P}\\p{S}])(?![_-])`;
      })
      .join("|") || "(?!)";
  const searchTextOf = (option) =>
    [...option.querySelectorAll(".hoption-label, .hoption-description")].map((part) => part.textContent.trim()).join(" ").toLowerCase();

  for (const wrapper of document.querySelectorAll(".hmentions")) {
    const field = wrapper.querySelector(".htextarea, .hinput");
    const singleLine = field.matches(".hinput");
    const lists = [...wrapper.querySelectorAll(":scope > .hpopup")].map((popup) => {
      const trigger = popup.dataset.exampleTrigger ?? "@";
      const atStart = popup.hasAttribute("data-example-at-start");
      return {
        popup,
        trigger,
        atStart,
        listbox: popup.querySelector(".hlistbox"),
        options: () => [...popup.querySelectorAll(".hoption")],
        pattern: new RegExp(atStart ? `^${escaped(trigger)}(\\S*)$` : `(?:^|\\s)${escaped(trigger)}(\\S*)$`),
      };
    });
    let token = null;
    let dismissed = false;

    const openList = () => lists.find((list) => list.popup.matches(":popover-open"));
    // The trigger nearest the caret, and what's typed after it, if any.
    const tokenHere = () => {
      const position = field.selectionStart;
      const before = field.value.slice(0, position);
      let found = null;
      for (const list of lists) {
        const match = list.pattern.exec(before);
        if (!match) continue;
        const start = position - match[1].length - list.trigger.length;
        const nearer = !found || start > found.start || (start === found.start && list.trigger.length > found.list.trigger.length);
        if (nearer) found = { list, start, end: position, query: match[1].toLowerCase() };
      }
      return found;
    };
    const follow = () => {
      token = tokenHere();
      for (const list of lists) {
        const mine = token?.list === list;
        const options = list.options();
        for (const option of options) option.hidden = mine && !searchTextOf(option).includes(token.query);
        const shows = mine && !dismissed && options.some((option) => !option.hidden);
        const open = list.popup.matches(":popover-open");
        if (shows && !open) {
          field.setAttribute("aria-controls", list.listbox.id);
          list.popup.showPopover();
        }
        if (!shows && open) list.popup.hidePopover();
        // A new query starts from its first match.
        if (shows) list.listbox.dispatchEvent(new CustomEvent("example-highlight", { detail: options.find((option) => !option.hidden) }));
      }
    };

    // Where the caret is now, as it may have moved since the list opened.
    const choose = (list, option) => {
      const here = tokenHere();
      token = null;
      if (list.popup.matches(":popover-open")) list.popup.hidePopover();
      if (!here || here.list !== list) return;
      const inserted = `${list.trigger}${option.dataset.exampleValue} `;
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
      if (here?.list !== token?.list || here?.start !== token?.start || here?.end !== token?.end) follow();
    };
    field.addEventListener("keyup", moved);
    field.addEventListener("click", moved);
    field.addEventListener("blur", () => {
      dismissed = true;
      openList()?.popup.hidePopover();
    });
    // Before listbox.js, so Escape and Tab are the list's while it's open.
    field.addEventListener(
      "keydown",
      (event) => {
        if (event.isComposing || event.keyCode === 229) return;
        const open = openList();
        if (!open) {
          if (!singleLine || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
          dismissed = false;
          follow();
          if (openList()) event.preventDefault();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          dismissed = true;
          open.popup.hidePopover();
        } else if (event.key === "Tab" && !event.shiftKey) {
          const active = document.getElementById(field.getAttribute("aria-activedescendant") ?? "");
          if (!active || !open.listbox.contains(active)) return;
          event.preventDefault();
          choose(open, active);
        }
      },
      { capture: true },
    );
    // The highlight's pattern, from the lists' values, kept as they change;
    // highlight.js draws it.
    const backdrop = wrapper.querySelector(".htextarea-highlight-backdrop, .hinput-highlight-backdrop");
    const repattern = () => {
      if (!backdrop) return;
      backdrop.dataset.examplePattern = patternOf(lists);
      backdrop.dataset.exampleFlags = "iu";
      field.dispatchEvent(new CustomEvent("example-redraw"));
    };
    repattern();
    const changed = new MutationObserver(() => {
      repattern();
      if (document.activeElement === field) follow();
    });
    for (const list of lists) changed.observe(list.listbox, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-example-value"] });

    for (const list of lists) {
      list.listbox.addEventListener("click", (event) => {
        const option = event.target.closest(".hoption");
        if (option) choose(list, option);
      });
      list.popup.addEventListener("mousedown", (event) => event.preventDefault());
    }
  }
}
