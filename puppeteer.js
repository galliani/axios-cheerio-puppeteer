// HOW TO RUN SAMPLE: node puppeteer.js -k madu

const puppeteer = require('puppeteer');
const argv      = require('minimist')(process.argv.slice(2));

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const userAgent       = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36';
    const selectorWaiter  = '[data-testid="result-header-wrapper"]';
    const baseURL         = 'https://www.tokopedia.com/';

    let keyword = argv.k

    await page.setUserAgent(userAgent)
    await page.goto(baseURL + 'search?st=product&q=' + keyword);
    await page.waitForSelector(selectorWaiter, { timeout: 100000 });
    await page.screenshot({path: 'screenshots/' + keyword + '.png'});

    let firstPageProducts = await page.evaluate(() => {
      let results = [];
      let items   = document.querySelectorAll('.css-7fmtuv');

      items.forEach((item) => {
        var title, price, location, salesCount, pageURL;

        let titleSelector     = '.css-18c4yhp';
        let priceSelector     = '[data-testid=spnSRPProdPrice]';
        let locationSelector  = '[data-testid=spnSRPProdTabShopLoc]';

        title       = item.querySelector(titleSelector).textContent;
        price       = item.querySelector(priceSelector).textContent.replace(/[Rp]/g,'');
        location    = item.querySelector(locationSelector).textContent;
        pageURL     = item.querySelector('a[href]').getAttribute('href');

        let wrap    = item.querySelector('.css-1itv5e3 span');
        if (wrap) { 
          salesCount = wrap.textContent.trim()
                                       .replace(/[()]/g,'');
        }

        var data = { 
          title,
          price,
          location,
          salesCount,
          pageURL
        };

        results.push(data);
      });

      return results;
    })

    console.log(firstPageProducts);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
