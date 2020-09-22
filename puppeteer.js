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
    // await page.screenshot({path: 'screenshots/' + keyword + '.png'});

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
    });

    console.log(firstPageProducts);

    // Loop through each of those links, open a new page instance and get the relevant data from them
    let pagePromise = (product) => new Promise(async(resolve, reject) => {
        var description, reviews;
        let dataObj = {};
        let newPage = await browser.newPage();
        let descriptionSelector = '[data-testid=pdpDescriptionContainer]';
        const tabPageWrapper = '[data-testid="tabPDPWrapper"]';

        await newPage.goto(product.pageURL);
        await newPage.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await newPage.waitForSelector(tabPageWrapper, { timeout: 100000 });

        dataObj['description'] = await newPage.$eval(descriptionSelector, text => text.textContent);

        resolve(dataObj);
        await newPage.close();
    });

    for(index in firstPageProducts){
        var product = firstPageProducts[index];

        let currentPageData = await pagePromise(product);

        console.log(currentPageData);
    }



    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

