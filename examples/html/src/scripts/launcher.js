// Example only: what the React Launcher does. The button opens and closes
// its panel with data-open, keeping aria-expanded in step. Opened from the
// button, focus moves to what's marked data-autofocus in the panel, or the
// panel itself; Escape in the panel closes it, and closing it with focus
// inside puts focus back on the button.
//
// The rest is your app's: Close buttons marked data-example-close close
// their panel. With data-example-unread, messages that come while it's
// closed, each an example-unread event with who it's from, add up on a Badge
// on the button, in its name, and in the status; opening it clears them. A
// support chat's script sends them, and here a button marked
// data-example-arrive does.
{
  const later = [
    "It's on its way: the courier picks it up at 2 PM.",
    "You'll get a text with the tracking link once it's out.",
    "Anything else I can help with?",
  ];

  for (const launcher of document.querySelectorAll(".hlauncher")) {
    const panel = launcher.querySelector(":scope > .hlauncher-panel");
    const button = launcher.querySelector(":scope > .hlauncher-button");
    const status = launcher.querySelector(":scope > .hlauncher-status");
    const label = button.getAttribute("aria-label");
    let unread = 0;

    const count = (name) => {
      button.querySelector(":scope > .hbadge")?.remove();
      button.setAttribute("aria-label", unread > 0 ? `${label}, ${unread} new` : label);
      status.textContent = unread === 0 ? "" : unread === 1 ? `New message from ${name}` : `${unread} new messages`;
      if (unread === 0) return;
      // A Badge, as the React Button's badge renders it: settling in as the
      // first arrives, not again as the count goes up.
      const badge = document.createElement("span");
      badge.className = "hbadge";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = unread > 99 ? "99+" : String(unread);
      if (unread === 1) {
        badge.toggleAttribute("data-new", true);
        badge.addEventListener("animationend", () => badge.removeAttribute("data-new"), { once: true });
      }
      button.append(badge);
    };

    const toggle = (open, pressed) => {
      if (open === panel.hasAttribute("data-open")) return;
      const focusedInside = panel.matches(":focus-within");
      panel.toggleAttribute("data-open", open);
      button.setAttribute("aria-expanded", String(open));
      if (open) {
        unread = 0;
        count();
        if (pressed) (panel.querySelector("[data-autofocus]") ?? panel).focus();
      } else if (focusedInside) {
        button.focus();
      }
    };

    button.addEventListener("click", () => toggle(!panel.hasAttribute("data-open"), true));
    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      toggle(false);
    });
    for (const close of panel.querySelectorAll("[data-example-close]")) {
      close.addEventListener("click", () => toggle(false));
    }

    if (!launcher.hasAttribute("data-example-unread")) continue;
    launcher.addEventListener("example-unread", (event) => {
      if (panel.hasAttribute("data-open")) return;
      unread += 1;
      count(event.detail.name);
    });

    const arrive = launcher.parentElement.querySelector("[data-example-arrive]");
    let sent = 0;
    arrive?.addEventListener("click", () => {
      const text = later[sent++];
      if (!text) return;
      arrive.disabled = sent >= later.length;
      const conversation = panel.querySelector(".hconversation");
      conversation.dispatchEvent(new CustomEvent("example-message-add", { detail: { from: "assistant", text, bubble: true } }));
      launcher.dispatchEvent(new CustomEvent("example-unread", { detail: { name: arrive.dataset.exampleName } }));
    });
  }
}
