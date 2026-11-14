// Example only: keep a textarea's character counter current, as the React
// TextArea does: as the text changes, and after its form resets, once the
// browser has put its first text back.
{
  for (const textarea of document.querySelectorAll("[data-example-counter]")) {
    const counter = textarea.closest(".hfield").querySelector(".htextarea-counter");
    const update = () => {
      counter.textContent = `${textarea.value.length}/${textarea.maxLength}`;
    };
    textarea.addEventListener("input", update);
    // The form it belongs to when it resets, even one it joined later.
    document.addEventListener(
      "reset",
      (event) => {
        if (event.target !== textarea.form) return;
        setTimeout(() => {
          if (!event.defaultPrevented) update();
        });
      },
      true,
    );
    update();
  }
}
