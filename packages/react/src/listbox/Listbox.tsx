"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { search as searchPaths } from "../icons.ts";
import { popupTrigger } from "../Popup.tsx";
import { withClass } from "../withClass.ts";

export type ListboxSelection =
  | {
      multiple?: false;
      value?: string | null;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
    }
  | {
      multiple: true;
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
    };

export type ListboxSearch =
  | { searchLabel?: undefined; emptyMessage?: ReactNode }
  | { searchLabel: string; emptyMessage: ReactNode };

export type ListboxProps = Omit<ComponentPropsWithRef<"ul">, "defaultValue"> &
  ListboxSelection &
  ListboxSearch & {
    footer?: ReactNode;
  };

interface ListboxState {
  multiple: boolean;
  query: string;
  mark: string;
  activeId: string | null;
  isSelected: (value: string) => boolean;
  highlight: (id: string | null) => void;
  choose: (value: string) => void;
}

const ListboxContext = createContext<ListboxState | undefined>(undefined);

export const SelectContext = createContext<
  { named: boolean; across?: boolean } | undefined
>(undefined);

// An OptionGroup around an option: whether a query filters it, and whether
// the app hides the group, and so the option.
export const GroupContext = createContext<{ filter: boolean; hidden: boolean }>(
  { filter: true, hidden: false },
);

// A Combobox around the list: its field takes the list's keys and names the
// active option, and its text filters the options. In pick mode, the first
// match is highlighted as you type; every pick is reported, even of the
// option already chosen, so the field can show it again. A CommandMenu
// marks what's typed in the options, and its list may be in a dialog
// rather than a popup.
export interface ComboboxState {
  input: RefObject<HTMLInputElement | null>;
  query: string;
  mark?: string;
  autoHighlight: boolean;
  onChoose: (value: string) => void;
  // Whether the list has anything to show: an option, or a message.
  canOpen: () => boolean;
}

export const ComboboxContext = createContext<ComboboxState | undefined>(
  undefined,
);

export const useListbox = () => {
  const listbox = useContext(ListboxContext);
  if (!listbox) throw new Error("Options belong inside a Listbox.");
  return listbox;
};

