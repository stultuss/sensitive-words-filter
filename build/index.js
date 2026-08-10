"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordFilter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WordNode {
    constructor() {
        this.children = {};
        this.isEnd = false;
    }
}
const SYMBOL_STRING = new Set('\`·~!@#$%^&*()_+-={}[];\':",.< >?|/～！@#¥%……&*（）——+-=【】「」；\'："《》，。？/ '.split(''));
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
    _preloadSkipCache() {
        SYMBOL_STRING.forEach(char => {
            this._isSkipCache.set(char, true);
        });
        CJK_RADICALS.forEach(char => {
            this._isSkipCache.set(char, true);
        });
        for (let i = 0; i < 10; i++) {
            this._isSkipCache.set(String(i), true);
        }
        for (let i = 0; i < 26; i++) {
            const lower = String.fromCharCode(97 + i);
            const upper = String.fromCharCode(65 + i);
            this._isSkipCache.set(lower, true);
            this._isSkipCache.set(upper, true);
        }
        this._isSkipCache.set(' ', true);
        this._isSkipCache.set('\t', true);
        this._isSkipCache.set('\n', true);
        this._isSkipCache.set('\r', true);
    }
    init(keywords) {
        try {
            this._isSkipCache.clear();
            this._filterTextMap.children = {};
            this._filterTextMap.isEnd = false;
            this._preloadSkipCache();
            this._initTextFilterMap(typeof keywords === 'string' ? this._loadKeywordsFromFile(keywords) : keywords);
            this._initialized = true;
        }
        catch (e) {
            console.error('WordFilter initialization failed:', e);
            throw e;
        }
    }
    _loadKeywordsFromFile(filePath) {
        const keywords = [];
        if (fs.statSync(filePath).isDirectory()) {
            for (const name of fs.readdirSync(filePath)) {
                const fullPath = path.join(filePath, name);
                keywords.push(...this._loadKeywordsFromFile(fullPath));
            }
        }
        else if (fs.statSync(filePath).isFile()) {
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
    _isSkip(char, allowAlphaNumeric) {
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
                        const existingIndex = replacements.findIndex(r => r.start === i);
                        if (existingIndex !== -1) {
                            if (charCount > replacements[existingIndex].charCount) {
                                replacements[existingIndex] = { start: i, end: matchEnd, charCount };
                            }
                        }
                        else {
                            replacements.push({ start: i, end: matchEnd, charCount });
                        }
                    }
                }
                else if (charCount > 0 && this._isSkip(char, hasNonAscii)) {
                    matchEnd = j + 1;
                    j++;
                }
                else {
                    break;
                }
            }
        }
        let result = searchValue;
        for (let k = replacements.length - 1; k >= 0; k--) {
            const { start, end, charCount } = replacements[k];
            const replacement = replaceValue.repeat(charCount);
            result = result.slice(0, start) + replacement + result.slice(end);
        }
        return result;
    }
    _initTextFilterMap(keywords) {
        if (keywords) {
            for (const keyword of keywords) {
                if (!keyword || (keyword.length == 1 && keyword.charCodeAt(0) <= 127))
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
    getCacheStats() {
        return {
            size: this._isSkipCache.size,
            entries: Array.from(this._isSkipCache.keys())
        };
    }
    clearCache() {
        this._isSkipCache.clear();
        this._filterTextMap.children = {};
        this._filterTextMap.isEnd = false;
        this._initialized = false;
    }
}
exports.WordFilter = WordFilter;
exports.default = WordFilter;
