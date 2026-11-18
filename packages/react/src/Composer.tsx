"use client";

import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Button } from "./Button.tsx";
import { closeIcon } from "./closeIcon.tsx";
import { arrowUp, edit, paperclip } from "./icons.ts";
import { Mentions } from "./Mentions.tsx";
import { TextArea, type TextAreaProps } from "./TextArea.tsx";
import { Tooltip } from "./Tooltip.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

type FieldProps = Omit<TextAreaProps, "value" | "defaultValue" | "children" | "aria-label" | "onSubmit">;

interface ComposerOptions extends FieldProps {
  "aria-label": string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSend: (text: string) => void;
  sendLabel: string;
  canSend?: boolean;
  replying?: boolean;
  context?: ReactNode;
  files?: ReactNode;
  editing?: { title: ReactNode; text: ReactNode; cancelLabel: string; onCancel: () => void };
  onEditLast?: () => boolean;
  error?: ReactNode;
  note?: ReactNode;
}

type Stopping = { stopLabel?: undefined; onStop?: undefined } | { stopLabel: string; onStop: () => void };

type Attaching =
  | { attachLabel?: undefined; onFiles?: undefined; accept?: undefined }
  | { attachLabel: string; onFiles: (files: File[]) => void; accept?: string };

type Suggesting =
  | { children?: undefined; listLabel?: undefined; trigger?: undefined; atStart?: undefined }
  | { children: ReactNode; listLabel: string; trigger?: string; atStart?: boolean }
  | { children: ReactNode; listLabel?: undefined; trigger?: undefined; atStart?: undefined };

export type ComposerProps = ComposerOptions & Stopping & Attaching & Suggesting;

const SendIcon = ({ className }: { className: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {arrowUp.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const StopIcon = ({ className }: { className: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" />
  </svg>
);

const StrokeIcon = ({ className, d }: { className: string; d: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
);

export const Composer = ({
  value,
  defaultValue = "",
  onValueChange,
  onSend,
  sendLabel,
  canSend,
  replying = false,
  stopLabel,
  onStop,
  context,
  files,
  editing,
  onEditLast,
  attachLabel,
  onFiles,
  accept,
  error,
  note,
  children,
  listLabel,
  trigger,
  atStart,
  className,
  style,
  ref,
  onKeyDown,
  onPaste,
  "aria-describedby": describedBy,
  ...props
}: ComposerProps) => {
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const field = useRef<HTMLTextAreaElement>(null);
  const merged = useMergedRef(field, ref);
  const picker = useRef<HTMLInputElement>(null);
  const id = useId();
  const editingId = `${id}-editing`;
  const sendable = (canSend ?? text.trim() !== "") && !replying;
  const stoppable = onStop !== undefined;

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const send = () => {
    if (!sendable) return;
    onSend(text);
    if (value === undefined) setOwn("");
    field.current?.focus();
  };

  const keys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowUp" && !text && onEditLast) {
      if (!flushSync(onEditLast)) return;
      event.preventDefault();
      const element = field.current;
      element?.setSelectionRange(element.value.length, element.value.length);
      return;
    }
    if (event.key === "Escape" && editing) {
      event.preventDefault();
      editing.onCancel();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    send();
  };

  const paste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(event);
    const pasted = [...event.clipboardData.files];
    if (!onFiles || pasted.length === 0 || event.defaultPrevented) return;
    event.preventDefault();
    onFiles(pasted);
  };

  const fieldProps = {
    ...props,
    ref: merged,
    rows: props.rows ?? 1,
    "aria-describedby": [editing ? editingId : undefined, describedBy].filter(Boolean).join(" ") || undefined,
    onKeyDown: keys,
    onPaste: paste,
  };

  return (
    <form
      className={withClass("hcomposer", className)}
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <div className="hcomposer-box">
        {context !== undefined && <div className="hcomposer-context">{context}</div>}
        {editing && (
          <div className="hcomposer-editing">
            <StrokeIcon className="hicon" d={edit} />
            <div className="hcomposer-editing-text" id={editingId}>
              <p className="hcomposer-editing-title">{editing.title}</p>
              <p className="hcomposer-editing-quote">{editing.text}</p>
            </div>
            <Tooltip label={editing.cancelLabel}>
              <Button
                variant="tertiary"
                size="small"
                onClick={() => {
                  editing.onCancel();
                  field.current?.focus();
                }}
              >
                {closeIcon}
              </Button>
            </Tooltip>
          </div>
        )}
        {files}
        {onFiles && (
          <Tooltip label={attachLabel} className="hcomposer-attach">
            <Button variant="tertiary" onClick={() => picker.current?.click()}>
              <StrokeIcon className="hicon" d={paperclip} />
            </Button>
          </Tooltip>
        )}
        {children === undefined ? (
          <TextArea
            {...fieldProps}
            value={text}
            onChange={(event) => {
              props.onChange?.(event);
              change(event.target.value);
            }}
          />
        ) : (
          <Mentions
            {...fieldProps}
            listLabel={listLabel}
            trigger={trigger}
            atStart={atStart}
            side="top"
            value={text}
            onValueChange={change}
          >
            {children}
          </Mentions>
        )}
        {stoppable ? (
          <Tooltip label={replying ? stopLabel : sendLabel}>
            <Button
              type={replying ? "button" : "submit"}
              data-stopping={replying ? "" : undefined}
              disabled={!replying && !sendable}
              onClick={() => {
                if (!replying) return;
                onStop();
                field.current?.focus();
              }}
            >
              <span className="hicon hcomposer-send-icons" aria-hidden="true">
                <SendIcon className="hcomposer-send-icon" />
                <StopIcon className="hcomposer-stop-icon" />
              </span>
            </Button>
          </Tooltip>
        ) : (
          <Tooltip label={sendLabel}>
            <Button type="submit" disabled={!sendable}>
              <SendIcon className="hicon" />
            </Button>
          </Tooltip>
        )}
      </div>
      {onFiles && (
        <input
          ref={picker}
          type="file"
          multiple
          accept={accept}
          hidden
          onChange={(event) => {
            onFiles([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      )}
      {(onFiles || error !== undefined) && (
        <p className="herror" aria-live="polite">
          {error}
        </p>
      )}
      {note !== undefined && <p className="hcomposer-note">{note}</p>}
    </form>
  );
};
