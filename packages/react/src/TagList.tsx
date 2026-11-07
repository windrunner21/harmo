"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { useTooltip } from "./Tooltip.tsx";
import { withClass } from "./withClass.ts";

export interface TagListProps extends ComponentPropsWithRef<"ul"> {
  moreLabel: (count: number) => string;
}

// A Combobox around the list, whose field reaches every tag: while focus is
// in it, every tag shows, in a row that scrolls, and "+N" stays out of the
// Tab order.
export const TagListContext = createContext<{ editing: boolean } | undefined>(
  undefined,
);

export const TagList = ({
  moreLabel,
  ref,
  className,
  children,
  ...props
}: TagListProps) => {
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement, []);
  const tipId = useId();
  const { trigger, tooltip } = useTooltip();
  const field = useContext(TagListContext);
  const counting = !field?.editing;

  const items = Children.toArray(children);
  const [fitting, setFitting] = useState(items.length);
  const shown = counting ? Math.min(fitting, items.length) : items.length;
  const rest = items.length - shown;

  const fit = useRef(() => {});
  fit.current = () => {
    if (counting && list.current) setFitting(countFitting(list.current));
  };

  // Counted again as the list, its container, or a tag changes size, such
  // as when a font loads. The container, for a list that doesn't grow with
  // it, as beside a Combobox's text.
  const watching = useRef<ResizeObserver>(null);
  useEffect(() => {
    if (!counting) return;
    const observer = new ResizeObserver(() => fit.current());
    watching.current = observer;
    for (const element of [
      list.current,
      list.current?.parentElement,
      ...(list.current?.children ?? []),
    ]) {
      if (element) observer.observe(element);
    }
    return () => {
      observer.disconnect();
      watching.current = null;
    };
  }, [counting]);

  // While every tag shows, in a Combobox, its end stays in view as tags are
  // added, beside the text being typed.
  const before = useRef({ counting, length: items.length });
  useLayoutEffect(() => {
    fit.current();
    for (const element of list.current?.children ?? []) {
      watching.current?.observe(element);
    }
    const ul = list.current;
    if (
      ul &&
      !counting &&
      (before.current.counting || items.length > before.current.length)
    ) {
      const rtl = getComputedStyle(ul).direction === "rtl";
      ul.scrollTo({ left: rtl ? -ul.scrollWidth : ul.scrollWidth });
    }
    before.current = { counting, length: items.length };
  });

  // A press pins the tooltip open, for a touch screen, which neither hovers
  // nor shows keyboard focus, until a press again, a press elsewhere,
  // Escape, or focus leaving. In a Combobox, a press goes to its field.
  const [pinned, setPinned] = useState(false);
  const more = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!pinned) return;
    const away = (event: PointerEvent) => {
      if (!more.current?.contains(event.target as Node)) setPinned(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(false);
    };
    addEventListener("pointerdown", away);
    addEventListener("keydown", escape);
    return () => {
      removeEventListener("pointerdown", away);
      removeEventListener("keydown", escape);
    };
  }, [pinned]);

  return (
    <ul
      {...props}
      ref={list}
      className={withClass("htag-list", className)}
      // Focus on a tag's button, in a row that scrolls, brings the whole tag
      // into view, not only the button.
      onFocus={(event) => {
        event.target
          .closest(".htag-list > li")
          ?.scrollIntoView({ block: "nearest", inline: "nearest" });
        props.onFocus?.(event);
      }}
    >
      {items.map((item, index) => (
        <li
          key={isValidElement(item) ? item.key : index}
          hidden={index >= shown || undefined}
        >
          {item}
        </li>
      ))}
      <li className="htag-list-more" hidden={rest === 0 || undefined}>
        <span
          ref={more}
          className="htooltip-trigger"
          data-open={pinned && rest ? "" : undefined}
          onPointerEnter={trigger.onPointerEnter}
          onPointerLeave={trigger.onPointerLeave}
          onBlur={() => {
            trigger.onBlur();
            setPinned(false);
          }}
        >
          <button
            className="htag-list-count"
            type="button"
            tabIndex={field ? -1 : undefined}
            onClick={field ? undefined : () => setPinned((open) => !open)}
            aria-label={rest ? moreLabel(rest) : undefined}
            aria-describedby={tipId}
          >
            {rest ? `+${rest}` : null}
          </button>
          <span
            {...tooltip}
            className="htooltip"
            data-variant="hint"
            role="tooltip"
            id={tipId}
          >
            <span className="htag-list-rest">
              {items
                .slice(shown)
                .flatMap((item, index) => (index ? [" ", item] : [item]))}
            </span>
          </span>
        </span>
      </li>
    </ul>
  );
};

// How many tags fit the list's width, with room for "+N" when some don't:
// each is shown to be measured, then put back as it was, so nothing paints
// in between. "+N" is measured with the most digits it could show.
const countFitting = (list: HTMLElement) => {
  const items = Array.from(list.children).filter(
    (item) => !item.classList.contains("htag-list-more"),
  ) as HTMLElement[];
  const more = list.querySelector<HTMLElement>(":scope > .htag-list-more");
  const before = items.map((item) => item.hidden);
  const moreBefore = more?.hidden ?? true;
  for (const item of items) item.hidden = false;
  if (more) more.hidden = true;

  const available = list.clientWidth;
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
  const widths = items.map((item) => item.getBoundingClientRect().width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    gap * Math.max(items.length - 1, 0);

  let count = items.length;
  if (total > available + 0.5 && more) {
    const probe = more.cloneNode(true) as HTMLElement;
    probe.querySelector(".htooltip")?.remove();
    const button = probe.querySelector(".htag-list-count");
    if (button) button.textContent = `+${items.length}`;
    probe.hidden = false;
    list.append(probe);
    let used = probe.getBoundingClientRect().width;
    probe.remove();
    count = 0;
    while (
      count < items.length &&
      used + gap + (widths[count] ?? 0) <= available + 0.5
    ) {
      used += gap + (widths[count] ?? 0);
      count++;
    }
  }

  items.forEach((item, index) => (item.hidden = before[index] ?? false));
  if (more) more.hidden = moreBefore;
  return count;
};
