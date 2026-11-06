// Example only: what the React Toaster does, for the page's
// <section class="htoaster">.
//
// It shows the region as a manual popover, adds and removes toasts, measures
// each one so its box can change size, and places them in the stack. Each
// toast counts 4 seconds of its own, held while the stack is spread out (on
// hover with a mouse, a tap, or focus inside) or the page is hidden; those
// whose time is up leave one at a time, the oldest first. Each toast's text
// goes to one of the region's announcers, for screen readers. F8 moves focus
// to the toasts, and Escape puts it back. While a Dialog or Drawer is open,
// the region moves inside it, where it isn't inert, and back as it closes.
//
// A button with data-example-toast-title sends a toast; its other
// data-example-toast-* attributes give the rest.
{
  const toaster = document.querySelector(".htoaster");
  if (toaster) {
    const list = toaster.querySelector(".htoaster-list");
    const polite = toaster.querySelector('.htoaster-announce[role="status"]');
    const assertive = toaster.querySelector('.htoaster-announce[role="alert"]');
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const GAP = 12;
    const DURATION = 4000;
    const EXIT_SPACING = 700;
    const toasts = new Map();
    let count = 0;

    // An app brings its own icons; these are the playground's.
    const icons = {
      success:
        '<svg class="htoast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" /><path d="M6.5 10.25L8.75 12.5L13.5 7.75" /></svg>',
      error:
        '<svg class="htoast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" /><path d="M7 7L13 13" /><path d="M13 7L7 13" /></svg>',
      warning:
        '<svg class="htoast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z" /><path d="M12 9V13.5" /><path d="M12 16.9922V17.0022" /></svg>',
      info:
        '<svg class="htoast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25ZM12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25Z" fill="currentColor" /><path d="M12 10.25C12.41 10.25 12.75 10.59 12.75 11V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V11C11.25 10.59 11.59 10.25 12 10.25Z" fill="currentColor" /><circle cx="12" cy="8" r="1" fill="currentColor" /></svg>',
    };

    const body = (options) => {
      const element = document.createElement("div");
      element.className = "htoast-body";
      element.innerHTML = icons[options.status ?? "info"];
      const content = document.createElement("div");
      content.className = "htoast-content";
      const title = document.createElement("span");
      title.className = "htoast-title";
      title.textContent = options.title;
      content.append(title);
      if (options.description) {
        const description = document.createElement("span");
        description.className = "htoast-description";
        description.textContent = options.description;
        content.append(description);
      }
      element.append(content);
      if (options.action) {
        const button = document.createElement("button");
        button.className = "hbutton";
        button.type = "button";
        button.dataset.variant = "secondary";
        button.dataset.size = "small";
        const label = document.createElement("span");
        label.className = "hbutton-label";
        label.textContent = options.action.label;
        button.append(label);
        button.addEventListener("click", options.action.onClick);
        element.append(button);
      }
      return element;
    };

    // The content's own size: its exact width, which can be a fraction of a
    // pixel, rounded up, since rounded down the last word no longer fits.
    const measure = (entry) => {
      const content = entry.item.querySelector(":scope > .htoast-body:not([data-leaving])");
      content.style.inlineSize = "max-content";
      const width = Math.ceil(parseFloat(getComputedStyle(content).width));
      content.style.inlineSize = `${width}px`;
      const height = parseFloat(getComputedStyle(content).height);
      content.style.inlineSize = "";
      entry.item.style.setProperty("--htoast-body-width", `${width}px`);
      entry.item.style.setProperty("--htoast-width", `${width + 2}px`);
      entry.item.style.setProperty("--htoast-height", `${height + 2}px`);
      entry.width = width + 2;
      entry.height = height + 2;
    };

    // Newest in front; spread out, each above the ones in front of it.
    const layout = () => {
      const live = [...list.children].filter((item) => !item.hasAttribute("data-removed")).reverse();
      let offset = 0;
      live.forEach((item, index) => {
        item.style.setProperty("--htoast-index", index);
        item.style.setProperty("--htoast-offset", `${offset}px`);
        item.toggleAttribute("data-front", index === 0);
        item.toggleAttribute("data-beyond", index > 2);
        offset += toasts.get(item).height + GAP;
      });
      const front = live[0] && toasts.get(live[0]);
      if (front) {
        toaster.style.setProperty("--htoaster-front-width", `${front.width}px`);
        toaster.style.setProperty("--htoaster-front-height", `${front.height}px`);
        toaster.style.setProperty("--htoaster-spread", `${offset - front.height - GAP}px`);
      }
      if (!live.length) setExpanded(false);
      size();
    };

    // The region's width: the widest toast shown at its own size, the front
    // one, one leaving from the front, or, spread out, any of them.
    const size = () => {
      const front = parseFloat(toaster.style.getPropertyValue("--htoaster-front-width")) || 0;
      const expanded = toaster.hasAttribute("data-expanded");
      const widths = [...list.children]
        .filter((item) => expanded || item.hasAttribute("data-front"))
        .map((item) => parseFloat(item.style.getPropertyValue("--htoast-width")) || 0);
      const width = Math.max(front, ...widths);
      if (width) toaster.style.setProperty("--htoaster-width", `${width}px`);
    };

    const due = new Set();
    let lastExit = 0;
    let exitTimer;
    const paused = () => toaster.hasAttribute("data-expanded") || document.hidden;
    const run = (entry) => {
      clearTimeout(entry.timer);
      entry.timer = undefined;
      if (entry.remaining === Infinity || paused() || due.has(entry)) return;
      entry.started = Date.now();
      entry.timer = setTimeout(() => {
        entry.timer = undefined;
        due.add(entry);
        leaveInTurn();
      }, entry.remaining);
    };
    const hold = (entry) => {
      if (entry.timer === undefined) return;
      clearTimeout(entry.timer);
      entry.timer = undefined;
      entry.remaining -= Date.now() - entry.started;
    };
    const leaveInTurn = () => {
      clearTimeout(exitTimer);
      if (!due.size || paused()) return;
      const wait = lastExit + EXIT_SPACING - Date.now();
      if (wait > 0) {
        exitTimer = setTimeout(leaveInTurn, wait);
        return;
      }
      const oldest = [...list.children].map((item) => toasts.get(item)).find((entry) => entry && due.has(entry));
      if (!oldest) return due.clear();
      lastExit = Date.now();
      dismiss(oldest.id);
      if (due.size) exitTimer = setTimeout(leaveInTurn, EXIT_SPACING);
    };
    const syncTimers = () => {
      for (const entry of toasts.values()) {
        if (paused()) hold(entry);
        else if (entry.timer === undefined) run(entry);
      }
      leaveInTurn();
    };

    const find = (id) => [...toasts.values()].find((entry) => entry.id === id);

    // Read by screen readers: a moment later, so a region that has just moved
    // is ready, and taken out again once it has been read.
    const announce = (options) => {
      const announcer = options.status === "error" || options.status === "warning" ? assertive : polite;
      const lines = [options.title, options.description].filter(Boolean);
      setTimeout(() => {
        const note = document.createElement("div");
        for (const line of lines) {
          const paragraph = document.createElement("p");
          paragraph.textContent = line;
          note.append(paragraph);
        }
        announcer.append(note);
        setTimeout(() => note.remove(), 1500);
      }, 100);
    };

    // Focus goes back where it was before F8, or, with nowhere to go back
    // to, leaves the toasts.
    let returnTo = null;
    const giveFocusBack = () => {
      const back = returnTo;
      returnTo = null;
      if (back?.isConnected && !toaster.contains(back)) back.focus();
      else document.activeElement?.blur();
    };

    const toast = (options) => {
      const id = options.id ?? `htoast-${++count}`;
      let entry = find(id);
      const content = body({ ...options, action: options.action && { ...options.action, onClick: () => dismiss(id) } });
      if (entry) {
        // Changed in place: what it showed fades out over what it shows now,
        // while the box changes size.
        // If focus was in it, it stays with the toasts.
        const old = entry.item.querySelector(":scope > .htoast-body:not([data-leaving])");
        const hadFocus = old.contains(document.activeElement);
        old.style.inlineSize = `${entry.width - 2}px`;
        old.setAttribute("data-leaving", "");
        old.inert = true;
        old.addEventListener("animationend", () => old.remove(), { once: true });
        entry.item.append(content);
        if (hadFocus) toaster.focus();
      } else {
        const item = document.createElement("li");
        item.className = "htoast";
        item.append(content);
        list.append(item);
        entry = { id, item };
        toasts.set(item, entry);
      }
      entry.item.dataset.status = options.status ?? "info";
      announce(options);
      measure(entry);
      due.delete(entry);
      entry.remaining = options.duration ?? DURATION;
      layout();
      run(entry);
      return id;
    };

    const dismiss = (id) => {
      const entry = find(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      toasts.delete(entry.item);
      due.delete(entry);
      // Inert as it leaves, so its action can't run again; focus that was in
      // it stays with the toasts, or goes back.
      const hadFocus = entry.item.contains(document.activeElement);
      entry.item.setAttribute("data-removed", "");
      entry.item.inert = true;
      if (hadFocus) {
        if (toasts.size) toaster.focus();
        else giveFocusBack();
      }
      layout();
      // Gone once its exit has played: as long as its longest transition,
      // whatever the tokens make that.
      const seconds = Math.max(0, ...getComputedStyle(entry.item).transitionDuration.split(",").map(parseFloat));
      setTimeout(() => {
        entry.item.remove();
        size();
      }, seconds * 1000 + 50);
    };

    // Spread out: hovered with a mouse, tapped, or with focus inside.
    let hovered = false;
    const setExpanded = (on) => {
      on = on && toasts.size > 0;
      if (toaster.hasAttribute("data-expanded") === on) return;
      toaster.toggleAttribute("data-expanded", on);
      size();
      syncTimers();
    };
    const update = () => setExpanded(hovered || toaster.contains(document.activeElement));
    toaster.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || !fine.matches) return;
      hovered = true;
      update();
    });
    toaster.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      hovered = false;
      update();
    });
    toaster.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      hovered = true;
      update();
    });
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || toaster.contains(event.target)) return;
      hovered = false;
      update();
    });
    toaster.addEventListener("focusin", update);
    toaster.addEventListener("focusout", () => requestAnimationFrame(update));
    document.addEventListener("visibilitychange", syncTimers);

    document.addEventListener("keydown", (event) => {
      if (event.key === "F8" && toasts.size) {
        event.preventDefault();
        if (!toaster.contains(document.activeElement)) returnTo = document.activeElement;
        toaster.focus();
      } else if (event.key === "Escape" && toaster.contains(document.activeElement)) {
        event.preventDefault();
        giveFocusBack();
      }
    });

    // The window's size and late fonts change how toasts fit.
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const entry of toasts.values()) measure(entry);
        layout();
      });
    };
    addEventListener("resize", remeasure);
    document.fonts?.addEventListener("loadingdone", remeasure);

    // Inside the open dialog or drawer, else where it was. Moved, each toast
    // is in the page again and would start over. Noting where each one is, as
    // --htoast-moved-*, and marking it data-moved, lets it carry on from
    // there; a toast that comes during the move, unmarked, comes in as usual.
    // What a changed toast showed fades on from where it was.
    const home = { parent: toaster.parentElement, next: toaster.nextSibling };
    const modals = [];
    const note = () => {
      const noted = [];
      for (const item of list.children) {
        const style = getComputedStyle(item);
        item.style.setProperty("--htoast-moved-opacity", style.opacity);
        item.style.setProperty("--htoast-moved-transform", style.transform);
        item.style.setProperty("--htoast-moved-width", style.width);
        item.style.setProperty("--htoast-moved-height", style.height);
        noted.push(item);
        for (const content of item.querySelectorAll(":scope > .htoast-body")) {
          if (content.hasAttribute("data-leaving")) {
            content.style.animationDelay = `-${Number(content.getAnimations()[0]?.currentTime ?? 0)}ms`;
            continue;
          }
          const contentStyle = getComputedStyle(content);
          item.style.setProperty("--htoast-moved-body-opacity", contentStyle.opacity);
          item.style.setProperty("--htoast-moved-body-filter", contentStyle.filter);
          noted.push(content);
        }
      }
      for (const node of noted) node.setAttribute("data-moved", "");
      return noted;
    };
    const place = () => {
      const modal = modals.at(-1);
      const inPlace = modal ? toaster.parentElement === modal : toaster.parentElement === home.parent;
      if (inPlace && toaster.matches(":popover-open")) return;
      const noted = note();
      if (toaster.matches(":popover-open")) toaster.hidePopover();
      if (modal) modal.append(toaster);
      else home.parent.insertBefore(toaster, home.next?.parentNode === home.parent ? home.next : null);
      toaster.showPopover();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const node of noted) node.removeAttribute("data-moved");
        }),
      );
    };
    const enter = (dialog) => {
      if (modals.includes(dialog)) return;
      modals.push(dialog);
      place();
    };
    const leave = (dialog) => {
      if (!modals.includes(dialog)) return;
      modals.splice(modals.indexOf(dialog), 1);
      place();
    };
    document.addEventListener("toggle", (event) => {
      const dialog = event.target;
      if (dialog.localName === "dialog" && event.newState === "open" && dialog.matches(":modal") && !dialog.hasAttribute("data-closing")) enter(dialog);
    }, true);
    document.addEventListener("beforetoggle", (event) => {
      if (event.target.localName === "dialog" && event.newState === "closed") leave(event.target);
    }, true);
    // It stays in a dialog until the dialog closes, since while its exit
    // plays it's still modal, and outside it the toasts would be inert, and
    // what they announce unread; and it leaves one taken out of the page.
    new MutationObserver((records) => {
      if (!modals.length) return;
      for (const { removedNodes } of records) {
        if (!removedNodes.length) continue;
        for (const open of [...modals]) if (!open.isConnected) leave(open);
      }
    }).observe(document.body, { subtree: true, childList: true });
    // Any already open: the one with focus on top, since only the topmost
    // modal can have it; the others in the page's order.
    const open = [...document.querySelectorAll("dialog")].filter((dialog) => dialog.matches(":modal"));
    const focused = open.find((dialog) => dialog.contains(document.activeElement));
    modals.push(...open.filter((dialog) => dialog !== focused), ...(focused ? [focused] : []));
    place();

    // The examples' buttons.
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-example-toast-title], [data-example-toast-stack]");
      if (!button) return;
      // Where the region is: a toast at the start or end has less room.
      const position = button.dataset.exampleToastPosition;
      if (position) {
        if (position === "bottom-center") toaster.removeAttribute("data-position");
        else toaster.dataset.position = position;
        for (const entry of toasts.values()) measure(entry);
        layout();
      }
      if (button.hasAttribute("data-example-toast-stack")) {
        toast({ status: "success", title: "Contact added", description: "Sam Rivera, +44 7700 900123" });
        setTimeout(() => toast({ status: "warning", title: "2 contacts were already in the list", description: "We kept the existing ones and skipped the copies." }), 250);
        setTimeout(() => toast({ status: "info", title: "Chat assigned to you" }), 500);
        return;
      }
      const { exampleToastId, exampleToastStatus, exampleToastTitle, exampleToastDescription, exampleToastDuration, exampleToastAction } = button.dataset;
      toast({
        id: exampleToastId,
        status: exampleToastStatus,
        title: exampleToastTitle,
        description: exampleToastDescription,
        duration: exampleToastDuration === "Infinity" ? Infinity : exampleToastDuration && Number(exampleToastDuration),
        action: exampleToastAction && { label: exampleToastAction },
      });
    });

    // The drawer example: a shortcut that's taken keeps it open, with an
    // error toast; any other closes it, with a toast that it's saved.
    for (const form of document.querySelectorAll("form[data-example-taken]")) {
      form.addEventListener("submit", (event) => {
        const shortcut = form.elements.namedItem("shortcut");
        const value = shortcut.value.trim();
        if (value === form.dataset.exampleTaken) {
          event.preventDefault();
          toast({ status: "error", title: "Couldn't save the quick reply", description: `The shortcut ${value} is already taken. Pick another one.` });
          return;
        }
        toast({ status: "success", title: "Quick reply saved", description: `Type ${value} in a chat to use it.` });
      });
    }
  }
}
