import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/catalog-state.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { catalogView } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const items = [
  { id: 1, title: 'The Boys', genres: ['Drama', 'Action'], year: '2019', rating: 8.4 },
  { id: 2, title: 'Human Vapor', genres: ['Drama', 'Mystery'], year: '2026', rating: 7.4 },
  { id: 3, title: 'Alpha', genres: ['Comedy'], year: '2025', rating: 9 },
];

test('search is case-insensitive and combines with genre', () => {
  assert.deepEqual(catalogView(items, { query: '  THE BOYS ', genre: 'drama' }).data.map((item) => item.id), [1]);
  assert.equal(catalogView(items, { query: 'The Boys', genre: 'Comedy' }).total, 0);
});
test('empty results have a valid first page', () => {
  assert.deepEqual(catalogView(items, { query: 'nonexistent', page: 9 }), { data: [], total: 0, currentPage: 1, lastPage: 1 });
});
test('sort covers the complete catalog without changing source order', () => {
  assert.deepEqual(catalogView(items, { sort: 'title' }).data.map((item) => item.id), [3, 2, 1]);
  assert.deepEqual(catalogView(items, { sort: 'year' }).data.map((item) => item.id), [2, 3, 1]);
  assert.deepEqual(catalogView(items, { sort: 'rating' }).data.map((item) => item.id), [3, 1, 2]);
  assert.deepEqual(items.map((item) => item.id), [1, 2, 3]);
});
test('pagination replaces rather than appends and clamps invalid pages', () => {
  const first = catalogView(items, { pageSize: 2 });
  const last = catalogView(items, { pageSize: 2, page: 99 });
  assert.deepEqual(first.data.map((item) => item.id), [1, 2]);
  assert.deepEqual(last.data.map((item) => item.id), [3]);
  assert.equal(last.currentPage, 2);
  assert.equal(catalogView(items, { page: -2 }).currentPage, 1);
});