export const Listbox = ({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  searchLabel,
  emptyMessage,
  footer,
  ref,
  id,
  className,
  children,
  onKeyDown,
  onPointerMove,
  onPointerLeave,
  ...props
}: ListboxProps) => {
  const generatedId = useId();
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement, []);
  const search = useRef<HTMLInputElement>(null);
  const searchable = searchLabel !== undefined;
  const listId = id ?? (searchable ? generatedId : undefined);
  const select = useContext(SelectContext);
  const combobox = useContext(ComboboxContext);
  // The Combobox as it is now, for listeners set up once.
  const comboboxNow = useRef(combobox);
  comboboxNow.current = combobox;
  // Typing goes to a text field, the search row's or the Combobox's, so
  // letters don't jump through the list and Home and End move the caret.
  const typing = searchable || combobox !== undefined;

  const [uncontrolled, setUncontrolled] = useState(() => toList(defaultValue));
  const selected = value === undefined ? uncontrolled : toList(value);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useRef<string | null>(null);
  const setActive = (id: string | null) => {
    active.current = id;
    setActiveId(id);
  };
  const [query, setQuery] = useState("");
  const [empty, setEmpty] = useState(false);
  const [triggerOwned, setTriggerOwned] = useState(
    select !== undefined && !typing,
  );

  const trigger = useRef<HTMLElement | null>(null);
  const opening = useRef<HTMLElement | null>(null);
  const swallowSpace = useRef(false);
  const typed = useRef("");
  const typedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyDown = useRef<(event: KeyboardEvent) => void>(() => {});
  // The pointer has moved in the list: only then does leaving it clear the
  // highlight. A list that opens or shifts under a pointer at rest isn't
  // being pointed at, so the keyboard's highlight stays.
  const pointing = useRef(false);

  const popupOf = () => list.current?.closest<HTMLElement>(".hpopup") ?? null;
  // What shows the list and hides it: its popup, or the dialog a
  // Combobox's field and list share, such as a CommandMenu's.
  const containerOf = () =>
    popupOf() ??
    (combobox ? (list.current?.closest<HTMLElement>("dialog") ?? null) : null);

  const enabled = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLElement>(
        '.hoption:not([aria-disabled="true"], [hidden], .hoption-group[hidden] .hoption)',
      ) ?? [],
    );

  const highlight = (option?: HTMLElement | null) => {
    setActive(option?.id ?? null);
    option?.scrollIntoView({ block: "nearest" });
  };

  const choose = (item: string) => {
    if (!multiple) popupOf()?.hidePopover();
    combobox?.onChoose(item);
    if (!multiple && selected[0] === item) return;
    const next = !multiple
      ? [item]
      : selected.includes(item)
        ? selected.filter((other) => other !== item)
        : [...selected, item];
    setUncontrolled(next);
    (onValueChange as ((value: string | string[]) => void) | undefined)?.(
      multiple ? next : item,
    );
  };

  const findTyped = (key: string) => {
    clearTimeout(typedTimer.current);
    typedTimer.current = setTimeout(() => (typed.current = ""), 500);
    typed.current += key.toLowerCase();
    const cycling = [...typed.current].every(
      (letter) => letter === typed.current[0],
    );
    const text = cycling ? typed.current[0] : typed.current;
    const options = enabled();
    const current = options.findIndex((option) =>
      active.current
        ? option.id === active.current
        : option.getAttribute("aria-selected") === "true",
    );
    const start = current < 0 ? 0 : current + (cycling ? 1 : 0);
    return [...options.slice(start), ...options.slice(0, start)].find(
      (option) => labelOf(option).startsWith(text),
    );
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || event.keyCode === 229) return;
    const popup = popupOf();
    const open = popup?.matches(":popover-open") ?? true;
    const typeahead =
      !typing &&
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.key !== " " || typed.current !== "");
    const options = typeahead ? [] : enabled();
    const index = options.findIndex((option) => option.id === active.current);
    let next: HTMLElement | undefined;

    if (typeahead) {
      next = findTyped(event.key);
      if (triggerOwned) swallowSpace.current = event.key === " ";
      event.preventDefault();
      if (!next) return;
    } else {
      switch (event.key) {
        case "ArrowDown":
          next =
            index < 0
              ? options[0]
              : options[Math.min(index + 1, options.length - 1)];
          break;
        case "ArrowUp":
          next =
            index < 0 ? options.at(-1) : options[Math.max(index - 1, 0)];
          break;
        case "ArrowRight":
        case "ArrowLeft": {
          if (!select?.across || typing || !open) return;
          const rtl = list.current ? getComputedStyle(list.current).direction === "rtl" : false;
          const back = (event.key === "ArrowLeft") !== rtl;
          next =
            index < 0
              ? back
                ? options.at(-1)
                : options[0]
              : options[back ? Math.max(index - 1, 0) : Math.min(index + 1, options.length - 1)];
          break;
        }
        case "Home":
          if (typing) return;
          next = options[0];
          break;
        case "End":
          if (typing) return;
          next = options.at(-1);
          break;
        case "Enter":
        case " ":
          if (event.key === " " && typing) return;
          if (!open) return;
          if (!active.current) {
            if (searchable) event.preventDefault();
            return;
          }
          event.preventDefault();
          if (triggerOwned) swallowSpace.current = event.key === " ";
          document.getElementById(active.current)?.click();
          return;
        case "Tab":
          if (open && (triggerOwned || combobox)) popup?.hidePopover();
          return;
        default:
          return;
      }
      event.preventDefault();
    }

    if (!open) {
      // A Combobox's field opens on Down, at the chosen option or the first,
      // and on Up, at the last, as in the WAI-ARIA editable combobox.
      if (combobox) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const chosen = options.find(
          (option) => option.getAttribute("aria-selected") === "true",
        );
        if (!combobox.canOpen()) return;
        opening.current =
          (event.key === "ArrowUp" ? options.at(-1) : (chosen ?? options[0])) ?? null;
        popup?.showPopover();
        return;
      }
      if (!triggerOwned) return;
      const keyed: Record<string, HTMLElement | undefined> = {
        ArrowUp: options[0],
        Home: options[0],
        End: options.at(-1),
      };
      opening.current = (typeahead ? next : keyed[event.key]) ?? null;
      popup?.showPopover();
      return;
    }
    highlight(next);
  };

  useLayoutEffect(() => {
    keyDown.current = handleKeyDown;
  });

  useEffect(() => {
    const popup = containerOf();
    if (!popup) return;
    const opener = popup.matches(".hpopup") ? popupTrigger(popup) : undefined;
    const owned = !typing && opener?.getAttribute("role") === "combobox";
    trigger.current = combobox
      ? combobox.input.current
      : owned
        ? (opener ?? null)
        : null;
    setTriggerOwned(owned);

    const keydown = (event: KeyboardEvent) => keyDown.current(event);
    const keyup = (event: KeyboardEvent) => {
      if (event.key !== " " || !swallowSpace.current) return;
      event.preventDefault();
      swallowSpace.current = false;
    };

    const beforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") {
        setActive(null);
        clearTimeout(typedTimer.current);
        typed.current = "";
        opening.current = null;
        return;
      }
      if (search.current) {
        search.current.value = "";
        flushSync(() => setQuery(""));
      }
      const chosen = list.current?.querySelector<HTMLElement>(
        '.hoption[aria-selected="true"]:not([aria-disabled="true"], [hidden])',
      );
      // Free text highlights nothing until a key asks, so Enter keeps what
      // was typed.
      const now = comboboxNow.current;
      const initial = now && !now.autoHighlight ? null : (chosen ?? enabled()[0]);
      setActive((opening.current ?? initial)?.id ?? null);
      opening.current = null;
    };

    const toggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      if (!owned && !combobox) (search.current ?? list.current)?.focus();
      if (active.current) {
        document.getElementById(active.current)?.scrollIntoView({ block: "nearest" });
      }
      requestAnimationFrame(() => updateTitles(list.current));
    };

    let frame = 0;
    const resize = () => {
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        if (isShown(popup)) updateTitles(list.current);
      });
    };

    const owner = trigger.current;
    owner?.addEventListener("keydown", keydown);
    owner?.addEventListener("keyup", keyup);
    popup.addEventListener("beforetoggle", beforeToggle, true);
    popup.addEventListener("toggle", toggle);
    addEventListener("resize", resize);
    return () => {
      owner?.removeEventListener("keydown", keydown);
      owner?.removeEventListener("keyup", keyup);
      owner?.removeAttribute("aria-activedescendant");
      popup.removeEventListener("beforetoggle", beforeToggle, true);
      popup.removeEventListener("toggle", toggle);
      removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [searchable, combobox === undefined]);

  useEffect(() => {
    if (!trigger.current) return;
    if (activeId) trigger.current.setAttribute("aria-activedescendant", activeId);
    else trigger.current.removeAttribute("aria-activedescendant");
  }, [activeId, triggerOwned]);

  // The options showing, to notice when they change, such as results that
  // arrive after the text was typed.
  const shownBefore = useRef("");

  useLayoutEffect(() => {
    setEmpty(!list.current?.querySelector(".hoption:not([hidden])"));
    const open = isShown(containerOf());
    const options = enabled();
    const shown = options.map((option) => option.id).join(" ");
    const changed = shown !== shownBefore.current;
    shownBefore.current = shown;
    if (active.current && !options.some((option) => option.id === active.current)) {
      setActive(open ? (options[0]?.id ?? null) : null);
    } else if (!active.current && open && changed && combobox?.autoHighlight) {
      highlight(options[0]);
    }
  });

  const listQuery = combobox ? combobox.query : query;
  // What's typed: the query, or a Command Menu's text, which changes even
  // when it doesn't filter.
  const typedText = combobox?.mark ?? listQuery;

  // A new query highlights the first match. A Combobox's emptied one, such
  // as after a pick of one of several, keeps the highlighted option where it
  // still shows, rather than move it to the first.
  useLayoutEffect(() => {
    if (!isShown(containerOf())) return;
    const options = enabled();
    const autoHighlight = !combobox || combobox.autoHighlight;
    const kept =
      combobox !== undefined &&
      typedText === "" &&
      autoHighlight &&
      options.some((option) => option.id === active.current);
    if (kept) highlight(document.getElementById(active.current as string));
    else highlight(autoHighlight ? options[0] : null);
    requestAnimationFrame(() => updateTitles(list.current));
  }, [listQuery, typedText]);

  const listOwned = !typing && !triggerOwned;

  return (
    <ListboxContext
      value={{
        multiple,
        query: listQuery,
        mark: combobox?.mark ?? "",
        activeId,
        isSelected: (item) => selected.includes(item),
        highlight: setActive,
        choose,
      }}
    >
      {searchable && (
        <div className="hlistbox-search" hidden={props.hidden}>
          {searchIcon}
          <input
            ref={search}
            className="hlistbox-search-input"
            type="text"
            role="combobox"
            placeholder={searchLabel}
            aria-label={searchLabel}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId ?? undefined}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => handleKeyDown(event.nativeEvent)}
          />
        </div>
      )}
      <ul
        {...props}
        ref={list}
        className={withClass("hlistbox", className)}
        id={listId}
        role="listbox"
        aria-multiselectable={multiple || undefined}
        aria-activedescendant={listOwned ? (activeId ?? undefined) : undefined}
        tabIndex={listOwned ? -1 : undefined}
        onKeyDown={(event) => {
          if (listOwned) handleKeyDown(event.nativeEvent);
          onKeyDown?.(event);
        }}
        onPointerMove={(event) => {
          pointing.current = true;
          onPointerMove?.(event);
        }}
        onPointerLeave={(event) => {
          if (pointing.current) setActive(null);
          pointing.current = false;
          onPointerLeave?.(event);
        }}
      >
        {children}
      </ul>
      {emptyMessage !== undefined && (
        // In the page from the start, as a status, so a screen reader reads
        // the message as it appears: a live region added with its text isn't
        // always read.
        <p className="hlistbox-empty" role="status" hidden={props.hidden}>
          {empty ? emptyMessage : null}
        </p>
      )}
      {footer && (
        <div className="hlistbox-footer" hidden={props.hidden}>
          {footer}
        </div>
      )}
    </ListboxContext>
  );
};

