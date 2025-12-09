/**
 * Mindful Social - Options Script
 * Handles settings, goals, and data management
 */

// DOM elements
const consentToggle = document.getElementById('consentToggle');
const exportDataBtn = document.getElementById('exportDataBtn');
const deleteAllDataBtn = document.getElementById('deleteAllDataBtn');
const checkinIntervalInput = document.getElementById('checkinInterval');
const saveReminderBtn = document.getElementById('saveReminderBtn');

// Goals elements
const goalsList = document.getElementById('goalsList');
const goalLabel = document.getElementById('goalLabel');
const addGoalBtn = document.getElementById('addGoalBtn');
const saveGoalEditBtn = document.getElementById('saveGoalEditBtn');
const cancelGoalEditBtn = document.getElementById('cancelGoalEditBtn');
let editingGoalId = null;

// Actions elements
const actionsList = document.getElementById('actionsList');
const actionLabel = document.getElementById('actionLabel');
const actionType = document.getElementById('actionType');
const actionUrl = document.getElementById('actionUrl');
const addActionBtn = document.getElementById('addActionBtn');
const saveActionEditBtn = document.getElementById('saveActionEditBtn');
const cancelActionEditBtn = document.getElementById('cancelActionEditBtn');
let editingActionId = null;

// Stats elements
const totalDays = document.getElementById('totalDays');
const totalTime = document.getElementById('totalTime');
const totalCheckins = document.getElementById('totalCheckins');
const avgTime = document.getElementById('avgTime');

// Mood Insights elements (may be null if section doesn't exist)
let moodChartContainer = null;
let moodStats = null;
let moodChart = null;

// Toast element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

/**
 * Show toast notification
 */
function showToast(message, duration = 2000) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

/**
 * Format minutes to readable time
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  } else {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
}

/**
 * Load and display statistics
 */
async function loadStatistics() {
  try {
    const result = await chrome.storage.local.get(['trackingData']);
    const trackingData = result.trackingData || [];
    
    if (trackingData.length === 0) {
      totalDays.textContent = '0';
      totalTime.textContent = '0h';
      totalCheckins.textContent = '0';
      avgTime.textContent = '0h';
      return;
    }
    
    // Calculate statistics
    const uniqueDates = new Set(trackingData.map(entry => entry.date));
    const daysTracked = uniqueDates.size;
    
    let totalMinutes = 0;
    let checkins = 0;
    
    trackingData.forEach(entry => {
      totalMinutes += entry.duration_minutes || 0;
      checkins += entry.checkins_triggered || 0;
    });
    
    const avgMinutes = totalMinutes / daysTracked;
    
    // Update displays
    totalDays.textContent = daysTracked;
    totalTime.textContent = formatTime(totalMinutes);
    totalCheckins.textContent = checkins;
    avgTime.textContent = formatTime(avgMinutes);
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

/**
 * Load current settings
 */
async function loadSettings() {
  try {
    // Load consent status
    const result = await chrome.storage.local.get(['consentGranted']);
    consentToggle.checked = result.consentGranted || false;

    // Load check-in reminder
    const intervalData = await chrome.storage.local.get(['checkinInterval']);
    checkinIntervalInput.value = intervalData.checkinInterval || '30';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const intervalValue = checkinIntervalInput.value.trim();
    let checkinInterval = parseInt(intervalValue);
    
    // Validate range
    if (isNaN(checkinInterval) || checkinInterval < 1) {
      showToast('Check-in interval must be at least 1 minute');
      return;
    }
    if (checkinInterval > 1440) {
      showToast('Check-in interval cannot exceed 1440 minutes (24 hours)');
      return;
    }
    
    // Save the actual value entered by user
    const settings = {
      consentGranted: consentToggle.checked,
      checkinInterval: checkinInterval
    };
    
    await chrome.storage.local.set(settings);
    console.log('Settings saved:', settings);
    showToast(`Settings saved! Check-in set to ${checkinInterval} minutes ✓`);
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings ✗');
  }
}

// -------- Goals CRUD --------

function renderGoalItem(goal) {
  const div = document.createElement('div');
  div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
  div.innerHTML = `
    <div class="text-gray-800">${goal.label}</div>
    <div class="flex gap-2">
      <button data-id="${goal.id}" class="edit-goal bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded">Edit</button>
      <button data-id="${goal.id}" class="delete-goal bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded">Delete</button>
    </div>
  `;
  return div;
}

async function loadGoals() {
  const { goals } = await chrome.storage.local.get(['goals']);
  goalsList.innerHTML = '';
  const items = Array.isArray(goals) ? goals : [];
  items.forEach(g => goalsList.appendChild(renderGoalItem(g)));

  // Attach handlers
  goalsList.querySelectorAll('.edit-goal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const { goals } = await chrome.storage.local.get(['goals']);
      const g = (goals || []).find(x => x.id === id);
      if (!g) return;
      editingGoalId = g.id;
      goalLabel.value = g.label;
      addGoalBtn.classList.add('hidden');
      saveGoalEditBtn.classList.remove('hidden');
      cancelGoalEditBtn.classList.remove('hidden');
    });
  });
  goalsList.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const { goals } = await chrome.storage.local.get(['goals']);
      const next = (goals || []).filter(g => g.id !== id);
      await chrome.storage.local.set({ goals: next });
      loadGoals();
      showToast('Goal deleted');
    });
  });
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

