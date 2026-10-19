#!/usr/bin/env node
/**
 * check-deps.js — lists every import in this Expo app whose package is not installed.
 *
 * Usage (from the mobile folder):
 *   node check-deps.js
 *   node check-deps.js --install     # runs `npx expo install <missing...>` for you
 *
 * Scans ./App.js, ./index.js and everything under ./src, ignoring node_modules.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build', '.expo-shared']);
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
const ENTRY_FILES = ['App.js', 'App.jsx', 'App.tsx', 'index.js', 'index.ts'];

const IMPORT_RE =
  /(?:from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, out);
    } else if (EXT.has(path.extname(e.name))) {
      out.push(full);
    }
  }
  return out;
}

function packageName(spec) {
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/');
  return spec.split('/')[0];
}

const files = [
  ...ENTRY_FILES.map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f)),
  ...walk(path.join(ROOT, 'src')),
];

if (files.length === 0) {
  console.error('No App.js/index.js or src/ found. Run this from the mobile folder.');
  process.exit(1);
}

const imports = new Map(); // package -> Set(importing file, relative)

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (!spec || spec.startsWith('.') || spec.startsWith('/')) continue;
    const pkg = packageName(spec);
    if (pkg === 'react' || pkg === 'react-native') continue; // always present
    if (!imports.has(pkg)) imports.set(pkg, new Set());
    imports.get(pkg).add(path.relative(ROOT, file));
  }
}

const installed = (pkg) => fs.existsSync(path.join(ROOT, 'node_modules', pkg));

const missing = [];
const ok = [];
for (const [pkg, users] of [...imports].sort((a, b) => a[0].localeCompare(b[0]))) {
  (installed(pkg) ? ok : missing).push({ pkg, users: [...users] });
}

console.log(`Scanned ${files.length} file(s) under ${ROOT}\n`);

for (const { pkg, users } of ok) {
  console.log(`  ok       ${pkg}`);
}

if (missing.length === 0) {
  console.log('\nAll imports resolve. Nothing to install.');
  process.exit(0);
}

console.log('');
for (const { pkg, users } of missing) {
  console.log(`  MISSING  ${pkg}`);
  for (const u of users) console.log(`             used by ${u}`);
}

const cmd = `npx expo install ${missing.map((m) => m.pkg).join(' ')}`;
console.log(`\nInstall them all with:\n\n  ${cmd}\n`);

if (process.argv.includes('--install')) {
  console.log(`Running: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
  console.log('\nDone. Restart Metro with:  npx expo start -c');
}
