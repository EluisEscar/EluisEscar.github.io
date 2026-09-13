import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker from '../dist/server/index.js';

const pages = [
  ['/', 'Esteban Escarcena Torres | Software Engineer &amp; Data Developer', 'https://eluisescar.github.io/', 0],
  ['/projects', 'Proyectos | Esteban Escarcena Torres', 'https://eluisescar.github.io/projects/', 0],
  ['/projects/', 'Proyectos | Esteban Escarcena Torres', 'https://eluisescar.github.io/projects/', 0],
  ['/about', 'Sobre mí | Esteban Escarcena Torres', 'https://eluisescar.github.io/about/', 10],
  ['/about/', 'Sobre mí | Esteban Escarcena Torres', 'https://eluisescar.github.io/about/', 10]
];

for (const [route, title, canonical, chipCount] of pages) {
  const response = await worker.fetch(new Request('https://portfolio.test' + route));
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('cache-control'), /must-revalidate/);
  const html = await response.text();
  assert.ok(html.includes(`<title>${title}</title>`), `${route} title`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${route} canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`), `${route} og:url`);
  assert.ok(html.includes('content="Esteban Escarcena Torres"'), `${route} full identity metadata`);
  assert.ok(html.includes('https://eluisescar.github.io/assets/social-preview.png'), `${route} social image`);
  assert.ok(html.includes('<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">'), `${route} favicon`);
  assert.ok(html.includes('<link rel="manifest" href="/site.webmanifest">'), `${route} manifest`);
  assert.ok(html.includes('rel="me noopener noreferrer"'), `${route} identity link`);
  assert.ok(!html.includes('sophia2507.chatgpt.site'), `${route} temporary domain`);
  assert.equal((html.match(/data-stack-chip/g) || []).length, chipCount);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${route} H1 count`);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1, `${route} current page`);
  assert.ok(!html.includes('C?digo'));
}

const home = await (await worker.fetch(new Request('https://portfolio.test/'))).text();
const h1 = home.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
assert.equal(h1, 'Esteban Escarcena Torres');
const jsonLdBlocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.ok(jsonLdBlocks.length > 0, 'JSON-LD missing');
const graph = JSON.parse(jsonLdBlocks[0][1])['@graph'];
const person = graph.find(item => item['@type'] === 'Person');
assert.equal(person.name, 'Esteban Escarcena Torres');
assert.equal(person.url, 'https://eluisescar.github.io/');
assert.deepEqual(person.sameAs, ['https://www.linkedin.com/in/estebanescarcena', 'https://github.com/EluisEscar']);

const robotsResponse = await worker.fetch(new Request('https://portfolio.test/robots.txt'));
assert.equal(robotsResponse.status, 200);
assert.match(await robotsResponse.text(), /Sitemap: https:\/\/eluisescar\.github\.io\/sitemap\.xml/);
const sitemapResponse = await worker.fetch(new Request('https://portfolio.test/sitemap.xml'));
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get('content-type'), /application\/xml/);
const sitemap = await sitemapResponse.text();
assert.equal((sitemap.match(/<url>/g) || []).length, 3);
assert.ok(sitemap.includes('<loc>https://eluisescar.github.io/</loc>'));
assert.ok(sitemap.includes('<loc>https://eluisescar.github.io/projects/</loc>'));
assert.ok(sitemap.includes('<loc>https://eluisescar.github.io/about/</loc>'));

for (const route of ['/assets/favicon.svg', '/assets/social-preview.png', '/assets/proyectos/archivos_personales/Final-portrait-clean-v2.webp', '/assets/stack/python.svg', '/assets/vendor/matter.min.js', '/js/stack.js', '/assets/proyectos/archivos_personales/CV_EstebanEscarcena.pdf']) {
  const response = await worker.fetch(new Request('https://portfolio.test' + route));
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('cache-control'), /immutable/, route);
}
assert.equal((await worker.fetch(new Request('https://portfolio.test/missing'))).status, 404);

