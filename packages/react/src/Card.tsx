"use client";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { renders } from "./children.ts";
import { ChevronToArrow } from "./ChevronToArrow.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

interface CardOptions {
  variant?: "raised" | "ghost";
  icon?: ReactNode;
  label?: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  description?: ReactNode;
  chevron?: boolean;
}

export type CardProps =
  | (CardOptions & ComponentPropsWithRef<"div"> & { href?: undefined })
  | (CardOptions & ComponentPropsWithRef<"a"> & { href: string });

export const Card = ({
  variant,
  icon,
  label,
  labelAs: Label = "h3",
  description,
  chevron,
  className,
  children,
  ...props
}: CardProps) => {
  const Anchor = useLinkComponent();
  const attributes = {
    className: withClass("hcard", className),
    "data-variant": variant,
  };
  const content = renders(label) ? (
    <>
      {renders(icon) && (
        <span className="hcard-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Label className="hcard-title">{label}</Label>
      {renders(description) && <p className="hcard-description">{description}</p>}
      {chevron && <ChevronToArrow className="hcard-chevron" />}
    </>
  ) : (
    children
  );

  if (props.href !== undefined) {
    return (
      <Anchor {...props} {...attributes}>
        {content}
      </Anchor>
    );
  }
  return (
    <div {...props} {...attributes}>
      {content}
    </div>
  );
};
