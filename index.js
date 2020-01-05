// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());


const {writeFile} = require('jsonfile');
const {splitDateRange,autoScroll,extractItems,random,splitJobs} = require('./helpers');

const [,,TERM,START_DATE,END_DATE,ONLY_FROM,SPLIT_OPTION] = process.argv;
const QUERY_SELECTORS = ["input", "#search-query"];
const LATEST_NAV_SELECTOR = '[data-nav="search_filter_tweets"]';
const VERTICAL_GAP = 75;


async function runJobs (query,onlyFrom,list) {
  let browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  return new Promise(async (resolve,reject) => {
    let ret = [];
    let encodedQuery = encodeURI(onlyFrom === "true" ? `from:${query}` : query);
    let page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    await page.setViewport({
        width: 1200,
        height: 1000
    });

    await page.goto(`https://twitter.com/search?l=&q=${encodedQuery}&src=typd&lang=en`);

    await page.waitFor(LATEST_NAV_SELECTOR);
   
    await page.click(LATEST_NAV_SELECTOR);
    try {
      await page.waitForNavigation({waitUntil: "networkidle0"});
    } catch(err) {
      console.log(`Navigation Timeout!`);
      console.error(err);
    }

    let QUERY_SELECTOR = QUERY_SELECTORS[1];

    if (QUERY_SELECTOR !== null) {
      try {
        for (let i = 0; i < list.length; i += 1) {
              await page.focus(QUERY_SELECTOR);
              await page.evaluate(sel => { document.querySelector(sel).value = "" }, QUERY_SELECTOR);
              await page.type(QUERY_SELECTOR, `${query} since:${list[i].start} until:${list[i].end}`, {delay: random(75,30)});
              await page.click('.js-search-action');
              await page.waitFor(2000);
              let availableTweets = await page.evaluate(sel => {
                return document.querySelector('.tweet');
              })
              if(availableTweets !== null) {
                await autoScroll(page,VERTICAL_GAP,random(300,100));
                let tweets = await page.evaluate(extractItems, list[i].start);
                ret.push(tweets);
                console.log(`Fetched : [${tweets.length}] tweets => [${query} since:${list[i].start} until:${list[i].end}]`);
              } else {
                console.log(`No tweets for [${query} since:${list[i].start} until:${list[i].end}]. Skipping...`);
              }
        }
      } catch(err) {
        reject(err);
      }
    } else {
      console.log(`Skipped [${list[i].start} - ${list[i].end}] : selectors [${QUERY_SELECTORS.join(",")}] don't work`)
    }

    await page.close();
    resolve([].concat(...ret));
    await browser.close();
  }).catch((err) => console.log(err))

}

async function run(query, startDate, endDate, onlyFrom) {
    //chunk the dates
    let dateChunks = splitDateRange(startDate, endDate, SPLIT_OPTION).filter(o => o.start !== o.end);
    let allJobs = splitJobs(dateChunks);
    let tweets = await Promise.all(allJobs.map(r => runJobs(query,onlyFrom,r)));

    console.log("Finished");
    return [].concat(...tweets);
}

(async (term,startDate,endDate,onlyFrom, segments) => {
  let tweets = await run(term, startDate, endDate, onlyFrom, /[0-9]/.test(segments) ? parseInt(segments): segments);
  console.log(`Total tweets fetched [${tweets.length}]`);
  let filename = `./tweets_${startDate.replace(/\//g, "_")}_${endDate.replace(/\//g, "_")}.json`;
  try {
    await writeFile(filename, tweets);
    console.log(`[${filename}] Written!`);
  } catch(err) {
    console.error(err);
  }

})(TERM, START_DATE, END_DATE, ONLY_FROM)
