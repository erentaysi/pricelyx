const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const b = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const p = await b.newPage();
  
  console.log("Joker taranıyor...");
  await p.goto('https://www.joker.com.tr/kategori/bebek-bezi-ve-mendil', {waitUntil: 'domcontentloaded'});
  const joker = await p.evaluate(() => {
     const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.innerText && (el.innerText.includes('₺') || el.innerText.includes('TL')) && el.innerText.length < 50);
     return elements.slice(0, 3).map(e => ({ tag: e.tagName, className: e.className, text: e.innerText.trim() }));
  });
  console.log("Joker Elements:", joker);

  console.log("Kanz taranıyor...");
  await p.goto('https://www.kanz.com.tr/bebek-arabasi-ve-puset', {waitUntil: 'domcontentloaded'});
  const kanz = await p.evaluate(() => {
     const elements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.innerText && (el.innerText.includes('₺') || el.innerText.includes('TL')) && el.innerText.length < 50);
     return elements.slice(0, 3).map(e => ({ tag: e.tagName, className: e.className, text: e.innerText.trim() }));
  });
  console.log("Kanz Elements:", kanz);

  await b.close();
}
run();
