// Renders public/icons/icon.svg to the PNG sizes the manifest needs.
import { chromium } from "@playwright/test";
import fs from "node:fs";
const svg = fs.readFileSync("public/icons/icon.svg", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["maskable-512.png", 512, 0.12],
  ["apple-touch-icon.png", 180, 0],
]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  const bg = pad ? "#4b6b5c" : "transparent";
  await page.setContent(
    `<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `).replace(pad ? 'rx="112"' : "__", 'rx="0"')}</body></html>`,
  );
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: !pad });
}
await browser.close();
