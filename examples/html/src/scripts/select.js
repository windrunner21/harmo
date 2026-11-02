// Example only: once an option is chosen (listbox.js selects it), show the
// chosen labels in the trigger, or the placeholder when nothing is chosen,
// and keep the hidden inputs a form submits in step, as the React Select
// does. listbox.js closes a single select.
{
  for (const trigger of document.querySelectorAll(".hselect[popovertarget]")) {
    const popup = document.getElementById(trigger.getAttribute("popovertarget"));
    const listbox = popup.querySelector(".hlistbox");
    const value = trigger.querySelector(".hselect-value");
    const multiple = listbox.getAttribute("aria-multiselectable") === "true";
    const placeholder = value.dataset.examplePlaceholder ?? (value.hasAttribute("data-placeholder") ? value.textContent : "");
    const name = trigger.dataset.name;
    const chosen = () => [...listbox.querySelectorAll('.hoption[aria-selected="true"]')];
    const initial = chosen();
    // This select's hidden inputs are the ones right after its popup.
    let inputs = [];
    for (let next = popup.nextElementSibling; next?.matches('input[type="hidden"]') && next.name === name; next = next.nextElementSibling) {
      inputs.push(next);
    }

    // Show the chosen labels, and replace its hidden inputs with one per
    // chosen data-value; a single select always keeps one, as a native select
    // always sends a value. They're disabled with the trigger.
    const sync = () => {
      const options = chosen();
      const labels = options.map((option) => option.querySelector(".hoption-label").textContent.trim());
      value.textContent = labels.length ? labels.join(", ") : placeholder;
      value.toggleAttribute("data-placeholder", labels.length === 0);

      if (!name) return;
      const values = options.map((option) => option.dataset.value ?? "");
      if (!multiple && !values.length) values.push("");
      for (const input of inputs) input.remove();
      inputs = values.map((v) => Object.assign(document.createElement("input"), { type: "hidden", name, value: v, disabled: trigger.disabled }));
      popup.after(...inputs);
    };

    listbox.addEventListener("click", (event) => {
      const option = event.target.closest(".hoption");
      if (!option || option.getAttribute("aria-disabled") === "true") return;
      sync();
    });

    // A form reset restores the options chosen when the page loaded; a single
    // select's check mark moves back with its selection. It waits for the
    // reset to happen, since another listener may cancel it.
    trigger.form?.addEventListener("reset", (event) => {
      setTimeout(() => {
        if (event.defaultPrevented) return;
        for (const option of listbox.querySelectorAll(".hoption")) {
          option.setAttribute("aria-selected", String(initial.includes(option)));
        }
        const check = listbox.querySelector(".hoption-check");
        if (check && !multiple && initial[0]) initial[0].append(check);
        sync();
      });
    });

    // Disabling the trigger later disables its inputs as well.
    if (name) new MutationObserver(sync).observe(trigger, { attributeFilter: ["disabled"] });
  }

  // The form example shows what it would send instead of leaving the page.
  for (const form of document.querySelectorAll("form[data-example-form]")) {
    const output = form.querySelector("[data-example-submitted]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const sent = new URLSearchParams(new FormData(form)).toString();
      output.value = sent ? `Sends ${sent}` : "Sends nothing";
    });
  }
}
