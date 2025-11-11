/**
 * Mindful Social - Content Script
 * Detects scrolling behavior and sends signals to background script
 */

// IMMEDIATE: Set a flag to show content script is loaded
console.log('🤖 Mindful Social content script STARTING on:', window.location.hostname);

// TEST: Assign a simple function immediately to verify injection works
window.__mindfulTest__ = function() {
  console.log('✅ Test function works!');
};
console.log('Test function assigned:', typeof window.__mindfulTest__);

// Scrolling detection state
let lastScrollTime = Date.now();
let scrollDistance = 0;
let scrollStartTime = Date.now();
let checkInSent = false;
let scrollThreshold = 300; // pixels per second (adjustable)

// Track continuous scrolling
const CONTINUOUS_SCROLL_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Listen for messages from background script
 * Set up immediately so it's ready for check-in messages
 */
/*chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.type);
  
  if (request.type === 'SHOW_AI_CHECKIN') {
    console.log('Showing AI check-in popup...');
    try {
      showAICheckInPopup(request.coaching, request.alternatives || []);
      console.log('AI check-in popup shown successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error showing AI popup:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.type === 'SHOW_CHECKIN_OVERLAY') {
    console.log('Showing check-in overlay...');
    try {
      showCheckInIndicator();
      console.log('Check-in overlay shown successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error showing check-in overlay:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  return true; // Keep channel open for async response
});*/

/**
 * Listen for messages from background script
 * Set up immediately so it's ready for check-in messages
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request.type);
  
  if (request.type === 'PING') {
    console.log('✅ PING received, sending PONG');
    sendResponse({ success: true, status: 'PONG' });
    return true;
  }
  
  if (request.type === 'SHOW_AI_CHECKIN') {
    console.log('✅ SHOW_AI_CHECKIN received');
    console.log('Coaching:', request.coaching);
    console.log('Alternatives:', request.alternatives);
    
    try {
      showAICheckInPopup(request.coaching, request.alternatives || []);
      console.log('✅ AI check-in popup shown successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error showing AI popup:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep channel open
  }
  
  if (request.type === 'SHOW_CHECKIN_OVERLAY') {
    console.log('✅ SHOW_CHECKIN_OVERLAY received');
    try {
      showCheckInIndicator();
      console.log('✅ Check-in overlay shown successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error showing check-in overlay:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep channel open
  }
  
  // If no match, return false
  return false;
});

console.log('✅ Content script message listener registered');

/**
 * Detect scroll events and calculate scroll rate
 */
function handleScroll() {
  const currentTime = Date.now();
  const timeSinceLastScroll = currentTime - lastScrollTime;
  
  lastScrollTime = currentTime;
  
  // Reset if user stopped scrolling for more than 1 second
  if (timeSinceLastScroll > 1000) {
    scrollDistance = 0;
    scrollStartTime = currentTime;
  } else {
    // Estimate scroll distance (approximate)
    scrollDistance += Math.abs(window.scrollY - (window.lastScrollY || 0));
    window.lastScrollY = window.scrollY;
  }
}

/**
 * Check if scrolling rate is too intense
 */
function isDoomScrolling() {
  const elapsed = (Date.now() - scrollStartTime) / 1000; // in seconds
  if (elapsed < 1) return false; // Wait at least 1 second
  
  const scrollRate = scrollDistance / elapsed; // pixels per second
  
  return scrollRate > scrollThreshold;
}

/**
 * Check if continuous scrolling exceeded time threshold
 */
function hasBeenScrollingTooLong() {
  const totalTime = Date.now() - scrollStartTime;
  return totalTime > CONTINUOUS_SCROLL_THRESHOLD;
}

/**
 * Send check-in request to background script
 */
async function requestCheckIn(reason) {
  if (checkInSent) return; // Prevent duplicate check-ins
  
  checkInSent = true;
  
  // Send message to background script
  chrome.runtime.sendMessage({
    type: 'CHECK_IN',
    reason: reason,
    timestamp: Date.now(),
    domain: window.location.hostname
  });
  
  // Show visual indicator (optional)
  showCheckInIndicator();
  
  // Reset check-in flag after 30 seconds
  setTimeout(() => {
    checkInSent = false;
  }, 30000);
}

/**
 * Show AI-generated check-in popup overlay
 */
