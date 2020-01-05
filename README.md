# Mentions

This project is based on [Node-Twitter-Scrapper](https://github.com/dansalerno712/Node-Twitter-Scraper.git);

# Warnings

> It's a work in progress. Still not catching all the tweets comparing to my own twitter download [tweets.json], but it's getting
closer. There is some weird cases to study. On public search yo cannot see

> Try to do the searches in batches of more than days.

# Enhancements

- Use as much cores as you have.
- Don't reload pages for each url
- Get Metadata of the tweets



# Prerequisites

- [NodeJS 10.x +](https://nodejs.org/en/download/)

# Instalation

1. Clone this repository

```bash
git clone https://github.com/ntkog/twitter_scrap.git
```

2. Install dependencies

```bash
npm install
```

# Run

```bash
node index.js "@NTKOG" "2018/01/01" "2019/01/01" "false"
```

## Arguments

In the example above:

- **@NTKOG** : twitter Handle.
- **"2018/01/01"** : startDate
- **"2019/01/01"** : endDate
- **"false"** : Only tweets from username (when it set to **true** it gets the whole timeline)
> Once it finishes, it will store the results in **tweets_(startDate)_(endDate).json** file
