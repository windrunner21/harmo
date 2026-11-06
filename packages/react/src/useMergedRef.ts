"use client";
import { useCallback, type Ref } from "react";

// One ref for several: a component's own and yours. Stable while they are,
// so React doesn't detach and attach them again on every render, which would
// call a ref callback of yours each time, and loop one that sets state.
export const useMergedRef = <T>(...refs: (Ref<T> | undefined)[]) =>
  useCallback((node: T | null) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(node);
        return typeof cleanup === "function" ? cleanup : () => ref(null);
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    });
    return () => {
      for (const cleanup of cleanups) cleanup?.();
    };
  }, refs);
