import test from 'node:test';
import assert from 'node:assert/strict';
import { indexBookmarks, barRoots, findEntries, openBookmark } from '../bookmarks.js';

const tree = [{ id: '0', children: [
  { id: '1', parentId: '0', title: 'Bookmarks bar', children: [
    { id: '10', parentId: '1', title: 'Work', children: [
      { id: '11', parentId: '10', title: 'API reference', url: 'https://example.com/docs' },
      { id: '12', parentId: '10', title: 'Empty folder', children: [] }
    ] },
    { id: '13', parentId: '1', title: 'News', url: 'https://news.example.com' }
  ] },
  { id: '2', parentId: '0', title: 'Other bookmarks', children: [
    { id: '20', parentId: '2', title: 'Recipes', url: 'https://food.example.com' }
  ] }
] }];
const entries = indexBookmarks(tree);
const find = (query = '', mode = 'bar', folderId = null) => findEntries(entries, { query, mode, folderId }).map(e => e.id);

test('bar starts with direct children in Chrome order', () => {
  assert.deepEqual(find(), ['10', '13']);
});
test('search descends into folders and matches title, URL, and folder path', () => {
  assert.deepEqual(find('WORK api'), ['11']);
  assert.deepEqual(find('example.com/docs'), ['11']);
  assert.deepEqual(find('empty'), ['12']);
  assert.deepEqual(find('   '), ['10', '13']);
});
test('all bookmarks includes folders and bookmarks outside the bar', () => {
  assert.deepEqual(find('recipes'), []);
  assert.deepEqual(find('recipes', 'all'), ['20']);
  assert.ok(find('', 'all').includes('10'));
});
test('folder navigation and search stay inside selected folder', () => {
  assert.deepEqual(find('', 'bar', '10'), ['11', '12']);
  assert.deepEqual(find('news', 'all', '10'), []);
  assert.deepEqual(find('', 'bar', '12'), []);
});
test('multiple localized bookmarks bars are supported by folder type', () => {
  const indexed = indexBookmarks([{ id: '0', children: [
    { id: '40', parentId: '0', folderType: 'bookmarks-bar', title: 'Favoritenleiste', children: [{ id: '41', parentId: '40', title: 'A', url: 'https://a.test' }] },
    { id: '50', parentId: '0', folderType: 'bookmarks-bar', title: 'Account bar', children: [{ id: '51', parentId: '50', title: 'B', url: 'https://b.test' }] }
  ] }]);
  assert.deepEqual(barRoots(indexed).map(e => e.id), ['40', '50']);
  assert.deepEqual(findEntries(indexed, { mode: 'bar', query: '' }).map(e => e.id), ['41', '51']);
});
test('empty tree and no matches return an empty list', () => {
  assert.deepEqual(find('does not exist'), []);
  assert.deepEqual(findEntries([], { mode: 'bar', query: '' }), []);
});
test('opening a bookmark updates the original active tab', async () => {
  const calls = [];
  await openBookmark('https://example.com/docs', 42, { update: async (...args) => calls.push(args) });
  assert.deepEqual(calls, [[42, { url: 'https://example.com/docs' }]]);
});
test('navigation errors propagate and bookmarklets do not execute', async () => {
  const tabs = { update: async () => { throw new Error('Tab was closed'); } };
  await assert.rejects(openBookmark('https://example.com', 42, tabs), /Tab was closed/);
  await assert.rejects(openBookmark('javascript:alert(1)', 42, tabs), /Bookmarklets/);
  await assert.rejects(openBookmark('https://example.com', undefined, tabs), /No active tab/);
});
