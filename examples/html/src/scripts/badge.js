// Example only: what your app does as a count changes, here a button's that
// adds a message to another's. The count's badge is added, with data-new, so
// it settles in, the first time, and its number changes after; the button
// it's on says the count in its name, as the badge is hidden from screen
// readers.
{
  for (const trigger of document.querySelectorAll("[data-example-badge-add]")) {
    const button = trigger.parentElement.querySelector("[data-example-badge-count]");
    const name = button.getAttribute("aria-label");
    let count = 0;
    trigger.addEventListener("click", () => {
      count += 1;
      let badge = button.querySelector(":scope > .hbadge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "hbadge";
        badge.dataset.new = "";
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
      button.setAttribute("aria-label", `${name}, ${count} unread`);
    });
  }
}
