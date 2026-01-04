// AnySpeed - Chrome Extension
// Controls playback speed of HTML5 video and audio elements

(function() {
  'use strict';

  function getStorage() {
    return new Promise((res, rej) => {
      chrome.storage.sync.get(['playbackSpeed'], items => {
        if (chrome.runtime.lastError) {
          rej(chrome.runtime.lastError);
        } else {
          res(items);
        }
      });
    });
  }

  // Apply speed to all video and audio elements
  function applySpeedToAll(speed) {
    const videos = document.getElementsByTagName('video');
    for (let elem of videos) {
      if (elem.playbackRate !== speed) {
        elem.playbackRate = speed;
      }
    }

    const audios = document.getElementsByTagName('audio');
    for (let elem of audios) {
      if (elem.playbackRate !== speed) {
        elem.playbackRate = speed;
      }
    }

    // Look in shadow DOM for video and audio elements
    document.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        for (let elem of el.shadowRoot.querySelectorAll('video')) {
          if (elem.playbackRate !== speed) {
            elem.playbackRate = speed;
          }
        }
        for (let elem of el.shadowRoot.querySelectorAll('audio')) {
          if (elem.playbackRate !== speed) {
            elem.playbackRate = speed;
          }
        }
      }
    });
  }

  // Continuously apply speed to all media elements
  let currentSpeed = 1.0;
  setInterval(async () => {
    try {
      const items = await getStorage();
      const speed = items['playbackSpeed'] || 1.0;
      if (speed !== currentSpeed) {
        currentSpeed = speed;
      }
      applySpeedToAll(speed);
    } catch (error) {
      console.error('AnySpeed: Error enforcing speed', error);
    }
  }, 100); // this seems to be faster than youtube and netflix resets

  // Initial run
  getStorage().then(items => {
    const speed = items['playbackSpeed'] || 1.0;
    applySpeedToAll(speed);
  });
})();

