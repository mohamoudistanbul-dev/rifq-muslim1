#!/usr/bin/env node
/**
 * Structural validation for .github/workflows/android-apk.yml
 *
 * Dependency-free on purpose: it runs anywhere Node is available, including
 * before a GitHub runner ever starts. It asserts the parts of the workflow that
 * decide whether an APK actually gets built, so a regression fails loudly here
 * instead of silently in CI.
 *
 * Usage:  node scripts/validate-android-workflow.mjs
 * Exits non-zero and lists every problem found.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = join(root, '.github/workflows/android-apk.yml');

let src;
try {
  src = readFileSync(workflowPath, 'utf8');
} catch (err) {
  console.error(`workflow validation FAILED: cannot read ${workflowPath} (${err.message})`);
  process.exit(1);
}

// [label, matcher] — matcher is a RegExp that must be found in the workflow.
const rules = [
  ['workflow name', /^name:\s*\S+/m],
  ['manual trigger', /workflow_dispatch:/],
  ['push trigger on main', /push:[\s\S]*?branches:[\s\S]*?-\s*main/],
  ['least-privilege permissions', /permissions:[\s\S]*?contents:\s*read/],
  ['debug job', /^\s{2}debug-apk:/m],
  ['release job', /^\s{2}release-apk:/m],
  ['ubuntu runner', /runs-on:\s*ubuntu-latest/],
  ['checkout action', /actions\/checkout@v4/],
  ['setup-java action', /actions\/setup-java@v4/],
  ['JDK 17', /java-version:\s*['"]?17['"]?/],
  ['Temurin distribution', /distribution:\s*temurin/],
  ['android sdk action', /android-actions\/setup-android@v3/],
  ['compile SDK 35', /platforms;android-35/],
  ['build-tools 35.0.0', /build-tools;35\.0\.0/],
  ['SDK path for Gradle', /local\.properties/],
  ['debug build command', /assembleDebug/],
  ['release build command', /assembleRelease/],
  ['AAB build command', /bundleRelease/],
  ['APK path', /app-debug\.apk/],
  ['artifact upload', /actions\/upload-artifact@v4/],
  ['debug artifact name', /rifq-muslim-debug-apk/],
  ['fail on missing APK', /if-no-files-found:\s*error/],
  ['dependency graph aid', /gradle-dependencies\.txt/],
  ['release signing gate', /vars\.ENABLE_RELEASE_SIGNING/],
];

const problems = [];
for (const [label, re] of rules) {
  if (!re.test(src)) problems.push(`missing or changed: ${label}`);
}

// Build-cache must be disabled in BOTH jobs (CVE-2026-53914 mitigation).
const cacheGuards = (src.match(/--no-build-cache/g) || []).length;
if (cacheGuards < 2) {
  problems.push(`build-cache guard expected in both jobs, found ${cacheGuards}`);
}

// No hardcoded signing values: every storePassword/keyPassword assignment must
// interpolate a variable or printf placeholder rather than a literal secret.
const badSigning = new Set();
for (const line of src.split('\n')) {
  const m = line.match(/(storePassword|keyPassword)\s*=\s*(\S+)/);
  if (m && !/[%$]/.test(m[2])) badSigning.add(m[1]);
}
if (badSigning.size) {
  problems.push(`hardcoded signing value for: ${[...badSigning].join(', ')}`);
}

// A long unbroken base64 run would suggest an inlined keystore.
if (/[A-Za-z0-9+/]{120,}={0,2}/.test(src)) {
  problems.push('possible embedded base64 blob (inlined keystore?)');
}

if (problems.length) {
  console.error('workflow validation FAILED:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `workflow validation passed: ${rules.length} structural rules, ` +
    `${cacheGuards} build-cache guards, no hardcoded signing values`,
);
