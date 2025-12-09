/**
 * Mindful Social - Background Service Worker
 * Handles time tracking, check-in logic, and data storage
 */

// Social media domains to track
const TRACKED_DOMAINS = {
  'instagram.com': 'Instagram',
  'youtube.com': 'YouTube',
  'twitter.com': 'Twitter',
  'x.com': 'Twitter',
  'tiktok.com': 'TikTok',
  'reddit.com': 'Reddit'
};

// Global state for tracking (persisted to storage for service worker restarts)
let activeTabId = null;
let activeDomain = null;
let sessionStartTime = null;
let scrollStartTime = null;
let isActiveScroll = false;
let consentGranted = false;
let trackingInterval = null;
let isPopupActive = false; // Flag to prevent duplicate popups
let lastSaveTime = null; // Track when we last saved for periodic updates

// ---------------- Goals/Actions Helpers ----------------
/**
 * Return all saved goals (initializes defaults if none exist)
 */
async function getGoals() {
  const { goals } = await chrome.storage.local.get(['goals']);
  if (Array.isArray(goals) && goals.length > 0) return goals;
  // initialize defaults only if none exist
  const defaultGoals = [
    { id: 'g1', label: 'Limit social media to 60 min/day' },
    { id: 'g2', label: 'Take 3 mindful breaks per day' },
    { id: 'g3', label: 'Avoid scrolling after 10pm' }
  ];
  await chrome.storage.local.set({ goals: defaultGoals });
  return defaultGoals;
}

/**
 * Add or update a goal by id
 */
async function saveGoal(goal) {
  if (!goal || !goal.id || !goal.label) return;
  const goals = await getGoals();
  const idx = goals.findIndex(g => g.id === goal.id);
  if (idx >= 0) {
    goals[idx] = { ...goals[idx], ...goal };
  } else {
    goals.push({ id: goal.id, label: goal.label });
  }
  await chrome.storage.local.set({ goals });
  return goals;
}

/**
 * Delete a goal by id
 */
async function deleteGoal(id) {
  if (!id) return;
  const goals = await getGoals();
  const filtered = goals.filter(g => g.id !== id);
  await chrome.storage.local.set({ goals: filtered });
  return filtered;
}

/**
 * Ensure actions key exists (no defaults required by spec)
 */
