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
