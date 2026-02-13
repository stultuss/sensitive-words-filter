let Filter = require('./index');

// 设定需要搜索的敏感字
let search = [
  'AB', 'ABC', '治国'
];

// 初始化文字过滤器，将敏感字做成字典
Filter.instance().init(search);

// 运行
// This is "**｜**｜**｜**｜**" filter word!
console.log(Filter.instance().replace('This is "AB｜A B｜AAB｜A1B｜A@B" filter word!'));T
// This is "***｜***｜***｜***" filter word!
console.log(Filter.instance().replace('This is "ABC｜A B C｜A1B1C｜A@B@C" filter word!'));
// This is "??｜??｜??｜??｜??" filter word!
console.log(Filter.instance().replace('This is "治国｜治 国｜治A国｜治1国｜治@国" filter word!', '?', 'ABC'));