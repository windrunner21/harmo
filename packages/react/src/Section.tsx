"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { renders } from "./children.ts";
import { withClass } from "./withClass.ts";

export interface SectionProps extends ComponentPropsWithRef<"section"> {
  label: ReactNode;
  description?: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6";
  actions?: ReactNode;
}

export const Section = ({
  label,
  description,
  labelAs: Label = "h2",
  actions,
  className,
  children,
  ...props
}: SectionProps) => {
  const titleId = `${useId()}-title`;

  return (
    <section aria-labelledby={titleId} {...props} className={withClass("hsection", className)}>
      <header className="hsection-header">
        <div className="hsection-text">
          <Label className="hsection-title" id={titleId}>
            {label}
          </Label>
          {renders(description) && <p className="hsection-description">{description}</p>}
        </div>
        {renders(actions) && <div className="hsection-actions">{actions}</div>}
      </header>
      <div className="hsection-body">{children}</div>
    </section>
  );
};
