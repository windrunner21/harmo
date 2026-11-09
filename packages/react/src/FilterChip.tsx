"use client";

import {
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import { plus as plusPaths } from "./icons.ts";
import {
  Listbox,
  optionsOf,
  toList,
  type ListboxSearch,
  type ListboxSelection,
} from "./listbox/Listbox.tsx";
import { Popup } from "./Popup.tsx";
import { withClass } from "./withClass.ts";

interface ChipProps
  extends Omit<
    ComponentPropsWithRef<"button">,
    "value" | "defaultValue" | "type" | "children"
  > {
  label: string;
}

type Count = (count: number) => ReactNode;

interface ChipValues {
  values?: ReactNode[];
  formatCount?: Count;
}

type ListChoice =
  | (Exclude<ListboxSelection, { multiple: true }> & {
      clearLabel?: undefined;
      formatCount?: undefined;
    })
  | (Extract<ListboxSelection, { multiple: true }> & {
      clearLabel: ReactNode;
      formatCount: Count;
    });

type ListProps = ListChoice & ListboxSearch;

export type FilterChipProps =
  | (ChipProps & ChipValues & { children?: undefined })
  | (ChipProps & ListProps & { values?: undefined; children: ReactNode });

export const FilterChip = (props: FilterChipProps) =>
  props.children === undefined ? (
    <Chip {...(props as ChipProps & ChipValues)} />
  ) : (
    <FilterChipList {...(props as ChipProps & ListProps)}>
      {props.children}
    </FilterChipList>
  );

const Chip = ({
  label,
  values = [],
  formatCount,
  className,
  ...props
}: ChipProps & ChipValues) => {
  const shown =
    values.length > 2 && formatCount ? [formatCount(values.length)] : values;

  return (
    <button
      {...props}
      className={withClass("hfilter-chip", className)}
      type="button"
    >
      {plus}
      <span className="hfilter-chip-label">{label}</span>
      {shown.length > 0 && (
        <span className="hfilter-chip-values">
          {shown.map((value, index) => (
            <span key={index} className="hfilter-chip-value">
              {value}
            </span>
          ))}
        </span>
      )}
    </button>
  );
};

const FilterChipList = ({
  multiple = false,
  value,
  defaultValue,
  onValueChange,
  searchLabel,
  emptyMessage,
  clearLabel,
  formatCount,
  label,
  children,
  ...props
}: ChipProps & ListProps & { children: ReactNode }) => {
  const popup = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState(() => toList(defaultValue));
  const selected = value === undefined ? uncontrolled : toList(value);
  const chosen = optionsOf(children).filter((option) =>
    selected.includes(option.value),
  );

  const change = (next: string | string[]) => {
    setUncontrolled(toList(next));
    (onValueChange as ((value: string | string[]) => void) | undefined)?.(
      next,
    );
  };

  const clear = () => {
    const search = popup.current?.querySelector<HTMLElement>(
      ".hlistbox-search-input",
    );
    (search ?? popup.current?.querySelector<HTMLElement>(".hlistbox"))?.focus();
    change([]);
  };

  const selection = {
    multiple,
    value: multiple ? selected : (selected[0] ?? null),
    onValueChange: change,
  } as ListboxSelection;

  return (
    <Popup
      ref={popup}
      trigger={
        <Chip
          {...props}
          label={label}
          values={chosen.map((option) => option.label)}
          formatCount={formatCount}
          aria-haspopup="listbox"
        />
      }
    >
      <Listbox
        {...selection}
        aria-label={label}
        {...({ searchLabel, emptyMessage } as ListboxSearch)}
        footer={
          multiple && chosen.length > 0 ? (
            <Button variant="tertiary" onClick={clear}>
              {clearLabel}
            </Button>
          ) : undefined
        }
      >
        {children}
      </Listbox>
    </Popup>
  );
};

export const plus = (
  <svg
    className="hicon"
    width="18"
    height="18"
    viewBox="0 0 24 25"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {plusPaths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);
