// Example only: what the React KanbanBoard does. A card is dragged with a
// mouse from anywhere on it but its menu, once it has moved 4px, and on a
// touch screen after a long press, 250ms without moving more than 5px, so a
// swipe still scrolls: a copy of it follows the pointer, lifted, and a dashed
// outline its size shows where it will land, by where the copy's middle is:
// in the column it's over, before the first card whose middle is below it;
// between two columns, it stays where it is. A column it can't go to fades. The board keeps its height
// while a card is dragged, so the columns, which stretch to the tallest,
// stay still as cards slide inside them. Near the board's edges, or the
// window's, it scrolls that way. Letting go drops it, the copy settling into
// place, and the click that follows is no press of what's under it; Escape
// puts it back. From the keys, Space or Enter on its handle, which shows as
// it takes focus, picks it up; ↑ and ↓ move it within its column, ← and → to
// the next column, at the same place; Space, Enter, or Tab drops it, and
// Escape puts it back. Each card's menu moves it up, down, or to another
// column, focus going to the menu's button. The board's status says what
// each step does. Moving a card into a column it can't go to, the Banner
// says why. The cards around one that moves slide to their places, unless
// motion is reduced. Each column's count, its Empty State, and each card's
// menu follow its cards.
//
// The rest is your app's, as the React KanbanBoard's canMove and onMove are,
// and KanbanCard's onOpen: a column with data-example-requires takes a card
// only if it has what that selector names, or the Banner says the card's
// data-example-refusal; on a board with data-example-saves, a move takes
// 600ms to save, and a card with data-example-fails comes back, the Banner
// saying it; a column with data-example-confirm asks first, in the Dialog
// with that id, its title from data-example-label, {card} in the text, and
// the card goes back if that's cancelled. A menu item with
// data-example-delete deletes its card. A card whose title is a link goes to
// its page. On a board with data-example-opens, pressing a card whose title
// is a button opens the Drawer with that id: the card's title, description,
// and data-example-message, its data-example-href on the Drawer's link, and
// its status, assignee, and priority, which change the card. A status moves
// it as a drag does, saved and turned down the same way, the field saying
// why; Assign to me chooses its data-example-assign; Resolve moves it to the
// column its data-example-resolve names, then closes the Drawer; a priority
// option's data-example-color colors the card's Tag, and Normal has none.
{
  const words = {
    failed: "That didn't move. Try again.",
    moveUp: "Move up",
    moveDown: "Move down",
    moveTo: (column) => `Move to ${column}`,
    place: (column, position, count) => `${column}, ${position} of ${count}`,
    pickedUp: (card, place) => `Picked up ${card}, in ${place}.`,
    over: (card, place) => `${card} is in ${place}.`,
    dropped: (card, place) => `Dropped ${card} in ${place}.`,
    moved: (card, place) => `Moved ${card} to ${place}.`,
    back: (card, place) => `${card} is back in ${place}.`,
  };
  const easeOut = "cubic-bezier(0.215, 0.61, 0.355, 1)";
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // While a card is dragged by touch, the page doesn't scroll. Listening from
  // the start, and not passively, is what lets that stop it in Safari. A
  // touch while the page still coasts from a swipe can't stop it; the page
  // scrolls, and the drag is cancelled.
  let touchDragging = false;
  addEventListener(
    "touchmove",
    (event) => {
      if (touchDragging && event.cancelable) event.preventDefault();
    },
    { passive: false },
  );
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Where an element sits without the slide it may be in the middle of.
  const layoutRect = (element) => {
    const rect = element.getBoundingClientRect();
    const transform = getComputedStyle(element).transform;
    const { e, f } = new DOMMatrixReadOnly(transform === "none" ? undefined : transform);
    return { left: rect.left - e, top: rect.top - f, width: rect.width, height: rect.height };
  };

  for (const board of document.querySelectorAll(".hkanban")) {
    const status = board.querySelector(":scope > .hkanban-status");
    const banner = board.querySelector(":scope > .hbanner");
    const scroller = board.querySelector(".hkanban-columns");
    const columns = [...board.querySelectorAll(".hkanban-column")];
    const listOf = (column) => column.querySelector(".hkanban-list");
    const itemsOf = (column) => [...listOf(column).children];
    const columnOf = (item) => item.closest(".hkanban-column");
    const titleOf = (column) => column.querySelector(".hkanban-column-title").textContent.trim();
    const labelOf = (item) => item.querySelector(".hkanban-handle").getAttribute("aria-label").replace(/^Move /, "");
    const handleOf = (item) => item.querySelector(".hkanban-handle");
    const placeOf = (item) => {
      const items = itemsOf(columnOf(item));
      return words.place(titleOf(columnOf(item)), items.indexOf(item) + 1, items.length);
    };
    const say = (text) => {
      status.textContent = text;
    };
    const showError = (text) => {
      banner.querySelector(".hbanner-message").textContent = text;
      banner.hidden = !text;
    };
    banner.querySelector(":scope > .hbutton").addEventListener("click", () => showError(""));

    // Each column's count and its Empty State, as a card moves; and then each
    // card's moves, after the app's own items and their separator, once it
    // has landed.
    const recount = () => {
      for (const column of columns) {
        const list = listOf(column);
        const count = String(list.children.length);
        const badge = column.querySelector(".hkanban-column-header > .hbadge");
        if (badge.textContent !== count) badge.textContent = count;
        list.hidden = count === "0";
        column.querySelector(".hempty-state").hidden = count !== "0";
      }
    };
    const refresh = () => {
      recount();
      for (const column of columns) {
        const items = itemsOf(column);
        items.forEach((item, index) => {
          const menu = item.querySelector(".hkanban-menu > .hdropdown-menu");
          const separator = menu.querySelector(":scope > .hdropdown-menu-separator");
          for (const old of menu.querySelectorAll(":scope > .hdropdown-menu-item")) {
            if (!separator || separator.compareDocumentPosition(old) & Node.DOCUMENT_POSITION_FOLLOWING) old.remove();
          }
          const end = menu.lastElementChild?.matches(".hdropdown-menu-scroll") ? menu.lastElementChild : null;
          const add = (text, move) => {
            const choice = document.createElement("button");
            choice.type = "button";
            choice.className = "hdropdown-menu-item";
            choice.setAttribute("role", "menuitem");
            choice.tabIndex = -1;
            choice.textContent = text;
            choice.dataset.exampleMove = move;
            menu.insertBefore(choice, end);
          };
          if (index > 0) add(words.moveUp, "up");
          if (index < items.length - 1) add(words.moveDown, "down");
          for (const other of columns) if (other !== column) add(words.moveTo(titleOf(other)), String(columns.indexOf(other)));
        });
      }
    };

    // Moves a card, and slides each card of the columns it leaves and enters
    // from where it was to where it is: first every card's place, then the
    // move, its columns' counts and Empty States, then every new place, so
    // the page is laid out once. A slide still under way is cut short where
    // it is, and the next starts there. The card's own place, the dashed
    // outline, doesn't slide across from another column; it's there at once.
    const slides = new WeakMap();
    const slideTo = (item, to, index) => {
      const from = columnOf(item);
      const cards = (from === to ? [from] : [from, to]).flatMap(itemsOf);
      const animate = !still();
      const first = animate ? cards.map((card) => card.getBoundingClientRect()) : [];
      for (const card of cards) slides.get(card)?.cancel();
      place(item, to, index);
      recount();
      if (!animate) return;
      const last = cards.map((card) => card.getBoundingClientRect());
      cards.forEach((card, at) => {
        if (card === item && from !== to) return;
        const x = first[at].left - last[at].left;
        const y = first[at].top - last[at].top;
        if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;
        slides.set(card, card.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }], { duration: 200, easing: easeOut }));
      });
    };
    const place = (item, column, index) => {
      const others = itemsOf(column).filter((each) => each !== item);
      listOf(column).insertBefore(item, others[index] ?? null);
    };

    const verdict = (item, column, home) => {
      if (column === home) return true;
      const needs = column.dataset.exampleRequires;
      return needs && !item.querySelector(needs) ? (item.dataset.exampleRefusal ?? words.failed) : true;
    };

    const ask = (dialog, item) =>
      new Promise((resolve) => {
        const title = item.querySelector(".hkanban-card-title").textContent.trim();
        dialog.querySelector(".hdialog-title").textContent = dialog.dataset.exampleLabel.replace("{card}", title);
        const confirm = dialog.querySelector(".hdialog-footer > .hbutton:not([command])");
        const yes = () => {
          resolve(true);
          dialog.close();
        };
        confirm.addEventListener("click", yes, { once: true });
        dialog.addEventListener(
          "close",
          () => {
            confirm.removeEventListener("click", yes);
            resolve(false);
          },
          { once: true },
        );
        dialog.showModal();
      });

    // The app saves the move, or turns it down, and the card goes back.
    const commit = async (item, from, to, back) => {
      let answer;
      const dialog = to !== from && to.dataset.exampleConfirm ? document.getElementById(to.dataset.exampleConfirm) : null;
      if (dialog) {
        answer = (await ask(dialog, item)) ? undefined : false;
      } else if (board.hasAttribute("data-example-saves")) {
        await wait(600);
        answer = item.dataset.exampleFails;
      }
      if (answer === undefined || !item.isConnected) return;
      slideTo(item, back.column, back.index);
      refresh();
      if (answer) showError(answer);
      say(`${answer ? `${answer} ` : ""}${words.back(labelOf(item), placeOf(item))}`);
    };

    const moveTo = (item, to, index) => {
      const from = columnOf(item);
      const back = { column: from, index: itemsOf(from).indexOf(item) };
      const trigger = item.querySelector(".hkanban-menu > .hbutton");
      const permitted = verdict(item, to, from);
      if (permitted !== true) {
        showError(permitted);
        say(permitted);
        trigger.focus();
        return;
      }
      showError("");
      slideTo(item, to, index);
      refresh();
      trigger.focus();
      say(words.moved(labelOf(item), placeOf(item)));
      void commit(item, from, to, back);
    };

    board.addEventListener("click", (event) => {
      const choice = event.target.closest(".hdropdown-menu-item");
      if (!choice) return;
      const item = choice.closest(".hkanban-item");
      if (choice.hasAttribute("data-example-delete")) {
        item.remove();
        refresh();
        return;
      }
      const move = choice.dataset.exampleMove;
      if (!move) return;
      const column = columnOf(item);
      const index = itemsOf(column).indexOf(item);
      if (move === "up") moveTo(item, column, index - 1);
      else if (move === "down") moveTo(item, column, index + 1);
      else moveTo(item, columns[Number(move)], 0);
    });

    // A drag: the card, where it came from, the column it's over and whether
    // it can go there, and the copy that follows the pointer.
    let drag = null;

    const markOver = () => {
      for (const column of columns) {
        const over = drag && column === drag.target ? (drag.allowed ? "allowed" : "refused") : undefined;
        if (column.dataset.over === over) continue;
        if (over) column.dataset.over = over;
        else delete column.dataset.over;
      }
    };

    const lift = (item) => {
      const rect = item.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.className = "hkanban-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.inert = true;
      const copy = item.firstElementChild.cloneNode(true);
      copy.querySelector(".hkanban-card-actions")?.remove();
      for (const element of [copy, ...copy.querySelectorAll("*")]) {
        element.removeAttribute("id");
        element.removeAttribute("aria-describedby");
      }
      overlay.append(copy);
      Object.assign(overlay.style, {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        inlineSize: `${rect.width}px`,
        boxSizing: "border-box",
        zIndex: "999",
        pointerEvents: "none",
        touchAction: "none",
      });
      board.append(overlay);
      return { overlay, rect };
    };

    // The board's height, held while a card is dragged, and let go once the
    // cards have slid to their places.
    let releasing;
    const hold = () => {
      clearTimeout(releasing);
      scroller.style.minBlockSize = `${scroller.offsetHeight}px`;
    };
    const letGo = () => {
      releasing = setTimeout(() => {
        scroller.style.minBlockSize = "";
      }, 220);
    };

    const pickUp = (item, { keyboard, x = 0, y = 0 }) => {
      const home = columnOf(item);
      hold();
      showError("");
      drag = {
        item,
        keyboard,
        home,
        homeIndex: itemsOf(home).indexOf(item),
        target: home,
        allowed: true,
        x,
        y,
        ...lift(item),
      };
      item.setAttribute("data-dragging", "true");
      markOver();
      say(words.pickedUp(labelOf(item), placeOf(item)));
    };

    // The copy over the card, as the keys move it.
    const follow = () => {
      const rect = layoutRect(drag.item);
      drag.overlay.style.transform = `translate3d(${rect.left - drag.rect.left}px, ${rect.top - drag.rect.top}px, 0)`;
    };

    const finish = () => {
      const { item, overlay, rect, keyboard } = drag;
      const end = layoutRect(item);
      drag = null;
      touchDragging = false;
      markOver();
      letGo();
      if (keyboard) handleOf(item).focus();
      const done = () => {
        overlay.remove();
        item.removeAttribute("data-dragging");
      };
      if (still()) return done();
      const from = new DOMMatrixReadOnly(getComputedStyle(overlay).transform === "none" ? undefined : getComputedStyle(overlay).transform);
      overlay
        .animate(
          [
            { transform: `translate3d(${from.e}px, ${from.f}px, 0)` },
            { transform: `translate3d(${end.left - rect.left}px, ${end.top - rect.top}px, 0)` },
          ],
          { duration: 200, easing: easeOut, fill: "forwards" },
        )
        .finished.then(done, done);
    };

    const drop = () => {
      const { item, home, homeIndex, target, allowed } = drag;
      if (!allowed) {
        const refusal = verdict(item, target, home);
        slideTo(item, home, homeIndex);
        refresh();
        showError(refusal);
        say(`${refusal} ${words.back(labelOf(item), placeOf(item))}`);
        finish();
        return;
      }
      refresh();
      const column = columnOf(item);
      const index = itemsOf(column).indexOf(item);
      say(words.dropped(labelOf(item), placeOf(item)));
      finish();
      if (column !== home || index !== homeIndex) void commit(item, home, column, { column: home, index: homeIndex });
    };

    const cancel = () => {
      const { item, home, homeIndex } = drag;
      slideTo(item, home, homeIndex);
      refresh();
      say(words.back(labelOf(item), placeOf(item)));
      finish();
    };

    // The keys, from a card's handle.
    board.addEventListener("keydown", (event) => {
      const handle = event.target.closest(".hkanban-handle");
      if (!handle || event.altKey || event.ctrlKey || event.metaKey) return;
      const item = handle.closest(".hkanban-item");
      if (!drag) {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        pickUp(item, { keyboard: true });
        follow();
        return;
      }
      if (!drag.keyboard || drag.item !== item) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      } else if (event.key === " " || event.key === "Enter" || event.key === "Tab") {
        if (event.key !== "Tab") event.preventDefault();
        drop();
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const column = columnOf(item);
        const items = itemsOf(column);
        const index = items.indexOf(item) + (event.key === "ArrowUp" ? -1 : 1);
        drag.target = column;
        drag.allowed = true;
        markOver();
        if (index < 0 || index >= items.length) return;
        slideTo(item, column, index);
        handle.focus({ preventScroll: true });
        handle.scrollIntoView({ block: "nearest", inline: "nearest" });
        follow();
        say(words.over(labelOf(item), placeOf(item)));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step = (event.key === "ArrowRight") === (getComputedStyle(board).direction !== "rtl") ? 1 : -1;
        const next = columns[columns.indexOf(drag.target) + step];
        if (!next) return;
        const permitted = verdict(item, next, drag.home);
        drag.target = next;
        drag.allowed = permitted === true;
        markOver();
        if (permitted !== true) {
          say(permitted);
          return;
        }
        const index = Math.min(itemsOf(columnOf(item)).indexOf(item), itemsOf(next).filter((each) => each !== item).length);
        slideTo(item, next, index);
        handle.focus({ preventScroll: true });
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
        follow();
        say(words.over(labelOf(item), placeOf(item)));
      }
    });

    // The copy's middle: the column it's over; between two, the one it was
    // over; past the board's ends, the nearest. Then the place among its
    // cards, before the first whose middle is below it.
    const columnAt = (x) => {
      const rects = columns.map((column) => column.getBoundingClientRect());
      const inside = columns.find((_, index) => x >= rects[index].left && x <= rects[index].right);
      if (inside) return inside;
      const left = Math.min(...rects.map((rect) => rect.left));
      const right = Math.max(...rects.map((rect) => rect.right));
      if (x > left && x < right) return drag.target;
      const distance = (rect) => (x < rect.left ? rect.left - x : x - rect.right);
      return columns[rects.indexOf([...rects].sort((a, b) => distance(a) - distance(b))[0])];
    };
    const indexAt = (column, y) => {
      const others = itemsOf(column).filter((each) => each !== drag.item);
      const index = others.findIndex((each) => {
        const rect = layoutRect(each);
        return y < rect.top + rect.height / 2;
      });
      return index === -1 ? others.length : index;
    };
    const point = (x, y) => {
      drag.lastX = x;
      drag.lastY = y;
      drag.overlay.style.transform = `translate3d(${x - drag.x}px, ${y - drag.y}px, 0)`;
      const middleX = x - drag.x + drag.rect.left + drag.rect.width / 2;
      const middleY = y - drag.y + drag.rect.top + drag.rect.height / 2;
      const column = columnAt(middleX);
      const permitted = verdict(drag.item, column, drag.home);
      drag.target = column;
      drag.allowed = permitted === true;
      markOver();
      if (permitted !== true) return;
      const index = indexAt(column, middleY);
      const items = itemsOf(column);
      if (columnOf(drag.item) === column && items.filter((each) => each !== drag.item)[index] === items[items.indexOf(drag.item) + 1]) return;
      slideTo(drag.item, column, index);
      say(words.over(labelOf(drag.item), placeOf(drag.item)));
    };

    // Near an edge of the board, or of the window, it scrolls that way.
    const scroll = () => {
      if (!drag || drag.keyboard) return;
      const edge = 42;
      const box = scroller.getBoundingClientRect();
      const speed = (distance) => (distance < edge ? Math.ceil((edge - Math.max(distance, 0)) / 3) : 0);
      const sideways = speed(drag.lastX - box.left) ? -speed(drag.lastX - box.left) : speed(box.right - drag.lastX);
      const down = speed(drag.lastY) ? -speed(drag.lastY) : speed(innerHeight - drag.lastY);
      if (sideways) scroller.scrollLeft += sideways;
      if (down) scrollBy(0, down);
      if (sideways || down) point(drag.lastX, drag.lastY);
      drag.frame = requestAnimationFrame(scroll);
    };

    const noSelecting = (event) => event.preventDefault();

    board.addEventListener("pointerdown", (event) => {
      if (drag || !event.isPrimary || event.button !== 0) return;
      const item = event.target.closest(".hkanban-item");
      if (!item || event.target.closest(".hkanban-card-actions")) return;
      const touch = event.pointerType === "touch";
      const { pointerId, clientX, clientY } = event;
      let x = clientX;
      let y = clientY;
      const begin = () => {
        getSelection()?.removeAllRanges();
        document.addEventListener("selectstart", noSelecting);
        touchDragging = touch;
        pickUp(item, { keyboard: false, x: clientX, y: clientY });
        drag.frame = requestAnimationFrame(scroll);
        point(x, y);
      };
      const press = touch ? setTimeout(begin, 250) : undefined;
      const end = () => {
        clearTimeout(press);
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", stop);
        removeEventListener("pointercancel", stop);
        removeEventListener("keydown", escape, true);
        document.removeEventListener("selectstart", noSelecting);
      };
      const move = (moving) => {
        if (moving.pointerId !== pointerId) return;
        x = moving.clientX;
        y = moving.clientY;
        if (drag) {
          if (!drag.keyboard) point(x, y);
          return;
        }
        const distance = Math.hypot(x - clientX, y - clientY);
        // On a touch screen, moving before the press is long is a swipe.
        if (touch) {
          if (distance > 5) end();
        } else if (distance >= 4) {
          begin();
        }
      };
      const stop = (ending) => {
        if (ending.pointerId !== pointerId) return;
        end();
        if (!drag || drag.keyboard) return;
        cancelAnimationFrame(drag.frame);
        if (ending.type === "pointercancel") return cancel();
        // The click that follows letting go isn't a press of what's under it.
        const swallow = (click) => {
          click.preventDefault();
          click.stopPropagation();
        };
        addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => removeEventListener("click", swallow, true));
        drop();
      };
      const escape = (key) => {
        if (key.key !== "Escape" || !drag || drag.keyboard) return;
        key.preventDefault();
        key.stopPropagation();
        cancelAnimationFrame(drag.frame);
        cancel();
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", stop);
      addEventListener("pointercancel", stop);
      addEventListener("keydown", escape, true);
    });
    // A long press would open the browser's menu too, and a card's link or
    // picture would start the browser's own drag, which ends this one.
    board.addEventListener("contextmenu", (event) => {
      if (drag && !drag.keyboard) event.preventDefault();
    });
    board.addEventListener("dragstart", (event) => {
      if (event.target.closest?.(".hkanban-item")) event.preventDefault();
    });

    // A card that opens: its title's button opens the Drawer named by the
    // board's data-example-opens, which shows the card, and changes it.
    const drawer = document.getElementById(board.dataset.exampleOpens ?? "");
    if (drawer) {
      const [statusField, assigneeField, priorityField] = drawer.querySelectorAll(".hdrawer-body .hfield");
      const statusTrigger = statusField.querySelector(".hselect");
      const statusError = statusField.querySelector(".herror");
      const assigneeTrigger = assigneeField.querySelector(".hselect");
      const assignToMe = drawer.querySelector("[data-example-assign]");
      const resolve = drawer.querySelector("[data-example-resolve]");
      const page = drawer.querySelector(".hdrawer-footer > a");
      const resolved = columns.find((column) => titleOf(column) === resolve.dataset.exampleResolve);
      let shown = null;
      let filling = false;

      const optionsOf = (trigger) => [...document.getElementById(trigger.getAttribute("popovertarget")).querySelectorAll(".hoption")];
      const chosenIn = (trigger) => trigger.querySelector(".hselect-value").textContent.trim();
      // Chooses the option with this label, without it counting as a change.
      const choose = (trigger, label) => {
        filling = true;
        const option = optionsOf(trigger).find((each) => each.querySelector(".hoption-label").textContent.trim() === label);
        trigger.dispatchEvent(new CustomEvent("example-select", { detail: option ?? null }));
        filling = false;
      };
      const assigneeOf = (item) => item.querySelector(".hkanban-card-footer > .havatar")?.getAttribute("aria-label") ?? "Unassigned";
      const statusSays = (text) => {
        statusError.textContent = text;
        if (text) statusTrigger.setAttribute("aria-invalid", "true");
        else statusTrigger.removeAttribute("aria-invalid");
      };
      const update = () => {
        resolve.disabled = columnOf(shown) === resolved;
        assignToMe.disabled = assigneeOf(shown) === assignToMe.dataset.exampleAssign;
      };
      const working = (busy) => {
        if (busy) {
          const spinner = document.createElement("span");
          spinner.className = "hspinner";
          spinner.setAttribute("aria-hidden", "true");
          resolve.append(spinner);
          resolve.setAttribute("aria-busy", "true");
          resolve.setAttribute("aria-disabled", "true");
        } else {
          resolve.querySelector(":scope > .hspinner")?.remove();
          resolve.removeAttribute("aria-busy");
          resolve.removeAttribute("aria-disabled");
        }
      };

      board.addEventListener("click", (event) => {
        const open = event.target.closest("button.hkanban-card-open");
        if (!open) return;
        shown = open.closest(".hkanban-item");
        const title = drawer.querySelector(".hdrawer-title");
        title.textContent = open.textContent.trim();
        let description = drawer.querySelector(".hdrawer-description");
        if (!description) {
          description = document.createElement("p");
          description.className = "hdrawer-description";
          description.id = `${drawer.id}-description`;
          title.after(description);
          drawer.setAttribute("aria-describedby", description.id);
        }
        description.textContent = shown.querySelector(".hkanban-card-description")?.textContent.trim() ?? "";
        drawer.querySelector(".hdrawer-body p").textContent = shown.dataset.exampleMessage ?? "";
        page.href = shown.dataset.exampleHref ?? "#";
        choose(statusTrigger, titleOf(columnOf(shown)));
        choose(assigneeTrigger, assigneeOf(shown));
        const tag = shown.querySelector(".hkanban-card-footer > .htag");
        for (const radio of priorityField.querySelectorAll("input")) radio.checked = radio.value === (tag?.textContent.trim() ?? "Normal");
        statusSays("");
        update();
        drawer.showModal();
      });

      // A status moves the card, by the board's rules, saved as a drag is;
      // turned down, the card and the Select go back, and the field says why.
      const changeStatus = async (to) => {
        const item = shown;
        const from = columnOf(item);
        if (to === from) return true;
        const permitted = verdict(item, to, from);
        if (permitted !== true) {
          statusSays(permitted);
          choose(statusTrigger, titleOf(from));
          return false;
        }
        statusSays("");
        const back = { column: from, index: itemsOf(from).indexOf(item) };
        slideTo(item, to, 0);
        refresh();
        working(true);
        let answer;
        if (board.hasAttribute("data-example-saves")) {
          await wait(600);
          answer = item.dataset.exampleFails;
        }
        working(false);
        if (answer) {
          slideTo(item, back.column, back.index);
          refresh();
          statusSays(answer);
          if (shown === item) choose(statusTrigger, titleOf(from));
        }
        update();
        return !answer;
      };
      statusTrigger.addEventListener("example-select-change", () => {
        if (filling || !shown) return;
        void changeStatus(columns.find((column) => titleOf(column) === chosenIn(statusTrigger)));
      });
      resolve.addEventListener("click", async () => {
        if (resolve.getAttribute("aria-busy") === "true" || !shown) return;
        choose(statusTrigger, titleOf(resolved));
        if (!(await changeStatus(resolved))) return;
        if (drawer.requestClose) drawer.requestClose();
        else drawer.close();
      });

      // The assignee: the card's Avatar, its initials from the name.
      const assign = (name) => {
        const footer = shown.querySelector(".hkanban-card-footer");
        footer.querySelector(":scope > .havatar")?.remove();
        if (name !== "Unassigned") {
          const avatar = document.createElement("span");
          avatar.setAttribute("role", "img");
          avatar.setAttribute("aria-label", name);
          avatar.title = name;
          avatar.className = "havatar";
          avatar.textContent = name
            .split(" ")
            .map((part) => part[0])
            .join("");
          footer.append(avatar);
        }
        statusSays("");
        update();
      };
      assigneeTrigger.addEventListener("example-select-change", () => {
        if (!filling && shown) assign(chosenIn(assigneeTrigger));
      });
      assignToMe.addEventListener("click", () => {
        choose(assigneeTrigger, assignToMe.dataset.exampleAssign);
        assign(assignToMe.dataset.exampleAssign);
      });

      // The priority: a Tag at the footer's start, in the option's
      // data-example-color, and none for Normal.
      priorityField.addEventListener("change", (event) => {
        if (!shown) return;
        const footer = shown.querySelector(".hkanban-card-footer");
        footer.querySelector(":scope > .htag")?.remove();
        const color = event.target.dataset.exampleColor;
        if (!color) return;
        const tag = document.createElement("span");
        tag.className = "htag";
        tag.style.setProperty("--htag-color", color);
        const dot = document.createElement("span");
        dot.className = "htag-dot";
        dot.setAttribute("aria-hidden", "true");
        tag.append(dot, event.target.value);
        footer.prepend(tag);
      });
    }

    refresh();
  }
}
