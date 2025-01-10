let Filter = require('./index');

// 设定需要搜索的敏感字
let search = [
  'fuck',
];

// 初始化文字过滤器，将敏感字做成字典
Filter.instance().init(search);

// 运行
console.log(Filter.instance().replace('This is "fuck" filter word!')); // This is "****" filter word!
console.log(Filter.instance().replace('This is "f u c k" filter word!')); // This is "*******" filter word!
console.log(Filter.instance().replace('This is "f@u@c@k" filter word!')); // This is "*******" filter word!
console.log(Filter.instance().replace('This is "fAuBcCk" filter word!', '?', 'ABC')); // This is "???????" filter word!
