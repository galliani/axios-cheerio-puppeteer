const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.goto('https://www.tokopedia.com/search?st=product&q=madu');
    
    const selectorWaiter = '[data-testid="result-header-wrapper"]';
    await page.waitForSelector(selectorWaiter, { timeout: 100000 });

    let urls = await page.evaluate(() => {
      let results = [];

      let items = document.querySelectorAll('.css-7fmtuv');
      items.forEach((item) => {
        var title, price, salesCount;
        
        title       = item.querySelector('.css-18c4yhp').textContent;
        price       = item.querySelector('.css-rhd610').textContent;

        console.log(item.querySelector('.css-18c4yhp').textContent);
        console.log(item.querySelector('.css-rhd610').textContent);

        var data = { 
          title,
          price,
          salesCount
        };

        results.push(data);
      });

      return results;
    })

    console.log(urls);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
