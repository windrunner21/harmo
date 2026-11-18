"use client";

import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

export interface HeaderProps extends ComponentPropsWithRef<"header"> {
  scroll?: "stay" | "away" | "hide";
  transparent?: boolean;
  bordered?: boolean;
  brand?: ReactNode;
  actions?: ReactNode;
}

const turn = 4;
const stopsAfter = 150;

const scrollerOf = (element: Element) => {
  const root = element.ownerDocument.documentElement;
  for (let node = element.parentElement; node && node !== root; node = node.parentElement) {
    if (node === element.ownerDocument.body && getComputedStyle(root).overflowY === "visible") break;
    if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
};

const shiftOf = (element: HTMLElement) => {
  const y = getComputedStyle(element).translate.split(" ")[1] ?? "0";
  return y.endsWith("%") ? (parseFloat(y) / 100) * element.offsetHeight : parseFloat(y) || 0;
};

export const Header = ({
  scroll = "stay",
  transparent = false,
  bordered = false,
  brand,
  actions,
  className,
  children,
  ref,
  ...props
}: HeaderProps) => {
  const header = useRef<HTMLElement>(null);
  const merged = useMergedRef(header, ref);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const scroller = scrollerOf(element);
    const target = scroller ?? window;
    const top = () => (scroller ? scroller.scrollTop : window.scrollY);
    const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const busy = () =>
      element.matches(":focus-within") ||
      Array.from(element.querySelectorAll(':popover-open, [aria-expanded="true"]')).some((open) => open.checkVisibility());
    let last = top();
    let mark = last;
    let shift = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const place = (y: number) => {
      shift = y;
      element.style.translate = `0 ${y}px`;
    };
    const rest = () => {
      element.removeAttribute("data-settling");
      if (shift < 0 && shift > -element.offsetHeight) return;
      element.style.removeProperty("translate");
      element.toggleAttribute("data-hidden", shift < 0);
    };
    const settle = (to: number) => {
      if (to === shift) return rest();
      element.setAttribute("data-settling", to < 0 ? "hide" : "show");
      place(to);
    };
    const show = () => {
      shift = 0;
      rest();
    };

    const stopped = () => {
      if (scroll !== "hide" || still()) return;
      const height = element.offsetHeight;
      const now = top();
      if (busy()) return settle(0);
      if (now < height) return settle(Math.max(shift, -now));
      settle(shift > -height / 2 ? 0 : -height);
    };
    const follow = () => {
      const now = top();
      const delta = now - last;
      last = now;
      setScrolled(now > 0);
      if (scroll !== "hide" || delta === 0) return;
      const height = element.offsetHeight;
      if (still()) {
        element.style.removeProperty("translate");
        element.removeAttribute("data-settling");
        shift = 0;
        if (busy() || now <= height) element.removeAttribute("data-hidden");
        else if (now > mark + turn) element.setAttribute("data-hidden", "");
        else if (now < mark - turn) element.removeAttribute("data-hidden");
        if (Math.abs(now - mark) > turn || now <= 0) mark = now;
        return;
      }
      if (busy()) return show();
      if (element.hasAttribute("data-settling")) {
        shift = shiftOf(element);
        element.removeAttribute("data-settling");
      } else if (element.hasAttribute("data-hidden")) {
        shift = -height;
        element.removeAttribute("data-hidden");
      }
      place(Math.min(0, Math.max(-height, shift - delta)));
      clearTimeout(timer);
      if (!("onscrollend" in window)) timer = setTimeout(stopped, stopsAfter);
    };
    const settled = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === "translate" && element.hasAttribute("data-settling")) rest();
    };

    follow();
    target.addEventListener("scroll", follow, { passive: true });
    target.addEventListener("scrollend", stopped);
    element.addEventListener("transitionend", settled);
    element.addEventListener("focusin", show);
    return () => {
      clearTimeout(timer);
      target.removeEventListener("scroll", follow);
      target.removeEventListener("scrollend", stopped);
      element.removeEventListener("transitionend", settled);
      element.removeEventListener("focusin", show);
      element.style.removeProperty("translate");
      element.removeAttribute("data-settling");
      element.removeAttribute("data-hidden");
    };
  }, [scroll]);

  return (
    <header
      {...props}
      ref={merged}
      className={withClass("hheader", className)}
      data-scroll={scroll === "stay" ? undefined : scroll}
      data-transparent={transparent ? "" : undefined}
      data-bordered={bordered ? "" : undefined}
      data-scrolled={scrolled ? "" : undefined}
    >
      <div className="hheader-bar">
        {brand !== undefined && <div className="hheader-brand">{brand}</div>}
        {children}
        {actions !== undefined && <div className="hheader-actions">{actions}</div>}
      </div>
    </header>
  );
};
