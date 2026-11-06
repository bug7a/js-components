"use strict";

// npm runs this before it publishes. WHY: _npm/create-basicjs/ has only the tool: a package published from there has
// no starter, and "npm create" fails for everybody (0.1.0).

const fs = require("fs");
const path = require("path");

const PACKAGE = path.resolve(__dirname, "..");
const NEEDED = ["payload/starter/_basic/basic/basic.js", "payload/starter/AGENTS.md", "payload/templates/shop/index.htm"];
const missing = NEEDED.filter((file) => !fs.existsSync(path.join(PACKAGE, file)));

if (missing.length) {
    console.error("This is not the ready package. Run ./_make-npm.sh, then publish from _dist/create-basicjs/.");
    process.exit(1);
}
