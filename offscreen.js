const myAudio = document.querySelector("audio");

chrome.runtime.onMessage.addListener((message) => {
  if (message.target != "offscreen") {
    return false;
  } else {
    ping();
  }
});

function ping() {
  myAudio.play();
}
