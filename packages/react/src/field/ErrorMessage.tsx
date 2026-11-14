"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { renders } from "../children.ts";
import { withClass } from "../withClass.ts";

export type ErrorMessageProps = ComponentPropsWithoutRef<"p">;

export const ErrorMessage = ({
  className,
  children,
  ...props
}: ErrorMessageProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [message, setMessage] = useState(children);
  const shown = renders(children);
  if (shown && children !== message) setMessage(children);
  const closing = !shown && renders(message);

  useEffect(() => {
    if (!closing || !ref.current) return;
    let current = true;
    const exits = ref.current.getAnimations().map((exit) => exit.finished);
    Promise.allSettled(exits).then(() => current && setMessage(undefined));
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
      {shown ? children : message}
    </p>
  );
};
