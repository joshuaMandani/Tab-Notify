let tracked_tabs = [];
let current_tab = {
  favIconUrl: "",
  id: -999999999,
  status: "",
  title: "",
  url: "",
};
let count = 0;
let pings = 0;

//Global promise to avoid multiple offscreen documents
let creating;

//Changes the current_tab object based on the current tab's new information
async function getCurrentTab() {
  console.log("Gathering current tab information");
  let queryOptions = {
    active: true,
    lastFocusedWindow: true,
  };

  let [tab] = await chrome.tabs.query(queryOptions);

  current_tab.favIconUrl = tab?.favIconUrl;
  current_tab.id = tab?.id;
  current_tab.status = tab?.status;
  current_tab.title = tab?.title;
  current_tab.url = tab?.url || tab?.pendingUrl;
}

//Add user's current tab to array of tracked tabs
function track_tab() {
  tracked_tabs.push(structuredClone(current_tab));
  count += 1;
}

//Remove tab with associated tab id from the array of tracked tabs
function remove_tab(tab_id) {
  tracked_tabs = tracked_tabs.filter((tab) => tab.id !== tab_id);
  count -= 1;
}

//Remove a currently tracked tab from the array if the URL is changed
function did_tab_change(tabId, tab) {
  const found = tracked_tabs.find((element) => element.id == tabId);

  if (!found) return;

  if (found.url != tab.url) {
    return true;
  }
  return false;
}

//Return's true or false whether or not a tracked tab's title has been update
function did_title_change(tabId, tab) {
  const found = tracked_tabs.find((element) => element.id == tabId);

  if (!found) return;

  if (found.title != tab.title) {
    console.log("Title Changed");
    chrome.action.setBadgeText({text: (++pings).toString()});
    return true;
  }
  return false;
}

//Creates an offscreen document to play the audio which indicates a tracked tab's title change
async function setupOffscreenDocument() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL("./offscreen/offscreen.html");
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: "/offscreen/offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification:
        "To play a notification sound whenever a tracked tab's title updates",
    });
    await creating;
    creating = null;
  }
}

/* Event listeners that call the getCurrentTab function to update the current_tab
object's information. These are needed to keep track of  the user's current tab at
all times */
chrome.runtime.onInstalled.addListener(() => {
  getCurrentTab();
});

chrome.runtime.onStartup.addListener(() => {
  getCurrentTab();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (did_tab_change(tabId, tab)) {
    remove_tab(tabId);
  }

  if (did_title_change(tabId, tab)) {
    await setupOffscreenDocument();
    chrome.runtime.sendMessage({
      type: "play",
      target: "offscreen",
      data: "",
    });
  } else {
    getCurrentTab();
  }
});

chrome.tabs.onHighlighted.addListener(() => {
  getCurrentTab();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== -1) {
    getCurrentTab();
  }
});

//Remove's the closed tab from the array of tracked tabs (if present in the array)
chrome.tabs.onRemoved.addListener((tabId) => {
  remove_tab(tabId);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "is_tracked") {
    pings = 0;
    if (tracked_tabs.some((tab) => tab.id === current_tab.id)) {
      sendResponse({
        message: true,
        tab: current_tab,
        tracked: tracked_tabs,
      });
    } else {
      sendResponse({
        message: false,
        tab: current_tab,
        tracked: tracked_tabs,
      });
    }
  } else if (request.message == "add_tab") {
    track_tab();
    sendResponse({
      message: "added",
      tab: current_tab,
      tracked: tracked_tabs,
    });
  } else if (request.message == "remove_tab") {
    remove_tab(current_tab.id);
    sendResponse({
      message: "removed",
      tab: current_tab,
      tracked: tracked_tabs,
    });
  }
});
