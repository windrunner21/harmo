// Example only: a Globe draws with three.js, which this playground loads only
// on a page that has one, as globe-bundle.js, built from the React pattern's
// createGlobe.ts with three: see src/globe-bundle.ts. Your page imports it
// from your bundle instead.
{
  if (document.querySelector(".hglobe")) {
    const script = document.createElement("script");
    script.src = "globe-bundle.js";
    document.head.append(script);
  }
}
