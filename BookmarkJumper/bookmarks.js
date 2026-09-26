/** Flatten Chrome's tree without changing its bookmark order. */
export function indexBookmarks(tree) {
  const entries = [];
  function visit(node, ancestors) {
    if (node.id !== '0') entries.push({ ...node, ancestors, path: ancestors.map(n => n.title).filter(Boolean).join(' / ') });
    const next = node.id === '0' ? ancestors : [...ancestors, { id: node.id, title: node.title }];
    for (const child of node.children ?? []) visit(child, next);
  }
  for (const root of tree) visit(root, []);
  return entries;
}

export function barRoots(entries) {
  const typed = entries.filter(entry => entry.folderType === 'bookmarks-bar');
  return typed.length ? typed : entries.filter(entry => entry.id === '1' && !entry.url);
}

export function findEntries(entries, { mode, folderId, query }) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const roots = new Set(barRoots(entries).map(entry => entry.id));
  return entries.filter(entry => {
    if (folderId) {
      if (words.length ? !entry.ancestors.some(parent => parent.id === folderId) : entry.parentId !== folderId) return false;
    } else if (mode === 'bar') {
      if (words.length ? !entry.ancestors.some(parent => roots.has(parent.id)) : !roots.has(entry.parentId)) return false;
    }
    const searchable = `${entry.title} ${entry.url ?? ''} ${entry.path}`.toLocaleLowerCase();
    return words.every(word => searchable.includes(word));
  });
}

export async function openBookmark(url, tabId, tabs) {
  if (/^javascript:/i.test(url.trim())) throw new Error('Bookmarklets cannot be opened here. Run this bookmark from Chrome’s bookmarks bar.');
  if (!Number.isInteger(tabId)) throw new Error('No active tab is available. Reopen Bookmark Jumper from a browser tab.');
  await tabs.update(tabId, { url });
}