export const toList = (value?: string | string[] | null) =>
  value == null ? [] : Array.isArray(value) ? value : [value];

export const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
};

export interface OptionSummary {
  value: string;
  label: string;
  disabled: boolean;
  hidden: boolean;
  // What a query is matched against: the label, description, and keywords;
  // or nothing, in a group that isn't filtered.
  text: string | null;
}

export const optionsOf = (node: ReactNode): OptionSummary[] =>
  Children.toArray(node).flatMap((child) => {
    if (
      !isValidElement<{
        value?: unknown;
        disabled?: boolean;
        hidden?: boolean;
        filter?: boolean;
        description?: ReactNode;
        keywords?: readonly string[];
        children?: ReactNode;
      }>(child)
    ) {
      return [];
    }
    const { value, disabled, hidden, filter, description, keywords, children } =
      child.props;
    return typeof value === "string"
      ? [
          {
            value,
            label: textOf(children),
            disabled: Boolean(disabled),
            hidden: Boolean(hidden),
            text: searchText(children, description, keywords),
          },
        ]
      : optionsOf(children).map((option) => ({
          ...option,
          hidden: option.hidden || Boolean(hidden),
          text: filter === false ? null : option.text,
        }));
  });

// An option's label, description, and keywords, as one text a query is
// found in.
export const searchText = (
  label: ReactNode,
  description?: ReactNode,
  keywords?: readonly string[],
) => [textOf(label), textOf(description), ...(keywords ?? [])].join(" ");

