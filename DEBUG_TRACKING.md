# Debug Guide for Time Tracking

## What I Fixed

1. ✅ **Added comprehensive logging** - You can now see exactly what's happening
2. ✅ **Fixed interval restoration** - The periodic save interval now restarts after service worker restarts
3. ✅ **Enhanced debugging** - Both background.js and popup.js now log their actions

## How to Debug

### Step 1: Enable Tracking
1. Right-click extension → Options
2. Enable "Local tracking" checkbox
3. Save settings

### Step 2: Open Chrome DevTools
1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Click **"Inspect views: service worker"** (this opens background console)
4. Keep this console open

### Step 3: Visit YouTube
1. Open a new tab or refresh existing YouTube tab
2. Watch the console logs - you should see:
   ```
   📋 Tab updated: [tabId] complete [url]
   🔍 Domain extracted: youtube.com Is tracked? true
   🚀 Starting tracking for youtube.com on tab [id]
   🎬 startTracking called: tabId=[id], domain=youtube.com
   ✅ Consent granted, proceeding with tracking
   ✅ Tracking state initialized: ...
   ✅ Started tracking: youtube.com (check-in alarm set for X minutes)
   ```

### Step 4: Wait 1-2 Minutes
1. Stay on YouTube page
2. Every 30 seconds you should see:
   ```
   Periodic save: +0.50 minutes on youtube.com (total session: X.XX min)
   💾 storeTrackingData: domain=youtube.com, duration=0.50min, date=2024-XX-XX
   📦 Existing tracking data entries: X
   ➕ Added new entry: YouTube - 0.50min
   💾 Saved tracking data: X total entries
   ```

### Step 5: Check Popup
1. Click the extension icon
2. Open browser console (F12) → Console tab
3. You should see:
   ```
   📊 Loading tracking data in popup...
   📦 Total tracking entries in storage: X
   📅 Today's date: 2024-XX-XX
   📊 Today's entries: X [array of entries]
   ✅ Found X entries for today, displaying stats
   ```

## Common Issues & Fixes

### Issue: "No social media activity" in popup

**Check:**
1. Is consent granted? → Check service worker console for "⛔ consent not granted"
2. Is tracking starting? → Look for "🚀 Starting tracking" message
3. Is data being saved? → Look for "💾 storeTrackingData" messages every 30 seconds
4. Is popup reading data? → Check popup console for "📊 Today's entries"

**Fixes:**
- If no "Starting tracking" message → Refresh the YouTube tab
- If no periodic saves → Check if interval is running (should see logs every 30s)
- If popup shows 0 entries → Check date format matches (should be YYYY-MM-DD)

### Issue: Console shows "Tracking disabled: consent not granted"

**Fix:**
- Go to Settings → Enable "Local tracking" → Save

### Issue: Console shows domain but "Is tracked? false"

**Fix:**
- Check URL format - should be `youtube.com`, `instagram.com`, etc.
- Check TRACKED_DOMAINS in background.js includes your site

### Issue: No periodic save logs

**Fix:**
- Service worker might have restarted → Check if interval was restored
- Look for "✅ Restarted periodic save interval" message
- If missing, manually refresh the page to restart tracking

## Manual Test Commands

In service worker console, you can run:
```javascript
// Check current tracking state
chrome.storage.local.get(['trackingSession', 'consentGranted'], console.log);

// Check stored tracking data
chrome.storage.local.get(['trackingData'], result => {
  console.log('All entries:', result.trackingData);
  const today = new Date().toISOString().split('T')[0];
  const todayData = result.trackingData.filter(e => e.date === today);
  console.log('Today entries:', todayData);
});
```

---

**Status**: All logging added, interval restoration fixed. Use the console logs to diagnose what's happening!



