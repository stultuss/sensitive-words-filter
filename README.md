# sensitive-words-filter

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![CI][ci-image]][ci-url]

A fast, DFA-based sensitive-word filter for Node.js. It scans text against a keyword dictionary and masks matches, while also detecting common obfuscation tricks such as inserting spaces, symbols, digits, or letters between the characters of a keyword.

## Features

- **Trie-based DFA engine** — keywords are compiled into a prefix tree for fast matching
- **Obfuscation detection** — matches keywords even when filler characters are inserted between keyword characters
- **Longest-match** — when keywords overlap (e.g. `AB` and `ABC`), the longer match wins
- **Case-insensitive** — keywords and input text are matched case-insensitively
- **Flexible keyword loading** — pass an array, a single file, or a directory of keyword files
- **Singleton or instances** — `WordFilter.instance()` for a shared instance, or `new WordFilter()` for independent dictionaries

## Install

```bash
npm install sensitive-words-dfa-filter --save
```

TypeScript users get full type hints out of the box — the package ships with type declarations.

## Quick start

```javascript
const WordFilter = require('sensitive-words-dfa-filter');

const filter = WordFilter.instance();

// Load keywords from an array (or a file / directory, see below)
filter.init(['AB', 'ABC', '治国']);

// Basic matching
console.log(filter.replace('This is "AB｜A B｜AAB｜A1B｜A@B" filter word!'));
// This is "**｜**｜A**｜A1B｜**" filter word!

console.log(filter.replace('This is "ABC｜A B C｜A1B1C｜A@B@C" filter word!'));
// This is "***｜***｜A1B1C｜***" filter word!

// Custom replacement character
console.log(filter.replace('This is "治国｜治 国｜治A国｜治1国｜治@国" filter word!', '?'));
// This is "??｜??｜??｜??｜??" filter word!
```

## Loading keywords

`init()` accepts either an array of keywords or a path:

| Input | Example | Notes |
|---|---|---|
| Array | `filter.init(['赌博', '诈骗'])` | Simple in-code keyword list |
| File | `filter.init('/path/to/keywords.txt')` | Reads the file; keywords separated by `、` or newlines |
| Directory | `filter.init('/path/to/keywords')` | Reads every file inside the directory, including subdirectories |

Example keyword file:

```text
赌博、诈骗、禁言、敏感词
exploit
drug
```

Empty entries and surrounding whitespace are ignored.

## API

### `WordFilter.instance()`

Returns the shared singleton instance.

### `new WordFilter()`

Creates an independent filter with its own dictionary — useful when different parts of an application need different keyword sets.

### `init(keywords: string[] | string): void`

Synchronously builds the matching dictionary.

- `keywords` — an array of keyword strings, or a path to a keyword file/directory.
- Calling `init()` again **replaces** the existing dictionary.

### `replace(searchValue: string, replaceValue?: string): string`

Scans `searchValue` and replaces every matched keyword with `replaceValue` repeated once per matched keyword character (default `*`).

- Returns `searchValue` unchanged if the filter has not been initialized.

### `getCacheStats(): { size: number; entries: string[] }`

Returns the size of the preloaded "skippable-character" cache and the cached characters (useful for debugging and performance monitoring).

### `clearCache(): void`

Fully resets the filter: clears the preloaded character cache, the keyword dictionary, and the initialization state. Call `init()` again before using the filter.

## Matching rules

- **Case-insensitive**: `Text` matches keyword `text`.
- **Longest match wins**: with keywords `AB` and `ABC`, input `ABC` is masked as `***`.
- **Filler characters can be skipped** between keyword characters:

| Filler type | Skipped by default? | Example |
|---|---|---|
| Symbols (`@`, `#`, `.`, `~`, ...) | Always | `A@B` matches `AB` |
| Spaces / whitespace | Always | `A B` matches `AB` |
| CJK radicals | Always | `中灬国` matches `中国` |
| Full-width spaces / punctuation (`　`, `、`, `…`, ...) | Always | `治　国` matches `治国` |
| Full-width letters / digits (`Ａ-Ｚ`, `ａ-ｚ`, `０-９`) | Always, as fillers (not normalized) | `治Ａ国` matches `治国`; `ＡＢ` does **not** match `AB` |
| Digits (`0-9`) | Only when the matched part already contains non-ASCII characters | `治1国` matches `治国`; `A1B` does **not** match `AB` |
| Letters (`a-z`, `A-Z`) | Only when the matched part already contains non-ASCII characters | `治A国` matches `治国`; `AAB` becomes `A**` |

The non-ASCII rule prevents false positives in pure English text: with keyword `text`, the input `This is text` only masks `text` itself — the leading words are left untouched.

- **English keywords match as plain substrings** — `admin` also matches inside `administrator`, and `sex` inside `sexy`. There is no word-boundary detection; if you need it, add boundary logic to your keywords or input in your own pipeline.
- **Single-character ASCII keywords are ignored** (e.g. `a`) to avoid over-matching; single-character CJK keywords (e.g. `赌`) are supported.
- **Overlapping matches** are merged into a single masked region: with keywords `ABC` and `BCD`, the input `A B C D` is masked as `****`.

## Development

```bash
npm install
npm test        # compile and run all test suites
npm run build   # compile src/index.ts to build/index.js
```

Test suites:

- `tests/WordsFilter.test.ts` — 100 fixture-based integration cases (fails the run on any failure)
- `tests/WordsFilter-New.test.ts` — 60 additional fixture-based cases (fails the run on any failure)
- `tests/unit.test.ts` — 23 focused unit tests with assertions

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/sensitive-words-dfa-filter.svg
[npm-url]: https://npmjs.org/package/sensitive-words-dfa-filter
[downloads-image]: https://img.shields.io/npm/dm/sensitive-words-dfa-filter.svg
[downloads-url]: https://npmjs.org/package/sensitive-words-dfa-filter
[ci-image]: https://github.com/stultuss/sensitive-words-filter/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/stultuss/sensitive-words-filter/actions/workflows/ci.yml
