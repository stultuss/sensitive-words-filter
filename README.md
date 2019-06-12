Word Filter
=========================
The word filter via dfa

## Install

```bash
npm install word-filter-dfa --save
```

## How to use

```javascript
let wordFilter = require('word-filter-dfa');
wordFilter.instance().init(['羔子', '王八', '王八羔子', '王八蛋']);
console.log(wordFilter.instance().replace('你真是个王八,王八羔子,王八蛋', '*'));
console.log(wordFilter.instance().replace('你真是个王八王八蛋', '*'));
// 你真是个**,****,***
// 你真是个*****
```