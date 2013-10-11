// Open index.html in a new tab when the icon is clicked.
chrome.browserAction.onClicked.addListener( function() {
    chrome.tabs.create({url:'index.html'});
});
