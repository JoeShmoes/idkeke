
// This script is intentionally left blank.
// The logic is handled by the React application loaded in the iframe.
// The iframe's src will be set to /ai-room/compact
document.addEventListener('DOMContentLoaded', function() {
    const iframe = document.getElementById('app-frame');
    const currentUrl = new URL(window.location.href);
    const compactUrl = `${currentUrl.origin}/ai-room/compact`;
    iframe.src = compactUrl;
});

    