import * as assert from 'assert';
import Filter from '../src/index';

interface TestCase {
    name: string;
    fn: () => void;
}

const testCases: TestCase[] = [];

function test(name: string, fn: () => void): void {
    testCases.push({ name, fn });
}

// ===== 初始化 =====

test('未初始化时 replace 原样返回', () => {
    assert.strictEqual(Filter.instance().replace('任何文本'), '任何文本');
});

test('init 数组词库后可替换', () => {
    Filter.instance().init(['text']);
    assert.strictEqual(Filter.instance().replace('This is text word!'), 'This is **** word!');
});

test('init 文件路径词库可替换', () => {
    Filter.instance().init('tests/fixtures/mask_files/test.txt');
    assert.strictEqual(Filter.instance().replace('赌博内容'), '**内容');
});

test('init 目录路径词库可替换', () => {
    Filter.instance().init('tests/fixtures/mask_files');
    assert.strictEqual(Filter.instance().replace('诈骗电话'), '**电话');
});

// ===== 基础匹配 =====

test('多个敏感词独立替换', () => {
    Filter.instance().init(['赌博', '诈骗']);
    assert.strictEqual(Filter.instance().replace('赌博诈骗'), '****');
    assert.strictEqual(Filter.instance().replace('这是赌博和诈骗'), '这是**和**');
});

test('取最长匹配（AB 与 ABC 同时存在）', () => {
    Filter.instance().init(['AB', 'ABC']);
    assert.strictEqual(Filter.instance().replace('ABC'), '***');
});

test('自定义替换字符', () => {
    Filter.instance().init(['治国']);
    assert.strictEqual(Filter.instance().replace('治国', '?'), '??');
});

// ===== 填充字符规则 =====

test('符号/空格始终可作为填充字符', () => {
    Filter.instance().init(['AB']);
    assert.strictEqual(Filter.instance().replace('A B'), '**');
    assert.strictEqual(Filter.instance().replace('A@B'), '**');
});

test('中文关键字允许跳过字母数字（hasNonAscii 门控）', () => {
    Filter.instance().init(['治国']);
    assert.strictEqual(Filter.instance().replace('治A国'), '**');
    assert.strictEqual(Filter.instance().replace('治1国'), '**');
});

test('纯英文关键字默认不跳过字母数字', () => {
    Filter.instance().init(['AB']);
    assert.strictEqual(Filter.instance().replace('AAB'), 'A**');
    assert.strictEqual(Filter.instance().replace('A1B'), 'A1B');
});

test('单字关键字策略：保留非 ASCII 单字，忽略 ASCII 单字', () => {
    Filter.instance().init(['赌', 'AB']);
    assert.strictEqual(Filter.instance().replace('赌'), '*');
    assert.strictEqual(Filter.instance().replace('赌博'), '*博');
    Filter.instance().init(['a', 'AB']);
    assert.strictEqual(Filter.instance().replace('a'), 'a');
    assert.strictEqual(Filter.instance().replace('AB'), '**');
});

test('文件加载支持 、与换行混合分隔', () => {
    Filter.instance().init('tests/fixtures/unit/mixed.txt');
    assert.strictEqual(Filter.instance().replace('这是敏感词'), '这是***');
    assert.strictEqual(Filter.instance().replace('测试过滤'), '****');
});

test('目录加载递归读取子目录', () => {
    Filter.instance().init('tests/fixtures/unit');
    assert.strictEqual(Filter.instance().replace('嵌套词'), '***');
});

test('重复 init 替换旧词库', () => {
    Filter.instance().init(['AB']);
    Filter.instance().init(['治国']);
    assert.strictEqual(Filter.instance().replace('AB'), 'AB');
    assert.strictEqual(Filter.instance().replace('治国'), '**');
});

test('clearCache 完整重置后需重新 init', () => {
    Filter.instance().init(['AB']);
    Filter.instance().clearCache();
    assert.strictEqual(Filter.instance().replace('AB'), 'AB');
    Filter.instance().init(['AB']);
    assert.strictEqual(Filter.instance().replace('AB'), '**');
});

test('大小写不敏感', () => {
    Filter.instance().init(['text']);
    assert.strictEqual(Filter.instance().replace('Text'), '****');
});

// ===== 重叠匹配 =====

test('重叠匹配-跨起点合并（ABC/BCD 输入 "A B C D"）', () => {
    Filter.instance().init(['ABC', 'BCD']);
    assert.strictEqual(Filter.instance().replace('A B C D'), '****');
    assert.strictEqual(Filter.instance().replace('ABCD'), '****');
});

test('重叠匹配-部分重叠（AB/BC 输入 "A B C"）', () => {
    Filter.instance().init(['AB', 'BC']);
    assert.strictEqual(Filter.instance().replace('A B C'), '***');
});

