import { close } from "./icons.ts";

// The close icon: on a Dialog's and a Drawer's close button, a Tag's and a
// file's remove, a Composer's cancel, and an open Launcher's button.
export const closeIcon = (
  <svg
    className="hicon"
    width="24"
    height="24"
    viewBox="0 0 25 25"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    {close.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
