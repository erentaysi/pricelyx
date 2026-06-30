fetch('https://www.lg.com/tr/monitors/gaming/25g523b-b/')
  .then(r => r.text())
  .then(t => {
    console.log('TITLE:', t.match(/<meta property="og:title" content="(.*?)"/)?.[1]);
    console.log('IMAGE:', t.match(/<meta property="og:image" content="(.*?)"/)?.[1]);
    console.log('PRICE:', t.match(/"price":\s*"?([0-9\.]+)"?/)?.[1]);
    console.log('PRICE_META:', t.match(/<meta property="product:price:amount" content="(.*?)"/)?.[1]);
    console.log('PRICE_DATA:', t.match(/data-price="(.*?)"/)?.[1]);
  });
