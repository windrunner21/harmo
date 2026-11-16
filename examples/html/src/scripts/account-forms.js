// Example only: what an app's script does for Account Forms, as the React
// pattern does. Each form inside keeps its own script, sign-in-form.js,
// sign-up-form.js, and reset-password.js, which find it by its hook; this one
// only switches between them. A click on a link to another of the three
// forms' pages shows that form in place of the one shown, rather than leaving
// the page, unless the click had a modifier key, which opens the page as the
// reader asked, or the app has already handled it. The form that shows starts
// at the size of the one leaving and grows or shrinks to its own, its content
// fading in, and its title takes focus, so a screen reader reads it; the email
// typed in the form left goes to its email field. A view can hold a form's
// next step, such as Verify Code's card, in the form's place: the card shown
// is the one without hidden.
{
  // Changes a card to its next step: measures the card, makes the change, and
  // measures the card shown then, `next` when that's another, as when Account
  // Forms switches forms. Its height, and its width if that changed, go from
  // the old size to the new with --harmo-ease-out-cubic, over
  // --harmo-duration-normal and half a millisecond more for each pixel, up to
  // 150ms more, its content clipped and packed at its start meanwhile; then
  // nothing is left inline, so it sizes itself again. What stays in the card,
  // such as the band along its bottom, goes from where it was to where it is
  // now, as the card's edge does. What the change shows fades in over
  // --harmo-duration-normal with --harmo-ease-out-cubic, and what it took
  // away goes at once. A change while one plays starts from where it had got
  // to, as the animations' ids find it, whichever script started them. Under
  // reduced motion, only the fade plays.
  const changeStep = (card, change, next = card) => {
    const token = (name) => getComputedStyle(next).getPropertyValue(name).trim();
    const milliseconds = (value, fallback) =>
      Number.isFinite(parseFloat(value)) ? parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) : fallback;
    const isShown = (element) => getComputedStyle(element).display !== "none";
    // The computed size, so a card mid-resize measures where it has got to.
    const sizeOf = (element) => {
      const { width, height } = getComputedStyle(element);
      return { width: parseFloat(width) || 0, height: parseFloat(height) || 0 };
    };
    const offsetOf = (child, parent) => {
      const inner = child.getBoundingClientRect();
      const outer = parent.getBoundingClientRect();
      return { x: inner.left - outer.left, y: inner.top - outer.top };
    };
    const playing = (element, id) => element.getAnimations().filter((animation) => animation.id === id);

    // Takes away what it set inline, once the card isn't resizing, and the
    // style attribute if that leaves it empty. Chrome writes a changed inline
    // style to the attribute only as it's read, so it's read first, or it
    // would come back empty after its removal.
    const unclip = (element) => {
      if (playing(element, "harmo-step-resize").length) return;
      for (const name of ["overflow", "align-content", "overflow-anchor"]) element.style.removeProperty(name);
      if (!element.style.length && element.getAttribute("style") !== null) element.removeAttribute("style");
    };

    // Nothing in the card anchors the page's scroll until it has resized: the
    // browser would scroll to keep what stays, such as its band, where it was
    // when the new step lays out to be measured.
    card.style.overflowAnchor = "none";
    const before = sizeOf(card);
    const shown = new Map([...card.children].filter(isShown).map((child) => [child, offsetOf(child, card)]));
    change();
    for (const element of [card, next, ...shown.keys()]) {
      for (const animation of [...playing(element, "harmo-step-resize"), ...playing(element, "harmo-step-move")]) {
        animation.cancel();
      }
    }
    const after = sizeOf(next);
    const fade = milliseconds(token("--harmo-duration-normal"), 200);
    const started = [];

    for (const child of next.children) {
      if (shown.has(child) || !isShown(child)) continue;
      started.push(
        child.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: fade,
          easing: token("--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
        }),
      );
    }

    const wider = Math.abs(after.width - before.width);
    const distance = Math.max(wider, Math.abs(after.height - before.height));
    const timing = {
      duration: fade + Math.min(distance, 300) / 2,
      easing: token("--harmo-ease-out-cubic") || "cubic-bezier(0.215, 0.61, 0.355, 1)",
    };
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const [child, was] of still ? [] : shown) {
      if (child.parentElement !== next || !isShown(child)) continue;
      const now = offsetOf(child, next);
      const x = was.x - now.x;
      const y = was.y - now.y;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;
      started.push(child.animate([{ translate: `${x}px ${y}px` }, { translate: "0 0" }], { ...timing, id: "harmo-step-move" }));
    }

    if (!still && distance >= 1 && before.width >= 1 && before.height >= 1) {
      const from = { height: `${before.height}px` };
      const to = { height: `${after.height}px` };
      if (wider >= 1) {
        from.width = `${before.width}px`;
        to.width = `${after.width}px`;
      }
      const animation = next.animate([from, to], { ...timing, id: "harmo-step-resize" });
      started.push(animation);
      // A grid card would stretch its rows to the height it's given; packed
      // at its start, the new step lays out as it will end, clipped by the
      // card.
      next.style.overflow = "clip";
      next.style.alignContent = "start";
      next.style.overflowAnchor = "none";
      const done = () => unclip(next);
      animation.finished.then(done, done);
    }

    // Started on this frame, together, rather than once the compositor has
    // taken the fades, which can hold the card at its old size, empty, for a
    // frame or two.
    const now = document.timeline.currentTime;
    if (now !== null) for (const animation of started) animation.startTime = now;
    unclip(card);
    unclip(next);
  };

  // Moves focus into the new step without the page jumping as the card
  // resizes, then brings it into view if it's out of it.
  const focusStep = (element) => {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  for (const root of document.querySelectorAll(".haccount-forms[data-example-account-forms]")) {
    const views = [...root.querySelectorAll(":scope > .haccount-forms-view")];
    const cardIn = (view) => [...view.children].find((child) => !child.hidden);
    const emailIn = (view) => cardIn(view)?.querySelector('input[name="email"]:not([type="hidden"])');

    root.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      const shown = views.find((view) => !view.hidden);
      // The page each view stands in for; here a hook, in your app wherever
      // its addresses come from.
      const next = views.find(
        (view) => view !== shown && link && view.dataset.exampleAccountFormsPage === link.getAttribute("href"),
      );
      if (!next) return;
      event.preventDefault();

      const typed = emailIn(shown)?.value;
      const field = emailIn(next);
      if (typed && field) field.value = typed;

      changeStep(
        cardIn(shown),
        () => {
          shown.hidden = true;
          next.hidden = false;
        },
        cardIn(next),
      );
      // The Sign-in and Sign-up Forms' titles don't take focus on their own
      // pages, so they're made able to here.
      const title = cardIn(next).querySelector(".hauth-form-title");
      title.tabIndex = -1;
      focusStep(title);
    });
  }
}
