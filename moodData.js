/**
 * Mindful Social - Mood Data Aggregation Helper
 * Aggregates mood logs and tracking data by day
 */

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Aggregate mood logs and tracking data by day
 * Returns array of daily aggregates with mood counts and minutes active
 */
async function aggregateMoodDataByDay() {
  try {
    // Get mood logs and tracking data
    const { moodLogs, trackingData } = await chrome.storage.local.get(['moodLogs', 'trackingData']);
    const logs = Array.isArray(moodLogs) ? moodLogs : [];
    const tracking = Array.isArray(trackingData) ? trackingData : [];
    
    // Create a map to aggregate by date
    const dailyData = new Map();
    
    // Process mood logs
    logs.forEach(log => {
      if (!log.timestamp || !log.mood) return;
      
      const date = new Date(log.timestamp);
      const dateStr = getDateString(date);
      
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          date: dateStr,
          inspiredCount: 0,
          okayCount: 0,
          drainedCount: 0,
          minutesActive: 0
        });
      }
      
      const dayData = dailyData.get(dateStr);
      if (log.mood === 'inspired') {
        dayData.inspiredCount++;
      } else if (log.mood === 'okay') {
        dayData.okayCount++;
      } else if (log.mood === 'drained') {
        dayData.drainedCount++;
      }
    });
    
    // Process tracking data to get minutes active per day
    tracking.forEach(entry => {
      if (!entry.date || !entry.duration_minutes) return;
      
      const dateStr = entry.date;
      
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          date: dateStr,
          inspiredCount: 0,
          okayCount: 0,
          drainedCount: 0,
          minutesActive: 0
        });
      }
      
      dailyData.get(dateStr).minutesActive += entry.duration_minutes || 0;
    });
    
    // Convert map to array and sort by date (most recent first)
    const aggregated = Array.from(dailyData.values());
    aggregated.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return aggregated;
  } catch (error) {
    console.error('Error aggregating mood data:', error);
    return [];
  }
}

/**
 * Format date for display
 */
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === getDateString(today)) {
    return 'Today';
  } else if (dateString === getDateString(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}






