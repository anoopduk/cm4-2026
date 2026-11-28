// Synchronises the complete homepage timetable and validates its time ranges.
// Usage: node scripts/generate-programme-highlight.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const programme = readFileSync(join(root, "programme/index.html"), "utf8");

const full = programme.match(/<nav class="day-nav"[\s\S]*?(?=<\/main>)/)?.[0]?.trim();
if (!full) throw new Error("Programme navigation or timetable not found");
const highlight = full.replaceAll(/<\/?h[23](?=[ >])/g, tag => tag.replace(/\d/, n => Number(n) + 1));
const minute = (s) => { const [h,m] = s.split(":").map(Number); return h * 60 + m; };
for (const [, day, body] of full.matchAll(/<section class="day" id="([^"]+)"([\s\S]*?)<\/section>/g)) {
  let end = -1;
  let previous = "";
  for (const [, range] of body.matchAll(/<(?:li class="entry[^"]*"|div class="entry [^"]*")><time>([^<]+)<\/time>/g)) {
    const m = range.match(/^(\d\d:\d\d)(?:[–-](\d\d:\d\d)| onwards)$/);
    if (!m) throw new Error(`${day}: invalid timetable range ${range}`);
    const start = minute(m[1]);
    if (start < end) throw new Error(`${day}: ${previous} overlaps ${range}`);
    end = m[2] ? minute(m[2]) : Infinity;
    if (end <= start) throw new Error(`${day}: reversed timetable range ${range}`);
    previous = range;
  }
}

const path = join(root, "index.html");
const source = readFileSync(path, "utf8");
const start = "<!-- GENERATED: PROGRAMME_HIGHLIGHT_START -->";
const end = "<!-- GENERATED: PROGRAMME_HIGHLIGHT_END -->";
const i = source.indexOf(start);
const j = source.indexOf(end);
if (i < 0 || j < i) throw new Error("Programme highlight markers are missing in index.html");
const generated = `${source.slice(0, i + start.length)}\n  ${highlight}\n  ${source.slice(j)}`;
if (generated !== source) {
  if (checkOnly) throw new Error("Programme highlight is out of date. Run node scripts/generate-programme-highlight.mjs");
  writeFileSync(path, generated);
}
console.log(`${checkOnly ? "Validated" : "Generated"} homepage timetable.`);
