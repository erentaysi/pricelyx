const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function run() {
  try {
     const res = await fetch('https://www.joker.com.tr/urun/molfix-bebek-bezi-5-beden-junior-firsat-paketi-54lu-100248', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
     });
     const txt = await res.text();
     const dom = new JSDOM(txt);
     const price = dom.window.document.querySelector('.price, .current-price, .discounted-price, [data-price]');
     console.log("JOKER FETCH SUCCESS. Title:", dom.window.document.title, "Price:", price ? price.textContent : 'Yok');
  } catch(e) { console.log("JOKER FETCH FAIL:", e); }

  try {
     const res = await fetch('https://www.kanz.com.tr/kanz-cift-yonlu-bebek-arabasi-siyah', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
     });
     const txt = await res.text();
     const dom = new JSDOM(txt);
     const price = dom.window.document.querySelector('.product-price, .PrdPrice, .price');
     console.log("KANZ FETCH SUCCESS. Title:", dom.window.document.title, "Price:", price ? price.textContent : 'Yok');
  } catch(e) { console.log("KANZ FETCH FAIL:", e); }
}
run();