async function ensureActionsInitialized() {
  const { actions } = await chrome.storage.local.get(['actions']);
  if (!Array.isArray(actions)) {
    await chrome.storage.local.set({ actions: [] });
  }
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

/**
 * Check if a domain is tracked
 */
function isTrackedDomain(domain) {
  for (const trackedDomain in TRACKED_DOMAINS) {
    if (domain.includes(trackedDomain)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the app name from domain
 */
function getAppName(domain) {
  for (const trackedDomain in TRACKED_DOMAINS) {
    if (domain.includes(trackedDomain)) {
      return TRACKED_DOMAINS[trackedDomain];
    }
  }
  return domain;
}

/**
 * Store tracking data in chrome.storage.local
 */
async function storeTrackingData(domain, durationMinutes, scrollRate, checkinsTriggered, mood = null) {
  const date = getTodayDate();
  
  console.log(`💾 storeTrackingData: domain=${domain}, duration=${durationMinutes.toFixed(2)}min, date=${date}`);
  
  try {
    // Get existing data
    const result = await chrome.storage.local.get(['trackingData']);
    const trackingData = result.trackingData || [];
    
    console.log(`📦 Existing tracking data entries: ${trackingData.length}`);
    
    // Create new entry
    const entry = {
      date: date,
      domain: domain,
      app_name: getAppName(domain),
      duration_minutes: durationMinutes,
      scroll_rate: scrollRate,
      checkins_triggered: checkinsTriggered,
      mood: mood
    };
    
    // Add or update entry for today
    const todayIndex = trackingData.findIndex(entry => entry.date === date && entry.domain === domain);
    
    if (todayIndex !== -1) {
      // Update existing entry
      const oldMinutes = trackingData[todayIndex].duration_minutes;
      trackingData[todayIndex].duration_minutes += durationMinutes;
      trackingData[todayIndex].scroll_rate = Math.max(trackingData[todayIndex].scroll_rate, scrollRate);
      trackingData[todayIndex].checkins_triggered += checkinsTriggered;
      if (mood) {
        trackingData[todayIndex].mood = mood;
      }
      console.log(`✅ Updated entry: ${oldMinutes.toFixed(2)}min → ${trackingData[todayIndex].duration_minutes.toFixed(2)}min`);
    } else {
      // Add new entry
      trackingData.push(entry);
      console.log(`➕ Added new entry: ${entry.app_name} - ${durationMinutes.toFixed(2)}min`);
    }
    
    // Store back
    await chrome.storage.local.set({ trackingData });
    console.log(`💾 Saved tracking data: ${trackingData.length} total entries`);
  } catch (error) {
    console.error('❌ Error storing tracking data:', error);
  }
}

/**
 * Start tracking a social media session
 */
async function startTracking(tabId, domain) {
  console.log(`🎬 startTracking called: tabId=${tabId}, domain=${domain}`);
  
  if (!isTrackedDomain(domain)) {
    console.log('❌ Domain not tracked:', domain);
    return;
  }
  
  // Check consent before starting
  const consentResult = await chrome.storage.local.get(['consentGranted']);
  if (!consentResult.consentGranted) {
    console.log('❌ Tracking not started: consent not granted');
    return;
  }
  
  console.log('✅ Consent granted, proceeding with tracking');
  
  // Stop any existing tracking
  await stopTracking();
  
  activeTabId = tabId;
  activeDomain = domain;
  sessionStartTime = Date.now();
  scrollStartTime = Date.now();
  
  console.log(`✅ Tracking state initialized: activeTabId=${tabId}, activeDomain=${domain}, sessionStartTime=${sessionStartTime}`);
  
  // Save session state to storage for persistence across service worker restarts
  await chrome.storage.local.set({
    trackingSession: {
      activeTabId: tabId,
      activeDomain: domain,
      sessionStartTime: sessionStartTime
    }
  });
  
  // Reset popup flag for new session (new tab/site = new session)
  isPopupActive = false;
  
  // Get user's check-in interval setting
  const settings = await chrome.storage.local.get(['checkinInterval']);
  const checkInMinutes = parseInt(settings.checkinInterval) || 30; // Default 30 minutes, ensure it's a number
  
  // Clear any existing alarm first
  await chrome.alarms.clear('check_in_reminder');
  
  // Create alarm for check-in reminder (ONCE per session, not periodic)
  chrome.alarms.create('check_in_reminder', {
    delayInMinutes: checkInMinutes
    // NO periodInMinutes - triggers only once per session
  });
  
  console.log(`✅ Started tracking: ${domain} (check-in alarm set for ${checkInMinutes} minutes - one-time)`);
  
  // Initialize last save time
  lastSaveTime = Date.now();
  
  // Create initial entry with 0 minutes (so popup shows the domain immediately)
  await storeTrackingData(activeDomain, 0, 0, 0, null);
  console.log(`📝 Created initial tracking entry for ${domain}`);
  
  // Start periodic updates (every 30 seconds) to persist progress
  // This ensures tracking continues even if service worker suspends
  trackingInterval = setInterval(async () => {
    if (activeDomain && sessionStartTime && lastSaveTime) {
      const now = Date.now();
      const durationSinceLastSave = (now - lastSaveTime) / 60000; // Minutes since last save
      
      // Save accumulated time (incremental since last save)
      if (durationSinceLastSave > 0.01) { // Only save if more than 0.6 seconds
        await storeTrackingData(activeDomain, durationSinceLastSave, 0, 0, null);
        console.log(`Periodic save: +${durationSinceLastSave.toFixed(2)} minutes on ${activeDomain} (total session: ${((now - sessionStartTime) / 60000).toFixed(2)} min)`);
        
        // Update last save time
        lastSaveTime = now;
        
        // Update session in storage
        await chrome.storage.local.set({
          trackingSession: {
            activeTabId: activeTabId,
            activeDomain: activeDomain,
            sessionStartTime: sessionStartTime, // Keep original start time
            lastSaveTime: lastSaveTime
          }
        });
      } else {
        console.log(`⏸️ Periodic check: Only ${durationSinceLastSave.toFixed(4)} minutes elapsed, skipping save`);
      }
    } else {
      console.log(`⚠️ Periodic check: Missing tracking state - activeDomain=${activeDomain}, sessionStartTime=${sessionStartTime}, lastSaveTime=${lastSaveTime}`);
    }
  }, 30000); // Update every 30 seconds
  
  console.log(`✅ Periodic save interval started (will save every 30 seconds)`);
}

const rules = [
  {
    id: 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "instagram.com",
      resourceTypes: ["main_frame"]
    }
  },
  {
    id: 2,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "twitter.com",
      resourceTypes: ["main_frame"]
    }
  },
  {
    id: 3,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "youtube.com",
      resourceTypes: ["main_frame"]
    }
  }
];

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.declarativeNetRequest.updateDynamicRules({
//     removeRuleIds: rules.map(r => r.id),
//     addRules: rules
//   });
// });



/**
 * Stop tracking and save session data
 */
async function stopTracking() {
  // Clear tracking interval
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Clear check-in alarm
  chrome.alarms.clear('check_in_reminder');
  
  if (!activeDomain || !sessionStartTime) return;
  
  // Save final accumulated time since last save
  if (lastSaveTime) {
    const finalDuration = (Date.now() - lastSaveTime) / 60000;
    if (finalDuration > 0.01) {
      await storeTrackingData(activeDomain, finalDuration, 0, 0, null);
      console.log(`Final save on stop: +${finalDuration.toFixed(2)} minutes on ${activeDomain}`);
    }
  }
  
  // Also save total session time as backup
  const durationMs = Date.now() - sessionStartTime;
  const durationMinutes = durationMs / 60000;
  
  // Get scroll rate from content script
  const scrollRate = 0; // Will be updated by content script
  
  console.log(`Stopped tracking: ${activeDomain} - total session: ${durationMinutes.toFixed(2)} minutes`);
  
  // Clear session state from storage
  await chrome.storage.local.remove(['trackingSession']);
  
  // Reset state
  activeTabId = null;
  activeDomain = null;
  sessionStartTime = null;
  lastSaveTime = null;
  isPopupActive = false; // Reset popup flag for next session
}

/**
 * Test if content script is responding
 */
async function testContentScriptConnection(tabId) {
  try {
    console.log('🧪 Testing connection to tab', tabId);
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    console.log('✅ Content script is responding:', response);
    return true;
  } catch (error) {
    console.error('❌ Content script not responding:', error.message);
    return false;
  }
}


/**
 * Handle check-in logic (triggered by content script or alarm)
 */
async function handleCheckIn(reason) {
  if (!activeDomain) {
    console.log('⚠️ handleCheckIn: No active domain');
    return;
  }
  
  const durationMinutes = (Date.now() - sessionStartTime) / 60000;
  
  // Store check-in event
  await storeTrackingData(activeDomain, 0, 0, 1);
  
  try {
    // Get user goals and actions for AI generation
    const { goals, actions } = await chrome.storage.local.get(['goals', 'actions']);
    const primaryGoal = Array.isArray(goals) && goals.length > 0 ? goals[0].label : 'Stay focused and mindful';
    const actionPool = Array.isArray(actions) ? actions.filter(a => a.url).map(a => ({ label: a.label, url: a.url })) : [];
    
    console.log('🤖 Generating AI coaching message and alternatives...');
    
    // Generate AI content (both models)
    const [coaching, alternatives] = await Promise.all([
      generateCoachingMessage({ goal: primaryGoal, site: activeDomain, tone: 'warm but firm' }),
      generateAlternativeActions({ interest: primaryGoal, actions: actionPool })
    ]);
    
    console.log('✅ AI generation complete');
    
    // Send AI popup to content script
    if (activeTabId) {
      // FIRST: Test if content script is responding
      const isConnected = await testContentScriptConnection(activeTabId);
      
      if (!isConnected) {
        console.log('🔄 Content script not responding, attempting injection...');
        
        try {
          // Verify tab is valid
          const tab = await chrome.tabs.get(activeTabId);
          
          if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            console.warn('⚠️ Cannot inject into this tab');
            throw new Error('Invalid tab for injection');
          }
          
          // Inject content script
          await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ['content.js']
          });
          
          console.log('✅ Content script injected, waiting...');
          
          // Wait for initialization
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Test again
          const isNowConnected = await testContentScriptConnection(activeTabId);
          
          if (!isNowConnected) {
            console.error('❌ Content script still not responding after injection');
            throw new Error('Content script not responding');
          }
          
          console.log('✅ Content script now responding');
          
        } catch (injectError) {
          console.error('❌ Failed to inject/connect content script:', injectError);
          // Fallback to notification
          showFallbackNotification(coaching);
          return;
        }
      }
      
      // NOW send the actual message
      try {
        const response = await chrome.tabs.sendMessage(activeTabId, {
          type: 'SHOW_AI_CHECKIN',
          coaching: coaching,
          alternatives: alternatives
        });
        console.log('✅ AI check-in popup sent successfully:', response);
      } catch (sendError) {
        console.error('❌ Failed to send message:', sendError);
        showFallbackNotification(coaching);
      }
    }
  } catch (error) {
    console.error('❌ Error in handleCheckIn:', error);
    showFallbackNotification("You've been scrolling for a while — take a break?");
  }
}

