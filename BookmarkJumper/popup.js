import { indexBookmarks, findEntries, openBookmark } from './bookmarks.js';

const $ = id => document.getElementById(id);
const search = $('search');
let entries = [], results = [], selected = 0, mode = 'bar', folderId = null, tabId;
let opening = false;

function showError(error) {
  $('error').textContent = error.message || 'Something went wrong. Close the popup and try again.';
  $('error').hidden = false;
}

function select(index) {
  selected = Math.max(0, Math.min(index, results.length - 1));
  for (const [i, row] of [...$('results').children].entries()) row.setAttribute('aria-selected', String(i === selected));
  const row = $('results').children[selected];
  if (row) {
    search.setAttribute('aria-activedescendant', row.id);
    row.scrollIntoView({ block: 'nearest' });
  } else search.removeAttribute('aria-activedescendant');
}

function navigate(id) {
  folderId = id;
  search.value = '';
  render();
  search.focus();
}

function render() {
  $('error').hidden = true;
  results = findEntries(entries, { mode, folderId, query: search.value });
  $('bar').setAttribute('aria-pressed', String(mode === 'bar'));
  $('all').setAttribute('aria-pressed', String(mode === 'all'));
  $('count').textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
  $('breadcrumbs').replaceChildren();
  const folder = entries.find(entry => entry.id === folderId);
  const crumbs = [{ id: null, title: mode === 'bar' ? 'Bookmarks bar' : 'All bookmarks' }];
  if (folder) crumbs.push(...folder.ancestors.filter(p => mode !== 'bar' || !entries.some(e => e.id === p.id && (e.folderType === 'bookmarks-bar' || e.id === '1'))), folder);
  for (const [i, crumb] of crumbs.entries()) {
    if (i) $('breadcrumbs').append(document.createTextNode(' / '));
    const button = document.createElement('button');
    button.textContent = crumb.title || 'Untitled folder';
    button.addEventListener('click', () => navigate(crumb.id));
    $('breadcrumbs').append(button);
  }
  const fragment = document.createDocumentFragment();
  results.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = `result ${entry.url ? 'bookmark' : 'folder'}`;
    row.id = `result-${i}`;
    row.setAttribute('role', 'option');
    const icon = document.createElement('span');
    icon.className = 'item-icon';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', entry.url ? 'M6 3h12v18l-6-4-6 4V3Z' : 'M3 7V5h6l2 2h10v13H3V7Z');
    svg.append(path);
    icon.append(svg);
    icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = entry.title || entry.url || 'Untitled folder';
    const detail = document.createElement('div');
    detail.className = 'item-detail';
    detail.textContent = entry.url ? `Bookmark · ${entry.path ? entry.path + ' · ' : ''}${entry.url}` : `Folder · ${entry.children?.length ?? 0} items${entry.path ? ' · ' + entry.path : ''}`;
    detail.title = detail.textContent;
    copy.append(title, detail);
    const action = document.createElement('span');
    action.className = 'item-action';
    action.textContent = entry.url ? 'Open now ↗' : 'Browse folder ›';
    row.title = entry.url ? 'Open bookmark immediately in the current tab' : 'Browse this folder';
    row.append(icon, copy, action);
    row.addEventListener('click', () => { select(i); activate(); });
    fragment.append(row);
  });
  $('results').replaceChildren(fragment);
  $('results').scrollTop = 0;
  $('empty').hidden = results.length > 0;
  $('empty').textContent = search.value.trim() ? 'No matches. Try another title, folder, or URL.' : 'No bookmarks here yet. Add some in Chrome, or search All bookmarks.';
  select(0);
}

async function activate() {
  const entry = results[selected];
  if (!entry || opening) return;
  if (!entry.url) return navigate(entry.id);
  opening = true;
  try {
    await openBookmark(entry.url, tabId, chrome.tabs);
    window.close();
  } catch (error) { showError(error); }
  finally { opening = false; }
}

function back() {
  if (!folderId) return;
  const folder = entries.find(entry => entry.id === folderId);
  const parent = entries.find(entry => entry.id === folder?.parentId);
  navigate(!parent || (mode === 'bar' && (parent.folderType === 'bookmarks-bar' || parent.id === '1')) ? null : parent.id);
}

search.addEventListener('input', render);
search.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'Enter') activate();
    else select(selected + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Backspace' && !search.value) { event.preventDefault(); back(); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); window.close(); }
  if (event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); back(); }
});
for (const scope of ['bar', 'all']) $(scope).addEventListener('click', () => {
  mode = scope;
  folderId = null;
  render();
  search.focus();
});

async function init() {
  $('version').textContent = `v${chrome.runtime.getManifest().version}`;
  search.focus();
  try {
    const [tree, tabs] = await Promise.all([chrome.bookmarks.getTree(), chrome.tabs.query({ active: true, currentWindow: true })]);
    entries = indexBookmarks(tree);
    tabId = tabs[0]?.id;
    render();
  } catch (error) { showError(error); }
  try {
    const commands = await chrome.commands.getAll();
    $('shortcut').textContent = commands.find(command => command.name === '_execute_action')?.shortcut || 'No shortcut assigned';
  } catch { /* Search remains available if the shortcut cannot be read. */ }
}
$('shortcut-settings').addEventListener('click', async () => {
  try { await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
  catch (error) { showError(error); }
});
init();
