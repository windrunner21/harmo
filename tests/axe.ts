import type { Page } from "@playwright/test";
import { createRequire } from "node:module";

// axe, loaded into each page once and then run for each check. Loading it for
// every check made each one about three times slower.
export const axe = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

// Runs axe on the page as it loads, then on each example with its popup or
// dialog open, trigger included: each is opened as a click opens it, and
// checked once it has finished opening; one that doesn't open fails. A popup
// opened from inside another is checked with both open. All in one call to
// the page, since in WebKit each call takes about a tenth of a second.
export const checkAccessibility = (page: Page, only?: string[]) =>
  page.evaluate(async (only) => {
    const { axe } = window as unknown as { axe: typeof import("axe-core") };

    // Without fades: a browser may start one a frame or more after the click,
    // and text caught part-way through would fail on contrast.
    const noFades = document.createElement("style");
    noFades.textContent = "*, ::before, ::after { transition: none !important; }";
    document.head.append(noFades);

    // axe's WCAG 2.2 A and AA rules, or only the rules named, less any named
    // as exceptions. Without preloading: axe would fetch the stylesheets
    // again, which a page opened from disk isn't allowed to.
    const run = async (context: import("axe-core").ElementContext, except: string[] = []) => {
      const { violations } = await axe.run(context, {
        runOnly: only
          ? { type: "rule", values: only }
          : { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        rules: Object.fromEntries(except.map((rule) => [rule, { enabled: false }])),
        resultTypes: ["violations"],
        preload: false,
      });
      return violations.map(({ id, help, nodes }) => ({
        rule: `${id}: ${help}`,
        elements: nodes.map((node) => node.target.join(" ")),
      }));
    };

    const loaded = await run(document);
    const popups: { trigger: string; violations: { rule: string; elements: string[] }[] }[] = [];
    const nameOf = (element: HTMLElement) => element.innerText.trim() || element.getAttribute("aria-label") || `#${element.id}`;

    // Every command button reaches what its command acts on: a popover for
    // the popover commands, any element for an app's own, and otherwise a
    // dialog. Below, a dialog whose button misses would still open, by script.
    if (!only) {
      for (const button of document.querySelectorAll<HTMLElement>(".play-demo [commandfor]")) {
        const command = button.getAttribute("command") ?? "";
        const target = document.getElementById(button.getAttribute("commandfor") ?? "");
        const popover = command.endsWith("-popover");
        const reaches = command.startsWith("--") ? target !== null : popover ? !!target?.hasAttribute("popover") : target instanceof HTMLDialogElement;
        if (!reaches) {
          loaded.push({
            rule: `command="${command}" with a commandfor that isn't a ${popover ? "popover" : "dialog"}`,
            elements: [nameOf(button)],
          });
        }
      }
    }

    // Whether a popup opened, once it has finished opening: mid-fade, its
    // text would fail on contrast. Watched frame by frame, since WebKit may
    // start the fade a frame or more after the click.
    const opened = async (popup: HTMLElement) => {
      for (let frame = 0; frame < 120; frame++) {
        await new Promise(requestAnimationFrame);
        const moving = popup.getAnimations().some((animation) => animation.playState !== "finished");
        if (popup.matches(":popover-open") && !moving && getComputedStyle(popup).opacity === "1") break;
      }
      return popup.matches(":popover-open");
    };

    // A list that scrolls must be reachable with the keyboard. A listbox
    // is: it, or its select's trigger, takes focus when it opens, and the
    // arrow keys scroll it (see listbox.spec.ts). axe only sees that the
    // list itself isn't in the Tab order.
    const check = async (popup: HTMLElement, example: Element, trigger: string) => {
      const listbox = popup.querySelector('[role="listbox"]') !== null;
      const violations = await run({ include: [[`[id="${example.id}"]`]] }, listbox ? ["scrollable-region-focusable"] : []);
      popups.push({ trigger, violations });
    };

    // Opens a popup with its popovertarget button, checks it, then each popup
    // a button inside it opens, such as a Select in a filter's panel.
    const openWith = async (trigger: HTMLElement, example: Element, within?: string): Promise<void> => {
      const popup = document.getElementById(trigger.getAttribute("popovertarget") ?? "");
      if (!popup) return;
      const name = within ? `${within} › ${nameOf(trigger)}` : nameOf(trigger);
      trigger.scrollIntoView({ block: "center" });
      if (!popup.matches(":popover-open")) trigger.click();
      if (!(await opened(popup))) {
        popups.push({ trigger: name, violations: [{ rule: "the popup didn't open", elements: [`#${popup.id}`] }] });
        return;
      }
      await check(popup, example, name);
      if (!within) {
        for (const inner of popup.querySelectorAll<HTMLElement>('[popovertarget]:enabled:not([aria-disabled="true"])')) {
          if (inner.getAttribute("popovertarget") === popup.id || !inner.checkVisibility()) continue;
          await openWith(inner, example, name);
        }
      }
      popup.hidePopover();
    };

    // An aria-disabled trigger may rightly refuse to open, so it isn't opened.
    const triggers = document.querySelectorAll<HTMLElement>(
      '.play-demo [popovertarget]:not(.hpopup [popovertarget]):enabled:not([aria-disabled="true"])',
    );
    for (const trigger of triggers) {
      const example = trigger.closest(".play-example");
      if (example) await openWith(trigger, example);
    }

    // Lists a script opens from their field, which has no popovertarget, such
    // as a Combobox's or a Command Menu's under a search field, opened as a
    // click opens them. A read-only field, or one with nothing to show, stays
    // closed, so isn't checked.
    const fields = document.querySelectorAll<HTMLElement>(
      '.play-demo [role="combobox"]:not([popovertarget], .hpopup [role="combobox"]):enabled:not([aria-disabled="true"])',
    );
    for (const field of fields) {
      const popup = document.getElementById(field.getAttribute("aria-controls") ?? "")?.closest<HTMLElement>(".hpopup[popover]");
      const example = field.closest(".play-example");
      if (!popup || !example || popup.matches(":popover-open")) continue;
      field.scrollIntoView({ block: "center" });
      field.focus();
      field.click();
      if (!(await opened(popup))) continue;
      await check(popup, example, nameOf(field));
      popup.hidePopover();
    }

    // Each example's dialog, opened by its button, or else by its script's
    // showModal(), as a link opens one, and checked once it has finished
    // opening, as a popup is. One that doesn't open as a modal fails.
    for (const dialog of document.querySelectorAll<HTMLDialogElement>(".play-demo dialog")) {
      const example = dialog.closest(".play-example");
      if (!example) continue;
      const opener = example.querySelector<HTMLElement>(`[commandfor="${dialog.id}"][command="show-modal"]:enabled`);
      if (opener) {
        opener.scrollIntoView({ block: "center" });
        opener.click();
      } else dialog.showModal();
      for (let frame = 0; frame < 120; frame++) {
        await new Promise(requestAnimationFrame);
        const moving = dialog.getAnimations().some((animation) => animation.playState !== "finished");
        if (dialog.open && !moving && getComputedStyle(dialog).opacity === "1") break;
      }
      const shown = dialog.matches(":modal") && getComputedStyle(dialog).opacity === "1";
      const violations = shown
        ? await run({ include: [[`[id="${example.id}"]`]] })
        : [{ rule: "the dialog didn't open as a modal", elements: [`#${dialog.id}`] }];
      popups.push({ trigger: opener?.innerText.trim() ?? `#${dialog.id}`, violations });
      dialog.close();
      for (const animation of dialog.getAnimations()) animation.finish();
    }
    noFades.remove();
    return { loaded, popups };
  }, only);
