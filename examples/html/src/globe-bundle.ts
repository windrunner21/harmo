// Example only, built into globe-bundle.js with three.js, which scripts/
// globe.js loads on a page with a globe: draws each .hglobe with the React
// pattern's createGlobe.ts, as the React Globe does, and wires its controls:
// turn left and right by 30 degrees, and Pause, a toggle, aria-pressed while
// it's paused, as it starts with reduced motion, following that setting until
// it's pressed; a globe that doesn't move on its own has no Pause. Its
// options come from data-example-* hooks, standing in for what your own
// script passes: data-example-routes, routes split by semicolons, each two
// places, "lat,lon lat,lon"; data-example-center, a place, "lat,lon"; and
// data-example-not-turning, which keeps it from turning on its own.
import { createGlobe, type GlobePlace } from "../../react/src/patterns/globe/createGlobe.ts";

const placeOf = (text: string): GlobePlace => {
  const [lat = 0, lon = 0] = text.split(",").map(Number);
  return { lat, lon };
};

for (const globe of document.querySelectorAll<HTMLElement>(".hglobe")) {
  const canvas = globe.querySelector<HTMLCanvasElement>(".hglobe-canvas");
  if (!canvas) continue;
  const controls = globe.querySelector<HTMLElement>(".hglobe-controls");
  const buttons = controls ? [...controls.querySelectorAll<HTMLButtonElement>(".hbutton")] : [];
  const [left, right] = [buttons.at(0), buttons.at(-1)];
  const pause = buttons.find((button) => button.hasAttribute("aria-pressed"));
  const { exampleRoutes, exampleCenter } = globe.dataset;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = motion.matches;
  let chosen = false;
  const handle = createGlobe(canvas, {
    routes: (exampleRoutes ?? "")
      .split(";")
      .map((route) => route.trim().split(/\s+/))
      .filter((places) => places.length === 2)
      .map(([from = "", to = ""]) => ({ from: placeOf(from), to: placeOf(to) })),
    center: exampleCenter ? placeOf(exampleCenter) : undefined,
    autoRotate: !globe.hasAttribute("data-example-not-turning"),
    paused,
    onUnavailable: () => {
      if (controls) controls.hidden = true;
    },
  });
  pause?.setAttribute("aria-pressed", String(paused));
  // Until Pause is pressed, it follows the reduced motion setting.
  motion.addEventListener("change", () => {
    if (chosen) return;
    paused = motion.matches;
    pause?.setAttribute("aria-pressed", String(paused));
    handle.setPaused(paused);
  });
  pause?.addEventListener("click", () => {
    chosen = true;
    paused = !paused;
    pause.setAttribute("aria-pressed", String(paused));
    handle.setPaused(paused);
  });
  left?.addEventListener("click", () => handle.turn(30));
  right?.addEventListener("click", () => handle.turn(-30));
}
