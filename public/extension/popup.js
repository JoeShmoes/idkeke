
document.addEventListener('DOMContentLoaded', function() {
    const iframe = document.getElementById('app-iframe');
    // IMPORTANT: This URL must match your deployed application URL.
    const APP_URL = 'https://studio--contextflow-9d6np.us-central1.hosted.app';
    // The "?view=compact" is important to render the correct UI inside the extension.
    iframe.src = `${APP_URL}/ai-room/compact`;

    // Listen for messages from the app within the iframe
    window.addEventListener('message', (event) => {
        // IMPORTANT: Verify the origin for security
        if (event.origin !== APP_URL) {
            return;
        }

        // When the compact view is ready, get the page content and send it.
        if (event.data.type === 'COMPACT_VIEW_READY') {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const activeTab = tabs[0];
                if (activeTab && activeTab.id) {
                    // Send a message to the content script to get the page content.
                    chrome.tabs.sendMessage(activeTab.id, { action: "getPageContent" }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                            iframe.contentWindow.postMessage({ type: 'PAGE_CONTENT', content: 'Could not access page content. Please try reloading the page.' }, APP_URL);
                            return;
                        }
                        if (response && response.content) {
                           iframe.contentWindow.postMessage({ type: 'PAGE_CONTENT', content: response.content }, APP_URL);
                        }
                    });
                }
            });
        }
    });
});
