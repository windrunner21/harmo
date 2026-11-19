"use client";

import { Button } from "@harmo-ui/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentPropsWithRef } from "react";
import { createGlobe, type GlobeHandle, type GlobePlace, type GlobeRoute } from "./createGlobe.ts";
import { PauseIcon, PlayIcon, TurnLeftIcon, TurnRightIcon } from "./icons.tsx";

export type { GlobePlace, GlobeRoute };

export interface GlobeProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  routes?: GlobeRoute[];
  center?: GlobePlace;
  autoRotate?: boolean;
  dragRotate?: boolean;
  controls?: boolean;
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
}

const words = {
  controls: "Globe",
  pause: "Pause",
  turnLeft: "Turn left",
  turnRight: "Turn right",
};

const step = 30;
const reducedMotion = "(prefers-reduced-motion: reduce)";
const subscribe = (change: () => void) => {
  const query = window.matchMedia(reducedMotion);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

export const Globe = ({
  routes,
  center,
  autoRotate,
  dragRotate,
  controls = true,
  paused,
  onPausedChange,
  className,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: GlobeProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<GlobeHandle | null>(null);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(reducedMotion).matches, () => false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const still = paused ?? chosen ?? reduced;
  const stillNow = useRef(still);
  const options = JSON.stringify({ routes, center, autoRotate, dragRotate });
  const named = label !== undefined || labelledBy !== undefined;
  const moving = autoRotate !== false || Boolean(routes?.length);

  useLayoutEffect(() => {
    stillNow.current = still;
    globe.current?.setPaused(still);
  }, [still]);

  useEffect(() => {
    if (!canvas.current) return;
    const given = JSON.parse(options) as Pick<GlobeProps, "routes" | "center" | "autoRotate" | "dragRotate">;
    const handle = createGlobe(canvas.current, {
      routes: given.routes,
      center: given.center,
      autoRotate: given.autoRotate,
      dragRotate: given.dragRotate,
      paused: stillNow.current,
      onUnavailable: () => setUnavailable(options),
    });
    globe.current = handle;
    return () => {
      handle.destroy();
      globe.current = null;
    };
  }, [options]);

  const toggle = () => {
    if (paused === undefined) setChosen(!still);
    onPausedChange?.(!still);
  };

  return (
    <div {...props} className={className ? `hglobe ${className}` : "hglobe"}>
      <div
        className="hglobe-view"
        role={named ? "img" : undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-hidden={named ? undefined : true}
      >
        <canvas ref={canvas} className="hglobe-canvas" />
      </div>
      {controls && unavailable !== options && (
        <div className="hglobe-controls" role="group" aria-label={words.controls}>
          <Button variant="tertiary" size="small" aria-label={words.turnLeft} onClick={() => globe.current?.turn(step)}>
            <TurnLeftIcon className="hicon" />
          </Button>
          {moving && (
            <Button variant="tertiary" size="small" aria-label={words.pause} aria-pressed={still} onClick={toggle}>
              <PauseIcon className="hicon hglobe-pause-icon" />
              <PlayIcon className="hicon hglobe-play-icon" />
            </Button>
          )}
          <Button variant="tertiary" size="small" aria-label={words.turnRight} onClick={() => globe.current?.turn(-step)}>
            <TurnRightIcon className="hicon" />
          </Button>
        </div>
      )}
    </div>
  );
};
