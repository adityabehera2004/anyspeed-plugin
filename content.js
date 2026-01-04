// AnySpeed - Chrome Extension
// Controls playback speed of HTML5 video and audio elements

(function() {
  'use strict';

  let currentSpeed = 1.0;

  // Apply speed to all media elements
  function applySpeed(speed) {
    currentSpeed = speed;
    
    // Find all video and audio elements
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    videos.forEach(video => {
      video.playbackRate = speed;
    });
    
    audios.forEach(audio => {
      audio.playbackRate = speed;
    });
  }

  // Observe for new media elements added to the page
  function observeMediaElements() {
    const observer = new MutationObserver((mutations) => {
      const videos = document.querySelectorAll('video');
      const audios = document.querySelectorAll('audio');
      
      videos.forEach(video => {
        if (video.playbackRate !== currentSpeed) {
          video.playbackRate = currentSpeed;
        }
      });
      
      audios.forEach(audio => {
        if (audio.playbackRate !== currentSpeed) {
          audio.playbackRate = currentSpeed;
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setSpeed') {
      applySpeed(request.speed);
      sendResponse({ success: true });
    } else if (request.action === 'getSpeed') {
      sendResponse({ speed: currentSpeed });
    }
    return true;
  });

  // Load saved speed on page load
  chrome.storage.sync.get(['playbackSpeed'], (result) => {
    const savedSpeed = result.playbackSpeed || 1.0;
    applySpeed(savedSpeed);
  });

  // Apply speed to existing media elements
  function initializeMedia() {
    applySpeed(currentSpeed);
    
    // Also listen for new media elements being loaded
    document.addEventListener('play', (e) => {
      if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') {
        e.target.playbackRate = currentSpeed;
      }
    }, true);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeMedia();
      observeMediaElements();
    });
  } else {
    initializeMedia();
    observeMediaElements();
  }

  // Handle dynamically loaded content after initial page load (e.g., YouTube, Netflix)
  setTimeout(() => {
    applySpeed(currentSpeed);
  }, 1000);

  // Re-apply speed periodically to catch any media that might have been reset
  setInterval(() => {
    applySpeed(currentSpeed);
  }, 1000);
})();

