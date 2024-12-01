document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const actionsDiv = document.getElementById('actions');
  
    function updateUIForRecordingStopped() {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        stopButton.disabled = true;
        stopButton.style.opacity = '0.5';
    }
  
    function updateUIForRecordingStarted() {
        startButton.disabled = true;
        startButton.style.opacity = '0.5';
        stopButton.disabled = false;
        stopButton.style.opacity = '1';
    }
  
    function truncateName(name, maxLength = 20) {
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    }
  
    // Check recording state when popup opens
    chrome.runtime.sendMessage({ message: 'getRecordingState' }, (response) => {
        if (response && response.isRecording) {
            actionsDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><circle cx="8" cy="8" r="6" fill="#ff3333"/></svg> Recording in progress...';
            updateUIForRecordingStarted();
        } else {
            updateUIForRecordingStopped();
        }
    });
  
    startButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ message: 'startRecording' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          actionsDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm2.707 8.793a1 1 0 1 1-1.414 1.414L8 10.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 9 5.293 7.707a1 1 0 0 1 1.414-1.414L8 7.586l1.293-1.293a1 1 0 0 1 1.414 1.414L9.414 9z" fill="#ff4444"/></svg> Error starting recording.';
        } else if (response.success) {
          actionsDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><circle cx="8" cy="8" r="6" fill="#ff3333"/></svg> Recording in progress...';
          updateUIForRecordingStarted();
        } else {
          actionsDiv.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm2.707 8.793a1 1 0 1 1-1.414 1.414L8 10.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 9 5.293 7.707a1 1 0 0 1 1.414-1.414L8 7.586l1.293-1.293a1 1 0 0 1 1.414 1.414L9.414 9z" fill="#ff4444"/></svg> Error: ${response.error}`;
        }
      });
    });
  
    stopButton.addEventListener('click', () => {
        const recordingName = prompt('Please name your recording:', '');
        
        if (recordingName === null) {
            return;
        }

        if (recordingName.trim() === '') {
            actionsDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm2.707 8.793a1 1 0 1 1-1.414 1.414L8 10.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 9 5.293 7.707a1 1 0 0 1 1.414-1.414L8 7.586l1.293-1.293a1 1 0 0 1 1.414 1.414L9.414 9z" fill="#ff4444"/></svg> Please enter a valid name for the recording.';
            return;
        }

        chrome.runtime.sendMessage({ 
            message: 'stopRecording',
            recordingName: recordingName  // Send full name to backend
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                actionsDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm2.707 8.793a1 1 0 1 1-1.414 1.414L8 10.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 9 5.293 7.707a1 1 0 0 1 1.414-1.414L8 7.586l1.293-1.293a1 1 0 0 1 1.414 1.414L9.414 9z" fill="#ff4444"/></svg> Error stopping recording.';
            } else if (response.success) {
                const truncatedName = truncateName(recordingName);
                actionsDiv.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zM7 10.793L4.354 8.146a1 1 0 1 1 1.414-1.414L7 8.379l3.232-3.232a1 1 0 1 1 1.414 1.414L7 10.793z" fill="#44ff44"/></svg> Recording "${truncatedName}" saved successfully!`;
                updateUIForRecordingStopped();
            } else {
                actionsDiv.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;"><path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.51 6.51 0 0 0 8 1.5zm2.707 8.793a1 1 0 1 1-1.414 1.414L8 10.414l-1.293 1.293a1 1 0 0 1-1.414-1.414L6.586 9 5.293 7.707a1 1 0 0 1 1.414-1.414L8 7.586l1.293-1.293a1 1 0 0 1 1.414 1.414L9.414 9z" fill="#ff4444"/></svg> Error: ${response.error}`;
            }
        });
    });
});
