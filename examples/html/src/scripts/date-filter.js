// Example only: what the React DateFilter does. The chip opens a panel of a
// condition and the fields it needs. Apply stays off until they're complete,
// then writes { gte, lte } in Unix seconds and shows the range in the chip. It
// reopens on what's applied, with the condition worked out from it; what was
// typed and not applied is dropped. Clear empties it and the fields, and leaves
// the panel open.
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
      const latin = Array.from(typed, (character) => {
        const digit = digits.indexOf(character);
        return digit >= 0 ? String(digit) : /[0-9]/.test(character) ? character : "";
      }).join("");
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
      const calendar = calendarOf(picker);
      if (limit) calendar.dataset[name] = limit;
      else delete calendar.dataset[name];
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
      bound(first, "exampleMax", between ? endDate : null);
      bound(second, "exampleMin", date);
      clear.hidden = value.gte === null && value.lte === null;
      if (isComplete()) apply.removeAttribute("aria-disabled");
      else apply.setAttribute("aria-disabled", "true");
    };

    const description = () => {
      const { gte, lte } = value;
      if (gte === null && lte === null) return null;
      if (lte === null) return `${word("after")} ${dates.format(gte * 1000)}`;
      if (gte === null) return `${word("before")} ${dates.format(lte * 1000)}`;
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
    };

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

    const applied = () => {
      if (!isComplete()) return;
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

    showValue();
  }
}
