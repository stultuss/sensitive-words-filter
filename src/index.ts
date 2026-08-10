import * as fs from 'fs';
import * as path from 'path';

class WordNode {
    children: { [char: string]: WordNode };
    isEnd: boolean;

    constructor() {
        this.children = {};
        this.isEnd = false;
    }
}

/**
 * 字符串转 Set 优化（时间复杂度 O(1)）
 */
const SYMBOL_STRING = new Set('\`·~!@#$%^&*()_+-={}[];\':",.< >?|/～！@#¥%……&*（）——+-=【】「」；\'："《》，。？/ '.split(''));

/**
 * CJK 偏旁部首集合
 */
const CJK_RADICALS = new Set('灬氵辶亠力冂凵刂丶冫艹阝卩工廾丨彐钅冖宀疒爿丿犭饣彡礻扌厶纟亠忄讠衤廴夂丬罒ㄨ乚ㄐ｜ㄥㄣㄟ'.split(''));

export class WordFilter {
    private static _instance: WordFilter;
    private _initialized: boolean;
    private readonly _filterTextMap: WordNode;
    private readonly _isSkipCache = new Map<string, boolean>();

    private constructor() {
        this._initialized = false;
        this._filterTextMap = new WordNode();
    }

    public static instance(): WordFilter {
        if (!WordFilter._instance) {
            WordFilter._instance = new WordFilter();
        }
        return WordFilter._instance;
    }

    /**
     * 在初始化时预加载所有特殊字符到缓存
     * 确保运行时 _isSkip 有 100% 的缓存命中率
     * @private
     */
    private _preloadSkipCache(): void {
        // 1. 预加载所有符号
        SYMBOL_STRING.forEach(char => {
            this._isSkipCache.set(char, true);
        });

        // 2. 预加载所有 CJK 偏旁部首
        CJK_RADICALS.forEach(char => {
            this._isSkipCache.set(char, true);
        });

        // 3. 预加载所有数字 0-9
        for (let i = 0; i < 10; i++) {
            this._isSkipCache.set(String(i), true);
        }

        // 4. 预加载所有英文字母（大小写）
        for (let i = 0; i < 26; i++) {
            const lower = String.fromCharCode(97 + i);  // a-z
            const upper = String.fromCharCode(65 + i);  // A-Z
            this._isSkipCache.set(lower, true);
            this._isSkipCache.set(upper, true);
        }

        // 5. 预加载常见的空格和控制字符
        this._isSkipCache.set(' ', true);   // 空格
        this._isSkipCache.set('\t', true);  // 制表符
        this._isSkipCache.set('\n', true);  // 换行
        this._isSkipCache.set('\r', true);  // 回车
    }

    /**
     * 初始化敏感词库（重复调用会替换旧词库，而不是累积）
     *
     * @param {string[] | string} keywords 敏感词数组，或词库文件/目录路径
     * @private
     */
    public init(keywords: string[] | string): void {
        try {
            this._isSkipCache.clear();
            this._filterTextMap.children = {};
            this._filterTextMap.isEnd = false;
            this._preloadSkipCache();  // 初始化时预加载所有特殊字符
            this._initTextFilterMap(typeof keywords === 'string' ? this._loadKeywordsFromFile(keywords) : keywords);
            this._initialized = true;
        } catch (e) {
            console.error('WordFilter initialization failed:', e);
            throw e;
        }
    }

