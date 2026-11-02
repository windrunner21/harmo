// Example only: a button that loads for two seconds, as the React Button
// does while its action runs. aria-disabled keeps focus on it, so the script
// ignores presses while it is busy.
{
  for (const button of document.querySelectorAll("[data-example-loading]")) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-busy") === "true") return;

      const spinner = document.createElement("span");
      spinner.className = "hspinner";
      spinner.setAttribute("aria-hidden", "true");
      button.append(spinner);
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");

      setTimeout(() => {
        spinner.remove();
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
      }, 2000);
    });
  }
}
