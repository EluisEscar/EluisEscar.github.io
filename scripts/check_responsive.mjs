import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import worker from '../dist/server/index.js';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9333;
const profile = await mkdtemp(path.join(tmpdir(), 'esteban-portfolio-cdp-'));
const server = createServer(async (request, response) => {
  const result = await worker.fetch(new Request(`http://127.0.0.1${request.url}`, { method: request.method }));
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(Buffer.from(await result.arrayBuffer()));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const edge = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  'about:blank'
], { stdio: 'ignore', windowsHide: true });

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let target;
for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    target = targets.find(item => item.type === 'page');
    if (target) break;
  } catch {}
  await wait(100);
}
if (!target) throw new Error('No fue posible iniciar Edge para la validación responsive.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let commandId = 0;
const pending = new Map();
const eventWaiters = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  const waiters = eventWaiters.get(message.method);
  if (waiters?.length) waiters.shift()(message.params);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++commandId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const once = method => new Promise(resolve => {
  if (!eventWaiters.has(method)) eventWaiters.set(method, []);
  eventWaiters.get(method).push(resolve);
});

await send('Page.enable');
await send('Runtime.enable');
const pages = ['/', '/projects/', '/about/'];
const widths = [360, 390, 430, 768, 1024, 1440];
const failures = [];

for (const width of widths) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: width <= 430
  });
  for (const page of pages) {
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}${page}` });
    await loaded;
    const { result } = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const viewport = document.documentElement.clientWidth;
        const visible = element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const outOfBounds = [...document.querySelectorAll('a, button')]
          .filter(visible)
          .map(element => ({ text: (element.textContent || element.getAttribute('aria-label') || '').trim(), rect: element.getBoundingClientRect() }))
          .filter(item => item.rect.left < -1 || item.rect.right > viewport + 1)
          .map(item => item.text);
        return {
          viewport,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          outOfBounds,
          h1Count: document.querySelectorAll('h1').length
        };
      })()`
    });
    const check = result.value;
    if (check.scrollWidth > check.viewport + 1 || check.outOfBounds.length || check.h1Count !== 1) {
      failures.push({ width, page, ...check });
    }
  }
}

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
{
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/about/` });
  await loaded;
  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const rows = [...document.querySelectorAll('.experience-row')];
      const dateLefts = rows.map(row => Math.round(row.querySelector('.experience-dates').getBoundingClientRect().left));
      return { companies: rows.map(row => row.querySelector('h3').textContent.trim()), dateLefts };
    })()`
  });
  const expected = ['Walt Disney World', 'Record Perú', 'Municipalidad de La Victoria'];
  if (JSON.stringify(result.value.companies) !== JSON.stringify(expected) || new Set(result.value.dateLefts).size !== 1) {
    failures.push({ page: '/about/', experience: result.value });
  }
}

{
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await loaded;
  const { result } = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const before = document.documentElement.dataset.theme;
      document.querySelector('.theme-toggle').click();
      await new Promise(resolve => setTimeout(resolve, 900));
      return {
        before,
        after: document.documentElement.dataset.theme,
        saved: localStorage.getItem('esteban-theme'),
        stillAnimating: document.querySelector('.theme-toggle').classList.contains('is-animating')
      };
    })()`
  });
  const theme = result.value;
  if (theme.before === theme.after || theme.saved !== theme.after || theme.stillAnimating) {
    failures.push({ page: '/', theme });
  }
}

socket.close();
server.close();
const edgeExited = new Promise(resolve => edge.once('exit', resolve));
edge.kill();
await Promise.race([edgeExited, wait(2000)]);
await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} páginas responsive; experiencia ordenada y alineada; transición de tema operativa en ${widths.join(', ')} px.`);
}
