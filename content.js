// Prevent adding multiple event listeners
if (!window.hasRun) {
  window.hasRun = true;

  // Track current input state
  let currentInputElement = null;
  let inputBuffer = '';

  // Helper function to send input action
  function sendInputAction(element, x, y, endActionType = null) {
    // Only send if value has changed
    if (!element || element.value === inputBuffer) return false;
    
    // Send the input action
    chrome.runtime.sendMessage({
      actionType: 'input',
      details: {
        value: element.value,
        html: element.outerHTML,
        x: x,
        y: y
      }
    });

    // If there's an end action type (click or enter), send it as well
    if (endActionType) {
      let endActionDetails = {
        html: element.outerHTML,
        x: x,
        y: y
      };
      
      if (endActionType === 'specialKey') {
        endActionDetails.key = 'Enter';
      }

      chrome.runtime.sendMessage({
        actionType: endActionType,
        details: endActionDetails
      });
    }

    return true;
  }

  // Event listener for key presses
  document.addEventListener('keydown', (event) => {
    if (!currentInputElement) return;

    if (event.key === 'Enter' || event.key === 'Escape') {
      const element = currentInputElement;
      const x = event.clientX;
      const y = event.clientY;

      // Send the accumulated input if there are changes, along with the special key press
      sendInputAction(element, x, y, 'specialKey');

      currentInputElement = null;
      inputBuffer = '';
    }
  });

  // Event listener for clicks
  document.addEventListener('click', (event) => {
    if (currentInputElement && event.target !== currentInputElement) {
      const element = currentInputElement;
      const rect = element.getBoundingClientRect();

      // Send any pending input along with the click action
      sendInputAction(
        element,
        rect.x,
        rect.y,
        'click'
      );

      currentInputElement = null;
      inputBuffer = '';
    } else {
      // If no input to handle, send click immediately
      chrome.runtime.sendMessage({
        actionType: 'click',
        details: {
          html: event.target.outerHTML,
          x: event.clientX,
          y: event.clientY
        }
      });
    }

    // If clicking on an input element, start tracking it
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      if (event.target !== currentInputElement) {
        currentInputElement = event.target;
        inputBuffer = event.target.value;
      }
    }
  });

  // Event listener for input changes
  document.addEventListener('input', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      if (!currentInputElement) {
        currentInputElement = event.target;
        inputBuffer = event.target.value;
      }
    }
  });

  // Handle focus out to catch when user leaves an input
  document.addEventListener('focusout', (event) => {
    if (currentInputElement && (event.target === currentInputElement)) {
      const rect = currentInputElement.getBoundingClientRect();
      sendInputAction(
        currentInputElement,
        rect.x,
        rect.y,
        'click'  // Add click action when focus is lost
      );
      currentInputElement = null;
      inputBuffer = '';
    }
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getRecordedActions') {
      // Handle if needed
    }
  });
}
