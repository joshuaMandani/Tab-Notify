async function is_tracked() {
  const response = await chrome.runtime.sendMessage({
    message: "is_tracked",
  });

  let url = new URL(response.tab.url);

  if (url.href.length > url.origin.length) {
    document.querySelector(".link").innerHTML = `${url.origin} [...]`;
  } else {
    document.querySelector(".link").innerHTML = url.origin;
  }
  document.querySelector(".title").innerHTML = response.tab.title;
  document.querySelector(".favIconUrl").src = response.tab.favIconUrl;

  if (response.tracked) {
    document.querySelector("#add").innerHTML = "Remove current tab";
  } else {
    document.querySelector("#add").innerHTML = "Add current tab";
  }
  return response.tracked;
}

async function track_tab() {
  const response = await chrome.runtime.sendMessage({
    message: "add_tab",
  });

  if (response.action == "added") {
    document.querySelector("#add").innerHTML = "Remove current tab";
  }
}

async function remove_tab() {
  const response = await chrome.runtime.sendMessage({
    message: "remove_tab",
  });
  if (response.action == "removed") {
    document.querySelector("#add").innerHTML = "Add current tab";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  let tracked = await is_tracked();

  document.querySelector("#add").addEventListener("click", () => {
    if (tracked) {
      remove_tab();
    } else {
      track_tab();
    }

    tracked = !tracked;
  });
});
