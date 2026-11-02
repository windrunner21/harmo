import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type Ref,
} from "react";

interface ValueProps<Element> {
  ref?: Ref<Element>;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<Element>) => void;
}

export const useCurrentValue = <
  Element extends HTMLInputElement | HTMLTextAreaElement,
>({
  ref,
  value,
  defaultValue,
  onChange,
}: ValueProps<Element>) => {
  const element = useRef<Element>(null);
  useImperativeHandle(ref, () => element.current as Element, []);
  const [typed, setTyped] = useState(String(defaultValue ?? ""));

  useEffect(() => {
    const form = element.current?.form;
    if (!form) return;
    const reset = (event: Event) =>
      setTimeout(() => {
        if (!event.defaultPrevented && element.current) {
          setTyped(element.current.value);
        }
      });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);

  return {
    value: value === undefined ? typed : String(value),
    ref: element,
    onChange: (event: ChangeEvent<Element>) => {
      setTyped(event.target.value);
      onChange?.(event);
    },
  };
};
