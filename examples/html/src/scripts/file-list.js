// Example only: what your app does around a File List, and what the React one
// does as files come and go. Removing a file fades it and closes its row, moving
// focus to the next; in a grid the others slide into its place. New files from a
// File Input get a row. Nothing is sent anywhere, so the progress is pretended.
{
  const svg = (attributes, paths) =>
    `<svg ${attributes} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  const fileIcon = svg(
    'class="hicon" stroke-width="1.5"',
    '<path d="M6.5 2.75H13.5L19.25 8.5V20C19.25 20.69 18.69 21.25 18 21.25H6.5C5.81 21.25 5.25 20.69 5.25 20V4C5.25 3.31 5.81 2.75 6.5 2.75Z" /><path d="M13.5 2.75V8.5H19.25" />',
  );
  const doneIcon = svg('class="hicon hfile-list-done" stroke-width="2"', '<path d="M5 12.5L10 17.5L19 7.5" pathLength="1" />');
  const removeIcon =
    '<svg class="hicon" width="24" height="24" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18.1183 18.5318L6.80463 7.21814" /><path d="M18.1183 7.21814L6.80463 18.5318" /></svg>';

  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const token = (node, name) => getComputedStyle(node).getPropertyValue(name).trim();
  const milliseconds = (value, fallback) => {
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return fallback;
    return value.endsWith("ms") ? number : number * 1000;
  };
  const size = new Intl.NumberFormat("en", { style: "unit", unit: "kilobyte", maximumFractionDigits: 0 });
  let made = 0;

  // Where a tile is now, partway through a slide included.
  const placeOf = (tile) => {
    const moved = getComputedStyle(tile).translate;
    const [x = 0, y = 0] = moved === "none" ? [] : moved.split(" ").map(parseFloat);
    return [tile.offsetLeft + x, tile.offsetTop + y];
  };

  const animateOut = (row, grid) => {
    const style = getComputedStyle(row);
    const from = { opacity: style.opacity };
    const to = { opacity: 0 };
    if (!still() && grid) {
      from.transform = style.transform;
      to.transform = "scale(0.96)";
    }
    if (!still() && !grid && row.localName === "li") {
      from.blockSize = `${row.offsetHeight}px`;
      to.blockSize = "0px";
      for (const side of ["paddingBlockStart", "paddingBlockEnd", "borderBlockStartWidth", "borderBlockEndWidth"]) {
        from[side] = style[side];
        to[side] = "0px";
      }
      const gap = parseFloat(getComputedStyle(row.parentElement).rowGap) || 0;
      const margin = row.nextElementSibling ? "marginBlockEnd" : row.previousElementSibling ? "marginBlockStart" : null;
      if (margin) {
        from[margin] = "0px";
        to[margin] = `${-gap}px`;
      }
    }
    return row.animate([from, to], {
      duration: milliseconds(token(row, "--harmo-duration-fast"), 150),
      easing: token(row, "--harmo-ease-out-cubic") || "ease-out",
      fill: "forwards",
    });
  };

  for (const host of document.querySelectorAll("[data-example-files]")) {
    const list = host.matches(".hfile-list") ? host : host.querySelector(".hfile-list");
    const body = host.querySelector("tbody");
    const parent = list ?? body;
    const grid = list?.dataset.layout === "grid";
    const heading = host.querySelector("[data-example-count]");
    const sample = body?.firstElementChild.cloneNode(true);
    const { exampleRetryDetail, exampleSimulate, examplePreview } = host.dataset;

    const rows = () => [...parent.children].filter((row) => !row.hasAttribute("data-leaving"));
    const count = () => {
      if (heading) heading.textContent = heading.dataset.exampleCount.replace("{n}", rows().length);
    };

    // The pictures and links a file made are released with it.
    const release = (row) => {
      for (const node of row.querySelectorAll('img[src^="blob:"], a[href^="blob:"]')) URL.revokeObjectURL(node.src ?? node.href);
    };

    const remove = (row) => {
      row.dataset.leaving = "";
      if (row.contains(document.activeElement)) moveFocusFrom(row);
      row.inert = true;
      count();
      release(row);
      animateOut(row, grid).finished.then(
        () => {
          const before = new Map([...parent.children].map((tile) => [tile, placeOf(tile)]));
          row.remove();
          if (!grid || still()) return;
          for (const tile of parent.children) {
            for (const slide of tile.getAnimations()) if (slide.id === "hfile-list-slide") slide.cancel();
            const [left, top] = before.get(tile);
            if (left === tile.offsetLeft && top === tile.offsetTop) continue;
            tile.animate([{ translate: `${left - tile.offsetLeft}px ${top - tile.offsetTop}px` }, { translate: "0 0" }], {
              id: "hfile-list-slide",
              duration: milliseconds(token(tile, "--harmo-duration-normal"), 200),
              easing: token(tile, "--harmo-ease-in-out-cubic") || "ease-in-out",
            });
          }
        },
        () => {},
      );
    };

    const moveFocusFrom = (row) => {
      const others = rows().filter((other) => other !== row);
      const next = others.find((other) => row.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) ?? others.at(-1);
      (next?.querySelector(".hfile-list-remove") ?? parent).focus();
    };

    const finish = (row) => {
      row.dataset.status = "done";
      if (!row.querySelector(".hfile-list-done")) row.querySelector(".hfile-list-actions").insertAdjacentHTML("afterbegin", doneIcon);
    };

    const setProgress = (row, value) => {
      const bar = row.querySelector(".hfile-list-progress");
      bar.style.setProperty("--hfile-list-progress", value / 100);
      bar.setAttribute("aria-valuenow", value);
      if (value >= 100) finish(row);
    };

    const progressBar = (row) => {
      const bar = document.createElement("div");
      bar.className = "hfile-list-progress";
      bar.role = "progressbar";
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-labelledby", row.querySelector(".hfile-list-name").id);
      row.append(bar);
    };

    const upload = (row) => {
      row.dataset.status = "uploading";
      progressBar(row);
      setProgress(row, 0);
      let value = 0;
      const timer = setInterval(() => {
        if (!row.isConnected) {
          clearInterval(timer);
          return;
        }
        value = Math.min(100, value + 20);
        setProgress(row, value);
        if (value === 100) clearInterval(timer);
      }, 300);
    };

    const listRow = (file) => {
      const row = document.createElement("li");
      made += 1;
      row.className = "hfile-list-item";
      row.dataset.new = "";
      row.innerHTML = `<span class="hfile-list-thumb"></span><div class="hfile-list-text"><span class="hfile-list-name" id="example-file-${made}"></span><span class="hfile-list-detail"></span></div><div class="hfile-list-actions"><button class="hbutton hfile-list-remove" data-variant="tertiary" type="button">${removeIcon}</button></div>`;
      const name = row.querySelector(".hfile-list-name");
      name.textContent = file.name;
      name.title = file.name;
      row.querySelector(".hfile-list-detail").textContent = size.format(file.size / 1000);
      row.querySelector(".hfile-list-remove").setAttribute("aria-label", `Remove ${file.name}`);
      const thumb = row.querySelector(".hfile-list-thumb");
      if (examplePreview === undefined) {
        thumb.innerHTML = fileIcon;
      } else {
        const picture = document.createElement("img");
        picture.alt = "";
        picture.src = URL.createObjectURL(file);
        thumb.append(picture);
      }
      return row;
    };

    const tableRow = (file) => {
      const row = sample.cloneNode(true);
      const name = row.querySelector("[data-example-name]");
      name.textContent = file.name;
      name.title = file.name;
      row.querySelector("[data-example-type]").textContent = file.name.split(".").pop().toUpperCase();
      row.querySelector("[data-example-size]").textContent = size.format(file.size / 1000);
      const link = row.querySelector("[data-example-download]");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.setAttribute("aria-label", `Download ${file.name}`);
      row.querySelector("[data-example-remove]").setAttribute("aria-label", `Remove ${file.name}`);
      return row;
    };

    host.addEventListener("example-files-add", (event) => {
      for (const file of event.detail) {
        const row = body ? tableRow(file) : listRow(file);
        parent.append(row);
        if (exampleSimulate !== undefined) upload(row);
      }
      count();
    });

    parent.addEventListener("click", (event) => {
      const removing = event.target.closest(".hfile-list-remove, [data-example-remove]");
      const row = event.target.closest("li, tr");
      if (removing) {
        remove(row);
        return;
      }
      const retry = event.target.closest(".hfile-list-actions .hbutton");
      if (!retry) return;
      const focused = document.activeElement === retry;
      row.querySelector(".hfile-list-error").outerHTML = `<span class="hfile-list-detail">${exampleRetryDetail}</span>`;
      retry.remove();
      progressBar(row);
      setProgress(row, 100);
      if (focused) row.querySelector(".hfile-list-remove")?.focus();
    });

    host.querySelector("[data-example-files-clear]")?.addEventListener("click", () => rows().forEach(remove));
  }
}