/**
 * Helper: Show fallback notification
 */
function showFallbackNotification(message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Mindful Check-in 🧘',
      message: message || 'Take a mindful break!'
    });
    console.log('✅ Fallback notification shown');
  } catch (e) {
    console.error('❌ Could not create notification:', e);
  }
}
/**
 * Handle check-in logic (triggered by content script)
 */
/*async function handleCheckIn(reason) {
  if (!activeDomain) return;
  
  const durationMinutes = (Date.now() - sessionStartTime) / 60000;
  
  // Store check-in event
  await storeTrackingData(activeDomain, 0, 0, 1);
  
  try {
    // Get user goals and actions for AI generation
    const { goals, actions } = await chrome.storage.local.get(['goals', 'actions']);
    const primaryGoal = Array.isArray(goals) && goals.length > 0 ? goals[0].label : 'Stay focused and mindful';
    const actionPool = Array.isArray(actions) ? actions.filter(a => a.url).map(a => ({ label: a.label, url: a.url })) : [];
    
    console.log('🤖 Generating AI coaching message and alternatives...');
    
    // Generate AI content (both models)
    const [coaching, alternatives] = await Promise.all([
      generateCoachingMessage({ goal: primaryGoal, site: activeDomain, tone: 'warm but firm' }),
      generateAlternativeActions({ interest: primaryGoal, actionPool: actionPool[0] })
    ]);
    
    console.log('✅ AI generation complete:', { coaching: coaching.substring(0, 50) + '...', alternativesCount: alternatives.length });
    
    // Send AI popup to content script
    if (activeTabId) {
      try {
        const response = await chrome.tabs.sendMessage(activeTabId, {
          type: 'SHOW_AI_CHECKIN',
          coaching: coaching,
          alternatives: alternatives
        });
        console.log('✅ AI check-in popup sent to tab:', response);
      } catch (error) {
        console.error('❌ Could not send AI popup to tab:', error);
        // Fallback to notification
       chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Mindful Check-in',
          message: coaching || 'Take a mindful break!'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in handleCheckIn:', error);
    // Fallback notification
    if (error.message.includes('Receiving end does not exist')) {
      try {
        console.log('🔄 Attempting to inject content script...');
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          files: ['content.js']
        });
        
        // Wait a bit for script to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry sending message
        await chrome.tabs.sendMessage(activeTabId, {
          type: 'SHOW_AI_CHECKIN',
          coaching: coaching,
          alternatives: alternatives
        });
        console.log('✅ Message sent after injecting content script');
      } catch (injectError) {
        console.error('❌ Could not inject content script:', injectError);
        // Fallback to notification
        showFallbackNotification(coaching);
      }
    } else {
      // Other error, use fallback
      showFallbackNotification(coaching);
    }
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Mindful Check-in',
        message: "You've been scrolling for a while — take a break?"
      });
    } catch (e) {
      console.error('Could not create notification:', e);
    }
  }
}

*/

