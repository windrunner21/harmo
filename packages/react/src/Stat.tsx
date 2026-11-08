"use client";

import {
  cloneElement,
  createContext,
  useContext,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { renders } from "./children.ts";
import { info, trendDown, trendUp } from "./icons.ts";
import { Tooltip } from "./Tooltip.tsx";
import { usePinned } from "./usePinned.ts";
import { withClass } from "./withClass.ts";

export interface StatProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label: ReactNode;
  labelAs?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  value: ReactNode;
  caption?: ReactNode;
  hint?: ReactNode;
  trend?: { direction: "up" | "down"; label: ReactNode };
  trendHint?: ReactNode;
  actions?: ReactNode;
}

export interface StatGroupProps extends ComponentPropsWithRef<"div"> {
  trendHint?: ReactNode;
}

const TrendHintContext = createContext<ReactNode>(undefined);

const icon = (paths: string[]) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {paths.map((d) => (
      <path key={d} d={d} fill="currentColor" />
    ))}
  </svg>
);

const Hint = ({
  text,
  names,
  children,
}: {
  text: ReactNode;
  names?: boolean;
  children: ReactElement<ComponentPropsWithRef<"button">>;
}) => {
  const [pinned, setPinned, ref] = usePinned<HTMLSpanElement>();
  const button = cloneElement(children, { onClick: () => setPinned((open) => !open) });

  return (
    <Tooltip
      ref={ref}
      data-open={pinned ? "" : undefined}
      side="top"
      variant="hint"
      onBlur={() => setPinned(false)}
      {...(names ? { label: text } : { description: text })}
    >
      {button}
    </Tooltip>
  );
};

export const Stat = ({
  label,
  labelAs: Label = "h3",
  value,
  caption,
  hint,
  trend,
  trendHint,
  actions,
  className,
  ...props
}: StatProps) => {
  const groupHint = useContext(TrendHintContext);
  const comparison = trendHint ?? groupHint;
  const change = trend && (
    <>
      {icon(trend.direction === "up" ? trendUp : trendDown)}
      {trend.label}
    </>
  );

  return (
    <div {...props} className={withClass("hstat", className)}>
      <div className="hstat-header">
        <div className="hstat-title">
          <Label className="hstat-label">{label}</Label>
          {renders(hint) && (
            <Hint text={hint} names>
              <button className="hstat-hint" type="button">
                {icon(info)}
              </button>
            </Hint>
          )}
        </div>
        {trend &&
          (renders(comparison) ? (
            <Hint text={comparison}>
              <button className="hstat-trend" type="button" data-direction={trend.direction}>
                {change}
              </button>
            </Hint>
          ) : (
            <span className="hstat-trend" data-direction={trend.direction}>
              {change}
            </span>
          ))}
      </div>
      <p className="hstat-value">{value}</p>
      {renders(caption) && <p className="hstat-caption">{caption}</p>}
      {renders(actions) && <div className="hstat-actions">{actions}</div>}
    </div>
  );
};

export const StatGroup = ({ trendHint, className, ...props }: StatGroupProps) => (
  <TrendHintContext value={trendHint}>
    <div {...props} className={withClass("hstat-group", className)} />
  </TrendHintContext>
);
