"use client";

import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { Field, useField } from "./field/Field.tsx";
import {
  ComboboxContext,
  Listbox,
  optionsOf,
  SelectContext,
  shownFor,
  type ListboxSelection,
} from "./listbox/Listbox.tsx";
import { placePopup } from "./Popup.tsx";
import { Tag, TagRemove } from "./Tag.tsx";
import { TagList, TagListContext } from "./TagList.tsx";
import type { ControlField, FormatCount } from "./types.ts";
import { withClass } from "./withClass.ts";

type ComboboxValue =
  | {
      multiple?: false;
      freeText?: false;
      value?: string | null;
      defaultValue?: string;
      onValueChange?: (value: string | null) => void;
      removeLabel?: never;
      moreLabel?: never;
      formatCount?: never;
    }
  | {
      multiple?: false;
      freeText: true;
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
      removeLabel?: never;
      moreLabel?: never;
      formatCount?: never;
    }
  | {
      multiple: true;
      freeText?: boolean;
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
      removeLabel: (label: string) => string;
      moreLabel: (count: number) => string;
      formatCount?: FormatCount;
    };

type ComboboxControlProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "type" | "onChange" | "children"
> &
  ComboboxValue & {
    inputValue?: string;
    onInputChange?: (text: string) => void;
    filter?: boolean;
    emptyMessage?: ReactNode;
    children?: ReactNode;
  };

export type ComboboxProps = ComboboxControlProps & ControlField;

export const Combobox = (comboboxProps: ComboboxProps) => {
  const { label, optional, description, error, hidden, ...props } =
    comboboxProps;
  if (label === undefined) return <ComboboxControl {...props} hidden={hidden} />;

  return (
    <Field
      label={label}
      control="combobox"
      optional={optional}
      description={description}
      hidden={hidden}
      {...("error" in comboboxProps && { error })}
    >
      <ComboboxControl {...props} />
    </Field>
  );
};

// The value in its three modes: one option picked, free text, or several,
// each held here unless the app holds it, and the app told of each change.
const useComboboxValue = (spec: ComboboxValue) => {
  const [pickedState, setPickedState] = useState<string | null>(() =>
    spec.multiple || spec.freeText ? null : (spec.defaultValue ?? null),
  );
  const [freeState, setFreeState] = useState(() =>
    !spec.multiple && spec.freeText ? (spec.value ?? spec.defaultValue ?? "") : "",
  );
  const [valuesState, setValuesState] = useState<string[]>(() =>
    spec.multiple ? (spec.defaultValue ?? []) : [],
  );

  const chosen =
    spec.multiple || spec.freeText ? null : spec.value === undefined ? pickedState : spec.value;
  const free = !spec.multiple && spec.freeText ? (spec.value ?? freeState) : "";
  const values = spec.multiple ? (spec.value ?? valuesState) : [];

  const choose = (item: string | null) => {
    setPickedState(item);
    if (!spec.multiple && !spec.freeText && item !== chosen) spec.onValueChange?.(item);
  };
  const setFree = (next: string) => {
    setFreeState(next);
    if (!spec.multiple && spec.freeText && next !== free) spec.onValueChange?.(next);
  };
  const changeValues = (next: string[]) => {
    setValuesState(next);
    if (spec.multiple) spec.onValueChange?.(next);
  };
  // Back to the value the page loaded with, telling the app only when the
  // value is held here.
  const restore = () => {
    if (spec.multiple) {
      const next = spec.defaultValue ?? [];
      setValuesState(next);
      if (spec.value === undefined && next.join("\n") !== valuesState.join("\n")) spec.onValueChange?.(next);
    } else if (spec.freeText) {
      const next = spec.defaultValue ?? "";
      setFreeState(next);
      if (spec.value === undefined && next !== freeState) spec.onValueChange?.(next);
    } else {
      const next = spec.defaultValue ?? null;
      setPickedState(next);
      if (spec.value === undefined && next !== pickedState) spec.onValueChange?.(next);
    }
  };

  return { chosen, free, values, choose, setFree, changeValues, restore };
};

