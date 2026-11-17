import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Whether it's rendered in the browser, past hydration: false on the server,
// and while hydrating what the server rendered.
export const useInBrowser = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

// Whether it was added after the page loaded: not while it's rendered on the
// server or hydrated, which is what was there as the page loaded.
export const useAddedLater = () => {
  const inBrowser = useInBrowser();
  const [later] = useState(() => inBrowser);
  return later;
};