/**
 * Placeholder function for AI-powered empathetic check-ins
 * Later connects to a Hugging Face model
 */
async function sendToAI(context) {
  // TODO: Implement AI integration with Hugging Face
  // Example: POST to Hugging Face API endpoint
  // const response = await fetch('API_URL', {
  //   method: 'POST',
  //   headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  //   body: JSON.stringify(context)
  // });
  console.log('AI Check-in context:', context);
  return {
    message: "Take a mindful moment to check in with yourself.",
    suggestions: ["Take a deep breath", "Step away for 5 minutes", "Reflect on your goals"]
  };
}

// --------------- Hugging Face Integrations ---------------
import { testHuggingFaceRouter, generateCoachingMessage, generateAlternativeActions } from './ai.js';

console.log('Hugging Face API test:', testHuggingFaceRouter());
// LISTENERS

/**
 * Listen for tab updates (when user navigates)
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('📋 Tab updated:', tabId, 'status=', changeInfo.status, 'url=', tab.url);
  
  // Check if consent is granted
  const result = await chrome.storage.local.get(['consentGranted']);
  if (!result.consentGranted) {
    console.log('⛔ Tracking disabled: consent not granted');
    return;
  }
  
  // React to both 'loading' (URL change) and 'complete' (page loaded)
  if (tab.url && (changeInfo.status === 'loading' || changeInfo.status === 'complete')) {
    const domain = extractDomain(tab.url);
    console.log('🔍 Domain extracted:', domain, 'Is tracked?', isTrackedDomain(domain));
    
    // If this is the currently tracked tab, check if we're switching domains
    if (activeTabId === tabId) {
      // Check if we're still on a tracked domain
      if (domain && isTrackedDomain(domain) && domain === activeDomain) {
        // Still on the same tracked domain, continue tracking
        console.log(`✅ Continuing tracking on ${domain}`);
        return;
      } else if (domain && isTrackedDomain(domain) && domain !== activeDomain) {
        // Switched to different tracked domain
        console.log(`🔄 Switching to different tracked domain: ${domain}`);
        await startTracking(tabId, domain);
        return;
      } else {
        // Left tracked domains, stop tracking
        console.log(`🛑 Left tracked domain, stopping tracking`);
        await stopTracking();
      }
    }
    
    // Stop tracking current session if switching to a different domain
    if (activeTabId && tabId !== activeTabId && domain !== activeDomain && activeDomain && isTrackedDomain(activeDomain)) {
      console.log(`🛑 Different tab updated, stopping current tracking`);
      await stopTracking();
    }
    
    // Start tracking if entering a tracked domain (only on active tabs or if no active tracking)
    if (domain && isTrackedDomain(domain)) {
      // Check if this tab is active
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isActiveTab = activeTab && activeTab.id === tabId;
      
      if (isActiveTab || !activeTabId) {
        console.log(`🚀 Starting tracking for ${domain} on tab ${tabId} (isActive=${isActiveTab})`);
        await startTracking(tabId, domain);
      }
    }
  }
});

/**
 * Listen for tab activation (switching tabs)
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('🔄 Tab activated:', activeInfo.tabId);
  
  const result = await chrome.storage.local.get(['consentGranted']);
  if (!result.consentGranted) {
    console.log('⛔ Tab activation: consent not granted');
    return;
  }
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) {
    console.log('⚠️ Tab has no URL yet');
    return;
  }
  
  const domain = extractDomain(tab.url);
  console.log('🔍 Activated tab domain:', domain, 'Is tracked?', isTrackedDomain(domain));
  
  // Only stop current tracking if switching to a different domain
  if (activeTabId && activeTabId !== activeInfo.tabId) {
    // Check if the new tab is on a tracked domain
    if (domain && isTrackedDomain(domain) && domain === activeDomain) {
      // Same domain, just switch the active tab
      console.log(`✅ Same domain, switching active tab to ${activeInfo.tabId}`);
      activeTabId = activeInfo.tabId;
      return;
    }
    console.log('🛑 Different domain, stopping current tracking');
    await stopTracking();
  }
  
  // Start tracking if on tracked domain
  if (domain && isTrackedDomain(domain)) {
    console.log(`🚀 Starting tracking on activated tab ${activeInfo.tabId} for ${domain}`);
    await startTracking(activeInfo.tabId, domain);
  }
});

/**
 * Listen for tab removal
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === activeTabId) {
    await stopTracking();
  }
});


/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_IN') {
    handleCheckIn(request.reason);
    sendResponse({ success: true });
  }
  
  if (request.type === 'GET_TRACKING_STATE') {
    sendResponse({
      activeDomain: activeDomain,
      sessionStartTime: sessionStartTime,
      isActiveScroll: isActiveScroll
    });
  }

  // Goals/Actions queries for popup/options
  if (request.type === 'GET_GOALS') {
    (async () => {
      try {
        const goals = await getGoals();
        sendResponse({ success: true, goals });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true;
  }

  if (request.type === 'GET_ACTIONS') {
    (async () => {
      try {
        const { actions } = await chrome.storage.local.get(['actions']);
        sendResponse({ success: true, actions: Array.isArray(actions) ? actions : [] });
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
    })();
    return true;
  }

  // Reset popup flag when dismissed
  if (request.type === 'DISMISS_CHECKIN') {
    isPopupActive = false;
    sendResponse({ success: true });
  }
  
  return true; // Required for async response
});

/**
 * Listen for alarm events (for periodic check-ins)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('🔔 Alarm triggered:', alarm.name);
  
  if (alarm.name === 'check_in_reminder') {
    // Prevent duplicate triggers
    if (isPopupActive) {
      console.log('⚠️ Popup already active, skipping duplicate trigger');
      return;
    }
    
    console.log('🔔 Check-in reminder alarm fired!');
    console.log('Current state - activeDomain:', activeDomain, 'activeTabId:', activeTabId);
    
    // Only trigger check-in if user is still on a tracked site
    if (activeDomain && activeTabId) {
      try {
        // Verify the tab still exists and is still on a tracked domain
        const tab = await chrome.tabs.get(activeTabId);
        if (tab && tab.url && isTrackedDomain(extractDomain(tab.url))) {
          console.log('✅ User still on tracked domain, triggering AI check-in...');
          
          // Set flag to prevent duplicates
          isPopupActive = true;
          
          // Generate AI content and show popup
          try {
            await handleCheckIn('time');
          } catch (error) {
            console.error('❌ Error in handleCheckIn:', error);
            // Reset flag on error
            isPopupActive = false;
          }
        } else {
          console.log('⚠️ User no longer on tracked domain, skipping check-in');
        }
      } catch (error) {
        console.log('⚠️ Tab no longer exists, skipping check-in:', error);
      }
    } else {
      console.log('⚠️ No active tracking session, skipping check-in');
    }
  }
});

/**
 * Listen for storage changes to update alarm when check-in interval changes or consent is granted
 */
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    // Handle consent being granted
    if (changes.consentGranted && changes.consentGranted.newValue === true) {
      console.log('✅ Consent granted - checking for open tracked tabs...');
      // Immediately check active tab
      setTimeout(() => checkActiveTabForTracking(), 500);
    }
    
    // Handle check-in interval change
    if (changes.checkinInterval && activeDomain && !isPopupActive) {
      const newInterval = parseInt(changes.checkinInterval.newValue);
      if (!isNaN(newInterval) && newInterval >= 1) {
        console.log(`🔄 Check-in interval changed to ${newInterval} minutes, updating alarm...`);
        
        // Clear old alarm and create new one if tracking is active and popup hasn't shown yet
        chrome.alarms.clear('check_in_reminder', () => {
          chrome.alarms.create('check_in_reminder', {
            delayInMinutes: newInterval
            // One-time only
          });
          console.log(`✅ Alarm updated to ${newInterval} minutes (one-time)`);
        });
      }
    }
  }
});

