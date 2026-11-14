// Example only: keep a textarea's character counter current, as the React
// TextArea does: as the text changes, and after its form resets, once the
// browser has put its first text back. The text is the app's: "12/500", or
// data-example-counter's own words, with {length}, {max}, and {left} filled
// in, as a formatCount would write them.
{
  for (const textarea of document.querySelectorAll("[data-example-counter]")) {
    const counter = textarea.closest(".hfield").querySelector(".htextarea-counter");
    const words = textarea.dataset.exampleCounter;
    const update = () => {
      const length = textarea.value.length;
      const max = textarea.maxLength;
      counter.textContent = words
        ? words.replace("{length}", length).replace("{max}", max).replace("{left}", max - length)
        : `${length}/${max}`;
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
