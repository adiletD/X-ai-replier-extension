document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key
    chrome.storage.sync.get(['apiKey'], function(result) {
        document.getElementById('apiKey').value = result.apiKey || '';
    });

    // Save API key
    document.getElementById('save').addEventListener('click', function() {
        const apiKey = document.getElementById('apiKey').value;
        chrome.storage.sync.set({
            apiKey: apiKey
        }, function() {
            const status = document.getElementById('status');
            status.textContent = 'Settings saved.';
            setTimeout(function() {
                status.textContent = '';
            }, 2000);
        });
    });
}); 