"use client";

import type { ComponentPropsWithRef } from "react";
import { useField } from "./field/Field.tsx";
import { withClass } from "./withClass.ts";

export type SwitchProps = Omit<ComponentPropsWithRef<"input">, "type" | "role">;

export const Switch = ({ className, ...props }: SwitchProps) => {
  const field = useField(props);

  return (
    <input
      {...props}
      {...field}
      className={withClass("hswitch", className)}
      type="checkbox"
      role="switch"
    />
  );
};
