// Popup script for AnySpeed extension

document.addEventListener('DOMContentLoaded', () => {
  const speedSlider = document.getElementById('speedSlider');
  const currentSpeed = document.getElementById('currentSpeed');
  const tickContainer = document.getElementById('tickContainer');

  // Valid speed values (only these are allowed)
  const validSpeeds = [
    1.0, 1.25, 1.5, 1.75,
    2.0, 2.25, 2.5, 2.75,
    3.0, 3.25, 3.5, 3.75,
    4.0, 4.25, 4.5, 4.75,
    5.0
  ];

  const majorTicks = [1, 2, 3, 4, 5];
  const halfTicks = [1.5, 2.5, 3.5, 4.5];
  const minorTicks = [1.25, 1.75, 2.25, 2.75, 3.25, 3.75, 4.25, 4.75];

  // Create tick marks
  function createTicks() {
    tickContainer.innerHTML = '';
    const min = 1.0;
    const max = 5;
    const range = max - min;
    const containerWidth = tickContainer.offsetWidth;

    // Create all ticks
    validSpeeds.forEach(speed => {
      const position = ((speed - min) / range) * 100;
      const tick = document.createElement('div');
      tick.className = 'tick';
      
      let label = null;
      
      if (majorTicks.includes(speed)) {
        tick.classList.add('major');
        label = document.createElement('div');
        label.className = 'tick-label major';
        label.textContent = speed + 'x';
      } else if (halfTicks.includes(speed)) {
        tick.classList.add('half');
        label = document.createElement('div');
        label.className = 'tick-label';
        label.textContent = speed + 'x';
      } else if (minorTicks.includes(speed)) {
        tick.classList.add('minor');
      }
      
      tick.style.left = position + '%';
      tickContainer.appendChild(tick);
      
      if (label) {
        label.style.left = position + '%';
        tickContainer.appendChild(label);
      }
    });
  }

  // Snap to nearest valid speed
  function snapToValidSpeed(value) {
    return validSpeeds.reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });
  }

  // Update speed in content script
  function updateSpeed(speed) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setSpeed', speed: speed });
      }
    });
    
    // Save to storage
    chrome.storage.sync.set({ playbackSpeed: speed });
  }

  // Load saved speed
  chrome.storage.sync.get(['playbackSpeed'], (result) => {
    const savedSpeed = result.playbackSpeed || 1.0;
    const snappedSpeed = snapToValidSpeed(savedSpeed);
    speedSlider.value = snappedSpeed;
    currentSpeed.textContent = snappedSpeed.toFixed(2) + 'x';
    updateSpeed(snappedSpeed);
  });

  // Create ticks on load
  createTicks();

  // Handle slider input (while dragging)
  speedSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    const snapped = snapToValidSpeed(value);
    speedSlider.value = snapped;
    currentSpeed.textContent = snapped.toFixed(2) + 'x';
    updateSpeed(snapped);
  });

  // Handle slider change (when released)
  speedSlider.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    const snapped = snapToValidSpeed(value);
    speedSlider.value = snapped;
    currentSpeed.textContent = snapped.toFixed(2) + 'x';
    updateSpeed(snapped);
  });
});

