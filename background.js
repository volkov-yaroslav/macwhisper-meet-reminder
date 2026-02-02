// Keep track of which tabs have already shown a reminder
const remindedTabs = new Set();
const NOTIF_ID_PREFIX = "macwhisper-meet-reminder-";

function handleTabUpdate(tabId, changeInfo, tab) {
  const url = changeInfo.url || tab.url;
  if (!url) return;

  // Only care about Google Meet
  if (!url.startsWith("https://meet.google.com")) {
    // If the tab navigates away from Meet, forget it
    if (remindedTabs.has(tabId)) {
      remindedTabs.delete(tabId);
    }
    return;
  }

  // If we've already reminded for this tab, do nothing
  if (remindedTabs.has(tabId)) {
    return;
  }

  // Mark this tab as reminded for this Meet session
  remindedTabs.add(tabId);

  const notifId = NOTIF_ID_PREFIX + tabId;

  chrome.notifications.create(notifId, {
    type: "basic",
    iconUrl: "icon128.png",
    title: "Google Meet Detected",
    message: "Don’t forget to start MacWhisper recording.",
    priority: 2
  });
}

// Fired when a tab's URL changes (navigation, new Meet, etc.)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    handleTabUpdate(tabId, changeInfo, tab);
  }
});

// Optional: if you still want reminders when switching tabs to an already-open Meet,
// you can keep this. It will still only fire once per tab because of remindedTabs.
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (chrome.runtime.lastError || !tab) return;
    handleTabUpdate(activeInfo.tabId, {}, tab);
  });
});

// When a tab closes, clean up its state
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (remindedTabs.has(tabId)) {
    remindedTabs.delete(tabId);
  }
});