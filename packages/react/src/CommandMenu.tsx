"use client";

import {
  isValidElement,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Kbd } from "./Kbd.tsx";
import {
  ComboboxContext,
  Listbox,
  optionsOf,
  shownFor,
} from "./listbox/Listbox.tsx";
import { useModal } from "./modal.tsx";
import { placePopup } from "./Popup.tsx";
import { searchIcon } from "./Search.tsx";
import { withClass } from "./withClass.ts";

export interface CommandMenuShortcut {
  keys: string;
  label: ReactNode | { apple: ReactNode; other: ReactNode };
}

type CommandMenuLayout =
  | { modal?: false; open?: never; onOpenChange?: never }
  | { modal: true; open?: boolean; onOpenChange?: (open: boolean) => void };

export type CommandMenuProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "type" | "onChange" | "children" | "aria-label"
> &
  CommandMenuLayout & {
    label: string;
    shortcut?: CommandMenuShortcut;
    inputValue?: string;
    onInputChange?: (text: string) => void;
    onPick?: (value: string) => void;
    filter?: boolean;
    emptyMessage?: ReactNode;
    hints?: ReactNode;
    children?: ReactNode;
  };

export const CommandMenu = ({
  label,
  modal = false,
  open,
  onOpenChange,
  shortcut,
  inputValue,
  onInputChange,
  onPick,
  filter = true,
  emptyMessage,
  hints,
  placeholder,
  disabled,
  hidden,
  ref,
  className,
  children,
  onKeyDown,
  onClick,
  onBlur,
  ...props
}: CommandMenuProps) => {
  const listId = useId();
  const dialogId = useId();
  const anchor = `--${useId()}`;
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement, []);
  const popup = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const apple = useApple();

  // What's typed, held here unless the app holds it.
  const [draft, setDraft] = useState("");
  const text = inputValue ?? draft;
  const report = (next: string) => {
    setDraft(next);
    if (next !== text) onInputChange?.(next);
  };

  const dialog = useModal({
    open,
    onOpenChange,
    // Each opening starts from an empty field, and the whole list.
    onToggle: (event) => {
      if (event.newState === "closed") report("");
    },
  });

  // The list opens with something to show: an option the text matches, or
  // a message.
  const options = optionsOf(children);
  const query = filter ? text : "";
  const shows = (forQuery: string) =>
    !input.current?.readOnly &&
    (emptyMessage !== undefined ||
      options.some((option) => shownFor(forQuery, option)));
  const isOpen = () => popup.current?.matches(":popover-open") ?? false;
  const show = (forQuery = query) => {
    if (!isOpen() && shows(forQuery)) popup.current?.showPopover();
  };
  const hide = () => {
    if (isOpen()) popup.current?.hidePopover();
  };

  // A pick closes the list and empties the field, or closes the dialog as
  // Escape does, which empties it once it's closed, so the list doesn't
  // change as it fades. Then the app goes where it leads.
  const pick = (value: string) => {
    if (modal) {
      const element = dialog.current;
      if (element?.requestClose) element.requestClose();
      else element?.close();
    } else {
      report("");
      hide();
    }
    onPick?.(value);
  };

  // The shortcut opens the dialog, or reaches the field and opens its list;
  // pressed again, it takes focus back to the field. A hidden or disabled
  // menu leaves the key to the page, and the browser.
  const keys = shortcut ? parseKeys(shortcut.keys) : null;
  const reach = useEffectEvent((event: KeyboardEvent) => {
    const field = input.current;
    if (!field || disabled || hidden) return;
    event.preventDefault();
    if (modal && !dialog.current?.open) {
      dialog.current?.showModal();
      return;
    }
    field.focus();
    field.select();
    show();
  });
  useEffect(() => {
    if (!keys) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (pressed(event, keys)) reach(event);
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [shortcut?.keys]);

  // Hidden while it's open, the list or the dialog closes.
  useEffect(() => {
    if (!hidden) return;
    hide();
    if (dialog.current?.open) dialog.current.close();
  }, [hidden]);

  const shortcutLabel = shortcut && (
    <Kbd aria-hidden="true">
      {isPair(shortcut.label)
        ? apple
          ? shortcut.label.apple
          : shortcut.label.other
        : shortcut.label}
    </Kbd>
  );
  const keyshortcuts = keys ? ariaKeys(keys, apple) : undefined;

  const field = (
    <input
      {...props}
      ref={input}
      className={withClass(modal ? "hlistbox-search-input" : "hinput", className)}
      type="text"
      role="combobox"
      autoComplete="off"
      aria-autocomplete="list"
      aria-expanded={modal ? true : expanded}
      aria-controls={disabled ? undefined : listId}
      aria-label={label}
      aria-keyshortcuts={modal ? undefined : keyshortcuts}
      placeholder={placeholder}
      disabled={disabled}
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        report(next);
        if (modal) return;
        if (shows(filter ? next : "")) show(filter ? next : "");
        else hide();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!modal && !event.defaultPrevented) show();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.defaultPrevented) return;
        // In the dialog, Escape closes it, as the browser does. Under a
        // field, it closes the list; closed, it empties the field.
        if (event.key === "Escape" && !modal) {
          if (isOpen()) {
            event.preventDefault();
            hide();
          } else if (text !== "" && !event.currentTarget.readOnly) {
            event.preventDefault();
            report("");
          }
          return;
        }
        // Enter with nothing highlighted doesn't send a form around it.
        if (event.key === "Enter") event.preventDefault();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (modal) return;
        hide();
        // Leaving the field empties it; leaving the window doesn't, and a
        // read-only field keeps its text.
        if (document.hasFocus() && !event.currentTarget.readOnly) report("");
      }}
    />
  );

  const list = (
    <ComboboxContext
      value={{
        input,
        query,
        mark: text,
        autoHighlight: true,
        onChoose: pick,
        canOpen: () => shows(query),
      }}
    >
      <Listbox
        value={null}
        id={listId}
        aria-label={label}
        emptyMessage={emptyMessage}
      >
        {children}
      </Listbox>
    </ComboboxContext>
  );
  const footer = hints && <div className="hcommand-menu-footer">{hints}</div>;

  if (modal) {
    return (
      <>
        <button
          {...{ commandfor: dialogId, command: "show-modal" }}
          className="hcommand-menu-trigger"
          type="button"
          aria-haspopup="dialog"
          aria-keyshortcuts={keyshortcuts}
          disabled={disabled}
          hidden={hidden}
        >
          {searchIcon}
          <span className="hcommand-menu-trigger-label">
            {placeholder?.trim() ? placeholder : label}
          </span>
          {shortcutLabel}
        </button>
        <dialog
          ref={dialog}
          id={dialogId}
          className="hdialog hcommand-menu"
          closedby="any"
          aria-label={label}
        >
          <div className="hlistbox-search">
            {searchIcon}
            {field}
          </div>
          {list}
          {footer}
        </dialog>
      </>
    );
  }

  return (
    <>
      <div
        className="hsearch"
        hidden={hidden}
        style={{ anchorName: anchor } as CSSProperties}
      >
        {searchIcon}
        {field}
        {shortcutLabel}
      </div>
      {!disabled && (
        <div
          ref={popup}
          className="hpopup hcommand-menu"
          popover="manual"
          style={{ positionAnchor: anchor } as CSSProperties}
          onBeforeToggle={(event) => {
            setExpanded(event.newState === "open");
            placePopup(event.currentTarget, event.newState === "open");
          }}
          // Clicking in the list keeps focus in the field.
          onMouseDown={(event) => event.preventDefault()}
        >
          {list}
          {footer}
        </div>
      )}
    </>
  );
};