/**
 * Restore session state when service worker wakes up
 */
async function restoreSessionState() {
  try {
    const result = await chrome.storage.local.get(['trackingSession']);
    if (result.trackingSession) {
      activeTabId = result.trackingSession.activeTabId;
      activeDomain = result.trackingSession.activeDomain;
      sessionStartTime = result.trackingSession.sessionStartTime;
      lastSaveTime = result.trackingSession.lastSaveTime || sessionStartTime;
      
      // Check if tab still exists and is on tracked domain
      if (activeTabId) {
        try {
          const tab = await chrome.tabs.get(activeTabId);
          if (tab && tab.url && isTrackedDomain(extractDomain(tab.url))) {
            console.log(`✅ Restored tracking session for ${activeDomain}`);
            
            // Restart the periodic save interval
            if (trackingInterval) {
              clearInterval(trackingInterval);
            }
            
            // Initialize lastSaveTime if not set
            if (!lastSaveTime) {
              lastSaveTime = sessionStartTime;
            }
            
            // Restart periodic updates
            trackingInterval = setInterval(async () => {
              if (activeDomain && sessionStartTime && lastSaveTime) {
                const now = Date.now();
                const durationSinceLastSave = (now - lastSaveTime) / 60000;
                
                if (durationSinceLastSave > 0.01) {
                  await storeTrackingData(activeDomain, durationSinceLastSave, 0, 0, null);
                  console.log(`Periodic save: +${durationSinceLastSave.toFixed(2)} minutes on ${activeDomain} (total session: ${((now - sessionStartTime) / 60000).toFixed(2)} min)`);
                  
                  lastSaveTime = now;
                  
                  await chrome.storage.local.set({
                    trackingSession: {
                      activeTabId: activeTabId,
                      activeDomain: activeDomain,
                      sessionStartTime: sessionStartTime,
                      lastSaveTime: lastSaveTime
                    }
                  });
                }
              }
            }, 30000);
            
            console.log(`✅ Restarted periodic save interval for ${activeDomain}`);
            
            // Restore the alarm for check-in reminders only if popup hasn't shown
            if (!isPopupActive) {
              const settings = await chrome.storage.local.get(['checkinInterval']);
              const checkInMinutes = parseInt(settings.checkinInterval) || 30;
              const elapsed = (Date.now() - sessionStartTime) / 60000;
              const remaining = Math.max(1, checkInMinutes - elapsed);
              
              await chrome.alarms.clear('check_in_reminder');
              chrome.alarms.create('check_in_reminder', {
                delayInMinutes: remaining
              });
              console.log(`✅ Restored check-in alarm (${remaining} minutes remaining - one-time)`);
            }
          } else {
            // Tab is gone or on different domain, stop tracking
            await stopTracking();
          }
        } catch (e) {
          // Tab doesn't exist anymore
          await stopTracking();
        }
      }
    }
  } catch (error) {
    console.error('Error restoring session state:', error);
  }
}

