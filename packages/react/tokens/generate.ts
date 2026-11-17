// Writes packages/react/src/customProperties.ts from the custom properties in
// packages/css/src. Run it with mise run build:tokens after adding or renaming
// one, and commit both.
import { join } from "node:path";
import { customPropertiesTs } from "./customProperties.ts";

await Bun.write(join(import.meta.dir, "..", "src", "customProperties.ts"), customPropertiesTs());
console.log("customProperties.ts written");
