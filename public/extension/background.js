
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "get_page_content") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape_content" });
                chrome.runtime.sendMessage({ action: "content_result", content: response?.content || '' });
            } catch (e) {
                console.error("Error sending message to content script:", e);
                // This can happen if the content script is not injected on the current page (e.g., chrome:// pages)
                chrome.runtime.sendMessage({ action: "content_result", content: 'Error: Could not access page content. This page may be protected.' });
            }
        }
    }
});

    