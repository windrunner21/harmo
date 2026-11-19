# Globe

The world in dots, turning slowly, ready to copy into your app: the land as
dots that twinkle, routes arcing between places with a light travelling
each, and controls to turn it and pause it. It suits a site's hero, or a
picture of where your deliveries, offices, or customers are.

| React | What it is |
| --- | --- |
| `Globe` | The globe on a canvas, drawn with [three.js](https://threejs.org), square, as wide as its container, with its controls in the corner |

## Try the demo

| Example | Try | You see |
| --- | --- | --- |
| Routes | Watch it | It turns slowly; a light travels each route to London, and the land's dots twinkle |
| Routes | Press Pause | It stops turning, twinkling, and its lights; Pause shows play, pressed. Press it again to start |
| Routes | Press the arrows, or drag it | It turns a twelfth of the way round with each press, or with you, and eases to a stop as you let go |
| Centered on a place | Look, then press the arrows | Asia faces you, still, without a twinkle, and without Pause; the arrows turn it |
| Beside a heading | Narrow the window | The globe moves under the heading |
| Without controls | Watch it, then drag it | It turns and twinkles as the others do, without controls; a drag turns it |
| Any | Turn on reduced motion in your system's settings, then reload | It starts paused; Play starts it |
| Any | Switch to dark mode, or another accent | Its colors follow Harmo's |

## What you need

| Need | Details |
| --- | --- |
| React | React and React DOM 19.3 or later, and TypeScript; `three`, and `@types/three` as a dev dependency, which the CLI installs |
| HTML | Harmo's CSS, and three.js with the pattern's `createGlobe.ts`, through your bundler, as [HTML](#html) says |
| A browser | WebGL 2; without it, the globe's box stays empty, and its controls are gone |

## React

### Install

```sh
npx harmo-ui add globe
```

It copies into `components/harmo/patterns/`:

- `globe/`, the Globe, `createGlobe.ts`, which draws it, `land.ts`, where the land
  is, its controls' icons, and `globe.css`, which lays it out.

It also copies the Button its controls use, adds the stylesheets to
`harmo.css`, and installs `three`, and `@types/three` as a dev dependency,
with your project's package manager, at the versions Harmo is tested with,
unless your project already lists them; `--no-install` prints the commands
instead. Without the CLI, copy the same folder from
[examples/react/src/patterns](../../examples/react/src/patterns), set it up
as [Patterns](README.md#install) says, and install both packages.

### Use it

Give it a width through its container; it's square. Name it with
`aria-label` when it says something, such as where your deliveries go; leave
it unnamed when it's decoration, and screen readers skip the picture. Its
controls are there either way, as it moves.

```tsx
import { Globe } from "@/components/harmo/patterns/globe/Globe";

const london = { lat: 51.51, lon: -0.13 };

<div style={{ maxInlineSize: "26rem" }}>
  <Globe
    aria-label="Produce shipped to London from Valencia and Nairobi"
    routes={[
      { from: { lat: 39.47, lon: -0.38 }, to: london },
      { from: { lat: -1.29, lon: 36.82 }, to: london },
    ]}
  />
</div>
```

It's a client component: three.js draws in the browser. In Next.js, import
it into a page as any client component; its box is there from the server,
and the globe appears in it as it first comes into view. To keep three.js
out of a page's first download, where the globe sits below the fold, import
the Globe with `next/dynamic`.

### Pausing and turning

The Globe pauses itself: Pause stops it turning, twinkling, and its lights,
and it starts paused when the reader prefers reduced motion. A globe that
doesn't turn on its own and has no routes is a still picture: its dots
don't twinkle, and it has no Pause, only the arrows. To pause it
from your page, such as from a switch that pauses every animation, give it
`paused`, and `onPausedChange`, which Pause calls.

```tsx
const [paused, setPaused] = useState(false);

<Globe routes={routes} paused={paused} onPausedChange={setPaused} />
```

Its controls, Pause and the arrows, are what makes it meet WCAG: something
that moves on its own for more than five seconds, beside other content,
needs a way to pause it, and turning it needs a way without dragging. Turn
them off with `controls={false}` only where that's covered otherwise: your
page passes its own pause to `paused`, and turning it by hand isn't needed,
as for decoration.

Dragging is separate from the controls: a drag turns it, with or without
them. `dragRotate={false}` keeps a drag from turning it, such as where it
sits under the pointer's way through a page; the arrows still do.

### Props

| `Globe` | Effect |
| --- | --- |
| `routes` | Arcs between places, each `{ from, to }`, a place being `{ lat, lon }` in degrees: along the shortest way round, lifted off the surface, a dot at each end, and a light travelling from `from` to `to` |
| `center` | The place that faces you at first: `{ lat: 20, lon: 0 }` by default |
| `autoRotate` | Whether it turns on its own while it isn't paused: `true` by default. Off, and without routes, it's still: no twinkle, and no Pause |
| `dragRotate` | Whether a drag turns it: `true` by default |
| `controls` | Its controls, Pause and the arrows: `true` by default; see [Pausing and turning](#pausing-and-turning) |
| `paused` | Whether it's paused, if your page decides; without it, the Globe does |
| `onPausedChange` | Called with the new value as Pause is pressed |
| `aria-label`, `aria-labelledby` | Its name, which makes the picture an image to screen readers; without one, the picture is hidden from them |

Any other prop goes on its `<div>`. A change to `routes`, `center`,
`autoRotate`, or `dragRotate` draws it afresh; one to `paused` or
`controls` doesn't.

### Without JavaScript

Its square box is there, with its controls, which do nothing, and nothing
in it, so the page doesn't move as it appears.

## HTML

### Markup

```html
<div class="hglobe">
  <div class="hglobe-view" role="img" aria-label="Produce shipped to London">
    <canvas class="hglobe-canvas"></canvas>
  </div>
  <div class="hglobe-controls" role="group" aria-label="Globe">
    <button class="hbutton" type="button" data-variant="tertiary" data-size="small" aria-label="Turn left">…</button>
    <button class="hbutton" type="button" data-variant="tertiary" data-size="small" aria-label="Pause" aria-pressed="false">
      …pause icon, class hglobe-pause-icon…
      …play icon, class hglobe-play-icon…
    </button>
    <button class="hbutton" type="button" data-variant="tertiary" data-size="small" aria-label="Turn right">…</button>
  </div>
</div>
```

Without a name, `aria-hidden="true"` on the view, in place of `role` and
`aria-label`. Without controls, no `.hglobe-controls`; without anything
moving on its own, no Pause.

### Built with

| Part | Harmo component |
| --- | --- |
| Its controls | [Button](../components/button.md), `tertiary` and `small` |

The globe itself is the pattern's own: three.js draws it, and `land.ts`
holds the land, from [Natural Earth](https://www.naturalearthdata.com)'s
1:110m land, which is in the public domain, as a half-degree grid. Its
colors are Harmo's tokens.

### Classes

The pattern's own, in `globe.css`:

| Class | What it's for |
| --- | --- |
| `.hglobe` | Its box: square, as wide as its container |
| `.hglobe-view` | The picture, filling the box: an image, or hidden |
| `.hglobe-canvas` | The canvas it's drawn on |
| `.hglobe-controls` | Its controls, in the bottom corner |
| `.hglobe-pause-icon`, `.hglobe-play-icon` | Pause's two icons, one shown at a time by its `aria-pressed` |

### What your script does

`createGlobe.ts`'s `createGlobe(canvas, options)` draws it, with options named as
the React props, but for `controls`, which are your markup's, and
`onUnavailable`, called without WebGL 2. It returns `{ setPaused, turn, destroy }`: `turn(degrees)`
turns it, positive to the left, and `destroy()` lets it go, for a globe you
remove. Import it with three.js through your bundler; the playground's
[globe.js](../../examples/html/src/scripts/globe.js) loads a bundle of it
only on a page with a globe. It:

- Starts as the globe first comes into view, and draws only while it's on
  screen and the page is shown: every frame while it moves, and while
  paused, only as it's turned, resized, or recolored.
- Puts a dot wherever there's land, about 4,600, drawn at once, which
  twinkle and fade toward the globe's edge; those on the far side are
  skipped.
- Draws each route along the shortest way round, lifted off the surface by
  more the longer it is, with a dot at each end, and a light travelling
  along it in four and a half seconds.
- Turns it slowly, and with a drag, with three.js's OrbitControls, easing
  to a stop; not zooming. On a touch screen, a sideways drag turns it, and a
  swipe up or down scrolls the page. The pointer shows a hand to grab it
  with. With `dragRotate` false, it doesn't listen to the pointer at all. Each arrow turns it 30 degrees, easing
  in and out over 400ms, at once with reduced motion.
- Fits the canvas to its box as that resizes, at up to twice the screen's
  pixel density, and at most about a million pixels.
- Reads its colors from its custom properties, again as the color scheme,
  the theme, or the accent changes.
- Without WebGL 2, leaves the box empty and calls `onUnavailable`; React's
  Globe hides its controls then.

Your script wires the controls: the arrows call `turn(30)` and `turn(-30)`,
and Pause toggles its `aria-pressed` and calls `setPaused`.

## Customize

- **Colors**: `--hglobe-sphere-color`, `--hglobe-dot-color`, and
  `--hglobe-route-color`, on `.hglobe`: the background secondary, the
  tertiary text, and the primary color by default. A color with
  transparency makes the sphere, the dots, or the routes see-through.
- **Size**: its container's width, as large as you like; it's square.
- **Words**: the controls' names, "Globe", "Turn left", "Pause", and "Turn
  right", in `Globe.tsx`'s `words`.
- **Density and speed**: in `createGlobe.ts`, the dot count, the dots' size, the
  pixel budget, and how fast it turns and the lights travel.

## Accessibility

- Named, the picture is an image, `role="img"`, its name what the globe
  says, such as the routes it shows; unnamed, it's hidden from screen
  readers, as decoration. Its controls are outside it, so they're reached
  either way.
- Pause, a toggle, stops all its motion, as WCAG 2.2.2 asks for something
  that moves on its own beside other content; it starts paused with reduced
  motion.
- The arrows turn it without dragging, from the keys or with one press, as
  WCAG 2.1.1 and 2.5.7 ask; dragging is the same turning, for those who
  want it.
- With `controls={false}`, pausing is your page's, through `paused`, and
  only a drag turns it, which needs a pointer: fine for decoration; where
  turning it shows something people need, keep the controls. See
  [Pausing and turning](#pausing-and-turning).

## Design details

- **Globe**: a sphere in `--harmo-color-background-secondary`; the land's
  dots in `--harmo-color-text-tertiary`, twinkling slowly, each on its own
  beat, and fading toward the edge, so it reads as round; seen at 32°,
  filling nine tenths of its box.
- **Routes**: arcs in `--harmo-color-primary`, lifted by up to an eighth of
  the globe's radius, a dot at each end, and a light along each, larger
  than the land's dots.
- **Controls**: three small tertiary Buttons in the bottom corner, 2px
  apart, where the round globe leaves room, or two, the arrows, on a still
  globe; Pause shows a play icon while it's pressed.
- **Motion**: it turns about one revolution every 100 seconds; a drag
  eases to a stop; an arrow turns it 30 degrees in 400ms, easing in and
  out. It tilts as far as a little past each pole's side, so the equator
  stays near the middle, and as far as the center you give it.
