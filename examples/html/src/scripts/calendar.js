// Example only: what the React Calendar does. Previous and Next move between
// months, a click chooses a day, and the keyboard moves through the days as the
// WAI-ARIA date grid says: the arrows by a day or a week, Home and End to the
// week's ends, Page Up and Page Down by a month, and with Shift by a year. Only
// one day is in the Tab order, the one the keyboard is on. Names come from Intl,
// in the locale's language, and the week from the headers already in the page.
// Dates are "2026-11-09", counted in UTC so that daylight saving can't move a day.
{
  const dateOf = (iso) => new Date(`${iso}T00:00:00Z`);
  const isoOf = (date) => date.toISOString().slice(0, 10);
  const monthOf = (iso) => iso.slice(0, 7);
  const addDays = (iso, days) => isoOf(new Date(dateOf(iso).getTime() + days * 86400000));
  const addMonths = (iso, months) => {
    const date = dateOf(iso);
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0));
    target.setUTCDate(Math.min(date.getUTCDate(), target.getUTCDate()));
    return isoOf(target);
  };

  for (const calendar of document.querySelectorAll(".hcalendar[data-example-locale]")) {
    const { exampleLocale: locale, exampleToday: today } = calendar.dataset;
    let { exampleMin: min = "0100-01-01", exampleMax: max = "9999-12-31" } = calendar.dataset;
    const [previous, next] = calendar.querySelectorAll(".hcalendar-header > .hbutton");
    const title = calendar.querySelector(".hcalendar-title");
    const grid = calendar.querySelector(".hcalendar-grid");
    const options = { calendar: "gregory", timeZone: "UTC" };
    const titleFormat = new Intl.DateTimeFormat(locale, { ...options, month: "long", year: "numeric" });
    const dateFormat = new Intl.DateTimeFormat(locale, { ...options, dateStyle: "full" });
    const numberFormat = new Intl.NumberFormat(locale, { useGrouping: false });
    const weekdayFormat = new Intl.DateTimeFormat(locale, { ...options, weekday: "long" });
    const firstDay = Array.from({ length: 7 }, (_, index) =>
      weekdayFormat.format(dateOf(addDays("2023-01-01", index))),
    ).indexOf(grid.querySelector("th").abbr);

    let value = grid.querySelector('[aria-selected="true"] > [data-date]')?.dataset.date ?? null;
    let month = monthOf(grid.querySelector("[data-date]").dataset.date);
    let cursor = null;

    const inRange = (date) => date >= min && date <= max;
    const clamp = (date) => (date < min ? min : date > max ? max : date);
    const exists = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= "0100-01-01";
    const showable = (date) => date && monthOf(date) === month && inRange(date);
    const stepTo = (months) => monthOf(addMonths(`${month}-01`, months));
    const blockedBack = () => month <= monthOf(min);
    const blockedOn = () => month >= monthOf(max);
    const dayNode = (date) => grid.querySelector(`[data-date="${date}"]`);

    const setBlocked = (button, blocked) => {
      if (blocked) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
    };

    const render = () => {
      title.textContent = titleFormat.format(dateOf(`${month}-01`));
      setBlocked(previous, blockedBack());
      setBlocked(next, blockedOn());

      const first = dateOf(`${month}-01`);
      const blanks = (first.getUTCDay() - firstDay + 7) % 7;
      const length = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
      const tabStop = [cursor, value, today, clamp(`${month}-01`)].find(showable);

      const rows = Array.from({ length: 6 }, (_, week) => {
        const row = document.createElement("tr");
        for (let weekday = 0; weekday < 7; weekday++) {
          const cell = row.insertCell();
          const day = week * 7 + weekday - blanks + 1;
          if (day < 1 || day > length) continue;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          if (date === value) cell.setAttribute("aria-selected", "true");
          const button = document.createElement("button");
          button.className = "hcalendar-day";
          button.type = "button";
          button.tabIndex = date === tabStop ? 0 : -1;
          button.dataset.date = date;
          button.setAttribute("aria-label", dateFormat.format(dateOf(date)));
          if (date === today) button.setAttribute("aria-current", "date");
          button.disabled = !inRange(date);
          button.textContent = numberFormat.format(day);
          cell.append(button);
        }
        return row;
      });
      grid.tBodies[0].replaceChildren(...rows);
    };

    previous.addEventListener("click", () => {
      if (blockedBack()) return;
      month = stepTo(-1);
      render();
    });
    next.addEventListener("click", () => {
      if (blockedOn()) return;
      month = stepTo(1);
      render();
    });

    grid.addEventListener("click", (event) => {
      const day = event.target.closest("[data-date]");
      if (!day || day.disabled) return;
      value = cursor = day.dataset.date;
      const focused = document.activeElement === day;
      render();
      if (focused) dayNode(value)?.focus();
    });

    grid.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const from = event.target.dataset.date;
      if (!from) return;
      const forward = getComputedStyle(grid).direction === "rtl" ? -1 : 1;
      const weekday = (dateOf(from).getUTCDay() - firstDay + 7) % 7;
      const start = addDays(from, -weekday);
      const end = addDays(from, 6 - weekday);
      const lastOfMonth = addDays(addMonths(`${month}-01`, 1), -1);
      const target = {
        ArrowRight: addDays(from, forward),
        ArrowLeft: addDays(from, -forward),
        ArrowDown: addDays(from, 7),
        ArrowUp: addDays(from, -7),
        Home: monthOf(start) === month ? start : `${month}-01`,
        End: monthOf(end) === month ? end : lastOfMonth,
        PageUp: addMonths(from, event.shiftKey ? -12 : -1),
        PageDown: addMonths(from, event.shiftKey ? 12 : 1),
      }[event.key];
      if (!target) return;
      event.preventDefault();
      if (!exists(target)) return;
      cursor = clamp(target);
      month = monthOf(cursor);
      render();
      dayNode(cursor)?.focus();
    });

    // A date your app sets: the month follows it. A Date Picker's example
    // script does this as it opens, so it opens on the date chosen.
    const allowedMonth = (shown) =>
      shown < monthOf(min) ? monthOf(min) : shown > monthOf(max) ? monthOf(max) : shown;
    const show = (date) => {
      ({ exampleMin: min = "0100-01-01", exampleMax: max = "9999-12-31" } = calendar.dataset);
      value = date;
      month = allowedMonth(monthOf(date ?? today));
      cursor = null;
      render();
    };
    calendar.addEventListener("example-calendar-show", (event) => show(event.detail));
    const set = calendar.parentElement.querySelector("[data-example-calendar-set]");
    set?.addEventListener("click", () => show(set.dataset.exampleCalendarSet));
  }
}
