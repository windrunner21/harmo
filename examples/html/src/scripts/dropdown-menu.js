// Example only: what a Dropdown Menu's script does, as the React Dropdown
// Menu does; popup.js opens and closes it as a Popup, keeps its trigger's
// aria-expanded, and hands focus back to the trigger as it closes.
//
// Opened from the keys, Enter, Space, or ↓, focus goes to the first item, or
// with ↑ to the last; opened with the pointer, to the menu itself. In it, ↓
// and ↑ move focus, stopping at the ends, Home and End go to them, and typing
// goes to the next item that starts with what's typed. Tab closes it and moves
// on from the trigger. The mouse moves focus with it. Choosing an item closes
// the menu, unless it's a link chosen with a modifier key, which opens
// elsewhere. A paragraph after the outermost menu with data-example-chosen
// says which item was chosen, in a submenu too, its {label} in the text.
//
// A submenu is a menu inside another, after its item, whose
// popovertargetaction="show" opens it. → (← right to left), Enter, or Space
// opens it on its first item; ← closes it, back to its item. Pointed at, its
// item opens it 100ms later, focus staying on the item; resting on another
// item for 200ms closes it, so the pointer can cross others on its way.
// Choosing in it closes every menu; Tab in it does too.
//
// While a menu has more to show above or below, an arrow at that end says
// so, as a Listbox's does: a div with class hdropdown-menu-scroll, first or
// last, read by no screen reader and never focused, as the keys bring the
// item they reach into view themselves. Resting the pointer on one scrolls
// the menu that way, half a pixel a millisecond, until it reaches the end
// and the arrow goes.
{
  const menuOf = (element) => element.closest(".hdropdown-menu");
  // The items the keys reach: this menu's own, not a submenu's, and none
  // disabled or hidden, an item in a hidden group too.
  const itemsOf = (menu) =>
    [...menu.querySelectorAll(".hdropdown-menu-item")].filter(
      (item) => menuOf(item) === menu && !item.matches(":disabled") && !item.closest("[hidden]"),
    );
  const rootOf = (menu) => {
    let root = menu;
    for (let outer = menuOf(menu.parentElement); outer; outer = menuOf(outer.parentElement)) root = outer;
    return root;
  };
  const triggerOf = (menu) =>
    [...document.querySelectorAll(`[popovertarget="${menu.id}"]`)].find((element) => !menu.contains(element));
  const subOf = (item) =>
    item.getAttribute("aria-haspopup") === "menu" ? document.getElementById(item.getAttribute("popovertarget")) : null;
  const openSubOf = (menu) =>
    [...menu.querySelectorAll(".hdropdown-menu:popover-open")].find((inner) => menuOf(inner.parentElement) === menu);
  // Focus, and the menu scrolled to show the item clear of its scroll
  // arrows, by the item's offset and the menu's scroll-padding: neither
  // focus() nor scrollIntoView() goes far enough in a submenu, a popup in the
  // top layer inside another.
  const focusItem = (item) => {
    item.focus({ preventScroll: true });
    const menu = menuOf(item);
    const room = parseFloat(getComputedStyle(menu).scrollPaddingBlockStart) || 0;
    const top = item.offsetTop - room;
    const bottom = item.offsetTop + item.offsetHeight + room;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  };
  const forward = (element, key) => key === (getComputedStyle(element).direction === "rtl" ? "ArrowLeft" : "ArrowRight");

  for (const menu of document.querySelectorAll(".hdropdown-menu[popover]")) {
    const trigger = triggerOf(menu);
    if (!trigger) continue;
    const sub = menuOf(menu.parentElement) !== null;
    const rest = sub ? "none" : "menu";

    const focusTo = (to) => {
      if (to === "none") return;
      const all = itemsOf(menu);
      const target = to === "first" ? all[0] : to === "last" ? all.at(-1) : undefined;
      if (target) focusItem(target);
      else menu.focus();
    };

    let focusOnOpen = rest;
    let fromKeys = false;
    let subTimer;
    const cancelSub = () => {
      clearTimeout(subTimer);
      subTimer = undefined;
    };
    trigger.addEventListener("click", (event) => {
      if (!fromKeys) focusOnOpen = event.detail === 0 ? "first" : rest;
      fromKeys = false;
      // Enter or Space on a submenu's item that the pointer already opened:
      // nothing opens, so no toggle, and focus goes in now.
      if (sub && event.detail === 0 && menu.matches(":popover-open")) focusTo("first");
    });
    trigger.addEventListener("keydown", (event) => {
      const opens = sub ? forward(trigger, event.key) : event.key === "ArrowDown" || event.key === "ArrowUp";
      if (event.defaultPrevented || !opens) return;
      event.preventDefault();
      const to = event.key === "ArrowUp" ? "last" : "first";
      if (menu.matches(":popover-open")) return focusTo(to);
      focusOnOpen = to;
      fromKeys = true;
      trigger.click();
    });
    menu.addEventListener("toggle", (event) => {
      if (event.target !== menu) return;
      if (event.newState === "open") focusTo(focusOnOpen);
      else cancelSub();
      focusOnOpen = rest;
    });

    // Type-ahead: letters typed in quick succession go to the next item that
    // starts with them; repeating one letter cycles through those that start
    // with it. A half-second pause starts over.
    let typed = "";
    let typedTimer;
    const findTyped = (key, all, from) => {
      clearTimeout(typedTimer);
      typedTimer = setTimeout(() => (typed = ""), 500);
      typed += key.toLowerCase();
      const cycling = [...typed].every((letter) => letter === typed[0]);
      const text = cycling ? typed[0] : typed;
      const start = from < 0 ? 0 : from + (cycling ? 1 : 0);
      return [...all.slice(start), ...all.slice(0, start)].find((item) =>
        item.textContent.trim().toLowerCase().startsWith(text),
      );
    };

    menu.addEventListener("keydown", (event) => {
      // A key ends what the pointer started, so a submenu just opened with
      // → isn't closed by a hover's timer.
      cancelSub();
      // Tab, from this menu or one inside it, closes them all, from the
      // outermost.
      if (event.key === "Tab") {
        if (rootOf(menu) !== menu) return;
        trigger.focus();
        menu.hidePopover();
        return;
      }
      if (event.defaultPrevented || event.isComposing || menuOf(event.target) !== menu) return;
      const all = itemsOf(menu);
      const at = all.indexOf(document.activeElement);
      let next;
      switch (event.key) {
        case "ArrowDown":
          next = all[at < 0 ? 0 : Math.min(at + 1, all.length - 1)];
          break;
        case "ArrowUp":
          next = at < 0 ? all.at(-1) : all[Math.max(at - 1, 0)];
          break;
        case "Home":
          next = all[0];
          break;
        case "End":
          next = all.at(-1);
          break;
        case "ArrowLeft":
        case "ArrowRight":
          if (!sub || forward(menu, event.key)) return;
          event.preventDefault();
          trigger.focus();
          menu.hidePopover();
          return;
        case " ":
          // Space chooses a link, as it does a button; while typing, it's a
          // letter.
          if (typed === "" && all[at]?.matches("a")) {
            event.preventDefault();
            all[at].click();
            return;
          }
          if (typed === "") return;
          next = findTyped(event.key, all, at);
          break;
        default:
          if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return;
          next = findTyped(event.key, all, at);
      }
      event.preventDefault();
      if (next) focusItem(next);
    });

    // The mouse moves focus with it, so one item is shown; a submenu opens
    // and closes after a moment, as the pointer settles on its item or
    // another, judged when the moment's up.
    menu.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const item = event.target.closest(".hdropdown-menu-item");
      if (menuOf(event.target) !== menu) return cancelSub();
      const focused = item ?? menu;
      if (document.activeElement !== focused) focused.focus({ preventScroll: true });
      const open = openSubOf(menu);
      const wanted = item ? subOf(item) : null;
      if (open && open === wanted) return cancelSub();
      if ((open || wanted) && subTimer === undefined) {
        subTimer = setTimeout(
          () => {
            subTimer = undefined;
            const now = document.activeElement;
            const settled = now && menu.contains(now) && menuOf(now) === menu ? subOf(now) : null;
            const shown = openSubOf(menu);
            if (shown && shown !== settled && !shown.contains(now)) shown.hidePopover();
            if (settled && !settled.matches(":popover-open")) settled.showPopover();
          },
          open ? 200 : 100,
        );
      }
    });
    menu.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && menu.contains(document.activeElement)) {
        menu.focus({ preventScroll: true });
      }
    });

    const arrow = (direction) => {
      const element = document.createElement("div");
      element.className = "hdropdown-menu-scroll";
      element.dataset.direction = direction;
      element.setAttribute("role", "presentation");
      element.setAttribute("aria-hidden", "true");
      element.hidden = true;
      return element;
    };
    const up = arrow("up");
    const down = arrow("down");
    // Changed only when it changes, as setting it at all is a mutation the
    // observer below would see.
    const show = (element, shown) => {
      if (element.hidden === shown) element.hidden = !shown;
    };
    const update = () => {
      show(up, menu.scrollTop > 0);
      show(down, menu.scrollTop + menu.clientHeight < menu.scrollHeight - 1);
    };
    const place = () => {
      if (menu.firstElementChild !== up) menu.prepend(up);
      if (menu.lastElementChild !== down) menu.append(down);
      update();
    };
    place();
    new MutationObserver(place).observe(menu, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    new ResizeObserver(update).observe(menu);
    menu.addEventListener("scroll", update, { passive: true });
    // As it opens, and once its slide in has ended.
    menu.addEventListener("toggle", update);
    menu.addEventListener("transitionend", update);
    let frame = 0;
    const stop = () => cancelAnimationFrame(frame);
    for (const [element, way] of [
      [up, -1],
      [down, 1],
    ]) {
      element.addEventListener("pointerenter", () => {
        stop();
        let last = performance.now();
        const step = (now) => {
          menu.scrollTop += way * 0.5 * (now - last);
          last = now;
          const more = way < 0 ? menu.scrollTop > 0 : menu.scrollTop + menu.clientHeight < menu.scrollHeight - 1;
          if (more) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      });
      element.addEventListener("pointerleave", stop);
    }

    menu.addEventListener("click", (event) => {
      const item = event.target.closest(".hdropdown-menu-item");
      if (!item || menuOf(item) !== menu || subOf(item)) return;
      if (item.matches("a") && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      const note = rootOf(menu).nextElementSibling;
      const chosen = note?.matches("[data-example-chosen]") ? note : null;
      if (chosen && item.matches("button")) {
        chosen.textContent = chosen.dataset.exampleChosen.replace("{label}", item.textContent.trim());
        chosen.hidden = false;
      }
      rootOf(menu).hidePopover();
    });
  }
}