/**
 * Initialize on extension install
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Mindful Social extension installed');
  
  // Set default consent to false
  chrome.storage.local.set({ consentGranted: false });
  // Initialize default goals only if none exist; ensure actions array
  getGoals().catch(() => {});
  ensureActionsInitialized().catch(() => {});
});

/**
 * Restore session on service worker startup
 */
chrome.runtime.onStartup.addListener(async () => {
  await restoreSessionState();
});

// Also restore when extension reloads
restoreSessionState();

/**
 * Check active tab and start tracking if needed
 * This ensures tracking starts even if tab was already loaded
 */
async function checkActiveTabForTracking() {
  try {
    const result = await chrome.storage.local.get(['consentGranted']);
    if (!result.consentGranted) {
      console.log('⛔ checkActiveTab: consent not granted');
      return;
    }
    
    // Get the currently active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.url) {
      console.log('⚠️ checkActiveTab: no active tab or URL');
      return;
    }
    
    const domain = extractDomain(activeTab.url);
    console.log(`🔍 checkActiveTab: checking ${domain}, isTracked=${isTrackedDomain(domain)}`);
    
    if (domain && isTrackedDomain(domain)) {
      // If we're not tracking or tracking a different tab/domain, start tracking
      if (!activeTabId || activeTabId !== activeTab.id || activeDomain !== domain) {
        console.log(`🚀 checkActiveTab: Starting tracking for active tab ${activeTab.id} on ${domain}`);
        await startTracking(activeTab.id, domain);
      } else {
        console.log(`✅ checkActiveTab: Already tracking this tab`);
      }
    }
  } catch (error) {
    console.error('❌ Error in checkActiveTabForTracking:', error);
  }
}

