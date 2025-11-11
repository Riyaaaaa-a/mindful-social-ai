# Installation Guide - Mindful Social Chrome Extension

## Quick Start

### 1. Generate Icons

First, you need to create the extension icons:

1. Open `icons/generate_icons.html` in your browser
2. Click "Generate Icons" if needed
3. Right-click each canvas and save as:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
4. Save all three files in the `icons/` folder

Alternatively, you can create your own icons using any image editor:
- Create square PNG images (16x16, 48x48, 128x128)
- Use a blue-purple gradient background
- Add a white "🌸" emoji or "M" letter in the center

### 2. Load the Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right corner)
4. Click "Load unpacked"
5. Select the `SocialMindful` folder (the folder containing `manifest.json`)
6. The extension should now appear in your extensions list

### 3. First Launch

1. Click the Mindful Social extension icon in your Chrome toolbar
2. You'll see a consent modal asking for permission to track locally
3. Click "Yes, I agree" to enable tracking
4. The popup will now show your social media activity

## Features Overview

### Popup (Extension Icon Click)

- **Today's Activity**: See time spent on each social media app
- **Mindful Break Button**: Opens break page (customize as needed)
- **Mood Check-in**: Quick buttons to record how you're feeling
- **Settings**: Access to options page
- **Delete Data**: Clear all stored data

### Settings Page

- Access via popup "Settings" button or right-click extension > Options
- Configure daily goals and check-in intervals
- Export or delete your data
- View overall statistics

## How Tracking Works

The extension automatically tracks time spent on:

- Instagram (instagram.com)
- YouTube (youtube.com)
- Twitter/X (twitter.com, x.com)
- TikTok (tiktok.com)
- Reddit (reddit.com)

### Automatic Check-ins

You'll receive gentle check-in prompts when:

1. **Continuous Scrolling**: Scrolling for more than 10 minutes without stopping
2. **Doomscrolling Detected**: Scroll rate exceeds threshold (300px/second)

A friendly notification appears asking "How are you feeling?"

## Troubleshooting

### Extension not loading
- Make sure all files are in the correct location
- Check for errors in `chrome://extensions/` (error icon on extension)
- Ensure icons exist in `icons/` folder

### No data showing
- Check if consent was granted in the popup
- Visit a tracked social media site to generate data
- Verify the site is in the tracked list (Instagram, YouTube, etc.)

### Service worker errors
- Check console in `chrome://extensions/` for service worker logs
- Reload the extension if needed

## Uninstall

1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Click "Remove"
4. All data is cleared (or use "Delete Data" button before uninstalling)

## Data Storage

All data is stored locally in your browser using `chrome.storage.local`. No data is transmitted externally.

To verify your data:
1. Open Settings page
2. Click "Export Data" to download JSON file
3. Or use Chrome DevTools to inspect storage

## Privacy

- All tracking is local only
- No external API calls
- No data transmission
- Full control over your data
- Can delete anytime

For questions or issues, refer to the main `README.md` file.








