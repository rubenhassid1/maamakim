// Renders video.html to MP4: node render.mjs  (needs playwright + ffmpeg)
import { chromium } from 'playwright';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const FPS = 30, DUR = 20, frames = path.join(dir, '.frames');
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file://' + path.join(dir, 'video.html'));
await page.evaluate(h => setLogo(h), existsSync(path.join(dir, 'assets/gpc-logo.svg')));
await page.evaluate(() => document.fonts.ready);
for (let f = 0; f < FPS * DUR; f++) {
  await page.evaluate(t => render(t), f / FPS);
  await page.screenshot({ path: path.join(frames, String(f).padStart(4, '0') + '.png') });
}
await browser.close();
const out = path.join(dir, 'gpc-launch-4x5.mp4');
execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frames, '%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out]);
execFileSync('cp', [path.join(frames, '0000.png'), path.join(dir, 'thumbnail.png')]);
rmSync(frames, { recursive: true, force: true });
console.log('wrote', out);
