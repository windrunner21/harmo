"use client";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  type ReactElement,
} from "react";
import { close as closePaths } from "./icons.ts";

// What Dialog and Drawer share: each is a native <dialog>, opened as a modal,
// that fades or slides out before it closes.

export interface ModalCommand {
  commandfor?: string;
  command?: string;
}

export interface ModalState {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onToggle?: (event: ToggleEvent) => void;
  onBeforeToggle?: (event: ToggleEvent) => void;
}

export const ModalContext = createContext<string | undefined>(undefined);

interface Closing {
  current: object | null;
}

// Holds the close while data-closing plays the exit, then closes: never much
// longer than its longest transition, so one whose exit doesn't run still
// closes. A frame first, since WebKit may start a transition only then.
const closeAfterExit = (
  element: HTMLDialogElement,
  closing: Closing,
  returnValue?: string,
) => {
  if (closing.current) return;
  const token = {};
  closing.current = token;
  element.setAttribute("data-closing", "");
  requestAnimationFrame(() => {
    const exiting = element
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {}));
    const seconds = Math.max(
      0,
      ...getComputedStyle(element).transitionDuration.split(",").map(parseFloat),
    );
    const longest = new Promise((resolve) =>
      setTimeout(resolve, seconds * 1000 + 100),
    );
    Promise.race([Promise.all(exiting), longest]).then(() => {
      if (closing.current !== token) return;
      closing.current = null;
      element.close(returnValue);
      element.removeAttribute("data-closing");
    });
  });
};

// The dialog's ref: it opens and closes with `open`, tells onOpenChange each
// way it opens or closes, and plays its exit before every close it can hold
// that the app hasn't stopped: Escape, a click outside, command="request-close",
// and a form sent with method="dialog".
export const useModal = ({
  open,
  onOpenChange,
  onToggle,
  onBeforeToggle,
}: ModalState) => {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const closing = useRef<object | null>(null);

  const toggled = useEffectEvent((event: Event) => {
    onToggle?.(event as ToggleEvent);
    onOpenChange?.((event as ToggleEvent).newState === "open");
  });
  const toggling = useEffectEvent((event: Event) =>
    onBeforeToggle?.(event as ToggleEvent),
  );

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const after = (event: Event) => toggled(event);
    const before = (event: Event) => {
      // Closed some other way while its exit played, such as by close() from
      // the app: the exit is over, so it can't close it again once reopened.
      if ((event as ToggleEvent).newState === "closed" && closing.current) {
        closing.current = null;
        element.removeAttribute("data-closing");
      }
      toggling(event);
    };
    // An app that stops it, such as to confirm unsaved changes, keeps it open;
    // its onCancel runs first, as React listens on the dialog before this.
    const cancelled = (event: Event) => {
      if (!event.cancelable || event.defaultPrevented) return;
      event.preventDefault();
      closeAfterExit(element, closing);
    };
    const submitted = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      const submitter = event.submitter as HTMLButtonElement | null;
      // A submit button's own formmethod wins over its form's method.
      const method = submitter?.hasAttribute("formmethod")
        ? submitter.formMethod
        : form.method;
      if (event.defaultPrevented || method !== "dialog") return;
      if (form.closest("dialog") !== element) return;
      event.preventDefault();
      closeAfterExit(
        element,
        closing,
        submitter?.hasAttribute("value") ? submitter.value : undefined,
      );
    };
    element.addEventListener("toggle", after);
    element.addEventListener("beforetoggle", before);
    element.addEventListener("cancel", cancelled);
    document.addEventListener("submit", submitted);
    return () => {
      closing.current = null;
      element.removeEventListener("toggle", after);
      element.removeEventListener("beforetoggle", before);
      element.removeEventListener("cancel", cancelled);
      document.removeEventListener("submit", submitted);
    };
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || open === undefined) return;
    if (open) {
      if (closing.current) {
        closing.current = null;
        element.removeAttribute("data-closing");
      }
      if (!element.open) element.showModal();
    } else if (element.open) closeAfterExit(element, closing);
  }, [open]);

  return dialog;
};

export const closeIcon = (
  <svg
    className="hicon"
    width="24"
    height="24"
    viewBox="0 0 25 25"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    {closePaths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

// Makes the button inside it close the dialog or drawer it's in.
export const ModalClose = ({
  children,
}: {
  children: ReactElement<ModalCommand>;
}) => {
  const modalId = useContext(ModalContext);
  return cloneElement(children, {
    commandfor: modalId,
    command: "request-close",
  });
};
