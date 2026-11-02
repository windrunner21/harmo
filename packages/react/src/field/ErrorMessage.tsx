"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { withClass } from "../withClass.ts";

export type ErrorMessageProps = ComponentPropsWithoutRef<"p">;

export const ErrorMessage = ({
  className,
  children,
  ...props
}: ErrorMessageProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [message, setMessage] = useState(children);
  if (children && children !== message) setMessage(children);
  const closing = !children && Boolean(message);

  useEffect(() => {
    if (!closing || !ref.current) return;
    let current = true;
    const exits = ref.current.getAnimations().map((exit) => exit.finished);
    Promise.all(exits).then(
      () => current && setMessage(undefined),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [closing]);

  return (
    <p
      {...props}
      ref={ref}
      className={withClass("herror", className)}
      hidden={closing}
    >
      {children || message}
    </p>
  );
};
