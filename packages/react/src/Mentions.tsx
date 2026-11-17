"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";
import { Input, type InputProps } from "./Input.tsx";
import { ComboboxContext, Listbox, optionsOf, shownFor, type ListboxSelection } from "./listbox/Listbox.tsx";
import { TextArea, type TextAreaProps } from "./TextArea.tsx";
import { useMergedRef } from "./useMergedRef.ts";

interface MentionsOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  trigger?: string;
  atStart?: boolean;
  listLabel: string;
  side?: "top" | "bottom";
  children: ReactNode;
}

export type MentionsProps = MentionsOptions &
  (
    | ({ singleLine?: false } & Omit<TextAreaProps, keyof MentionsOptions>)
    | ({ singleLine: true } & Omit<InputProps, keyof MentionsOptions | "type">)
  );

type Field = HTMLTextAreaElement | HTMLInputElement;

interface FieldHandlers {
  ref?: Ref<Field>;
  onChange?: (event: ChangeEvent<Field>) => void;
  onKeyDown?: (event: KeyboardEvent<Field>) => void;
  onBlur?: (event: FocusEvent<Field>) => void;
  onSelect?: (event: SyntheticEvent<Field>) => void;
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const Mentions = ({
  value,
  defaultValue = "",
  onValueChange,
  trigger = "@",
  atStart = false,
  listLabel,
  side = "bottom",
  children,
  singleLine = false,
  ...fieldProps
}: MentionsProps) => {
  const { ref, onChange, onKeyDown, onBlur, onSelect, ...props } = fieldProps as FieldHandlers & Record<string, unknown>;
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const [token, setToken] = useState<{ start: number; end: number; query: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const field = useRef<Field>(null);
  const merged = useMergedRef(field, ref);
  const popup = useRef<HTMLDivElement>(null);
  const keys = useRef<((event: globalThis.KeyboardEvent) => void) | null>(null);
  const caret = useRef<number | null>(null);
  const id = useId();
  const anchor = `--${id}`;
  const listId = `${id}-list`;
  const listed = optionsOf(children);

  const tokenAt = (content: string, position: number) => {
    const before = content.slice(0, position);
    const pattern = atStart ? `^${escaped(trigger)}(\\S*)$` : `(?:^|\\s)${escaped(trigger)}(\\S*)$`;
    const match = new RegExp(pattern).exec(before);
    if (!match) return null;
    const query = match[1] ?? "";
    return { start: position - query.length - trigger.length, end: position, query };
  };

  const isOpen = () => popup.current?.matches(":popover-open") ?? false;
  const shows = (query: string) => listed.some((option) => shownFor(query, option));

  useLayoutEffect(() => {
    const element = popup.current;
    if (!element) return;
    const wanted = token !== null && !dismissed && shows(token.query) && field.current?.matches(":focus") === true;
    if (wanted && !isOpen()) element.showPopover();
    if (!wanted && isOpen()) element.hidePopover();
  });

  useLayoutEffect(() => {
    if (caret.current === null) return;
    field.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const tokenHere = (element: Field) => tokenAt(element.value, element.selectionStart ?? element.value.length);

  const choose = (chosen: string) => {
    const here = field.current && tokenHere(field.current);
    setToken(null);
    if (!here) return;
    const inserted = `${trigger}${chosen} `;
    caret.current = here.start + inserted.length;
    change(text.slice(0, here.start) + inserted + text.slice(here.end));
  };

  const shared = {
    ...props,
    ref: merged,
    value: text,
    "aria-autocomplete": "list" as const,
    "aria-controls": listId,
    onChange: (event: ChangeEvent<Field>) => {
      onChange?.(event);
      change(event.target.value);
      setDismissed(false);
      setToken(tokenHere(event.target));
    },
    onSelect: (event: SyntheticEvent<Field>) => {
      onSelect?.(event);
      const here = tokenHere(event.currentTarget);
      setToken((now) => (now?.start === here?.start && now?.end === here?.end ? now : here));
    },
    onKeyDown: (event: KeyboardEvent<Field>) => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        onKeyDown?.(event);
        return;
      }
      if (!isOpen()) {
        const opens = singleLine && (event.key === "ArrowDown" || event.key === "ArrowUp");
        if (opens && token && shows(token.query)) {
          event.preventDefault();
          setDismissed(false);
          return;
        }
        onKeyDown?.(event);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDismissed(true);
        return;
      }
      if (event.key === "Tab" && !event.shiftKey) {
        const active = event.currentTarget.getAttribute("aria-activedescendant");
        if (active) {
          event.preventDefault();
          document.getElementById(active)?.click();
          return;
        }
      }
      keys.current?.(event.nativeEvent);
      if (!event.nativeEvent.defaultPrevented) onKeyDown?.(event);
    },
    onBlur: (event: FocusEvent<Field>) => {
      onBlur?.(event);
      setDismissed(true);
    },
  };

  return (
    <div className="hmentions" style={{ anchorName: anchor } as CSSProperties}>
      {singleLine ? (
        <Input autoComplete="off" {...(shared as InputProps)} />
      ) : (
        <TextArea {...(shared as TextAreaProps)} />
      )}
      <div
        ref={popup}
        className="hpopup"
        popover="manual"
        data-side={side}
        style={{ positionAnchor: anchor } as CSSProperties}
        onMouseDown={(event) => event.preventDefault()}
      >
        <ComboboxContext
          value={{
            input: field,
            query: token?.query ?? "",
            autoHighlight: true,
            onChoose: choose,
            canOpen: () => token !== null && shows(token.query),
            keys,
          }}
        >
          <Listbox {...({ value: null } as ListboxSelection)} id={listId} aria-label={listLabel}>
            {children}
          </Listbox>
        </ComboboxContext>
      </div>
    </div>
  );
};
