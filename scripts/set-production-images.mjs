import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const [file, sourceSha, webDigest, apiDigest, workerDigest] = process.argv.slice(2);
const shaPattern = /^[0-9a-f]{40}$/;
const digestPattern = /^sha256:[0-9a-f]{64}$/;

if (!file || !shaPattern.test(sourceSha ?? "")) {
  throw new Error("usage: set-production-images.mjs <values-file> <40-char-sha> <web-digest> <api-digest> <worker-digest>");
}
const digests = { web: webDigest, api: apiDigest, worker: workerDigest };
for (const [name, digest] of Object.entries(digests)) {
  if (!digestPattern.test(digest ?? "")) throw new Error(`invalid ${name} digest`);
}

const lines = readFileSync(file, "utf8").split("\n");
let component = null;
let tagUpdated = false;
const updated = new Set();

for (let index = 0; index < lines.length; index += 1) {
  if (/^ {2}imageTag: /.test(lines[index])) {
    lines[index] = `  imageTag: sha-${sourceSha}`;
    tagUpdated = true;
    continue;
  }
  const componentMatch = /^(web|api|worker):$/.exec(lines[index]);
  if (componentMatch) {
    component = componentMatch[1];
    continue;
  }
  if (/^[a-zA-Z]/.test(lines[index])) component = null;
  if (component && /^ {4}digest: /.test(lines[index])) {
    lines[index] = `    digest: ${digests[component]}`;
    updated.add(component);
  }
}

if (!tagUpdated || updated.size !== 3) throw new Error("production values did not match the expected structure");
writeFileSync(file, lines.join("\n"));
