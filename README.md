# Bookmark Jumper

<img src="BookmarkJumper/icons/icon-128.png" alt="Springmark — Bookmark Jumper logo" width="96" height="96">

Built with plain HTML, CSS, and JavaScript using Manifest V3. No build step, dependencies, account, or external service is required.

## Install

1. Download or clone this repository to a folder on your computer.
2. Open `chrome://extensions` in Chrome (version 110 or newer).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `BookmarkJumper` subfolder, which contains `manifest.json`.
5. Open Chrome’s extensions menu (the puzzle icon) and pin **Bookmark Jumper** for a toolbar button.

Click the toolbar button or press **Ctrl+Shift+Y** on Windows/Linux. On macOS, the suggested default is **Command+Shift+H**.

Existing installations can retain their previous shortcut. The popup header shows Chrome’s assigned shortcut; use **Keyboard shortcut settings** in the popup to set **Command+Shift+H** on macOS.

To change the shortcut, open `chrome://extensions/shortcuts` and edit Bookmark Jumper’s **Activate the extension** shortcut. If the default shortcut does nothing, check this page: another extension or the operating system may already use it.

## Use

- **Bookmarks bar** opens by default and lists the bar’s immediate bookmarks and folders. Type to search all descendants of the bar.
- **All bookmarks** lists and searches bookmarks and folders across your Chrome bookmark tree, including Other bookmarks and mobile bookmarks when available.
- Search matches bookmark titles, URLs, and folder paths. It ignores case and matches every space-separated word, regardless of word order. For example, `work api` finds an API bookmark inside a Work folder.
- Use **↑ / ↓** to select a result. Press **Enter** or click it to open a bookmark or enter a folder.
- Gold folder icons and **Browse folder** labels identify folders. Bookmark icons and **Open now** labels identify links that immediately open in the current tab.
- Entering a folder clears the search and displays its immediate children. Searching inside a folder includes its descendants and stays within that folder.
- Click a breadcrumb, press **Alt+←**, or press **Backspace** with an empty search field to go up a folder.
- Press **Escape** to close the popup. Use **Tab** to reach the scope buttons and breadcrumbs.

Bookmarks always open in the tab that was active when the popup opened. The About website link and shortcut-settings button open separate tabs. Each popup opening reads a fresh snapshot of your bookmarks; reopen it after editing bookmarks elsewhere.

Empty folders, no search results, and navigation failures are shown in the popup. JavaScript bookmarklets are not executed; use Chrome’s own bookmarks bar for those. Chrome may restrict navigation to certain special URLs, in which case the popup displays the error.

## Privacy and permissions

The only requested permission is `bookmarks`, used to read and search your bookmark tree. Chrome describes this permission broadly, but this extension does not create, edit, or delete bookmarks. Search happens locally, and there is no analytics, remote code, or external favicon request.

Chrome’s tabs API can update the current tab without requesting the broad `tabs` permission. The extension does not read page contents or browsing history. Opening a bookmark navigates to its URL normally.
