const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const b = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const p = await b.newPage();
  await p.goto('https://www.joker.com.tr/kategori/bebek-bezi-ve-mendil', {waitUntil: 'networkidle2'});
  const classes = await p.evaluate(() => {
     // try to find any text containing "bezi" or "₺" or "TL"
     const elements = Array.from(document.querySelectorAll('div, span, a, h1, h2, h3'))
        .filter(el => el.innerText && (el.innerText.includes('₺') || el.innerText.includes('TL')));
     
     if (elements.length > 0) {
        return elements.slice(0, 5).map(e => ({
           tag: e.tagName,
           class: e.className,
           text: e.innerText
        }));
     }
     return [];
  });
  console.log(JSON.stringify(classes, null, 2));
  await b.close();
}
run();
