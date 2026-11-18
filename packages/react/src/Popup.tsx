"use client";

import {
  cloneElement,
  createContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEventHandler,
  type ReactElement,
  type RefObject,
} from "react";
import { withClass } from "./withClass.ts";

interface PopupTrigger {
  popoverTarget?: string;
  "aria-expanded"?: boolean;
  style?: CSSProperties;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

// A key pressed on the trigger, for what's in the popup to handle, such as a
// Select's Listbox: after the trigger's own onKeyDown, the app's, unless that
// called preventDefault().
export const PopupTriggerContext = createContext<
  | { popup: string; keys: RefObject<((event: KeyboardEvent) => void) | null> }
  | undefined
>(undefined);

export interface PopupProps extends ComponentPropsWithRef<"div"> {
  trigger: ReactElement<PopupTrigger>;
  align?: "start" | "end";
  side?: "bottom" | "top";
}

export const Popup = ({
  trigger,
  align,
  side,
  id,
  className,
  style,
  onBeforeToggle,
  children,
  ...props
}: PopupProps) => {
  const generatedId = useId();
  const popupId = id ?? generatedId;
  const anchor = `--${generatedId}`;
  const [open, setOpen] = useState(false);
  const keys = useRef<((event: KeyboardEvent) => void) | null>(null);
  const triggerKeys = useMemo(() => ({ popup: popupId, keys }), [popupId]);

  return (
    <>
      {cloneElement(trigger, {
        popoverTarget: popupId,
        "aria-expanded": open,
        style: { ...trigger.props.style, anchorName: anchor } as CSSProperties,
        onKeyDown: (event) => {
          trigger.props.onKeyDown?.(event);
          if (!event.defaultPrevented) keys.current?.(event.nativeEvent);
        },
      })}
      <div
        {...props}
        className={withClass("hpopup", className)}
        id={popupId}
        data-align={align === "end" ? "end" : undefined}
        data-preferred-side={side === "top" ? "top" : undefined}
        popover=""
        style={{ ...style, positionAnchor: anchor } as CSSProperties}
        onBeforeToggle={(event) => {
          // React passes on those of the popups inside this one.
          if (event.target !== event.currentTarget) return;
          onBeforeToggle?.(event);
          if (event.defaultPrevented) return;
          setOpen(event.newState === "open");
          placePopup(event.currentTarget, event.newState === "open");
        }}
      >
        <PopupTriggerContext value={triggerKeys}>
          {children}
        </PopupTriggerContext>
      </div>
    </>
  );
};

// What opens the popup, outside it: its popovertarget button, or else the
// element it's anchored to, such as a Combobox's field.
export const popupTrigger = (popup: HTMLElement) => {
  const invoker = Array.from(
    popup.ownerDocument.querySelectorAll<HTMLElement>(
      `[popovertarget="${CSS.escape(popup.id)}"]`,
    ),
  ).find((element) => !popup.contains(element));
  if (invoker) return invoker;
  const anchor = popup.style.getPropertyValue("position-anchor").trim();
  if (!anchor) return undefined;
  return Array.from(
    popup.ownerDocument.querySelectorAll<HTMLElement>('[style*="anchor-name"]'),
  ).find((element) => element.style.getPropertyValue("anchor-name").trim() === anchor);
};

// As a popup opens: where it lands, measured afresh; as it closes: pinned
// where it is, so it fades there.
export const placePopup = (popup: HTMLElement, opening: boolean) => {
  if (opening) unpin(popup);
  refitPopup(popup, opening);
  placeSide(popup, opening);
  if (!opening) {
    pin(popup);
    handBackFocus(popup);
  }
};

const openings = new WeakMap<HTMLElement, number>();

// In beforetoggle. A change to its fallbacks makes the browser forget where
// it last fit, so an opening popup is placed afresh. They change again once
// it's open, and once its opening fade is over if it didn't end fully shown:
// at a fallback position, Firefox keeps the styles it worked out when it
// placed the popup there, until they change: while it was closed, as a
// closed popup stays laid out for its fade, or partway through the fade, so
// it would stay unseen or faint. Each opening or closing voids what an
// earlier one left to do, including one in the same task, which shares its
// toggle event.
export const refitPopup = (popup: HTMLElement, opening: boolean) => {
  const opened = (openings.get(popup) ?? 0) + 1;
  openings.set(popup, opened);
  if (!opening) return;
  const current = () => openings.get(popup) === opened && popup.matches(":popover-open");
  popup.toggleAttribute("data-refit");
  popup.addEventListener(
    "toggle",
    (event) => {
      if ((event as ToggleEvent).newState !== "open" || !current()) return;
      popup.toggleAttribute("data-refit");
      const fade = popup
        .getAnimations()
        .find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "opacity");
      fade?.finished
        .catch(() => undefined)
        .then(() => {
          if (current() && getComputedStyle(popup).opacity !== "1") popup.toggleAttribute("data-refit");
        });
    },
    { once: true },
  );
};

// A browser hands focus back only for the first popup open, not one opened
// over another.
const handBackFocus = (popup: HTMLElement) => {
  const owner = popup.ownerDocument;
  if (!popup.contains(owner.activeElement)) return;
  popup.addEventListener(
    "toggle",
    (event) => {
      if ((event as ToggleEvent).newState !== "closed") return;
      if (owner.activeElement === owner.body || popup.contains(owner.activeElement)) {
        popupTrigger(popup)?.focus();
      }
    },
    { once: true },
  );
};

const placeSide = (popup: HTMLElement, opening: boolean) => {
  const trigger = popupTrigger(popup);
  if (!trigger) return;

  const triggerBox = trigger.getBoundingClientRect();
  let side: "top" | "bottom";
  if (opening) {
    const { marginBlockStart, marginBlockEnd } = getComputedStyle(popup);
    const needed =
      popup.offsetHeight + parseFloat(marginBlockStart) + parseFloat(marginBlockEnd);
    const below = popup.ownerDocument.documentElement.clientHeight - triggerBox.bottom;
    const above = triggerBox.top >= needed;
    side = above && (popup.dataset.preferredSide === "top" || below < needed) ? "top" : "bottom";
  } else {
    const popupBox = popup.getBoundingClientRect();
    side =
      popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2
        ? "top"
        : "bottom";
  }
  if (popup.dataset.side === side) return;

  const transitions = popup.style.transitionProperty;
  popup.style.transitionProperty = "none";
  popup.dataset.side = side;
  popup.getBoundingClientRect();
  popup.style.transitionProperty = transitions;
};

const pinned = ["top", "left", "width", "height"] as const;

// Its box without the slide still under way, if it closes as it opens: the
// closing slide carries on from there.
const pin = (popup: HTMLElement) => {
  const box = popup.getBoundingClientRect();
  const { transform } = getComputedStyle(popup);
  const slide = new DOMMatrixReadOnly(transform === "none" ? undefined : transform);
  const place = {
    top: box.top - slide.m42,
    left: box.left - slide.m41,
    width: box.width,
    height: box.height,
  };
  for (const name of pinned) {
    popup.style.setProperty(`--hpopup-pinned-${name}`, `${place[name]}px`);
  }
  popup.setAttribute("data-pinned", "");
};

const unpin = (popup: HTMLElement) => {
  popup.removeAttribute("data-pinned");
  for (const name of pinned) {
    popup.style.removeProperty(`--hpopup-pinned-${name}`);
  }
};
