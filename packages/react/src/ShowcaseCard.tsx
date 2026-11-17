"use client";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { renders } from "./children.ts";
import { ChevronToArrow } from "./ChevronToArrow.tsx";
import { useLinkComponent } from "./HarmoProvider.tsx";
import { withClass } from "./withClass.ts";

// The link's own media attribute, a media query for what it links to, gives
// way to the card's media.
export interface ShowcaseCardProps extends Omit<ComponentPropsWithRef<"a">, "media"> {
  href: string;
  label: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  description?: ReactNode;
  media?: ReactNode;
  action?: ReactNode;
  fold?: boolean;
}

export const ShowcaseCard = ({
  label,
  labelAs: Label = "h3",
  description,
  media,
  action,
  fold,
  className,
  ...props
}: ShowcaseCardProps) => {
  const Anchor = useLinkComponent();

  return (
    <Anchor {...props} className={withClass("hshowcase-card", className)} data-fold={fold ? "" : undefined}>
      <div className="hshowcase-card-media" aria-hidden="true" inert>
        {media}
      </div>
      <div className="hshowcase-card-body">
        <Label className="hshowcase-card-title">{label}</Label>
        {renders(description) && <p className="hshowcase-card-description">{description}</p>}
      </div>
      {renders(action) && (
        <span className="hshowcase-card-action" aria-hidden="true">
          {action}
          <ChevronToArrow />
        </span>
      )}
    </Anchor>
  );
};
