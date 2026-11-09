// Example only: a click moves which filter is in force, as your app or its
// router would, rather than leave the playground.
{
  for (const bar of document.querySelectorAll(".hfilter-bar")) {
    bar.addEventListener("click", (event) => {
      const item = event.target.closest(".hfilter-bar-item");
      if (!item) return;
      for (const each of bar.querySelectorAll(".hfilter-bar-item")) {
        if (each.localName === "a") {
          if (each === item) each.setAttribute("aria-current", "true");
          else each.removeAttribute("aria-current");
        } else {
          each.setAttribute("aria-pressed", String(each === item));
        }
      }
    });
  }
}
