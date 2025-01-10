class WordNode {
    children: { [char: string]: WordNode };
    isEnd: boolean;

    constructor() {
        this.children = {};
        this.isEnd = false;
    }
}

export class WordFilter {
    private static _instance: WordFilter;
    private _initialized: boolean;
    private readonly _filterTextMap: WordNode;

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
     * 初始化时，将敏感词丢进来，并解析成 MAP
     *
     * @param {string[]} keywords
     */
    public init(keywords: string[]) {
        this._initTextFilterMap(keywords);
        this._initialized = true;
    }

    /**
     * 初始化过滤词词库
     *
     * @param {string[]} keywords
     * @private
     */
    private _initTextFilterMap(keywords: string[]) {
        if (keywords) {
            for (const keyword of keywords) {
                if (!keyword) continue;
                let node = this._filterTextMap;
                for (const char of keyword) {
                    if (!node.children[char]) {
                        node.children[char] = new WordNode();
                    }
                    node = node.children[char];
                }
                node.isEnd = true;
            }
        }
    }

    /**
     * 敏感词过滤
     */
    public replace(
        searchValue: string,
        replaceValue: string = '*',
        filterStr: string
    ): string {
        let result = searchValue;
        for (let i = 0; i < searchValue.length; i++) {
            if (searchValue[i] === replaceValue) {
                continue;
            }
            let node = this._filterTextMap;
            let matchLength = 0;
            for (let j = i; j < searchValue.length; j++) {
                const char = searchValue[j];
                if (!node.children[char]) {
                    // Fixme 可以修改为正则，以及可以通过外部传入额外的特殊字符过滤
                    if (matchLength > 0
                        && `${filterStr} ~!@#$%^&*()_+-={}[];':",.<>?|/～！@#¥%……&*（）——+-=【】「」；'："《》，。？/`.includes(char)
                    ) {
                        matchLength++;
                        continue;
                    }
                    break;
                }
                node = node.children[char];
                matchLength++;
                if (node.isEnd) {
                    const replacement = replaceValue.repeat(matchLength);
                    result = result.slice(0, i) + replacement + result.slice(i + matchLength);
                    i += matchLength - 1;
                    break;
                }
            }
        }
        return result;
    }
}

export default WordFilter;