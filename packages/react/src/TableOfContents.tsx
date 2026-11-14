"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface TableOfContentsItem {
  id: string;
  label: ReactNode;
  level?: 1 | 2 | 3;
}

export interface TableOfContentsProps extends Omit<ComponentPropsWithRef<"nav">, "children" | "aria-label"> {
  "aria-label": string;
  items: TableOfContentsItem[];
  offset?: number;
  side?: "start" | "end";
}

const scrollerOf = (node: Element) => {
  const root = document.documentElement;
  for (let parent = node.parentElement; parent && parent !== root; parent = parent.parentElement) {
    if (parent === document.body && getComputedStyle(root).overflowY === "visible") return null;
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return null;
};

const inPageOrder = (a: Element, b: Element) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

const headingsOf = (ids: string[]) => ids.flatMap((id) => document.getElementById(id) ?? []).sort(inPageOrder);

const currentOf = (ids: string[], offset: number) => {
  const headings = headingsOf(ids);
  const first = headings[0];
  if (!first) return null;
  const scroller = scrollerOf(first);
  const box = scroller ?? document.documentElement;
  if (box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 1) return headings.at(-1)!.id;
  const top = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0;
  const line = top + offset + 8;
  let current = first.id;
  for (const heading of headings) if (heading.getBoundingClientRect().top <= line) current = heading.id;
  return current;
};

const hashId = () => {
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return location.hash.slice(1);
  }
};

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];

const scrollsByKey = (event: KeyboardEvent) => {
  if (event.defaultPrevented || !scrollKeys.includes(event.key)) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return false;
  return !(event.key === " " && target?.closest("button, summary, [role='button']"));
};

const goTo = (heading: HTMLElement, scroller: HTMLElement) => {
  const top = scroller.getBoundingClientRect().top + scroller.clientTop;
  const margin = parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
  const padding = parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0;
  scroller.scrollBy({
    top: heading.getBoundingClientRect().top - top - margin - padding,
    behavior: still() ? "instant" : "smooth",
  });
  if (!heading.hasAttribute("tabindex") && heading.tabIndex < 0) {
    heading.setAttribute("tabindex", "-1");
    heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
  }
  heading.focus({ preventScroll: true });
};

const plainClick = (event: MouseEvent) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export const TableOfContents = ({
  items,
  offset = 0,
  side = "start",
  className,
  ref,
  ...props
}: TableOfContentsProps) => {
  const nav = useRef<HTMLElement>(null);
  const navRef = useMergedRef(nav, ref);
  const pinned = useRef<string | null>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const ids = JSON.stringify(items.map((item) => item.id));

  useEffect(() => {
    const list: string[] = JSON.parse(ids);
    let frame = 0;
    if (pinned.current && !list.includes(pinned.current)) pinned.current = null;

    const update = () => {
      frame = 0;
      if (!pinned.current) setCurrent(currentOf(list, offset));
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    const release = () => {
      pinned.current = null;
    };
    const releaseByKey = (event: KeyboardEvent) => {
      if (scrollsByKey(event)) release();
    };
    const followHash = () => {
      const id = hashId();
      if (!list.includes(id)) {
        release();
        schedule();
        return;
      }
      pinned.current = id;
      setCurrent(id);
    };

    if (list.includes(hashId())) followHash();
    else update();

    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    for (const parent of new Set(headingsOf(list).map((heading) => heading.parentElement))) {
      if (parent) observer.observe(parent);
    }

    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    for (const type of ["wheel", "touchmove"]) window.addEventListener(type, release, { passive: true });
    window.addEventListener("keydown", releaseByKey);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", followHash);
      for (const type of ["wheel", "touchmove"]) window.removeEventListener(type, release);
      window.removeEventListener("keydown", releaseByKey);
    };
  }, [ids, offset]);

  useLayoutEffect(() => {
    const root = nav.current;
    const list = root?.querySelector(".htoc-list");
    if (!root || !list || !marker.current) return;
    const line = marker.current;
    const place = () => {
      const link = root.querySelector<HTMLElement>(".htoc-link[aria-current]");
      root.style.setProperty("--htoc-marker-y", `${link?.offsetTop ?? 0}px`);
      root.style.setProperty("--htoc-marker-size", String(link?.offsetHeight ?? 0));
      if (!link || root.hasAttribute("data-ready")) return;
      line.getBoundingClientRect();
      root.setAttribute("data-ready", "");
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    for (const link of list.querySelectorAll(".htoc-link")) observer.observe(link);
    return () => observer.disconnect();
  }, [current, ids]);

  useEffect(() => {
    const root = nav.current;
    const link = root?.querySelector("[aria-current]");
    if (!root || !link || root.scrollHeight <= root.clientHeight) return;
    const outer = root.getBoundingClientRect();
    const inner = link.getBoundingClientRect();
    if (inner.top < outer.top) root.scrollTop -= outer.top - inner.top;
    else if (inner.bottom > outer.bottom) root.scrollTop += inner.bottom - outer.bottom;
  }, [current]);

  return (
    <nav
      {...props}
      ref={navRef}
      className={withClass("htoc", className)}
      data-side={side === "end" ? "end" : undefined}
    >
      <span ref={marker} className="htoc-marker" aria-hidden="true" />
      <ul className="htoc-list" role="list">
        {items.map((item) => (
          <li key={item.id} className="htoc-item" data-level={item.level}>
            <a
              className="htoc-link"
              href={`#${encodeURIComponent(item.id)}`}
              aria-current={current === item.id ? "location" : undefined}
              onClick={(event) => {
                if (!plainClick(event)) return;
                const heading = document.getElementById(item.id);
                const scroller = heading && scrollerOf(heading);
                if (heading && scroller) {
                  event.preventDefault();
                  goTo(heading, scroller);
                  if (hashId() !== item.id) history.pushState(null, "", `#${encodeURIComponent(item.id)}`);
                }
                pinned.current = item.id;
                setCurrent(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
