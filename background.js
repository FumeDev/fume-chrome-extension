// Define the API base URL
const API_BASE_URL = 'https://d246-2601-645-8700-5460-ad03-d4db-39de-7c1f.ngrok-free.app'; // Replace with your actual API base URL

// Initialize the recordedActions array and recordingId
let recordedActions = [];
let recordingId = null;
let isRecording = false;

// Initialize state from storage when background script loads
chrome.storage.local.get(['recordingId', 'isRecording'], (result) => {
    recordingId = result.recordingId || null;
    isRecording = result.isRecording || false;
});

// Function to get IP address
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return null;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'getRecordingState') {
        sendResponse({ isRecording: isRecording });
        return true;
    }
    
    if (request.message === 'startRecording') {
        recordedActions = [];

        getIPAddress().then(ipAddress => {
            fetch(`${API_BASE_URL}/studio/start_recording`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    studio_id: 1,
                    ip_address: ipAddress || 'unknown'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.recording_id) {
                    recordingId = data.recording_id;
                    isRecording = true;
                    // Store the state
                    chrome.storage.local.set({ 
                        recordingId: recordingId,
                        isRecording: isRecording 
                    });
                    console.log('Recording started with ID:', recordingId);

                    // Inject the content script into the active tab
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            const activeTab = tabs[0];
                            const url = activeTab.url;

                            // Check if the URL is allowed for script injection
                            if (!url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
                                chrome.scripting.executeScript({
                                    target: { tabId: activeTab.id },
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
                                console.error('Cannot inject scripts into chrome:// URLs');
                                sendResponse({ success: false, error: 'Cannot inject scripts into chrome:// URLs' });
                            }
                        } else {
                            sendResponse({ success: false, error: 'No active tab found.' });
                        }
                    });
                } else {
                    console.error('Failed to start recording:', data.error);
                    sendResponse({ success: false, error: data.error || 'Failed to start recording.' });
                }
            })
            .catch(error => {
                console.error('Error starting recording:', error);
                sendResponse({ success: false, error: 'Error starting recording.' });
            });
        });

        return true; // Keeps the message channel open for sendResponse
    } else if (request.message === 'getRecordedActions') {
        // Send the recordedActions array to the popup
        sendResponse({ actions: recordedActions });
        return true; // Keeps the message channel open for sendResponse
    } else if (request.actionType === 'type' || request.actionType === 'click' || 
               request.actionType === 'keydown' || request.actionType === 'input' || 
               request.actionType === 'specialKey') {  // Add specialKey to the list
        if (!recordingId) {
            console.error('No active recording session.');
            return false;
        }

        let action;
        if (request.actionType === 'specialKey') {  // Handle specialKey type
            action = {
                type: 'specialKey',
                details: request.details,
                timestamp: new Date().toISOString()
            };
        } else if (request.actionType === 'click') {
            action = {
                type: 'click',
                details: request.details,
                timestamp: new Date().toISOString()
            };
        } else if (request.actionType === 'input') {
            action = {
                type: 'input',
                details: request.details,
                timestamp: new Date().toISOString()
            };
        }

        if (action) {
            recordedActions.push(action);
            console.log(`${action.type} action recorded:`, action.details);

            // Capture screenshot and send action
            chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error('Error capturing screenshot:', chrome.runtime.lastError.message);
                } else {
                    action.screenshot = dataUrl;

                    fetch(`${API_BASE_URL}/studio/save_ui_action`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            recording_id: recordingId,
                            action: action
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message !== 'Action saved successfully') {
                            console.error('Failed to save action with screenshot:', data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error saving action with screenshot:', error);
                    });
                }
            });
        }

        return true;
    } else if (request.message === 'stopRecording') {
        if (!recordingId) {
            console.error('No active recording session to stop.');
            sendResponse({ success: false, error: 'No active recording session.' });
            return true;
        }

        fetch(`${API_BASE_URL}/studio/stop_recording`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                recording_id: recordingId,
                name: request.recordingName
            })
        })
        .then(response => response.json())
        .then(data => {
            recordingId = null;
            isRecording = false;
            // Clear the stored state
            chrome.storage.local.remove(['recordingId', 'isRecording']);
            
            if (data.message === 'Recording stopped and marked as COMPLETED') {
                console.log('Recording stopped successfully.');
                sendResponse({ 
                    success: true, 
                    message: data.message,
                    recordingName: request.recordingName
                });
            } else {
                console.error('Failed to stop recording:', data.message);
                sendResponse({ success: false, error: data.message || 'Failed to stop recording.' });
            }
        })
        .catch(error => {
            recordingId = null;
            isRecording = false;
            // Clear the stored state even on error
            chrome.storage.local.remove(['recordingId', 'isRecording']);
            
            console.error('Error stopping recording:', error);
            sendResponse({ success: false, error: 'Error stopping recording.' });
        });

        return true; // Keeps the message channel open for sendResponse
    } else {
        // Handle other actionTypes if necessary
        recordedActions.push({
            type: request.actionType,
            details: request.details,
            timestamp: new Date().toISOString()
        });
        console.log('Action recorded:', request.actionType, request.details);
    }
});

// Function to record keydown actions
function recordKeydownAction(details) {
  // Implement the logic to record keydown actions
  console.log('Keydown Action Recorded:', details);
  // You can store these details as needed
}

// Function to record click actions
function recordClickAction(details) {
  // Implement the logic to record click actions
  console.log('Click Action Recorded:', details);
  // You can store these details as needed
}
