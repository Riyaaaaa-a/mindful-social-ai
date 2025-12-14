/**
 * Hugging Face AI Integration for Mindful Social
 * Uses backend proxy for secure API key management
 */

import { API_CONFIG } from './config.js';

const HF_API_BASE = API_CONFIG.BACKEND_URL;

/**
 * Test backend connection
 */
export async function testHuggingFaceRouter() {
  console.log('🧪 Testing backend proxy...');
  
  try {
    const endpoint = `${HF_API_BASE}/api/huggingface-proxy`;
    console.log('📍 Fetching from:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Say hello in one sentence"
          }
        ],
        max_tokens: 50
      })
    });
    
    console.log('📡 Response status:', response.status);
    
    const text = await response.text();
    console.log('📄 Response:', text);
    
    if (response.status === 200) {
      const data = JSON.parse(text);
      console.log('✅ Success! Message:', data.choices?.[0]?.message?.content);
      return true;
    } else {
      console.error('❌ Error:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

/**
 * Generate coaching message
 */
export async function generateCoachingMessage({ goal, site, tone }) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are "Mindful Coach" — an empathetic but firm productivity companion.
Your goal: help users stop mindless scrolling and reconnect with their purpose.
Always sound human, warm, and specific. 
Keep your tone ${tone} and responses under 3 lines.`
      },
      {
        role: "user",
        content: `User goal: ${goal}, Current site: ${site}
User behavior: has exceeded their screen time limit.
Task: Write a message that acknowledges the distraction, connects back to their goal, 
and ends with a gentle or firm call to action.

Example:
"Hey, remember why you started — a few more minutes here won't teach you Spanish. 
Let's get back to the version of you that follows through."

Now write one new message like this.`
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  };
  
  try {
    console.log('🤖 Calling backend proxy...');
    const endpoint = `${HF_API_BASE}/api/huggingface-proxy`;
    console.log('📍 Fetching from:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📡 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!response.ok) {
      console.error('❌ API error:', responseText);
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('📦 Parsed data:', data);
    
    const message = data.choices?.[0]?.message?.content || '';
    
    console.log('✅ Generated message:', message);
    return message.trim() || `Remember your goal: ${goal}. You've got this! 🎯`;
    
  } catch (error) {
    console.error('❌ Backend error:', error);
    return `Remember your goal: ${goal}. You've got this! 🎯`;
  }
}

/**
 * Generate alternative actions
 */
export async function generateAlternativeActions({ interest, actions = [] }) {
  const payload = {
    messages: [
      {
        role: "system",
        content: `You are a concise, professional productivity assistant that returns contextually-aligned micro-actions for a user's stated goal.
Behavior rules (must follow):
1) Keep every suggestion tightly on-topic relative to the user's main goal.
2) Use specific, actionable verbs (e.g., "Watch", "Draft", "Practice", "Search for", "Read").
3) Provide a focused SEARCH QUERY for each suggestion that will surface immediately useful resources.
4) Output only valid JSON (no extra commentary). The response must be a JSON array with exactly three objects.
5) If the user provides 1–3 explicit actions (each with optional URLs), include ALL of them FIRST in the output, in the same order.
6) For each user-provided action:
   - Keep the original label.
   - Include the provided URL if present.
   - Generate a useful searchQuery.
7) If fewer than 3 actions are provided, generate the remaining actions based strictly on the user goal.
8) If no actions is provided, generate three micro-actions derived from the user's goal.
9) Never drift away from the goal topic or invent unrelated tasks.
10) Respond only in JSON as:
 [{"label": "action description", "searchQuery": "specific search term"}, ...]

MOST IMPORTANT: OUTPUT ONLY THE FINAL JSON ARRAY. DO NOT output any reasoning, explanation, or additional text.`
      },
      {
        role: "user",
        content: `User goal: "${interest}"
actions: ${JSON.stringify(actions)}

Instructions:
- Generate 3 micro-actions the user can immediately take to make progress toward this goal.
- If actions is provided, use that exact action as the FIRST item (include the url field when action_url is present).
- Otherwise, create three new actions derived from the user goal.
- Each action must include a short, specific searchQuery that will find relevant content.
- Output only the JSON array that matches the schema above.`
      }
    ],
    max_tokens: 750,
    temperature: 0
  };
  
  try {
    console.log('🤖 Generating alternative actions...');
    const endpoint = `${HF_API_BASE}/api/huggingface-proxy`;
    console.log('📍 Fetching from:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Response:', data);
    
    const content = data.choices?.[0]?.message?.content || '[]';
    console.log('📄 Content:', content);
    
    let actionsArray = [];
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      actionsArray = JSON.parse(jsonStr);
      console.log('✅ Parsed actions:', actionsArray);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response:', parseError);
      actionsArray = [];
    }
    
    if (!Array.isArray(actionsArray) || actionsArray.length === 0) {
      console.log('⚠️ Using fallback actions');
      actionsArray = getFallbackActions(interest);
    }
    
    // Add URLs using search
    const actionsWithUrls = await Promise.all(
      actionsArray.slice(0, 3).map(async (action) => {
        const searchQuery = action.searchQuery || action.label || interest;
        
        // If user provided URL, use it
        if (action.url && action.url.trim()) {
          const providedUrl = normalizeUrl(action.url.trim());
          return {
            label: action.label || "Take a mindful break",
            searchQuery,
            url: providedUrl,
            source: "user-provided"
          };
        }
        
        // Otherwise create search URL
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        
        return {
          label: action.label || "Take a mindful break",
          searchQuery,
          url,
          source: "auto-searched"
        };
      })
    );
    
    console.log("✅ Actions with URLs:", actionsWithUrls);
    return actionsWithUrls;
    
  } catch (error) {
    console.error('❌ Backend error:', error);
    return getFallbackActionsWithUrls(interest);
  }
}

function normalizeUrl(maybeUrl) {
  if (!maybeUrl) return "";
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  return "https://" + maybeUrl.replace(/^\/*/, "");
}

function getFallbackActions(interest) {
  return [
    { label: 'Take 5 deep breaths', searchQuery: 'breathing exercises 5 minutes' },
    { label: 'Read an article about ' + interest, searchQuery: interest + ' beginner guide' },
    { label: 'Watch a 5-min educational video', searchQuery: interest + ' tutorial youtube' }
  ];
}

async function getFallbackActionsWithUrls(interest) {
  const fallbackActions = getFallbackActions(interest);
  return fallbackActions.map(action => ({
    label: action.label,
    url: `https://www.google.com/search?q=${encodeURIComponent(action.searchQuery)}`
  }));
}