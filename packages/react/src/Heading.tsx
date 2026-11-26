import type { ComponentPropsWithRef } from "react";
import { withClass } from "./withClass.ts";

export type TitleProps = ComponentPropsWithRef<"h1">;

export const Title = ({ className, ...props }: TitleProps) => (
  <h1 {...props} className={withClass("htitle", className)} />
);

export interface HeadingProps extends ComponentPropsWithRef<"h2"> {
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
}

export const Heading = ({ as: Element = "h2", className, ...props }: HeadingProps) => (
  <Element {...props} className={withClass("hheading", className)} />
);
