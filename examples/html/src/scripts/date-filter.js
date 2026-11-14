// Example only: what the React DateFilter does. The chip opens a panel of a
// condition and the fields it needs. Apply stays off until they're complete,
// then writes { gte, lte } in Unix seconds and shows the range in the chip;
// Apply, or Enter in the amount or a date, with nothing changed since it
// opened keeps the value as it is. Under "is between", Enter in the start
// date only settles it. It reopens on what's applied, with the condition
// worked out from it; what was typed and not applied is dropped. A date that
// can't be used is explained under the fields. Clear empties it and
// the fields, and leaves the panel open. The pickers offer the days whose
// start and end read back as dates in every time zone, and a chip disabled
// while it's open closes it.
{
  const part = (value, length = 2) => String(value).padStart(length, "0");
  const localDate = (moment) =>
    `${part(moment.getFullYear(), 4)}-${part(moment.getMonth() + 1)}-${part(moment.getDate())}`;
  const momentOf = (date, hours = 0, minutes = 0, seconds = 0) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };
  const secondsOf = (moment) => Math.floor(moment.getTime() / 1000);
  const dayOf = (seconds) => localDate(new Date(seconds * 1000));
  const startOfDay = (date) => secondsOf(momentOf(date));
  // The next day's start, less a second: where clocks go back at midnight, the
  // last hour of the day happens twice.
  const endOfDay = (date) => secondsOf(momentOf(date, 24)) - 1;
  const isOneWholeDay = (gte, lte) => gte === startOfDay(dayOf(gte)) && lte === endOfDay(dayOf(gte));
  const SECONDS = { minutes: 60, hours: 3600, days: 86400, weeks: 604800, months: 2678400 };
  const LONGEST = 50000000000;
  // The first and last days the pickers offer, as in the React DateFilter: a
  // little inside the Calendar's own, so each day's start and end are times
  // it can read back in every time zone, from more than 15 hours ahead of UTC
  // to 12 behind.
  const FIRST_DAY = "0100-01-03";
  const LAST_DAY = "9999-12-28";

  // The same day some months back, or that month's last day if it's shorter.
  const monthsBefore = (now, months) => {
    const last = new Date(now.getFullYear(), now.getMonth() - months + 1, 0);
    const day = Math.min(now.getDate(), last.getDate());
    return new Date(last.getFullYear(), last.getMonth(), day, now.getHours(), now.getMinutes(), now.getSeconds());
  };

  const popupOf = (button) => document.getElementById(button.getAttribute("popovertarget"));

  for (const chip of document.querySelectorAll('.hfilter-chip[aria-haspopup="dialog"]')) {
    const popup = popupOf(chip);
    if (!popup.classList.contains("hdate-filter")) continue;
    const [conditionSelect, unitSelect] = popup.querySelectorAll(":scope .hselect");
    const conditions = popupOf(conditionSelect).querySelector(".hlistbox");
    const units = popupOf(unitSelect).querySelector(".hlistbox");
    const [lastRow, datesRow] = popup.querySelectorAll(".hdate-filter-fields");
    const amount = lastRow.querySelector(".hinput");
    const [first, second] = popup.querySelectorAll(".hdate-picker");
    const and = popup.querySelector(".hdate-filter-and");
    const [clear, apply] = popup.querySelectorAll(".hdate-filter-actions > .hbutton");
    const calendarOf = (picker) => popupOf(picker.querySelector(".hbutton")).querySelector(".hcalendar");
    const { exampleLocale: locale } = calendarOf(first).dataset;
    const number = new Intl.NumberFormat(locale, { useGrouping: false });
    const digits = Array.from({ length: 10 }, (_, digit) => number.format(digit));
    const toLatin = (text) =>
      Array.from(text, (character) => {
        const digit = digits.indexOf(character);
        return digit >= 0 ? String(digit) : /[0-9]/.test(character) ? character : "";
      }).join("");
    // A date as typed in the locale's order, as date-picker.js reads it, and
    // whether it's a real one.
    const order = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .formatToParts(new Date(Date.UTC(2026, 10, 9)))
      .map(({ type }) => type)
      .filter((type) => type === "day" || type === "month" || type === "year");
    const typedDate = (text) => {
      const latin = toLatin(text);
      if (latin.length !== 8) return null;
      let used = 0;
      const parts = {};
      for (const part of order) {
        const length = part === "year" ? 4 : 2;
        parts[part] = latin.slice(used, used + length);
        used += length;
      }
      const typed = `${parts.year}-${parts.month}-${parts.day}`;
      const moment = new Date(`${typed}T00:00:00Z`);
      return !Number.isNaN(moment.getTime()) && moment.toISOString().slice(0, 10) === typed ? typed : null;
    };
    const message = popup.querySelector(".hdate-filter-message");
    const firstLabel = first.querySelector(".hinput").getAttribute("aria-label");
    const startLabel = chip.dataset.exampleStartLabel;
    const dates = new Intl.DateTimeFormat(locale, { calendar: "gregory", dateStyle: "medium" });
    const times = new Intl.DateTimeFormat(locale, { calendar: "gregory", dateStyle: "medium", timeStyle: "short" });
    const query = chip.closest(".play-demo").querySelector("[data-example-query]");
    const read = (name) => (chip.dataset[name] === undefined ? null : Number(chip.dataset[name]));

    let value = { gte: read("exampleGte"), lte: read("exampleLte") };
    let date = null;
    let endDate = null;

    const optionOf = (listbox, name) => listbox.querySelector(`[data-example-value="${name}"]`);
    const chosen = (listbox) => listbox.querySelector('.hoption[aria-selected="true"]').dataset.exampleValue;
    const word = (name) => optionOf(conditions, name).querySelector(".hoption-label").textContent;
    const choose = (listbox, name) => optionOf(listbox, name).click();

    const amountNumber = () => {
      const typed = amount.value.trim();
      const latin = toLatin(typed);
      if (!latin || latin.length !== Array.from(typed).length) return null;
      const seconds = Number(latin);
      return seconds > 0 && seconds * SECONDS[chosen(units)] <= LONGEST ? seconds : null;
    };

    const isComplete = () => {
      const condition = chosen(conditions);
      if (condition === "last") return amountNumber() !== null;
      if (condition !== "between") return date !== null;
      return date !== null && endDate !== null && date <= endDate;
    };

    const bound = (picker, name, limit) => {
      calendarOf(picker).dataset[name] = limit;
    };

    // What the fields held as the panel opened.
    const draft = () => ({ condition: chosen(conditions), amount: amount.value, unit: chosen(units), date, endDate });
    let opened = null;
    const untouched = () => Object.entries(draft()).every(([key, field]) => opened?.[key] === field);

    // A date the Date Picker marked invalid: one out of order under "is
    // between", or else one that isn't a date.
    const problem = () => {
      const condition = chosen(conditions);
      if (condition === "last") return null;
      for (const [index, picker] of [first, second].entries()) {
        const field = picker.querySelector(".hinput");
        if (picker.hidden || field.getAttribute("aria-invalid") !== "true") continue;
        const typed = typedDate(field.value.trim());
        const other = index === 0 ? endDate : date;
        const outOfOrder =
          condition === "between" && other !== null && typed !== null && (index === 0 ? typed > other : typed < other);
        return outOfOrder ? "order" : "invalid";
      }
      return null;
    };

    // Which fields the condition needs, and whether Apply can be used.
    const refresh = () => {
      const condition = chosen(conditions);
      const between = condition === "between";
      lastRow.hidden = condition !== "last";
      datesRow.hidden = condition === "last";
      and.hidden = !between;
      second.hidden = !between;
      first.querySelector(".hinput").setAttribute("aria-label", between ? startLabel : firstLabel);
      bound(first, "exampleMin", FIRST_DAY);
      bound(first, "exampleMax", (between && endDate) || LAST_DAY);
      bound(second, "exampleMin", date ?? FIRST_DAY);
      bound(second, "exampleMax", LAST_DAY);
      clear.hidden = value.gte === null && value.lte === null;
      if (isComplete()) apply.removeAttribute("aria-disabled");
      else apply.setAttribute("aria-disabled", "true");
      if (message) {
        const found = problem();
        const { exampleInvalid: invalid, exampleOrder: outOfOrder } = message.dataset;
        const text = found === "order" ? (outOfOrder ?? invalid) : found === "invalid" ? invalid : "";
        if (message.textContent !== (text ?? "")) message.textContent = text ?? "";
      }
    };

    // Your app's words around a date with only one side, as React's
    // labels.afterDate and labels.beforeDate are. Here, as by default, the
    // condition's word goes in front; a language that puts it after the date
    // writes it there.
    const afterDate = (text) => `${word("after")} ${text}`;
    const beforeDate = (text) => `${word("before")} ${text}`;

    const description = () => {
      const { gte, lte } = value;
      if (gte === null && lte === null) return null;
      if (lte === null) return afterDate(dates.format(gte * 1000));
      if (gte === null) return beforeDate(dates.format(lte * 1000));
      if (gte > lte) return `${dates.format(gte * 1000)} – ${dates.format(lte * 1000)}`;
      const partOfDay = dayOf(gte) === dayOf(lte) && !isOneWholeDay(gte, lte);
      return (partOfDay ? times : dates).formatRange(gte * 1000, lte * 1000);
    };

    const showValue = () => {
      chip.querySelector(".hfilter-chip-values")?.remove();
      const text = description();
      if (text !== null) {
        const values = document.createElement("span");
        values.className = "hfilter-chip-values";
        const pill = document.createElement("span");
        pill.className = "hfilter-chip-value";
        pill.textContent = text;
        values.append(pill);
        chip.append(values);
      }
      if (query) {
        const kept = [value.gte !== null && `due[gte]=${value.gte}`, value.lte !== null && `due[lte]=${value.lte}`];
        query.textContent = `?${kept.filter(Boolean).join("&")}`;
      }
    };

    const settle = (next) => {
      value = next;
      showValue();
      popup.hidePopover();
      chip.focus();
    };

    const setDate = (picker, next) =>
      picker.dispatchEvent(new CustomEvent("example-date-picker-set", { detail: next }));

    // The fields, as what's applied describes them.
    const fill = () => {
      const { gte, lte } = value;
      const firstMoment = gte ?? lte;
      date = firstMoment === null ? null : dayOf(firstMoment);
      endDate = gte === null || lte === null ? null : dayOf(lte);
      amount.value = "";
      choose(units, "days");
      choose(
        conditions,
        gte === null && lte === null
          ? "last"
          : lte === null
            ? "after"
            : gte === null
              ? "before"
              : isOneWholeDay(gte, lte)
                ? "equal"
                : "between",
      );
      setDate(first, date);
      setDate(second, endDate);
      refresh();
      opened = draft();
    };

    // The React DateFilter leaves its panel out while it's disabled.
    new MutationObserver(() => {
      if (chip.disabled && popup.matches(":popover-open")) popup.hidePopover();
    }).observe(chip, { attributeFilter: ["disabled"] });

    popup.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") fill();
    });
    popup.addEventListener("toggle", (event) => {
      if (event.newState === "open") conditionSelect.focus();
    });

    popupOf(conditionSelect).addEventListener("click", refresh);
    popupOf(unitSelect).addEventListener("click", refresh);
    amount.addEventListener("input", refresh);
    first.addEventListener("example-date-picker-change", (event) => {
      date = event.detail;
      refresh();
    });
    second.addEventListener("example-date-picker-change", (event) => {
      endDate = event.detail;
      refresh();
    });
    // As React's DateFilter checks again on a Date Picker's onInvalidChange: a
    // day picked in the Calendar can clear aria-invalid after it's reported.
    const invalidity = new MutationObserver(refresh);
    for (const picker of [first, second]) {
      invalidity.observe(picker.querySelector(".hinput"), { attributeFilter: ["aria-invalid"] });
    }

    const applied = () => {
      if (!isComplete()) return;
      if ((value.gte !== null || value.lte !== null) && untouched()) {
        settle(value);
        return;
      }
      const condition = chosen(conditions);
      if (condition === "last") {
        const now = new Date();
        const unit = chosen(units);
        const count = amountNumber();
        const gte = unit === "months" ? secondsOf(monthsBefore(now, count)) : secondsOf(now) - count * SECONDS[unit];
        settle({ gte, lte: secondsOf(now) });
      } else if (condition === "equal") settle({ gte: startOfDay(date), lte: endOfDay(date) });
      else if (condition === "between") settle({ gte: startOfDay(date), lte: endOfDay(endDate) });
      else if (condition === "after") settle({ gte: startOfDay(date), lte: null });
      else settle({ gte: null, lte: endOfDay(date) });
    };

    // Filters' Reset.
    chip.addEventListener("example-filter-reset", () => {
      value = { gte: null, lte: null };
      showValue();
      popup.hidePopover();
    });

    apply.addEventListener("click", applied);
    // The panel stays open, for choosing again. Clear is about to go, so
    // focus moves first.
    clear.addEventListener("click", () => {
      conditionSelect.focus();
      value = { gte: null, lte: null };
      showValue();
      fill();
    });
    amount.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applied();
    });
    // On the row, so the Date Picker has settled what was typed by then. Under
    // "is between", Enter in the start date only settles it, even with an end
    // date already there.
    datesRow.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) return;
      if (!event.target.matches(".hdate-picker > .hinput")) return;
      event.preventDefault();
      if (chosen(conditions) === "between" && first.contains(event.target)) return;
      applied();
    });

    showValue();
  }
}