// Check active tab when service worker starts
checkActiveTabForTracking();

// Also check periodically (every 5 seconds) to catch tabs that might have been missed
setInterval(checkActiveTabForTracking, 5000);

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { storeTrackingData, getTodayDate, extractDomain, getGoals, saveGoal, deleteGoal };
}

// Debug helper - log tracking state automatically
async function logTrackingState() {
  console.log('=== TRACKING DEBUG INFO ===');
  const state = {
    activeTabId,
    activeDomain,
    sessionStartTime: sessionStartTime ? new Date(sessionStartTime).toISOString() : null,
    lastSaveTime: lastSaveTime ? new Date(lastSaveTime).toISOString() : null,
    isPopupActive,
    hasTrackingInterval: trackingInterval !== null
  };
  console.log('Current tracking state:', state);
  
  const storage = await chrome.storage.local.get(['consentGranted', 'trackingSession', 'trackingData', 'checkinInterval']);
  console.log('Storage state:', {
    consentGranted: storage.consentGranted,
    trackingSession: storage.trackingSession,
    trackingDataCount: storage.trackingData ? storage.trackingData.length : 0,
    checkinInterval: storage.checkinInterval
  });
  
  if (storage.trackingData && storage.trackingData.length > 0) {
    const today = getTodayDate();
    const todayEntries = storage.trackingData.filter(e => e.date === today);
    console.log(`Today's entries (${today}):`, todayEntries);
  } else {
    console.log('⚠️ No tracking data in storage');
  }
  
  if (activeTabId) {
    try {
      const tab = await chrome.tabs.get(activeTabId);
      console.log('Active tracked tab:', { id: tab.id, url: tab.url, active: tab.active });
    } catch (e) {
      console.log('Active tab no longer exists:', e);
    }
  }
  
  console.log('=== END DEBUG INFO ===');
}

// Log state periodically for debugging (every 60 seconds)
setInterval(() => {
  if (activeDomain) {
    logTrackingState();
  }
}, 60000);
