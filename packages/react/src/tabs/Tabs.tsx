"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { shownChildren } from "../children.ts";
import { withClass } from "../withClass.ts";
import { useTabsMotion } from "./useTabsMotion.ts";

export type TabsProps = { children?: ReactNode } & (
  | { value: string; defaultValue?: never; onValueChange?: (value: string) => void }
  | { defaultValue: string; value?: never; onValueChange?: (value: string) => void }
);

interface TabsState {
  selected: string;
  select: (value: string) => void;
  idOf: (value: string, part: "tab" | "panel") => string;
}

const TabsContext = createContext<TabsState | undefined>(undefined);

const useTabs = () => {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error("Tabs parts belong inside Tabs.");
  return tabs;
};

export const Tabs = ({
  value,
  defaultValue,
  onValueChange,
  children,
}: TabsProps) => {
  const id = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value ?? uncontrolled ?? "";

  const select = (next: string) => {
    if (next === selected) return;
    setUncontrolled(next);
    onValueChange?.(next);
  };

  const idOf = (item: string, part: "tab" | "panel") =>
    `${id}-${part}-${encode(item)}`;

  return (
    <TabsContext value={{ selected, select, idOf }}>{children}</TabsContext>
  );
};

export interface TabListProps extends ComponentPropsWithRef<"div"> {
  alwaysShow?: boolean;
}

export const TabList = ({
  alwaysShow = false,
  className,
  style,
  hidden,
  children,
  onKeyDown,
  onPointerOver,
  onPointerLeave,
  ...props
}: TabListProps) => {
  useTabs();
  const motion = useTabsMotion<HTMLDivElement>();
  const alone = !alwaysShow && shownChildren(children).length <= 1;

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step && event.key !== "Home" && event.key !== "End") return;
    const all = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        ':scope > [role="tab"]:not(:disabled, [hidden])',
      ),
    );
    const index = all.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;

    let next: HTMLElement | undefined;
    if (event.key === "Home") next = all[0];
    else if (event.key === "End") next = all.at(-1);
    else {
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const offset = rtl ? -(step as number) : (step as number);
      next = all[(index + offset + all.length) % all.length];
    }
    event.preventDefault();
    next?.focus();
    next?.click();
  };

  return (
    <div
      ref={motion.ref}
      className={withClass("htabs", className)}
      style={style}
      hidden={hidden || alone || undefined}
    >
      <div
        {...props}
        role="tablist"
        onPointerOver={(event) => {
          motion.onPointerOver(event);
          onPointerOver?.(event);
        }}
        onPointerLeave={(event) => {
          motion.onPointerLeave();
          onPointerLeave?.(event);
        }}
        onKeyDown={(event) => {
          move(event);
          onKeyDown?.(event);
        }}
      >
        {children}
      </div>
      <span className="htabs-highlight" aria-hidden="true" />
      <span className="htabs-indicator" aria-hidden="true" />
    </div>
  );
};

export interface TabProps
  extends Omit<ComponentPropsWithRef<"button">, "value"> {
  value: string;
}

export const Tab = ({ value, onClick, ...props }: TabProps) => {
  const tabs = useTabs();
  const selected = tabs.selected === value;

  return (
    <button
      type="button"
      {...props}
      role="tab"
      id={tabs.idOf(value, "tab")}
      aria-selected={selected}
      aria-controls={tabs.idOf(value, "panel")}
      tabIndex={selected ? undefined : -1}
      onClick={(event) => {
        tabs.select(value);
        onClick?.(event);
      }}
    />
  );
};

export interface TabPanelProps extends ComponentPropsWithRef<"div"> {
  value: string;
}

export const TabPanel = ({ value, ...props }: TabPanelProps) => {
  const tabs = useTabs();

  return (
    <div
      tabIndex={0}
      {...props}
      role="tabpanel"
      id={tabs.idOf(value, "panel")}
      aria-labelledby={tabs.idOf(value, "tab")}
      hidden={tabs.selected !== value}
    />
  );
};

const encode = (value: string) =>
  value.replace(
    /[^a-zA-Z0-9-]/g,
    (character) => `_${character.charCodeAt(0).toString(16)}_`,
  );
