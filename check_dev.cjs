const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ais-dev-4uf74slrq3fucfg5czsffd-15204860087.europe-west2.run.app', { waitUntil: 'networkidle2' });
  const html = await page.content();
  console.log("ROOT CONTENT LENGTH:", html.split('<div id="root">')[1].split('</div>')[0].length);
  
  await browser.close();
})();
