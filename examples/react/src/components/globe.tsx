import type { CSSProperties } from "react";
import { Globe, type GlobeRoute } from "../patterns/globe/Globe.tsx";

// Example only: the globe's size, and the heading beside it, laid out with
// inline styles.
const london = { lat: 51.51, lon: -0.13 };
const routes: GlobeRoute[] = [
  { from: { lat: 39.47, lon: -0.38 }, to: london },
  { from: { lat: -1.29, lon: 36.82 }, to: london },
  { from: { lat: -12.05, lon: -77.04 }, to: london },
  { from: { lat: -36.85, lon: 174.76 }, to: london },
];

const sized: CSSProperties = { inlineSize: "100%", maxInlineSize: "26rem", marginInline: "auto" };
const hero: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
  alignItems: "center",
  gap: "var(--harmo-space-lg)",
};

export const examples = {
  Routes: () => (
    <div style={sized}>
      <Globe aria-label="Produce shipped to London from Valencia, Nairobi, Lima, and Auckland" routes={routes} />
    </div>
  ),

  "Centered on a place": () => (
    <div style={sized}>
      <Globe aria-label="The world, centered on Asia" center={{ lat: 30, lon: 100 }} autoRotate={false} />
    </div>
  ),

  "Beside a heading": () => (
    <div style={hero}>
      <div>
        <h2 style={{ margin: 0, fontSize: "var(--harmo-font-size-lg)", color: "var(--harmo-color-text)" }}>
          Fresh produce from 40 countries
        </h2>
        <p style={{ margin: "var(--harmo-space-2xs) 0 0", color: "var(--harmo-color-text-secondary)" }}>
          Picked at its best, shipped the same week, and at your door the morning it lands.
        </p>
      </div>
      <Globe routes={routes} />
    </div>
  ),

  "Without controls": () => (
    <div style={sized}>
      <Globe aria-label="Produce shipped to London from Valencia, Nairobi, Lima, and Auckland" routes={routes} controls={false} />
    </div>
  ),
};
