// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
const {writeFile} = require('jsonfile');

const TWITTER_USER = process.argv[2] || "congosto";

function extractItems() {
  return [...document.querySelectorAll('.tweet')]
    .map(el => ({
      metadata : {...el.dataset},
      text : el.querySelector('.js-tweet-text-container').textContent.trim()
    }));
}

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount
) {
  var items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      console.log(items.length);
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await wait(Math.random() * (10000 - 3525) + 3525);
    }
  } catch(e) { }
  return items;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the demo page.
  await page.goto(`https://twitter.com/${TWITTER_USER}`);

  // get Total Numbers of tweets
  let total_tweets = await page.evaluate(`parseInt(document.querySelector('span[data-count]').dataset.count)`);

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, total_tweets);

  // Save extracted items to a file.
  writeFile('./items.json', items);

  // Close the browser.
  await browser.close();
})();
