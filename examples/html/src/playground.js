// The playground's own behavior; not part of Harmo. Scripts that stand in
// for Harmo's React components live in scripts/.
// Each script is a block, so its names stay out of the other scripts' way.
{
  // Copy an example's markup. Without clipboard access, select it instead so
  // it can be copied by hand.
  for (const button of document.querySelectorAll("[data-play-copy]")) {
    const code = button.parentElement.querySelector("code");
    const label = button.querySelector(".hbutton-label");
    let timer;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        label.textContent = "Copied";
        clearTimeout(timer);
        timer = setTimeout(() => (label.textContent = "Copy"), 1500);
      } catch {
        getSelection().selectAllChildren(code);
      }
    });
  }

  // A pattern's tables of text scroll where they're too wide for the page;
  // while one does, its scroll area is a named region that takes focus, so a
  // keyboard can scroll it, as Table asks.
  for (const scroll of document.querySelectorAll(".play-guide-table > .htable-scroll")) {
    const table = scroll.querySelector(":scope > .htable");
    const label = table.getAttribute("aria-labelledby");
    const update = () => {
      if (scroll.scrollWidth > scroll.clientWidth + 1) {
        scroll.tabIndex = 0;
        scroll.setAttribute("role", "region");
        scroll.setAttribute("aria-labelledby", label);
      } else {
        scroll.removeAttribute("tabindex");
        scroll.removeAttribute("role");
        scroll.removeAttribute("aria-labelledby");
      }
    };
    // The table too, which grows inside the scroll area without resizing it.
    const observer = new ResizeObserver(update);
    observer.observe(scroll);
    observer.observe(table);
  }

  // Replay an example by putting fresh copies of its elements in place, which
  // restarts their animations. Copies lose listeners that example scripts
  // added, so replay suits examples that only CSS animates.
  for (const button of document.querySelectorAll("[data-play-replay]")) {
    const demo = button.parentElement.querySelector(".play-demo");
    button.addEventListener("click", () => {
      demo.replaceChildren(...[...demo.childNodes].map((node) => node.cloneNode(true)));
    });
  }

  // Example links point at application routes such as /reports, so following
  // them would only leave the playground.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.(".play-demo a[href]");
    if (!link) return;
    // A link that opens a new tab doesn't leave the playground.
    if (link.target === "_blank") return;
    // A link to a dialog that an example's script opens is that script's.
    const named = new URL(link.href).searchParams.get("dialog");
    if (named && document.getElementById(named)?.hasAttribute("data-example-url-dialog")) return;
    // A link to something on this page goes there.
    const target = link.getAttribute("href");
    if (target.startsWith("#") && document.getElementById(decodeURIComponent(target.slice(1)))) return;
    event.preventDefault();
  });

  // On narrow screens the nav is a popover: close it once a link is chosen,
  // and when the window widens into the sidebar layout.
  const nav = document.getElementById("play-nav");
  const isOpen = () => nav.matches(":popover-open");
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a") && isOpen()) nav.hidePopover();
  });
  matchMedia("(width >= 60rem)").addEventListener("change", (event) => {
    if (event.matches && isOpen()) nav.hidePopover();
  });

  // Light or dark for the whole playground, remembered for the next page.
  // Harmo itself only follows color-scheme; the head of each page sets it.
  const dark = document.getElementById("play-dark");
  dark.addEventListener("change", () => {
    const scheme = dark.checked ? "dark" : "light";
    document.documentElement.style.colorScheme = scheme;
    try {
      localStorage.setItem("harmo-playground-color-scheme", scheme);
    } catch {}
  });

  // With ?events in the address, a panel lists what a hold button receives,
  // newest first: each event, its pointer type, a click's detail, where it
  // landed from the button's center, and the hold's own states. It's for
  // finding out on a phone, which has no developer tools, what a screen
  // reader sends when it activates one.
  if (new URLSearchParams(location.search).has("events")) {
    const log = document.createElement("ol");
    log.className = "play-events";
    document.body.append(log);
    let last;
    const note = (text, at) => {
      const item = document.createElement("li");
      item.textContent = `${last === undefined ? "" : `+${Math.round(at - last)}ms `}${text}`;
      last = at;
      log.prepend(item);
    };
    const types = ["pointerdown", "pointerup", "pointercancel", "pointerleave", "touchstart", "touchend", "mousedown", "mouseup", "keydown", "keyup", "click", "contextmenu"];
    for (const type of types) {
      document.addEventListener(
        type,
        (event) => {
          const button = event.target.closest?.(".hbutton[data-hold]");
          if (!button) return;
          const parts = [type];
          if (event.pointerType !== undefined) parts.push(event.pointerType || "no pointer type");
          if (type === "click") parts.push(`detail ${event.detail}`);
          if (event.key !== undefined) parts.push(event.key);
          if (event.clientX !== undefined && !(type === "click" && event.detail === 0)) {
            const box = button.getBoundingClientRect();
            parts.push(`${Math.round(event.clientX - box.left - box.width / 2)}, ${Math.round(event.clientY - box.top - box.height / 2)} from center`);
          }
          note(parts.join(" · "), event.timeStamp);
        },
        true,
      );
    }
    new MutationObserver((records) => {
      for (const { target, attributeName } of records) {
        if (!target.matches(".hbutton[data-hold]")) continue;
        note(`${target.hasAttribute(attributeName) ? "+" : "−"} ${attributeName}`, performance.now());
      }
    }).observe(document.body, { subtree: true, attributeFilter: ["data-holding", "data-held", "aria-busy"] });
  }

  // The Accent picker in the HTML playground, a Select like any other: once
  // an accent is chosen, set it on the page and remember it. The React
  // playground's picker does the same in AccentPicker.tsx.
  const accents = document.getElementById("play-accent-listbox");
  if (accents) {
    new MutationObserver(() => {
      const accent = accents.querySelector('.hoption[aria-selected="true"]')?.dataset.value;
      if (!accent) return;
      if (accent === "purple") delete document.documentElement.dataset.harmoAccent;
      else document.documentElement.dataset.harmoAccent = accent;
      try {
        localStorage.setItem("harmo-playground-accent", accent);
      } catch {}
    }).observe(accents, { subtree: true, attributeFilter: ["aria-selected"] });
  }
}
