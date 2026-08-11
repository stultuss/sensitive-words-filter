export declare class WordFilter {
    private static _instance;
    private _initialized;
    private readonly _filterTextMap;
    private readonly _isSkipCache;
    private _wordBoundary;
    constructor();
    static instance(): WordFilter;
    private _preloadSkipCache;
    init(keywords: string[] | string, options?: {
        wordBoundary?: boolean;
    }): void;
    private _loadKeywordsFromFile;
    private _isSkip;
    replace(searchValue: string, replaceValue?: string): string;
    private _initTextFilterMap;
    getCacheStats(): {
        size: number;
        entries: string[];
    };
    clearCache(): void;
}
export default WordFilter;
