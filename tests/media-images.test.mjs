import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/media-images.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { resizeTmdbImageSource } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('TMDB original poster URLs can be resized to a card-safe width', () => {
  assert.equal(
    resizeTmdbImageSource('https://image.tmdb.org/t/p/original/poster.jpg', 'w500'),
    'https://image.tmdb.org/t/p/w500/poster.jpg',
  );
});

test('TMDB backdrop URLs can be resized to a mobile hero width', () => {
  assert.equal(
    resizeTmdbImageSource('https://image.tmdb.org/t/p/original/backdrop.jpg', 'w780'),
    'https://image.tmdb.org/t/p/w780/backdrop.jpg',
  );
});

test('TMDB backdrop URLs can be resized to a high-density hero width', () => {
  assert.equal(
    resizeTmdbImageSource('https://image.tmdb.org/t/p/w500/backdrop.jpg', 'w1280'),
    'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
  );
});

test('non-TMDB and unrecognized URL paths are left to the regular media URL handling', () => {
  assert.equal(resizeTmdbImageSource('https://images.example.com/poster.jpg', 'w500'), null);
  assert.equal(resizeTmdbImageSource('https://image.tmdb.org/some/other/path.jpg', 'w500'), null);
});
