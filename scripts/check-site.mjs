import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = [
  "index.html",
  "participants/index.html",
  "committees/index.html",
  "payment/index.html"
];
const documents = new Map();
const failures = [];

const parseAttributes = (source) => {
  const attributes = new Map();
  for (const match of source.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
};

const documentIds = (source) => {
  const ids = [];
  for (const match of source.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/g)) ids.push(match[1] ?? match[2]);
  return ids;
};

for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), "utf8");
  const ids = documentIds(source);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${file}: duplicate ids: ${[...new Set(duplicates)].join(", ")}`);
  documents.set(file, { source, ids: new Set(ids) });
}

const resolveLocalTarget = (file, rawUrl) => {
  const [pathPart, fragment = ""] = rawUrl.split("#", 2);
  const cleanPath = pathPart.split("?")[0];
  let target = normalize(join(dirname(file), cleanPath || ""));
  if (!cleanPath || cleanPath.endsWith("/")) target = join(target, "index.html");
  if (!extname(target) && !existsSync(join(root, target))) target = join(target, "index.html");
  return { target, fragment };
};

for (const [file, document] of documents) {
  for (const tagMatch of document.source.matchAll(/<([a-z][\w-]*)(\s[^<>]*?)?>/gi)) {
    const tag = tagMatch[1].toLowerCase();
    const attributes = parseAttributes(tagMatch[2] ?? "");
    const url = attributes.get("src") ?? attributes.get("href");

    if (tag === "img") {
      for (const attribute of ["alt", "width", "height"]) {
        if (!attributes.has(attribute)) failures.push(`${file}: image is missing ${attribute}: ${attributes.get("src") ?? "(no src)"}`);
      }
    }

    if (attributes.get("target") === "_blank") {
      const rel = new Set((attributes.get("rel") ?? "").split(/\s+/));
      if (!rel.has("noopener") || !rel.has("noreferrer")) {
        failures.push(`${file}: target="_blank" link must include noopener and noreferrer: ${url}`);
      }
    }

    if (!url || /^(?:[a-z]+:)?\/\//i.test(url) || /^(?:mailto|tel|data):/i.test(url)) continue;

    if (url.startsWith("#")) {
      const fragment = url.slice(1);
      if (fragment && !document.ids.has(fragment)) failures.push(`${file}: missing local anchor #${fragment}`);
      continue;
    }

    const { target, fragment } = resolveLocalTarget(file, url);
    const absoluteTarget = join(root, target);
    if (!existsSync(absoluteTarget)) {
      failures.push(`${file}: missing local resource ${url}`);
      continue;
    }

    if (fragment && target.endsWith(".html")) {
      const targetDocument = documents.get(target);
      const targetIds = targetDocument?.ids ?? new Set(documentIds(readFileSync(absoluteTarget, "utf8")));
      if (!targetIds.has(fragment)) failures.push(`${file}: missing cross-page anchor ${url}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${htmlFiles.length} pages, local resources, anchors, images and external-link safety.`);
}
