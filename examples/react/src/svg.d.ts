// An SVG file imported with { type: "text" } is its source.
declare module "*.svg" {
  const source: string;
  export default source;
}
