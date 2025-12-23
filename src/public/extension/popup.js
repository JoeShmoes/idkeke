
const APP_URL = "https://studio--contextflow-9d6np.us-central1.hosted.app";
const iframe = document.getElementById("alfred-iframe");

iframe.src = `${APP_URL}/ai-room/compact`;

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PAGE_CONTENT_RESULT") {
    // Forward the content to the iframe
    iframe.contentWindow.postMessage(
      {
        type: "PAGE_CONTENT",
        content: message.content,
      },
      APP_URL
    );
  }
});

// When the popup opens, request the page content from the content script
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "GET_PAGE_CONTENT" });
    }
});
