(async () => {
  const res = await fetch('https://www.toyzzshop.com/lego-city-vinc-ve-kamyonlu-liman-yuk-treni-60509?serial=104216', {
     headers: {
       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
     }
  });
  const text = await res.text();
  console.log(text.substring(0, 1500));
})();
