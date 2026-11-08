"use client";

import {
  createContext,
  isValidElement,
  useContext,
  useId,
  type AriaAttributes,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { renders } from "../children.ts";
import { withClass } from "../withClass.ts";
import { ErrorMessage } from "./ErrorMessage.tsx";

interface FieldParts extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
}

export interface StackedFieldProps extends FieldParts {
  orientation?: undefined;
  control?: "button" | "combobox";
  optional?: ReactNode;
  labelAccessory?: ReactNode;
  error?: ReactNode;
}

interface HorizontalFieldProps extends FieldParts {
  orientation: "horizontal";
  control?: never;
  optional?: never;
  labelAccessory?: never;
  error?: never;
}

export type FieldProps = StackedFieldProps | HorizontalFieldProps;

interface FieldControl {
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
}

interface FieldState extends Omit<FieldControl, "aria-label"> {
  title?: string;
}

export const FieldContext = createContext<FieldState>({});

export const useField = (
  control: FieldControl,
  {
    describedBy,
    labelled = false,
  }: { describedBy?: string; labelled?: boolean } = {},
) => {
  const field = useContext(FieldContext);
  const named =
    control["aria-label"] !== undefined ||
    control["aria-labelledby"] !== undefined;

  return {
    id: control.id ?? field.id,
    "aria-labelledby": named
      ? control["aria-labelledby"]
      : (field["aria-labelledby"] ?? (labelled ? undefined : field.title)),
    "aria-describedby":
      [field["aria-describedby"], control["aria-describedby"], describedBy]
        .filter(Boolean)
        .join(" ") || undefined,
    "aria-invalid": control["aria-invalid"] ?? field["aria-invalid"],
  };
};

export const Field = (fieldProps: FieldProps) => {
  const {
    orientation,
    control: controlKind,
    label,
    optional,
    labelAccessory,
    description,
    error,
    htmlFor,
    className,
    children,
    ...props
  } = fieldProps;
  const id = useId();
  const childId =
    isValidElement<{ id?: unknown }>(children) &&
    typeof children.props.id === "string"
      ? children.props.id
      : undefined;
  const controlId = htmlFor ?? childId ?? id;
  const labelId = `${id}-label`;
  const optionalId = `${id}-optional`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const horizontal = orientation === "horizontal";
  const validated = !horizontal && "error" in fieldProps;
  const group = props.role === "group" || props.role === "radiogroup";

  const described: FieldState = {
    "aria-describedby":
      [
        optional && optionalId,
        renders(description) && descriptionId,
        validated && errorId,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
  };

  // A button can't be labelled by a <label>, so a span with an id names it. A
  // combobox's field keeps its <label>, with an id too, so its list can share
  // the name.
  const button = controlKind === "button";
  const combobox = controlKind === "combobox";
  const control: FieldState = group
    ? {}
    : {
        id: controlId,
        "aria-labelledby": button || combobox ? labelId : undefined,
        ...described,
      };
  const groupName = group ? { "aria-labelledby": labelId, ...described } : {};

  const labelElement = group || button ? (
    <span className="hlabel" id={labelId}>
      {label}
    </span>
  ) : (
    <label className="hlabel" htmlFor={controlId} id={combobox ? labelId : undefined}>
      {label}
    </label>
  );

  const descriptionElement = renders(description) && (
    <p className="hdescription" id={descriptionId}>
      {description}
    </p>
  );

  const content = horizontal ? (
    <>
      {children}
      {renders(description) ? (
        <div className="hfield-content">
          {labelElement}
          {descriptionElement}
        </div>
      ) : (
        labelElement
      )}
    </>
  ) : (
    <>
      {optional || labelAccessory ? (
        <div className="hfield-label-row">
          {labelElement}
          {optional && (
            <span className="hfield-optional" id={optionalId}>
              {optional}
            </span>
          )}
          {labelAccessory}
        </div>
      ) : (
        labelElement
      )}
      {descriptionElement}
      {children}
      {validated && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </>
  );

  return (
    <FieldContext value={control}>
      <div
        {...props}
        {...groupName}
        className={withClass("hfield", className)}
        data-orientation={orientation}
      >
        {content}
      </div>
    </FieldContext>
  );
};
