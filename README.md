sensitive-words-filter
=========================
文字过滤，支持敏感词匹配，由DFA算法实现

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