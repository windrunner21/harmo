import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export type KbdProps = ComponentPropsWithRef<"kbd">;

export const Kbd = ({ className, ...props }: KbdProps) => (
  <kbd {...props} className={withClass("hkbd", className)} />
);