    /**
     * 从敏感词文件/目录加载词库（支持 、 或换行分隔；传目录时递归读取其中所有文件）
     * @private
     */
    private _loadKeywordsFromFile(filePath: string): string[] {
        const keywords: string[] = [];
        if (fs.statSync(filePath).isDirectory()) {
            for (const name of fs.readdirSync(filePath)) {
                const fullPath = path.join(filePath, name);
                keywords.push(...this._loadKeywordsFromFile(fullPath));
            }
        } else if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            for (const keyword of content.split(/[、\r\n]+/)) {
                const trimmed = keyword.trim();
                if (trimmed) {
                    keywords.push(trimmed);
                }
            }
        }
        return keywords;
    }


    /**
     * 检查字符是否应该被跳过（符号、数字、英文、CJK偏旁部首）
     *
     * 优化：所有可能的特殊字符都在初始化时预加载到缓存中
     * 运行时只需要进行 O(1) 的缓存查询
     *
     * 防误伤：字母/数字仅在已匹配部分包含非 ASCII 字符（中文等）时才允许跳过，
     * 避免短英文词（如 root/admin）在英文文本中跨词被误命中
     * @private
     */
    private _isSkip(char: string, allowAlphaNumeric: boolean): boolean {
        if (!this._isSkipCache.has(char)) {
            return false;
        }
        if (allowAlphaNumeric) {
            return true;
        }
        const code = char.charCodeAt(0);
        const isAlphaNumeric = (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
        return !isAlphaNumeric;
    }

    /**
     * 优化版本的 replace 方法
     * 优化点：
     * 1. replacements 中保存 charCount，避免第二步重新计算
     * 2. _isSkip 使用缓存，避免重复正则判断
     */
    public replace(searchValue: string, replaceValue: string = '*'): string {
        if (!this._initialized) {
            return searchValue;
        }

        // 优化后的结构：包含 charCount
        interface Replacement {
            start: number;
            end: number;
            charCount: number;  // ← 新增字段
        }

        const replacements: Replacement[] = [];

        for (let i = 0; i < searchValue.length; i++) {
            let node = this._filterTextMap;
            let charCount = 0;
            let j = i;
            let matchEnd = i;
            let hasNonAscii = false;

            while (j < searchValue.length) {
                const char = searchValue[j].toLowerCase();

                if (node.children[char]) {
                    node = node.children[char];
                    if (char.charCodeAt(0) > 127) {
                        hasNonAscii = true;
                    }
                    charCount++;
                    matchEnd = j + 1;
                    j++;

                    if (node.isEnd) {
                        // 检查是否已经有从相同起始位置的匹配
                        const existingIndex = replacements.findIndex(r => r.start === i);
                        if (existingIndex !== -1) {
                            // 如果新匹配更长，才替换；否则保持现状
                            if (charCount > replacements[existingIndex].charCount) {
                                replacements[existingIndex] = { start: i, end: matchEnd, charCount };
                            }
                        } else {
                            // 没有重复，直接添加
                            replacements.push({ start: i, end: matchEnd, charCount });
                        }
                    }
                } else if (charCount > 0 && this._isSkip(char, hasNonAscii)) {
                    // _isSkip 使用缓存
                    matchEnd = j + 1;
                    j++;
                } else {
                    break;
                }
            }
        }

        // 第二步：从后向前进行替换
        let result = searchValue;
        for (let k = replacements.length - 1; k >= 0; k--) {
            const {start, end, charCount} = replacements[k];

            // 直接使用保存的 charCount，不需要重新计算
            const replacement = replaceValue.repeat(charCount);
            result = result.slice(0, start) + replacement + result.slice(end);
        }

        return result;
    }

    private _initTextFilterMap(keywords: string[]) {
        if (keywords) {
            for (const keyword of keywords) {
                // 忽略 ASCII 单字关键字（如 "a"），避免过度匹配；中文等非 ASCII 单字保留（如"赌"）
                if (!keyword || (keyword.length == 1 && keyword.charCodeAt(0) <= 127)) continue;
                let node = this._filterTextMap;
                for (const char of keyword) {
                    const lcChar = char.toLowerCase();
                    if (!node.children[lcChar]) {
                        node.children[lcChar] = new WordNode();
                    }
                    node = node.children[lcChar];
                }
                node.isEnd = true;
            }
        }
    }

    /**
     * 获取缓存统计信息（用于性能监控）
     */
    public getCacheStats(): { size: number; entries: string[] } {
        return {
            size: this._isSkipCache.size,
            entries: Array.from(this._isSkipCache.keys())
        };
    }

    /**
     * 完整重置过滤器：清空跳过缓存、词库和初始化状态
     * 调用后需重新 init 才能继续使用
     */
    public clearCache(): void {
        this._isSkipCache.clear();
        this._filterTextMap.children = {};
        this._filterTextMap.isEnd = false;
        this._initialized = false;
    }
}

export default WordFilter;
