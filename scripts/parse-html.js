const fs = require('fs');

const html = fs.readFileSync('C:\\Users\\EREN\\Desktop\\PİİNTİ\\scripts\\trendyol-test.html', 'utf8');

// find all div classes that contain " TL" or "TL " or "₺" in their inner text
const regex = /<div class="([^"]+)">([^<]*TL[^<]*)<\/div>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
    console.log(match[1]);
}
