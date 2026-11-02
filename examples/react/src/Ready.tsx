import { useEffect, type ReactNode } from "react";

// Wraps every example, on the server and in the browser alike, so both render
// the same tree and React generates the same ids. In the browser, onReady
// runs once every effect inside has run, since a parent's effects run after
// its children's; the browser tests wait for it.
export const Ready = ({ onReady, children }: { onReady?: () => void; children: ReactNode }) => {
  useEffect(() => onReady?.(), [onReady]);
  return children;
};
