/**
 * Mindful Social - Popup Script
 * Handles UI interactions and displays tracking data
 */

// DOM elements (will be assigned in init)
let consentModal;
let mainContent;
let consentYes;
let consentNo;
let appStats;
let noActivity;
let currentDate;
let mindfulBreakBtn;
let moodButtons;
let settingsBtn;
let deleteDataBtn;

// Dynamic containers (created at runtime)
let goalsContainer;
let actionsContainer;
let coachingContainer;
let suggestionsContainer;

/**
 * Format minutes to readable time
 */
function formatTime(minutes) {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  } else if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  }
}

/**
 * Format date to display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * App names for display
 */
const APP_NAMES = {
  'Instagram': 'Instagram',
  'YouTube': 'YouTube',
  'Twitter': 'Twitter/X',
  'TikTok': 'TikTok',
  'Reddit': 'Reddit'
};

const APP_ICONS = {
  'Instagram': '📷',
  'YouTube': '📺',
  'Twitter': '🐦',
  'TikTok': '🎵',
  'Reddit': '🔴'
};

/**
 * Get today's date string
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Load and display tracking data
 */
async function loadTrackingData() {
  try {
    console.log('📊 Loading tracking data in popup...');
    
    // Get tracking data from storage
    const result = await chrome.storage.local.get(['trackingData']);
    const trackingData = result.trackingData || [];
    
    console.log(`📦 Total tracking entries in storage: ${trackingData.length}`);
    
    // Filter today's data
    const today = getTodayDate();
    console.log(`📅 Today's date: ${today}`);
    
    const todayData = trackingData.filter(entry => entry.date === today);
    console.log(`📊 Today's entries: ${todayData.length}`, todayData);
    
    // Update date display
    if (currentDate) {
      currentDate.textContent = formatDate(today);
    }
    
    // Display stats
    if (todayData.length === 0) {
      console.log('⚠️ No data for today, showing "no activity" message');
      if (appStats) appStats.classList.add('hidden');
      if (noActivity) noActivity.classList.remove('hidden');
      return;
    }
    
    console.log(`✅ Found ${todayData.length} entries for today, displaying stats`);
    
    noActivity.classList.add('hidden');
    appStats.classList.remove('hidden');
    appStats.innerHTML = '';
    
    // Group by app
    const appTotals = {};
    todayData.forEach(entry => {
      const app = entry.app_name || entry.domain;
      if (!appTotals[app]) {
        appTotals[app] = {
          minutes: 0,
          checkins: 0,
          mood: null
        };
      }
      appTotals[app].minutes += entry.duration_minutes || 0;
      appTotals[app].checkins += entry.checkins_triggered || 0;
      if (entry.mood) {
        appTotals[app].mood = entry.mood;
      }
    });
    
    // Display each app
    Object.entries(appTotals)
      .sort((a, b) => b[1].minutes - a[1].minutes) // Sort by time descending
      .forEach(([app, data]) => {
        const icon = APP_ICONS[app] || '📱';
        const timeStr = formatTime(data.minutes);
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${icon}</span>
              <div>
                <div class="font-semibold text-gray-800">${app}</div>
                <div class="text-sm text-gray-500">${data.checkins} check-in${data.checkins !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600">${timeStr}</div>
              <div class="text-xs text-gray-400">active</div>
            </div>
          </div>
        `;
        appStats.appendChild(card);
      });
  } catch (error) {
    console.error('Error loading tracking data:', error);
  }
}

/**
 * Fetch goals from background (uses getGoals helper)
 */
async function fetchGoals() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_GOALS' });
    if (res && res.success) return res.goals || [];
  } catch (e) {
    console.error('Error fetching goals:', e);
  }
  // Fallback to direct storage read
  const { goals } = await chrome.storage.local.get(['goals']);
  return Array.isArray(goals) ? goals : [];
}

/**
 * Fetch actions from background/storage
 */
async function fetchActions() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_ACTIONS' });
    if (res && res.success) return res.actions || [];
  } catch (e) {
    console.error('Error fetching actions:', e);
  }
  const { actions } = await chrome.storage.local.get(['actions']);
  return Array.isArray(actions) ? actions : [];
}

function createSectionTitle(text) {
  const title = document.createElement('div');
  title.className = 'text-sm font-semibold text-gray-700 mb-2';
  title.textContent = text;
  return title;
}

function createButton(label) {
  const btn = document.createElement('button');
  btn.className = 'w-full bg-white rounded-lg border border-gray-200 px-4 py-2 text-gray-800 hover:border-blue-400 hover:shadow-md transition text-sm text-left';
  btn.textContent = label;
  return btn;
}

/*async function renderGoalsAndActions() {
  // Ensure mainContent is visible first
  if (!mainContent || mainContent.classList.contains('hidden')) {
    console.log('Main content not visible, skipping goals/actions render');
    return;
  }
  
  // Find insertion point (after mindful break button section)
  const mindfulBreakBtn = document.getElementById('mindfulBreakBtn');
  const mindfulBreakSection = mindfulBreakBtn?.parentElement;
  
  if (!mindfulBreakSection) {
    console.log('Could not find mindful break section');
    return;
  }
  
  // Remove existing containers if they exist (to prevent duplication)
  const existingGoals = document.getElementById('mindful-goals-container');
  const existingActions = document.getElementById('mindful-actions-container');
  if (existingGoals) existingGoals.remove();
  if (existingActions) existingActions.remove();
  
  // Create containers
  goalsContainer = document.createElement('div');
  goalsContainer.id = 'mindful-goals-container';
  goalsContainer.className = 'px-4 pb-2';
  mindfulBreakSection.appendChild(goalsContainer);
  
  actionsContainer = document.createElement('div');
  actionsContainer.id = 'mindful-actions-container';
  actionsContainer.className = 'px-4 pb-4';
  mindfulBreakSection.appendChild(actionsContainer);

  // Clear and render goals (prevent duplication by checking)
  goalsContainer.innerHTML = '';
  const goalsTitle = createSectionTitle('My Goals');
  goalsContainer.appendChild(goalsTitle);
  
  const goals = await fetchGoals();
  const goalsList = document.createElement('div');
  goalsList.className = 'space-y-2';
  
  if (!goals || goals.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-center text-gray-400 text-sm p-3';
    empty.textContent = 'You have not added any mindful goals yet. Go to Settings to create some!';
    goalsList.appendChild(empty);
  } else {
    goals.forEach(g => {
      const btn = createButton(g.label);
      btn.addEventListener('click', () => {
        showToast('Nice goal! Keep it up.');
      });
      goalsList.appendChild(btn);
    });
  }
  goalsContainer.appendChild(goalsList);

  // Clear and render actions (prevent duplication)
  actionsContainer.innerHTML = '';
  const actionsTitle = createSectionTitle('My Actions');
  actionsContainer.appendChild(actionsTitle);
  
  const actions = await fetchActions();
  const actionsList = document.createElement('div');
  actionsList.className = 'space-y-2';
  
  if (!actions || actions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'text-center text-gray-400 text-sm p-3';
    empty.textContent = 'You have not added any mindful actions yet. Go to Settings to create some!';
    actionsList.appendChild(empty);
  } else {
    actions.forEach(a => {
      const btn = createButton(a.label);
      btn.addEventListener('click', () => {
        const t = (a.type || '').toLowerCase();
        if (t === 'link' || t === 'url' || a.url) {
          const url = a.url || '';
          if (url) chrome.tabs.create({ url });
        } else if (t === 'internal' || t === 'action') {
          if ((a.action || a.type) === 'dismiss') {
            window.close();
          } else if ((a.action || '').toLowerCase() === 'resettimer') {
            showToast('Timer reset!');
          } else {
            showToast('Action performed');
          }
        } else if (t === 'dismiss') {
          window.close();
        } else {
          showToast('Action not configured');
        }
      });
      actionsList.appendChild(btn);
    });
  }
  actionsContainer.appendChild(actionsList);
}
*/
async function renderAIContent() {
  // Only render if mainContent is visible
  if (!mainContent || mainContent.classList.contains('hidden')) {
    return;
  }
  
  // Find where to insert (after actions container)
  const actionsContainerEl = document.getElementById('mindful-actions-container');
  if (!actionsContainerEl) {
    // Actions container doesn't exist yet, skip
    return;
  }
  
  // Remove existing if present
  const existing = document.getElementById('mindful-suggestions-container');
  if (existing) existing.remove();
  
  // Create new container
  suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'mindful-suggestions-container';
  suggestionsContainer.className = 'px-4 pb-4';
  actionsContainerEl.parentNode.appendChild(suggestionsContainer);
  
  const { lastCoaching, lastAlternatives } = await chrome.storage.local.get(['lastCoaching', 'lastAlternatives']);
  if (lastCoaching) {
    const coachBox = document.createElement('div');
    coachBox.className = 'bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 mb-3';
    coachBox.innerText = lastCoaching;
    suggestionsContainer.appendChild(coachBox);
  }
  if (Array.isArray(lastAlternatives) && lastAlternatives.length > 0) {
    const title = createSectionTitle('Suggested Quick Actions');
    suggestionsContainer.appendChild(title);
    lastAlternatives.slice(0, 3).forEach(a => {
      const btn = createButton(a.label);
      btn.addEventListener('click', () => {
        const t = (a.type || '').toLowerCase();
        if (t === 'link' && a.url) {
          chrome.tabs.create({ url: a.url });
        } else if (t === 'internal') {
          if ((a.action || '') === 'dismiss') {
            // Only close the popup, do not reload the tab
            window.close();
          } else showToast('Action performed');
        }
      });
      suggestionsContainer.appendChild(btn);
    });
  }
}

// document.getElementById("startFocus").addEventListener("click", async () => {
//   const duration = parseInt(document.getElementById("focusDuration").value);
//   const endTime = Date.now() + duration * 60 * 1000;

//   await chrome.storage.local.set({
//     focusMode: { active: true, endTime }
//   });

//   chrome.runtime.sendMessage({ type: "START_FOCUS_MODE" });
//   document.getElementById("focusStatus").innerText = `Focus Mode active for ${duration} mins 🚀`;
// });

/**
 * Handle consent response
 */
async function handleConsent(granted) {
  await chrome.storage.local.set({ consentGranted: granted });
  
  consentModal.classList.add('hidden');
  mainContent.classList.remove('hidden');
  
  if (granted) {
    // Wait for DOM to be ready, then load content
    setTimeout(async () => {
      await loadTrackingData();
     // await renderGoalsAndActions();
      await renderAIContent();
      
      // Reload stats every 5 seconds
      setInterval(loadTrackingData, 5000);
    }, 100);
  } else {
    // Show message when tracking disabled
    appStats.innerHTML = '<div class="text-center py-8 text-gray-400"><p>Tracking is disabled</p><p class="text-sm mt-1">Enable in settings to track your habits</p></div>';
  }
}

/**
 * Handle mood button click
 */
async function handleMoodClick(mood) {
  // Visual feedback
  moodButtons.forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-50');
    btn.classList.add('border-gray-200');
  });
  
  event.target.closest('.mood-btn').classList.add('border-blue-500', 'bg-blue-50');
  
  // Store mood in moodLogs array
  const result = await chrome.storage.local.get(['moodLogs']);
  const moodLogs = result.moodLogs || [];
  
  // Append new mood log with timestamp
  moodLogs.push({
    mood: mood,
    timestamp: new Date().toISOString()
  });
  
  await chrome.storage.local.set({ moodLogs });
  
  // Also store in trackingData for backward compatibility (existing logic)
  const today = getTodayDate();
  const trackingResult = await chrome.storage.local.get(['trackingData']);
  const trackingData = trackingResult.trackingData || [];
  
  trackingData.push({
    date: today,
    domain: 'manual',
    app_name: 'Manual Check-in',
    duration_minutes: 0,
    scroll_rate: 0,
    checkins_triggered: 0,
    mood: mood
  });
  
  await chrome.storage.local.set({ trackingData });
  
  // Show success message
  showToast('Logged your mood');
}

/**
 * Handle mindful break button
 */
function handleMindfulBreak() {
  // Open a new tab with mindfulness content
  chrome.tabs.create({
    url: chrome.runtime.getURL('mindful-break.html')
  });
}

/**
 * Show toast notification
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

/**
 * Initialize popup
 */
async function init() {
  // Get DOM elements
  consentModal = document.getElementById('consentModal');
  mainContent = document.getElementById('mainContent');
  consentYes = document.getElementById('consentYes');
  consentNo = document.getElementById('consentNo');
  appStats = document.getElementById('appStats');
  noActivity = document.getElementById('noActivity');
  currentDate = document.getElementById('currentDate');
  mindfulBreakBtn = document.getElementById('mindfulBreakBtn');
  moodButtons = document.querySelectorAll('.mood-btn');
  settingsBtn = document.getElementById('settingsBtn');
  deleteDataBtn = document.getElementById('deleteDataBtn');
  
  // Check if elements exist
  if (!mainContent) {
    console.error('Main content element not found!');
    return;
  }
  
  // Check consent status
  const result = await chrome.storage.local.get(['consentGranted']);
  
  if (result.consentGranted === undefined) {
    // First time - show consent modal
    consentModal.classList.remove('hidden');
  } else if (result.consentGranted === false) {
    // Consent not granted - show message
    mainContent.classList.remove('hidden');
    appStats.innerHTML = '<div class="text-center py-8 text-gray-400" style="color:black; font-size:20px"><p>Tracking is disabled</p><p class="text-sm mt-1">Enable in settings to track your habits</p></div>';
  } else {
    // Consent granted - show stats
    mainContent.classList.remove('hidden');
    
    // Wait a bit for DOM to be ready, then load content
    setTimeout(async () => {
      await loadTrackingData();
      //await renderGoalsAndActions();
      await renderAIContent();
    }, 100);
    
    // Reload stats every 5 seconds
    setInterval(loadTrackingData, 5000);
  }
  
  // Attach event listeners (only if elements exist)
  if (consentYes) {
    consentYes.addEventListener('click', () => handleConsent(true));
  }
  if (consentNo) {
    consentNo.addEventListener('click', () => handleConsent(false));
  }
  
  if (moodButtons && moodButtons.length > 0) {
    moodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => handleMoodClick(btn.dataset.mood));
    });
  }
  
  if (mindfulBreakBtn) {
    mindfulBreakBtn.addEventListener('click', handleMindfulBreak);
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
  
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
        await chrome.storage.local.clear();
        showToast('Data deleted! 🗑️');
        loadTrackingData();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


