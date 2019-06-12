let wordFilter = require('./index');
wordFilter.instance().init(['羔子', '王八羔子', '王八蛋', '王八']);
console.log(wordFilter.instance().replace('你真是个王八,王八羔子,王八蛋', '*'));
console.log(wordFilter.instance().replace('你真是个王八王八蛋', '*'));