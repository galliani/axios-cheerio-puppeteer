const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.goto('https://www.tokopedia.com/search?st=product&q=madu');
    
    const selectorWaiter = '[data-testid="result-header-wrapper"]';
    await page.waitForSelector(selectorWaiter, { timeout: 100000 });

    // const body = await page.evaluate(() => {
    //   const contentHolder = '[data-testid="divSRPContentProducts"]';
    //   return document.querySelector(contentHolder).innerHTML;
    // });
    // console.log(body);

    let firstPageProducts = await page.evaluate(() => {
      //Extract each episode's basic details
      const productSelector = '[data-testid="master-product-card"]';
      let table = document.querySelector(productSelector);
      let productCards = Array.from(table.children); 
     
      // Loop through each episode and get their details 
      let product_info = productCards.map(productCard => {
        const titleSelector = '[data-testid="spnSRPProdName"]';
        let title = productCard.querySelector(titleSelector).textContent;

        const priceSelector = '[data-testid="spnSRPProdPrice"]';
        let price = productCard.querySelector(priceSelector).textContent;

        let salesCount = productCard.querySelector('.css-u49rxo').textContent;

        return { title, price, salesCount };
      });
      return product_info;
   });

    console.log(firstPageProducts)
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
