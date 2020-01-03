const puppeteer = require('puppeteer');
const {writeFile} = require('jsonfile');

const TWITTER_USER = process.argv[2] || "congosto";
const TWEETS_TO_FETCH = process.argv[3] || 100;

function extractItems() {
  return [...document.querySelectorAll('.tweet')]
    .map(el => ({
      metadata : {...el.dataset},
      text : el.querySelector('.js-tweet-text-container').textContent.trim()
    }));
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = Math.random() * (5000 - 1500) + 1500,
) {
  var items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      console.log(items.pop().text);
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitFor(scrollDelay);
    }
  } catch(e) { }
  return items;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the demo page.
  await page.goto(`https://twitter.com/search?q=%40${TWITTER_USER}%20include%3Anativeretweets&src=typed_query`);

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, TWEETS_TO_FETCH);

  // Save extracted items to a file.
  writeFile('./items.json', items);

  // Close the browser.
  await browser.close();
})();
