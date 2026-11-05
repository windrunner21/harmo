// Writes packages/css/src/accents.scss from the palettes in
// packages/cli/src/palettes/, which the CLI's theme command adapts to any brand
// color too. Run it with mise run build:accents after changing a palette, and
// commit both.
import { join } from "node:path";
import { accentsScss } from "../../cli/src/palettes/palette.ts";

await Bun.write(join(import.meta.dir, "..", "src", "accents.scss"), accentsScss());
console.log("accents.scss written");
