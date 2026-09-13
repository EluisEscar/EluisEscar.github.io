import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// A dependency-free Worker bundle keeps the existing static site architecture.
const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8' };
const files = ['index.html', 'projects/index.html', 'about/index.html', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'css/editorial.css', 'js/main.js', 'js/theme.js', 'js/stack.js'];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else files.push(file.replaceAll('\\', '/'));
  }
}
await collect('assets');
const assets = {};
for (const file of files) {
  const content = await readFile(path.join(root, file));
  assets[`/${file}`] = [mime[path.extname(file)] || 'application/octet-stream', content.toString('base64')];
}
const worker = `const assets = ${JSON.stringify(assets)};
export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Bad request', {status:400}); }
    const routes = {'/':'/index.html', '/projects':'/projects/index.html', '/projects/':'/projects/index.html', '/about':'/about/index.html', '/about/':'/about/index.html'};
    const asset = assets[routes[pathname] || pathname];
    if (!asset) return new Response('Not found', {status:404});
    const isAsset = pathname.startsWith('/assets/') || pathname.startsWith('/css/') || pathname.startsWith('/js/');
    const headers = {'Content-Type':asset[0], 'Cache-Control':isAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate', 'X-Content-Type-Options':'nosniff'};
    const body = request.method === 'HEAD' ? null : Uint8Array.from(atob(asset[1]), c => c.charCodeAt(0));
    return new Response(body, {headers});
  }
};
`;
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', worker);
console.log(`Built standalone Worker: ${files.length} assets, ${Buffer.byteLength(worker)} bytes.`);
