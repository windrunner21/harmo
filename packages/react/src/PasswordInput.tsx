"use client";

import {
  useId,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Field, useField, type StackedFieldProps } from "./field/Field.tsx";
import { eyeOff as eyeOffPaths, eye as eyePaths } from "./icons.ts";
import { Input } from "./Input.tsx";
import { Meter } from "./Meter.tsx";
import { useTooltip } from "./Tooltip.tsx";
import { useCurrentValue } from "./useCurrentValue.ts";

export interface PasswordStrength {
  level: 1 | 2 | 3;
  word: string;
  hint?: ReactNode;
  status?: "success" | "warning" | "error";
}

interface PasswordInputOptions
  extends Omit<ComponentPropsWithRef<"input">, "type">,
    Pick<StackedFieldProps, "label" | "optional" | "description" | "error"> {
  showPasswordLabel: string;
  hidePasswordLabel: string;
}

export type PasswordInputProps = PasswordInputOptions &
  (
    | { strength?: undefined; strengthLabel?: undefined }
    | {
        strength: (password: string) => PasswordStrength;
        strengthLabel: string;
      }
  );

export const PasswordInput = (passwordProps: PasswordInputProps) => {
  const {
    label,
    optional,
    description,
    error,
    showPasswordLabel,
    hidePasswordLabel,
    strength,
    strengthLabel,
    ref,
    value,
    defaultValue,
    onChange,
    ...props
  } = passwordProps;
  const id = useId();
  const strengthId = `${id}-strength`;
  const hintId = `${id}-hint`;
  const current = useCurrentValue({ ref, value, defaultValue, onChange });
  const [revealed, setRevealed] = useState(false);
  const rating =
    strength && current.value !== "" ? strength(current.value) : undefined;

  const word = strength && (
    <span
      className="hpassword-strength"
      id={strengthId}
      aria-live="polite"
      data-status={rating?.status}
    >
      {rating?.word}
    </span>
  );

  return (
    <Field
      label={label}
      htmlFor={props.id}
      optional={optional}
      labelAccessory={word}
      description={description}
      {...("error" in passwordProps && { error })}
    >
      <div className="hpassword">
        <Input
          {...props}
          ref={current.ref}
          value={value}
          defaultValue={defaultValue}
          onChange={current.onChange}
          type={revealed ? "text" : "password"}
          aria-describedby={
            strength
              ? [props["aria-describedby"], strengthId, hintId]
                  .filter(Boolean)
                  .join(" ")
              : props["aria-describedby"]
          }
          aria-invalid={
            rating?.status === "error" ? true : props["aria-invalid"]
          }
        />
        <PasswordToggle
          showPasswordLabel={showPasswordLabel}
          hidePasswordLabel={hidePasswordLabel}
          inputId={props.id}
          pressed={revealed}
          hidden={current.value === ""}
          disabled={props.disabled}
          onClick={() => setRevealed(!revealed)}
        />
      </div>
      {strength && (
        <div className="hpassword-details" hidden={!rating}>
          <div>
            <Meter
              value={rating?.level ?? 0}
              max={3}
              status={rating?.status}
              aria-label={strengthLabel}
              aria-valuetext={rating?.word}
            />
            <p
              className="hpassword-hint"
              id={hintId}
              data-status={rating?.status}
            >
              {rating?.hint}
            </p>
          </div>
        </div>
      )}
    </Field>
  );
};

interface PasswordToggleProps {
  showPasswordLabel: string;
  hidePasswordLabel: string;
  inputId?: string;
  pressed: boolean;
  hidden: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const PasswordToggle = ({
  showPasswordLabel,
  hidePasswordLabel,
  inputId,
  pressed,
  hidden,
  disabled,
  onClick,
}: PasswordToggleProps) => {
  const { id } = useField({ id: inputId });
  const { trigger, tooltip } = useTooltip();

  return (
    <span className="htooltip-trigger" {...trigger}>
      <button
        className="hpassword-toggle"
        type="button"
        aria-label={showPasswordLabel}
        aria-pressed={pressed}
        aria-controls={id}
        hidden={hidden}
        disabled={disabled}
        onClick={onClick}
      >
        {eye}
        {eyeOff}
      </button>
      <span {...tooltip} className="htooltip" role="tooltip" aria-hidden="true">
        {pressed ? hidePasswordLabel : showPasswordLabel}
      </span>
    </span>
  );
};

const eye = (
  <svg
    className="hpassword-icon-show"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {eyePaths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

const eyeOff = (
  <svg
    className="hpassword-icon-hide"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {eyeOffPaths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
