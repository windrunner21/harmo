// Hydrates each example the build rendered, marks it data-play-ready once its
// effects have run, and mounts it again when its Replay button is pressed,
// which restarts its animations.

import { hydrateRoot } from "react-dom/client";
import { components } from "./examples.ts";
import { Ready } from "./Ready.tsx";

for (const element of document.querySelectorAll<HTMLElement>("[data-play-root]")) {
  const { playRoot = "", playExample = "" } = element.dataset;
  const Example = components[playRoot]?.[playExample];
  if (!Example) continue;

  // The prefix the build rendered it with, so the ids match and stay unique
  // on the page.
  const identifierPrefix = `${element.closest(".play-example")?.id}-`;
  const ready = () => element.setAttribute("data-play-ready", "");
  const root = hydrateRoot(
    element,
    <Ready onReady={ready}>
      <Example />
    </Ready>,
    { identifierPrefix },
  );

  let mounts = 0;
  element
    .closest(".play-specimen")
    ?.querySelector("[data-play-remount]")
    ?.addEventListener("click", () => {
      element.removeAttribute("data-play-ready");
      root.render(
        <Ready key={++mounts} onReady={ready}>
          <Example />
        </Ready>,
      );
    });
}
