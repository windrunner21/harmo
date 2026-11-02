// Hydrates each example the build rendered, and mounts an example again when
// its Replay button is pressed, which restarts its animations.

import { hydrateRoot } from "react-dom/client";
import { components } from "./examples.ts";

for (const element of document.querySelectorAll<HTMLElement>("[data-play-root]")) {
  const { playRoot = "", playExample = "" } = element.dataset;
  const Example = components[playRoot]?.[playExample];
  if (!Example) continue;

  // The prefix the build rendered it with, so the ids match and stay unique
  // on the page.
  const identifierPrefix = `${element.closest(".play-example")?.id}-`;
  const root = hydrateRoot(element, <Example />, { identifierPrefix });

  let mounts = 0;
  element
    .closest(".play-specimen")
    ?.querySelector("[data-play-remount]")
    ?.addEventListener("click", () => root.render(<Example key={++mounts} />));
}
