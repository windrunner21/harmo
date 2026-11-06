"use client";
import {
  cloneElement,
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import {
  closeIcon,
  ModalClose,
  ModalContext,
  useModal,
  type ModalCommand,
  type ModalState,
} from "./modal.tsx";
import { withClass } from "./withClass.ts";

export interface DrawerProps
  extends Omit<
      ComponentPropsWithRef<"dialog">,
      "open" | "onToggle" | "onBeforeToggle"
    >,
    ModalState {
  label: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  trigger?: ReactElement<ModalCommand>;
  footer?: ReactNode;
  aside?: ReactNode;
  form?: ComponentPropsWithRef<"form">;
  bodyProps?: ComponentPropsWithRef<"div">;
  asideProps?: ComponentPropsWithRef<"div">;
}

export const Drawer = ({
  label,
  description,
  closeLabel,
  trigger,
  open,
  onOpenChange,
  onToggle,
  onBeforeToggle,
  footer,
  aside,
  form,
  bodyProps,
  asideProps,
  closedby = "any",
  id,
  className,
  ref,
  children,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: DrawerProps) => {
  const generated = useId();
  const drawerId = id ?? generated;
  const titleId = `${drawerId}-title`;
  const descriptionId = `${drawerId}-description`;
  const drawer = useModal({ open, onOpenChange, onToggle, onBeforeToggle });

  const content = (
    <>
      <div {...bodyProps} className={withClass("hdrawer-body", bodyProps?.className)}>
        {children}
      </div>
      {footer && <footer className="hdrawer-footer">{footer}</footer>}
    </>
  );

  return (
    <ModalContext value={drawerId}>
      {trigger &&
        cloneElement(trigger, { commandfor: drawerId, command: "show-modal" })}
      <dialog
        {...props}
        ref={(node) => {
          drawer.current = node;
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        id={drawerId}
        className={withClass("hdrawer", className)}
        closedby={closedby}
        aria-labelledby={labelledBy ?? titleId}
        aria-describedby={
          [description ? descriptionId : undefined, describedBy]
            .filter(Boolean)
            .join(" ") || undefined
        }
      >
        <header className="hdrawer-header">
          <h2 className="hdrawer-title" id={titleId}>
            {label}
          </h2>
          {description && (
            <p className="hdrawer-description" id={descriptionId}>
              {description}
            </p>
          )}
          <Button
            className="hdrawer-close"
            variant="tertiary"
            commandfor={drawerId}
            command="request-close"
            aria-label={closeLabel}
          >
            {closeIcon}
          </Button>
        </header>
        {form ? <form {...form}>{content}</form> : content}
        {aside && (
          <div {...asideProps} className={withClass("hdrawer-aside", asideProps?.className)}>
            {aside}
          </div>
        )}
      </dialog>
    </ModalContext>
  );
};

export const DrawerClose = ModalClose;
