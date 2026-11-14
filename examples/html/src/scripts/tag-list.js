// Example only: what the React TagList does. It counts the tags that fit the
// list's width, hides the rest, and shows "+N" for them, with copies of the
// hidden tags in its tooltip; again whenever the list, its container, or a
// tag changes size, or tags come, go, or change. While "+N" has focus, it
// stays, however wide the list grows, and the tags are counted again once
// focus leaves it. While focus is in a Combobox around it, every tag shows,
// in a row that scrolls, kept at its end as tags are added. A press on "+N"
// pins its tooltip open, for a touch screen.
{
  // How many tags fit, with room for "+N" when some don't, or while it's
  // kept: each is shown to be measured, then put back as it was, so nothing
  // paints in between. From the most tags that leave any room, one fewer at a
  // time, "+N" is measured with its text for the rest, until it fits beside
  // them: a smaller count can be wider, as "one other" is beside "4 others".
  const countFitting = (list, items, more, keepMore, textFor) => {
    const before = items.map((item) => item.hidden);
    const moreBefore = more.hidden;
    for (const item of items) item.hidden = false;
    more.hidden = true;

    const available = list.clientWidth + 0.5;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const widths = items.map((item) => item.getBoundingClientRect().width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(items.length - 1, 0);

    let count = items.length;
    if (keepMore || total > available) {
      // Measured in place, so the list's own children don't change and its
      // MutationObserver stays quiet.
      const button = more.querySelector(".htag-list-count");
      const text = button.textContent;
      more.hidden = false;
      // Where "+N" starts after each number of tags.
      const starts = [0];
      for (const width of widths) starts.push(starts.at(-1) + width + gap);
      count = 0;
      while (count < items.length - 1 && starts[count + 1] <= available) count++;
      while (count > 0) {
        button.textContent = textFor(items.length - count);
        if (starts[count] + more.getBoundingClientRect().width <= available) break;
        count--;
      }
      button.textContent = text;
    }

    items.forEach((item, index) => (item.hidden = before[index]));
    more.hidden = moreBefore;
    return Math.max(count, 0);
  };

  const toEnd = (list) => {
    const rtl = getComputedStyle(list).direction === "rtl";
    list.scrollTo({ left: rtl ? -list.scrollWidth : list.scrollWidth });
  };

  // A copy to look at, in the tooltip: without remove buttons, as a tooltip
  // holds nothing to press, and without ids, which would be on the page
  // twice.
  const copyOf = (item) => {
    const tag = item.firstElementChild.cloneNode(true);
    for (const remove of tag.querySelectorAll(".htag-remove")) remove.remove();
    for (const element of [tag, ...tag.querySelectorAll("[id]")]) element.removeAttribute("id");
    return tag;
  };

  for (const list of document.querySelectorAll(".htag-list")) {
    const more = list.querySelector(":scope > .htag-list-more");
    if (!more) continue;
    const button = more.querySelector(".htag-list-count");
    const rest = more.querySelector(".htag-list-rest");
    // The app's text for "+N" and its name, such as "+2" and "2 more", in
    // its language, with the count in the language's digits, and in the
    // form the language uses for it, such as data-example-more-text-one for
    // one.
    const lang = list.closest("[lang]")?.lang || undefined;
    const plural = new Intl.PluralRules(lang);
    const write = (hook, count) => {
      const form = plural.select(count);
      const template = list.dataset[hook + form[0].toUpperCase() + form.slice(1)] ?? list.dataset[hook] ?? "+{count}";
      return template.replace("{count}", count.toLocaleString(lang));
    };
    const text = (count) => write("exampleMoreText", count);
    const label = (count) => write("exampleMoreLabel", count);
    const field = list.closest(".hcombobox");
    const items = () => [...list.children].filter((item) => item !== more);
    let editing = false;
    let holding = false;
    let length = items().length;

    const update = () => {
      const all = items();
      const nowEditing = field?.matches(":focus-within") ?? false;
      const keepMore = holding && more.contains(document.activeElement);
      const count = nowEditing ? all.length : countFitting(list, all, more, keepMore, text);
      all.forEach((item, index) => (item.hidden = index >= count));
      const hidden = all.slice(count);
      more.hidden = hidden.length === 0;
      button.textContent = hidden.length ? text(hidden.length) : "";
      if (hidden.length) button.setAttribute("aria-label", label(hidden.length));
      else button.removeAttribute("aria-label");
      // Read as a description, with a space between tags.
      rest.replaceChildren(...hidden.flatMap((item, index) => (index ? [" ", copyOf(item)] : [copyOf(item)])));
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
    // Changes in "+N" are this script's own, so they're left alone, and so
    // is `hidden` on a tag's <li>, which it sets. A tag whose color or
    // variant changes is copied into the tooltip again.
    new MutationObserver((records) => {
      if (records.every((record) => more.contains(record.target))) return;
      watch();
      update();
    }).observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-variant"],
    });
    field?.addEventListener("focusin", update);
    field?.addEventListener("focusout", update);
    // "+N" is kept while it has focus, and the tags counted again once focus
    // leaves it.
    more.addEventListener("focusin", () => (holding = true));
    more.addEventListener("focusout", (event) => {
      if (more.contains(event.relatedTarget)) return;
      holding = false;
      update();
    });
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
