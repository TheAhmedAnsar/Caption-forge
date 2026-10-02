import { chromium } from 'playwright-core';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sampleInput = path.join(projectRoot, 'storage', 'uploads', 'Yd7deY1789499519726.mp4');
const resultFileName = 'Yd7deY1789499519726_subtitled.mp4';
const outputDirectory = path.join(projectRoot, 'promo');
const silentOutput = path.join(outputDirectory, 'caption-forge-demo-silent.mp4');
const framesDirectory = mkdtempSync(path.join(tmpdir(), 'caption-forge-demo-'));
const frameRate = 12;
let frameNumber = 0;
let recording = true;

mkdirSync(outputDirectory, { recursive: true });

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
});

await page.route('**/api/jobs', async (route) => {
  await sleep(8500);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      statusCode: 200,
      message: 'Video processed successfully!',
      data: {
        outputFileName: resultFileName,
        outputUrl: `/media/${resultFileName}`,
      },
      success: true,
    }),
  });
});

await page.goto('http://127.0.0.1:8001', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const captureFrames = async () => {
  const startedAt = Date.now();
  while (recording) {
    const framePath = path.join(framesDirectory, `frame-${String(frameNumber).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: framePath, type: 'jpeg', quality: 88 });
    frameNumber += 1;
    const nextFrameAt = startedAt + (frameNumber * 1000) / frameRate;
    await sleep(Math.max(0, nextFrameAt - Date.now()));
  }
};

const capturePromise = captureFrames();

const pause = async (milliseconds) => sleep(milliseconds);

const scrollToElement = async (selector) => {
  await page.locator(selector).evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  });
  await pause(1500);
};

const demonstrateButton = async (name) => {
  const button = page.getByRole('button').filter({ hasText: name }).first();
  await button.hover();
  await pause(350);
  await button.click();
  await pause(1050);
};

await pause(1800);
await scrollToElement('.studio');

await page.locator('input[type="file"]').setInputFiles({
  name: 'city-lights-portrait.mp4',
  mimeType: 'video/mp4',
  buffer: readFileSync(sampleInput),
});
await pause(1800);

await demonstrateButton('Boxed Caption');
await demonstrateButton('Karaoke Pink');
await demonstrateButton('Cinematic');

await page.locator('select').selectOption('Georgia');
await pause(900);

await page.locator('input[type="range"]').evaluate((input) => {
  input.value = '38';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
await pause(900);

await demonstrateButton('TOP');
await demonstrateButton('BOTTOM');

await page.locator('.render-button').hover();
await pause(500);
await page.locator('.render-button').click();
await page.locator('.process-card').waitFor({ state: 'visible' });
await scrollToElement('.process-card');

await page.locator('.result-card').waitFor({ state: 'visible', timeout: 15000 });
await scrollToElement('.result-card');
await page.locator('.result-video').evaluate(async (video) => {
  video.muted = true;
  try { await video.play(); } catch {}
});
await pause(5200);

recording = false;
await capturePromise;
await browser.close();

const encodeResult = spawnSync('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel', 'error',
  '-framerate', String(frameRate),
  '-i', path.join(framesDirectory, 'frame-%05d.jpg'),
  '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p',
  '-r', '30',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '18',
  '-movflags', '+faststart',
  silentOutput,
], { stdio: 'inherit' });

rmSync(framesDirectory, { recursive: true, force: true });

if (encodeResult.status !== 0) {
  throw new Error(`FFmpeg exited with status ${encodeResult.status}`);
}

console.log(JSON.stringify({ silentOutput, frames: frameNumber }));
