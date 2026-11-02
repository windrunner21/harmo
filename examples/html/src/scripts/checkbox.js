// Example only: the mixed state is a DOM property with no HTML attribute, so
// a script sets it, as an app does for "select all" over a partial selection.
{
  for (const checkbox of document.querySelectorAll("[data-example-indeterminate]")) {
    checkbox.indeterminate = true;
  }
}