const ComboboxControl = (controlProps: ComboboxControlProps) => {
  const {
    multiple = false,
    freeText = false,
    value,
    defaultValue,
    onValueChange,
    removeLabel,
    moreLabel,
    formatCount,
    inputValue,
    onInputChange,
    filter = true,
    emptyMessage,
    name,
    disabled,
    required,
    hidden,
    ref,
    className,
    children,
    onKeyDown,
    onBlur,
    onClick,
    onCompositionEnd,
    ...props
  } = controlProps;
  const { chosen, free, values, choose, setFree, changeValues, restore } = useComboboxValue(controlProps);
  const field = useField(props);
  const listId = useId();
  const popupId = useId();
  const anchor = `--${useId()}`;
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listKeys = useRef<((event: globalThis.KeyboardEvent) => void) | null>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement, []);
  const popup = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Choosing several, focus is in the field, on its text or a remove button:
  // every choice shows, in a row that scrolls, rather than "+N".
  const [editing, setEditing] = useState(false);
  // What's typed is being followed: the list opens once there's something to
  // show, such as results arriving from a search. Escape, Enter, a pick, and
  // leaving the field stop it, until the next keystroke.
  const following = useRef(false);

  // Each option's label, kept once a render with it is committed, so a choice
  // whose option is no longer among the children, such as after a new
  // search, keeps its label.
  const options = optionsOf(children);
  const known = useRef(new Map<string, string>());
  useLayoutEffect(() => {
    for (const option of options) known.current.set(option.value, option.label);
  });
  const labelOf = (item: string | null | undefined) =>
    item == null
      ? undefined
      : (options.find((option) => option.value === item)?.label ??
        known.current.get(item));

  // What's typed since the last pick. In pick mode, the field shows the
  // chosen option's label, from the options as they are now, except while
  // it's being typed in; so a value the app changes, or one whose option
  // arrives later, shows as it is. Choosing several, the text is only ever
  // what's typed, toward the next choice.
  const [typed, setTyped] = useState(false);
  const [draft, setDraft] = useState("");
  const shownText = multiple ? draft : freeText ? free : typed ? draft : (labelOf(chosen) ?? "");
  const text: string = inputValue ?? shownText;

  const report = (next: string) => {
    if (next !== text) onInputChange?.(next);
  };

  // The option typed text names, if it can be picked.
  const optionNamed = (typedText: string) => {
    const wanted = typedText.trim().toLowerCase();
    if (wanted === "") return undefined;
    return options.find(
      (option) =>
        !option.disabled &&
        !option.hidden &&
        option.label.trim().toLowerCase() === wanted,
    );
  };
  // Typed text as a choice: an option it names that can be picked, or, with
  // free text, the text itself.
  const resolve = (typedText: string) => {
    const wanted = typedText.trim();
    if (wanted === "") return null;
    const named = optionNamed(wanted);
    return named ? named.value : freeText ? wanted : null;
  };
  const addTyped = (texts: string[]) => {
    const next = [...values];
    for (const typedText of texts) {
      const item = resolve(typedText);
      if (item !== null && !next.includes(item)) next.push(item);
    }
    if (next.length !== values.length) changeValues(next);
    return texts.some((typedText) => resolve(typedText) !== null);
  };
  const remove = (item: string) =>
    changeValues(values.filter((other) => other !== item));
  const clearText = () => {
    setDraft("");
    report("");
  };

  // A pick: in pick mode it's the value, and the field shows its label; with
  // free text, its label becomes the text. Choosing several, a pick adds the
  // option, or takes it away when it's already chosen, and the text empties
  // for the next one, with the list left open.
  const pick = (item: string) => {
    if (isReadOnly()) return;
    if (multiple) {
      changeValues(
        values.includes(item)
          ? values.filter((other) => other !== item)
          : [...values, item],
      );
      clearText();
      return;
    }
    following.current = false;
    setTyped(false);
    const label = labelOf(item) ?? "";
    report(label);
    if (freeText) setFree(label);
    else choose(item);
  };

  // Leaving the field in pick mode after typing, or Enter with the list
  // closed: text naming an option that can be picked picks it, an empty
  // field clears the choice, and anything else gives way to the chosen
  // label, so the field never shows a value that isn't one. Choosing
  // several, the text becomes a choice if it can, and empties. Made
  // read-only while typed in, nothing is picked: the field goes back to the
  // choice, or, choosing several, empties.
  const settle = () => {
    if (isReadOnly()) {
      if (multiple) {
        if ((input.current?.value ?? text) !== "") clearText();
      } else if (!freeText && typed) {
        setTyped(false);
        report(labelOf(chosen) ?? "");
      }
      return;
    }
    if (multiple) {
      const current = input.current?.value ?? text;
      if (current.trim() !== "") {
        addTyped([current]);
        clearText();
      }
      return;
    }
    if (freeText || !typed) return;
    setTyped(false);
    const current = input.current?.value ?? text;
    if (current.trim() === "") {
      choose(null);
      report("");
      return;
    }
    const named = optionNamed(current);
    const next = named ? named.value : chosen;
    if (named) choose(named.value);
    report(labelOf(next) ?? "");
  };

  // A form reset restores the value the page loaded with, and, unless you
  // hold the value, tells you when that changes it; once it's happened,
  // since another listener may cancel it, and not if the field has gone by
  // then, such as when the reset closes what it's in.
  const resetting = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetting.current), []);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) => {
      clearTimeout(resetting.current);
      resetting.current = setTimeout(() => {
        if (event.defaultPrevented) return;
        following.current = false;
        setTyped(false);
        setDraft("");
        restore();
      });
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  });

  // The list opens only with something to show: an option the query
  // matches, or a message; with filter off, any option. Options you hide
  // don't count. A read-only field keeps its list closed, so nothing can be
  // picked, as does one a disabled fieldset disables.
  const query = filter && (typed || multiple) ? text : "";
  const isReadOnly = () => input.current?.readOnly ?? false;
  const isDisabled = () => input.current?.matches(":disabled") ?? false;
  const shows = (forQuery: string) => {
    if (isReadOnly() || isDisabled()) return false;
    return (
      emptyMessage !== undefined ||
      options.some((option) =>
        shownFor(filter ? forQuery : "", option),
      )
    );
  };

  // What's typed: it filters the list, and opens or closes it. With free
  // text, choosing several, a comma ends a choice, as when addresses are
  // typed or pasted in, and the space after it goes; not while an input
  // method is composing, which may use one.
  const enter = (entered: string, composing: boolean) => {
    let next = entered;
    let added = false;
    if (multiple && freeText && !composing && next.includes(",")) {
      const parts = next.split(",");
      next = (parts.pop() ?? "").trimStart();
      added = addTyped(parts);
    }
    setTyped(true);
    setDraft(next);
    report(next);
    if (freeText && !multiple) setFree(next);
    const forQuery = filter ? next : "";
    following.current = !(added && next.trim() === "");
    if (shows(forQuery) && following.current) open(forQuery);
    else close();
  };

  const isOpen = () => popup.current?.matches(":popover-open") ?? false;
  const open = (forQuery = query) => {
    if (!isOpen() && shows(forQuery)) popup.current?.showPopover();
  };
  const close = () => {
    if (isOpen()) popup.current?.hidePopover();
  };

  // Options that come or go, such as a search's results, count once they're
  // rendered: a list left with nothing to show closes, and one that has
  // something again opens, while what's typed is followed.
  useLayoutEffect(() => {
    if (!shows(query)) close();
    else if (following.current && input.current?.matches(":focus")) open();
  });

  // The choices' remove buttons, out of the Tab order: the arrow keys reach
  // them from the field, toward its start, and move between them.
  const removeButtons = () =>
    Array.from(
      box.current?.querySelectorAll<HTMLButtonElement>(
        ":scope > .htag-list > li > .htag > .htag-remove",
      ) ?? [],
    );
  const towardStart = () =>
    box.current && getComputedStyle(box.current).direction === "rtl"
      ? "ArrowRight"
      : "ArrowLeft";
  const towardEnd = () =>
    towardStart() === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
  const canRemove = !disabled && !props.readOnly;

  const onRemoveKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    item: string,
  ) => {
    const buttons = removeButtons();
    const field = input.current;
    if (event.key === towardStart()) {
      event.preventDefault();
      buttons[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === towardEnd()) {
      event.preventDefault();
      (buttons[index + 1] ?? field)?.focus();
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const next =
        event.key === "Backspace"
          ? (buttons[index - 1] ?? buttons[index + 1])
          : buttons[index + 1];
      (next ?? field)?.focus();
      remove(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      field?.focus();
    }
  };

  return (
    <>
      <div
        ref={box}
        className={withClass("hcombobox", className)}
        data-multiple={multiple ? "" : undefined}
        hidden={hidden}
        style={{ anchorName: anchor } as CSSProperties}
        // Choosing several, the box is the field: a press on it, between or
        // on the choices, keeps focus in the text, and a click opens the
        // list.
        onMouseDown={
          multiple
            ? (event) => {
                if (event.target !== input.current) event.preventDefault();
              }
            : undefined
        }
        onClick={
          multiple
            ? (event) => {
                const target = event.target as Element;
                if (isDisabled() || target === input.current) return;
                if (target.closest(".htag-remove")) return;
                input.current?.focus();
                open();
              }
            : undefined
        }
        onFocus={multiple ? () => setEditing(true) : undefined}
        onBlur={
          multiple
            ? (event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setEditing(false);
                }
              }
            : undefined
        }
      >
        {multiple && (
          <TagListContext value={{ editing }}>
            <TagList
              moreLabel={moreLabel ?? ((count) => `+${count}`)}
              formatCount={formatCount}
            >
              {values.map((item, index) => {
                const label = labelOf(item) ?? item;
                return (
                  <Tag key={item}>
                    {label}
                    <TagRemove
                      aria-label={removeLabel?.(label) ?? ""}
                      tabIndex={-1}
                      disabled={!canRemove}
                      onClick={(event) => {
                        if (document.activeElement === event.currentTarget) {
                          (removeButtons()[index + 1] ?? input.current)?.focus();
                        }
                        remove(item);
                      }}
                      onKeyDown={(event) => onRemoveKeyDown(event, index, item)}
                    />
                  </Tag>
                );
              })}
            </TagList>
          </TagListContext>
        )}
        <input
          {...props}
          {...field}
          ref={input}
          className="hinput"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={disabled ? undefined : listId}
          data-free-text={freeText ? "" : undefined}
          data-name={multiple || !freeText ? name : undefined}
          name={freeText && !multiple ? name : undefined}
          // Choosing several, the choices satisfy required, not the text:
          // required holds only while none is made, and aria-required says
          // it throughout.
          required={multiple ? Boolean(required) && values.length === 0 : required}
          aria-required={multiple && required ? true : undefined}
          value={text}
          disabled={disabled}
          onChange={(event) =>
            enter(event.target.value, (event.nativeEvent as InputEvent).isComposing)
          }
          onCompositionEnd={(event) => {
            onCompositionEnd?.(event);
            if (multiple && freeText) enter(event.currentTarget.value, false);
          }}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) open();
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.nativeEvent.defaultPrevented) return;
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            listKeys.current?.(event.nativeEvent);
            const readOnly = event.currentTarget.readOnly;
            if (multiple && text === "" && values.length && canRemove) {
              // Backspace takes the last choice away, and the arrow toward
              // the start moves to it. A held Backspace stops at the text.
              if (event.key === "Backspace" && !event.repeat) {
                event.preventDefault();
                remove(values.at(-1) as string);
                return;
              }
              if (event.key === towardStart()) {
                event.preventDefault();
                removeButtons().at(-1)?.focus();
                return;
              }
            }
            if (event.key === "Escape") {
              // Open, Escape closes the list; closed, it empties the field.
              // Either way it stops there, so a dialog around it stays open.
              following.current = false;
              if (isOpen()) {
                event.preventDefault();
                close();
              } else if (text !== "" && !readOnly) {
                event.preventDefault();
                setTyped(false);
                report("");
                if (multiple) setDraft("");
                else if (freeText) setFree("");
                else choose(null);
              }
              return;
            }
            if (event.key !== "Enter" || event.nativeEvent.defaultPrevented) return;
            // Choosing several, Enter with nothing highlighted makes the
            // text a choice, if it can be one, and doesn't send the form.
            if (multiple) {
              if (text.trim() !== "") {
                event.preventDefault();
                if (addTyped([text])) {
                  following.current = false;
                  clearText();
                  close();
                }
              } else if (isOpen()) {
                event.preventDefault();
                following.current = false;
                close();
              }
              return;
            }
            // Enter with nothing highlighted closes the list; in pick mode it
            // doesn't send the form, since nothing was picked.
            if (isOpen()) {
              following.current = false;
              if (!freeText) event.preventDefault();
              close();
              return;
            }
            // Closed, in pick mode after typing, Enter settles the text before
            // a form is sent, so it sends what the field shows. Text that
            // names no option gives way to the chosen label, and the form
            // isn't sent, as the field showed something else. Either way the
            // list stays closed until the next keystroke, though settling
            // brings back every option.
            following.current = false;
            if (!freeText && typed) {
              const current = event.currentTarget.value;
              if (readOnly || (current.trim() !== "" && !optionNamed(current))) {
                event.preventDefault();
              }
              flushSync(settle);
            }
          }}
          onBlur={(event) => {
            onBlur?.(event);
            following.current = false;
            close();
            settle();
          }}
        />
        <ExpandChevron />
      </div>
      {!disabled && (
        <div
          ref={popup}
          className="hpopup"
          id={popupId}
          popover="manual"
          style={{ positionAnchor: anchor } as CSSProperties}
          onBeforeToggle={(event) => {
            if (event.target !== event.currentTarget) return;
            setExpanded(event.newState === "open");
            placePopup(event.currentTarget, event.newState === "open");
          }}
          // Clicking in the list keeps focus in the field.
          onMouseDown={(event) => event.preventDefault()}
        >
          <SelectContext
            value={{ named: Boolean(name) && (multiple || !freeText) }}
          >
            <ComboboxContext
              value={{
                input,
                query,
                autoHighlight: !freeText,
                onChoose: pick,
                canOpen: () => shows(query),
                keys: listKeys,
              }}
            >
              <Listbox
                {...({
                  multiple,
                  value: multiple ? values : chosen,
                } as ListboxSelection)}
                id={listId}
                aria-labelledby={field["aria-labelledby"]}
                aria-label={
                  field["aria-labelledby"] ? undefined : props["aria-label"]
                }
                emptyMessage={emptyMessage}
              >
                {children}
              </Listbox>
            </ComboboxContext>
          </SelectContext>
        </div>
      )}
      {name &&
        multiple &&
        values.map((item) => (
          <input
            key={item}
            type="hidden"
            name={name}
            value={item}
            form={props.form}
            disabled={disabled}
          />
        ))}
      {name && !multiple && !freeText && (
        <input
          type="hidden"
          name={name}
          value={chosen ?? ""}
          form={props.form}
          disabled={disabled}
        />
      )}
    </>
  );
};
