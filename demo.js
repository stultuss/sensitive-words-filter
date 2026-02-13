let Filter = require('./index');

// 设定需要搜索的敏感字
let search = [
  'a爿', 'Yuan', '治国'
];

// 初始化文字过滤器，将敏感字做成字典
Filter.instance().init(search);

// 运行
// This is "**｜**｜**｜**｜**" filter word!
console.log(Filter.instance().replace('This is "a爿｜a 爿｜aA爿｜a1爿｜a@爿" filter word!'));
// This is "****｜****｜****｜****" filter word!
console.log(Filter.instance().replace('This is "Yuan｜Y u an｜YAuAaAn｜Y@u@a@n" filter word!'));
// This is "??｜??｜??｜??｜??" filter word!
console.log(Filter.instance().replace('This is "治国｜治 国｜治A国｜治1国｜治@国" filter word!', '?', 'ABC'));