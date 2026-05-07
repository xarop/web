import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs/promises';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Desktop
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://app.somespai.net/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const desktopPng = await page.screenshot();
  await sharp(desktopPng).webp({ quality: 85 }).toFile('src/assets/images/screenshot-app-somespai-desktop.webp');
  
  // Mobile
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('https://app.somespai.net/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const mobilePng = await page.screenshot({ fullPage: true }); // fullpage or just viewport? prompt didn't specify, maybe full
  await sharp(mobilePng).webp({ quality: 85 }).toFile('src/assets/images/screenshot-app-somespai-mobile.webp');
  
  await browser.close();
  console.log("Screenshots done");
}
main().catch(console.error);
