// HOW TO RUN SAMPLE: node property_hunter.js -k 400000000 -l 500000000

const puppeteer = require('puppeteer');
const argv      = require('minimist')(process.argv.slice(2));

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    const userAgent       = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36';
    const selectorWaiter  = '.EIR5N';

    const baseURL   = "https://www.olx.co.id/jakarta-dki_g2000007/dijual-rumah-apartemen_c5158/q-jakarta-selatan?filter=";
    const context = browser.defaultBrowserContext();

    let priceMin = argv.k || '100000000';
    let priceMax = argv.l;

    var filter = `price_between_${priceMin}_to_${priceMax}%2Ctype_eq_rumah&sorting=asc-price`;

    // Setting geolocation
    await context.overridePermissions(baseURL + filter, ['geolocation']);
    await page.setGeolocation({latitude:90, longitude:20})
    // Visiting the url
    await page.setUserAgent(userAgent)
    await page.goto(baseURL + filter);
    await page.waitForSelector(selectorWaiter, { timeout: 100000 });

    let firstPageProducts = await page.evaluate(() => {
      let results = [];
      let items   = document.querySelectorAll('.EIR5N');

      let blackListedKeywords = [
        'apartemen',
        'apartement',
        'apartment',
        'bogor',
        'cibinong',
        'cilebut',
        'cileungsi',
        'citayam',
        'cluster',
        'depok',
        'dp',
        'jagakarsa',
        'kebagusan',
        'kontrakan',
        'lenteng',
        'motor',
        'pamulang',
        'parung',
        'syariah',
        'tangerang'
      ];

      items.forEach((item) => {
        var title, titleWords, price, pageURL;

        let titleSelector     = '[data-aut-id=itemTitle]';
        let priceSelector     = '[data-aut-id=itemPrice]';

        title       = item.querySelector(titleSelector).textContent;
        titleWords  = title.split(' ').map(titleStr => titleStr.toLowerCase());
        price       = item.querySelector(priceSelector).textContent;
        pageURL     = item.querySelector('a[href]').getAttribute('href');

        console.log(titleWords);
        var containBlacklistedKeyword = blackListedKeywords.find( val => titleWords.includes(val.toLowerCase()) )
        console.log(containBlacklistedKeyword);

        if(containBlacklistedKeyword) {
          // do nothing
        } else {
          var data = {
            title,
            price,
            pageURL
          };

          results.push(data);
        }
      });

      return results;
    });

    console.log(firstPageProducts);

    // await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

