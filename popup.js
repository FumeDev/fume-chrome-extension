document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const actionsDiv = document.getElementById('actions');
  
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ message: 'startRecording' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          actionsDiv.innerHTML = 'Error starting recording.';
        } else if (response.success) {
          actionsDiv.innerHTML = 'Recording started...';
        } else {
          actionsDiv.innerHTML = `Error: ${response.error}`;
        }
      });
    });
  
    stopButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ message: 'stopRecording' }, (response) => { // Changed message to 'stopRecording'
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          actionsDiv.innerHTML = 'Error stopping recording.';
        } else if (response.success) {
          actionsDiv.innerHTML = 'Recording stopped successfully.';
        } else {
          actionsDiv.innerHTML = `Error: ${response.error}`;
        }
      });
    });
  });
