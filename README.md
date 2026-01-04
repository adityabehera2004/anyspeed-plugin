# AnySpeed

Chrome extension that controls the playback speed of HTML5 video and audio elements on any website. Works with YouTube, Netflix, or any other site that uses HTML5 media elements.

The extension injects a content script that continuously searches for all `<video>` and `<audio>` elements and changes their `playbackRate` to the selected speed. It also searches in the shadow DOM to apply the speed up to dynamically loaded content.

## Get Extension
[Download the Chrome extension here]()

## How to Install

1. Clone this repository
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" switch in the top-right corner
4. Click "Load unpacked" button and select the directory