interface Keys {
  key: string;
  mod: boolean;
  control: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

const modifiers = ["Mod", "Control", "Meta", "Shift", "Alt"];

// A shortcut as aria-keyshortcuts writes it, with Mod for ⌘ on Apple
// devices and Ctrl elsewhere: "Mod+K", "Control+K", or "/" alone. A
// modifier it doesn't know is a mistake, not a key to leave out.
const parseKeys = (keys: string): Keys => {
  const parts = keys.split("+");
  const key = parts.pop() || "+";
  const unknown = parts.find((part) => !modifiers.includes(part));
  if (unknown !== undefined) {
    throw new Error(
      `CommandMenu's shortcut "${keys}" has "${unknown}"; use ${modifiers.join(", ")}`,
    );
  }
  return {
    key: key.toLowerCase(),
    mod: parts.includes("Mod"),
    control: parts.includes("Control"),
    meta: parts.includes("Meta"),
    shift: parts.includes("Shift"),
    alt: parts.includes("Alt"),
  };
};

// A key alone, such as "/", is text in a field, so there it's typed; a key
// with ⌘ or Ctrl works anywhere. Mod is either, on any device, as ⌘K is
// pressed with Ctrl on a Mac's other keyboards. Shift counts only when the
// shortcut names it, or has another modifier, as some layouts need it to
// type "/".
const pressed = (event: KeyboardEvent, keys: Keys) => {
  if (event.key.toLowerCase() !== keys.key || event.altKey !== keys.alt) return false;
  if (keys.mod) {
    if (!event.metaKey && !event.ctrlKey) return false;
  } else if (event.ctrlKey !== keys.control || event.metaKey !== keys.meta) {
    return false;
  }
  const alone = !keys.mod && !keys.control && !keys.meta;
  if ((!alone || keys.shift) && event.shiftKey !== keys.shift) return false;
  return !alone || !typingIn(event.target);
};

const typingIn = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable]") !== null);

const ariaKeys = (keys: Keys, apple: boolean) =>
  [
    (keys.control || (keys.mod && !apple)) && "Control",
    (keys.meta || (keys.mod && apple)) && "Meta",
    keys.alt && "Alt",
    keys.shift && "Shift",
    keys.key.length === 1 ? keys.key.toUpperCase() : keys.key,
  ]
    .filter(Boolean)
    .join("+");

const isPair = (
  label: CommandMenuShortcut["label"],
): label is { apple: ReactNode; other: ReactNode } =>
  typeof label === "object" &&
  label !== null &&
  !isValidElement(label) &&
  "apple" in label;

// Whether this is an Apple device, where ⌘ is the shortcut's key: known only
// in the browser, so the server's page shows the others' key.
const subscribe = () => () => {};
const isApple = () => {
  const { userAgentData } = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return /mac|iphone|ipad|ipod/i.test(
    userAgentData?.platform || navigator.platform || navigator.userAgent,
  );
};
const useApple = () => useSyncExternalStore(subscribe, isApple, () => false);
