# Troubleshooting Checklist - Content Script Not Loading

## CRITICAL: Check These First

### Step 1: Verify Content Script is Actually Loading

Go to YouTube and press F12, then check Console.

**Do you see ANY of these messages?**
- [ ] `🤖 Mindful Social content script STARTING on: youtube.com`
- [ ] `About to assign showCheckInIndicator to window...`
- [ ] `✅ After assignment - typeof window.mindfulShowCheckIn:`

**If you see NONE of these**, the content script is NOT loading. Continue below.

**If you see SOME of these**, share which ones you see and what comes after.

### Step 2: Check for Content Script Errors

1. Go to YouTube
2. Press F12 → Console tab
3. Look for any RED error messages
4. Do you see any errors about:
   - Content script errors?
   - Syntax errors?
   - Missing files?

**If yes**: Share the error message.

### Step 3: Verify Extension is Active

1. Go to `chrome://extensions/`
2. Find "Mindful Social"
3. Is it enabled? (Toggle should be ON/Blue)
4. Click "service worker" to open background console
5. Check for errors there

### Step 4: Check if Files Exist

The extension needs these files:
- [ ] manifest.json
- [ ] content.js
- [ ] background.js
- [ ] icons/icon16.png
- [ ] icons/icon48.png
- [ ] icons/icon128.png

Run this command to check:
```bash
ls -la *.js *.json icons/*.png
```

### Step 5: Manually Test Content Script Loading

1. Open a NEW incognito window
2. Go to YouTube
3. Press F12 → Console
4. Type: `console.log('Test')` 
5. Does it work?

If basic console works but content script doesn't load, it's an injection issue.

### Step 6: Check Manifest Content Scripts Config

The manifest.json must have:
```json
"content_scripts": [
  {
    "matches": ["https://www.youtube.com/*", ...],
    "js": ["content.js"]
  }
]
```

## Most Likely Causes

1. **Extension not reloaded** - Must reload after code changes
2. **Page not refreshed** - Old tabs don't get new content scripts
3. **Syntax error** - Content script has an error preventing execution
4. **Wrong domain** - Not on a tracked domain (must be youtube.com, not youtube.com/shorts)
5. **Extension disabled** - Toggle is off

## Quick Test

**In the YouTube console, type:**
```javascript
console.log('Can you see this?');
```

If YES: Console works, issue is with content script loading
If NO: You're in the wrong console (check DevTools is open on the right page)

---

**Please complete Step 1 first and share the results!**








