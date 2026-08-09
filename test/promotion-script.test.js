import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import test from "node:test";

const sourceSha = "a".repeat(40);
const digests = {
  web: `sha256:${"b".repeat(64)}`,
  api: `sha256:${"c".repeat(64)}`,
  worker: `sha256:${"d".repeat(64)}`
};
const fixture = `global:
  imageTag: sha-old
web:
  image:
    digest: sha256:old-web
api:
  image:
    digest: sha256:old-api
worker:
  image:
    digest: sha256:old-worker
`;

test("promotion script updates the tag and all component digests", () => {
  const directory = mkdtempSync(join(tmpdir(), "orderflow-promotion-"));
  const valuesFile = join(directory, "values.yaml");
  writeFileSync(valuesFile, fixture);

  execFileSync(process.execPath, [
    "scripts/set-production-images.mjs",
    valuesFile,
    sourceSha,
    digests.web,
    digests.api,
    digests.worker
  ]);

  const updated = readFileSync(valuesFile, "utf8");
  assert.match(updated, new RegExp(`imageTag: sha-${sourceSha}`));
  assert.match(updated, new RegExp(`digest: ${digests.web}`));
  assert.match(updated, new RegExp(`digest: ${digests.api}`));
  assert.match(updated, new RegExp(`digest: ${digests.worker}`));
});

test("promotion script rejects a non-commit source", () => {
  const directory = mkdtempSync(join(tmpdir(), "orderflow-promotion-invalid-"));
  const valuesFile = join(directory, "values.yaml");
  writeFileSync(valuesFile, fixture);

  assert.throws(() => execFileSync(process.execPath, [
    "scripts/set-production-images.mjs",
    valuesFile,
    "main",
    digests.web,
    digests.api,
    digests.worker
  ], { stdio: "ignore" }));
});
