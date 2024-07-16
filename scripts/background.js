let tracked_tab_ids = [];
let current_tab = {
  "favIconUrl": "",
  "id": -999999999,
  "status": "",
  "title": "",
  "url": "",
};
let count = 0;

async function getCurrentTab() {
  console.log("Gathering current tab information");
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);

  current_tab.favIconUrl = tab?.favIconUrl;
  current_tab.id = tab?.id;
  current_tab.status = tab?.status;
  current_tab.title = tab?.title;
  current_tab.url = tab?.url || tab?.pendingUrl;

}

function track_tab(tab_id) {
  tracked_tab_ids.push(tab_id);
  count += 1;
}

function remove_tab(tab_id) {
  if (tracked_tab_ids.indexOf(tab_id) == -1) {
    return
  }

  tracked_tab_ids.splice(tracked_tab_ids.indexOf(tab_id), 1);
  count -= 1;
}

chrome.runtime.onInstalled.addListener(() => {
  getCurrentTab();
});

chrome.runtime.onStartup.addListener(() => {
  getCurrentTab();
});


chrome.tabs.onUpdated.addListener(() => {
  getCurrentTab();
});


chrome.tabs.onHighlighted.addListener(() => {
  getCurrentTab();
});


chrome.tabs.onRemoved.addListener((tabId) => {
  remove_tab(tabId);
});


chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== -1) {
    getCurrentTab();
  }
});


chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
    if (request.message == "is_tracked") {
      if (tracked_tab_ids.indexOf(current_tab.id) == -1) {
        sendResponse({tracked: false, tab: current_tab});
      } else {
        sendResponse({tracked: true, tab: current_tab});
      }


    } else if (request.message == "add_tab") {
      console.log(current_tab.id);

      track_tab(current_tab.id);

      console.log('Tracked IDs is' + tracked_tab_ids);

      sendResponse({action: "added"})
    } else if (request.message == "remove_tab") {
      console.log(current_tab.id);

      remove_tab(current_tab.id);

      console.log('Tracked IDs is' + tracked_tab_ids);
      sendResponse({action: "removed"})
    }

  }
);