function showAICheckInPopup(coaching, alternatives) {
  // Remove any existing popup
  const existing = document.getElementById('mindful-ai-popup');
  if (existing) existing.remove();
  
  if (!document.body) {
    setTimeout(() => showAICheckInPopup(coaching, alternatives), 100);
    return;
  }
  
  // Create overlay backdrop
  const overlay = document.createElement('div');
  overlay.id = 'mindful-ai-popup';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    animation: fadeInScale 0.3s ease-out;
  `;
  
  // Coaching message
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    font-size: 16px;
    line-height: 1.6;
    white-space: pre-line;
  `;
  messageDiv.textContent = coaching || 'Stay focused — you have got this!';
  
  // Actions container
  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;';
  
  // Create action buttons
  (alternatives || []).slice(0, 3).forEach(action => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #1f2937;
    `;
    btn.textContent = action.label || 'Take a break';
    btn.onmouseover = () => {
      btn.style.borderColor = '#3b82f6';
      btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    };
    btn.onmouseout = () => {
      btn.style.borderColor = '#e5e7eb';
      btn.style.boxShadow = 'none';
    };
    btn.onclick = () => {
      if (action.url && action.url !== '#') {
        if (action.url.startsWith('http')) {
          chrome.runtime.sendMessage({ type: 'DISMISS_CHECKIN' });
          window.open(action.url, '_blank');
        } else {
          // Internal action like dismiss
          chrome.runtime.sendMessage({ type: 'DISMISS_CHECKIN' });
        }
      } else {
        chrome.runtime.sendMessage({ type: 'DISMISS_CHECKIN' });
      }
      overlay.remove();
    };
    actionsDiv.appendChild(btn);
  });
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Dismiss';
  closeBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  `;
  closeBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: 'DISMISS_CHECKIN' });
    overlay.remove();
  };
  
  // Assemble modal
  modal.appendChild(messageDiv);
  modal.appendChild(actionsDiv);
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Click outside to dismiss
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      chrome.runtime.sendMessage({ type: 'DISMISS_CHECKIN' });
      overlay.remove();
    }
  };
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  if (!document.head.querySelector('#mindful-animations')) {
    style.id = 'mindful-animations';
    document.head.appendChild(style);
  }
}

/**
 * Show a visual check-in indicator
 * Can be called from anywhere, sets up message listener if needed
 */
function showCheckInIndicator() {
  console.log('showCheckInIndicator() called');
  
  // Remove any existing overlay first
  const existingOverlay = document.getElementById('mindful-checkin-overlay');
  if (existingOverlay) {
    console.log('Removing existing overlay');
    existingOverlay.remove();
  }
  
  // Ensure document body exists
  if (!document.body) {
    console.error('document.body is not ready, waiting...');
    // Wait a bit and try again
    setTimeout(() => {
      showCheckInIndicator();
    }, 500);
    return;
  }
  
  // Create overlay div
  const overlay = document.createElement('div');
  overlay.id = 'mindful-checkin-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: fadeIn 0.3s ease-in;
  `;
  
  overlay.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">
      🌸 Mindful Check-in
    </div>
    <div style="color: #6b7280; font-size: 13px;">
      Looks like you've been scrolling for a while — how are you feeling?
    </div>
    <button id="checkin-close" style="
      margin-top: 10px;
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    ">Got it</button>
  `;
  
  document.body.appendChild(overlay);
  
  // Add fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Close button handler
  document.getElementById('checkin-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    overlay.remove();
  }, 10000);
}

// Assign to window immediately (function is hoisted)
console.log('About to assign showCheckInIndicator to window...');
console.log('Type of showCheckInIndicator:', typeof showCheckInIndicator);
window.mindfulShowCheckIn = showCheckInIndicator;
if (typeof document !== 'undefined') {
  document.mindfulShowCheckIn = showCheckInIndicator;
}
console.log('✅ After assignment - typeof window.mindfulShowCheckIn:', typeof window.mindfulShowCheckIn);
console.log('✅ window.mindfulShowCheckIn is:', window.mindfulShowCheckIn);
console.log('Type this to test: window.mindfulShowCheckIn()');

/**
 * Monitor scroll activity with throttling
 */
let scrollCheckInterval;

function startScrollMonitoring() {
  // Clear any existing interval
  if (scrollCheckInterval) {
    clearInterval(scrollCheckInterval);
  }
  
  // Check every 5 seconds
  scrollCheckInterval = setInterval(() => {
    // Check for continuous scrolling
    if (hasBeenScrollingTooLong() && !checkInSent) {
      requestCheckIn('time');
      return;
    }
    
    // Check for doom scrolling
    if (isDoomScrolling() && !checkInSent) {
      requestCheckIn('scroll_rate');
      return;
    }
  }, 5000);
}

/**
 * Reset scroll monitoring when user stops scrolling
 */
function resetScrollMonitoring() {
  scrollDistance = 0;
  scrollStartTime = Date.now();
}

// Attach scroll listener with throttling
let scrollTimeout;
window.addEventListener('scroll', () => {
  handleScroll();
  
  // Clear previous timeout
  clearTimeout(scrollTimeout);
  
  // Set new timeout to reset monitoring after user stops scrolling
  scrollTimeout = setTimeout(() => {
    resetScrollMonitoring();
  }, 2000); // 2 seconds of no scrolling = user stopped
}, { passive: true });

// Start monitoring on page load
startScrollMonitoring();

// Reset on page visibility change (user switched tabs)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resetScrollMonitoring();
    checkInSent = false;
  }
});

/**
 * Initialize tracking state
 */
function init() {
  console.log('🤖 Mindful Social content script initialized on', window.location.hostname);
  
  // Re-assign in case it wasn't set earlier
  if (typeof showCheckInIndicator !== 'undefined') {
    window.mindfulShowCheckIn = showCheckInIndicator;
    document.mindfulShowCheckIn = showCheckInIndicator;
  }
  
  console.log('✅ Content script fully ready! Test with: window.mindfulShowCheckIn()');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (scrollCheckInterval) {
    clearInterval(scrollCheckInterval);
  }
});
