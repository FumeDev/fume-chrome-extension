// Prevent adding multiple event listeners
if (!window.hasRun) {
  window.hasRun = true;

  // Event listener for key presses
  document.addEventListener('keydown', (event) => {
    // Send message to background script
    chrome.runtime.sendMessage({
      actionType: 'keydown',
      details: {
        key: event.key,
        code: event.code,
        element: event.target.tagName,
        id: event.target.id,
        class: event.target.className,
        xpath: getXPath(event.target) // Added XPath to details
      }
    });
  });

  // Event listener for clicks
  document.addEventListener('click', (event) => {
    // Send message to background script
    chrome.runtime.sendMessage({
      actionType: 'click',
      details: {
        element: event.target.tagName,
        id: event.target.id,
        class: event.target.className,
        x: event.clientX,
        y: event.clientY,
        xpath: getXPath(event.target) // Added XPath to details
      }
    });
  });

  // Event listener for input changes
  document.addEventListener('input', (event) => {
    // Send message to background script
    chrome.runtime.sendMessage({
      actionType: 'input',
      details: {
        value: event.target.value,
        element: event.target.tagName,
        id: event.target.id,
        class: event.target.className,
        xpath: getXPath(event.target) // Added XPath to details
      }
    });
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getRecordedActions') {
      // Optionally, handle requests if necessary
      // sendResponse({}); // Adjust as needed
    }
  });
}

// Add a helper function to compute the relative XPath of an element
function getXPath(element) {
    if (element.id !== '') {
        return `//*[@id="${element.id}"]`;
    }

    let path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = element.previousElementSibling;
        while (sibling) {
            if (sibling.tagName === element.tagName) {
                index++;
            }
            sibling = sibling.previousElementSibling;
        }
        const tagName = element.tagName.toLowerCase();
        const part = `${tagName}[${index}]`;
        path.unshift(part);
        element = element.parentNode;
        if (element.id) {
            path.unshift(`//*[@id="${element.id}"]`);
            break;
        }
    }
    return path.length > 0 ? '.' + path.join('/') : '';
}
