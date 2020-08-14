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

        let priceSelector = '[data-testid=spnSRPProdPrice]';
        price       = item.querySelector(priceSelector).textContent;
        let wrap    = item.querySelector('.css-1itv5e3 span');

        if (wrap) {
          salesCount = wrap.textContent.trim();
        }

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
