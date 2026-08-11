#!/usr/bin/env node
/**
 * build.js — MetroMeet AI has no bundling step. It's a native ES
 * modules app (browser-loaded via <script type="module">), so
 * "build" just assembles a clean, deployable dist/ folder: a copy
 * of index.html and src/, nothing transpiled or bundled.
 *
 * Kept intentionally simple on purpose — see docs/deployment.md for
 * why no bundler (Vite/Webpack/esbuild) is used.
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

console.log('→ Cleaning dist/ ...');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);

console.log('→ Copying index.html ...');
cpSync(join(root, 'index.html'), join(dist, 'index.html'));

console.log('→ Copying src/ ...');
cpSync(join(root, 'src'), join(dist, 'src'), { recursive: true });

console.log('✔ Build complete → dist/');
