import type { ReactNode } from "react";

// What names a component that must have a name: its own words, or the id of
// something on the page that holds them, such as a visible heading.
export type Naming =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-label"?: undefined; "aria-labelledby": string };

// The Field props a form control takes to render its own Field: a label, then
// what goes with it. Without a label, none of the rest.
export type ControlField =
  | {
      label: ReactNode;
      optional?: ReactNode;
      description?: ReactNode;
      error?: ReactNode;
    }
  | {
      label?: undefined;
      optional?: never;
      description?: never;
      error?: never;
    };

// Writes a count Harmo shows, in the app's digits and words.
export type FormatCount = (count: number) => ReactNode;
