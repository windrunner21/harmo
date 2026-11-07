// Example only: what the React TagList does. It counts the tags that fit the
// list's width, hides the rest, and shows "+N" for them, with the hidden
// tags in its tooltip; again whenever the list, its container, or a tag
// changes size, or tags come, go, or change. While focus is in a Combobox
// around it, every tag shows, in a row that scrolls, kept at its end as tags
// are added. A press on "+N" pins its tooltip open, for a touch screen.
{
  // How many tags fit, with room for "+N" when some don't: each is shown to
  // be measured, then put back as it was, so nothing paints in between. "+N"
  // is measured with the most digits it could show.
  const countFitting = (list, items, more) => {
    const before = items.map((item) => item.hidden);
    const moreBefore = more.hidden;
    for (const item of items) item.hidden = false;
    more.hidden = true;

    const available = list.clientWidth;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const widths = items.map((item) => item.getBoundingClientRect().width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(items.length - 1, 0);

    let count = items.length;
    if (total > available + 0.5) {
      // Measured in place, so the list's own children don't change and its
      // MutationObserver stays quiet.
      const button = more.querySelector(".htag-list-count");
      const text = button.textContent;
      button.textContent = `+${items.length}`;
      more.hidden = false;
      let used = more.getBoundingClientRect().width;
      button.textContent = text;
      count = 0;
      while (count < items.length && used + gap + widths[count] <= available + 0.5) {
        used += gap + widths[count];
        count++;
      }
    }

    items.forEach((item, index) => (item.hidden = before[index]));
    more.hidden = moreBefore;
    return count;
  };

  const toEnd = (list) => {
    const rtl = getComputedStyle(list).direction === "rtl";
    list.scrollTo({ left: rtl ? -list.scrollWidth : list.scrollWidth });
  };

  for (const list of document.querySelectorAll(".htag-list")) {
    const more = list.querySelector(":scope > .htag-list-more");
    if (!more) continue;
    const button = more.querySelector(".htag-list-count");
    const rest = more.querySelector(".htag-list-rest");
    // The app's name for "+N", such as "3 more", in its language.
    const label = list.dataset.exampleMoreLabel ?? "+{count}";
    const field = list.closest(".hcombobox");
    const items = () => [...list.children].filter((item) => item !== more);
    let editing = false;
    let length = items().length;

    const update = () => {
      const all = items();
      const nowEditing = field?.matches(":focus-within") ?? false;
      const count = nowEditing ? all.length : countFitting(list, all, more);
      all.forEach((item, index) => (item.hidden = index >= count));
      const hidden = all.slice(count);
      more.hidden = hidden.length === 0;
      button.textContent = hidden.length ? `+${hidden.length}` : "";
      if (hidden.length) button.setAttribute("aria-label", label.replace("{count}", hidden.length));
      else button.removeAttribute("aria-label");
      // Read as a description, with a space between tags.
      rest.replaceChildren(...hidden.flatMap((item, index) => (index ? [" ", item.firstElementChild.cloneNode(true)] : [item.firstElementChild.cloneNode(true)])));
      if (nowEditing && (!editing || all.length > length)) toEnd(list);
      editing = nowEditing;
      length = all.length;
    };

    // The container too, for a list that doesn't grow with it, as beside a
    // Combobox's text.
    const resized = new ResizeObserver(update);
    const watch = () => {
      resized.observe(list);
      if (list.parentElement) resized.observe(list.parentElement);
      for (const item of items()) resized.observe(item);
    };
    // Changes in "+N" are this script's own, so they're left alone.
    new MutationObserver((records) => {
      if (records.every((record) => more.contains(record.target))) return;
      watch();
      update();
    }).observe(list, { childList: true, subtree: true, characterData: true });
    field?.addEventListener("focusin", update);
    field?.addEventListener("focusout", update);
    // Focus on a tag's button, in a row that scrolls, brings the whole tag
    // into view, not only the button.
    list.addEventListener("focusin", (event) => {
      event.target.closest(".htag-list > li")?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    watch();
    update();

    // A press pins the tooltip open, as a touch screen neither hovers nor
    // shows keyboard focus, until a press again, a press elsewhere, Escape,
    // or focus leaving. In a Combobox, a press goes to its field instead.
    const trigger = more.querySelector(".htooltip-trigger");
    if (!field && trigger) {
      const unpin = () => trigger.removeAttribute("data-open");
      button.addEventListener("click", () => trigger.toggleAttribute("data-open"));
      trigger.addEventListener("focusout", unpin);
      addEventListener("pointerdown", (event) => {
        if (!trigger.contains(event.target)) unpin();
      });
      addEventListener("keydown", (event) => {
        if (event.key === "Escape") unpin();
      });
    }
  }
}
