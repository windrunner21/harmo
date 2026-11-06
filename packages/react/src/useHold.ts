"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

// Held all the way, the full fill shows for a moment before the action.
const BEAT = 200;
const pressKeys = new Set(["Enter", " "]);

// The hold's length, from --hbutton-hold-duration, so CSS and the timer agree.
const durationOf = (button: HTMLElement) => {
  const value = getComputedStyle(button).getPropertyValue("--hbutton-hold-duration").trim();
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return 1500;
  return value.endsWith("ms") ? number : number * 1000;
};

// A button whose action runs once it's held, by pointer, Enter, or Space, for
// its whole duration: full, it stays so for a moment, whatever the pointer or
// key does, then the action runs; let go early, nothing happens. A screen
// reader presses with a click, which can't hold, so its click runs the action
// at once. Its click never does what a button's click does natively, such as
// sending a form: the action is onHold.
export const useHold = (onHold: (() => void) | undefined, inactive: boolean) => {
  const [holding, setHolding] = useState(false);
  const [held, setHeld] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const beatTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const by = useRef<"pointer" | "key" | null>(null);
  // The click a pointer press ends in is the hold's, not a screen reader's.
  const pressed = useRef(false);
  // What the timers act on: the latest, not what was there when they began.
  const latest = useRef({ onHold, inactive });
  useLayoutEffect(() => {
    latest.current = { onHold, inactive };
  });

  const stop = () => {
    clearTimeout(holdTimer.current);
    by.current = null;
    setHolding(false);
  };
  const unhold = () => {
    clearTimeout(beatTimer.current);
    setHeld(false);
  };
  const act = () => {
    stop();
    unhold();
    if (!latest.current.inactive) latest.current.onHold?.();
  };
  // Full: it stays so, whatever the pointer or key does now, then acts.
  const complete = () => {
    stop();
    if (latest.current.inactive || !latest.current.onHold) return;
    setHeld(true);
    beatTimer.current = setTimeout(act, BEAT);
  };
  const start = (button: HTMLElement, source: "pointer" | "key") => {
    by.current = source;
    setHolding(true);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(complete, durationOf(button));
  };

  // Turned inactive, or no longer a hold button: whatever was under way stops,
  // the moment after a full hold included.
  useEffect(() => {
    if (!inactive && onHold) return;
    stop();
    unhold();
  }, [inactive, onHold === undefined]);

  useEffect(
    () => () => {
      clearTimeout(holdTimer.current);
      clearTimeout(beatTimer.current);
    },
    [],
  );

  if (!onHold) return undefined;

  return {
    holding,
    held,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        pressed.current = true;
        if (held) return;
        // A second finger isn't a hold.
        if (!event.isPrimary) return stop();
        if (event.button !== 0 || inactive) return;
        // A finger stays with what it pressed, even moved off it; let it go,
        // so moving off the button lets go of the hold, as with a mouse.
        const button = event.currentTarget;
        if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
        start(button, "pointer");
      },
      onPointerUp: () => {
        if (by.current === "pointer") stop();
      },
      onPointerLeave: () => {
        if (by.current === "pointer") stop();
      },
      onPointerCancel: () => {
        if (by.current === "pointer") stop();
      },
      onContextMenu: (event: MouseEvent<HTMLButtonElement>) => {
        if (by.current === "pointer" || held) event.preventDefault();
      },
      // A mouse or touch click comes with a press, and counts at least 1; a
      // screen reader's has no press, or counts 0, and runs the action.
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const fromPress = pressed.current && event.detail > 0;
        pressed.current = false;
        if (fromPress || inactive || held) return;
        act();
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!pressKeys.has(event.key)) return;
        // The press is the hold's, not a click; held keys repeat.
        event.preventDefault();
        if (event.repeat || inactive || held) return;
        start(event.currentTarget, "key");
      },
      onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!pressKeys.has(event.key)) return;
        event.preventDefault();
        if (by.current === "key") stop();
      },
      onBlur: () => {
        if (!held) stop();
      },
    },
  };
};
