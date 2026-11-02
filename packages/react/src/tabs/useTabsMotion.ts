import {
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent,
} from "react";

export const useTabsMotion = <Root extends HTMLElement>() => {
  const tabs = useRef<Root>(null);
  const hovered = useRef<HTMLElement | null>(null);
  const instant = useRef(false);

  const part = (name: "highlight" | "indicator") =>
    tabs.current?.querySelector<HTMLElement>(`:scope > .htabs-${name}`);
  const currentItem = () =>
    tabs.current?.querySelector<HTMLElement>(
      '[aria-current="page"], [aria-selected="true"]',
    );

  const measure = (item: HTMLElement) => {
    const root = tabs.current as Root;
    const box = item.getBoundingClientRect();
    const left = box.left - root.getBoundingClientRect().left - root.clientLeft;
    return { x: `${left}px`, width: `${box.width}px` };
  };

  const place = () => {
    const root = tabs.current;
    if (!root) return;
    const item = currentItem();
    const indicator = instant.current ? part("indicator") : undefined;
    instant.current = false;

    if (indicator) indicator.style.transition = "none";
    if (item) {
      const { x, width } = measure(item);
      root.style.setProperty("--htabs-indicator-x", x);
      root.style.setProperty("--htabs-indicator-width", width);
    } else {
      root.style.setProperty("--htabs-indicator-width", "0px");
    }
    if (indicator) {
      indicator.getBoundingClientRect();
      indicator.style.transition = "";
    }
    part("highlight")?.toggleAttribute(
      "data-on-current",
      Boolean(item) && hovered.current === item,
    );
    root.setAttribute("data-ready", "");
  };

  useLayoutEffect(place);

  useEffect(() => {
    const root = tabs.current;
    if (!root) return;
    const keyboard = () => (instant.current = true);
    const pointer = () => (instant.current = false);
    const observer = new ResizeObserver(() => {
      instant.current = true;
      place();
    });
    observer.observe(root, { box: "border-box" });
    for (const item of root.querySelectorAll('a, [role="tab"]')) {
      observer.observe(item, { box: "border-box" });
    }
    root.addEventListener("keydown", keyboard, true);
    root.addEventListener("pointerdown", pointer, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("keydown", keyboard, true);
      root.removeEventListener("pointerdown", pointer, true);
    };
  }, []);

  const onPointerOver = (event: PointerEvent<HTMLElement>) => {
    const root = tabs.current;
    const pill = part("highlight");
    const item = (event.target as Element).closest<HTMLElement>(
      'a, [role="tab"]',
    );
    if (!root || !pill || !item) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const { x, width } = measure(item);
    if (!hovered.current) pill.style.transition = "none";
    root.style.setProperty("--htabs-highlight-x", x);
    root.style.setProperty("--htabs-highlight-width", width);
    if (!hovered.current) {
      pill.getBoundingClientRect();
      pill.style.transition = "";
    }
    root.style.setProperty("--htabs-highlight-opacity", "1");
    hovered.current = item;
    pill.toggleAttribute("data-on-current", item === currentItem());
  };

  const onPointerLeave = () => {
    tabs.current?.style.setProperty("--htabs-highlight-opacity", "0");
    hovered.current = null;
  };

  return { ref: tabs, onPointerOver, onPointerLeave };
};
