"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { FieldContext } from "./field/Field.tsx";
import { Input } from "./Input.tsx";
import { Option } from "./listbox/Option.tsx";
import { Select } from "./Select.tsx";
import { useMergedRef } from "./useMergedRef.ts";
import { withClass } from "./withClass.ts";

interface ParsedPhone {
  country?: string;
  number: string;
  isValid(): boolean;
  isPossible(): boolean;
  formatNational(): string;
}

export interface PhoneParser {
  AsYouType: new (country: never) => { input(text: string): string };
  getCountries(): readonly string[];
  getCountryCallingCode(country: never): string;
  parsePhoneNumberFromString(text: string, country?: never): ParsedPhone | undefined;
  getExampleNumber?(country: never, examples: never): { formatNational(): string } | undefined;
}

export interface PhoneNumberDetails {
  country: string;
  valid: boolean;
}

export interface PhoneInputProps
  extends Omit<ComponentPropsWithRef<"input">, "value" | "defaultValue" | "type" | "children"> {
  phone: PhoneParser;
  locale: string;
  defaultCountry: string;
  countryLabel: string;
  searchLabel: string;
  emptyMessage: ReactNode;
  defaultValue?: string;
  countries?: readonly string[];
  validation?: "valid" | "possible";
  examples?: object;
  renderFlag?: (country: string) => ReactNode;
  onValueChange?: (value: string, details: PhoneNumberDetails) => void;
}

const flagOf = (country: string) =>
  String.fromCodePoint(...Array.from(country.toUpperCase(), (letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));

const digitsOf = (text: string) => text.replace(/\D/g, "");

const asciiDigits = (text: string) =>
  text.replace(/[\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0xff10 ? 0xff10 : code >= 0x06f0 ? 0x06f0 : 0x0660));
  });

const caretAfter = (text: string, digits: number) => {
  if (digits === 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text[index]!) && ++seen === digits) return index + 1;
  }
  return text.length;
};

