/**
 * Hugging Face AI Integration for Mindful Social
 * Model A: Conversational Message Generator (Identity Reinforcement)
 * Model B: Productive Alternative Generator (Button Curation)
 */

import { HUGGING_FACE_TOKEN } from './config.js';

const HF_API_BASE = 'https://router.huggingface.co/v1/chat/completions';

/**
 * Model A: Generate a supportive 3-line coaching message
 * @param {string} goal - User's primary goal
 * @param {string} site - Current site domain
 * @param {string} tone - Message tone (e.g., 'warm but firm')
 * @returns {Promise<string>} Generated coaching message
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
  
export async function generateCoachingMessage({ goal, site, tone }) {

    const payload = {
        model: "openai/gpt-oss-120b:groq", // or other available models
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
        
        // Extract message from OpenAI-style response
        const message = data.choices?.[0]?.message?.content || '';
        
        console.log('✅ Generated message:', message);
        return message.trim() || `Remember your goal: ${goal}. You've got this! 🎯`;
        
      } catch (error) {
        console.error('❌ HF Router error:', error);
        return `Remember your goal: ${goal}. You've got this! 🎯`;
      }
  /*const payload = {
    inputs: `
    System: Act as a supportive, but firm, productivity coach. Your tone must be ${tone}.
    User Goal: ${goal}
    Context: The user is 5 minutes over their limit on ${site}.
    Instruction: Generate a 3-line response that connects their distraction back to their goal and gives a supportive push to close the tab.
    `,
  };
  
  try {
    const response = await fetch(HF_API_BASE + 'mistralai/Mistral-Small-3.2-24B-Instruct-2506', {
      headers: {
        Authorization: 'Bearer ' + HUGGING_FACE_TOKEN,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`HF API error: ${response.status} ${response.statusText}`);
      }
    const data = await response.json();
    console.log('HF API Response:', data);
    const generatedText = data[0]?.generated_text || '';
    
    // Clean up the message if it includes the prompt
    const message = generatedText
      .split('\n')
      .filter(line => 
        line.trim() && 
        !line.includes('System:') && 
        !line.includes('User Goal:') && 
        !line.includes('Context:') && 
        !line.includes('Instruction:')
      )
      .join('\n')
      .trim();
    
    return message || 'Stay focused — you have got this!';
   
  } catch (error) {
    console.error('HF coaching error:', error);
    return data[0].generated_text;
   //return 'Stay focused — you have got this! Remember your goals.';
  }*/
}

/**
 * Model B: Generate 3 context-relevant action buttons
 * @param {string} interest - User's interest/goal
 * @param {Array} actionPool - Existing actions from storage
 * @returns {Promise<Array>} Array of action objects with label and url
 */
export async function generateAlternativeActions({ interest, actionPool }) {


  const payload = {
    model: "openai/gpt-oss-120b:groq",
    messages: [
      {
        role: "system",
        content: `You are a productivity assistant that gives contextually aligned actions.
Each suggestion MUST directly relate to the user's goal topic and never drift away.

Rules:
1. Keep the main topic central to all suggestions.
2. Use verbs like "read," "skim," "summarize," etc., but always apply them to the same topic.
3. Respond only in JSON as:
[{"label": "...", "topic": ""}, ...]
`
      },
      {
        role: "user",
        content: 
        `
Generate 3 micro-actions the user can immediately take to make progress toward this goal. 
Each must stay tightly on-topic and directly relate to the user's goal topic _${interest}_.
`
        /*""`Based on the user's interest in "${interest}" and wanting to achieve the short term goal of "${actionPool}, suggest 3 quick activities from this pool: ${JSON.stringify(actionPool)}. Return a JSON array with objects containing 'label' and 'url' fields. Example format: [{"label": "Take a walk", "url": "https://example.com"}]`*/
      }
    ],
    max_tokens: 250,
    temperature: 0.7
  };
  
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
    
    // Extract the message content
    const content = data.choices?.[0]?.message?.content || '[]';
    console.log('📄 Content:', content);
    
    let actions = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      actions = JSON.parse(jsonStr);
      console.log('✅ Parsed actions:', actions);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response:', parseError);
      actions = [];
    }
    
    // Validate and use fallback if needed
    if (!Array.isArray(actions) || actions.length === 0) {
      console.log('⚠️ Using fallback actions');
      actions = getFallbackActions(interest);
    }
    
    // Ensure each action has required fields
    return actions.slice(0, 3).map(action => ({
      label: action.label || 'Take a mindful break',
      url: action.url || `https://www.google.com/search?q=${encodeURIComponent(action.label || interest)}`
    }));
    
  } catch (error) {
    console.error('❌ HF alternatives error:', error);
    return getFallbackActions(interest);
  }
}

// Helper function for fallback actions
function getFallbackActions(interest) {
  return [
    { label: 'Take 5 deep breaths', url: '#' },
    { label: 'Read an article about ' + interest, url: `https://www.google.com/search?q=${encodeURIComponent(interest)}` },
    { label: 'Watch a 5-min educational video', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(interest) }
  ];

  /*const payload = {
    inputs: `
    System: You are a content curator. Based on the user's interest "${interest}", provide three diverse, low-friction alternative activities.
    Choose from this pool: ${JSON.stringify(actionPool)}
    Output must be a clean JSON array with 'label' and 'url' fields only.
    `,
  };
  
  try {
    const response = await fetch(HF_API_BASE + 'facebook/bart-large-mnli', {
      headers: {
        Authorization: 'Bearer ' + HUGGING_FACE_TOKEN,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    let actions = [];
    
    try {
      const text = (data[0] && data[0].generated_text) ? data[0].generated_text : '[]';
      // Extract JSON from response
      const jsonMatch = text.match(/\[.*\]/s);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      actions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse HF response, using fallback:', parseError);
      actions = [];
    }
    
    // Fallback if parsing fails or empty response
    if (!Array.isArray(actions) || actions.length === 0) {
      actions = [
        { label: 'Take 5 deep breaths', url: '#' },
        { label: 'Read one Stoic quote', url: 'https://dailystoic.com' },
        { label: 'Do 5 mins of Spanish vocab', url: 'https://duolingo.com' },
      ];
    }
    
    // Ensure each action has a label and generate URL if missing
    return actions.slice(0, 3).map(action => {
      if (!action.label) {
        action.label = 'Take a mindful break';
      }
      // Generate search URL if no URL provided
      if (!action.url || action.url === '#') {
        action.url = `https://www.google.com/search?q=${encodeURIComponent(action.label)}`;
      }
      return action;
    });
  } catch (error) {
    console.error('HF alternatives error:', error);
    // Fallback actions
    return [
      { label: 'Take 5 deep breaths', url: '#' },
      { label: 'Read one Stoic quote', url: 'https://dailystoic.com' },
      { label: 'Do 5 mins of Spanish vocab', url: 'https://duolingo.com' },
    ];
  }*/
}

