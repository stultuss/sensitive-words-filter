sensitive-words-filter
=========================
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build][travis-image]][travis-url]
[![Linux Build][travis-linux-image]][travis-linux-url]
[![Windows Build][travis-windows-image]][travis-windows-url]
[![Test Coverage][coveralls-image]][coveralls-url]

> 文字过滤，支持敏感词匹配，由DFA算法实现

## Install

```bash
npm install sensitive-words-dfa-filter --save
```

## How to use

```javascript
let Filter = require('sensitive-words-dfa-filter');

// 设定需要搜索的敏感字
let search = [
  'f',
  'filter'
];

// 初始化文字过滤器，将敏感字做成字典
Filter.instance().init(search);

// 运行
console.log(Filter.instance().replace('This is filter word!')); // This is ****** word!
console.log(Filter.instance().replace('This is fffffilterfffff word!')); // This is *************** word!
```

[npm-image]: https://img.shields.io/npm/v/sensitive-words-dfa-filter.svg
[npm-url]: https://npmjs.org/package/sensitive-words-dfa-filter
[downloads-image]: https://img.shields.io/npm/dm/word-filter-dfa.svg
[downloads-url]: https://npmjs.org/package/word-filter-dfa
[travis-image]: https://travis-ci.org/stultuss/sensitive-words-filter.svg?branch=master
[travis-url]: https://travis-ci.org/stultuss/sensitive-words-filter
[travis-linux-image]: https://img.shields.io/travis/stultuss/sensitive-words-filter/master.svg?label=linux
[travis-linux-url]: https://travis-ci.org/stultuss/sensitive-words-filter
[travis-windows-image]: https://img.shields.io/travis/stultuss/sensitive-words-filter/master.svg?label=windows
[travis-windows-url]: https://travis-ci.org/stultuss/sensitive-words-filter
[coveralls-image]: https://img.shields.io/coveralls/stultuss/sensitive-words-filter/master.svg
[coveralls-url]: https://coveralls.io/r/stultuss/sensitive-words-filter?branch=master