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
import { ExpandChevron } from "./ExpandChevron.tsx";
import { Field, useField, type StackedFieldProps } from "./field/Field.tsx";
import {
  ComboboxContext,
  Listbox,
  matches,
  optionsOf,
  SelectContext,
  type ListboxSelection,
} from "./listbox/Listbox.tsx";
import { placePopup } from "./Popup.tsx";
import { Tag, TagRemove } from "./Tag.tsx";
import { TagList, TagListContext } from "./TagList.tsx";
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
    }
  | {
      multiple?: false;
      freeText: true;
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
      removeLabel?: never;
      moreLabel?: never;
    }
  | {
      multiple: true;
      freeText?: boolean;
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
      removeLabel: (label: string) => string;
      moreLabel: (count: number) => string;
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

type ComboboxField =
  | ({ label: StackedFieldProps["label"] } & Partial<
      Pick<StackedFieldProps, "optional" | "description" | "error">
    >)
  | {
      label?: undefined;
      optional?: never;
      description?: never;
      error?: never;
    };

export type ComboboxProps = ComboboxControlProps & ComboboxField;

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

const ComboboxControl = ({
  multiple = false,
  freeText = false,
  value,
  defaultValue,
  onValueChange,
  removeLabel,
  moreLabel,
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
  ...props
}: ComboboxControlProps) => {
  const field = useField(props);
  const listId = useId();
  const popupId = useId();
  const anchor = `--${useId()}`;
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement, []);
  const popup = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Choosing several, focus is in the field, on its text or a remove button:
  // every choice shows, in a row that scrolls, rather than "+N".
  const [editing, setEditing] = useState(false);

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
  const changeValue = onValueChange as
    | ((value: string | null) => void)
    | undefined;

  // Pick mode: the chosen option, held here unless the app holds it.
  const [chosenState, setChosenState] = useState<string | null>(() =>
    multiple || freeText ? null : ((defaultValue as string | undefined) ?? null),
  );
  const chosen =
    multiple || freeText
      ? null
      : value === undefined
        ? chosenState
        : (value as string | null);

  // Free text: the text is the value, held here unless the app holds it.
  const [freeState, setFreeState] = useState(() =>
    freeText && !multiple
      ? ((value as string | undefined) ?? (defaultValue as string | undefined) ?? "")
      : "",
  );

  // Several: the choices, in the order they were made.
  const [valuesState, setValuesState] = useState<string[]>(() =>
    multiple ? ((defaultValue as string[] | undefined) ?? []) : [],
  );
  const values = multiple
    ? ((value as string[] | undefined) ?? valuesState)
    : [];

  // What's typed since the last pick. In pick mode, the field shows the
  // chosen option's label, from the options as they are now, except while
  // it's being typed in; so a value the app changes, or one whose option
  // arrives later, shows as it is. Choosing several, the text is only ever
  // what's typed, toward the next choice.
  const [typed, setTyped] = useState(false);
  const [draft, setDraft] = useState("");
  const shownText = multiple
    ? draft
    : freeText
      ? typeof value === "string"
        ? value
        : freeState
      : typed
        ? draft
        : (labelOf(chosen) ?? "");
  const text: string = inputValue ?? shownText;

  const choose = (item: string | null) => {
    setChosenState(item);
    if (item !== chosen) changeValue?.(item);
  };
  const setFree = (next: string) => {
    setFreeState(next);
    if (next !== shownText) changeValue?.(next);
  };
  const report = (next: string) => {
    if (next !== text) onInputChange?.(next);
  };

  const changeValues = (next: string[]) => {
    setValuesState(next);
    (onValueChange as ((value: string[]) => void) | undefined)?.(next);
  };
  // Typed text as a choice: an option it names that can be picked, or, with
  // free text, the text itself.
  const resolve = (typedText: string) => {
    const wanted = typedText.trim();
    if (wanted === "") return null;
    const named = options.find(
      (option) =>
        !option.disabled &&
        !option.hidden &&
        option.label.trim().toLowerCase() === wanted.toLowerCase(),
    );
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
    setTyped(false);
    const label = labelOf(item) ?? "";
    report(label);
    if (freeText) setFree(label);
    else choose(item);
  };

  // Leaving the field in pick mode, after typing: text naming an option that
  // can be picked picks it, an empty field clears the choice, and anything
  // else gives way to the chosen label, so the field never shows a value
  // that isn't one. Choosing several, the text becomes a choice if it can,
  // and empties.
  const settle = () => {
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
    const current = (input.current?.value ?? text).trim().toLowerCase();
    if (current === "") {
      choose(null);
      report("");
      return;
    }
    const named = options.find(
      (option) =>
        !option.disabled &&
        !option.hidden &&
        option.label.trim().toLowerCase() === current,
    );
    const next = named ? named.value : chosen;
    if (named) choose(named.value);
    report(labelOf(next) ?? "");
  };

  // A form reset restores the value the page loaded with.
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        setTyped(false);
        setDraft("");
        if (multiple) setValuesState((defaultValue as string[] | undefined) ?? []);
        else if (freeText) setFreeState((defaultValue as string | undefined) ?? "");
        else setChosenState((defaultValue as string | undefined) ?? null);
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);

  // The list opens only with something to show: an option the query
  // matches, or a message; with filter off, any option. Options you hide
  // don't count. A read-only field keeps its list closed, so nothing can be
  // picked.
  const query = filter && (typed || multiple) ? text : "";
  const isReadOnly = () => input.current?.readOnly ?? false;
  const shows = (forQuery: string) => {
    if (isReadOnly()) return false;
    const showing = options.filter((option) => !option.hidden);
    return (
      emptyMessage !== undefined ||
      (filter
        ? showing.some((option) => matches(forQuery, option.label))
        : showing.length > 0)
    );
  };

  const isOpen = () => popup.current?.matches(":popover-open") ?? false;
  const open = (forQuery = query) => {
    if (!isOpen() && shows(forQuery)) popup.current?.showPopover();
  };
  const close = () => {
    if (isOpen()) popup.current?.hidePopover();
  };

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
        className="hcombobox"
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
                if (disabled || target === input.current) return;
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
            <TagList moreLabel={moreLabel ?? ((count) => `+${count}`)}>
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
          className={withClass("hinput", className)}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={disabled ? undefined : listId}
          data-free-text={freeText ? "" : undefined}
          name={freeText && !multiple ? name : undefined}
          // Choosing several, the choices satisfy required, not the text:
          // required holds only while none is made, and aria-required says
          // it throughout.
          required={multiple ? Boolean(required) && values.length === 0 : required}
          aria-required={multiple && required ? true : undefined}
          value={text}
          disabled={disabled}
          onChange={(event) => {
            let next = event.target.value;
            // With free text, a comma ends a choice, as when addresses are
            // typed or pasted in, and the space after it goes.
            let added = false;
            if (multiple && freeText && next.includes(",")) {
              const parts = next.split(",");
              next = (parts.pop() ?? "").trimStart();
              added = addTyped(parts);
            }
            setTyped(true);
            setDraft(next);
            report(next);
            if (freeText && !multiple) setFree(next);
            const forQuery = filter ? next : "";
            if (shows(forQuery) && !(added && next.trim() === "")) open(forQuery);
            else close();
          }}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) open();
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
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
            if (event.key !== "Enter" || event.defaultPrevented) return;
            // Choosing several, Enter with nothing highlighted makes the
            // text a choice, if it can be one, and doesn't send the form.
            if (multiple) {
              if (text.trim() !== "") {
                event.preventDefault();
                if (addTyped([text])) {
                  clearText();
                  close();
                }
              } else if (isOpen()) {
                event.preventDefault();
                close();
              }
              return;
            }
            // Enter with nothing highlighted closes the list; in pick mode it
            // doesn't send the form, since nothing was picked.
            if (isOpen()) {
              if (!freeText) event.preventDefault();
              close();
            }
          }}
          onBlur={(event) => {
            onBlur?.(event);
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
