// HOW TO RUN SAMPLE: node property_hunter.js -k 400000000 -l 500000000

const puppeteer = require('puppeteer');
const argv      = require('minimist')(process.argv.slice(2));

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const userAgent       = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36';
    const selectorWaiter  = '.EIR5N';

    const domain    = "https://www.olx.co.id";
    const baseURL   = "https://www.olx.co.id/jakarta-dki_g2000007/dijual-rumah-apartemen_c5158/q-jakarta-selatan?filter=";
    const context   = browser.defaultBrowserContext();

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

    // LOAD MORE SECTION //
    let selectorForLoadMoreButton   = '[data-aut-id=btnLoadMore]';
    const isElementVisible = async (page, cssSelector) => {
      let visible = true;
      await page
        .waitForSelector(cssSelector, { visible: true, timeout: 2000 })
        .catch(() => {
          visible = false;
        });
      return visible;
    };
    console.log('START loading all results');
    let loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);
    while (loadMoreVisible) {
      await page
        .click(selectorForLoadMoreButton)
        .catch(() => {});
      loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);
    }
    console.log('DONE loading all search results');
    // END --- LOAD MORE SECTION //

    let firstPageProducts = await page.evaluate(() => {
      let results   = [];
      let items     = document.querySelectorAll('.EIR5N');

      let blackListedKeywords = [
        'apartemen',
        'apartement',
        'apartment',
        'akad',
        'banten',
        'bekasi',
        'bogor',
        'bojonggede',
        'bsd',
        'cabe',
        'cash',
        'cibinong',
        'cibubur',
        'cilebut',
        'cileungsi',
        'cinere',
        'citayam',
        'cluster',
        'depok',
        'dp',
        'indent',
        'jagakarsa',
        'kalisuren',
        'kebagusan',
        'kontrakan',
        'lenteng',
        'motor',
        'muka',
        'pamulang',
        'parung',
        'perumahan',
        'serpong',
        'syariah',
        'tangerang',
        'tangsel',
        'town'
      ];

      items.forEach((item, index, items) => {
        var title, titleWords, price, pageURL;

        let titleSelector     = '[data-aut-id=itemTitle]';
        let priceSelector     = '[data-aut-id=itemPrice]';

        title       = item.querySelector(titleSelector).textContent;
        titleWords  = title.split(' ').map(titleStr => titleStr.toLowerCase());
        price       = item.querySelector(priceSelector).textContent;
        pageURL     = item.querySelector('a[href]').getAttribute('href');

        var containBlacklistedKeyword = blackListedKeywords.find( val => titleWords.includes(val.toLowerCase()) )

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

      console.log('DONE collecting all data on index');
      return results;
    });

    // Getting the Details //
    let endResults = [];
    let detailPagePromise = (product) => new Promise(async(resolve, reject) => {
        // Need special function because address sometimes does not exist
        const addressFetcher = async() => {
          let result;
          try {
            result = await newPage.$eval(addressSelector, text => text.textContent); 
          }
          catch(err) {
            result = null;
          }
          return result;
        };

        // Scrolling-related selector
        const waiterSelector          = '[data-aut-id=itemParams]';
        // vars for gathering data from detail page
        const addressSelector         = '[data-aut-id="value_p_alamat"]';
        const bathRoomCountSelector   = '[data-aut-id="value_p_bathroom"]';
        const bedRoomCountSelector    = '[data-aut-id="value_p_bedroom"]';
        const buildingSizeSelector    = '[data-aut-id="value_p_sqr_building"]';
        const certificateSelector     = '[data-aut-id="value_p_certificate"]';
        const landSizeSelector        = '[data-aut-id="value_p_sqr_land"]';
        let   pageData                = {};


        let newPage = await browser.newPage();
        await newPage.goto(product.url);
        await newPage.hover(waiterSelector);

        pageData['address']         = await addressFetcher();
        pageData['bathroom']        = await newPage.$eval(bathRoomCountSelector, text => text.textContent);
        pageData['bedroom']         = await newPage.$eval(bedRoomCountSelector, text => text.textContent);
        pageData['certificate']     = await newPage.$eval(certificateSelector, text => text.textContent);
        pageData['land_size']       = await newPage.$eval(landSizeSelector, text => text.textContent);
        pageData['building_size']   = await newPage.$eval(buildingSizeSelector, text => text.textContent);

        resolve(pageData);

        await newPage.close();
    });
    for(index in firstPageProducts){
        var product         = firstPageProducts[index];
        product.url         = domain + product.pageURL;

        console.log(`Viewing ${product.title}`);
        let currentPageData = await detailPagePromise(product);

        const combinedData  = {...product, ...currentPageData }

        endResults.push(combinedData);
    }
    // END --- Getting the Details //
    console.log(endResults);
    return endResults;

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

