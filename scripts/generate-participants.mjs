import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const participants = JSON.parse(readFileSync(join(root, "data/participants.json"), "utf8"));

const required = ["name", "sortKey", "initials", "affiliation"];
const names = new Set();
const sortKeys = new Set();
const isExternalImage = (image) => /^https?:\/\//i.test(image);

for (const [index, participant] of participants.entries()) {
  for (const field of required) {
    if (!participant[field]) throw new Error(`Participant ${index + 1} is missing ${field}`);
  }
  if (participant.group && !["research", "student"].includes(participant.group)) {
    throw new Error(`Unknown participant group: ${participant.name}`);
  }
  if (names.has(participant.name)) throw new Error(`Duplicate participant name: ${participant.name}`);
  if (sortKeys.has(participant.sortKey)) throw new Error(`Duplicate sort key: ${participant.sortKey}`);
  names.add(participant.name);
  sortKeys.add(participant.sortKey);
  if (!participant.image && !participant.slug) throw new Error(`Missing directory anchor: ${participant.name}`);
  if (participant.image && !isExternalImage(participant.image)) {
    const imagePath = join(root, "assets/people", participant.image);
    if (!existsSync(imagePath)) throw new Error(`Missing portrait: ${imagePath}`);
  }
}

const ordered = [...participants].sort((a, b) =>
  a.sortKey.localeCompare(b.sortKey, "en", { sensitivity: "base" })
);
const faculty = ordered.filter((participant) => !participant.group);
const researchers = ordered.filter((participant) => participant.group === "research");
const students = ordered.filter((participant) => participant.group === "student");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const slug = (participant) => {
  if (participant.slug) return participant.slug;
  return participant.image.replace(/\.[^.]+$/i, "");
};

const imageSource = (participant, localPrefix) =>
  isExternalImage(participant.image) ? participant.image : `${localPrefix}${participant.image}`;

const portrait = (participant, prefix) => participant.image
  ? `<img src="${escapeHtml(imageSource(participant, prefix))}" alt="${escapeHtml(participant.name)}" loading="lazy" decoding="async" width="480" height="600">`
  : "";
const initials = (participant) => `<span class="person-mark" aria-hidden="true">${escapeHtml(participant.initials)}</span>`;

const directoryCard = (participant) => {
  const tag = participant.profile ? "a" : "article";
  const link = participant.profile
    ? ` href="${escapeHtml(participant.profile)}" target="_blank" rel="noopener noreferrer"`
    : "";
  const arrow = participant.profile ? '<span class="profile-arrow" aria-hidden="true">↗</span>' : "";
  const attendance = participant.attendance ? `<p>${escapeHtml(participant.attendance)}</p>` : "";
  return `    <${tag} class="participant-directory-card" id="${escapeHtml(slug(participant))}"${link}><span class="participant-directory-portrait">${initials(participant)}${portrait(participant, "/assets/people/")}</span><div class="participant-directory-copy"><h2>${escapeHtml(participant.name)}</h2><p>${escapeHtml(participant.affiliation)}</p>${attendance}</div>${arrow}</${tag}>`;
};

const preview = `<p class="section-note">${ordered.length} participants from India and abroad</p>
  <ul class="photo-strip">
${ordered.filter((participant) => participant.image).map((participant) => `    <li><a href="/participants/#${escapeHtml(slug(participant))}" title="${escapeHtml(participant.name)}"><img src="${escapeHtml(imageSource(participant, "/assets/people/"))}" alt="${escapeHtml(participant.name)}" loading="lazy" decoding="async" width="480" height="600"></a></li>`).join("\n")}
  </ul>`;

const studentRow = (participant) => `    <li id="${escapeHtml(slug(participant))}"><strong>${escapeHtml(participant.name)}</strong><span>${escapeHtml(participant.affiliation)}</span></li>`;

const directory = `<p class="section-note">${ordered.length} participants</p>
  <div class="directory-search" hidden><label for="people-search">Search participants</label><input id="people-search" type="search" placeholder="Name or affiliation"><p id="people-results" role="status"></p></div>
  <div class="participant-directory-grid">
${faculty.map(directoryCard).join("\n")}
  </div>
  <div class="participant-directory-grid participant-directory-group">
${researchers.map(directoryCard).join("\n")}
  </div>
  <ul class="participant-student-list participant-directory-group">
${students.map(studentRow).join("\n")}
  </ul>`;

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
