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
          onBeforeToggle?.(event);
          if (event.defaultPrevented) return;
          const opening = event.newState === "open";
          setOpen(opening);
          if (opening) event.currentTarget.toggleAttribute("data-refit");
          placeSide(event.currentTarget, opening);
        }}
      >
        {children}
      </div>
    </>
  );
};

export const popupTrigger = (popup: HTMLElement) =>
  Array.from(
    popup.ownerDocument.querySelectorAll<HTMLElement>(
      `[popovertarget="${CSS.escape(popup.id)}"]`,
    ),
  ).find((element) => !popup.contains(element));

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
