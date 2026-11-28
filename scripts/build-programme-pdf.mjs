// Builds CM4_2026_Programme_Print.pdf (A4 landscape) from programme/index.html,
// so the printed programme always matches the website.
// Requires Playwright with Chromium:  npm install playwright && npx playwright install chromium
// Usage:  node scripts/build-programme-pdf.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "CM4_2026_Programme_Print.pdf");
const asset = (path) => `data:image/png;base64,${readFileSync(join(root, path)).toString("base64")}`;

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(root, "programme/index.html")).href);

// Read the programme as plain data from the website markup.
const days = await page.evaluate(() => {
  const text = (node, selector) => node.querySelector(selector)?.textContent.trim() ?? "";
  const talk = (node) => ({
    kind: "talk",
    time: text(node, ":scope > time"),
    name: text(node, "strong"),
    affiliation: text(node, ".affiliation").replace(/^·\s*/, ""),
    title: text(node, ".talk-title")
  });
  return [...document.querySelectorAll(".day")].map((day) => {
    const rows = [];
    const posters = [];
    for (const item of day.querySelectorAll(":scope .schedule > li")) {
      if (item.classList.contains("session")) {
        const lecture = item.querySelector(".single-lecture");
        if (lecture) {
          const details = [...lecture.querySelectorAll(":scope > div > .detail")].map((d) => d.textContent.trim());
          rows.push({
            kind: "lecture",
            time: text(lecture, ":scope > time"),
            label: details[0] ?? "",
            name: text(lecture, "strong"),
            affiliation: text(lecture, ".affiliation").replace(/^·\s*/, ""),
            title: text(lecture, ".talk-title"),
            chair: (details[1] ?? "").replace(/^Chair:\s*/, "")
          });
          continue;
        }
        const heading = item.querySelector(".session-heading");
        rows.push({
          kind: "session",
          time: text(heading, ":scope > time"),
          title: text(heading, "h3, h4"),
          chair: text(heading, ".detail").replace(/^Chair:\s*/, "")
        });
        item.querySelectorAll(".talk").forEach((node) => rows.push(talk(node)));
        continue;
      }
      const label = item.querySelector(":scope > div > strong")?.textContent.trim() ?? "";
      const detail = item.querySelector(":scope > div > .detail")?.textContent.trim() ?? "";
      const list = [...item.querySelectorAll(".poster-list > li")].map((poster) => ({
        number: text(poster, ".poster-number"),
        title: text(poster, "strong"),
        byline: text(poster, ".detail")
      }));
      const time = text(item, ":scope > time");
      if (list.length) posters.push({ label, time, chair: detail.replace(/^Chair:\s*/, ""), list });
      rows.push({
        kind: item.classList.contains("entry-break") ? "break" : "event",
        time, label,
        chair: detail.replace(/^Chair:\s*/, ""),
        posterRange: list.length ? `${list[0].number}–${list.at(-1).number}` : ""
      });
    }
    return { name: text(day, ".day-name"), rows, posters };
  });
});

const chairCell = (title, chair) => {
  const named = title && !/^Scientific session/i.test(title) ? `<b>${esc(title)}</b> &nbsp;|&nbsp; ` : "";
  return `${named}<span class="caps">Session chair</span> &nbsp;|&nbsp; <b>${esc(chair)}</b>`;
};

let talkIndex = 0;
const row = (r) => {
  switch (r.kind) {
    case "session":
      talkIndex = 0;
      return `<tr class="chair"><td class="time">${esc(r.time)}</td><td>${chairCell(r.title, r.chair)}</td></tr>`;
    case "talk":
      if (!r.affiliation && !r.title) return `<tr class="break"><td class="time">${esc(r.time)}</td><td class="caps">${esc(r.name)}</td></tr>`;
      return `<tr class="talk ${talkIndex++ % 2 ? "alt" : ""}"><td class="time">${esc(r.time)}</td><td><b>${esc(r.name)}</b>, ${esc(r.affiliation)}<div class="title">${esc(r.title)}</div></td></tr>`;
    case "lecture":
      return `<tr class="event"><td class="time">${esc(r.time)}</td><td><b>${esc(r.label)} — ${esc(r.name)}, ${esc(r.affiliation)}</b>${r.chair ? ` &nbsp;|&nbsp; <span class="red">Chair: ${esc(r.chair)}</span>` : ""}<div class="title">${esc(r.title)}</div></td></tr>`;
    case "break":
      return `<tr class="break"><td class="time">${esc(r.time)}</td><td class="caps">${esc(r.label)}</td></tr>`;
    default: {
      const chair = r.chair ? `<div><span class="caps red">Session chair</span> &nbsp;|&nbsp; <span class="red"><b>${esc(r.chair)}</b></span></div>` : "";
      const posters = r.posterRange ? `<div class="note">Posters ${esc(r.posterRange)}: see poster list</div>` : "";
      return `<tr class="event"><td class="time">${esc(r.time)}</td><td><b>${esc(r.label)}</b>${chair}${posters}</td></tr>`;
    }
  }
};

