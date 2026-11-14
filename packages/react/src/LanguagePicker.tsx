"use client";

import {
  useId,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Button } from "./Button.tsx";
import { ExpandChevron } from "./ExpandChevron.tsx";
import { globe } from "./icons.ts";
import {
  Listbox,
  SelectContext,
  type ListboxSearch,
} from "./listbox/Listbox.tsx";
import { Option } from "./listbox/Option.tsx";
import { OptionGroup } from "./listbox/OptionGroup.tsx";
import { Popup } from "./Popup.tsx";
import { withClass } from "./withClass.ts";

export interface LanguagePickerLanguage {
  value: string;
  label: string;
  lang?: string;
  description?: ReactNode;
  keywords?: readonly string[];
  icon?: ReactNode;
  disabled?: boolean;
}

export interface LanguagePickerRegion {
  label: string;
  icon?: ReactNode;
  languages: LanguagePickerLanguage[];
}

export type LanguagePickerProps = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "defaultValue" | "type" | "children" | "aria-label"
> &
  ListboxSearch & {
    "aria-label": string;
    languages: LanguagePickerLanguage[] | LanguagePickerRegion[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    size?: "small";
  };

const isRegion = (
  item: LanguagePickerLanguage | LanguagePickerRegion,
): item is LanguagePickerRegion => "languages" in item;

const nameOf = (language: LanguagePickerLanguage) => (
  <span lang={language.lang ?? language.value}>{language.label}</span>
);

const iconOf = (icon: ReactNode) =>
  icon !== undefined &&
  icon !== null && (
    <span className="hlanguage-picker-icon" aria-hidden="true">
      {icon}
    </span>
  );

const optionOf = (language: LanguagePickerLanguage, region?: string) => (
  <Option
    key={language.value}
    value={language.value}
    description={language.description}
    keywords={
      region === undefined
        ? language.keywords
        : [...(language.keywords ?? []), region]
    }
    disabled={language.disabled}
  >
    {iconOf(language.icon)}
    {nameOf(language)}
  </Option>
);

const globeIcon = (
  <svg
    className="hicon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {globe.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

export const LanguagePicker = ({
  languages,
  value,
  defaultValue,
  onValueChange,
  searchLabel,
  emptyMessage,
  size,
  disabled,
  hidden,
  className,
  ...props
}: LanguagePickerProps) => {
  const listId = useId();
  const inactive =
    disabled ||
    hidden ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? null);
  const selected = value === undefined ? uncontrolled : value;

  const items = languages as (LanguagePickerLanguage | LanguagePickerRegion)[];
  const grouped = items.some(isRegion);
  const regions = items.map((item) =>
    isRegion(item) ? item : { label: undefined, languages: [item] },
  );
  const region = regions.find((group) =>
    group.languages.some((language) => language.value === selected),
  );
  const chosen = region?.languages.find(
    (language) => language.value === selected,
  );

  const choose = (next: string) => {
    if (next === selected) return;
    setUncontrolled(next);
    onValueChange?.(next);
  };

  const button = (
    <Button
      {...props}
      className={withClass("hlanguage-picker", className)}
      variant="tertiary"
      size={size}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={false}
      aria-controls={inactive ? undefined : listId}
      disabled={disabled}
      hidden={hidden}
    >
      {globeIcon}
      {region?.label !== undefined && (
        <>
          <span className="hlanguage-picker-region">{region.label}</span>{" "}
        </>
      )}
      {chosen && nameOf(chosen)}
      <ExpandChevron />
    </Button>
  );

  if (inactive) return button;

  return (
    <Popup
      trigger={button}
      className={grouped ? "hlanguage-picker-regions" : undefined}
    >
      <SelectContext value={{ named: true, across: grouped }}>
        <Listbox
          id={listId}
          aria-label={props["aria-label"]}
          value={selected}
          onValueChange={choose}
          {...({ searchLabel, emptyMessage } as ListboxSearch)}
        >
          {items.map((item, index) =>
            isRegion(item) ? (
              <OptionGroup
                key={index}
                label={
                  <>
                    {iconOf(item.icon)}
                    {item.label}
                  </>
                }
              >
                {item.languages.map((language) => optionOf(language, item.label))}
              </OptionGroup>
            ) : (
              optionOf(item)
            ),
          )}
        </Listbox>
      </SelectContext>
    </Popup>
  );
};
