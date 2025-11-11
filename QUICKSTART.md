# Mindful Social - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Icons ✅
The icons have already been generated in the `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

### Step 2: Load Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `SocialMindful` folder
5. Done! 🎉

### Step 3: First Use
1. Click the Mindful Social extension icon (purple "M")
2. Read and accept the consent modal
3. Start browsing social media to generate data

## What Gets Tracked?

### Automatic Tracking
✅ Instagram, YouTube, Twitter/X, TikTok, Reddit
✅ Time spent per session
✅ Scroll intensity
✅ Check-ins when scrolling too long

### Smart Check-ins
Triggered when:
- Scrolling continuously for 10+ minutes
- Scroll rate exceeds 300 px/second (doomscrolling)

## Using the Extension

### Popup (Click Icon)
- See today's activity for each app
- Quick mood check-in (😊 😐 😩)
- Access settings or delete data

### Settings (Right-click Icon → Options)
- Adjust daily goals
- Set check-in intervals
- Export or delete all data
- View overall statistics

## Data Privacy

- ✅ All data stored locally on your device
- ✅ No data transmitted externally
- ✅ Full control - delete anytime
- ✅ Consent required before tracking

## Files Overview

```
SocialMindful/
├── manifest.json          → Extension config (Manifest v3)
├── background.js          → Tracking & storage logic
├── content.js             → Scroll detection
├── popup.html/js          → Main UI
├── options.html/js         → Settings page
├── styles.css             → Additional styling
├── icons/                 → Extension icons
├── README.md              → Full documentation
├── ARCHITECTURE.md        → Technical details
├── INSTALLATION.md        → Setup instructions
└── QUICKSTART.md          → This file
```

## Troubleshooting

**Extension won't load?**
- Check all files are in the folder
- Ensure icons exist in `icons/` folder
- Look for errors in `chrome://extensions/`

**No data showing?**
- Visit a tracked social media site
- Make sure consent was granted
- Scroll around to generate activity

**Need help?**
- See `README.md` for full documentation
- See `ARCHITECTURE.md` for technical details
- See `INSTALLATION.md` for setup help

## Next Steps

1. **Test it out**: Visit Instagram or YouTube, scroll for 10+ minutes
2. **Check results**: Click the extension icon to see your stats
3. **Customize**: Open settings to adjust goals and intervals
4. **Review data**: Export your data to see your habits

## Customization

Want to modify the extension?

### Add more sites
Edit `manifest.json` → `host_permissions`

### Change thresholds
Edit `content.js`:
- `scrollThreshold` (default: 300)
- `CONTINUOUS_SCROLL_THRESHOLD` (default: 10 minutes)

### Adjust UI
Edit `popup.html` or `options.html` with Tailwind classes

### Enable AI
Implement `sendToAI()` in `background.js` for Hugging Face integration

---

**Ready to start? Load the extension and enjoy mindful social media usage!** 🌸








