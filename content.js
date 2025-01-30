function addReplyButtonToTweets() {
    // Select all tweet articles that don't already have our button
    const tweets = document.querySelectorAll('article:not([data-ai-reply-added="true"])');
    
    tweets.forEach(tweet => {
        // Check if this tweet already has our button
        if (tweet.querySelector('.ai-reply-button')) {
            return;
        }
        
        // Mark this tweet as processed using a data attribute
        tweet.setAttribute('data-ai-reply-added', 'true');
        
        // Find the tweet actions bar
        const actionsBar = tweet.querySelector('[role="group"]');
        
        if (actionsBar) {
            // Create our AI reply button
            const aiButton = document.createElement('button');
            aiButton.className = 'ai-reply-button';
            aiButton.innerHTML = '🤖 AI Reply';
            aiButton.onclick = () => generateAIReply(tweet);
            
            // Add button to the actions bar
            actionsBar.appendChild(aiButton);
        }
    });
}

// Create a debounced version of addReplyButtonToTweets
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Use the debounced version for the observer
const debouncedAddButtons = debounce(addReplyButtonToTweets, 100);

// Create observer with options to reduce unnecessary triggers
const observer = new MutationObserver((mutations) => {
    // Check if any of the mutations involve adding new tweets
    const shouldUpdate = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === 1 && 
                   (node.tagName === 'ARTICLE' || 
                    node.querySelector('article'));
        });
    });

    if (shouldUpdate) {
        debouncedAddButtons();
    }
});

// Start observing with more specific options
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

// Initial run
addReplyButtonToTweets();

async function generateAIReply(tweet) {
    // Get the button first and store its state
    const button = tweet.querySelector('.ai-reply-button');
    if (!button) return;

    // Store the original button state BEFORE any async operations
    const originalButtonText = button.innerHTML;
    
    try {
        // Update button to loading state
        button.disabled = true;
        button.innerHTML = '🤖 Generating...';

        // Get the tweet text
        const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
        
        // Get API key from storage using chrome.runtime.sendMessage
        const apiKey = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({type: 'GET_API_KEY'}, response => {
                if (response && response.apiKey) {
                    resolve(response.apiKey);
                } else {
                    reject('API key not found');
                }
            });
        });

        if (!apiKey) {
            throw new Error('Please set your API key in the extension settings');
        }

        // Make API call to Perplexity AI
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    {
                        "role": "system",
                        "content": "You are a friendly, witty person.   You are a hood chill dude who just fucks around who loves having casual conversations. Keep your replies natural, occasionally humorous, and conversational - like you're chatting with a friend. Avoid being too formal or using social media clichés like hashtags. Keep responses concise but engaging."
                    },
                    {
                        "role": "user",
                        "content": `Generate a casual, friendly reply to this post: "${tweetText} . Make it within 280 characters, ideallty short and witty. 
                        Make it in style of twitter replies or reddit replies. Find a unique angle."`
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }

        const aiReply = data.choices[0].message.content;

        // Copy the AI reply to clipboard
        await navigator.clipboard.writeText(aiReply);

        // Find and click the reply button
        const replyButton = tweet.querySelector('[data-testid="reply"]');
        if (replyButton) {
            replyButton.click();
            
            setTimeout(() => {
                alert('AI reply has been copied to clipboard. Press Ctrl+V or Cmd+V to paste it in the reply box.');
            }, 500);
        }

    } catch (error) {
        console.error('Error generating AI reply:', error);
        alert('Error generating reply: ' + error.message);
    } finally {
        // Always restore the button to its original state
        if (button) {
            button.innerHTML = originalButtonText;
            button.disabled = false;
        }
    }
} 