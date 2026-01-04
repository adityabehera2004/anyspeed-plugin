# AnySpeed

Chrome extension that allows you to control the playback speed of HTML5 video and audio elements on any website. Works with YouTube, Netflix, or any other site that uses HTML5 media elements.

The extension injects a content script that finds all `<video>` and `<audio>` elements and sets their `playbackRate` to your selected speed. It monitors for dynamically loaded content and re-applies the speed if any media elements are reset.

## How to Install

1. Clone this repository
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" switch in the top-right corner
4. Click "Load unpacked" button and select the directory