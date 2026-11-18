// Example only: what an app's script does for the Headers pattern, as the
// React pattern does. The rest is the components' scripts': header.js
// follows the scrolling, navigation-menu.js the menus, popup.js the Popups,
// command-menu.js the search, and menu-button.js the site header's Menu
// Button, whose aria-expanded this follows: its panel, aria-controls, has
// data-open while it's open. Escape in either closes it, focus going back to
// the button, as a link in it does; focus moving on past it, as Tab does
// from its last action, closes it, so it never covers what's focused. Mark all as read, marked
// data-example-mark-read, takes the unread mark off each notification, its
// dot, and the bell's count, which its name says too, and goes, with
// nothing left to mark; focus goes to the list's first notification.
{
  for (const button of document.querySelectorAll(".hsite-header-menu")) {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const sync = () => panel.toggleAttribute("data-open", button.getAttribute("aria-expanded") === "true");
    new MutationObserver(sync).observe(button, { attributeFilter: ["aria-expanded"] });
    const close = (focus) => {
      button.setAttribute("aria-expanded", "false");
      if (focus) button.focus();
    };
    for (const element of [button, panel]) {
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || button.getAttribute("aria-expanded") !== "true") return;
        event.preventDefault();
        close(true);
      });
    }
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a")) close(false);
    });
    for (const element of [button, panel]) {
      element.addEventListener("focusout", (event) => {
        const to = event.relatedTarget;
        if (button.getAttribute("aria-expanded") !== "true" || !to || button.contains(to) || panel.contains(to)) return;
        close(false);
      });
    }
  }

  for (const button of document.querySelectorAll("[data-example-mark-read]")) {
    const popup = button.closest(".hpopup");
    const bell = document.querySelector(`[popovertarget="${popup.id}"]`);
    button.addEventListener("click", () => {
      for (const item of popup.querySelectorAll("[data-unread]")) {
        item.removeAttribute("data-unread");
        item.querySelector(".hbadge")?.remove();
      }
      bell.querySelector(".hbadge")?.remove();
      bell.setAttribute("aria-label", "Notifications");
      popup.querySelector(".happ-header-notification")?.focus();
      button.remove();
    });
  }
}
