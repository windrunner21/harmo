"use client";

import {
  isValidElement,
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
  type RefObject,
  type SyntheticEvent,
} from "react";
import { flatChildren } from "./children.ts";
import { Input, type InputProps } from "./Input.tsx";
import { refitPopup } from "./Popup.tsx";
import { ComboboxContext, Listbox, optionsOf, shownFor, type ListboxSelection, type OptionSummary } from "./listbox/Listbox.tsx";
import { mentionPattern } from "./mentionsIn.ts";
import { TextArea, type TextAreaProps } from "./TextArea.tsx";
import { useMergedRef } from "./useMergedRef.ts";

export interface MentionsTriggerProps {
  trigger: string;
  listLabel: string;
  atStart?: boolean;
  children: ReactNode;
}

export const MentionsTrigger = (_props: MentionsTriggerProps) => null;

interface MentionsOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  trigger?: string;
  atStart?: boolean;
  listLabel?: string;
  side?: "top" | "bottom";
  highlight?: boolean | RegExp;
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

interface Source {
  trigger: string;
  listLabel: string;
  atStart: boolean;
  children: ReactNode;
  options: OptionSummary[];
}

interface Token {
  trigger: string;
  start: number;
  end: number;
  query: string;
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const nothing = /(?!)/;

const sourcesOf = (
  children: ReactNode,
  single: { trigger: string; listLabel: string; atStart: boolean },
): Source[] => {
  const triggers = flatChildren(children).filter(
    (child) => isValidElement<MentionsTriggerProps>(child) && child.type === MentionsTrigger,
  ) as { props: MentionsTriggerProps }[];
  if (triggers.length === 0) return [{ ...single, children, options: optionsOf(children) }];
  return triggers.map(({ props }) => ({
    trigger: props.trigger,
    listLabel: props.listLabel,
    atStart: props.atStart ?? false,
    children: props.children,
    options: optionsOf(props.children),
  }));
};

export const Mentions = ({
  value,
  defaultValue = "",
  onValueChange,
  trigger = "@",
  atStart = false,
  listLabel = "",
  side = "bottom",
  highlight = true,
  children,
  singleLine = false,
  ...fieldProps
}: MentionsProps) => {
  const { ref, onChange, onKeyDown, onBlur, onSelect, ...props } = fieldProps as FieldHandlers & Record<string, unknown>;
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const [token, setToken] = useState<Token | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const field = useRef<Field>(null);
  const merged = useMergedRef(field, ref);
  const popups = useRef<(HTMLDivElement | null)[]>([]);
  const keys = useRef<RefObject<((event: globalThis.KeyboardEvent) => void) | null>[]>([]);
  const caret = useRef<number | null>(null);
  const id = useId();
  const anchor = `--${id}`;
  const sources = sourcesOf(children, { trigger, listLabel, atStart });
  // Each trigger once: the first of two the same is the one that counts.
  const indexOf = (each: string) => sources.findIndex((source) => source.trigger === each);
  const active = token ? indexOf(token.trigger) : -1;
  const listIdOf = (index: number) => (index === 0 ? `${id}-list` : `${id}-list-${index}`);
  while (keys.current.length < sources.length) keys.current.push({ current: null });

  // The trigger nearest the caret, and at the same place, the longest.
  const tokenAt = (content: string, position: number): Token | null => {
    const before = content.slice(0, position);
    let found: Token | null = null;
    for (const source of sources) {
      const pattern = source.atStart
        ? `^${escaped(source.trigger)}(\\S*)$`
        : `(?:^|\\s)${escaped(source.trigger)}(\\S*)$`;
      const match = new RegExp(pattern).exec(before);
      if (!match) continue;
      const query = match[1] ?? "";
      const start = position - query.length - source.trigger.length;
      if (!found || start > found.start || (start === found.start && source.trigger.length > found.trigger.length)) {
        found = { trigger: source.trigger, start, end: position, query };
      }
    }
    return found;
  };

  const openIndex = () => popups.current.findIndex((popup) => popup?.matches(":popover-open") ?? false);
  const shows = (index: number, query: string) =>
    sources[index]?.options.some((option) => shownFor(query, option)) ?? false;

  useLayoutEffect(() => {
    const focused = field.current?.matches(":focus") === true;
    popups.current.forEach((popup, index) => {
      if (!popup) return;
      const wanted = index === active && token !== null && !dismissed && shows(index, token.query) && focused;
      const open = popup.matches(":popover-open");
      if (wanted && !open) popup.showPopover();
      if (!wanted && open) popup.hidePopover();
    });
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

  const choose = (index: number, chosen: string) => {
    const here = field.current && tokenHere(field.current);
    setToken(null);
    const source = sources[index];
    if (!here || !source || here.trigger !== source.trigger) return;
    const inserted = `${source.trigger}${chosen} `;
    caret.current = here.start + inserted.length;
    change(text.slice(0, here.start) + inserted + text.slice(here.end));
  };

  const pattern =
    highlight instanceof RegExp
      ? highlight
      : highlight
        ? (mentionPattern(
            sources.map((source) => ({
              trigger: source.trigger,
              atStart: source.atStart,
              values: source.options.map((option) => option.value),
            })),
          ) ?? nothing)
        : undefined;
  // Turning the highlight on or off replaces the field, so the lists start
  // again with the new one.
  const fieldKind = pattern ? "marked" : "plain";

  const shared = {
    spellCheck: false,
    ...props,
    ref: merged,
    value: text,
    highlight: pattern,
    "aria-autocomplete": "list" as const,
    "aria-controls": listIdOf(Math.max(active, 0)),
    onChange: (event: ChangeEvent<Field>) => {
      onChange?.(event);
      change(event.target.value);
      setDismissed(false);
      setToken(tokenHere(event.target));
    },
    onSelect: (event: SyntheticEvent<Field>) => {
      onSelect?.(event);
      const here = tokenHere(event.currentTarget);
      setToken((now) =>
        now?.trigger === here?.trigger && now?.start === here?.start && now?.end === here?.end ? now : here,
      );
    },
    onKeyDown: (event: KeyboardEvent<Field>) => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        onKeyDown?.(event);
        return;
      }
      const open = openIndex();
      if (open === -1) {
        const opens = singleLine && (event.key === "ArrowDown" || event.key === "ArrowUp");
        if (opens && token && shows(active, token.query)) {
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
        const highlighted = event.currentTarget.getAttribute("aria-activedescendant");
        const option = highlighted ? popups.current[open]?.querySelector(`[id="${CSS.escape(highlighted)}"]`) : null;
        if (option instanceof HTMLElement) {
          event.preventDefault();
          option.click();
          return;
        }
      }
      keys.current[open]?.current?.(event.nativeEvent);
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
      {sources.map((source, index) => (
        <div
          key={`${fieldKind}-${index}-${source.trigger}`}
          ref={(element) => {
            popups.current[index] = element;
          }}
          className="hpopup"
          popover="manual"
          data-side={side}
          style={{ positionAnchor: anchor } as CSSProperties}
          onBeforeToggle={(event) => refitPopup(event.currentTarget, event.newState === "open")}
          onMouseDown={(event) => event.preventDefault()}
        >
          <ComboboxContext
            value={{
              input: field,
              query: index === active && token ? token.query : "",
              autoHighlight: true,
              onChoose: (chosen) => choose(index, chosen),
              canOpen: () => index === active && token !== null && shows(index, token.query),
              keys: keys.current[index],
            }}
          >
            <Listbox {...({ value: null } as ListboxSelection)} id={listIdOf(index)} aria-label={source.listLabel}>
              {source.children}
            </Listbox>
          </ComboboxContext>
        </div>
      ))}
    </div>
  );
};
