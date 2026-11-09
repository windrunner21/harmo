// Example only: what the React DatePicker does. Digits typed take the locale's
// order and separators. The date settles on blur or Enter: a real one goes to
// the hidden input, and one that isn't stays where it is, marked invalid. The
// button opens the Calendar in a Popup with popovertarget, which also handles
// Escape and a press outside; here, focus moves into it, picking a date closes
// it, and leaving it with Tab closes it. It opens on the date chosen.
{
  const typedDateOf = (locale) => {
    const lengths = { day: 2, month: 2, year: 4 };
    const parts = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date(Date.UTC(2026, 10, 9)));
    const order = parts.map(({ type }) => type).filter((type) => type in lengths);
    const separator = parts[parts.findIndex(({ type }) => type in lengths) + 1]?.value ?? "/";
    const number = new Intl.NumberFormat(locale, { useGrouping: false });
    const digits = Array.from({ length: 10 }, (_, digit) => number.format(digit));
    const toLatin = (text) =>
      Array.from(text)
        .map((character) => {
          const digit = digits.indexOf(character);
          return digit >= 0 ? String(digit) : /[0-9]/.test(character) ? character : "";
        })
        .join("");
    const toLocal = (latin) => Array.from(latin, (digit) => digits[Number(digit)]).join("");
    const split = (latin) => {
      let used = 0;
      return order.map((part) => {
        const piece = latin.slice(used, used + lengths[part]);
        used += lengths[part];
        return [part, piece];
      });
    };
    const digitsIn = (text) => toLatin(text).length;
    return {
      digitsIn,
      mask: (text) =>
        split(toLatin(text).slice(0, 8))
          .filter(([, piece]) => piece)
          .map(([, piece]) => toLocal(piece))
          .join(separator),
      format: (date) => {
        const [year, month, day] = date.split("-");
        return order.map((part) => toLocal({ day, month, year }[part])).join(separator);
      },
      parse: (text) => {
        const latin = toLatin(text);
        if (latin.length !== 8) return null;
        const { day, month, year } = Object.fromEntries(split(latin));
        return `${year}-${month}-${day}`;
      },
      caretAfter: (text, count) => {
        if (count === 0) return 0;
        let seen = 0;
        let offset = 0;
        for (const character of text) {
          offset += character.length;
          if (digitsIn(character)) seen += 1;
          if (seen === count) return offset;
        }
        return text.length;
      },
    };
  };

  const isDateTime = (value) =>
    /^.{10}T([01]\d|2[0-3]):[0-5]\d$/.test(value ?? "") && isDate(value.slice(0, 10));

  const isDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || value < "0100-01-01") return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  for (const picker of document.querySelectorAll(".hdate-picker")) {
    const input = picker.querySelector(".hinput");
    const button = picker.querySelector(".hbutton");
    const hidden = picker.querySelector('input[type="hidden"]');
    const popup = document.getElementById(button.getAttribute("popovertarget"));
    const calendar = popup.querySelector(".hcalendar");
    const { exampleLocale: locale, exampleToday: today, exampleMin: min, exampleMax: max } = calendar.dataset;
    const error = picker.closest(".hfield").querySelector(".herror");
    const message = picker.dataset.exampleDateError;
    const typing = typedDateOf(locale);

    // "Typed in words" stands in for a parser such as chrono-node, in your app:
    // it knows three phrases, with a time after them if the example has one.
    const words = "exampleWords" in picker.dataset;
    const time = "exampleTime" in picker.dataset;
    const long = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      timeZone: "UTC",
      dateStyle: "long",
      ...(time && { timeStyle: "short" }),
    });
    const after = (days) => new Date(Date.parse(`${today}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
    const inWords = { today: after(0), tomorrow: after(1), "next week": after(7) };
    const written = (date) => {
      if (!date) return "";
      if (!words) return typing.format(date);
      return long.format(new Date(time ? `${date}:00Z` : `${date}T00:00:00Z`));
    };
    const readWords = (text) => {
      const found = /^(today|tomorrow|next week)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/i.exec(text.trim());
      if (!found) return null;
      const day = inWords[found[1].toLowerCase()];
      if (!time) return found[2] ? null : day;
      let hour = Number(found[2] ?? 12);
      if (found[4]?.toLowerCase() === "pm" && hour < 12) hour += 12;
      if (found[4]?.toLowerCase() === "am" && hour === 12) hour = 0;
      return `${day}T${String(hour).padStart(2, "0")}:${found[3] ?? "00"}`;
    };
    const parse = (text) => (words ? readWords(text) : typing.parse(text));
    const isValue = (value) => (time ? isDateTime(value) : isDate(value));

    let current = hidden.value || null;

    const showCalendar = () =>
      calendar.dispatchEvent(new CustomEvent("example-calendar-show", { detail: current?.slice(0, 10) ?? null }));

    const setInvalid = (invalid) => {
      if (invalid) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      if (!error || !message) return;
      if (invalid) {
        error.textContent = message;
        error.hidden = false;
      } else if (error.textContent) {
        error.hidden = true;
        Promise.all(error.getAnimations().map((animation) => animation.finished)).then(
          () => {
            if (error.hidden) {
              error.textContent = "";
              error.hidden = false;
            }
          },
          () => {},
        );
      }
    };

    const settle = (next) => {
      current = next;
      hidden.value = next ?? "";
    };

    const commit = () => {
      const typed = input.value.trim();
      if (!typed) {
        setInvalid(false);
        settle(null);
        return;
      }
      if (typed === written(current)) return;
      const parsed = parse(typed);
      if (isValue(parsed) && (!min || parsed.slice(0, 10) >= min) && (!max || parsed.slice(0, 10) <= max)) {
        input.value = written(parsed);
        setInvalid(false);
        settle(parsed);
      } else {
        setInvalid(true);
        settle(null);
      }
    };

    input.addEventListener("input", () => {
      if (words) return;
      const position = typing.digitsIn(input.value.slice(0, input.selectionStart));
      const masked = typing.mask(input.value);
      input.value = masked;
      const caret = typing.caretAfter(masked, position);
      input.setSelectionRange(caret, caret);
    });
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || input.value.trim() === written(current)) return;
      event.preventDefault();
      commit();
    });

    popup.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") showCalendar();
    });
    popup.addEventListener("toggle", (event) => {
      if (event.newState === "open") popup.querySelector('.hcalendar-day[tabindex="0"]')?.focus();
    });
    popup.addEventListener("click", (event) => {
      const day = event.target.closest("[data-date]");
      if (!day || day.disabled) return;
      settle(time ? `${day.dataset.date}T${current?.slice(11) ?? "00:00"}` : day.dataset.date);
      input.value = written(current);
      setInvalid(false);
      popup.hidePopover();
      button.focus();
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
    const initial = current;
    input.form?.addEventListener("reset", (event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        settle(initial);
        input.value = written(initial);
        setInvalid(false);
      }),
    );

    // "In a form": says what would be sent, rather than leave the playground.
    const form = input.form;
    if (form && "exampleSend" in form.dataset) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = form.querySelector('[role="status"]');
        status.textContent = `Sent ${new FormData(form).get(hidden.name)}`;
        status.hidden = false;
      });
    }
  }
}
