async function run() {
  try {
     const joker = await fetch('https://www.joker.com.tr/sitemap.xml');
     const jokerTxt = await joker.text();
     console.log("JOKER:", jokerTxt.substring(0, 300));
  } catch (e) { console.error("JOKER FAIL:", e); }

  try {
     const kanz = await fetch('https://www.kanz.com.tr/sitemap.xml');
     const kanzTxt = await kanz.text();
     console.log("KANZ:", kanzTxt.substring(0, 300));
  } catch (e) { console.error("KANZ FAIL:", e); }
}
run();
