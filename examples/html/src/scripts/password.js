// Example only: the show/hide toggle and the strength feedback, as the React
// PasswordInput does them. Both also run once at load, for a field that
// starts with a value.
{
  // The toggle shows once something is typed. Its label stays "Show
  // password"; aria-pressed says whether the password shows, and the tooltip
  // names the next click.
  for (const toggle of document.querySelectorAll(".hpassword-toggle")) {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    const tip = toggle.parentElement.querySelector(".htooltip");
    toggle.addEventListener("click", () => {
      const show = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", show);
      input.type = show ? "text" : "password";
      if (tip) tip.textContent = show ? "Hide password" : "Show password";
    });
    const sync = () => {
      toggle.hidden = input.value === "";
    };
    input.addEventListener("input", sync);
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
    let shown = 0;

    const sync = () => {
      const value = strength(input.value);
      // The word is a live region: change it only when the level changes, so
      // screen readers announce each level once rather than every keystroke.
      if (value === shown) return;
      shown = value;
      const level = levels[value];
      details.hidden = value === 0;
      word.textContent = level.word;
      hint.textContent = level.hint;
      meter.setAttribute("aria-valuenow", value);
      meter.setAttribute("aria-valuetext", level.word || "Empty");
      for (const element of [word, meter, hint]) {
        if (level.status) element.dataset.status = level.status;
        else element.removeAttribute("data-status");
      }
      meter.querySelectorAll(".hmeter-segment").forEach((segment, index) => {
        segment.toggleAttribute("data-filled", index < value);
      });
      // A too-weak password marks the input invalid.
      if (value === 1) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };
    input.addEventListener("input", sync);
    sync();
  }
}
