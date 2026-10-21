// Builds the app for Vercel using the Build Output API (https://vercel.com/docs/build-output-api).
//
// Vercel can't run server.ts as a normal long-lived server, so this script produces:
//   .vercel/output/static/              the React site (from `vite build`), served by Vercel's CDN
//   .vercel/output/functions/api.func/  server.ts bundled into one file; every /api/* request runs it
//   .vercel/output/config.json          routing: /api/* -> function, everything else -> the React site
//
// Vercel runs it through `npm run vercel-build` (see vercel.json). Locally: node scripts/build-vercel.mjs
//
// Optional env: FUNCTION_MAX_DURATION (seconds, default 300). Hobby allows at most 300; Pro allows up
// to 800. A pipeline run is split into requests that each stop 20 s before this limit, so 300 works.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const out = path.join(root, '.vercel', 'output');
const fnDir = path.join(out, 'functions', 'api.func');

rmSync(out, { recursive: true, force: true });

// 1. The React site.
execFileSync(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { stdio: 'inherit' });
cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true });

// 2. The API, bundled with its dependencies so the function needs no node_modules.
mkdirSync(fnDir, { recursive: true });
await build({
  entryPoints: [path.join(root, 'server.ts')],
  outfile: path.join(fnDir, 'index.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  // Vite is only used by the local dev server and is imported lazily there.
  external: ['vite'],
  // Vercel calls module.exports(req, res); server.ts default-exports the Express app.
  footer: { js: 'module.exports = module.exports.default || module.exports;' },
  logLevel: 'warning',
});

// Security headers for the static site (the API function sets its own). The policy comes from
// src/services/security.ts, compiled on the fly, so Express and Vercel always send the same one.
const securityOut = path.join(root, '.vercel', 'security.mjs');
await build({ entryPoints: [path.join(root, 'src', 'services', 'security.ts')], outfile: securityOut, bundle: true, platform: 'node', format: 'esm', logLevel: 'warning' });
const security = await import(pathToFileURL(securityOut).href);
const indexHtml = readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const staticHeaders = {
  ...security.BASE_SECURITY_HEADERS,
  'Content-Security-Policy': security.contentSecurityPolicy(security.inlineScriptHashes(indexHtml)),
};
rmSync(securityOut, { force: true });

const nodeMajor = process.versions.node.split('.')[0];
const maxDuration = Number(process.env.FUNCTION_MAX_DURATION) || 300;
writeFileSync(
  path.join(fnDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: `nodejs${nodeMajor}.x`,
      handler: 'index.cjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration,
    },
    null,
    2,
  ),
);

// 3. Routing.
writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/(.*)', headers: staticHeaders, continue: true },
        { handle: 'filesystem' },
        { src: '/api/(.*)', dest: '/api' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
);

console.log(`Vercel output ready in .vercel/output (Node ${nodeMajor}, max duration ${maxDuration}s).`);
