// Example only: what the React Input and TextArea do with highlight. Marks what
// matches in the text drawn over the field, and keeps that text lined up with
// the field: its size, type, and padding, with room for a scrollbar, and its
// scrolling. Only for a field that shows its text, so never a password.
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
    const pattern = new RegExp(backdrop.dataset.examplePattern, "g");

    const follow = () => {
      scroller.scrollLeft = field.scrollLeft;
      scroller.scrollTop = field.scrollTop;
    };

    const match = () => {
      const style = getComputedStyle(field);
      for (const name of copied) backdrop.style[name] = style[name];
      backdrop.style.whiteSpace = field.getAttribute("wrap")?.toLowerCase() === "off" ? "pre" : style.whiteSpace;
      backdrop.style.inset = `${field.offsetTop}px auto auto ${field.offsetLeft}px`;
      const start = field.clientLeft - parseFloat(style.borderLeftWidth);
      const end = field.offsetWidth - field.clientWidth - field.clientLeft - parseFloat(style.borderRightWidth);
      const below = field.offsetHeight - field.clientHeight - field.clientTop - parseFloat(style.borderBottomWidth);
      backdrop.style.paddingLeft = `${parseFloat(style.paddingLeft) + scrollbar(start)}px`;
      backdrop.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar(end)}px`;
      backdrop.style.paddingBottom = `${parseFloat(style.paddingBottom) + scrollbar(below)}px`;
      follow();
    };

    const draw = () => {
      const { value } = field;
      const parts = [];
      let end = 0;
      for (const found of value.matchAll(pattern)) {
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
    field.addEventListener("scroll", follow);
    new ResizeObserver(match).observe(field);
    field.form?.addEventListener("reset", () => setTimeout(draw));
    draw();
  }
}