export const matches = (query: string, text: ReactNode) =>
  textOf(text).toLowerCase().includes(query.trim().toLowerCase());

// Whether an option shows for a query: always in a group that isn't
// filtered.
export const shownFor = (query: string, option: OptionSummary) =>
  !option.hidden && (option.text === null || matches(query, option.text));

const isShown = (container: HTMLElement | null) =>
  container instanceof HTMLDialogElement
    ? container.open
    : (container?.matches(":popover-open") ?? false);

// An option's label as typing finds it, without its decorative parts, such as
// a flag before a name.
const labelOf = (option: HTMLElement) => {
  let label = option.querySelector(".hoption-label") ?? option;
  if (label.querySelector('[aria-hidden="true"]')) {
    label = label.cloneNode(true) as Element;
    for (const part of label.querySelectorAll('[aria-hidden="true"]')) part.remove();
  }
  return label.textContent?.trim().toLowerCase() ?? "";
};

const updateTitles = (list: HTMLElement | null) => {
  for (const label of list?.querySelectorAll<HTMLElement>(".hoption-label") ??
    []) {
    if (label.scrollWidth > label.clientWidth) {
      label.title = label.textContent?.trim() ?? "";
    } else {
      label.removeAttribute("title");
    }
  }
};

const searchIcon = (
  <svg
    className="hicon"
    width="1.125em"
    height="1.125em"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {searchPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);