// Exercise the actual Matter engine and Stack handlers without a browser dependency.
const library = { module: { exports: {} } };
library.exports = library.module.exports;
vm.runInNewContext(await readFile('assets/vendor/matter.min.js', 'utf8'), library);
const Matter = library.module.exports;
let engine;
const create = Matter.Engine.create;
Matter.Engine.create = options => (engine = create(options));
function element(width = 120, height = 42) {
  return { offsetWidth: width, offsetHeight: height, clientWidth: width, clientHeight: height, style: {}, attrs: {}, handlers: {}, hidden: true,
    classList: { add() {}, remove() {} }, setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, fn) { this.handlers[k] = fn; }, getBoundingClientRect() { return { left: 0, top: 0 }; },
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; }
  };
}
const chips = Array.from({ length: 10 }, () => element());
const arena = element(620, 320); arena.querySelectorAll = () => chips;
const reset = element(), pause = element(), status = element();
const media = { matches: false, addEventListener(_, fn) { this.change = fn; } };
const frames = new Map(); let id = 0;
const visibility = {};
const document = { hidden: false, fonts: { ready: Promise.resolve() }, querySelector(s) { return { '.stack-arena': arena, '.stack-reset': reset, '.stack-pause': pause, '.stack-status': status }[s]; }, addEventListener(k, fn) { visibility[k] = fn; } };
const context = { document, window: { Matter, matchMedia: () => media, addEventListener() {} }, ResizeObserver: class { observe() {} }, requestAnimationFrame(fn) { frames.set(++id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); }, Promise };
vm.runInNewContext(await readFile('js/stack.js', 'utf8'), context);
await Promise.resolve(); await Promise.resolve();
assert.equal(Matter.Composite.allBodies(engine.world).length, 14);
const firstEngine = engine;
for (let i = 0; i < 480; i++) {
  const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn((i + 1) * 1000 / 60));
}
const bodies = Matter.Composite.allBodies(engine.world).filter(body => !body.isStatic);
assert.ok(bodies.every(body => Number.isFinite(body.position.x) && Number.isFinite(body.position.y)));
assert.ok(bodies.every(body => body.position.y > 0 && body.position.y < 320));
assert.ok(chips.every(chip => chip.style.transform.startsWith('translate3d(')));
pause.handlers.click(); assert.equal(pause.attrs['aria-pressed'], 'true'); assert.equal(frames.size, 0);
pause.handlers.click(); assert.equal(pause.attrs['aria-pressed'], 'false');
chips[0].handlers.pointerdown({ button: 0, pointerId: 1, clientX: 150, clientY: 100, preventDefault() {} });
assert.equal(Matter.Composite.allConstraints(engine.world).length, 1);
chips[0].handlers.pointermove({ pointerId: 1, clientX: 200, clientY: 120 });
chips[0].handlers.pointerup(); assert.equal(Matter.Composite.allConstraints(engine.world).length, 0);
chips[0].handlers.focus(); assert.equal(frames.size, 0);
const before = chips[0].style.transform;
chips[0].handlers.keydown({ key: 'ArrowUp', preventDefault() {} });
assert.notEqual(chips[0].style.transform, before); chips[0].handlers.blur();
reset.handlers.click(); assert.notEqual(engine, firstEngine); assert.equal(Matter.Composite.allBodies(firstEngine.world).length, 0);
media.matches = true; media.change(); assert.equal(frames.size, 0); assert.equal(reset.hidden, true); assert.equal(pause.hidden, true); assert.ok(chips.every(chip => chip.style.transform === ''));
media.matches = false; media.change(); assert.equal(reset.hidden, false);
document.hidden = true; visibility.visibilitychange(); assert.equal(frames.size, 0);
console.log('PASS: routes, SEO metadata, identity graph, sitemap, robots, cached assets, H1 structure, links and accessible Stack interactions.');
