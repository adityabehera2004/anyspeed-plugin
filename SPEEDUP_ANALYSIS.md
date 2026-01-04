# SpeedUp Extension Analysis

## Overview
This document provides a detailed analysis of the **SpeedUp** Chrome extension (version 3.1.0) that successfully controls video playback speed on sites like YouTube and Netflix. The extension ID is `pldkddbkbcedophgedaeofceedjcaehl`.

## Architecture Overview

The SpeedUp extension uses a **simple but effective architecture**:

1. **Popup UI** (`popup.js`) - User interface for speed selection
2. **Content Script** (`content.js`) - Runs in page context, continuously enforces speed
3. **Script Injection** (`speed_control.js`) - Injected script for immediate speed application
4. **Background Script** (`background.js`) - Empty (not used)

---

## File-by-File Analysis

### 1. `manifest.json`

**Location**: `/manifest.json`

**Key Configuration**:

```json
{
   "manifest_version": 3,
   "name": "SpeedUp: Netflix, Prime videos",
   "version": "3.1",
   "permissions": [ "storage", "scripting" ],
   "host_permissions": [ "<all_urls>" ],
   "content_scripts": [ {
      "js": [ "js/jquery-3.4.1.min.js", "js/content.js" ],
      "matches": [ "<all_urls>" ]
   } ],
   "action": {
      "default_popup": "popup.html"
   }
}
```

**Key Insights**:

1. **Manifest V3**: Uses modern Chrome extension API
2. **Permissions**: 
   - `storage` - For saving speed preference
   - `scripting` - For `chrome.scripting.executeScript` to inject scripts
