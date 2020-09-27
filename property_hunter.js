// HOW TO RUN SAMPLE: node property_hunter.js -k 400000000 -l 500000000

const puppeteer = require('puppeteer');
const argv      = require('minimist')(process.argv.slice(2));
const fs        = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'out.csv',
  header: [
    {id: 'title', title: 'Judul'},
    {id: 'price', title: 'Harga'},
    {id: 'address', title: 'Alamat'},
    {id: 'land_size', title: 'LT'},
    {id: 'building_size', title: 'LB'},
    {id: 'bedroom', title: 'Kamar Tidur'},
    {id: 'bathroom', title: 'Kamar Mandi'},
    {id: 'certificate', title: 'Sertifikat'},
    {id: 'url', title: 'URL'}
  ]
});

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const userAgent       = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36';
    const selectorWaiter  = '.EIR5N';

    const domain    = "https://www.olx.co.id";
    const baseURL   = "https://www.olx.co.id/jakarta-selatan_g4000030/dijual-rumah-apartemen_c5158/q-jakarta-selatan?filter=";
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

      items.forEach((item, index, items) => {
        var title, price, pageURL;

        let titleSelector     = '[data-aut-id=itemTitle]';
        let priceSelector     = '[data-aut-id=itemPrice]';

        title       = item.querySelector(titleSelector).textContent;
        price       = item.querySelector(priceSelector).textContent;
        pageURL     = item.querySelector('a[href]').getAttribute('href');

        var data = {
          title,
          price,
          pageURL
        };

        results.push(data);
      });

      console.log('DONE collecting all data on index');
      console.log(results);
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
        const certificateFetcher = async() => {
          let result;
          try {
            result = await newPage.$eval(certificateSelector, text => text.textContent); 
          }
          catch(err) {
            result = null;
          }
          return result;
        };
        const hoverToDetail = async() => {
          let success;
          try {
            await newPage.hover(waiterSelector);
            success = true;
          }
          catch(err) {
            success = false;
          }
          return success;
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
        const descriptionSelector     = '[data-aut-id="itemDescriptionContent"]';
        let   pageData                = {};


        let newPage = await browser.newPage();
        await newPage.goto(product.url);
        let isSuccessful = await hoverToDetail();

        if(isSuccessful) {
            pageData['address']         = await addressFetcher();
            pageData['bathroom']        = await newPage.$eval(bathRoomCountSelector, text => text.textContent);
            pageData['bedroom']         = await newPage.$eval(bedRoomCountSelector, text => text.textContent);
            pageData['certificate']     = await certificateFetcher();
            pageData['land_size']       = await newPage.$eval(landSizeSelector, text => text.textContent);
            pageData['building_size']   = await newPage.$eval(buildingSizeSelector, text => text.textContent);
            pageData['description']     = await newPage.$eval(descriptionSelector, text => text.textContent);
        }

        resolve(pageData);

        await newPage.close();
    });

    // Visting page by page
    for(index in firstPageProducts){
        var product         = firstPageProducts[index];
        product.url         = domain + product.pageURL;

        var titleWords  = product.title.split(' ').map(titleStr => titleStr.toLowerCase());
        var containBlacklistedKeyword = blackListedKeywords.find( val => titleWords.includes(val.toLowerCase()) );

        if(containBlacklistedKeyword) {
          console.log(`Eliminating ${product.title}`)
        } else {
          console.log(`Viewing ${product.title}`);
          let currentPageData = await detailPagePromise(product);

          let result = visitDetailPage(product, currentPageData);

          if(result) { endResults.push(result) }
        }
    }
    // END --- Getting the Details //
    console.log(endResults);

    csvWriter
      .writeRecords(endResults)
      .then(()=> console.log('The CSV file was written successfully'));

    return endResults;

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

function visitDetailPage(product, currentPageData) {
  var isAddressBlacklisted, descriptionWords;
  let address         = currentPageData.address;
  let description     = currentPageData.description;

  if(address) {
    var addressWords      = address.split(' ').map(addressStr => addressStr.toLowerCase());
    isAddressBlacklisted  = blackListedKeywords.find( val => addressWords.includes(val.toLowerCase()) );
  } else {
    console.log('Address not found');

    if(description) {
      descriptionWords  = description.split(' ').map(titleStr => titleStr.toLowerCase());
      isAddressBlacklisted  = blackListedKeywords.find( val => descriptionWords.includes(val.toLowerCase()) );
    } else {
      isAddressBlacklisted  = false;
    }
  }

  if(isAddressBlacklisted) {
    console.log("Blacklisted address");
    return null;
  } else {
    const combinedData  = {...product, ...currentPageData }

    return combinedData;
  }
}

let blackListedKeywords = [
  'apartemen',
  'apartement',
  'apartment',
  'akad',
  'aren',
  'banten',
  'bandung',
  'Bali',
  'bekasi',
  'bogor',
  'bojonggede',
  'boulevard',
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
  'hill',
  'indent',
  'jagakarsa',
  'Joglo',
  'Kreo',
  'kalisuren',
  'kebagusan',
  'kontrakan',
  'Kost',
  'lenteng',
  'motor',
  'muka',
  'pamulang',
  'parung',
  'perumahan',
  'pesanggrahan',
  'Petukangan',
  'readystock',
  'serpong',
  'stock',
  'stok',
  'syariah',
  'tangerang',
  'tanjung',
  'tangsel',
  'town',
  'Villa'
];