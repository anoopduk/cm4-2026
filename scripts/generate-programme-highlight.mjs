// Writes the front-page programme highlight (one line per day plus that day's
// 45-minute lectures) from programme/index.html, so the two never disagree.
// Usage: node scripts/generate-programme-highlight.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const programme = readFileSync(join(root, "programme/index.html"), "utf8");

const strip = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const minutes = (range) => {
  const [a, b] = range.split(/[–-]/).map((t) => t.trim().split(":").map(Number));
  return b ? (b[0] * 60 + b[1]) - (a[0] * 60 + a[1]) : 0;
};
const list = (names) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

const days = [...programme.matchAll(/<section class="day" id="([^"]+)"[\s\S]*?(?=<section class="day" |<\/div>\s*<\/main>|$)/g)].map(([block, id]) => {
  const name = strip(block.match(/class="day-name"[^>]*>([\s\S]*?)<\/h\d>/)?.[1] ?? "");
  const note = strip(block.match(/class="day-note"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
  const lectures = [...block.matchAll(/<li class="talk"><time>([^<]+)<\/time><div><strong>([^<]+)<\/strong>(?:(?!<\/li>)[\s\S])*?<span class="talk-title">([\s\S]*?)<\/span>/g)]
    .filter(([, time]) => minutes(time) >= 45)
    .map(([, , speaker, title]) => `${strip(speaker)}${/\(online\)/i.test(title) ? " (online)" : ""}`);
  const special = [...block.matchAll(/class="entry single-lecture"><time>[^<]+<\/time><div><span class="detail">([^<]+)<\/span><strong>([^<]+)<\/strong>/g)]
    .map(([, label, speaker]) => `${strip(label)} by ${strip(speaker)}`);
  const [weekday, date] = name.split(",").map((s) => s.trim());
  return { id, short: `${weekday.slice(0, 3)} ${date.replace(/ (\w{3})\w*$/, " $1")}`, note, lectures, special };
});
if (days.length !== 4) throw new Error(`Expected 4 programme days, found ${days.length}`);

const highlight = `<ol class="day-highlights">
${days.map((day) => {
  const parts = [];
  if (day.lectures.length) parts.push(`Including lectures by ${list(day.lectures.map(esc))}`);
  if (day.special.length) parts.push(day.special.map(esc).join("; "));
  return `    <li><a href="/programme/#${esc(day.id)}">${esc(day.short)}</a><div><strong>${esc(day.note)}</strong>${parts.length ? `<span>${parts.join(". ")}.</span>` : ""}</div></li>`;
}).join("\n")}
  </ol>`;

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
console.log(`${checkOnly ? "Validated" : "Generated"} programme highlight for ${days.length} days.`);
