const puppeteer = require('puppeteer');
const {writeFile} = require('jsonfile');
const {splitDateRange,autoScroll,extractItems,random,splitJobs} = require('./helpers');

const [,,TERM,START_DATE,END_DATE,ONLY_FROM] = process.argv;
const QUERY_SELECTORS = ["input", "#search-query"]

async function runJobs (query,onlyFrom,list) {
  let browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  return new Promise(async (resolve,reject) => {
    let ret = [];
    let encodedQuery = encodeURI(onlyFrom === "true" ? `from:${query}` : query);
    let page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(`https://twitter.com/search?l=&q=${encodedQuery}&src=typd&lang=en`);
    await page.setViewport({
        width: 1200,
        height: 800
    });
    await page.waitForNavigation({waitUntil: "domcontentloaded"});
    let querySelectorIdx = await page.evaluate(arr => {
      let selectors =arr.map(sel => document.querySelector(sel)).map((el,i) => el !== null ? i : el);
      return selectors.indexOf(1);
    }, QUERY_SELECTORS);
    let QUERY_SELECTOR = QUERY_SELECTORS[querySelectorIdx];

    if (QUERY_SELECTOR !== null) {
      try {
        for (let i = 0; i < list.length; i += 1) {
              await page.evaluate(sel => { document.querySelector(sel).value = "" }, QUERY_SELECTOR);
              await page.type(QUERY_SELECTOR, `${query} since:${list[i].start} until:${list[i].end}`, {delay: random(75,30)});
              await page.click('.js-search-action');
              //await page.waitForNavigation({waitUntil: "networkidle0"});
              await autoScroll(page,random(2500,1500));
              let tweets = await page.evaluate(extractItems);
              ret.push(tweets);
              console.log(`Fetched : [${tweets.length}] tweets => [${query} since:${list[i].start} until:${list[i].end}]`);
              //await page.waitFor(random(2000,1000));
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
    let dateChunks = splitDateRange(startDate, endDate, "day").filter(o => o.start !== o.end);
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
