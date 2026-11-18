// Example only: what the React Input and TextArea do with highlight. Marks what
// matches in the text drawn over the field, and keeps that text lined up with
// the field: its size, type, and padding, with room for a scrollbar, and its
// scrolling. Only for a field that shows its text, so never a password. The
// pattern is the backdrop's data-example-pattern, with data-example-flags, such
// as "i" to match any case, read each time it draws. A script that sets the
// field's text sends it an example-redraw event.
{
  const copied = [
    "boxSizing", "width", "height", "paddingTop", "borderTopWidth", "borderRightWidth",
    "borderBottomWidth", "borderLeftWidth", "direction", "unicodeBidi", "fontFamily",
    "fontFeatureSettings", "fontKerning", "fontSize", "fontStretch", "fontStyle", "fontVariant",
    "fontVariationSettings", "fontWeight", "letterSpacing", "lineHeight", "overflowWrap", "tabSize",
    "textAlign", "textIndent", "textTransform", "wordBreak", "wordSpacing",
  ];
  const scrollbar = (space) => Math.max(0, Math.round(space));

  for (const backdrop of document.querySelectorAll("[data-example-pattern]")) {
    const field = backdrop.previousElementSibling;
    if (!["text", "textarea", "email", "tel", "url"].includes(field.type)) continue;
    const text = backdrop.firstElementChild;
    const textarea = field.localName === "textarea";
    const scroller = textarea ? backdrop : text;
    // Read as it draws, so a script can change it, as Mentions' does as its
    // lists change; "g" once, whatever the flags.
    const patternNow = () =>
      new RegExp(backdrop.dataset.examplePattern, [...new Set(`g${backdrop.dataset.exampleFlags ?? ""}`)].join(""));

    const follow = () => {
      scroller.scrollLeft = field.scrollLeft;
      scroller.scrollTop = field.scrollTop;
    };

    const match = () => {
      const style = getComputedStyle(field);
      for (const name of copied) backdrop.style[name] = style[name];
      backdrop.style.whiteSpace = field.getAttribute("wrap")?.toLowerCase() === "off" ? "pre" : style.whiteSpace;
      backdrop.style.inset = `${field.offsetTop}px auto auto ${field.offsetLeft}px`;
      // Only a textarea has scrollbars, and Firefox counts an input's padding in
      // clientLeft.
      const start = textarea ? field.clientLeft - parseFloat(style.borderLeftWidth) : 0;
      const end = textarea ? field.offsetWidth - field.clientWidth - field.clientLeft - parseFloat(style.borderRightWidth) : 0;
      const below = textarea ? field.offsetHeight - field.clientHeight - field.clientTop - parseFloat(style.borderBottomWidth) : 0;
      backdrop.style.paddingLeft = `${parseFloat(style.paddingLeft) + scrollbar(start)}px`;
      backdrop.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar(end)}px`;
      backdrop.style.paddingBottom = `${parseFloat(style.paddingBottom) + scrollbar(below)}px`;
      follow();
    };

    const draw = () => {
      const { value } = field;
      const parts = [];
      let end = 0;
      for (const found of value.matchAll(patternNow())) {
        if (!found[0]) continue;
        if (found.index > end) parts.push(value.slice(end, found.index));
        const mark = document.createElement("mark");
        mark.textContent = found[0];
        parts.push(mark);
        end = found.index + found[0].length;
      }
      const ending = textarea ? "\n" : "";
      if (end < value.length || ending) parts.push(value.slice(end) + ending);
      text.replaceChildren(...parts);
      match();
    };

    field.addEventListener("input", draw);
    // A script that sets the field's text itself, such as a chat clearing
    // it once a message is sent, asks for it to be drawn again.
    field.addEventListener("example-redraw", draw);
    field.addEventListener("scroll", follow);
    new ResizeObserver(match).observe(field);
    // The form it belongs to when it resets, even one it joined later.
    document.addEventListener(
      "reset",
      (event) => {
        if (event.target === field.form) setTimeout(draw);
      },
      true,
    );
    draw();
  }
}
