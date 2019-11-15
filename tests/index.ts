import Filter from '../src/index';

test('WordFilter::instance', () => {
  Filter.instance();
  expect((Filter.instance() as any)._initialized).toBe(false);
  expect((Filter.instance() as any)._filterTextMap).toStrictEqual({});
});

test('WordFilter::init', () => {
  Filter.instance().init(['text']);
  expect((Filter.instance() as any)._initialized).toBe(true);
  expect((Filter.instance() as any)._filterTextMap).toStrictEqual({t: {e: {x: {t: {isEnd: true}}}}});
});

test('WordFilter::replace', () => {
  Filter.instance().init(['text']);
  expect(Filter.instance().replace('This is text word!')).toBe('This is **** word!');
});