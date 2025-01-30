chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_API_KEY') {
        chrome.storage.sync.get(['apiKey'], function(result) {
            sendResponse({apiKey: result.apiKey});
        });
        return true; // Will respond asynchronously
    }
}); 