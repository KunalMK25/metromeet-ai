#!/usr/bin/env node
/**
 * verify.js — static verification for MetroMeet AI's module graph.
 * Checks, without needing a browser or bundler:
 *   1. Every .js file under src/ parses (no syntax errors).
 *   2. Every relative import resolves to a real file.
 *   3. There are no circular dependencies.
 *
 * Exit code 0 = all clear, 1 = a problem was found (CI-friendly).
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, relative, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(srcDir);
let failed = false;

console.log(`Checking ${files.length} module(s)...\n`);

// 1) Syntax check every file (as an ES module)
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed = true;
    console.error(`✗ Syntax error: ${relative(root, f)}`);
    console.error(e.stderr?.toString() || e.message);
  }
}

// 2) Build the import graph and check every reference resolves
const importRe = /import\s*(?:[\w{},*\s]+from\s+)?['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g;
const graph = {};
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const base = dirname(f);
  const deps = new Set();
  let m;
  while ((m = importRe.exec(content))) {
    const spec = m[1] || m[2];
    let resolved = normalize(join(base, spec));
    if (!resolved.endsWith('.js')) resolved += '.js';
    if (!files.includes(resolved)) {
      failed = true;
      console.error(`✗ Broken import: ${relative(root, f)} → "${spec}" (resolved to ${relative(root, resolved)}, which doesn't exist)`);
    } else {
      deps.add(resolved);
    }
  }
  graph[f] = deps;
}

// 3) Circular dependency check (DFS)
const WHITE = 0, GRAY = 1, BLACK = 2;
const color = Object.fromEntries(files.map(f => [f, WHITE]));
const stack = [];
function dfs(node) {
  color[node] = GRAY;
  stack.push(node);
  for (const next of graph[node] || []) {
    if (color[next] === GRAY) {
      failed = true;
      const cycle = stack.slice(stack.indexOf(next)).concat(next).map(p => relative(root, p));
      console.error(`✗ Circular dependency: ${cycle.join(' → ')}`);
    } else if (color[next] === WHITE) {
      dfs(next);
    }
  }
  stack.pop();
  color[node] = BLACK;
}
for (const f of files) if (color[f] === WHITE) dfs(f);

if (failed) {
  console.error('\n✗ Verification FAILED — see errors above.');
  process.exit(1);
} else {
  console.log('✔ All modules parse cleanly.');
  console.log('✔ Every import resolves to a real file.');
  console.log('✔ No circular dependencies.');
  console.log(`\n${files.length} modules verified successfully.`);
}
