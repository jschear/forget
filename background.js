
// soon emoji (U+1F51C), hole emoij (U+1F573, U+FE0F)
const BOOKMARK_FOLDER_TITLE = "\uD83D\uDD1C\uD83D\uDD73\uFE0F";
const BOOKMARK_FOLDER_KEY = "bookmark_folder";
const DEBUG = false;

function log(str) {
  if (DEBUG) {
    console.log(str);
  }
}

/**
* Returns the bookmark folder's id from storage, after checking that the folder exists,
* and creating it if necessary.
*/
function getBookmarkFolderId(callback) {
  // Fetch persisted id from storage.
  chrome.storage.sync.get(BOOKMARK_FOLDER_KEY, (items) => {
    var folderId = chrome.runtime.lastError ? null : items[BOOKMARK_FOLDER_KEY];
    if (!folderId) {
      // Nothing in storage: create a folder.
      createAndStoreBookmarkFolder(callback);
    } else {
      // Found an id in storage: check if it exists.
      chrome.bookmarks.get(folderId, (folder) => {
        if (chrome.runtime.lastError) {
          // It doesn't exist -- let's create a new one.
          createAndStoreBookmarkFolder(callback);
        } else {
          callback(folderId);
        }
      });
    }
  });
}

function createAndStoreBookmarkFolder(callback) {
  chrome.bookmarks.create({ "title": BOOKMARK_FOLDER_TITLE }, (newFolder) => {
    chrome.storage.sync.set({[BOOKMARK_FOLDER_KEY]: newFolder.id}, () => {
      callback(newFolder.id);
    });
  });
}

function debugDuration(duration) {
  var seconds;
  if (duration == "day") {
    seconds = 2;
  } else if (duration == "week") {
    seconds = 5;
  } else if (duration == "month") {
    seconds = 10;
  }
  return moment().add(seconds, "s");
}

function dateForDuration(duration) {
  if (DEBUG) {
    return debugDuration(duration);
  }

  var unit;
  if (duration == "day") {
    unit = "d";
  } else if (duration == "week") {
    unit = "w";
  } else if (duration == "month") {
    unit = "m";
  }
  return moment().add(1, unit);
}

// (2-24) Tab Title
function bookmarkTitle(tabTitle, dateToForget) {
  var monthAndDay = dateToForget.format("M-D");
  return "(" + monthAndDay + ") " + tabTitle;
}

// Called from popup.js
function addBookmark(tab, duration) {
  var dateToForget = dateForDuration(duration);

  getBookmarkFolderId((folderId) => {
    var title = bookmarkTitle(tab.title, dateToForget);
    var bookmark = {
      "parentId": folderId,
      "title": title,
      "url": tab.url
    };
    chrome.bookmarks.create(bookmark, (newNode) => {
      chrome.alarms.create(newNode.id, { "when": dateToForget.valueOf() });
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  var bookmarkId = alarm.name;
  log("Alarm fired: " + bookmarkId);
  chrome.bookmarks.remove(bookmarkId);
});
