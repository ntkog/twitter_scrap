const os = require('os');
const chunk = require('chunk-date-range');
const dateformat = require('dateformat');

function splitDateRange(startDate, endDate, chunks) {
  let start = new Date(startDate);
  let end = new Date(endDate);
  let ret = chunk(start, end, chunks);
  // ret.map(s => console.log(`${dateformat(s.start,"yyyy/mm/dd")} ${dateformat(s.end,"yyyy/mm/dd")}`));
  // process.exit(0);
  return ret.map(function(dateRange) {
      return {
          'start': dateformat(dateRange.start, "yyyy-mm-dd"),
          'end': dateformat(dateRange.end, "yyyy-mm-dd")
      };
  });
}

function autoScroll(page,interval) {
  return page.evaluate(function(timing) {
    return new Promise(function(resolve, reject) {
      let totalHeight = 0;

      //distance per scroll
      let distance = 1000;
      let timer = setInterval(function() {
          //get current height
          let scrollHeight = document.body.scrollHeight;

          //scroll and increment
          window.scrollBy(0, distance);
          totalHeight += distance;

          //if we didnt scroll, lazy loading must be done, so return
          if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
          }
          //how long to wait between scrolls
      }, timing);
    });
  },interval);
};

function extractItems() {
  return [...document.querySelectorAll('.tweet')]
    .map(el => ({
      metadata : {...el.dataset},
      text : el.querySelector('.js-tweet-text-container').textContent.trim()
    }));
};

function random(high,low) {
  return  Math.random() * (high - low) + low;
};

function splitJobs(list) {
  let cores = os.cpus().length;
  cores = cores > 2 ? cores - 2 : cores;
  console.log(`Optimize for [${cores}] cores`);
  let divider = Math.ceil(list.length / cores);
  return list.reduce((old,cur,i,arr) => {
     if (i % divider == 0) {
       old.push(arr.slice(i,i+divider));
     }
     return old;
  },[])
}

module.exports = {
  "splitDateRange": splitDateRange,
  "autoScroll": autoScroll,
  "extractItems": extractItems,
  "random": random,
  "splitJobs": splitJobs
};
