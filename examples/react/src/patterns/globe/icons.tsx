import type { ComponentPropsWithRef } from "react";

type IconProps = ComponentPropsWithRef<"svg">;

export const TurnLeftIcon = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M19 12H5" />
    <path d="M11 6L5 12L11 18" />
  </svg>
);

export const TurnRightIcon = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M5 12H19" />
    <path d="M13 6L19 12L13 18" />
  </svg>
);

export const PauseIcon = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect x="6.5" y="5.5" width="3.5" height="13" rx="1.25" fill="currentColor" />
    <rect x="14" y="5.5" width="3.5" height="13" rx="1.25" fill="currentColor" />
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M8 6.2V17.8C8 18.6 8.85 19.1 9.55 18.68L19.1 12.88C19.75 12.49 19.75 11.51 19.1 11.12L9.55 5.32C8.85 4.9 8 5.4 8 6.2Z" fill="currentColor" />
  </svg>
);
