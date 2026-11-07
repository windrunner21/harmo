"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { withClass } from "./withClass.ts";

const AccordionContext = createContext<string | undefined>(undefined);

export interface AccordionProps extends ComponentPropsWithRef<"div"> {
  exclusive?: boolean;
  size?: "small";
}

export const Accordion = ({
  exclusive,
  size,
  className,
  children,
  ...props
}: AccordionProps) => {
  const name = useId();

  return (
    <div
      {...props}
      className={withClass("haccordion", className)}
      data-size={size}
    >
      <AccordionContext value={exclusive ? name : undefined}>
        {children}
      </AccordionContext>
    </div>
  );
};

export interface AccordionItemProps
  extends Omit<ComponentPropsWithRef<"details">, "children"> {
  label: ReactNode;
  size?: "small";
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export const AccordionItem = ({
  label,
  size,
  open,
  defaultOpen,
  onOpenChange,
  onToggle,
  name,
  className,
  children,
  ...props
}: AccordionItemProps) => {
  const group = useContext(AccordionContext);
  const [initiallyOpen] = useState(defaultOpen);

  return (
    <details
      {...props}
      className={withClass("haccordion-item", className)}
      data-size={size}
      name={name ?? group}
      open={open ?? initiallyOpen}
      onToggle={(event) => {
        onToggle?.(event);
        if (event.target === event.currentTarget) {
          onOpenChange?.(event.currentTarget.open);
        }
      }}
    >
      <summary className="haccordion-summary">
        <span className="haccordion-label">{label}</span>
        <ExpandChevron />
      </summary>
      <div className="haccordion-content">
        <AccordionContext value={undefined}>{children}</AccordionContext>
      </div>
    </details>
  );
};
