const myAudio = document.querySelector("audio");

chrome.runtime.onMessage.addListener((message) => {
  if (message.target != "offscreen") {
    return false;
  } else {
    ping();
  }
});

function ping() {
  let clonedAudio = myAudio.cloneNode(true);
  clonedAudio.onended = () => clonedAudio.remove();
  clonedAudio.play();
}
