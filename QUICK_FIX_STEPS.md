# Quick Fix Steps - Check-in Overlay Not Showing

## The Problem
You're getting: `window.mindfulShowCheckIn is not a function`

## Why This Happens
The content script needs to be **injected into the page**. If you don't see this function, the content script hasn't loaded yet.

## Step-by-Step Fix

### 1. Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Click the **RELOAD** button 🔄 (very important!)
4. Wait for it to finish reloading

### 2. Close ALL Tabs on Tracked Sites
**IMPORTANT**: After reloading, you MUST close and reopen:
- YouTube tabs
- Instagram tabs  
- Twitter/X tabs
- Reddit tabs
- TikTok tabs

**Why?** Because Chrome doesn't re-inject content scripts into already-open tabs.

### 3. Open a New Tab on a Tracked Site
- Go to **YouTube** (www.youtube.com)
- Or **Instagram** (www.instagram.com)
- Wait for page to fully load

### 4. Check if Content Script Loaded
Open Console (F12) and look for these messages:
```
🤖 Mindful Social content script STARTING on: youtube.com
✅ window.mindfulShowCheckIn() is now available for testing
🤖 Mindful Social content script initialized on youtube.com
✅ Content script fully ready! Test with: window.mindfulShowCheckIn()
```

**If you DON'T see these messages**: The extension isn't loading on this page.

### 5. Test the Function
In the Console, type:
```javascript
window.mindfulShowCheckIn()
```

**Expected**: A white overlay appears in the top-right corner with "🌸 Mindful Check-in"

## Troubleshooting

### If You Still Don't See the Console Messages

**Check 1**: Are you on a tracked domain?
- ✅ `www.youtube.com`
- ✅ `www.instagram.com`
- ✅ `twitter.com` or `x.com`
- ✅ `www.tiktok.com`
- ✅ `www.reddit.com`
- ❌ `localhost` - NOT tracked
- ❌ `stackoverflow.com` - NOT tracked

**Check 2**: Did you give consent?
1. Click the extension icon
2. Make sure you clicked "Yes, I agree" in the consent modal

**Check 3**: Is the extension enabled?
1. Go to `chrome://extensions/`
2. Make sure the toggle is **ON** for "Mindful Social"

### If You See the Console Messages But Function Still Doesn't Work

Try this in Console:
```javascript
console.log(typeof window.mindfulShowCheckIn)
```

**Expected**: `function`

**If it says**: `undefined`
- Refresh the page (F5)
- Try again

### Manual Test Without Reloading
If you want to test immediately without reloading:
1. Open a **NEW** incognito window (Ctrl+Shift+N)
2. Enable "Allow in incognito" in chrome://extensions
3. Go to YouTube in that incognito window
4. Try the function

## Expected Behavior

After following these steps:

1. **Console shows**: Content script loaded messages
2. **window.mindfulShowCheckIn() works**: Overlay appears
3. **Actual check-ins work**: After your set interval, overlay appears automatically

## Still Not Working?

Try this diagnostic:
```javascript
// In Console on a tracked site:
console.log('Hostname:', window.location.hostname);
console.log('Extension loaded?', typeof chrome !== 'undefined');
console.log('Content script loaded?', typeof window.mindfulShowCheckIn);
```

Then share these results with me!

---

**Remember**: 
- ✅ Reload extension
- ✅ Close AND reopen tabs on tracked sites
- ✅ Check Console for startup messages
- ✅ Only works on tracked domains (YouTube, Instagram, etc.)