async function addGoal() {
  const label = (goalLabel.value || '').trim();
  if (!label) {
    showToast('Enter a goal label');
    return;
  }
  const { goals } = await chrome.storage.local.get(['goals']);
  const list = Array.isArray(goals) ? goals : [];
  list.push({ id: newId('g'), label });
  await chrome.storage.local.set({ goals: list });
  goalLabel.value = '';
  await loadGoals();
  showToast('Goal added');
}

async function saveGoalEdit() {
  if (!editingGoalId) return;
  const label = (goalLabel.value || '').trim();
  if (!label) {
    showToast('Enter a goal label');
    return;
  }
  const { goals } = await chrome.storage.local.get(['goals']);
  const list = (goals || []).map(g => (g.id === editingGoalId ? { ...g, label } : g));
  await chrome.storage.local.set({ goals: list });
  editingGoalId = null;
  goalLabel.value = '';
  addGoalBtn.classList.remove('hidden');
  saveGoalEditBtn.classList.add('hidden');
  cancelGoalEditBtn.classList.add('hidden');
  await loadGoals();
  showToast('Goal updated');
}

function cancelGoalEdit() {
  editingGoalId = null;
  goalLabel.value = '';
  addGoalBtn.classList.remove('hidden');
  saveGoalEditBtn.classList.add('hidden');
  cancelGoalEditBtn.classList.add('hidden');
}

// -------- Actions CRUD --------

function renderActionItem(action) {
  const div = document.createElement('div');
  div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
  const detail = action.type === 'link' && action.url ? ` • <span class="text-gray-500">${action.url}</span>` : '';
  div.innerHTML = `
    <div class="text-gray-800">${action.label} <span class="text-xs text-gray-500">(${action.type || 'link'})</span>${detail}</div>
    <div class="flex gap-2">
      <button data-id="${action.id}" class="edit-action bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded">Edit</button>
      <button data-id="${action.id}" class="delete-action bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded">Delete</button>
    </div>
  `;
  return div;
}

async function loadActions() {
  const { actions } = await chrome.storage.local.get(['actions']);
  actionsList.innerHTML = '';
  const items = Array.isArray(actions) ? actions : [];
  items.forEach(a => actionsList.appendChild(renderActionItem(a)));

  // Attach handlers
  actionsList.querySelectorAll('.edit-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const { actions } = await chrome.storage.local.get(['actions']);
      const a = (actions || []).find(x => x.id === id);
      if (!a) return;
      editingActionId = a.id;
      actionLabel.value = a.label || '';
      actionType.value = a.type || 'link';
      actionUrl.value = a.url || '';
      addActionBtn.classList.add('hidden');
      saveActionEditBtn.classList.remove('hidden');
      cancelActionEditBtn.classList.remove('hidden');
    });
  });
  actionsList.querySelectorAll('.delete-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const { actions } = await chrome.storage.local.get(['actions']);
      const next = (actions || []).filter(a => a.id !== id);
      await chrome.storage.local.set({ actions: next });
      loadActions();
      showToast('Action deleted');
    });
  });
}

async function addAction() {
  const label = (actionLabel.value || '').trim();
  const type = actionType.value || 'link';
  const url = (actionUrl.value || '').trim();
  if (!label) {
    showToast('Enter an action label');
    return;
  }
  if (type === 'link' && url && !/^https?:\/\//i.test(url)) {
    showToast('Enter a valid URL (starting with http or https)');
    return;
  }
  const { actions } = await chrome.storage.local.get(['actions']);
  const list = Array.isArray(actions) ? actions : [];
  const action = { id: newId('a'), label, type, url: url || undefined };
  list.push(action);
  await chrome.storage.local.set({ actions: list });
  actionLabel.value = '';
  actionUrl.value = '';
  actionType.value = 'link';
  await loadActions();
  showToast('Action added');
}

