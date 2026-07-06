(async () => {
  const res = await fetch('https://www.piinti.com/urunler/lego-botanicals-orman-mantarlari-11505-yetiskinler-icin-dekoratif-mantar-model-b4731ee1-1991-4513-84cc-a5aac2f93302');
  const text = await res.text();
  const index = text.indexOf('/git/b4731ee1-1991-4513-84cc-a5aac2f93302?vendor=');
  if (index > -1) {
    console.log('Link:', text.substring(index, index + 60));
  } else {
    console.log('NOT FOUND AT ALL');
  }
})();
