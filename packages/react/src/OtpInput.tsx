"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
} from "react";
import { Field } from "./field/Field.tsx";
import { Input } from "./Input.tsx";
import type { ControlField } from "./types.ts";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

type OtpInputControlProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "value" | "defaultValue" | "maxLength" | "minLength" | "pattern" | "children"
> & {
  length?: number;
  characters?: "numeric" | "alphanumeric";
  groups?: readonly number[];
  value?: string;
  defaultValue?: string;
  onComplete?: (code: string) => void;
};

export type OtpInputProps = OtpInputControlProps & ControlField;

const lengthOf = (length: number) => (Number.isFinite(length) ? Math.min(12, Math.max(4, Math.round(length))) : 6);

// Only what a code can hold: digits, and with letters, letters in capitals.
// Fullwidth and Arabic digits become ASCII ones.
const cleanCode = (text: string, alphanumeric: boolean) => {
  const ascii = text
    .normalize("NFKC")
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)),
    );
  return alphanumeric ? ascii.replace(/[^0-9a-z]/gi, "").toUpperCase() : ascii.replace(/\D/g, "");
};

// Where typed or pasted text goes, and what of it fits: its characters go
// over those after the caret rather than pushing them along, up to the code's
// length, and a whole code replaces the one there.
const entryOf = (field: HTMLInputElement, text: string, length: number, alphanumeric: boolean) => {
  const entered = cleanCode(text, alphanumeric);
  const { value } = field;
  const whole = entered.length >= length;
  const start = whole ? 0 : (field.selectionStart ?? value.length);
  const selected = whole ? value.length : (field.selectionEnd ?? start);
  const end = start === selected ? Math.min(value.length, start + entered.length) : selected;
  return { text: entered.slice(0, length - value.length + end - start), start, end };
};

// Typed as the browser types, so it can be undone.
const insert = (field: HTMLInputElement, text: string, start: number, end: number) => {
  field.setSelectionRange(start, end);
  if (document.execCommand("insertText", false, text)) return;
  field.setRangeText(text, start, end, "end");
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

export const OtpInput = (otpProps: OtpInputProps) => {
  const { label, optional, description, error, hidden, ...props } = otpProps;
  if (label === undefined) return <OtpInputControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in otpProps && { error })}
    >
      <OtpInputControl {...props} />
    </Field>
  );
};

