// Example only: keep a textarea's character counter current, as the React
// TextArea will.
{
  for (const textarea of document.querySelectorAll("[data-example-counter]")) {
    const counter = textarea.closest(".hfield").querySelector(".htextarea-counter");
    const update = () => {
      counter.textContent = `${textarea.value.length}/${textarea.maxLength}`;
    };
    textarea.addEventListener("input", update);
    update();
  }
}
