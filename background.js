chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'startRecording') {
      // Inject the content script into the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              sendResponse({ success: false });
            } else {
              sendResponse({ success: true });
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found.' });
        }
      });
      return true; // Keeps the message channel open for sendResponse
    } else if (request.message === 'getRecordedActions') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, 'getRecordedActions', (response) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              sendResponse({ success: false });
            } else {
              sendResponse(response);
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found.' });
        }
      });
      return true; // Keeps the message channel open for sendResponse
    }
  });