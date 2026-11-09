"use client";

import {
  cloneElement,
  useId,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactElement,
} from "react";
import { withClass } from "./withClass.ts";

interface PopupTrigger {
  popoverTarget?: string;
  "aria-expanded"?: boolean;
  style?: CSSProperties;
}

export interface PopupProps extends ComponentPropsWithRef<"div"> {
  trigger: ReactElement<PopupTrigger>;
}

export const Popup = ({
  trigger,
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

  return (
    <>
      {cloneElement(trigger, {
        popoverTarget: popupId,
        "aria-expanded": open,
        style: { ...trigger.props.style, anchorName: anchor } as CSSProperties,
      })}
      <div
        {...props}
        className={withClass("hpopup", className)}
        id={popupId}
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
        {children}
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
  if (opening) {
    unpin(popup);
    popup.toggleAttribute("data-refit");
  }
  placeSide(popup, opening);
  if (!opening) {
    pin(popup);
    handBackFocus(popup);
  }
};

// A browser hands focus back only for the first popup open, not one opened
// over another.
const handBackFocus = (popup: HTMLElement) => {
  const owner = popup.ownerDocument;
  if (!popup.contains(owner.activeElement)) return;
  popup.addEventListener(
    "toggle",
    () => {
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
    side = below < needed && triggerBox.top >= needed ? "top" : "bottom";
  } else {
    const popupBox = popup.getBoundingClientRect();
    side =
      popupBox.top + popupBox.height / 2 < triggerBox.top + triggerBox.height / 2
        ? "top"
        : "bottom";
  }
  if (popup.dataset.side === side) return;

  popup.style.transition = "none";
  popup.dataset.side = side;
  popup.getBoundingClientRect();
  popup.style.transition = "";
};

const pinned = ["top", "left", "width", "height"] as const;

const pin = (popup: HTMLElement) => {
  const box = popup.getBoundingClientRect();
  for (const name of pinned) {
    popup.style.setProperty(`--hpopup-pinned-${name}`, `${box[name]}px`);
  }
  popup.setAttribute("data-pinned", "");
};

const unpin = (popup: HTMLElement) => {
  popup.removeAttribute("data-pinned");
  for (const name of pinned) {
    popup.style.removeProperty(`--hpopup-pinned-${name}`);
  }
};
