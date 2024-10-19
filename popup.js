document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const actionsDiv = document.getElementById('actions');
  
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ message: 'startRecording' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          actionsDiv.innerHTML = 'Recording started...';
        }
      });
    });
  
    stopButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ message: 'getRecordedActions' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          actionsDiv.innerHTML = 'Error retrieving actions.';
        } else {
          actionsDiv.innerHTML = '';
  
          if (response && response.length > 0) {
            response.forEach((action, index) => {
              const actionElement = document.createElement('div');
              actionElement.textContent = `${index + 1}. ${action.type}: ${JSON.stringify(action.details)}`;
              actionsDiv.appendChild(actionElement);
            });
          } else {
            actionsDiv.textContent = 'No actions recorded.';
          }
        }
      });
    });
  });