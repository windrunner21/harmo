// Example only: shows a visited link without depending on the reader's
// history. An empty href names the page being viewed, which the browser
// counts as visited; a link to any other playground page wouldn't show
// visited from file://.
{
  for (const link of document.querySelectorAll("[data-example-visited]")) {
    link.setAttribute("href", "");
  }
}
