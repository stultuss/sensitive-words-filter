import { WordFilter } from '../src';
import * as path from 'path';

async function runTests() {
    const filter = WordFilter.instance();
    
    // 初始化过滤器
    const maskFilePath = path.resolve('tests/fixtures/mask_files');
    console.log(`敏感词库路径: ${maskFilePath}\n`);
    
    filter.init(maskFilePath);
    console.log('✅ 敏感词库初始化完成\n');
    
    // 测试用例
    const testCases = [
        // 基础匹配
        {
            name: '精确匹配 - "敏感词" + "测试"（连续）',
            input: '这是敏感词测试',
            expected: '这是*****'
        },
        {
            name: '精确匹配 - "测试" + "过滤"（连续）',
            input: '测试过滤功能',
            expected: '****功能'
        },
        {
            name: '精确匹配 - "过滤"（单个）',
            input: '关键词过滤系统',
            expected: '关键词**系统'
        },
        // 模糊匹配 - 跳过符号
        {
            name: '模糊匹配 - 跳过符号 "敏·感·词"',
            input: '这是敏·感·词测试',
            expected: '这是*****'
        },
        {
            name: '模糊匹配 - 跳过符号 "测~试" + "过-滤"',
            input: '测~试过-滤功能',
            expected: '****功能'
        },
        // 模糊匹配 - 跳过空格
        {
            name: '模糊匹配 - 跳过空格 "敏 感 词"',
            input: '这是敏 感 词测试',
            expected: '这是*****'
        },
        {
            name: '模糊匹配 - 跳过空格 "测 试" + "过 滤"',
            input: '测 试过 滤功能',
            expected: '****功能'
        },
        // 多个敏感词
        {
            name: '分离的多个敏感词 - "敏感词" 和 "测试"',
            input: '敏感词和测试内容',
            expected: '***和**内容'
        },
        {
            name: '分离的多个敏感词 - "中国" "北京" "上海"',
            input: '中国的北京和上海都很发达',
            expected: '**的**和**都很发达'
        },
        // 敏感词包含关系
        {
            name: '包含关系词 - "禁言" "禁止"',
            input: '禁言和禁止都是违禁内容',
            expected: '**和**都是**内容'
        },
        // 边界情况
        {
            name: '敏感词在开头',
            input: '敏感词很重要',
            expected: '***很重要'
        },
        {
            name: '敏感词在末尾',
            input: '这是敏感词',
            expected: '这是***'
        },
        {
            name: '敏感词是全部内容',
            input: '过滤',
            expected: '**'
        },
        // 复杂场景
        {
            name: '复杂场景 - 混合符号空格',
            input: '这是敏·感~词 测 试，中-国·北/京是好地方',
            expected: '这是*** **，**·**是好地方'
        },
        // 不包含敏感词
        {
            name: '不包含敏感词',
            input: '这是正常的内容，没有问题',
            expected: '这是正常的内容，没有问题'
        },
        // 替换字符自定义
        {
            name: '自定义替换字符 - 使用 #',
            input: '敏感词测试',
            expected: '#####',
            replaceChar: '#'
        },
        // 单个字符匹配
        {
            name: '单字匹配 - "中" + "国"',
            input: '中国很大',
            expected: '**很大'
        },
        
        // ===== 新增：英文/数字规避过滤测试 =====
        // 虽然插入了英文或数字，仍然会被识别为敏感词
        // 替换数：只计算中文字符，不计算数字和英文
        {
            name: '中间插入数字 - "敏1感2词"',
            input: '这是敏1感2词测试',
            expected: '这是*****'  // 敏感词(3) + 测试(2) = 5个星号
        },
        {
            name: '中间插入英文 - "敏a感b词"',
            input: '这是敏a感b词测试',
            expected: '这是*****'  // 敏感词(3) + 测试(2) = 5个星号
        },
        {
            name: '中间混合 - "敏1a感2b词"',
            input: '这是敏1a感2b词测试',
            expected: '这是*****'  // 敏感词(3) + 测试(2) = 5个星号
        },
        {
            name: '数字分隔 - "测9试"',
            input: '测9试功能',
            expected: '**功能'  // 测试(2) = 2个星号
        },
        {
            name: '英文分隔 - "过xXx滤"',
            input: '关键词过xXx滤系统',
            expected: '关键词**系统'  // 过滤(2) = 2个星号
        },
        {
            name: '多层嵌套 - "中1a国2b"',
            input: '中1a国2b很大',
            expected: '**2b很大'  // 中国(2) = 2个星号，"2b"保留
        },
        {
            name: '复杂混合 - "中1国2和北3京"',
            input: '中1国2和北3京很大地方',
            expected: '**2和**很大地方'  // 中国(2) + 北京(2) = 分别2个星号，"2"和"3"保留
        },
        
        // ===== 新增：包含英文的敏感词 =====
        {
            name: '英文敏感词 - "admin"',
            input: '这是admin下载',
            expected: '这是*****下载'  // admin(5) = 5个星号
        },
        
        // ===== 新增：CJK偏旁部首规避过滤 =====
        {
            name: 'CJK偏旁部首 - "敏灬感灬词"',
            input: '这是敏灬感灬词测试',
            expected: '这是*****'  // 敏感词(3) + 测试(2) = 5个星号
        },
        {
            name: 'CJK偏旁部首 - "中灬国"',
            input: '中灬国很大',
            expected: '**很大'  // 中国(2) = 2个星号
        },
        {
            name: 'CJK偏旁部首 - "测灬试"',
            input: '这测灬试一下',
            expected: '这**一下'  // 测试(2) = 2个星号
        },
        {
            name: '混合干扰 - "敏·感灬词1a测"',
            input: '这是敏·感灬词1a测试',
            expected: '这是***1a**'  // 敏感词(3) + 测试(2) = 分别3个和2个星号，"1a"在中间被保留
        },
        
        // ===== 新增：长词多干扰测试 - "习近平" =====
        {
            name: '长词精确匹配 - "习近平"',
            input: '这是习近平',
            expected: '这是***'
        },
        {
            name: '长词数字干扰 - "习1近1平"',
            input: '这是习1近1平',
            expected: '这是***'  // 跳过所有数字，正确识别"习近平"
        },
        {
            name: '长词混合干扰 - "习1近灬平"',
            input: '这是习1近灬平',
            expected: '这是***'  // 跳过数字和偏旁，正确识别"习近平"
        },
        {
            name: '长词偏旁干扰 - "习灬近灬平"',
            input: '这是习灬近灬平',
            expected: '这是***'  // 跳过所有偏旁，正确识别"习近平"
        },
        {
            name: '长词含上下文 - 中间干扰',
            input: '我支持习1近灬平',
            expected: '我支持***'  // 在真实文本中识别干扰后的"习近平"
        },
        {
            name: '长词多干扰 - 最复杂场景',
            input: '新闻：习灬1近a平执政',
            expected: '新闻：***执政'  // 跳过灬、1、a等所有干扰字符
        },
        // 长段落测试
        {
            name: '长段落 - 新闻评论（含多个敏感词）',
            input: '最近关于中国和北京的话题都有敏感词的问题。北京的推广很有意义，但测试中发现了很多过滤问题。上海和广州也需要关注。',
            expected: '最近关于**和**的话题都有***的问题。**的**很有意义，但**中发现了很多**问题。**和**也需要关注。'
        },
        {
            name: '长段落 - 社交媒体内容（含干扰字符）',
            input: '我发表了一些关于中·国的观点，这在北·京很有争议。但推1广2这个想法仍然很重要。测-试过-滤系统确实能帮助我们处理很多有问题的内容。',
            expected: '我发表了一些关于**的观点，这在**很有争议。但**2这个想法仍然很重要。****系统确实能帮助我们处理很多有问题的内容。'
        },
        {
            name: '长段落 - 混合型干扰（数字+符号+英文+偏旁）',
            input: '最近我注意到在推1广2活动中，过-滤中a文内容是关键。特别是在北a京和上海的地区，敏.感.词问题变得越来越严重。习1近灬平的政策也需要遵守这些规则。',
            expected: '最近我注意到在**2活动中，**中a文内容是关键。特别是在**和**的地区，***问题变得越来越严重。***的政策也需要遵守这些规则。'
        },
        {
            name: '长段落 - 复杂场景（电商内容）',
            input: '本店是正规商家，绝不涉及赌博或诈骗活动。我们的产品通过了广州质检中心的认证。关于推广策略，我们只采用合法手段。欢迎来北京总部了解更多信息。',
            expected: '本店是正规商家，绝不涉及**或**活动。我们的产品通过了**质检中心的认证。关于**策略，我们只采用合法手段。欢迎来**总部了解更多信息。'
        },
        {
            name: '长段落 - 学术讨论（含多重干扰）',
            input: '根据研究，测 试技术在中 国的应用日益广泛。特别是在北 京、上 海等大城市，过 滤系统的重要性不言而喻。关于推 广这项技术，我们需要更多的学术讨论。许多违a禁b内容被系统自动拦截。',
            expected: '根据研究，**技术在**的应用日益广泛。特别是在**、**等大城市，**系统的重要性不言而喻。关于**这项技术，我们需要更多的学术讨论。许多**b内容被系统自动拦截。'
        },
        {
            name: '长段落 - 日常对话（符号干扰）',
            input: '你听说了吗？最近在上·海和广·州发生了很多事。我们需要对敏·感·词进行过·滤。推·广这个系统很重要。北·京团队已经准备好了测·试方案。',
            expected: '你听说了吗？最近在**和**发生了很多事。我们需要对***进行**。**这个系统很重要。**团队已经准备好了**方案。'
        },
        {
            name: '长段落 - 极端干扰情况',
            input: '据报道，一些人在网上推1.广2.敏3.感4.词的内容，试图逃避过-滤-系-统。但我们的技术可以识别这种习灬1近a2平的伪装方法。中a国、北b京、上c海等地都在加强检查。',
            expected: '据报道，一些人在网上**2.***的内容，试图逃避**-系-统。但我们的技术可以识别这种***的伪装方法。**、**、**等地都在加强检查。'
        },
        {
            name: '长段落 - 真实文章段落',
            input: `在当今的互联网时代，内容审核变得至关重要。特别是对于敏感词的处理，
中国的各大平台都在推广更完善的过滤系统。通过测试和优化，我们发现在北京、
上海、广州等主要城市，用户对于防止诈骗和赌博内容的需求非常迫切。
虽然有人试图通过各种干扰字符来逃避检查，比如在推1广2之类的方式，
但现代的过滤技术已经能够识别这些常见的伪装手法。`,
            expected: `在当今的互联网时代，内容审核变得至关重要。特别是对于***的处理，
**的各大平台都在**更完善的**系统。通过**和优化，我们发现在**、
**、**等主要城市，用户对于防止**和**内容的需求非常迫切。
虽然有人试图通过各种干扰字符来逃避检查，比如在**2之类的方式，
但现代的**技术已经能够识别这些常见的伪装手法。`
        },
        
        // ===== 新增：中英文混用场景（57个新测试） =====
        // 群组1：单词中夹英文（10个）
        {
            name: '中英混用 - 敏感词中间夹单个英文',
            input: '这是敏a感词测试',
            expected: '这是*****'
        },
        {
            name: '中英混用 - 敏感词中间夹多个英文',
            input: '敏ABC感DEF词',
            expected: '***'
        },
        {
            name: '中英混用 - 敏感词首尾带英文',
            input: 'A中国B很大',
            expected: 'A**B很大'
        },
        {
            name: '中英混用 - 敏感词前后都带英文',
            input: 'Hello中国World',
            expected: 'Hello**World'
        },
        {
            name: '中英混用 - 长词含英文前缀',
            input: 'Test习近平领导',
            expected: 'Test***领导'
        },
        {
            name: '中英混用 - 长词含英文后缀',
            input: '习近平Test123运动',
            expected: '***Test123运动'
        },
        {
            name: '中英混用 - 多个词都含英文',
            input: 'A中国B和C北京D',
            expected: 'A**B和C**D'
        },
        {
            name: '中英混用 - 英文词汇嵌入',
            input: '这个test测试过滤系统',
            expected: '这个test****系统'
        },
        {
            name: '中英混用 - 大小写英文干扰',
            input: '敏InTeN感词部分',
            expected: '***部分'
        },
        {
            name: '中英混用 - 英文单词单独出现',
            input: '推ENGLISH广',
            expected: '**'
        },
        
        // 群组2：数字特殊符号组合（10个）
        {
            name: '数字符号 - 连续数字分隔',
            input: '敏123感456词789',
            expected: '***789'
        },
        {
            name: '数字符号 - 特殊符号连续',
            input: '敏!!!感!!!词',
            expected: '***'
        },
        {
            name: '数字符号 - 下划线分隔',
            input: '敏_感_词',
            expected: '***'
        },
        {
            name: '数字符号 - 井号分隔',
            input: '测#试#内容',
            expected: '**#内容'
        },
        {
            name: '数字符号 - 斜杠分隔',
            input: '过/滤/系统',
            expected: '**/系统'
        },
        {
            name: '数字符号 - 百分号分隔',
            input: '敏%感%词',
            expected: '***'
        },
        {
            name: '数字符号 - 星号分隔',
            input: '中*国*很*大',
            expected: '***很*大'
        },
        {
            name: '数字符号 - 加号分隔',
            input: '敏+感+词',
            expected: '***'
        },
        {
            name: '数字符号 - 等号分隔',
            input: '中=国=很=大',
            expected: '**=很=大'
        },
        {
            name: '数字符号 - 问号感叹号分隔',
            input: '测?试!过?滤',
            expected: '**!**'
        },
        
        // 群组3：混合中英文数字符号（10个）
        {
            name: '三重混合 - 中文+英文+数字',
            input: '敏a1感b2词c3',
            expected: '***c3'
        },
        {
            name: '三重混合 - 测试1a2b3中间夹杂',
            input: '这是测1a试2b过滤',
            expected: '这是**2b**'
        },
        {
            name: '三重混合 - 数字字母符号三层干扰',
            input: '敏@1#a感@2#b词',
            expected: '***'
        },
        {
            name: '三重混合 - 长词复杂干扰',
            input: '习X1近Y2平Z3',
            expected: '***Z3'
        },
        {
            name: '三重混合 - 嵌套式干扰',
            input: 'A中B1国C#D',
            expected: 'A**C#D'
        },
        {
            name: '三重混合 - 高密度干扰',
            input: '敏!@#$%感^&*()词',
            expected: '***'
        },
        {
            name: '三重混合 - 交替干扰',
            input: '敏A敏B敏C感D感E感F词',
            expected: '敏A敏B敏C感D感E感F词'
        },
        {
            name: '三重混合 - 分散干扰',
            input: '测a1试b2过c3滤',
            expected: '**b2**'
        },
        {
            name: '三重混合 - URL样式干扰',
            input: 'http://敏感词.com/test',
            expected: 'http://***.com/test'
        },
        {
            name: '三重混合 - 电子邮件样式',
            input: 'admin@敏感词.com',
            expected: '*****@***.com'  // 词库已含 admin(5)，敏感词(3)
        },
        
        // 群组4：全英文背景中的敏感词（10个）
        {
            name: '英文背景 - 短句子中敏感词',
            input: 'This is 敏感词 about something',
            expected: 'This is *** about something'
        },
        {
            name: '英文背景 - 段落中敏感词',
            input: 'The report shows that 中国 is developing rapidly',
            expected: 'The report shows that ** is developing rapidly'
        },
        {
            name: '英文背景 - 多个敏感词散布',
            input: 'Also 北京 and 上海 are important for 测试 in 推广',
            expected: 'Also ** and ** are important for ** in **'
        },
        {
            name: '英文背景 - 标题式文本',
            input: '[Important] 敏感词 Warning Report',
            expected: '[Important] *** Warning Report'
        },
        {
            name: '英文背景 - 列表项中敏感词',
            input: '- 中国\n- USA\n- 北京\n- Japan',
            expected: '- **\n- USA\n- **\n- Japan'
        },
        {
            name: '英文背景 - 引号中敏感词',
            input: 'He said "这是敏感词测试"',
            expected: 'He said "这是*****"'
        },
        {
            name: '英文背景 - 括号中敏感词',
            input: '(关于中国的报告)',
            expected: '(关于**的报告)'
        },
        {
            name: '英文背景 - 日期时间格式中敏感词',
            input: '2024-02-11 测试 敏感词 过滤',
            expected: '2024-02-11 ** *** **'
        },
        {
            name: '英文背景 - 版本号中敏感词',
            input: 'v1.0.2-过滤-中国-测试',
            expected: 'v1.0.2-**-**-**'
        },
        {
            name: '英文背景 - 路径中敏感词',
            input: '/usr/local/filter/敏感词/test',
            expected: '/usr/local/filter/***/test'
        },
        
        // 群组5：数字密集型敏感词（10个）
        {
            name: '数字密集 - 全数字敏感词',
            input: '这个包含123456789数字序列',
            expected: '这个包含******789数字序列'  // 词库已含 123456(6)
        },
        {
            name: '数字密集 - 敏感词前后数字',
            input: '123敏感词456',
            expected: '123***456'
        },
        {
            name: '数字密集 - 敏感词嵌入数字',
            input: '敏1感2词3456',
            expected: '***3456'
        },
        {
            name: '数字密集 - 多个敏感词间隔数字',
            input: '敏感词123测试456过滤',
            expected: '***123**456**'
        },
        {
            name: '数字密集 - 电话号码样式',
            input: '敏感词 13800138000',
            expected: '*** 13800138000'
        },
        {
            name: '数字密集 - 身份号样式',
            input: '关于敏感词的110105199003071234',
            expected: '关于***的110105199003071234'
        },
        {
            name: '数字密集 - IP地址样式',
            input: '服务器敏感词在192.168.1.1',
            expected: '服务器***在192.168.1.1'
        },
        {
            name: '数字密集 - 金额样式',
            input: '敏感词需要¥99.99元',
            expected: '***需要¥99.99元'
        },
        {
            name: '数字密集 - 时间戳样式',
            input: '敏感词1708-1800-2024',
            expected: '***1708-1800-2024'
        },
        {
            name: '数字密集 - 小数点分隔',
            input: '敏.2.感.3.词',
            expected: '***'
        },
        
        // 群组6：符号密集型敏感词（7个）
        {
            name: '符号密集 - 各类括号',
            input: '敏（感）词[测]试{过}滤',
            expected: '***[**{**'
        },
        {
            name: '符号密集 - 引号标记',
            input: '"敏感词"和\'测试\'以及`过滤`',
            expected: '"***"和\'**\'以及`**`'
        },
        {
            name: '符号密集 - ASCII符号',
            input: '敏!@#感$%^词&*()',
            expected: '***&*()'
        },
        {
            name: '符号密集 - 中文标点',
            input: '敏、感、词，测/试，过-滤',
            expected: '敏、感、词，**，**'
        },
        {
            name: '符号密集 - 数学符号',
            input: '敏+感±词÷测×试=过≤滤',
            expected: '敏+感±词÷测×试=过≤滤'
        },
        {
            name: '符号密集 - 货币符号',
            input: '敏$感€词¥测试£过滤',
            expected: '敏$感€词¥**£**'
        },
        {
            name: '符号密集 - 箭头符号',
            input: '敏→感←词↑测↓试←过→滤',
            expected: '敏→感←词↑测↓试←过→滤'
        }
    ];
    
    console.log('========== WordsFilter 测试报告 ==========\n');
    
    let passCount = 0;
    let failCount = 0;
    const failedTests: Array<{name: string; input: string; expected: string; actual: string}> = [];
    
    for (const testCase of testCases) {
        const result = filter.replace(testCase.input, testCase.replaceChar || '*');
        const passed = result === testCase.expected;
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testCase.name}`);
        console.log(`   输入: "${testCase.input}"`);
        console.log(`   预期: "${testCase.expected}"`);
        console.log(`   实际: "${result}"`);
        
        if (passed) {
            passCount++;
        } else {
            failCount++;
            failedTests.push({
                name: testCase.name,
                input: testCase.input,
                expected: testCase.expected,
                actual: result
            });
        }
        console.log('');
    }
    
    console.log('\n========== 测试总结 ==========');
    console.log(`总用例数: ${testCases.length}`);
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`通过率: ${((passCount / testCases.length) * 100).toFixed(2)}%`);
    
    if (failedTests.length > 0) {
        console.log('\n========== 失败详情 ==========');
        for (const test of failedTests) {
            console.log(`\n${test.name}`);
            console.log(`  输入: "${test.input}"`);
            console.log(`  预期: "${test.expected}"`);
            console.log(`  实际: "${test.actual}"`);
        }
    }
    if (failCount > 0) {
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('测试执行错误:', error);
    process.exit(1);
});
