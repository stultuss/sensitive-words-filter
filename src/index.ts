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
     * 单例初始化
     *
     * @param {string[]} keywords
     * @private
     */
    public async init(keywords: string[]): Promise<void> {
        try {
            this._preloadSkipCache();  // 初始化时预加载所有特殊字符
            this._initTextFilterMap(keywords);
            this._initialized = true;
        } catch (e) {
            console.error('WordFilter initialization failed:', e);
            throw e;
        }
    }

    /**
     * 检查字符是否应该被跳过（符号、数字、英文、CJK偏旁部首）
     *
     * 优化：所有可能的特殊字符都在初始化时预加载到缓存中
     * 运行时只需要进行 O(1) 的缓存查询，无任何额外判断
     * @private
     */
    private _isSkip(char: string): boolean {
        // 直接缓存查询，100% 命中率，O(1) 时间复杂度
        return this._isSkipCache.get(char) ?? false;
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

            while (j < searchValue.length) {
                const char = searchValue[j].toLowerCase();
                if (node.children[char]) {
                    node = node.children[char];
                    charCount++;
                    matchEnd = j + 1;
                    j++;

                    if (node.isEnd) {
                        // 保存 charCount，避免后续重算
                        replacements.push({start: i, end: matchEnd, charCount});
                    }
                } else if (charCount > 0 && this._isSkip(char)) {
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
                if (!keyword) continue;
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
}

export default WordFilter;