"use client";

import {
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
import { createPortal } from "react-dom";
import { shownChildren } from "./children.ts";
import { TagCopyContext } from "./Tag.tsx";
import { useTooltip } from "./Tooltip.tsx";
import type { FormatCount } from "./types.ts";
import { usePinned } from "./usePinned.ts";
import { withClass } from "./withClass.ts";

export interface TagListProps extends ComponentPropsWithRef<"ul"> {
  moreLabel: (count: number) => string;
  formatCount?: FormatCount;
}

const plus: FormatCount = (count) => `+${count}`;

// A Combobox around the list, whose field reaches every tag: while focus is
// in it, every tag shows, in a row that scrolls, and "+N" stays out of the
// Tab order.
export const TagListContext = createContext<{ editing: boolean } | undefined>(
  undefined,
);

export const TagList = ({
  moreLabel,
  formatCount = plus,
  ref,
  className,
  children,
  ...props
}: TagListProps) => {
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement, []);
  const tipId = useId();
  const field = useContext(TagListContext);
  const counting = !field?.editing;

  const items = shownChildren(children).filter((child) => child !== "");
  const [fitting, setFitting] = useState(items.length);
  const shown = counting ? Math.min(fitting, items.length) : items.length;
  const rest = items.length - shown;

  // "+N" for each count it could show, as the app writes it, drawn into an
  // element off the page for counting to measure: a smaller count can be
  // wider, as "one other" is beside "4 others". Made before the first count,
  // and before the browser paints.
  const [counts, setCounts] = useState<HTMLSpanElement | null>(null);
  useLayoutEffect(() => setCounts(document.createElement("span")), []);

  // While "+N" has focus, it stays, however wide the list grows, so focus
  // isn't lost; the tags are counted again once it leaves.
  const [holding, setHolding] = useState(false);

  const fit = useRef(() => {});
  fit.current = () => {
    const ul = list.current;
    if (!counting || !ul) return;
    const focused =
      holding &&
      !!ul
        .querySelector(":scope > .htag-list-more")
        ?.contains(document.activeElement);
    setFitting(countFitting(ul, focused, counts));
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

  // Counted after every render, as a hidden tag whose text changes reports
  // no change of size. While every tag shows, in a Combobox, its end stays
  // in view as tags are added, beside the text being typed.
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
  const [pinned, setPinned, more] = usePinned<HTMLSpanElement>();
  const { trigger, tooltip } = useTooltip(pinned && rest > 0);

  return (
    <ul
      {...props}
      ref={list}
      className={withClass("htag-list", className)}
      role="list"
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
          onFocus={() => setHolding(true)}
          onBlur={(event) => {
            trigger.onBlur();
            setPinned(false);
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setHolding(false);
            }
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
            {rest ? formatCount(rest) : null}
          </button>
          <span
            {...tooltip}
            className="htooltip"
            data-variant="hint"
            role="tooltip"
            id={tipId}
          >
            {/* Copies, only to look at: a TagRemove in one renders nothing,
                as a tooltip holds nothing to press. */}
            <span className="htag-list-rest">
              <TagCopyContext value={true}>
                {items
                  .slice(shown)
                  .flatMap((item, index) => (index ? [" ", item] : [item]))}
              </TagCopyContext>
            </span>
          </span>
        </span>
      </li>
      {counts &&
        createPortal(
          items.map((_, index) => (
            <span key={index}>{formatCount(index + 1)}</span>
          )),
          counts,
        )}
    </ul>
  );
};

// How many tags fit the list's width, with room for "+N" when some don't, or
// while it's kept: each is shown to be measured, then put back as it was, so
// nothing paints in between. From the most tags that leave any room, one
// fewer at a time, "+N" is measured with its text for the rest, copied from
// `counts`, until it fits beside them.
const countFitting = (
  list: HTMLElement,
  keepMore: boolean,
  counts: HTMLElement | null,
) => {
  const items = Array.from(list.children).filter(
    (item) => !item.classList.contains("htag-list-more"),
  ) as HTMLElement[];
  const more = list.querySelector<HTMLElement>(":scope > .htag-list-more");
  const before = items.map((item) => item.hidden);
  const moreBefore = more?.hidden ?? true;
  for (const item of items) item.hidden = false;
  if (more) more.hidden = true;

  const available = list.clientWidth + 0.5;
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
  const widths = items.map((item) => item.getBoundingClientRect().width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    gap * Math.max(items.length - 1, 0);

  let count = items.length;
  if (more && (keepMore || total > available)) {
    const probe = more.cloneNode(true) as HTMLElement;
    probe.querySelector(".htooltip")?.remove();
    const button = probe.querySelector(".htag-list-count");
    probe.hidden = false;
    list.append(probe);
    // Where "+N" starts after each number of tags.
    const starts = [0];
    for (const width of widths) {
      starts.push((starts.at(-1) ?? 0) + width + gap);
    }
    count = 0;
    while (
      count < items.length - 1 &&
      (starts[count + 1] ?? Infinity) <= available
    ) {
      count++;
    }
    while (count > 0) {
      const text = counts?.children[items.length - count - 1];
      if (button && text) {
        button.replaceChildren(
          ...Array.from(text.childNodes, (node) => node.cloneNode(true)),
        );
      }
      const width = probe.getBoundingClientRect().width;
      if ((starts[count] ?? 0) + width <= available) break;
      count--;
    }
    probe.remove();
  }

  items.forEach((item, index) => (item.hidden = before[index] ?? false));
  if (more) more.hidden = moreBefore;
  return Math.max(count, 0);
};