const OtpInputControl = ({
  length: requested = 6,
  characters = "numeric",
  groups,
  value,
  defaultValue,
  onComplete,
  onChange,
  onCompositionEnd,
  onFocus,
  onBlur,
  onSelect,
  onPointerDown,
  onMouseDown,
  onClick,
  ref,
  className,
  hidden,
  ...props
}: OtpInputControlProps) => {
  const length = lengthOf(requested);
  const alphanumeric = characters === "alphanumeric";
  const clean = (text: string) => cleanCode(text, alphanumeric).slice(0, length);
  const input = useRef<HTMLInputElement>(null);
  const inputRef = useMergedRef(input, ref);
  const row = useRef<HTMLDivElement>(null);
  const pointer = useRef("");
  const [typed, setTyped] = useState(() => clean(defaultValue ?? ""));
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState<readonly [number, number] | null>(null);
  const code = value === undefined ? typed : clean(value);

  useEffect(() => {
    setReady(true);
    const field = input.current;
    if (field && value === undefined && field.value !== typed) setTyped(clean(field.value));
  }, []);

  useEffect(() => {
    const field = input.current;
    if (!field) return;
    const beforeInput = (event: InputEvent) => {
      if (event.inputType !== "insertText" || event.data === null || field.readOnly) return;
      const entry = entryOf(field, event.data, length, alphanumeric);
      if (entry.text === event.data && entry.start === field.selectionStart && entry.end === field.selectionEnd) return;
      event.preventDefault();
      if (entry.text) insert(field, entry.text, entry.start, entry.end);
    };
    const paste = (event: ClipboardEvent) => {
      const pasted = event.clipboardData?.getData("text");
      if (pasted === undefined || field.readOnly) return;
      event.preventDefault();
      const entry = entryOf(field, pasted, length, alphanumeric);
      if (entry.text) insert(field, entry.text, entry.start, entry.end);
    };
    field.addEventListener("beforeinput", beforeInput);
    field.addEventListener("paste", paste);
    field.addEventListener("select", follow);
    return () => {
      field.removeEventListener("beforeinput", beforeInput);
      field.removeEventListener("paste", paste);
      field.removeEventListener("select", follow);
    };
  }, [length, alphanumeric]);

  useEffect(() => {
    const form = input.current?.form;
    if (!form || value !== undefined) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = (event: Event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!event.defaultPrevented) setTyped(clean(defaultValue ?? ""));
      });
    };
    form.addEventListener("reset", reset);
    return () => {
      form.removeEventListener("reset", reset);
      clearTimeout(timer);
    };
  }, [defaultValue, value === undefined, length, alphanumeric]);

  const follow = () => {
    const field = input.current;
    const next =
      field && field === document.activeElement
        ? ([field.selectionStart ?? 0, field.selectionEnd ?? 0] as const)
        : null;
    setSelection((current) => (current?.[0] === next?.[0] && current?.[1] === next?.[1] ? current : next));
  };

  // A press on a slot puts the caret there: on a character, it selects it, so
  // the next key replaces it; past what's typed, at the end, as a code has no
  // gaps. A mouse does it as it presses, so the caret doesn't land elsewhere
  // first; a touch, once it's let go, so the keyboard still opens.
  const place = (x: number) => {
    const field = input.current;
    const boxes = [...(row.current?.querySelectorAll(".hotp-input-slot") ?? [])].map((slot) =>
      slot.getBoundingClientRect(),
    );
    if (!field || boxes.length === 0) return;
    const distance = (box: DOMRect) => Math.max(box.left - x, 0, x - box.right);
    const index = boxes.reduce((best, box, at) => (distance(box) < distance(boxes[best]!) ? at : best), 0);
    const filled = field.value.length;
    if (index < filled) field.setSelectionRange(index, index + 1);
    else field.setSelectionRange(filled, filled);
    follow();
  };

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target;
    const composing = Boolean((event.nativeEvent as InputEvent).isComposing);
    const raw = field.value;
    const next = composing ? raw : clean(raw);
    if (next !== raw) {
      const caret = Math.min(next.length, clean(raw.slice(0, field.selectionStart ?? raw.length)).length);
      field.value = next;
      field.setSelectionRange(caret, caret);
    }
    if (value === undefined) setTyped(next);
    onChange?.(event);
    follow();
    if (!composing && next.length === length && next !== code) onComplete?.(next);
  };

  const separators = new Set<number>();
  let grouped = 0;
  for (const size of groups ?? []) {
    grouped += size;
    if (grouped > 0 && grouped < length) separators.add(grouped);
  }

  const active = (index: number) =>
    selection !== null &&
    (selection[0] === selection[1]
      ? index === Math.min(selection[0], length - 1)
      : index >= selection[0] && index < selection[1]);

  return (
    <div
      className={withClass("hotp-input", className)}
      dir="ltr"
      hidden={hidden}
      data-characters={alphanumeric ? "alphanumeric" : undefined}
      data-ready={ready ? "" : undefined}
    >
      <Input
        autoComplete="one-time-code"
        inputMode={alphanumeric ? "text" : "numeric"}
        autoCapitalize={alphanumeric ? "characters" : undefined}
        autoCorrect="off"
        spellCheck={false}
        {...props}
        ref={inputRef}
        type="text"
        maxLength={length}
        pattern={alphanumeric ? `[A-Za-z0-9]{${length}}` : `[0-9]{${length}}`}
        value={code}
        onChange={change}
        onCompositionEnd={(event) => {
          onCompositionEnd?.(event);
          const field = event.currentTarget;
          const next = clean(field.value);
          if (next === field.value) return;
          field.setRangeText(next, 0, field.value.length, "end");
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }}
        onFocus={(event) => {
          onFocus?.(event);
          follow();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setSelection(null);
        }}
        onSelect={(event) => {
          onSelect?.(event);
          follow();
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          pointer.current = event.pointerType;
        }}
        onMouseDown={(event) => {
          onMouseDown?.(event);
          if (event.defaultPrevented || event.button !== 0 || pointer.current !== "mouse") return;
          event.preventDefault();
          event.currentTarget.focus();
          place(event.clientX);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (pointer.current && pointer.current !== "mouse") place(event.clientX);
          pointer.current = "";
        }}
      />
      <div ref={row} className="hotp-input-slots" aria-hidden="true">
        {Array.from({ length }, (_, index) => (
          <Fragment key={index}>
            {separators.has(index) && <span className="hotp-input-separator" />}
            <span
              className="hotp-input-slot"
              data-filled={index < code.length ? "" : undefined}
              data-active={active(index) ? "" : undefined}
            >
              {code[index]}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