const dayPage = (day, index) => `
<section class="day">
  ${index === 0 ? `<header class="banner"><img src="${asset("assets/print/cm4-logo.png")}" alt=""><div><h1>CM4 2026</h1><p class="conf">International Conference on Computational and<br>Machine Learning Modelling of Molecules and Materials</p><p>Club Mahindra Poovar, Thiruvananthapuram, Kerala, India<br>3–6 December 2026 · https://www.cm4-2026.org · All times IST</p></div><img src="${asset("assets/print/duk-logo.png")}" alt=""></header>` : `<p class="kicker">CM4 2026</p>`}
  <h2>${esc(day.name)} 2026 <small>| 3–6 December 2026</small></h2>
  <table><thead><tr><th>Time</th><th>Session / speaker details</th></tr></thead><tbody>${day.rows.map(row).join("")}</tbody></table>
</section>`;

const posterPage = (day, session) => `
<section class="posters">
  <h3>${esc(session.label)}</h3>
  <p>${esc(day.name)} 2026 &nbsp;|&nbsp; ${esc(session.time)} IST</p>
  <p class="red"><span class="caps">Session chair</span> &nbsp;|&nbsp; <b>${esc(session.chair)}</b></p>
  <ol>${session.list.map((p) => `<li><b>${esc(p.number)}&nbsp; ${esc(p.title)}</b><span>${esc(p.byline)}</span></li>`).join("")}</ol>
</section>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CM4 2026 Programme</title><style>
@page { size: A4 landscape; margin: 11mm 12mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 9.6pt/1.3 Carlito, Calibri, "Liberation Sans", Arial, sans-serif; color: #1b2733; }
.day, .posters { break-before: page; }
.day:first-child { break-before: auto; }
.banner { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; text-align: center; margin-bottom: 4mm; }
.banner img:first-child { height: 15mm; justify-self: start; }
.banner img:last-child { height: 12mm; justify-self: end; }
.banner h1 { font-size: 15pt; margin: 0 0 1mm; }
.banner p { margin: 0; font-size: 8.5pt; } .banner .conf { font-weight: 700; font-size: 10pt; margin-bottom: 1mm; }
.kicker { color: #0f6e68; font-weight: 700; margin: 0 0 1mm; }
h2 { color: #17375e; font-size: 19pt; margin: 0 0 3mm; }
h2 small { color: #44546a; font-size: 9pt; text-transform: uppercase; letter-spacing: .02em; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th { background: #17375e; color: #fff; text-align: left; text-transform: uppercase; font-size: 8.6pt; padding: 1.6mm 2.2mm; }
td { padding: 1.3mm 2.2mm; border-bottom: 1px solid #b7c7d9; vertical-align: middle; }
tr { break-inside: avoid; }
td.time { width: 22mm; font-weight: 700; white-space: nowrap; }
.chair td { background: #fde6d6; color: #a52a0a; }
.talk td { background: #dfeaf6; } .talk.alt td { background: #e0f0ea; }
.break td { background: #fdf2cf; }
.event td { background: #e9e4f4; }
.title { font-style: italic; color: #33475b; margin-top: .6mm; }
.caps { text-transform: uppercase; } .red { color: #a52a0a; }
.note { color: #44546a; font-size: 8.6pt; margin-top: .4mm; }
.posters h3 { color: #2b5797; font-size: 14pt; margin: 0 0 1mm; }
.posters > p { margin: 0 0 2mm; }
.posters ol { list-style: none; padding: 0; margin: 3mm 0 0; }
.posters li { margin: 0 0 2.4mm; break-inside: avoid; }
.posters li span { display: block; padding-left: 8.5mm; color: #44546a; font-size: 8.8pt; }
</style></head><body>
${days.map(dayPage).join("")}
${days.flatMap((day) => day.posters.map((session) => posterPage(day, session))).join("")}
</body></html>`;

await page.setContent(html, { waitUntil: "load" });
await page.pdf({ path: output, format: "A4", landscape: true, printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Wrote ${output} (${days.length} days, ${days.reduce((n, d) => n + d.posters.length, 0)} poster sessions).`);
