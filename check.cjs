const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  page.on('requestfailed', req => console.log('FAILED:', req.url(), req.failure().errorText));

  // Catch unhandled rejections and errors in browser ctx
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
    window.addEventListener('error', event => {
      console.log('WINDOW ERROR:', event.message);
    });
  });

  await page.goto('https://ovdimbechik.co.il', { waitUntil: 'networkidle2' });
  await browser.close();
})();
