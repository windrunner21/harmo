// Example only: what the React CommandMenu does; listbox.js moves through the
// list. Typing filters the options by label, description, and keywords
// (data-example-keywords), marks what's typed in each, and highlights the
// first match; with none, .hlistbox-empty says so. A pick empties the field,
// closes the list or the dialog, and goes where it leads: here, it says so
// (data-example-picked), with the option's data-example-value, the path an
// app's value would be.
//
// Under a Search field (.hpopup.hcommand-menu), a click, typing, or the
// arrow keys open the list; Escape closes it, then empties the field, and
// leaving the field closes the list and empties it. In a dialog
// (.hdialog.hcommand-menu), which its trigger opens with command="show-modal",
// the field and the list always show; closing empties the field.
//
// A shortcut (data-example-shortcut on the field, or the trigger: "Mod+K" for
// ⌘K on Apple devices and Ctrl+K elsewhere, "Control+K", or a key alone, such
// as "/") opens the dialog, or reaches the field; the .hkbd shows
// data-example-apple on Apple devices. A key alone needs a way to turn it
// off: data-example-shortcut-switch names a switch that does.
//
// A group with data-example-found pretends to be what the app finds: from
// two letters, after a moment, it shows the options whose text holds what's
// typed, unfiltered, as an app sends them, and its data-example-view-all
// option with them; meanwhile, with nothing else to show, the status says
// data-example-searching.
{
  const apple = /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);

  // A modifier it doesn't know is a mistake, not a key to leave out.
  const modifiers = ["Mod", "Control", "Meta", "Shift", "Alt"];
  const parseKeys = (keys) => {
    const parts = keys.split("+");
    const key = parts.pop() || "+";
    const unknown = parts.find((part) => !modifiers.includes(part));
    if (unknown !== undefined) throw new Error(`The shortcut "${keys}" has "${unknown}"; use ${modifiers.join(", ")}`);
    const has = (name) => parts.includes(name);
    return { key: key.toLowerCase(), mod: has("Mod"), control: has("Control"), meta: has("Meta"), shift: has("Shift"), alt: has("Alt") };
  };
  const typingIn = (target) => target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable]") !== null);
  // A key alone is text in a field, so there it's typed; with ⌘ or Ctrl, it
  // works anywhere. Mod is either, on any device. Shift counts only when the
  // shortcut names it, or has another modifier, as some layouts need it to
  // type "/".
  const pressed = (event, keys) => {
    if (event.key.toLowerCase() !== keys.key || event.altKey !== keys.alt) return false;
    if (keys.mod) {
      if (!event.metaKey && !event.ctrlKey) return false;
    } else if (event.ctrlKey !== keys.control || event.metaKey !== keys.meta) return false;
    const alone = !keys.mod && !keys.control && !keys.meta;
    if ((!alone || keys.shift) && event.shiftKey !== keys.shift) return false;
    return !alone || !typingIn(event.target);
  };
  const ariaKeys = (keys) =>
    [
      (keys.control || (keys.mod && !apple)) && "Control",
      (keys.meta || (keys.mod && apple)) && "Meta",
      keys.alt && "Alt",
      keys.shift && "Shift",
      keys.key.length === 1 ? keys.key.toUpperCase() : keys.key,
    ]
      .filter(Boolean)
      .join("+");

  for (const menu of document.querySelectorAll(".hcommand-menu")) {
    const listbox = menu.querySelector(".hlistbox");
    const input = listbox && document.querySelector(`input[role="combobox"][aria-controls="${listbox.id}"]`);
    if (!input) continue;
    const dialog = menu.matches("dialog") ? menu : null;
    const popup = dialog ? null : menu;
    const trigger = dialog && document.querySelector(`[commandfor="${dialog.id}"]`);
    const options = [...listbox.querySelectorAll(".hoption")];
    const groups = [...listbox.querySelectorAll(".hoption-group")];
    const found = new Set(groups.filter((group) => group.hasAttribute("data-example-found")));
    const foundIn = (option) => found.has(option.closest(".hoption-group"));
    const empty = menu.querySelector(":scope > .hlistbox-empty");
    const picked = menu.nextElementSibling?.matches("[data-example-picked]") ? menu.nextElementSibling : null;

    // Each option's label and description as the page has them, to mark
    // what's typed in. Only plain text is marked, as in React; a part with
    // markup of its own, such as <code>, is left as it is.
    const parts = (option) => [...option.querySelectorAll(".hoption-label, .hoption-description")];
    const original = new Map(options.flatMap((option) => parts(option).map((part) => [part, [...part.childNodes].map((node) => node.cloneNode(true))])));
    const fullText = (part) => original.get(part).map((node) => node.textContent).join("");
    const plain = (part) => original.get(part).every((node) => node.nodeType === Node.TEXT_NODE);
    const textOf = (option) => [...parts(option).map(fullText), option.dataset.exampleKeywords ?? ""].join(" ").toLowerCase();
    const mark = (part, typed) => {
      if (!plain(part)) return;
      const full = fullText(part);
      const wanted = typed.trim().toLowerCase();
      const lower = full.toLowerCase();
      const at = wanted ? lower.indexOf(wanted) : -1;
      if (at < 0 || lower.length !== full.length) {
        if (part.children.length) part.replaceChildren(...original.get(part).map((node) => node.cloneNode(true)));
        return;
      }
      const match = document.createElement("mark");
      match.className = "hoption-match";
      match.textContent = full.slice(at, at + wanted.length);
      part.replaceChildren(full.slice(0, at), match, full.slice(at + wanted.length));
    };

    // What the pretend app has found, and for what text.
    let foundFor = "";
    let searching;
    const looking = () => found.size > 0 && input.value.trim().length >= 2 && foundFor !== input.value.trim();

    // The options the text matches, the groups left with any, and the status
    // when there are none. Whether there's anything to show.
    const filter = () => {
      const wanted = input.value.trim().toLowerCase();
      for (const option of options) {
        if (!foundIn(option)) option.hidden = !textOf(option).includes(wanted);
      }
      for (const group of found) {
        const results = [...group.querySelectorAll(".hoption:not([data-example-view-all])")];
        const ready = wanted.length >= 2 && foundFor === input.value.trim();
        for (const option of results) option.hidden = !ready || !textOf(option).includes(wanted);
        const any = results.some((option) => !option.hidden);
        for (const option of group.querySelectorAll(".hoption[data-example-view-all]")) option.hidden = !any;
      }
      for (const group of groups) group.hidden = !group.querySelector(".hoption:not([hidden])");
      for (const option of options) for (const part of parts(option)) mark(part, input.value);
      const none = options.every((option) => option.hidden);
      if (empty) empty.textContent = none ? ((looking() ? input.dataset.exampleSearching : input.dataset.exampleEmpty) ?? "") : "";
      return !none || empty !== null;
    };

    // listbox.js highlights; this asks it to.
    const highlight = (option) => listbox.dispatchEvent(new CustomEvent("example-highlight", { detail: option }));
    const first = () => listbox.querySelector('.hoption:not([aria-disabled="true"], [hidden], .hoption-group[hidden] .hoption)');

    const isOpen = () => (popup ? popup.matches(":popover-open") : dialog.open);
    const shows = () => !input.readOnly && filter();
    const show = () => popup && !isOpen() && shows() && popup.showPopover();
    const hide = () => popup && isOpen() && popup.hidePopover();
    const clear = () => {
      input.value = "";
      foundFor = "";
      clearTimeout(searching);
      filter();
    };

    input.addEventListener("input", () => {
      // The pretend search: an answer after a moment, for the text as it is
      // then, as a request for each change would bring.
      clearTimeout(searching);
      if (input.value.trim().length >= 2 && found.size) {
        searching = setTimeout(() => {
          foundFor = input.value.trim();
          const before = listbox.querySelector(".hoption[data-active]");
          filter();
          if (!before) highlight(first());
        }, 400);
      }
      const something = filter();
      if (popup && !something) hide();
      else if (popup && !isOpen()) show();
      else highlight(first());
    });

    if (popup) {
      // An opening with nothing to show, or of a read-only field, doesn't
      // happen.
      popup.addEventListener(
        "beforetoggle",
        (event) => {
          if (event.newState === "open" && !shows()) event.preventDefault();
        },
        { capture: true },
      );
      popup.addEventListener("beforetoggle", (event) => input.setAttribute("aria-expanded", String(event.newState === "open")));
      // Clicking in the list keeps focus in the field.
      popup.addEventListener("mousedown", (event) => event.preventDefault());
      input.addEventListener("click", show);
      input.addEventListener("keydown", (event) => {
        if (event.isComposing || event.keyCode === 229 || event.key !== "Escape") return;
        if (isOpen()) {
          event.preventDefault();
          hide();
        } else if (input.value && !input.readOnly) {
          event.preventDefault();
          clear();
        }
      });
      // Leaving the field empties it; leaving the window doesn't, and a
      // read-only field keeps its text.
      input.addEventListener("blur", () => {
        hide();
        if (document.hasFocus() && !input.readOnly) clear();
      });
    } else {
      dialog.addEventListener("close", clear);
    }

    // Enter with nothing highlighted doesn't send a form around it; an
    // input method's Enter is its own.
    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Enter") event.preventDefault();
    });

    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.getAttribute("aria-disabled") === "true") return;
      if (picked) {
        picked.textContent = picked.dataset.examplePicked.replace("{value}", option.dataset.exampleValue ?? "");
        picked.hidden = false;
      }
      // The dialog empties as it closes, so the list doesn't change as it
      // fades.
      if (dialog) dialog.requestClose ? dialog.requestClose() : dialog.close();
      else {
        clear();
        hide();
      }
    });

    // The shortcut, with what it's named for this device, while it's on. A
    // hidden or disabled menu leaves the key to the page, and the browser.
    const owner = trigger ?? input;
    const shortcut = owner.dataset.exampleShortcut;
    if (shortcut) {
      const keys = parseKeys(shortcut);
      const kbd = owner === input ? input.parentElement.querySelector(":scope > .hkbd") : trigger.querySelector(".hkbd");
      if (apple && kbd?.dataset.exampleApple) kbd.textContent = kbd.dataset.exampleApple;
      const toggle = document.getElementById(owner.dataset.exampleShortcutSwitch ?? "");
      const on = () => toggle?.checked ?? true;
      const name = () => {
        if (on()) owner.setAttribute("aria-keyshortcuts", ariaKeys(keys));
        else owner.removeAttribute("aria-keyshortcuts");
        if (kbd) kbd.hidden = !on();
      };
      toggle?.addEventListener("change", name);
      name();
      document.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || event.repeat || event.isComposing || !on() || !pressed(event, keys)) return;
        if (input.disabled || (trigger ?? input.parentElement).closest("[hidden]")) return;
        event.preventDefault();
        if (dialog && !dialog.open) {
          dialog.showModal();
          return;
        }
        input.focus();
        input.select();
        show();
      });
    }
  }
}