export const PhoneInput = ({
  phone,
  locale,
  defaultCountry,
  countryLabel,
  searchLabel,
  emptyMessage,
  defaultValue,
  countries,
  validation = "valid",
  examples,
  renderFlag,
  onValueChange,
  onChange,
  onCompositionEnd,
  name,
  ref,
  className,
  hidden,
  disabled,
  placeholder,
  ...props
}: PhoneInputProps) => {
  const input = useRef<HTMLInputElement>(null);
  const inputRef = useMergedRef(input, ref);
  const caret = useRef<number | null>(null);
  const seeded = useRef(false);
  const seen = useRef(defaultValue);

  const listKey = countries?.join();
  const allowed = (code: string) => !countries || countries.includes(code);
  const firstCountry = allowed(defaultCountry) ? defaultCountry : (countries?.[0] ?? defaultCountry);

  const start = useMemo(() => {
    const parsed = defaultValue ? phone.parsePhoneNumberFromString(defaultValue) : undefined;
    return parsed?.country && allowed(parsed.country)
      ? { country: parsed.country, text: parsed.formatNational() }
      : null;
  }, [defaultValue, phone, listKey]);

  const [country, setCountry] = useState(start?.country ?? firstCountry);
  const [text, setText] = useState(start?.text ?? "");

  const read = (shownText: string, current: string) => {
    const trimmed = shownText.trim();
    const parsed = trimmed
      ? phone.parsePhoneNumberFromString(trimmed, (trimmed.startsWith("+") ? undefined : current) as never)
      : undefined;
    const listed = !parsed?.country || allowed(parsed.country);
    const valid = listed && Boolean(validation === "possible" ? parsed?.isPossible() : parsed?.isValid());
    return { valid, value: valid && parsed ? parsed.number : "" };
  };

  const { value } = read(text, country);

  const report = (shownText: string, current: string) => {
    const result = read(shownText, current);
    onValueChange?.(result.value, { country: current, valid: result.valid });
  };

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (start) report(start.text, start.country);
  }, []);

  useEffect(() => {
    if (seen.current === defaultValue) return;
    seen.current = defaultValue;
    if (input.current?.value) return;
    setCountry(start?.country ?? firstCountry);
    setText(start?.text ?? "");
    if (start) report(start.text, start.country);
  }, [defaultValue]);

  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (event.defaultPrevented) return;
        setCountry(start?.country ?? firstCountry);
        setText(start?.text ?? "");
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [start, firstCountry, props.form]);

  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  const shown = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    const listed = (countries ?? phone.getCountries()).map((code) => ({
      code,
      name: names.of(code) ?? code,
      calling: phone.getCountryCallingCode(code as never),
    }));
    return countries ? listed : listed.sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [listKey, locale, phone]);

  const flag = (code: string) => (
    <span className="hphone-input-flag" aria-hidden="true">
      {renderFlag ? renderFlag(code) : flagOf(code)}
    </span>
  );

  const options = useMemo(
    () =>
      shown.map(({ code, name: countryName, calling }) => (
        <Option key={code} value={code} keywords={[calling, `+${calling}`, code]} badge={<span dir="ltr">+{calling}</span>}>
          {flag(code)}
          {countryName}
        </Option>
      )),
    [shown, renderFlag],
  );

  const example = useMemo(
    () => (examples ? phone.getExampleNumber?.(country as never, examples as never)?.formatNational() : undefined),
    [examples, country, phone],
  );

  const apply = (entered: string, position: number, kind?: string) => {
    let raw = asciiDigits(entered);
    let at = position;

    // Deleting only a space or a bracket would come straight back when the
    // number is formatted, so it takes the digit beside it too.
    const removedFormatting =
      raw.length === text.length - 1 && raw === text.slice(0, at) + text.slice(at + 1) && /\D/.test(text[at] ?? "");
    if (removedFormatting) {
      if (kind === "deleteContentBackward" || !kind) {
        const before = raw.slice(0, at).replace(/\d(\D*)$/, "$1");
        raw = before + raw.slice(at);
        at = before.length;
      } else if (kind === "deleteContentForward") {
        raw = raw.slice(0, at) + raw.slice(at).replace(/^(\D*)\d/, "$1");
      }
    }

    const international = raw.trimStart().startsWith("+");
    const clean = `${international ? "+" : ""}${digitsOf(raw)}`;

    if (international) {
      const parsed = phone.parsePhoneNumberFromString(clean);
      if (parsed?.country && parsed.isValid() && allowed(parsed.country)) {
        const national = parsed.formatNational();
        setCountry(parsed.country);
        setText(national);
        report(national, parsed.country);
        return;
      }
    }

    const formatted = new phone.AsYouType((international ? undefined : country) as never).input(clean);
    const next = at >= raw.length ? formatted.length : caretAfter(formatted, digitsOf(raw.slice(0, at)).length);
    if (formatted === text) {
      queueMicrotask(() => input.current?.setSelectionRange(next, next));
      return;
    }
    caret.current = next;
    setText(formatted);
    report(formatted, country);
  };

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    const field = event.target;
    const native = event.nativeEvent as InputEvent;
    if (native.isComposing) {
      setText(field.value);
      return;
    }
    apply(field.value, field.selectionStart ?? field.value.length, native.inputType);
  };

  const chooseCountry = (next: string) => {
    if (next === country) return;
    setCountry(next);
    setText("");
    onValueChange?.("", { country: next, valid: false });
    requestAnimationFrame(() => input.current?.focus());
  };

  const current = shown.find((item) => item.code === country);
  const calling = current?.calling ?? phone.getCountryCallingCode(country as never);

  return (
    <div className={withClass("hphone-input", className)} hidden={hidden}>
      <FieldContext value={{}}>
        <Select
          className="hphone-input-country"
          aria-label={countryLabel}
          value={country}
          onValueChange={chooseCountry}
          searchLabel={searchLabel}
          emptyMessage={emptyMessage}
          disabled={disabled}
          renderValue={() => (
            <>
              {flag(country)}
              <span dir="ltr">+{calling}</span>
              <span className="hphone-input-name">{current?.name}</span>
            </>
          )}
        >
          {options}
        </Select>
      </FieldContext>
      <Input
        autoComplete="tel-national"
        inputMode="tel"
        {...props}
        ref={inputRef}
        type="tel"
        dir="ltr"
        value={text}
        onChange={change}
        onCompositionEnd={(event) => {
          onCompositionEnd?.(event);
          const field = event.currentTarget;
          apply(field.value, field.selectionStart ?? field.value.length);
        }}
        disabled={disabled}
        placeholder={placeholder ?? example}
      />
      {name && <input type="hidden" name={name} value={value} form={props.form} disabled={disabled} />}
    </div>
  );
};
