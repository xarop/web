import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('https://app.somespai.net/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(b => b.innerText.trim()).filter(t => t);
  });
  console.log("Interactive text:", buttons);
  
  await browser.close();
}
main().catch(console.error);
