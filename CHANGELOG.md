# Changelog

All notable changes to this project are documented in this file.

## [2.1.0] - 2026-08-11

### Added

- `init(keywords, { wordBoundary: true })` — optional word-boundary mode for ASCII keywords (off by default; with it enabled, `admin` no longer matches inside `administrator`)
- Full-width filler characters: ideographic space `　`, enumeration comma `、`, ellipsis `…`, full-width letters `Ａ-Ｚ ａ-ｚ` and digits `０-９`
- Public constructor — `new WordFilter()` creates an independent instance; `WordFilter.instance()` remains the shared singleton
- `benchmark/bench.js` and the `npm run bench` script

### Fixed

- Overlapping matches from different start positions no longer corrupt output length or star counts (keywords `ABC` + `BCD` on `A B C D` now produce `****`)
- Removed the O(n²) `replacements.findIndex` scan; ~1MB inputs now complete in a few hundred milliseconds instead of minutes
- `init()` no longer writes to `console.error` before rethrowing

### Changed

- `、` (U+3001) and `　` (U+3000) are now skippable fillers, so obfuscated forms like `敏、感、词` are detected
- TypeScript `strict` mode enabled; `node_modules/` added to `.gitignore`
- README now states the real matching semantics and measured performance instead of claiming a "DFA"

## [2.0.0] - 2026-08-10

- Reworked engine: synchronous `init`, dictionary-replacement semantics, `clearCache()`
- Trimmed npm package (`files`: `build`, `index.js`), ships type declarations, `engines: node >=18`
- Dropped the Jest/ts-jest dev dependency stack (`npm audit` 0)
- Added GitHub Actions CI (Node 20/22/24 matrix)

## [1.0.1] - 2026-02-13

- Maintenance release.

## [1.0.0] - 2025-01-10

- Modernized package (TypeScript, tests, docs).

## [0.0.x] - 2019-11

- Initial releases.