async function saveActionEdit() {
  if (!editingActionId) return;
  const label = (actionLabel.value || '').trim();
  const type = actionType.value || 'link';
  const url = (actionUrl.value || '').trim();
  if (!label) {
    showToast('Enter an action label');
    return;
  }
  if (type === 'link' && url && !/^https?:\/\//i.test(url)) {
    showToast('Enter a valid URL (starting with http or https)');
    return;
  }
  const { actions } = await chrome.storage.local.get(['actions']);
  const list = (actions || []).map(a => (a.id === editingActionId ? { ...a, label, type, url: url || undefined } : a));
  await chrome.storage.local.set({ actions: list });
  editingActionId = null;
  actionLabel.value = '';
  actionUrl.value = '';
  actionType.value = 'link';
  addActionBtn.classList.remove('hidden');
  saveActionEditBtn.classList.add('hidden');
  cancelActionEditBtn.classList.add('hidden');
  await loadActions();
  showToast('Action updated');
}

function cancelActionEdit() {
  editingActionId = null;
  actionLabel.value = '';
  actionUrl.value = '';
  actionType.value = 'link';
  addActionBtn.classList.remove('hidden');
  saveActionEditBtn.classList.add('hidden');
  cancelActionEditBtn.classList.add('hidden');
}

/**
 * Export data
 */
