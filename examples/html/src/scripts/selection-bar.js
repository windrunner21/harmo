// Example only: what your app does around a Selection Bar. Choosing tasks swaps
// the toolbar's controls for the bar and keeps its count; Deselect clears them,
// swaps back, and moves focus to the first task, since the button is gone.
{
  for (const example of document.querySelectorAll("[data-example-selection]")) {
    const controls = example.querySelector(".htoolbar-controls");
    const idle = controls.firstElementChild;
    const boxes = [...example.querySelectorAll(".hcheckbox")];

    const bar = document.createElement("div");
    bar.className = "hselection-bar";
    bar.innerHTML = `
      <span class="hselection-bar-count" role="status"></span>
      <button class="hselection-bar-deselect" type="button">Deselect</button>
      <button class="hbutton" data-variant="secondary" data-size="small" type="button"><span class="hbutton-label">Assign</span></button>`;
    const count = bar.querySelector(".hselection-bar-count");

    const show = () => {
      const selected = boxes.filter((box) => box.checked).length;
      count.textContent = `${selected} selected`;
      // Only on a change between the two, so the count stays put and its new
      // number is read out.
      const shown = selected > 0 ? bar : idle;
      if (controls.firstElementChild !== shown) controls.replaceChildren(shown);
    };

    for (const box of boxes) box.addEventListener("change", show);
    bar.querySelector(".hselection-bar-deselect").addEventListener("click", () => {
      for (const box of boxes) box.checked = false;
      show();
      boxes[0].focus();
    });
  }
}
