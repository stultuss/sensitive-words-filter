// 基准测试：npm run bench
// 测量 replace() 在中文/英文/混合/病态输入下的吞吐，结果会因机器而异。
const WordFilter = require('../build/index').default;

const filter = new WordFilter();
const keywords = ['中国', '赌博', '诈骗', '敏感词', '违禁', 'admin', 'password', 'drug', 'exploit', 'test', 'text'];
filter.init(keywords);

const CJK_SENTENCE = '这是一个测试句子，包含中国、赌博和诈骗等敏感词，用来模拟中文场景的过滤负载。';
const EN_SENTENCE = 'This is a normal english sentence with admin and password and some test text inside it.';
const MIXED_SENTENCE = '这是混合内容 admin 和 赌博 以及 password 与 test 的文本，中英文交错出现。';

function buildInput(sentence, targetBytes) {
    return sentence.repeat(Math.ceil(targetBytes / sentence.length));
}

function bench(name, input) {
    filter.replace(input.slice(0, 10000)); // 预热
    const t0 = process.hrtime.bigint();
    const out = filter.replace(input);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const kb = input.length / 1024;
    const mbPerSec = (kb / 1024) / (ms / 1000);
    if (out.includes('赌博') || out.includes('admin') || out.includes('password')) {
        throw new Error(`${name}: 输出中仍有未掩码的敏感词`);
    }
    console.log(`${name.padEnd(6)} ${kb.toFixed(0).padStart(6)} KB ${ms.toFixed(1).padStart(8)} ms ${mbPerSec.toFixed(2).padStart(8)} MB/s`);
}

console.log(`词库 ${keywords.length} 个关键词，输入约 1MB\n`);
bench('中文', buildInput(CJK_SENTENCE, 1024 * 1024));
bench('英文', buildInput(EN_SENTENCE, 1024 * 1024));
bench('混合', buildInput(MIXED_SENTENCE, 1024 * 1024));

// 病态输入：超长关键词 + 重复文本（最坏情况：每起点都要走完整条关键词路径）
const longKeyword = 'a'.repeat(500);
const pathological = new WordFilter();
pathological.init([longKeyword]);
const pathoInput = 'a'.repeat(20000);
const t0 = process.hrtime.bigint();
const pathoOut = pathological.replace(pathoInput);
const pathoMs = Number(process.hrtime.bigint() - t0) / 1e6;
if (pathoOut !== '*'.repeat(20000)) {
    throw new Error('病态输入输出不正确');
}
console.log(`\n病态(500字符关键词 x 20KB 重复文本) ${pathoMs.toFixed(1)} ms`);
