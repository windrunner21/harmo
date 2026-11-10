"use client";
import { useCallback, useLayoutEffect, useRef } from "react";

// Each button's last width, kept as it lays out, so a change has a "before".
const widths = new WeakMap<Element, number>();
let observer: ResizeObserver | undefined;

// A width change that's playing, and the inline styles it set aside.
interface Change {
  animation: Animation;
  overflow: [string, string];
  whiteSpace: [string, string];
}
const changes = new WeakMap<HTMLElement, Change>();

const restore = (node: HTMLElement, change: Change) => {
  node.style.setProperty("overflow", ...change.overflow);
  node.style.setProperty("white-space", ...change.whiteSpace);
  if (!change.overflow[0]) node.style.removeProperty("overflow");
  if (!change.whiteSpace[0]) node.style.removeProperty("white-space");
  changes.delete(node);
};

export const seconds = (value: string) => {
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return undefined;
  return value.trim().endsWith("ms") ? number : number * 1000;
};

// Stops a change that's playing, at once, with its inline styles back.
export const stopChange = (node: HTMLElement) => {
  const playing = changes.get(node);
  if (!playing) return;
  playing.animation.cancel();
  restore(node, playing);
};

// The width it shows now: mid-change, where the change has got to.
export const widthBefore = (node: HTMLElement) =>
  changes.has(node) ? node.offsetWidth : (widths.get(node) ?? node.offsetWidth);

// From one width to another over --harmo-duration-normal, with
// --harmo-ease-out-cubic; its content on one line and clipped meanwhile, then
// the inline styles it had before. Measure `from` before stopping a change
// that's playing, and `to` after, so a new change carries on from where that
// one had got to, toward the new width.
export const changeWidth = (node: HTMLElement, from: number, to: number) => {
  stopChange(node);
  if (Math.abs(from - to) < 1 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const style = getComputedStyle(node);
  const change: Change = {
    animation: node.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: seconds(style.getPropertyValue("--harmo-duration-normal")) ?? 200,
      easing: style.getPropertyValue("--harmo-ease-out-cubic").trim() || "cubic-bezier(0.215, 0.61, 0.355, 1)",
    }),
    overflow: [node.style.getPropertyValue("overflow"), node.style.getPropertyPriority("overflow")],
    whiteSpace: [node.style.getPropertyValue("white-space"), node.style.getPropertyPriority("white-space")],
  };
  changes.set(node, change);
  node.style.overflow = "hidden";
  node.style.whiteSpace = "nowrap";
  const done = () => {
    if (changes.get(node) === change) restore(node, change);
  };
  change.animation.finished.then(done, done);
};

// When what a button shows changes, its text or whether it's loading, its
// width goes from the old to the new, rather than jumping. Not when the window
// resizes it, and not as it first renders. Returns the ref that tells it
// which element is the button's now, as a button can become a link.
export const useWidthChange = (loading?: boolean) => {
  const node = useRef<HTMLElement | null>(null);
  const shown = useRef<string | undefined>(undefined);

  const attach = useCallback((element: HTMLElement | null) => {
    node.current = element;
    if (!element) return;
    widths.set(element, element.offsetWidth);
    observer ??= new ResizeObserver((entries) => {
      for (const entry of entries) {
        widths.set(entry.target, entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => {
      observer?.unobserve(element);
      node.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const now = `${element.textContent}|${loading ? 1 : 0}`;
    const before = shown.current;
    shown.current = now;
    if (before === undefined || before === now) return;
    const from = widthBefore(element);
    stopChange(element);
    changeWidth(element, from, element.offsetWidth);
  });

  return attach;
};
