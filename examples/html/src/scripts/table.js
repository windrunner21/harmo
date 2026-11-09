// Example only: what the React DataTable does, and what your app does around
// it. Ticking rows swaps the toolbar's controls for a Selection Bar, and the
// checkbox in the header says whether all of them, or some, are ticked; when
// the selection empties and focus has nowhere to be, it goes to that checkbox.
// Edit columns hides and shows columns, and remembers them. Pages are drawn as
// your app would from what it fetched.
{
  // While a table overflows, its scroll area can be reached from the keyboard.
  for (const area of document.querySelectorAll(".htable-scroll")) {
    const table = area.querySelector(".htable");
    const read = () => {
      if (area.scrollWidth > area.clientWidth) {
        area.tabIndex = 0;
        area.setAttribute("role", "region");
        area.setAttribute("aria-label", table.getAttribute("aria-label"));
      } else {
        for (const name of ["tabindex", "role", "aria-label"]) area.removeAttribute(name);
      }
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(area);
    observer.observe(table);
  }

  for (const example of document.querySelectorAll("[data-example-table-selection]")) {
    const head = example.querySelector("thead .hcheckbox");
    const boxes = [...example.querySelectorAll("tbody .hcheckbox")];
    const controls = example.querySelector(".htoolbar-controls");
    const idle = controls.firstElementChild;

    const bar = document.createElement("div");
    bar.className = "hselection-bar";
    bar.innerHTML = `
      <span class="hselection-bar-count" role="status"></span>
      <button class="hselection-bar-deselect" type="button">Deselect</button>
      <button class="hbutton" data-variant="secondary" data-size="small" type="button"><span class="hbutton-label">Assign</span></button>`;
    const count = bar.querySelector(".hselection-bar-count");

    const sync = () => {
      const ticked = boxes.filter((box) => box.checked).length;
      head.checked = ticked === boxes.length;
      head.indeterminate = ticked > 0 && ticked < boxes.length;
      count.textContent = `${ticked} selected`;
      const shown = ticked > 0 ? bar : idle;
      if (controls.firstElementChild !== shown) controls.replaceChildren(shown);
    };

    for (const box of boxes) box.addEventListener("change", sync);
    head.addEventListener("change", () => {
      const all = boxes.every((box) => box.checked);
      for (const box of boxes) box.checked = !all;
      sync();
    });
    bar.querySelector(".hselection-bar-deselect").addEventListener("click", () => {
      for (const box of boxes) box.checked = false;
      sync();
      head.focus();
    });
  }

  for (const example of document.querySelectorAll("[data-example-table-columns]")) {
    const table = example.querySelector(".htable");
    const list = example.querySelector(".hlistbox");
    const key = "harmo-example-columns";
    const headers = [...table.tHead.rows[0].cells];
    const options = [...list.querySelectorAll(".hoption")];
    const nameOf = (option) => option.querySelector(".hoption-label").textContent;

    const draw = () => {
      for (const option of options) {
        const column = headers.findIndex((header) => header.textContent === nameOf(option));
        const hidden = option.getAttribute("aria-selected") !== "true";
        headers[column].hidden = hidden;
        for (const row of table.tBodies[0].rows) row.cells[column].hidden = hidden;
      }
    };

    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (Array.isArray(saved)) {
        for (const option of options) {
          option.setAttribute("aria-selected", String(saved.includes(nameOf(option).toLowerCase())));
        }
      }
    } catch {}
    draw();

    list.closest(".hpopup").addEventListener("click", () => {
      draw();
      const chosen = options.filter((option) => option.getAttribute("aria-selected") === "true");
      localStorage.setItem(key, JSON.stringify(chosen.map((option) => nameOf(option).toLowerCase())));
    });
  }

  for (const nav of document.querySelectorAll(".htable-footer .hpagination[data-example-pages]")) {
    const body = nav.closest(".htable-container").querySelector("tbody");
    const statuses = ["Active", "Blocked", "Done"];
    nav.addEventListener("example-page-change", (event) => {
      const { from, to } = event.detail;
      body.replaceChildren(
        ...Array.from({ length: to - from + 1 }, (_, index) => {
          const row = document.createElement("tr");
          const name = document.createElement("th");
          name.scope = "row";
          name.textContent = `Task ${from + index}`;
          const status = document.createElement("td");
          status.textContent = statuses[(from + index) % 3];
          row.append(name, status);
          return row;
        }),
      );
    });
  }

  for (const example of document.querySelectorAll("[data-example-table-open]")) {
    const status = example.querySelector('[role="status"]');
    example.addEventListener("click", (event) => {
      const button = event.target.closest(".htable-row-link");
      if (button) status.textContent = `Opened ${button.textContent}`;
    });
  }
}