test('重叠匹配-不重叠时保留间隔', () => {
    Filter.instance().init(['AB', 'CD']);
    assert.strictEqual(Filter.instance().replace('A B C D'), '** **');
    assert.strictEqual(Filter.instance().replace('ABCD'), '****');
});

// ===== 全角/中文混淆字符 =====

test('全角空格/顿号/省略号可作为填充字符', () => {
    Filter.instance().init(['治国']);
    assert.strictEqual(Filter.instance().replace('治　国'), '**');
    assert.strictEqual(Filter.instance().replace('治、国'), '**');
    assert.strictEqual(Filter.instance().replace('治…国'), '**');
});

test('全角字母数字可作为中文关键词的填充字符', () => {
    Filter.instance().init(['治国']);
    assert.strictEqual(Filter.instance().replace('治Ａ国'), '**');
    assert.strictEqual(Filter.instance().replace('治０国'), '**');
});

test('全角字母不归一化为 ASCII 关键词', () => {
    Filter.instance().init(['AB']);
    assert.strictEqual(Filter.instance().replace('ＡＢ'), 'ＡＢ');
});

// ===== 大规模输入 =====

test('大规模输入正确且无二次方退化', () => {
    Filter.instance().init(['赌博']);
    const input = '赌博'.repeat(50000);
    assert.strictEqual(Filter.instance().replace(input), '**'.repeat(50000));
});

// ===== 词边界模式 =====

test('词边界模式-默认关闭保持子串匹配', () => {
    Filter.instance().init(['admin']);
    assert.strictEqual(Filter.instance().replace('administrator'), '*****istrator');
});

test('词边界模式-不命中更长英文单词', () => {
    Filter.instance().init(['admin'], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('administrator'), 'administrator');
    assert.strictEqual(Filter.instance().replace('the admin said'), 'the ***** said');
});

test('词边界模式-数字属于词字符', () => {
    Filter.instance().init(['admin'], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('admin123'), 'admin123');
});

test('词边界模式-中文与符号边界不受影响', () => {
    Filter.instance().init(['admin'], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('关于admin的讨论'), '关于*****的讨论');
    Filter.instance().init(['AB'], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('A-B'), '**');
    assert.strictEqual(Filter.instance().replace('XAB'), 'XAB');
    assert.strictEqual(Filter.instance().replace('ABY'), 'ABY');
});

test('词边界模式-中文关键词行为不变', () => {
    Filter.instance().init(['治国'], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('治A国'), '**');
});

test('clearCache 重置词边界配置', () => {
    Filter.instance().init(['admin'], { wordBoundary: true });
    Filter.instance().clearCache();
    Filter.instance().init(['admin']);
    assert.strictEqual(Filter.instance().replace('administrator'), '*****istrator');
});

// ===== 关键词 lenient 标注 =====

test('lenient 标注-纯 ASCII 关键词允许字母/数字填充', () => {
    Filter.instance().init([{ word: 'drug', lenient: true }]);
    assert.strictEqual(Filter.instance().replace('d1rug'), '****');
    assert.strictEqual(Filter.instance().replace('dr1ug'), '****');
});

test('lenient 标注-未标注的词保持严格默认', () => {
    Filter.instance().init(['drug']);
    assert.strictEqual(Filter.instance().replace('d1rug'), 'd1rug');
    Filter.instance().init(['AB']);
    assert.strictEqual(Filter.instance().replace('A1B'), 'A1B');
});

test('lenient 标注-按词生效不影响其他词', () => {
    Filter.instance().init(['admin', { word: 'drug', lenient: true }]);
    assert.strictEqual(Filter.instance().replace('d1rug admin administrator'), '**** ***** *****istrator');
});

test('lenient 标注-与 wordBoundary 叠加', () => {
    Filter.instance().init([{ word: 'drug', lenient: true }], { wordBoundary: true });
    assert.strictEqual(Filter.instance().replace('d1rug'), '****');
    assert.strictEqual(Filter.instance().replace('xd1rugy'), 'xd1rugy');
});

// ===== 运行器 =====

let passCount = 0;
const failures: string[] = [];

for (const c of testCases) {
    try {
        c.fn();
        passCount++;
    } catch (e) {
        failures.push(`${c.name}: ${(e as Error).message}`);
    }
}

console.log('========== 单元测试报告 ==========');
console.log(`总用例数: ${testCases.length}`);
console.log(`✅ 通过: ${passCount}`);
console.log(`❌ 失败: ${failures.length}`);
console.log(`通过率: ${((passCount / testCases.length) * 100).toFixed(2)}%`);

if (failures.length > 0) {
    console.log('\n========== 失败详情 ==========');
    for (const f of failures) {
        console.log(`- ${f}`);
    }
    process.exit(1);
}
