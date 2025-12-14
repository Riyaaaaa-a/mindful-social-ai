# Mindful Social - Architecture Overview

This document explains how all the components of the Mindful Social Chrome Extension work together.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────┐   │
│  │  Service     │  │   Content        │  │   Popup     │   │
│  │  Worker      │◄─┤   Script         │  │   UI        │   │
│  │ (background) │  │ (injected into   │  │             │   │
│  │              │  │  social sites)   │  │             │   │
│  └──────┬───────┘  └──────────────────┘  └─────────────┘   │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────┐                                         │
│  │  chrome.     │                                         │
│  │  storage.    │                                         │
│  │  local       │                                         │
│  └──────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

## File Breakdown

### 1. manifest.json
**Purpose**: Extension configuration following Manifest v3 specifications.

**Key Elements**:
- `permissions`: `storage`, `tabs`, `activeTab`, `alarms`
- `host_permissions`: Social media domains to track
- `background.service_worker`: Runs background.js as a service worker
- `content_scripts`: Injects content.js into tracked domains
- `action.default_popup`: Points to popup.html

**Why Manifest v3**: More secure, efficient, and privacy-focused compared to v2.

---

### 2. background.js
**Purpose**: Service worker that handles tracking logic, data storage, and system events.

**Key Functions**:

#### Tracking Functions
```javascript
startTracking(tabId, domain)    // Begin tracking a session
stopTracking()                  // End session and save data
```

#### Data Storage
```javascript
storeTrackingData()  // Store/update tracking entries in chrome.storage.local
```

#### Check-in Logic
```javascript
handleCheckIn(reason)  // Triggered when content script detects doomscrolling
```

#### AI Integration (Placeholder)
```javascript
sendToAI(context)  // Future connection to Hugging Face
```

**Event Listeners**:
- `tabs.onUpdated`: Track tab navigation
- `tabs.onActivated`: Track tab switching
- `tabs.onRemoved`: Clean up on tab close
- `runtime.onMessage`: Receive messages from content script
- `alarms.onAlarm`: Handle scheduled check-ins
- `runtime.onInstalled`: First-time setup

**Data Schema**:
```javascript
{
  date: "2024-01-15",
  domain: "instagram.com",
  app_name: "Instagram",
  duration_minutes: 45.5,
  scroll_rate: 250,
  checkins_triggered: 2,
  mood: "inspired"  // from user input
}
```

---

### 3. content.js
**Purpose**: Injected into tracked social media sites to detect user behavior.

**Key Features**:

#### Scroll Detection
```javascript
handleScroll()           // Track scroll events
isDoomScrolling()         // Check if scroll rate > threshold
hasBeenScrollingTooLong() // Check if scrolling > 10 mins
```

#### Check-in Triggers
- Continuous scrolling for 10+ minutes → `requestCheckIn('time')`
- Scroll rate exceeds threshold (300px/sec) → `requestCheckIn('scroll_rate')`

#### Visual Feedback
- Shows overlay notification when check-in is triggered
- Displays friendly message asking user how they're feeling
- Auto-dismisses after 10 seconds

**Communication**: Sends messages to background.js via `chrome.runtime.sendMessage()`

---

### 4. popup.html + popup.js
**Purpose**: Main user interface shown when clicking the extension icon.

**Components**:

#### Consent Modal
- Shown on first launch
- Requests permission for local tracking
- Sets `consentGranted` flag in storage

#### Stats Display
- Loads data from `chrome.storage.local`
- Filters for today's entries
- Groups by app and shows total time
- Updates in real-time

#### Mood Check-in
- Three mood buttons: 😊 Inspired / 😐 Okay / 😩 Drained
- Stores mood in tracking data
- Visual feedback on selection

#### Actions
- **Mindful Break**: Opens break page (customizable)
- **Settings**: Opens options.html
- **Delete Data**: Clears all local storage

**Data Loading**: `loadTrackingData()` fetches and displays today's stats

---

### 5. options.html + options.js
**Purpose**: Settings and data management page.

**Features**:

#### Privacy Settings
- Toggle consent for tracking
- Explanation of data storage

#### Goals Configuration
- Daily time limit (minutes)
- Check-in reminder interval
- Saves to `chrome.storage.local`

#### Data Management
- **Export**: Downloads tracking data as JSON
- **Delete**: Clears all stored data (except consent status)

#### Statistics
- Days tracked
- Total time across all sessions
- Total check-ins triggered
- Average time per day

