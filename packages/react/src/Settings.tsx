"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { FieldContext } from "./field/Field.tsx";
import { withClass } from "./withClass.ts";

export type SettingsProps = ComponentPropsWithRef<"div">;

export const Settings = ({ className, ...props }: SettingsProps) => (
  <div {...props} className={withClass("hsettings", className)} />
);

export interface SettingProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  description?: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  placement?: "below";
}

export const Setting = ({
  label,
  description,
  labelAs: Label = "h3",
  placement,
  className,
  children,
  ...props
}: SettingProps) => {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const below = placement === "below";

  return (
    <FieldContext
      value={{
        title: titleId,
        "aria-describedby": description ? descriptionId : undefined,
      }}
    >
      <div {...props} className={withClass("hsetting", className)}>
        <div className="hsetting-text">
          <Label className="hsetting-title" id={titleId}>
            {label}
          </Label>
          {description && (
            <p className="hsetting-description" id={descriptionId}>
              {description}
            </p>
          )}
          {below && children}
        </div>
        {!below && children}
      </div>
    </FieldContext>
  );
};
