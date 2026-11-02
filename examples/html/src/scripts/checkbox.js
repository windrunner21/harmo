// Example only: the mixed state is a DOM property with no HTML attribute, so
// a script sets it, as an app does for "select all" over a partial selection.
// And a checkbox can turn another control off and on, as an app's settings
// do; the control's own script follows its disabled.
{
  for (const checkbox of document.querySelectorAll("[data-example-indeterminate]")) {
    checkbox.indeterminate = true;
  }

  for (const checkbox of document.querySelectorAll("[data-example-enables]")) {
    const control = document.getElementById(checkbox.dataset.exampleEnables);
    checkbox.addEventListener("change", () => {
      control.disabled = !checkbox.checked;
    });
  }
}
