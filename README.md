# Mindful Social - Chrome Extension

A Chrome Extension (Manifest v3) that helps you monitor your social media habits and practice digital mindfulness with gentle check-ins.

## 🌸 Features

- **Time Tracking**: Automatically tracks time spent on Instagram, YouTube, Twitter/X, TikTok, and Reddit
- **Scroll Detection**: Monitors scrolling intensity and continuous scrolling patterns to detect doomscrolling
- **Mindful Check-ins**: Provides gentle reminders to take breaks when scrolling for too long
- **Mood Tracking**: Quick mood check-in buttons (😊 Inspired / 😐 Okay / 😩 Drained)
- **Local Storage**: All data stored locally on your device - nothing transmitted externally
- **Privacy-First**: Consent-based tracking with full control over your data

## 📁 File Structure

```
SocialMindful/
├── manifest.json          # Extension configuration (Manifest v3)
├── background.js          # Service worker for tracking logic
├── content.js            # Detects scrolling and tab events
├── popup.html            # Main popup UI
├── popup.js              # Popup logic and data display
├── options.html          # Settings page
├── options.js            # Settings and data management
├── styles.css            # Additional styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🚀 Installation

### Setup Icons

1. Create an `icons` folder in the project directory
2. Add three PNG icon files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

You can create simple icons or use an icon generator.

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `SocialMindful` folder
5. The extension will appear in your extensions list

## 🎯 How It Works

### Background Tracking
- `background.js` monitors tab changes and tracks time spent on social media domains
- Detects when you switch between social media sites
- Stores data locally using `chrome.storage.local`

### Scroll Detection
- `content.js` injects into tracked social media sites
- Monitors scroll events and calculates scroll rate
- Detects "doomscrolling" patterns (fast, continuous scrolling)
- Triggers check-in prompts when:
  - Scrolling continuously for 10+ minutes
  - Scroll rate exceeds threshold (300px/second)

### Check-in Logic

**Smart Check-ins** are triggered when:
1. **Time-based**: User scrolls continuously for more than 10 minutes
2. **Intensity-based**: Scroll rate exceeds threshold (detects doomscrolling)

When triggered, a friendly notification appears asking "How are you feeling?"

### Data Storage

Tracking data is stored with the following schema:

```javascript
{
  date: "2024-01-15",              // ISO date string
  domain: "instagram.com",         // Site domain
  app_name: "Instagram",           // Display name
  duration_minutes: 45.5,           // Time spent in minutes
  scroll_rate: 250,                 // Pixels per second
  checkins_triggered: 2,            // Number of check-ins
  mood: "inspired"                  // User's mood (optional)
}
```

## 🎨 User Interface

### Popup (`popup.html`)

- **Consent Modal**: Shown on first launch asking for permission to track locally
- **Today's Activity**: Shows time spent on each social app today
- **Mindful Break Button**: Opens a break page (or can be customized)
- **Mood Buttons**: Quick mood check-in
- **Settings & Delete Data**: Quick access to settings

### Settings Page (`options.html`)

- **Privacy Toggle**: Enable/disable tracking
- **Daily Goals**: Set max daily social media time and check-in intervals
- **Data Export**: Download your tracking data as JSON
- **Data Deletion**: Clear all stored data
- **Statistics**: View overall tracking statistics

## 🔒 Privacy & HAI Principles

### Human-AI Interaction (HAI) Compliance

1. **Consent Modal**: On first launch, asks for explicit consent to track locally
2. **Local-Only Storage**: All data stored on device, never transmitted
3. **Delete Data**: Easy one-click data deletion
4. **Transparency**: Clear explanation of what's being tracked

### Data Privacy

- ✅ All data stored locally in `chrome.storage.local`
- ✅ No external API calls
- ✅ No data transmission
- ✅ User has full control over data
- ✅ Can be deleted anytime

## 🧪 Configuration

### Adjustable Settings

**In `content.js`:**
```javascript
const scrollThreshold = 300; // pixels per second (doomscrolling threshold)
const CONTINUOUS_SCROLL_THRESHOLD = 10 * 60 * 1000; // 10 minutes
```

**In Settings Page:**
- Daily time limit
- Check-in interval
- Consent toggle

## 🔮 Future Enhancements (Bonus)

The `sendToAI()` function in `background.js` is a placeholder for future AI integration:

```javascript
async function sendToAI(context) {
  // TODO: Implement AI integration with Hugging Face
  // Could provide empathetic, personalized check-in messages
}
```

Possible implementations:
- Connect to Hugging Face inference API for empathetic responses
- Personalized check-in messages based on usage patterns
- Smart suggestions for digital wellness

## 🛠️ Development

### Making Changes

1. Edit files in the project directory
2. Go to `chrome://extensions/`
3. Click the reload icon on the extension card
4. Test your changes

### Testing

- Use Chrome DevTools for debugging
- Check `chrome://extensions/` for service worker logs
- Use console in popup and options pages

## 📝 Notes

- **Manifest v3**: Uses service workers instead of background pages
- **Tailwind CSS**: Included via CDN in HTML files
- **Permissions**: Only requests minimum necessary permissions
- **Cross-browser**: Can be adapted for Edge, Firefox with minor changes

## 🤝 Contributing

This is a standalone extension. Feel free to:
- Adjust tracking thresholds
- Add more social media sites to track
- Customize the UI and styling
- Implement the AI integration
- Add new features and metrics

## 📄 License

This project is provided as-is for educational and personal use.

---

Built with ❤️ to promote digital wellness and mindful social media usage.


