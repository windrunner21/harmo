"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import { Field, FieldContext, type StackedFieldProps } from "./field/Field.tsx";
import { check, copy, share } from "./icons.ts";
import { Input, type InputProps } from "./Input.tsx";
import { Tooltip } from "./Tooltip.tsx";
import { withClass } from "./withClass.ts";

interface ControlOptions
  extends Omit<ComponentPropsWithRef<"button">, "children" | "value" | "type"> {
  label: string;
  copiedLabel: string;
  showLabel?: boolean;
  variant?: "secondary" | "tertiary";
  size?: "small";
  onError?: (error: unknown) => void;
  href?: never;
  onHold?: never;
  holdDuration?: never;
  type?: never;
}

export interface CopyButtonProps extends ControlOptions {
  value: string | (() => string);
  onCopy?: () => void;
}

export interface ShareButtonProps extends ControlOptions {
  url: string;
  shareTitle?: string;
  text?: string;
  onShare?: () => void;
  onCopy?: () => void;
}

export type CopyFieldProps = Omit<InputProps, "value" | "defaultValue" | "readOnly" | "type"> &
  Pick<StackedFieldProps, "label" | "optional" | "description"> & {
    value: string;
    copyLabel: string;
    copiedLabel: string;
    onCopy?: () => void;
    onError?: (error: unknown) => void;
  };

const copyIcon = (
  <svg className="hcopy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {copy.map((d) => (
      <path key={d} d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </svg>
);

const shareIcon = (
  <svg className="hcopy-icon" viewBox="0 0 25 25" fill="none" aria-hidden="true" focusable="false">
    {share.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const doneIcon = (
  <svg className="hcopy-done" viewBox="4.85 4.88 16 16" fill="none" aria-hidden="true" focusable="false">
    {check.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

// For two seconds after it's done, the button says so; not if it has gone
// by then, such as with a menu that closed.
const useDone = () => {
  const [done, setDone] = useState(false);
  const [times, setTimes] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const confirm = () => {
    if (!mounted.current) return;
    setDone(true);
    setTimes((count) => count + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2000);
  };
  return { done, times, confirm };
};

// The button, its tooltip or its text, and the status. The action resolves
// true when it's done something the button should confirm.
const Control = ({
  icon,
  action,
  label,
  copiedLabel,
  showLabel,
  variant = showLabel ? "secondary" : "tertiary",
  size,
  onError,
  onClick,
  className,
  hidden,
  // Always a plain button, whatever a spread brings.
  href: _href,
  onHold: _onHold,
  holdDuration: _holdDuration,
  type: _type,
  ...props
}: ControlOptions & { icon: ReactNode; action: () => Promise<boolean> }) => {
  const { done, times, confirm } = useDone();
  const run = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    try {
      if (await action()) confirm();
    } catch (error) {
      onError?.(error);
    }
  };
  const icons = (
    <span className="hicon hcopy-icons" aria-hidden="true">
      {icon}
      {doneIcon}
    </span>
  );
  const button = (
    <Button
      {...props}
      className={withClass("hcopy", className)}
      variant={variant}
      size={size}
      hidden={showLabel ? hidden : undefined}
      data-copied={done ? "" : undefined}
      onClick={run}
    >
      {icons}
      {showLabel && (done ? copiedLabel : label)}
    </Button>
  );

  return (
    <>
      {showLabel ? (
        button
      ) : (
        <Tooltip label={done ? copiedLabel : label} data-open={done ? "" : undefined} hidden={hidden}>
          {button}
        </Tooltip>
      )}
      <span className="hcopy-status" role="status" hidden={hidden}>
        {done ? `${copiedLabel}${times % 2 ? "" : "\u00a0"}` : null}
      </span>
    </>
  );
};

export const CopyButton = ({ value, onCopy, ...props }: CopyButtonProps) => (
  <Control
    {...props}
    icon={copyIcon}
    action={async () => {
      await navigator.clipboard.writeText(typeof value === "function" ? value() : value);
      onCopy?.();
      return true;
    }}
  />
);

// The device's share sheet where the browser has one; elsewhere, it copies
// the link, and says so.
export const ShareButton = ({ url, shareTitle, text, onShare, onCopy, ...props }: ShareButtonProps) => (
  <Control
    {...props}
    icon={shareIcon}
    action={async () => {
      const data = { url, title: shareTitle, text };
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        try {
          await navigator.share(data);
          onShare?.();
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
        }
        return false;
      }
      await navigator.clipboard.writeText(url);
      onCopy?.();
      return true;
    }}
  />
);

export const CopyField = ({
  label,
  optional,
  description,
  value,
  copyLabel,
  copiedLabel,
  onCopy,
  onError,
  hidden,
  disabled,
  ...props
}: CopyFieldProps) => (
  <Field label={label} htmlFor={props.id} optional={optional} description={description} hidden={hidden}>
    <div className="hcopy-field">
      <Input {...props} type="text" readOnly disabled={disabled} value={value} />
      <FieldContext value={{}}>
        <CopyButton
          size="small"
          value={value}
          label={copyLabel}
          copiedLabel={copiedLabel}
          disabled={disabled}
          onCopy={onCopy}
          onError={onError}
        />
      </FieldContext>
    </div>
  </Field>
);
