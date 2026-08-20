import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const participants = JSON.parse(readFileSync(join(root, "data/participants.json"), "utf8"));

const required = ["name", "sortKey", "initials", "affiliation", "image"];
const names = new Set();
const sortKeys = new Set();

for (const [index, participant] of participants.entries()) {
  for (const field of required) {
    if (!participant[field]) throw new Error(`Participant ${index + 1} is missing ${field}`);
  }
  if (names.has(participant.name)) throw new Error(`Duplicate participant name: ${participant.name}`);
  if (sortKeys.has(participant.sortKey)) throw new Error(`Duplicate sort key: ${participant.sortKey}`);
  names.add(participant.name);
  sortKeys.add(participant.sortKey);
  const imagePath = join(root, "assets/people", participant.image);
  if (!existsSync(imagePath)) throw new Error(`Missing portrait: ${imagePath}`);
}

const ordered = [...participants].sort((a, b) =>
  a.sortKey.localeCompare(b.sortKey, "en", { sensitivity: "base" })
);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const slug = ({ image }) => image.replace(/\.webp$/i, "");

const preview = `<div class="section-heading participant-preview-heading">
    <div><h2>Confirmed participants</h2><p class="participant-count"><strong>${ordered.length}</strong> participants</p></div>
    <p>Official or institutional profile links are provided where verified.</p>
  </div>
  <div class="participant-preview-row">
    <div class="participant-preview-label"><p>Participant portraits</p><span>${ordered.length} confirmed</span></div>
    <div class="participant-mosaic" aria-label="Confirmed participant portraits">
${ordered.map((participant) => `      <a class="participant-thumb" href="participants/#${escapeHtml(slug(participant))}" aria-label="View ${escapeHtml(participant.name)} in the participant directory" title="${escapeHtml(participant.name)}"><img src="assets/people/${escapeHtml(participant.image)}" alt="${escapeHtml(participant.name)}" loading="lazy" decoding="async" width="480" height="600"></a>`).join("\n")}
    </div>
  </div>
  <div class="participant-preview-action"><a class="button" href="participants/">View participant directory <span aria-hidden="true">→</span></a><p>Photographs, affiliations and verified profile links</p></div>`;

const directoryCards = ordered.map((participant) => {
  const tag = participant.profile ? "a" : "article";
  const link = participant.profile
    ? ` href="${escapeHtml(participant.profile)}" target="_blank" rel="noreferrer"`
    : "";
  const arrow = participant.profile ? '<span class="profile-arrow" aria-hidden="true">↗</span>' : "";
  return `    <${tag} class="participant-directory-card" id="${escapeHtml(slug(participant))}"${link}><span class="participant-directory-portrait"><span class="person-mark">${escapeHtml(participant.initials)}</span><img src="../assets/people/${escapeHtml(participant.image)}" alt="${escapeHtml(participant.name)}" loading="lazy" decoding="async" width="480" height="600"></span><span class="participant-directory-copy"><h2>${escapeHtml(participant.name)}</h2><p>${escapeHtml(participant.affiliation)}</p></span>${arrow}</${tag}>`;
}).join("\n");

const directory = `<div class="directory-heading">
    <div><p class="eyebrow">CM4 2026</p><h1>Confirmed participants</h1></div>
    <p><strong>${ordered.length}</strong> researchers have confirmed their participation. Official or institutional profile links are provided where verified.</p>
  </div>
  <div class="participant-directory-grid">
${directoryCards}
  </div>`;

const blocks = [
  {
    path: "index.html",
    start: "<!-- GENERATED: PARTICIPANT_PREVIEW_START -->",
    end: "<!-- GENERATED: PARTICIPANT_PREVIEW_END -->",
    content: preview
  },
  {
    path: "participants/index.html",
    start: "<!-- GENERATED: PARTICIPANT_DIRECTORY_START -->",
    end: "<!-- GENERATED: PARTICIPANT_DIRECTORY_END -->",
    content: directory
  }
];

let stale = false;
for (const block of blocks) {
  const path = join(root, block.path);
  const source = readFileSync(path, "utf8");
  const startIndex = source.indexOf(block.start);
  const endIndex = source.indexOf(block.end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error(`Generated markers are missing or invalid in ${block.path}`);
  }
  const before = source.slice(0, startIndex + block.start.length);
  const after = source.slice(endIndex);
  const generated = `${before}\n  ${block.content}\n  ${after}`;
  if (generated !== source) {
    stale = true;
    if (!checkOnly) writeFileSync(path, generated);
  }
}

if (checkOnly && stale) {
  throw new Error("Generated participant HTML is out of date. Run node scripts/generate-participants.mjs");
}

console.log(`${checkOnly ? "Validated" : "Generated"} ${ordered.length} participants in alphabetical order.`);
