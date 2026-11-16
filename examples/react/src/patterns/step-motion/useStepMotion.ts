import { useLayoutEffect, useRef } from "react";

interface Size {
  width: number;
  height: number;
}

interface Before extends Size {
  card: Element;
  shown: Map<Element, { x: number; y: number }>;
}

const resize = "harmo-step-resize";
const shift = "harmo-step-move";

const token = (element: Element, name: string) => getComputedStyle(element).getPropertyValue(name).trim();

const milliseconds = (value: string, fallback: number) => {
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  return value.endsWith("ms") ? number : number * 1000;
};

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const isShown = (element: Element) => getComputedStyle(element).display !== "none";

// Computed, so a card mid-resize measures where it has got to.
const sizeOf = (card: Element): Size => {
  const { width, height } = getComputedStyle(card);
  return { width: parseFloat(width) || 0, height: parseFloat(height) || 0 };
};

const offsetOf = (child: Element, card: Element) => {
  const inner = child.getBoundingClientRect();
  const outer = card.getBoundingClientRect();
  return { x: inner.left - outer.left, y: inner.top - outer.top };
};

const measure = (card: Element): Before => ({
  card,
  ...sizeOf(card),
  shown: new Map([...card.children].filter(isShown).map((child) => [child, offsetOf(child, card)])),
});

const playing = (element: Element, id: string) =>
  element.getAnimations().filter((animation) => animation.id === id);

// Chrome writes a changed inline style to its attribute only when it's read:
// read first, or an empty attribute comes back after its removal.
const unclip = (card: Element) => {
  if (!(card instanceof HTMLElement) || playing(card, resize).length) return;
  for (const name of ["overflow", "align-content", "overflow-anchor"]) card.style.removeProperty(name);
  if (!card.style.length && card.getAttribute("style") !== null) card.removeAttribute("style");
};

const fadeIn = (card: HTMLElement, before: Before, duration: number) =>
  [...card.children]
    .filter((child) => !before.shown.has(child) && isShown(child))
    .map((child) =>
      child.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration,
        easing: token(card, "--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
      }),
    );

const resizeFrom = (card: HTMLElement, before: Before, fade: number) => {
  const after = sizeOf(card);
  const wider = Math.abs(after.width - before.width);
  const distance = Math.max(wider, Math.abs(after.height - before.height));
  const timing = {
    duration: fade + Math.min(distance, 300) / 2,
    easing: token(card, "--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
  };
  const started: Animation[] = [];

  for (const [child, was] of before.shown) {
    if (child.parentElement !== card || !isShown(child)) continue;
    const now = offsetOf(child, card);
    const x = was.x - now.x;
    const y = was.y - now.y;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
    started.push(child.animate([{ translate: `${x}px ${y}px` }, { translate: "0 0" }], { ...timing, id: shift }));
  }

  if (distance < 1 || before.width < 1 || before.height < 1) return started;
  const from: Keyframe = { height: `${before.height}px` };
  const to: Keyframe = { height: `${after.height}px` };
  if (wider >= 1) {
    from.width = `${before.width}px`;
    to.width = `${after.width}px`;
  }
  const animation = card.animate([from, to], { ...timing, id: resize });
  // Unpacked, a grid card's rows would stretch to the height it's given.
  card.style.overflow = "clip";
  card.style.alignContent = "start";
  card.style.overflowAnchor = "none";
  const done = () => unclip(card);
  animation.finished.then(done, done);
  return [...started, animation];
};

const animate = (card: HTMLElement, before: Before) => {
  const stopping = [before.card, card, ...before.shown.keys()].flatMap((element) => [
    ...playing(element, resize),
    ...playing(element, shift),
  ]);
  for (const animation of stopping) animation.cancel();
  const fade = milliseconds(token(card, "--harmo-duration-normal"), 200);
  const started = [...fadeIn(card, before, fade), ...(still() ? [] : resizeFrom(card, before, fade))];
  // Together, on this frame: left to the compositor, the fades can hold the
  // card at its old size, empty, for a frame or two.
  const now = document.timeline.currentTime;
  if (now !== null) for (const animation of started) animation.startTime = now;
  unclip(before.card);
  unclip(card);
};

export const focusStep = (element: HTMLElement | null | undefined) => {
  element?.focus({ preventScroll: true });
  element?.scrollIntoView({ block: "nearest", behavior: still() ? "instant" : "smooth" });
};

// Measures the card before the change, and animates the card shown once
// React has committed it.
export const useStepMotion = (step: unknown, card: () => Element | null | undefined) => {
  const before = useRef<Before>(undefined);

  useLayoutEffect(() => {
    const measured = before.current;
    before.current = undefined;
    const element = card();
    if (measured && element instanceof HTMLElement) animate(element, measured);
  }, [step]);

  return (change: () => void) => {
    const element = card();
    // Or scroll anchoring scrolls the page to keep what stays, such as the
    // band, where it was while the new step is measured.
    if (element instanceof HTMLElement) element.style.overflowAnchor = "none";
    before.current = element ? measure(element) : undefined;
    change();
  };
};
