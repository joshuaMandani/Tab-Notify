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

  if (response.message) {
    document.querySelector("#add").innerHTML = "Remove current tab";
  } else {
    document.querySelector("#add").innerHTML = "Add current tab";
  }
  return response;
}

async function track_tab() {
  const response = await chrome.runtime.sendMessage({
    message: "add_tab",
  });
  console;
  if (response.message == "added") {
    document.querySelector("#add").innerHTML = "Remove current tab";
    document.querySelector(
      ".tab-container"
    ).innerHTML += `<div class='tab' id="p${response.tab.id}"><img src="${response.tab.favIconUrl}" class="favIconUrl"> ${response.tab.title}</div>`;
    document.querySelector(
      ".num_tracking"
    ).innerHTML = `${response.tracked.length}`;
  }
}

async function remove_tab() {
  const response = await chrome.runtime.sendMessage({
    message: "remove_tab",
  });
  if (response.message == "removed") {
    document.querySelector("#add").innerHTML = "Add current tab";
    document.querySelector(`#p${response.tab.id}`).remove();
    document.querySelector(
      ".num_tracking"
    ).innerHTML = `${response.tracked.length}`;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  let response = await is_tracked();

  document.querySelector(
    ".num_tracking"
  ).innerHTML = `${response.tracked.length}`;

  for (let i = 0; i < response.tracked.length; i++) {
    document.querySelector(
      ".tab-container"
    ).innerHTML += `<div class='tab' id="p${response.tracked[i].id}"><img src="${response.tracked[i].favIconUrl}" class="favIconUrl"> ${response.tracked[i].title}</div>`;
  }

  document.querySelector("#add").addEventListener("click", () => {
    if (response.message) {
      remove_tab();
    } else {
      track_tab();
    }

    response.message = !response.message;
  });
});
