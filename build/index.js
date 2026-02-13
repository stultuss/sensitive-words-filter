"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordFilter = void 0;
class WordNode {
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
class WordFilter {
    constructor() {
        this._isSkipCache = new Map();
        this._initialized = false;
        this._filterTextMap = new WordNode();
    }
    static instance() {
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
    _preloadSkipCache() {
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
            const lower = String.fromCharCode(97 + i); // a-z
            const upper = String.fromCharCode(65 + i); // A-Z
            this._isSkipCache.set(lower, true);
            this._isSkipCache.set(upper, true);
        }
        // 5. 预加载常见的空格和控制字符
        this._isSkipCache.set(' ', true); // 空格
        this._isSkipCache.set('\t', true); // 制表符
        this._isSkipCache.set('\n', true); // 换行
        this._isSkipCache.set('\r', true); // 回车
    }
    /**
     * 单例初始化
     *
     * @param {string[]} keywords
     * @private
     */
    init(keywords) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._preloadSkipCache(); // 初始化时预加载所有特殊字符
                this._initTextFilterMap(keywords);
                this._initialized = true;
            }
            catch (e) {
                console.error('WordFilter initialization failed:', e);
                throw e;
            }
        });
    }
    /**
     * 检查字符是否应该被跳过（符号、数字、英文、CJK偏旁部首）
     *
     * 优化：所有可能的特殊字符都在初始化时预加载到缓存中
     * 运行时只需要进行 O(1) 的缓存查询，无任何额外判断
     * @private
     */
    _isSkip(char) {
        var _a;
        // 直接缓存查询，100% 命中率，O(1) 时间复杂度
        return (_a = this._isSkipCache.get(char)) !== null && _a !== void 0 ? _a : false;
    }
    /**
     * 优化版本的 replace 方法
     * 优化点：
     * 1. replacements 中保存 charCount，避免第二步重新计算
     * 2. _isSkip 使用缓存，避免重复正则判断
     */
    replace(searchValue, replaceValue = '*') {
        if (!this._initialized) {
            return searchValue;
        }
        const replacements = [];
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
                        // 检查是否已经有从相同起始位置的匹配
                        const existingIndex = replacements.findIndex(r => r.start === i);
                        if (existingIndex !== -1) {
                            // 如果新匹配更长，才替换；否则保持现状
                            if (charCount > replacements[existingIndex].charCount) {
                                replacements[existingIndex] = { start: i, end: matchEnd, charCount };
                            }
                        }
                        else {
                            // 没有重复，直接添加
                            replacements.push({ start: i, end: matchEnd, charCount });
                        }
                    }
                }
                else if (charCount > 0 && this._isSkip(char)) {
                    // _isSkip 使用缓存
                    matchEnd = j + 1;
                    j++;
                }
                else {
                    break;
                }
            }
        }
        // 第二步：从后向前进行替换
        let result = searchValue;
        for (let k = replacements.length - 1; k >= 0; k--) {
            const { start, end, charCount } = replacements[k];
            // 直接使用保存的 charCount，不需要重新计算
            const replacement = replaceValue.repeat(charCount);
            result = result.slice(0, start) + replacement + result.slice(end);
        }
        return result;
    }
    _initTextFilterMap(keywords) {
        if (keywords) {
            for (const keyword of keywords) {
                if (!keyword)
                    continue;
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
exports.WordFilter = WordFilter;
exports.default = WordFilter;
