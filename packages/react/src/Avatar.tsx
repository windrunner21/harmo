"use client";

import type { ComponentPropsWithRef, Ref } from "react";
import { useImageComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

export type AvatarProps = Omit<ComponentPropsWithRef<"img">, "ref"> & {
  ref?: Ref<HTMLElement>;
};

export const Avatar = ({
  src,
  alt,
  ref,
  className,
  children,
  ...props
}: AvatarProps) => {
  const Image = useImageComponent();
  const classes = withClass("havatar", className);

  if (src) {
    return (
      <Image {...props} ref={ref} className={classes} src={src} alt={alt} />
    );
  }

  const name =
    alt === "" ? { "aria-hidden": true } : { role: "img", "aria-label": alt };

  return (
    <span
      {...name}
      {...props}
      ref={ref as Ref<HTMLSpanElement>}
      className={classes}
    >
      {children}
    </span>
  );
};