---

### 6. styles.css
**Purpose**: Additional styling to complement Tailwind CSS.

**Features**:
- Custom animations (`fadeIn`, `slideIn`)
- Scrollbar styling
- Button focus states
- Responsive adjustments
- Hover effects

---

## Data Flow

### 1. Tracking Flow
```
User visits Instagram
    ↓
tabs.onUpdated event fires
    ↓
background.js: startTracking()
    ↓
User scrolls
    ↓
content.js: detect doomscrolling
    ↓
content.js → background.js: CHECK_IN message
    ↓
background.js: handleCheckIn()
    ↓
Create notification + store check-in
```

### 2. Data Display Flow
```
User clicks extension icon
    ↓
popup.js: loadTrackingData()
    ↓
chrome.storage.local.get()
    ↓
Filter for today's data
    ↓
Group by app
    ↓
Display in popup.html
```

### 3. Storage Flow
```
background.js: storeTrackingData()
    ↓
Read existing trackingData array
    ↓
Update or add new entry
    ↓
chrome.storage.local.set({ trackingData })
```

## Communication Patterns

### Content Script → Background
```javascript
chrome.runtime.sendMessage({
  type: 'CHECK_IN',
  reason: 'time' | 'scroll_rate',
  timestamp: Date.now(),
  domain: window.location.hostname
});
```

### Background → UI
Uses `chrome.storage.local` for persistence
- Popup reads data directly from storage
- Options page reads/writes to storage

### UI → Background
Popup/Options interact with background via storage
- Direct storage reads
- Notifications triggered by background script

## Security & Privacy

### Manifest v3 Benefits
- Service workers replace persistent background pages
- Reduced resource usage
- Better security model

### Privacy Implementation
1. **Local-only storage**: `chrome.storage.local`
2. **Consent required**: User must opt-in
3. **Easy deletion**: One-click data removal
4. **No external calls**: All processing local
5. **Transparent**: Clear explanation of what's tracked

### HAI Principles
1. User agency (consent, control)
2. Transparency (clear data usage)
3. Minimal tracking (only what's needed)
4. Easy opt-out (delete data anytime)

## Configuration

### Adjustable Parameters

**In `content.js`:**
```javascript
scrollThreshold = 300;              // pixels/second
CONTINUOUS_SCROLL_THRESHOLD = 10 * 60 * 1000; // 10 minutes
```

**In `popup.js`:**
```javascript
APP_NAMES = {...};   // Display names for apps
APP_ICONS = {...};   // Emoji icons for each app
```

**User-configurable (in options.html):**
- Daily time limit
- Check-in interval
- Consent toggle

## Extension Lifecycle

### Installation
1. User loads extension
2. `runtime.onInstalled` fires
3. Sets `consentGranted: false`

### First Use
1. User clicks extension
2. Consent modal appears
3. User accepts/rejects
4. Sets `consentGranted: true/false`

### Active Tracking
1. Service worker monitors tabs
2. Content script detects scrolling
3. Data stored locally
4. UI displays stats

### Uninstall
1. Service worker terminated
2. All data removed
3. No external traces

## Future Enhancements

### AI Integration
The `sendToAI()` function in `background.js` is ready for:
- Hugging Face inference API
- Personalized check-in messages
- Context-aware suggestions

### Additional Features
- Weekly/monthly reports
- Goal tracking and achievements
- Export to CSV
- Dark mode
- More social platforms

## Testing

### Manual Testing
1. Load extension in developer mode
2. Visit social media sites
3. Scroll for 10+ minutes
4. Verify check-in appears
5. Check popup for stats
6. Test settings page

### Debug Tools
```bash
# Background script logs
chrome://extensions/ → Service Worker → Inspect

# Popup console
Right-click extension icon → Inspect Popup

# Content script logs
Navigate to site → DevTools → Console
```

## Performance Considerations

### Service Worker
- Ephemeral: suspended when not needed
- Event-driven: only active when events occur
- Memory efficient: minimal state

### Storage
- Local storage: fast, synchronous
- Limited size: ~10MB max
- Efficient schema: grouped by date

### Content Script
- Throttled scroll detection: checks every 5 seconds
- Debounced reset: 2 second delay
- Passive scroll listeners: doesn't block

---

This architecture follows Chrome Extension best practices and Manifest v3 specifications for a secure, efficient, and privacy-respecting extension.






















