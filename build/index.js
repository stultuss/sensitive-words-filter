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
const SYMBOL_STRING = new Set('\`·~!@#$%^&*()_+-={}[];\':",.< >?|/～！@#¥%……&*（）——+-=【】「」；\'："《》，。？/、　…・ '.split(''));
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
        for (let i = 0; i < 10; i++) {
            this._isSkipCache.set(String.fromCharCode(0xFF10 + i), true);
        }
        for (let i = 0; i < 26; i++) {
            this._isSkipCache.set(String.fromCharCode(0xFF21 + i), true);
            this._isSkipCache.set(String.fromCharCode(0xFF41 + i), true);
        }
        this._isSkipCache.set(' ', true);
        this._isSkipCache.set('\t', true);
        this._isSkipCache.set('\n', true);
        this._isSkipCache.set('\r', true);
    }
    init(keywords) {
        this._isSkipCache.clear();
        this._filterTextMap.children = {};
        this._filterTextMap.isEnd = false;
        this._preloadSkipCache();
        this._initTextFilterMap(typeof keywords === 'string' ? this._loadKeywordsFromFile(keywords) : keywords);
        this._initialized = true;
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
        const n = searchValue.length;
        const diff = new Int32Array(n + 1);
        const starAt = new Uint8Array(n);
        const keywordPositions = [];
        for (let i = 0; i < n; i++) {
            let node = this._filterTextMap;
            let charCount = 0;
            let j = i;
            let bestCharCount = 0;
            let bestEnd = -1;
            let hasNonAscii = false;
            keywordPositions.length = 0;
            while (j < n) {
                const char = searchValue[j].toLowerCase();
                const next = node.children[char];
                if (next) {
                    node = next;
                    if (char.charCodeAt(0) > 127) {
                        hasNonAscii = true;
                    }
                    charCount++;
                    keywordPositions.push(j);
                    j++;
                    if (node.isEnd) {
                        bestCharCount = charCount;
                        bestEnd = j;
                    }
                }
                else if (charCount > 0 && this._isSkip(char, hasNonAscii)) {
                    j++;
                }
                else {
                    break;
                }
            }
            if (bestEnd !== -1) {
                diff[i] += 1;
                diff[bestEnd] -= 1;
                for (let k = 0; k < bestCharCount; k++) {
                    starAt[keywordPositions[k]] = 1;
                }
            }
        }
        let result = '';
        let depth = 0;
        let segStars = 0;
        let inSegment = false;
        for (let i = 0; i < n; i++) {
            depth += diff[i];
            if (depth > 0) {
                inSegment = true;
                if (starAt[i]) {
                    segStars++;
                }
            }
            else {
                if (inSegment) {
                    result += replaceValue.repeat(segStars);
                    segStars = 0;
                    inSegment = false;
                }
                result += searchValue[i];
            }
        }
        if (inSegment) {
            result += replaceValue.repeat(segStars);
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
