const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const response = await axios.get('https://www.tokopedia.com/search?st=product&q=madu');
    const $ = cheerio.load(response.data);

    console.log($('body').html());
  } catch (error) {
    console.log(error);
  }
})();
