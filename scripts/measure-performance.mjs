import { chromium } from "@playwright/test";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 40,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await page.goto("http://127.0.0.1:4173");
await page.locator(".electron-canvas").waitFor();
const navigation = await page.evaluate(() => {
  const n = performance.getEntriesByType("navigation")[0];
  return {
    domContentLoadedMs: n.domContentLoadedEventEnd,
    loadMs: n.loadEventEnd,
    firstContentfulPaintMs:
      performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
      null,
  };
});
const frames = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const times = [];
      let last = performance.now();
      function frame(now) {
        times.push(now - last);
        last = now;
        if (times.length < 120) requestAnimationFrame(frame);
        else {
          const sorted = times.slice(1).sort((a, b) => a - b);
          resolve({
            medianFrameMs: sorted[Math.floor(sorted.length / 2)],
            p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
            sampleFrames: 119,
          });
        }
      }
      requestAnimationFrame(frame);
    }),
);
const cold = [],
  warm = [];
for (const target of [cold, warm])
  for (let j = 0; j < 9; j++) {
    const start = performance.now();
    await page.getByRole("tab").nth(j).click();
    await page.locator(".lab-grid").waitFor();
    target.push(Math.round(performance.now() - start));
  }
const resources = await page.evaluate(() =>
  performance.getEntriesByType("resource").map((r) => ({
    url: new URL(r.name).pathname,
    transferBytes: r.transferSize,
    encodedBodyBytes: r.encodedBodySize,
  })),
);
const files = await readdir("dist/assets");
const bundles = [];
for (const name of files.filter((n) => /\.(js|css)$/.test(n))) {
  const data = await readFile(`dist/assets/${name}`);
  bundles.push({ name, bytes: data.length, gzipBytes: gzipSync(data).length });
}
const result = {
  environment: {
    platform: process.platform,
    node: process.version,
    browser: browser.version(),
    viewport: "390 x 844",
    cpuThrottle: 4,
    network: "1.6 Mbps down, 750 Kbps up, 40 ms latency",
    note: "Headless desktop browser emulation; not a real handset or field benchmark. Local preview does not gzip responses.",
  },
  navigation,
  frames,
  coldTabMs: cold,
  warmTabMs: warm,
  resources,
  bundles,
};
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/performance.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      environment: result.environment,
      navigation,
      frames,
      coldTabMs: cold,
      warmTabMs: warm,
    },
    null,
    2,
  ),
);
await browser.close();
