// Example only: what the React TimePicker does. Each column is a listbox whose
// highlight and choice move together: the Up and Down arrows go through it,
// wrapping, Home and End to its ends, and Left and Right to the next column,
// following what you see in right-to-left text. Enter or Space closes the
// Popup. The Popup opens with popovertarget, which also handles Escape and a
// press outside; here, focus moves in as it opens, and leaving with Tab closes
// it. The trigger shows the time in the locale's words, and the hidden input
// holds it as "14:30".
{
  for (const button of document.querySelectorAll(".htime-picker")) {
    const popup = document.getElementById(button.getAttribute("popovertarget"));
    if (!popup) continue;
    const value = button.querySelector(".htime-picker-value");
    const hidden = popup.parentElement.querySelector(`input[type="hidden"][name="${button.dataset.exampleName}"]`);
    const locale = button.dataset.exampleLocale;
    const lists = [...popup.querySelectorAll(".htime-picker-column")];
    const listOf = (kind) => popup.querySelector(`[data-example-column="${kind}"]`);
    const twelve = Boolean(listOf("dayPeriod"));
    const format = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: twelve ? "h12" : "h23",
    });

    const chosenOf = (list) => list.querySelector('[aria-selected="true"]');
    const numberOf = (list) => {
      const option = list && chosenOf(list);
      return option ? Number(option.dataset.exampleValue) : undefined;
    };

    const showChosen = (list, center) => {
      const option = chosenOf(list);
      if (!option) return;
      if (center) list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
      else if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    };

    // Whatever isn't chosen yet counts as its first option, so the first
    // choice makes a whole time.
    const fillIn = () => {
      for (const list of lists) {
        if (chosenOf(list)) continue;
        const kind = list.dataset.exampleColumn;
        const first = kind === "hour" && twelve ? list.querySelector('[data-example-value="12"]') : list.querySelector('[role="option"]');
        mark(list, first);
      }
    };

    const mark = (list, option) => {
      for (const each of list.querySelectorAll('[role="option"]')) {
        each.setAttribute("aria-selected", String(each === option));
      }
      list.setAttribute("aria-activedescendant", option.id);
    };

    const update = () => {
      fillIn();
      const shown = numberOf(listOf("hour"));
      const minute = numberOf(listOf("minute"));
      const hour = twelve ? (shown % 12) + numberOf(listOf("dayPeriod")) * 12 : shown;
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      value.textContent = format.format(new Date(Date.UTC(2026, 0, 1, hour, minute)));
      value.removeAttribute("data-placeholder");
      if (hidden) hidden.value = time;
      for (const list of lists) showChosen(list, false);
    };

    const pick = (list, option) => {
      mark(list, option);
      update();
    };

    popup.addEventListener("toggle", (event) => {
      if (event.newState !== "open") return;
      for (const list of lists) showChosen(list, true);
      lists[0].focus();
    });

    let pressingButton = false;
    button.addEventListener("pointerdown", () => {
      pressingButton = true;
    });
    button.addEventListener("click", () => {
      pressingButton = false;
    });
    popup.addEventListener("focusout", (event) => {
      const next = event.relatedTarget;
      const pressed = next === button && pressingButton;
      if (next && !pressed && !popup.contains(next)) popup.hidePopover();
    });

    // A form's reset, which can't restore the hidden input: setting its value
    // moved what a reset goes back to.
    const initial = {
      text: value.textContent,
      empty: value.hasAttribute("data-placeholder"),
      time: hidden?.value ?? "",
      options: lists.map(chosenOf),
    };
    button.form?.addEventListener("reset", (event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        value.textContent = initial.text;
        value.toggleAttribute("data-placeholder", initial.empty);
        if (hidden) hidden.value = initial.time;
        lists.forEach((list, place) => {
          const option = initial.options[place];
          for (const each of list.querySelectorAll('[role="option"]')) {
            each.setAttribute("aria-selected", String(each === option));
          }
          if (option) list.setAttribute("aria-activedescendant", option.id);
          else list.removeAttribute("aria-activedescendant");
        });
      }),
    );

    // "In a form": says what would be sent, rather than leave the playground.
    const form = button.form;
    if (form && "exampleSend" in form.dataset) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = form.querySelector('[role="status"]');
        status.textContent = `Sent ${new FormData(form).get(hidden.name)}`;
        status.hidden = false;
      });
    }

    lists.forEach((list, place) => {
      list.addEventListener("click", (event) => {
        const option = event.target.closest('[role="option"]');
        if (option) pick(list, option);
      });

      list.addEventListener("keydown", (event) => {
        const options = [...list.querySelectorAll('[role="option"]')];
        const index = options.indexOf(chosenOf(list));
        const go = (next) => {
          event.preventDefault();
          pick(list, options[next]);
        };
        const forward = getComputedStyle(list).direction === "rtl" ? -1 : 1;
        if (event.key === "ArrowDown") go(index < 0 ? 0 : (index + 1) % options.length);
        else if (event.key === "ArrowUp") go(index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length);
        else if (event.key === "Home") go(0);
        else if (event.key === "End") go(options.length - 1);
        else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          lists[place + (event.key === "ArrowRight" ? forward : -forward)]?.focus();
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          popup.hidePopover();
          button.focus();
        }
      });
    });
  }
}
