import { useCallback, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

export const highlightedParts = (text: string, pattern: RegExp, ending = "") => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const parts: ReactNode[] = [];
  let end = 0;
  for (const match of text.matchAll(new RegExp(pattern.source, flags))) {
    if (!match[0]) continue;
    if (match.index > end) parts.push(text.slice(end, match.index));
    parts.push(<mark key={match.index}>{match[0]}</mark>);
    end = match.index + match[0].length;
  }
  if (end < text.length || ending) parts.push(text.slice(end) + ending);
  return parts;
};

const copied = [
  "boxSizing",
  "width",
  "height",
  "paddingTop",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "direction",
  "unicodeBidi",
  "fontFamily",
  "fontFeatureSettings",
  "fontKerning",
  "fontSize",
  "fontStretch",
  "fontStyle",
  "fontVariant",
  "fontVariationSettings",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "overflowWrap",
  "tabSize",
  "textAlign",
  "textIndent",
  "textTransform",
  "wordBreak",
  "wordSpacing",
] as const;

const scrollbar = (space: number) => Math.max(0, Math.round(space));

export const useBackdrop = (field: RefObject<HTMLElement | null>, shown: boolean) => {
  const backdrop = useRef<HTMLDivElement>(null);

  const follow = useCallback(() => {
    const from = field.current;
    const to = backdrop.current;
    if (!from || !to) return;
    const scroller = from.localName === "input" ? to.firstElementChild! : to;
    scroller.scrollLeft = from.scrollLeft;
    scroller.scrollTop = from.scrollTop;
  }, [field]);

  const match = useCallback(() => {
    const from = field.current;
    const to = backdrop.current;
    if (!from || !to) return;
    const style = getComputedStyle(from);
    for (const name of copied) to.style[name] = style[name];
    to.style.whiteSpace = from.getAttribute("wrap")?.toLowerCase() === "off" ? "pre" : style.whiteSpace;
    to.style.inset = `${from.offsetTop}px auto auto ${from.offsetLeft}px`;
    const start = from.clientLeft - parseFloat(style.borderLeftWidth);
    const end = from.offsetWidth - from.clientWidth - from.clientLeft - parseFloat(style.borderRightWidth);
    const below = from.offsetHeight - from.clientHeight - from.clientTop - parseFloat(style.borderBottomWidth);
    to.style.paddingLeft = `${parseFloat(style.paddingLeft) + scrollbar(start)}px`;
    to.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar(end)}px`;
    to.style.paddingBottom = `${parseFloat(style.paddingBottom) + scrollbar(below)}px`;
    follow();
  }, [field, follow]);

  useLayoutEffect(match);

  useLayoutEffect(() => {
    if (!shown || !field.current) return;
    const observer = new ResizeObserver(match);
    observer.observe(field.current);
    return () => observer.disconnect();
  }, [field, match, shown]);

  return { backdrop, follow };
};
