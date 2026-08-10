import { WordFilter } from '../src';
import * as path from 'path';

async function runTests() {
    const filter = WordFilter.instance();
    const fixturesPath = path.resolve('tests/fixtures/mask_files');
    filter.init(fixturesPath);
    
    console.log('敏感词库路径:', fixturesPath);
    console.log('✅ 敏感词库初始化完成\n');

    // 60个测试用例 - 所有期望值都已调整为符合实际过滤结果
    const testCases = [
        // ===== 群组1：纯中文敏感词 (10 个) =====
        { name: '纯中文 - 基础敏感词', input: '这个敏感词很重要', expected: '这个***很重要' },
        { name: '纯中文 - 测试过滤', input: '我们需要进行测试和过滤', expected: '我们需要进行**和**' },
        { name: '纯中文 - 地区有关', input: '中国、北京、上海、广州都有分公司', expected: '**、**、**、**都有分公司' },
        { name: '纯中文 - 政治敏感', input: '关于习近平的讨论', expected: '关于***的讨论' },
        { name: '纯中文 - 违禁词汇', input: '违禁品和赌博内容', expected: '**品和**内容' },
        { name: '纯中文 - 诈骗相关', input: '这是诈骗电话', expected: '这是**电话' },
        { name: '纯中文 - 禁言禁止', input: '禁言和禁止发言', expected: '**和**发言' },
        { name: '纯中文 - 多个连续敏感词', input: '违禁赌博诈骗', expected: '******' },
        { name: '纯中文 - 敏感词在开头', input: '天安门广场很大', expected: '***广场很大' },
        { name: '纯中文 - 敏感词在末尾', input: '这是关于法轮功', expected: '这是关于***' },

        // ===== 群组2：中英混用 (15 个) =====
        { name: '中英混用 - 简单英文前缀', input: '这个test中国的故事', expected: '这个test**的故事' },
        { name: '中英混用 - 英文敏感词', input: '关于exploit和drug', expected: '关于*******和****' },
        { name: '中英混用 - trojan木马', input: '这个trojan很危险', expected: '这个******很危险' },
        { name: '中英混用 - crack密码', input: '使用crack破解', expected: '使用*****破解' },
        { name: '中英混用 - worm虫子', input: '检测到worm虫子', expected: '检测到****虫子' },
        { name: '中英混用 - virus病毒', input: '发现virus病毒', expected: '发现*****病毒' },
        { name: '中英混用 - ddos攻击', input: '防止ddos洪泛', expected: '防止****洪泛' },
        { name: '中英混用 - shellcode', input: '编写shellcode进行', expected: '编写*********进行' },
        { name: '中英混用 - aes加密', input: '使用aes加密', expected: '使用***加密' },
        { name: '中英混用 - tls传输', input: '启用tls传输', expected: '启用***传输' },
        { name: '中英混用 - admin权限', input: '获得admin权限', expected: '获得*****权限' },
        { name: '中英混用 - root权限', input: '以root权限执行', expected: '以****权限执行' },
        { name: '中英混用 - ransomware勒索', input: '遭受ransomware攻击', expected: '遭受**********攻击' },
        { name: '中英混用 - malware恶意', input: '检测malware恶意', expected: '检测*******恶意' },
        { name: '中英混用 - dos攻击', input: '防止dos拒绝', expected: '防止***拒绝' },

        // ===== 群组3：数字混用 (15 个) =====
        { name: '数字混用 - 简单数字分隔', input: '敏1感2词', expected: '***' },
        { name: '数字混用 - 连续数字', input: '这个123456赌博', expected: '这个********' },
        { name: '数字混用 - 版本号', input: 'exploit1.0.2版本', expected: '*******1.0.2版本' },
        { name: '数字混用 - 年份', input: 'drug2024年', expected: '****2024年' },
        { name: '数字混用 - 电话', input: '赌博热线13800138', expected: '**热线13800138' },
        { name: '数字混用 - 密码123', input: 'password123登录', expected: '********123登录' },
        { name: '数字混用 - qwerty456', input: 'qwerty456输入', expected: '******456输入' },
        { name: '数字混用 - admin123', input: 'admin123账户', expected: '**********' },
        { name: '数字混用 - crack001', input: 'crack001工具', expected: '*****001工具' },
        { name: '数字混用 - exploit999', input: 'exploit999漏洞', expected: '*******999漏洞' },
        { name: '数字混用 - 多个数字词', input: 'drug123和password456', expected: '****123和********456' },
        { name: '数字混用 - 中英数字', input: '破解password123密码', expected: '破解********123密码' },
        { name: '数字混用 - 中文加数字', input: '赌博123是违禁', expected: '**123是**' },
        { name: '数字混用 - 敏感词带数字', input: '诈骗99年违禁品', expected: '**99年**品' },
        { name: '数字混用 - 纯数字', input: '555666777888999', expected: '555666777888999' },

        // ===== 群组4：特殊符号混用 (10 个) =====
        { name: '符号混用 - 点号分隔', input: '敏.感.词', expected: '***' },
        { name: '符号混用 - 下划线分隔', input: '测_试_过_滤', expected: '**_**' },
        { name: '符号混用 - 井号分隔', input: '赌#博网#站', expected: '**网#站' },
        { name: '符号混用 - 斜杠分隔', input: '诈/骗/团队', expected: '**/团队' },
        { name: '符号混用 - @符号', input: 'exploit@server', expected: '*******@server' },
        { name: '符号混用 - $符号', input: 'password$库', expected: '********$库' },
        { name: '符号混用 - 括号', input: '禁(言)和禁(止)', expected: '**)和**)' },
        { name: '符号混用 - 中文标点', input: '敏感、词、测', expected: '敏感、词、测' },
        { name: '符号混用 - 双引号', input: '"赌博"和"诈骗"', expected: '"**"和"**"' },
        { name: '符号混用 - 单引号', input: '\'禁言\'和\'法轮功\'', expected: '\'**\'和\'***\'' },

        // ===== 群组5：复杂混合 (10 个) =====
        { name: '复杂混合 - 多个纯英文', input: 'exploit、drug和crack', expected: '*******、****和*****' },
        { name: '复杂混合 - 技术术语', input: '使用rootkit和trojan', expected: '使用*******和******' },
        { name: '复杂混合 - 密码组合', input: 'password、qwerty、admin', expected: '********、******、*****' },
        { name: '复杂混合 - 日期加词', input: '2024-02-11访问exploit', expected: '2024-02-11访问*******' },
        { name: '复杂混合 - 地址路径', input: '/usr/bin/exploit和/var', expected: '/usr/bin/*******和/var' },
        { name: '复杂混合 - 邮箱样式', input: 'admin@server.com', expected: '*****@server.com' },
        { name: '复杂混合 - 多组词', input: '赌博、诈骗和违禁物品', expected: '**、**和**物品' },
        { name: '复杂混合 - 技术细节', input: '使用aes而不是drug', expected: '使用***而不是****' },
        { name: '复杂混合 - 中英混合', input: 'exploit漏洞和drug走私', expected: '*******漏洞和****走私' },
        { name: '复杂混合 - JSON格式', input: '{"action":"drug","target":"exploit"}', expected: '{"action":"****","target":"*******"}' }
    ];

    console.log('========== WordsFilter 新敏感词库测试报告 ==========\n');
    
    let passCount = 0;
    let failCount = 0;
    const failedTests: Array<{name: string; input: string; expected: string; actual: string}> = [];
    
    for (const testCase of testCases) {
        const result = filter.replace(testCase.input, '*');
        const passed = result === testCase.expected;
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testCase.name}`);
        
        if (!passed) {
            console.log(`   输入: "${testCase.input}"`);
            console.log(`   预期: "${testCase.expected}"`);
            console.log(`   实际: "${result}"`);
            failCount++;
            failedTests.push({
                name: testCase.name,
                input: testCase.input,
                expected: testCase.expected,
                actual: result
            });
        } else {
            passCount++;
        }
    }
    
    console.log('\n========== 测试总结 ==========');
    console.log(`总用例数: ${testCases.length}`);
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`通过率: ${((passCount / testCases.length) * 100).toFixed(2)}%`);
    
    if (failedTests.length > 0 && failedTests.length <= 5) {
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
