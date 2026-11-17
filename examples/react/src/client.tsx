// Hydrates each example the build rendered, marks it data-play-ready once its
// effects have run, and mounts it again when its Replay button is pressed,
// which restarts its animations. Under StrictMode, as a framework's
// development server runs an app, so every effect and ref callback runs,
// is cleaned up, and runs again; the build renders it the same way, so the
// trees and their ids match.

import { Toaster } from "@harmo-ui/react";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { catalog } from "../../catalog.ts";
import { AccentPicker } from "./AccentPicker.tsx";
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from "./app-icons.tsx";
import { components } from "./examples.ts";
import { Ready } from "./Ready.tsx";

// The playground's own Accent picker, in the sidebar.
const accent = document.getElementById("play-accent-root");
if (accent) hydrateRoot(accent, <AccentPicker />, { identifierPrefix: "play-accent-" });

// A pattern's page has a Toaster, as an app's layout would, for the toasts its
// examples send as they succeed, where your app's next page would say so.
const patterns = new Set(catalog.filter((group) => group.patterns).flatMap((group) => group.entries.map(({ slug }) => slug)));
const page = document.querySelector<HTMLElement>("[data-play-root]")?.dataset.playRoot;
if (page && patterns.has(page)) {
  createRoot(document.body.appendChild(document.createElement("div"))).render(
    <Toaster
      label="Notifications (F8)"
      icons={{ success: <SuccessIcon />, error: <ErrorIcon />, warning: <WarningIcon />, info: <InfoIcon /> }}
    />,
  );
}

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
    <StrictMode>
      <Ready onReady={ready}>
        <Example />
      </Ready>
    </StrictMode>,
    { identifierPrefix },
  );

  let mounts = 0;
  element
    .closest(".play-specimen")
    ?.querySelector("[data-play-remount]")
    ?.addEventListener("click", () => {
      element.removeAttribute("data-play-ready");
      root.render(
        <StrictMode>
          <Ready key={++mounts} onReady={ready}>
            <Example />
          </Ready>
        </StrictMode>,
      );
    });
}
