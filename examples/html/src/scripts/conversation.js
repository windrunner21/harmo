// Example only: what the React Conversation does. It starts at the latest
// and stays there as messages are added, change, or grow, unless you've
// scrolled more than 32px up; then Jump to latest shows, with data-open, and scrolls back
// down, smoothly unless motion is reduced. A message of yours being added
// brings it back to the latest, however far up you were.
//
// What your app adds comes here as an example-message-add event, with the
// message's author, its text, the rows of a File List to move into it, and
// whether it's in a bubble, as composer.js and launcher.js send; a reply
// fades in with data-new. Jump to latest sends example-jump, so the Composer
// beside it can take focus.
{
  for (const conversation of document.querySelectorAll(".hconversation")) {
    const list = conversation.querySelector(".hconversation-list");
    const latest = conversation.querySelector(".hconversation-latest");
    let atEnd = true;
    // Jumping to the latest follows it to its end, though a reply grows on
    // the way, unless you scroll yourself meanwhile.
    let jumping = false;
    const motion = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");
    const follow = () => {
      if (!atEnd) return;
      if (jumping) conversation.scrollTo({ top: conversation.scrollHeight, behavior: motion() });
      else conversation.scrollTop = conversation.scrollHeight;
    };
    const away = (value) => latest.toggleAttribute("data-open", value);

    conversation.addEventListener("scroll", () => {
      const near = conversation.scrollHeight - conversation.scrollTop - conversation.clientHeight < 32;
      if (jumping) {
        if (near) jumping = false;
        return;
      }
      atEnd = near;
      away(!atEnd);
    });
    for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      conversation.addEventListener(
        type,
        (event) => {
          if (!event.target.closest(".hconversation-latest")) jumping = false;
        },
        { passive: true },
      );
    }
    const resizes = new ResizeObserver(follow);
    resizes.observe(conversation);
    resizes.observe(list);
    // Each change to the messages, a reply's words as they stream in too, as
    // it happens, so it's at the latest before it's next scrolled.
    new MutationObserver((records) => {
      const sent = records.some(
        (record) =>
          record.target === list &&
          [...record.addedNodes].some((node) => node instanceof Element && node.matches('.hmessage[data-from="user"]')),
      );
      if (sent) {
        atEnd = true;
        away(false);
      }
      follow();
    }).observe(list, { childList: true, subtree: true, characterData: true });
    latest.querySelector(".hbutton").addEventListener("click", () => {
      jumping = true;
      atEnd = true;
      away(false);
      conversation.scrollTo({ top: conversation.scrollHeight, behavior: motion() });
      conversation.dispatchEvent(new CustomEvent("example-jump"));
    });
    follow();
    conversation.addEventListener("example-message-add", (event) => {
      const { from, text, files, bubble } = event.detail;
      conversation.querySelector(".hconversation-empty")?.remove();
      list.hidden = false;
      list.append(messageOf(from, text, files, bubble));
    });
  }

  const messageOf = (from, text, files = [], bubble = false) => {
    const item = document.createElement("li");
    item.className = "hmessage";
    item.dataset.from = from;
    item.toggleAttribute("data-bubble", bubble);
    const body = document.createElement("div");
    body.className = "hmessage-body";
    if (files.length > 0) {
      // Sent, they're only listed: nothing to press.
      const list = document.createElement("ul");
      list.className = "hfile-list";
      list.setAttribute("role", "list");
      list.setAttribute("aria-label", "Attachments");
      list.tabIndex = -1;
      for (const row of files) row.querySelector(".hfile-list-actions")?.replaceChildren();
      list.append(...files);
      body.append(list);
    }
    if (text) {
      const content = document.createElement("div");
      content.className = "hmessage-text";
      content.textContent = text;
      body.append(content);
    }
    item.append(body);
    if (from !== "user") {
      item.toggleAttribute("data-new", true);
      item.addEventListener("animationend", (event) => {
        if (event.target === item) item.removeAttribute("data-new");
      });
    }
    return item;
  };
}
