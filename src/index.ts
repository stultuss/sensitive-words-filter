export class WordFilter {
    private static _instance: WordFilter;
    private _initialized: boolean;
    private _filterTextMap: any;

    public static instance(): WordFilter {
        if (WordFilter._instance == undefined) {
            WordFilter._instance = new WordFilter();
        }
        return WordFilter._instance;
    }

    private constructor() {
        this._initialized = false;
        this._filterTextMap = {};
    }

    /**
     * 初始化时，将敏感词丢进来，并解析成 MAP
     *
     * @param {string[]} keywords
     */
    public async init(keywords: string[]) {
        await this._initTextFilterMap(keywords);
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
            for (let i = 0; i < keywords.length; i++) {
                if (!keywords[i]) {
                    continue;
                }
                let parent = this._filterTextMap;

                // add word map
                let word = keywords[i];
                for (let i = 0; i < word.length; i++) {
                    if (!parent[word[i]]) parent[word[i]] = {};
                    parent = parent[word[i]];
                }

                parent.isEnd = true;
            }
        }
    }

    /**
     * 敏感词过滤
     */
    public replace(searchValue: string, replaceValue: string = '*'): string {
        let parent = this._filterTextMap;

        for (let i = 0; i < searchValue.length; i++) {
            if (searchValue[i] == replaceValue) {
                continue;
            }

            let found = false;
            let skip = 0;
            let sWord = '';

            for (let j = i; j < searchValue.length; j++) {
                if (!parent[searchValue[j]]) {
                    found = false;
                    skip = j - i - 1;
                    parent = this._filterTextMap;
                    break;
                }
                sWord = sWord + searchValue[j];
                if (parent[searchValue[j]].isEnd) {
                    found = true;
                    skip = j - i;
                    parent = this._filterTextMap;
                    break;
                }
                parent = parent[searchValue[j]];
            }

            if (skip > 1) {
                i += skip - 1;
            }

            if (!found) {
                continue;
            }

            let stars = replaceValue;
            for (let k = 0; k < skip; k++) {
                stars = stars + replaceValue;
            }

            let reg = new RegExp(sWord, 'g');
            searchValue = searchValue.replace(reg, stars);
        }

        return searchValue;
    }
}

export default WordFilter;