3. **Host permissions**: `"<all_urls>"` - Works on all websites
4. **Content scripts**: 
   - Runs `content.js` on all pages (`<all_urls>`)
   - Includes jQuery (though it doesn't seem to be used in the code)
5. **Simple structure**: No background service worker needed (background.js is empty)

### 2. `popup.js` - User Interface Logic

**Location**: `/js/popup.js`

**Key Features**:
- Simple slider-based speed control
- Quick-select buttons for common speeds
- Uses `chrome.storage.local` for persistence
- **Critical**: Uses `chrome.scripting.executeScript` to inject `speed_control.js` on every speed change

**Code Analysis**:

```javascript
// Main speed setting function
function setSpeed(speed){
  var speed_display = document.getElementById("speed_display");
  speed_display.innerHTML = speed + "x";
  
  // Save to storage
  chrome.storage.local.set({ speed })
  
  // CRITICAL: Inject script into active tab on EVERY speed change
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["js/speed_control.js"]
    });
  });
}
```

**Key Insights**:
1. **Script injection on every change**: Every time the user changes speed, it re-injects `speed_control.js` into the active tab. This ensures the speed is applied immediately.
2. **Storage-based communication**: Speed is stored in `chrome.storage.local`, which both popup and content scripts can access.
3. **Simple UI**: Uses a slider with ratio of 50 (so slider value 50 = 1.0x speed).

### 3. `content.js` - Continuous Enforcement

**Location**: `/js/content.js`

**This is the KEY file that makes SpeedUp work reliably.**

**Code**:

```javascript
setSpeedAsync = function(){
  function getStorage() {
    return new Promise((res, rej) => {
      chrome.storage.local.get(items => {
        if (chrome.runtime.lastError) {
          rej(chrome.runtime.lastError)
        } else {
          res(items)
        }
        return 
      })
    })
  }

  // CRITICAL: Continuous loop every 2 seconds
  setInterval(async () => {
    const speed = (await getStorage())["speed"] || 1

    // Apply to ALL video elements
    for (let elem of document.getElementsByTagName("video")) {
      elem.playbackRate = speed
    }

    // Apply to ALL audio elements
    for (let elem of document.getElementsByTagName("audio")) {
      elem.playbackRate = speed
    }
  }, 2000)
}

setSpeedAsync();
```

**Key Insights**:

1. **Simple polling approach**: Uses `setInterval` with 2-second intervals to continuously re-apply speed
2. **Direct DOM querying**: Uses `document.getElementsByTagName("video")` - simple but effective
3. **No shadow DOM handling**: Interestingly, this doesn't explicitly handle shadow DOM, yet it works. This suggests:
   - Either YouTube/Netflix's main video elements aren't in shadow DOM
   - Or the polling is frequent enough to catch videos when they're accessible
4. **Storage-based speed source**: Reads speed from `chrome.storage.local` on every iteration
5. **No prototype overrides**: Doesn't try to override setters - just directly sets `playbackRate` repeatedly

**Why This Works**:
- **Frequency beats resistance**: Even if YouTube resets speed every 1-2 seconds, the 2-second interval ensures it gets re-applied quickly
- **Simplicity**: No complex shadow DOM traversal or prototype manipulation that can break
- **Reliability**: Direct assignment is more reliable than trying to intercept setters

### 4. `speed_control.js` - Immediate Application

**Location**: `/js/speed_control.js`

**Code**:

```javascript
setSpeedSync = function(default_rate){
  const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
  sleep(100).then(() => {
    chrome.storage.local.get(['speed'], function(result) {
      document.querySelector('video').playbackRate = result.speed;
      console.log("speed changed to " + result.speed);
    });
  });
}

var target = document.querySelector('video');
console.log(target);
var default_rate = 1;
setSpeedSync(default_rate);
```

**Key Insights**:

1. **Immediate application**: When injected, it waits 100ms then applies speed to the first video element found
2. **Single video focus**: Uses `document.querySelector('video')` - only targets the first video
3. **Synchronous with delay**: Uses a small delay to ensure video element is ready
4. **Storage-based**: Reads speed from `chrome.storage.local`

**Purpose**: This script is injected **on every speed change** from the popup to provide immediate feedback, while `content.js` handles continuous enforcement.

### 5. `background.js`

**Location**: `/js/background.js`

**Status**: Empty file - not used in this extension

---

## Critical Success Factors

### 1. **Dual Enforcement Strategy**

SpeedUp uses **two complementary approaches**:

1. **Immediate injection** (`speed_control.js`): Applied instantly when user changes speed
2. **Continuous polling** (`content.js`): Runs every 2 seconds to catch any resets

This dual approach ensures:
- User sees immediate response
- Speed persists even if site resets it

### 2. **Simple Direct Assignment**

Unlike complex approaches with:
- Prototype overrides
- Shadow DOM traversal
- Event listeners
- requestAnimationFrame loops

SpeedUp uses the **simplest possible approach**:
```javascript
elem.playbackRate = speed
```

This works because:
- It's applied frequently enough (every 2 seconds)
- Direct assignment is more reliable than interception
- No complex code that can break

### 3. **Storage-Based Communication**

All components communicate via `chrome.storage.local`:
- Popup saves speed to storage
- Content script reads from storage every 2 seconds
- Injected script reads from storage when applied

This avoids message passing complexity and ensures all parts stay in sync.

### 4. **Frequent Re-injection**

The popup **re-injects** `speed_control.js` on every speed change:
- Ensures immediate application
- Works even if page structure changes
- No need to track if script is already injected

---

## Comparison with Your Current Approach

### What SpeedUp Does Differently:

1. **No prototype overrides**: SpeedUp doesn't try to intercept setters - it just keeps re-applying
2. **Simpler shadow DOM handling**: Doesn't explicitly traverse shadow DOM (relies on polling frequency)
3. **Slower polling**: 2 seconds vs your requestAnimationFrame (but still effective)
4. **Dual script approach**: Separate immediate injection + continuous enforcement
5. **Storage-only communication**: No postMessage between contexts

### What You Can Learn:

1. **Simplicity wins**: The simplest approach (direct assignment + frequent polling) is often most reliable
2. **Frequency matters**: Even 2-second polling is frequent enough to beat most resets
3. **No need for complex shadow DOM**: If you poll frequently enough, you'll catch videos when accessible
4. **Dual enforcement**: Immediate injection + continuous polling provides best user experience

---

## Recommendations for Your Extension

Based on this analysis, here's what you should consider:

### Option 1: Adopt SpeedUp's Simple Approach

```javascript
// In content.js - simple continuous enforcement
setInterval(() => {
  chrome.storage.sync.get(['playbackSpeed'], (result) => {
    const speed = result.playbackSpeed || 1.0;
    document.querySelectorAll('video, audio').forEach(media => {
      media.playbackRate = speed;
      media.defaultPlaybackRate = speed;
    });
  });
}, 2000); // 2 seconds - proven to work
```

**Pros**:
- Simple and reliable
- No complex shadow DOM code
- Easy to maintain

**Cons**:
- May miss videos in deeply nested shadow DOMs
- 2-second delay before catching resets

### Option 2: Hybrid Approach (Recommended)

Combine SpeedUp's simplicity with your shadow DOM handling:

```javascript
// Fast polling (like SpeedUp) + shadow DOM support (like yours)
function enforceSpeed(speed) {
  // Regular videos
  document.querySelectorAll('video, audio').forEach(media => {
    media.playbackRate = speed;
    media.defaultPlaybackRate = speed;
  });
  
  // Shadow DOM videos (your enhancement)
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      el.shadowRoot.querySelectorAll('video, audio').forEach(media => {
        media.playbackRate = speed;
        media.defaultPlaybackRate = speed;
      });
    }
  });
}

// Fast polling - every 500ms (faster than SpeedUp's 2s)
setInterval(() => {
  chrome.storage.sync.get(['playbackSpeed'], (result) => {
    enforceSpeed(result.playbackSpeed || 1.0);
  });
}, 500);
```

**Pros**:
- Simple like SpeedUp
- Handles shadow DOM (your enhancement)
- Faster than SpeedUp (500ms vs 2000ms)
- No complex prototype manipulation

**Cons**:
- Slightly more complex than pure SpeedUp approach

### Option 3: Keep Your Current Approach but Simplify

Your current approach with requestAnimationFrame + TreeWalker is actually more sophisticated than SpeedUp. However, you could simplify:

1. **Remove prototype overrides** - They're fragile and YouTube can patch them
2. **Keep the RAF loop** - It's faster than SpeedUp's 2-second interval
3. **Simplify shadow DOM search** - Use SpeedUp's simple approach instead of TreeWalker
4. **Remove setter re-application** - Not needed if you're polling fast enough

---

## Key Takeaways

1. **Simplicity is key**: SpeedUp's success comes from its simple approach, not complex interception
2. **Frequency beats complexity**: Frequent direct assignment (every 2s) works better than complex interception
3. **Dual enforcement**: Immediate injection + continuous polling provides best UX
4. **Storage-based sync**: Using storage for communication is simpler than message passing
5. **No prototype magic needed**: Direct assignment with frequent polling is more reliable than setter overrides

## Conclusion

SpeedUp works because it uses the **simplest possible approach** that's **applied frequently enough** to beat site resets. Your extension could benefit from:

1. Simplifying the approach (remove prototype overrides)
2. Using faster polling (500ms-1000ms instead of 2s)
3. Keeping shadow DOM support (your enhancement)
4. Using storage-based communication (simpler than postMessage)

The combination of SpeedUp's simplicity with your shadow DOM handling and faster polling would create a very robust solution.

