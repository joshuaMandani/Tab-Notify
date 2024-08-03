let tracked_tabs = [];
let current_tab = {
  favIconUrl: "",
  id: -999999999,
  status: "",
  title: "",
  url: "",
};
let count = 0;

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

  if (found.url != tab.url) {
    return true;
  }
  return false;
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (did_tab_change(tabId, tab)) {
    remove_tab(tabId);
  }
  getCurrentTab();
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
