"use client";
import { useEffect, useRef, useState } from "react";

// A press pins a tooltip open, for a touch screen, which neither hovers nor
// shows keyboard focus, until a press again, a press outside the element the
// ref is on, or Escape. Unpinning when focus leaves is the caller's.
export const usePinned = <T extends HTMLElement>() => {
  const [pinned, setPinned] = useState(false);
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!pinned) return;
    const away = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPinned(false);
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
  return [pinned, setPinned, ref] as const;
};
