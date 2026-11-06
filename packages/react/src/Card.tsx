"use client";
import type { ComponentPropsWithRef } from "react";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

interface CardOptions {
  variant?: "raised" | "ghost";
}

export type CardProps =
  | (CardOptions & ComponentPropsWithRef<"div"> & { href?: undefined })
  | (CardOptions & ComponentPropsWithRef<"a"> & { href: string });

export const Card = ({ variant, className, ...props }: CardProps) => {
  const Anchor = useLinkComponent();
  const attributes = {
    className: withClass("hcard", className),
    "data-variant": variant,
  };
  if (props.href !== undefined) return <Anchor {...props} {...attributes} />;
  return <div {...props} {...attributes} />;
};
