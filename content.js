// Initialize an array to hold the recorded actions
window.recordedActions = [];

// Function to record user actions
function recordAction(actionType, details) {
  window.recordedActions.push({
    type: actionType,
    details: details,
    timestamp: new Date().toISOString()
  });
  console.log('Action recorded:', actionType, details);
}

// Event listener for clicks
document.addEventListener('click', (event) => {
  recordAction('click', {
    element: event.target.tagName,
    id: event.target.id,
    class: event.target.className,
    x: event.clientX,
    y: event.clientY
  });
});

// Event listener for key presses
document.addEventListener('keydown', (event) => {
  recordAction('keydown', {
    key: event.key,
    code: event.code,
    target: event.target.tagName
  });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'getRecordedActions') {
    sendResponse(window.recordedActions);
  }
});