"use client";

import type { ComponentPropsWithRef } from "react";
import { useField } from "./field/Field.tsx";
import { withClass } from "./withClass.ts";

export type InputProps = ComponentPropsWithRef<"input">;

export const Input = ({ className, ...props }: InputProps) => {
  const field = useField(props);

  return (
    <input {...props} {...field} className={withClass("hinput", className)} />
  );
};
