// Example only: the show/hide toggle and the strength feedback, as the React
// PasswordInput does them. Both also run once at load, for a field that
// starts with a value, and again after its form resets, once the browser has
// put its first value back. While the field shows an error, such as a form's
// "This password has appeared in a data breach", the strength's word and
// meter step aside, so a green "Strong" never sits beside it. A password
// that shows is hidden again as its form is sent, and as the page comes back
// from the browser's back-forward cache.
{
  // Runs `then` after the form an input belongs to resets, even one it joined
  // later, unless the reset was cancelled.
  const onReset = (input, then) =>
    document.addEventListener(
      "reset",
      (event) => {
        if (event.target !== input.form) return;
        setTimeout(() => {
          if (!event.defaultPrevented) then();
        });
      },
      true,
    );

  // Runs `then` as the form an input belongs to is sent, whether or not a
  // listener cancels it, before any other listener and before the browser
  // reads the form, so it never sees the password as text.
  const onSubmit = (input, then) =>
    document.addEventListener(
      "submit",
      (event) => {
        if (event.target === input.form) then();
      },
      true,
    );

  // Runs `then` as the page comes back from the back-forward cache, as it
  // was left.
  const onRestore = (then) =>
    addEventListener("pageshow", (event) => {
      if (event.persisted) then();
    });

  // The toggle shows once something is typed, and is disabled with the
  // input. Its label stays "Show password"; aria-pressed says whether the
  // password shows, and the tooltip names the next click. Sending the form,
  // a reset, and coming back to the page hide the password again.
  for (const toggle of document.querySelectorAll(".hpassword-toggle")) {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    const tip = toggle.parentElement.querySelector(".htooltip");
    const reveal = (show) => {
      toggle.setAttribute("aria-pressed", show);
      input.type = show ? "text" : "password";
      if (tip) tip.textContent = show ? "Hide password" : "Show password";
    };
    toggle.addEventListener("click", () => reveal(toggle.getAttribute("aria-pressed") !== "true"));
    const sync = () => {
      toggle.hidden = input.value === "";
      toggle.disabled = input.disabled;
    };
    input.addEventListener("input", sync);
    new MutationObserver(sync).observe(input, { attributeFilter: ["disabled"] });
    onReset(input, () => {
      reveal(false);
      sync();
    });
    onSubmit(input, () => reveal(false));
    onRestore(() => reveal(false));
    sync();
  }

  // An example strength rule and wording, which the app supplies.
  const levels = [
    { word: "", hint: "" },
    {
      word: "Too weak",
      hint: "Passwords need to be at least 10 characters. Include multiple words and phrases to make it more secure.",
      status: "error",
    },
    { word: "Medium", hint: "Include multiple words and phrases to make it more secure." },
    { word: "Strong", hint: "", status: "success" },
  ];
  const strength = (value) => {
    if (value === "") return 0;
    if (value.length < 10) return 1;
    const kinds = [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/];
    return kinds.every((kind) => kind.test(value)) ? 3 : 2;
  };

  for (const input of document.querySelectorAll("[data-example-password-strength]")) {
    const field = input.closest(".hfield");
    const word = field.querySelector(".hpassword-strength");
    const details = field.querySelector(".hpassword-details");
    const meter = field.querySelector(".hmeter");
    const hint = field.querySelector(".hpassword-hint");
    const error = field.querySelector(":scope > .herror");
    let shown = 0;

    // Hidden while the field's error has text, and out of the input's
    // description, so a screen reader doesn't read them with it either.
    const stepAside = () => {
      const aside = Boolean(error?.textContent);
      word.hidden = aside;
      details.hidden = shown === 0 || aside;
      const ids = (input.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && id !== word.id && id !== hint.id);
      if (!aside) ids.push(word.id, hint.id);
      input.setAttribute("aria-describedby", ids.join(" "));
    };

    const sync = () => {
      const value = strength(input.value);
      // The word is a live region: change it only when the level changes, so
      // screen readers announce each level once rather than every keystroke.
      if (value === shown) return;
      shown = value;
      const level = levels[value];
      stepAside();
      // Emptied, the details keep the last meter and hint while they close.
      if (value === 0) {
        word.textContent = "";
        word.removeAttribute("data-status");
        if (!error?.textContent) input.removeAttribute("aria-invalid");
        return;
      }
      word.textContent = level.word;
      hint.textContent = level.hint;
      meter.setAttribute("aria-valuenow", value);
      if (level.word) meter.setAttribute("aria-valuetext", level.word);
      else meter.removeAttribute("aria-valuetext");
      for (const element of [word, meter, hint]) {
        if (level.status) element.dataset.status = level.status;
        else element.removeAttribute("data-status");
      }
      meter.querySelectorAll(".hmeter-segment").forEach((segment, index) => {
        segment.toggleAttribute("data-filled", index < value);
      });
      // A too-weak password marks the input invalid, as an error does.
      if (value === 1) input.setAttribute("aria-invalid", "true");
      else if (!error?.textContent) input.removeAttribute("aria-invalid");
    };
    input.addEventListener("input", sync);
    onReset(input, sync);
    if (error) new MutationObserver(stepAside).observe(error, { childList: true, characterData: true, subtree: true });
    sync();
    stepAside();
  }
}
