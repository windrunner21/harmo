// Example only: a click moves the page, as your app or its router would,
// rather than leave the playground; a click on a link with a modifier key is
// the browser's. A disabled Previous or Next ignores every click, as a
// Button's script does. Your app renders the page you're on, with the numbers the React
// Pagination works out: the first and last pages, and the one you're on with
// one either side.
{
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const items = (page, count) => {
    if (count <= 7) return range(1, count);
    if (page <= 4) return [...range(1, 5), "gap", count];
    if (page >= count - 3) return [1, "gap", ...range(count - 4, count)];
    return [1, "gap", page - 1, page, page + 1, "gap", count];
  };

  for (const nav of document.querySelectorAll(".hpagination[data-example-pages]")) {
    let page = Number(nav.dataset.examplePage);
    let count = Number(nav.dataset.examplePages);
    const [previous, next] = nav.querySelectorAll(":scope > .hbutton");
    const list = nav.querySelector(".hpagination-pages");
    const label = nav.dataset.examplePageLabel ?? "Page {page}";
    const status = nav.parentElement.querySelector('[role="status"]');
    const range = nav.parentElement.parentElement.querySelector("[data-example-range]");
    const total = Number(nav.dataset.exampleTotal);
    const rows = document.getElementById(nav.dataset.exampleRows);
    const perPage = () => Number(rows.querySelector('.hoption[aria-selected="true"]').textContent);
    const href = (to) => `?page=${to}`;

    // On the first or last page, Previous or Next is disabled and links to
    // the page you're on.
    const step = (button, to, rel) => {
      const blocked = to < 1 || to > count;
      if (blocked) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
      if (button.localName !== "a") return;
      button.setAttribute("href", href(blocked ? page : to));
      if (blocked) button.removeAttribute("rel");
      else button.setAttribute("rel", rel);
    };

    const render = () => {
      step(previous, page - 1, "prev");
      step(next, page + 1, "next");
      if (status && nav.dataset.examplePageOf) {
        status.textContent = nav.dataset.examplePageOf.replace("{page}", page).replace("{count}", count);
      }
      if (range) {
        const from = (page - 1) * perPage() + 1;
        const to = Math.min(page * perPage(), total);
        range.textContent = range.dataset.exampleRange.replace("{from}", from).replace("{to}", to).replace("{total}", total);
      }
      if (!list) return;

      // Focus stays on the number you chose, now the page you're on.
      const focused = list.contains(document.activeElement);
      const tag = list.querySelector(".hpagination-page").localName;
      list.replaceChildren(
        ...items(page, count).map((item) => {
          const li = document.createElement("li");
          if (item === "gap") {
            li.className = "hpagination-ellipsis";
            li.setAttribute("aria-hidden", "true");
            li.textContent = "…";
            return li;
          }
          const link = document.createElement(tag);
          link.className = "hpagination-page";
          if (tag === "a") link.setAttribute("href", href(item));
          else link.type = "button";
          link.setAttribute("aria-label", label.replace("{page}", item));
          if (item === page) link.setAttribute("aria-current", "page");
          link.textContent = item;
          li.append(link);
          return li;
        }),
      );
      if (focused) list.querySelector('[aria-current="page"]').focus();
    };

    nav.addEventListener("click", (event) => {
      const target = event.target.closest(".hbutton, .hpagination-page");
      if (!target) return;
      if (target.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }
      if (target.localName === "a" && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      event.preventDefault();
      const to = target === previous ? page - 1 : target === next ? page + 1 : Number(target.textContent);
      if (to === page) return;
      page = to;
      render();
    });

    // More rows to a page make fewer pages, and start again from the first.
    if (rows) {
      new MutationObserver(() => {
        count = Math.ceil(total / perPage());
        page = 1;
        render();
      }).observe(rows, { subtree: true, attributeFilter: ["aria-selected"] });
    }
  }
}
