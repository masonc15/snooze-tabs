# Tab Snoozer - Firefox Version

This is the Firefox-compatible version of Tab Snoozer. The extension allows you to temporarily close tabs and have them automatically reopen at a scheduled time.

## Installation

### For Development/Testing

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to this folder and select the `manifest.json` file
5. The extension will be loaded and ready to use

### For Production

To package for the Firefox Add-ons store:

1. Create a ZIP file containing all extension files:
   ```bash
   zip -r tab-snoozer-firefox.zip manifest.json sw.js popup.js popup.html icon.png
   ```

2. Submit to Firefox Add-ons: https://addons.mozilla.org/developers/

## Features

- Quick snooze options (10 minutes, 1 hour, etc.)
- Smart context-aware suggestions based on time of day
- Custom date/time picker
- Recurring snoozes (daily, weekly, specific days)
- Manage snoozed tabs with easy removal options

## Browser Compatibility

This version is compatible with:
- Firefox 109 and later (Manifest V3 support)
- Also works in Chrome/Edge with the browser compatibility layer

## Important: Firefox Background Script Behavior

### Background Script Suspension
Firefox suspends inactive background scripts after ~30 seconds to save resources. The extension handles this with:

- **Keepalive Mechanism**: A heartbeat alarm fires every 15 seconds to keep the script active
- **Automatic Recovery**: When the script wakes up, it automatically recreates all alarms from storage
- **Periodic Checks**: A backup alarm runs every 5 minutes to ensure no snoozes are missed

### Alarm Persistence
**Firefox Limitation**: Unlike Chrome, Firefox does NOT persist alarms when the browser is closed. However, this extension includes a workaround:

- **Solution Implemented**: The extension stores all snooze data in `browser.storage.local` and recreates alarms when Firefox restarts
- **What this means**: Your snoozed tabs WILL reopen correctly even if Firefox is closed for days
- **How it works**:
  1. When Firefox starts, the extension checks stored snoozes
  2. Any snoozes that expired while Firefox was closed will open immediately
  3. Future snoozes are re-scheduled with new alarms

## Changes from Chrome Version

Key changes made for Firefox compatibility:
- Added Firefox-specific settings to manifest.json
- Implemented browser namespace compatibility layer
- Added alarm persistence workaround for browser restarts
- Implemented keepalive mechanism to prevent background script suspension
- Added periodic fallback checks using alarms instead of setInterval
- All functionality remains identical to Chrome version

## Development Notes

The extension uses a browser compatibility layer that automatically detects whether to use `chrome.*` or `browser.*` APIs, making it work seamlessly in both Chrome and Firefox.