async function exportData() {
  try {
    const result = await chrome.storage.local.get(['trackingData', 'moodLogs']);
    const data = {
      trackingData: result.trackingData || [],
      moodLogs: result.moodLogs || [],
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Create download link
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindful-social-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported! 📥');
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast('Error exporting data ✗');
  }
}

/**
 * Delete all data
 */
async function deleteAllData() {
  if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
    return;
  }
  
  try {
    // Keep only the consent status
    const result = await chrome.storage.local.get(['consentGranted']);
    const consentStatus = result.consentGranted || false;
    
    await chrome.storage.local.clear();
    await chrome.storage.local.set({ consentGranted: consentStatus });
    
    showToast('All data deleted! 🗑️');
    loadStatistics();
    loadGoals();
    loadActions();
    if (moodChartContainer) {
      loadMoodInsights().catch(() => {});
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    showToast('Error deleting data ✗');
  }
}

/**
 * Load and render mood insights chart
 */
async function loadMoodInsights() {
  try {
    // Get elements if not already cached (in case DOM changes)
    if (!moodChartContainer) {
      moodChartContainer = document.getElementById('moodChartContainer');
    }
    if (!moodStats) {
      moodStats = document.getElementById('moodStats');
    }
    
    // If mood insights section doesn't exist, just return
    if (!moodChartContainer || !moodStats) {
      return;
    }
    
    // Check if Chart.js is loaded (check both global and window scope)
    const ChartLib = typeof Chart !== 'undefined' ? Chart : (typeof window !== 'undefined' && window.Chart ? window.Chart : null);
    if (!ChartLib) {
      console.warn('Chart.js not loaded yet, waiting...');
      setTimeout(loadMoodInsights, 500);
      return;
    }
    
    const aggregatedData = await aggregateMoodDataByDay();
    
    if (aggregatedData.length === 0) {
      if (moodChartContainer) {
        moodChartContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No mood data yet. Start logging your moods to see insights!</p>';
      }
      if (moodStats) {
        moodStats.innerHTML = '';
      }
      return;
    }
    
    // Limit to last 14 days for better readability
    const recentData = aggregatedData.slice(0, 14).reverse();
    
    // Prepare chart data
    const labels = recentData.map(d => formatDateForDisplay(d.date));
    const inspiredData = recentData.map(d => d.inspiredCount);
    const okayData = recentData.map(d => d.okayCount);
    const drainedData = recentData.map(d => d.drainedCount);
    
    // Destroy existing chart if it exists
    if (moodChart) {
      moodChart.destroy();
      moodChart = null;
    }
    
    // Get canvas element
    const canvas = document.getElementById('moodChart');
    if (!canvas) {
      console.error('Mood chart canvas not found');
      return;
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    const ChartLib2 = typeof Chart !== 'undefined' ? Chart : (typeof window !== 'undefined' && window.Chart ? window.Chart : null);
    if (!ChartLib2) {
      console.error('Chart.js library not available');
      return;
    }
    moodChart = new ChartLib2(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Inspired',
            data: inspiredData,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: 'Okay',
            data: okayData,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          },
          {
            label: 'Drained',
            data: drainedData,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We have custom legend in HTML
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    // Calculate and display mood statistics
    const totalInspired = aggregatedData.reduce((sum, d) => sum + d.inspiredCount, 0);
    const totalOkay = aggregatedData.reduce((sum, d) => sum + d.okayCount, 0);
    const totalDrained = aggregatedData.reduce((sum, d) => sum + d.drainedCount, 0);
    const avgMinutes = aggregatedData.length > 0
      ? Math.round(aggregatedData.reduce((sum, d) => sum + d.minutesActive, 0) / aggregatedData.length)
      : 0;
    
    moodStats.innerHTML = `
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="text-xl font-bold text-green-600">${totalInspired}</div>
        <div class="text-sm text-gray-600">Inspired logs</div>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="text-xl font-bold text-blue-600">${totalOkay}</div>
        <div class="text-sm text-gray-600">Okay logs</div>
      </div>
      <div class="bg-red-50 p-4 rounded-lg">
        <div class="text-xl font-bold text-red-600">${totalDrained}</div>
        <div class="text-sm text-gray-600">Drained logs</div>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg">
        <div class="text-xl font-bold text-purple-600">${formatTime(avgMinutes)}</div>
        <div class="text-sm text-gray-600">Avg minutes/day</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading mood insights:', error);
    if (moodChartContainer) {
      moodChartContainer.innerHTML = '<p class="text-center text-red-500 py-8">Error loading mood insights</p>';
    }
  }
}

/**
 * Initialize options page
 */
async function init() {
  // Initialize mood insights elements
  moodChartContainer = document.getElementById('moodChartContainer');
  moodStats = document.getElementById('moodStats');
  
  // Ensure defaults exist (background also initializes, but double-safe)
  const { goals, actions } = await chrome.storage.local.get(['goals', 'actions']);
  if (!Array.isArray(goals) || goals.length === 0) {
    await chrome.storage.local.set({ goals: [
      { id: 'g1', label: 'Limit social media to 60 min/day' },
      { id: 'g2', label: 'Take 3 mindful breaks per day' },
      { id: 'g3', label: 'Avoid scrolling after 10pm' }
    ] });
  }
  if (!Array.isArray(actions)) {
    await chrome.storage.local.set({ actions: [] });
  }

  await loadSettings();
  await loadStatistics();
  await loadGoals();
  await loadActions();
  
  // Event listeners - MUST be attached regardless of Chart.js
  if (consentToggle) {
    consentToggle.addEventListener('change', saveSettings);
  }
  if (saveReminderBtn) {
    saveReminderBtn.addEventListener('click', saveSettings);
  }

  // Goals
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', addGoal);
  }
  if (saveGoalEditBtn) {
    saveGoalEditBtn.addEventListener('click', saveGoalEdit);
  }
  if (cancelGoalEditBtn) {
    cancelGoalEditBtn.addEventListener('click', cancelGoalEdit);
  }

  // Actions
  if (addActionBtn) {
    addActionBtn.addEventListener('click', addAction);
  }
  if (saveActionEditBtn) {
    saveActionEditBtn.addEventListener('click', saveActionEdit);
  }
  if (cancelActionEditBtn) {
    cancelActionEditBtn.addEventListener('click', cancelActionEdit);
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  if (deleteAllDataBtn) {
    deleteAllDataBtn.addEventListener('click', deleteAllData);
  }
  
  // No auto-save for goals/actions inputs; handled explicitly
  
  // Refresh statistics every 10 seconds
  setInterval(loadStatistics, 10000);
  
  // Load mood insights asynchronously (non-blocking)
  // This won't prevent other functionality from working
  setTimeout(() => {
    try {
      const checkChartLoaded = () => {
        return typeof Chart !== 'undefined' || (typeof window !== 'undefined' && window.Chart);
      };
      
      if (checkChartLoaded() && moodChartContainer) {
        loadMoodInsights().catch(err => {
          console.error('Error loading mood insights:', err);
          if (moodChartContainer) {
            moodChartContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Mood insights unavailable</p>';
          }
        });
      } else if (moodChartContainer) {
        // Wait for Chart.js to load (non-blocking)
        let attempts = 0;
        const checkChart = setInterval(() => {
          attempts++;
          if (checkChartLoaded()) {
            clearInterval(checkChart);
            loadMoodInsights().catch(err => {
              console.error('Error loading mood insights:', err);
            });
          } else if (attempts > 20) {
            clearInterval(checkChart);
            console.warn('Chart.js not available - mood insights disabled');
            if (moodChartContainer) {
              moodChartContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Mood insights unavailable (Chart.js not loaded)</p>';
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error initializing mood insights:', error);
      // Don't let this break the rest of the page
    }
  }, 100);
  
  // Refresh mood insights every 10 seconds (only if Chart.js is available)
  setInterval(() => {
    if (typeof Chart !== 'undefined' || (typeof window !== 'undefined' && window.Chart)) {
      loadMoodInsights().catch(err => console.error('Error refreshing mood insights:', err));
    }
  }, 10000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
