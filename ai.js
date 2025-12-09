/**
 * Hugging Face AI Integration for Mindful Social
 * Model A: Conversational Message Generator (Identity Reinforcement)
 * Model B: Productive Alternative Generator (Button Curation)
 * Enhanced with Web Search API for relevant link discovery
 */

import { HUGGING_FACE_TOKEN } from './config.js';

const HF_API_BASE = 'https://router.huggingface.co/v1/chat/completions';

/**
 * Search for most relevant link using a search API
 * @param {string} query - Search query
 * @returns {Promise<string>} Most relevant URL
 */
async function searchRelevantLink(query) {
  try {
    console.log('🔍 Searching for:', query);
    
    // Using DuckDuckGo Instant Answer API (no key required)
    // Alternative: Use Brave Search API, Bing API, or Google Custom Search API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    
    const data = await response.json();
    
    // Try to get the most relevant result
    if (data.AbstractURL) {
      console.log('✅ Found abstract URL:', data.AbstractURL);
      return data.AbstractURL;
    }
    
    // Check related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const firstTopic = data.RelatedTopics[0];
      if (firstTopic.FirstURL) {
        console.log('✅ Found related topic URL:', firstTopic.FirstURL);
        return firstTopic.FirstURL;
      }
    }
    
    // Fallback to Google search if no direct result
    console.log('⚠️ No direct result, using Google search');
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
  } catch (error) {
    console.error('❌ Search error:', error);
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

/**
 * Enhanced search using Brave Search API (requires API key)
 * More reliable than DuckDuckGo for getting direct URLs
 * @param {string} query - Search query
 * @returns {Promise<string>} Most relevant URL
 */
async function searchWithBrave(query) {
  const BRAVE_API_KEY = 'YOUR_BRAVE_API_KEY'; // Add to config.js
  
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get the first web result
    if (data.web && data.web.results && data.web.results.length > 0) {
      const topResult = data.web.results[0];
      console.log('✅ Found top result:', topResult.url);
      return topResult.url;
    }
    
    throw new Error('No results found');
    
  } catch (error) {
    console.error('❌ Brave Search error:', error);
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

/**
 * Search using SerpAPI (requires API key, very reliable)
 * @param {string} query - Search query
 * @returns {Promise<string>} Most relevant URL
 */
async function searchWithSerpAPI(query) {
  const SERP_API_KEY = 'YOUR_SERP_API_KEY'; // Add to config.js
  
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&num=1`
    );
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get first organic result
    if (data.organic_results && data.organic_results.length > 0) {
      const topResult = data.organic_results[0];
      console.log('✅ Found top result:', topResult.link);
      return topResult.link;
    }
    
    throw new Error('No results found');
    
  } catch (error) {
    console.error('❌ SerpAPI error:', error);
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}

/**
 * Test Hugging Face Router API
 */
export async function testHuggingFaceRouter() {
  console.log('🧪 Testing Hugging Face Router API...');
  console.log('🔑 Token exists:', !!HUGGING_FACE_TOKEN);
  
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-3B-Instruct",
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
    } else if (response.status === 401) {
      console.error('❌ Invalid token!');
      return false;
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
 * Model A: Generate a supportive 3-line coaching message
 * @param {string} goal - User's primary goal
 * @param {string} site - Current site domain
 * @param {string} tone - Message tone (e.g., 'warm but firm')
 * @returns {Promise<string>} Generated coaching message
 */
export async function generateCoachingMessage({ goal, site, tone }) {
  const payload = {
    model: "openai/gpt-oss-120b:groq",
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
Let's get back to the version of you that follows through.

Now write one new message like this.`
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  };
  
  try {
    console.log('🤖 Calling Hugging Face Router API...');
    
    const response = await fetch(HF_API_BASE, {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    console.log('📡 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!response.ok) {
      console.error('❌ API error:', responseText);
      throw new Error(`HF Router API error: ${response.status}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('📦 Parsed data:', data);
    
    const message = data.choices?.[0]?.message?.content || '';
    
    console.log('✅ Generated message:', message);
    return message.trim() || `Remember your goal: ${goal}. You've got this! 🎯`;
    
  } catch (error) {
    console.error('❌ HF Router error:', error);
    return `Remember your goal: ${goal}. You've got this! 🎯`;
  }
}

/**
 * Model B: Generate 3 context-relevant action buttons with REAL URLs
 * @param {string} interest - User's interest/goal
 * @param {Array} actionPool - Existing actions from storage
 * @returns {Promise<Array>} Array of action objects with label and url
 */
export async function generateAlternativeActions({ interest, actions = [] }) {
 
  const payload = {
    model: "openai/gpt-oss-120b:groq",
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
10) 4. Respond only in JSON as:
 [{"label": "action description", "searchQuery": "specific search term"}, ...]

 MOST IMPORTANT-
OUTPUT ONLY THE FINAL JSON ARRAY IN message.content. DO NOT output any reasoning, explanation, or additional text.

Example 
User goal: "Learn Spanish"
actions:[ "Sign up for Duolingo","https://www.duolingo.com/"]
Response:
[
  {"label":"Sign up for Duolingo (5-min setup)", "searchQuery":"duolingo sign up beginner", "url":"https://www.duolingo.com/"},
  {"label":"Complete a 10-min Duolingo lesson", "searchQuery":"duolingo 10 minute lesson beginners"},
  {"label":"Practice 10 high-frequency words", "searchQuery":"most common spanish words list beginners"}
]`

// 
// `You are a productivity assistant that gives contextually aligned actions.
// Each suggestion MUST directly relate to the user's goal topic and never drift away.

// Rules:
// 1. Keep the main topic central to all suggestions.
// 2. Use specific, actionable verbs.
// 3. Provide SEARCH QUERIES that can find relevant content.
// 4. Respond only in JSON as:
// [{"label": "action description", "searchQuery": "specific search term"}, ...]

// Example:
// User goal: "Learn Spanish"
// Response: [
//   {"label": "Watch a 5-min Spanish lesson", "searchQuery": "spanish lesson for beginners youtube"},
//   {"label": "Practice 10 Spanish words", "searchQuery": "common spanish words duolingo"},
//   {"label": "Read a Spanish article", "searchQuery": "easy spanish reading practice"}
// ]`
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
// Generate 3 micro-actions the user can immediately take to make progress toward this goal.  
// Each must stay tightly on-topic and include a specific search query that will find relevant content.`
      }
    ],
    max_tokens: 750,
    temperature: 0
  };
  console.log(actions);
 const json_actions= `${JSON.stringify(actions)}`;
 console.log(json_actions);

  try {
    console.log('🤖 Generating alternative actions...');
    
    const response = await fetch(HF_API_BASE, {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
      throw new Error(`HF API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 HF Response:', data);
   
    const content = data.choices?.[0]?.message?.content || '[]';

  
    console.log('📄 Content:', content);
    
    let actions = [];
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      actions = JSON.parse(jsonStr);
      console.log('✅ Parsed actions:', actions);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response:', parseError);
      actions = [];
    }
    
    if (!Array.isArray(actions) || actions.length === 0) {
      console.log('⚠️ Using fallback actions');
      actions = getFallbackActions(interest);
    }
    
    // NOW: Get real URLs for each action using search API

    function normalizeUrl(maybeUrl) {
      if (!maybeUrl) return "";
      // If it already looks like a http(s) url, return as-is
      if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
      // If user gave something like "www.example.com" or "example.com"
      return "https://" + maybeUrl.replace(/^\/*/, "");
    }
    
    const actionsWithUrls = await Promise.all(
      actions.slice(0, 3).map(async (action) => {
        // prefer explicit searchQuery, else label, else interest
        const searchQuery = action.searchQuery || action.label || interest;
    
        // If user already provided a URL, use it (normalized) and skip searching
        if (action.url && action.url.trim()) {
          const providedUrl = normalizeUrl(action.url.trim());
          return {
            label: action.label || "Take a mindful break",
            searchQuery,
            url: providedUrl,
            source: "user-provided"
          };
        }
    
        // otherwise, try to find a relevant link via search
        let url = "";
        try {
          url = await searchRelevantLink(searchQuery); // your existing search util
          // ensure a fallback if the search returned nothing or weird result
          if (!url || !/^https?:\/\//i.test(url)) {
            url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
          }
        } catch (error) {
          console.error("Search failed for:", searchQuery, error);
          url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        }
    
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
    // const actionsWithUrls = await Promise.all(
    //   actions.slice(0, 3).map(async (action) => {
    //     const searchQuery = action.searchQuery || action.label || interest;
        
    //     // Try to get a real URL
    //     let url;
    //     try {
    //       // Use DuckDuckGo search (free, no API key)
    //       url = await searchRelevantLink(searchQuery);
          
    //       // Alternative: Use Brave or SerpAPI for better results
    //       // url = await searchWithBrave(searchQuery);
    //       // url = await searchWithSerpAPI(searchQuery);
          
    //     } catch (error) {
    //       console.error('Search failed for:', searchQuery, error);
    //       url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    //     }
        
    //     return {
    //       label: action.label || 'Take a mindful break',
    //       url: url
    //     };
    //   })
    // );
    
    // console.log('✅ Actions with URLs:', actionsWithUrls);
    // return actionsWithUrls;
    
  } catch (error) {
    console.error('❌ HF alternatives error:', error);
    return await getFallbackActionsWithUrls(interest);
  }
}

/**
 * Helper function for fallback actions WITH real URLs
 */
async function getFallbackActionsWithUrls(interest) {
  const fallbackActions = [
    { label: 'Take 5 deep breaths', searchQuery: 'breathing exercises 5 minutes' },
    { label: 'Read an article about ' + interest, searchQuery: interest + ' beginner guide' },
    { label: 'Watch a 5-min educational video', searchQuery: interest + ' tutorial youtube' }
  ];
  
  // Get real URLs for fallback actions
  const actionsWithUrls = await Promise.all(
    fallbackActions.map(async (action) => {
      const url = await searchRelevantLink(action.searchQuery);
      return {
        label: action.label,
        url: url
      };
    })
  );
  
  return actionsWithUrls;
}

/**
 * Helper function for fallback actions (synchronous version for emergencies)
 */
function getFallbackActions(interest) {
  return [
    { label: 'Take 5 deep breaths', searchQuery: 'breathing exercises' },
    { label: 'Read an article about ' + interest, searchQuery: interest + ' guide' },
    { label: 'Watch a 5-min video', searchQuery: interest + ' tutorial' }
  ];
}