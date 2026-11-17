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
