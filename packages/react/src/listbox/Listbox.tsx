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
  activeId: string | null;
  isSelected: (value: string) => boolean;
  highlight: (id: string | null) => void;
  choose: (value: string) => void;
}

const ListboxContext = createContext<ListboxState | undefined>(undefined);

export const SelectContext = createContext<{ named: boolean } | undefined>(
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
    select !== undefined && !searchable,
  );

  const trigger = useRef<HTMLElement | null>(null);
  const opening = useRef<HTMLElement | null>(null);
  const swallowSpace = useRef(false);
  const typed = useRef("");
  const typedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyDown = useRef<(event: KeyboardEvent) => void>(() => {});

  const popupOf = () => list.current?.closest<HTMLElement>(".hpopup") ?? null;

  const enabled = () =>
    Array.from(
      list.current?.querySelectorAll<HTMLElement>(
        '.hoption:not([aria-disabled="true"], [hidden])',
      ) ?? [],
    );

  const highlight = (option?: HTMLElement | null) => {
    setActive(option?.id ?? null);
    option?.scrollIntoView({ block: "nearest" });
  };

  const choose = (item: string) => {
    if (!multiple) popupOf()?.hidePopover();
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
      !searchable &&
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
        case "Home":
          if (searchable) return;
          next = options[0];
          break;
        case "End":
          if (searchable) return;
          next = options.at(-1);
          break;
        case "Enter":
        case " ":
          if (event.key === " " && searchable) return;
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
          if (open && triggerOwned) popup?.hidePopover();
          return;
        default:
          return;
      }
      event.preventDefault();
    }

    if (!open) {
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
    const popup = popupOf();
    if (!popup) return;
    const opener = popupTrigger(popup);
    const owned = !searchable && opener?.getAttribute("role") === "combobox";
    trigger.current = owned ? (opener ?? null) : null;
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
      setActive((opening.current ?? chosen ?? enabled()[0])?.id ?? null);
      opening.current = null;
    };

    const toggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      if (!owned) (search.current ?? list.current)?.focus();
      if (active.current) {
        document.getElementById(active.current)?.scrollIntoView({ block: "nearest" });
      }
      requestAnimationFrame(() => updateTitles(list.current));
    };

    let frame = 0;
    const resize = () => {
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        if (popup.matches(":popover-open")) updateTitles(list.current);
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
  }, [searchable]);

  useEffect(() => {
    if (!trigger.current) return;
    if (activeId) trigger.current.setAttribute("aria-activedescendant", activeId);
    else trigger.current.removeAttribute("aria-activedescendant");
  }, [activeId, triggerOwned]);

  useLayoutEffect(() => {
    setEmpty(!list.current?.querySelector(".hoption:not([hidden])"));
    if (active.current && !enabled().some((option) => option.id === active.current)) {
      const open = popupOf()?.matches(":popover-open");
      setActive(open ? (enabled()[0]?.id ?? null) : null);
    }
  });

  useLayoutEffect(() => {
    if (!list.current?.closest(".hpopup:popover-open")) return;
    highlight(enabled()[0]);
    requestAnimationFrame(() => updateTitles(list.current));
  }, [query]);

  const listOwned = !searchable && !triggerOwned;

  return (
    <ListboxContext
      value={{
        multiple,
        query,
        activeId,
        isSelected: (item) => selected.includes(item),
        highlight: setActive,
        choose,
      }}
    >
      {searchable && (
        <div className="hlistbox-search">
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
        onPointerLeave={(event) => {
          setActive(null);
          onPointerLeave?.(event);
        }}
      >
        {children}
      </ul>
      {empty && emptyMessage !== undefined && (
        <p className="hlistbox-empty">{emptyMessage}</p>
      )}
      {footer && <div className="hlistbox-footer">{footer}</div>}
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

export const optionsOf = (
  node: ReactNode,
): { value: string; label: string }[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ value?: unknown; children?: ReactNode }>(child)) {
      return [];
    }
    const { value, children } = child.props;
    return typeof value === "string"
      ? [{ value, label: textOf(children) }]
      : optionsOf(children);
  });

export const matches = (query: string, label: ReactNode) =>
  textOf(label).toLowerCase().includes(query.trim().toLowerCase());

const labelOf = (option: HTMLElement) =>
  (option.querySelector(".hoption-label") ?? option).textContent
    ?.trim()
    .toLowerCase() ?? "";

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
