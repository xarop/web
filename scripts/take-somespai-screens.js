import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs/promises';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Desktop
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://app.somespai.net/ca/barcelona', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  const desktopPng = await page.screenshot();
  await sharp(desktopPng).webp({ quality: 85 }).toFile('src/assets/images/screenshot-app-somespai-desktop.webp');
  
  // Mobile - Mapa
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('https://app.somespai.net/ca/barcelona', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));
  // remove possible popup/banner if needed
  const mobileMapPng = await page.screenshot();
  await sharp(mobileMapPng).webp({ quality: 85 }).toFile('src/assets/images/screenshot-app-somespai-mobile-mapa.webp');
  
  // Click Llista
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, a'));
    const btn = els.find(el => el.innerText && el.innerText.includes('Llista'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1500));
  const mobileListPng = await page.screenshot();
  await sharp(mobileListPng).webp({ quality: 85 }).toFile('src/assets/images/screenshot-app-somespai-mobile-llista.webp');
  
  // Combine side-by-side
  const mapImg = await fs.readFile('src/assets/images/screenshot-app-somespai-mobile-mapa.webp');
  const listImg = await fs.readFile('src/assets/images/screenshot-app-somespai-mobile-llista.webp');
  
  await sharp({
    create: {
      width: 375 * 2 + 20,
      height: 812,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
  .composite([
    { input: mapImg, left: 0, top: 0 },
    { input: listImg, left: 375 + 20, top: 0 }
  ])
  .webp({ quality: 85 })
  .toFile('src/assets/images/screenshot-app-somespai-mobile.webp');
  
  await browser.close();
  console.log("Screenshots generated!");
}

main().catch(console.error);
