/* Screenshots of the live site for the film (public/site/). Drives Chrome over the DevTools
   protocol: loads a page, waits for its own motion to settle, scrolls to a section, and
   captures the viewport. Run: node tools/capture_site.mjs [name ...] */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const SITE = 'https://www.ghananice.com';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/site');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = [
  /* Phone size: the home page with its Ghana window, for the phone the yarn draws. */
  { name: 'home-hero', url: '/', wait: 7000 },
  /* Laptop size: the Savannah page (the pull-back) and the three features. */
  { name: 'laptop-savannah', url: '/regions/savannah/', wait: 3000, laptop: true },
  { name: 'laptop-regions', url: '/#regions', wait: 4000, laptop: true },
  { name: 'laptop-tip', url: '/', wait: 4000, laptop: true, scroll: "document.querySelector('#tip').offsetTop + 260" },
  { name: 'laptop-directory', url: '/travel-directory.html', wait: 4000, laptop: true },
];
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const LAPTOP = { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false };

const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-capture-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find(t => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.once('open', r));
let id = 0;
const pending = new Map();
ws.on('message', data => { const msg = JSON.parse(data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable');
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ONLY = process.argv.slice(2);
for (const shot of SHOTS.filter(s => !ONLY.length || ONLY.includes(s.name))) {
  await send('Emulation.setDeviceMetricsOverride', shot.laptop ? LAPTOP : PHONE);
  await send('Emulation.setUserAgentOverride', { userAgent: shot.laptop ? '' : IPHONE_UA });
  await send('Page.navigate', { url: SITE + shot.url });
  await sleep(shot.wait);
  if (shot.scroll) {
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${shot.scroll})` });
    await sleep(1600);
  }
  const { result } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, `${shot.name}.png`), Buffer.from(result.data, 'base64'));
  console.log('captured', shot.name);
}
ws.close();
chrome.kill();
