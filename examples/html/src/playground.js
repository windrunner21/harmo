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
    if (event.target.closest?.(".play-demo a[href]")) event.preventDefault();
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
