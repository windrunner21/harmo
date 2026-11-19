"use client";

import { Button } from "@harmo-ui/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentPropsWithRef } from "react";
import type { GlobeHandle, GlobePlace, GlobeRoute } from "./createGlobe.ts";
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
  const [unavailable, setUnavailable] = useState(false);
  const still = paused ?? chosen ?? reduced;
  const stillNow = useRef(still);
  const settings = useRef({ routes, center, autoRotate, dragRotate });
  const routesKey = JSON.stringify(routes ?? []);
  const named = label !== undefined || labelledBy !== undefined;
  const moving = autoRotate !== false || Boolean(routes?.length);

  useLayoutEffect(() => {
    stillNow.current = still;
    globe.current?.setPaused(still);
  }, [still]);

  useLayoutEffect(() => {
    settings.current = { routes, center, autoRotate, dragRotate };
  });

  useEffect(() => {
    let cancelled = false;
    let handle: GlobeHandle | undefined;
    void import("./createGlobe.ts").then(({ createGlobe }) => {
      if (cancelled || !canvas.current) return;
      handle = createGlobe(canvas.current, { ...settings.current, paused: stillNow.current, onUnavailable: () => setUnavailable(true) });
      globe.current = handle;
    });
    return () => {
      cancelled = true;
      handle?.destroy();
      globe.current = null;
    };
  }, []);

  useEffect(() => {
    globe.current?.setRoutes(JSON.parse(routesKey) as GlobeRoute[]);
  }, [routesKey]);

  useEffect(() => {
    globe.current?.setAutoRotate(autoRotate !== false);
  }, [autoRotate]);

  useEffect(() => {
    globe.current?.setDragRotate(dragRotate !== false);
  }, [dragRotate]);

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
      {controls && !unavailable && (
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
