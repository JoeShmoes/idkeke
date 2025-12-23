
function getPageContent() {
    // A more robust way to get page content, excluding common non-content elements
    const clone = document.body.cloneNode(true);
    const selectorsToRemove = 'script, style, nav, footer, header, noscript, svg, .noprint, [aria-hidden="true"]';
    clone.querySelectorAll(selectorsToRemove).forEach(el => el.remove());
    
    // Fallback to innerText if textContent is empty, as it's better at respecting visual layout
    let text = clone.textContent;
    if (!text || text.trim().length < 100) {
        text = clone.innerText;
    }

    // Basic cleaning
    return text.replace(/\s\s+/g, ' ').trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchContent') {
    const content = getPageContent();
    sendResponse({ content });
  }
  return true; 
});
