# Mindful Social - Debugging Guide

## Issues Fixed

### Issue: No Visual Check-in Indicator
**Problem**: Check-in count increases but no overlay appears on screen.

**Root Causes**:
1. Message listener might not be set up early enough
2. Content script not properly loaded
3. Silent errors preventing overlay display
4. Timing issues between background and content scripts

**Solutions Implemented**:
1. ✅ Moved message listener to top of content.js (loads immediately)
2. ✅ Added extensive console logging throughout
3. ✅ Added error handling and fallback notifications
4. ✅ Made `showCheckInIndicator()` globally available for testing
5. ✅ Added duplicate overlay prevention
6. ✅ Added document.body check before creating overlay

## How to Debug

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Click the **reload** button 🔄
4. **Important**: After reloading, close and reopen all tabs on tracked sites!

### Step 2: Check Content Script is Loaded
1. Visit YouTube or Instagram
2. Open DevTools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Look for this message:
   ```
   Mindful Social content script initialized on youtube.com
   ```

### Step 3: Test the Overlay Manually
In the Console tab, type:
```javascript
window.mindfulShowCheckIn()
```
**Expected**: A white overlay appears in the top-right corner with "🌸 Mindful Check-in"

### Step 4: Test Actual Check-in
1. Set check-in interval to 2 minutes in settings
2. Visit YouTube or Instagram
3. Wait 2 minutes (keep the tab active)
4. Open Console (F12) before the 2 minutes are up
5. Watch for these logs:
   ```
   Content script received message: SHOW_CHECKIN_OVERLAY
   Showing check-in overlay...
   showCheckInIndicator() called
   Check-in overlay shown successfully
   ```
6. **Expected**: Overlay appears on page

### Step 5: Check Background Script Logs
1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Click on "service worker" or "Inspect views: background"
4. Look for logs like:
   ```
   Started tracking: youtube.com (check-in every 2 min)
   Sending check-in message to tab 123
   Check-in message sent successfully: {success: true}
   ```

## Common Issues & Solutions

### Issue: "Could not send message to tab"
**Cause**: Content script not injected or tab closed.

**Solution**:
- Reload the extension
- Close and reopen the tab on the tracked site
- Check if content.js is listed in the "Inspect views"

### Issue: "document.body is not ready"
**Cause**: Overlay created before DOM is ready.

**Solution**:
- Wait for page to fully load before testing
- Try running the test after page is fully loaded

### Issue: Overlay appears but very small/invisible
**Cause**: CSS conflicts with site styles.

**Solution**:
- Check z-index is 999999
- Try increasing the z-index even more
- Open DevTools and inspect the overlay element

### Issue: Overlay appears multiple times
**Cause**: Message sent multiple times or not clearing previous overlay.

**Solution**: 
- Fixed in code - overlay removed before creating new one
- Should only appear once per check-in

## Testing the Dynamic Check-in Interval

### How It Works Now

1. **User sets check-in interval** in Options:
   - Open Options (right-click extension → Options)
   - Set "Check-in reminder interval (minutes)"
   - Range: 5-120 minutes
   - Default: 30 minutes
   - Click "Save Goals"

2. **When user visits a tracked site**:
   - Extension reads the `checkinInterval` setting
   - Creates chrome.alarm with that interval
   - Console shows: "Started tracking: youtube.com (check-in every 2 min)"

3. **After the interval passes**:
   - Alarm triggers
   - Verification: Checks if user still on tracked site
   - Shows overlay if verification passes

### To Test:
```javascript
// In Console on tracked site:
// 1. Check current settings
chrome.storage.local.get(['checkinInterval'], (result) => {
  console.log('Check-in interval:', result.checkinInterval, 'minutes');
});

// 2. Set to 1 minute for quick testing
chrome.storage.local.set({checkinInterval: 1}, () => {
  console.log('Set to 1 minute');
});

// 3. Reload the extension and refresh the page
// 4. Wait 1 minute
// 5. Overlay should appear
```

## Manual Test Commands

### Test Overlay Directly
```javascript
// In Console on tracked site
window.mindfulShowCheckIn()
```

### Check Current Tracking State
```javascript
// In background.js console
chrome.storage.local.get(['trackingSession'], (result) => {
  console.log('Tracking session:', result.trackingSession);
});

// Check active tab
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  console.log('Active tab:', tabs[0]);
});
```

### Force a Check-in
```javascript
// In background.js console
chrome.alarms.create('test_checkin', {delayInMinutes: 0.001});

// Or manually trigger
handleCheckIn('time');
```

## Expected Behavior

### When Check-in Triggers:
1. ✅ Background: Console logs "Check-in alarm triggered"
2. ✅ Background: Console logs "Sending check-in message to tab X"
3. ✅ Content: Console logs "Content script received message: SHOW_CHECKIN_OVERLAY"
4. ✅ Content: Console logs "Showing check-in overlay..."
5. ✅ Visual: White overlay appears top-right of page
6. ✅ System: Chrome notification appears (if permission granted)
7. ✅ Data: Check-in count increments in popup

### If No Overlay Appears:
1. Check Console for errors
2. Check background console for sendMessage errors
3. Verify content script is loaded (look for initialization message)
4. Try manual test: `window.mindfulShowCheckIn()`
5. Check if tab is still on tracked domain
6. Verify consent is granted in settings

## Troubleshooting Checklist

- [ ] Extension reloaded after changes
- [ ] Tabs closed and reopened on tracked sites
- [ ] Content script shows "initialized" message in console
- [ ] Settings show consent is granted
- [ ] Check-in interval is set in Options
- [ ] Background console shows "Started tracking"
- [ ] No errors in Console
- [ ] ActiveTabId is not null in background logs
- [ ] Manual test works: `window.mindfulShowCheckIn()`
- [ ] Chrome notifications permission granted

## Next Steps

1. **Reload extension**: chrome://extensions/
2. **Set check-in to 2 minutes** in Options
3. **Open YouTube in a new tab**
4. **Open Console** (F12) to watch for messages
5. **Wait 2 minutes** (keep tab active)
6. **Watch Console** for logs
7. **Look for overlay** on page

---

**Date**: 2024
**Status**: ✅ Debugging features added, ready to test








