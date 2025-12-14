// api/huggingface-proxy.js
export default async function (req, res) {
    // Set CORS headers to allow your extension to call this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Get API key and model from environment variables
    const API_KEY = process.env.HUGGINGFACE_API_KEY;
    const MODEL = process.env.HUGGINGFACE_MODEL || "openai/gpt-oss-120b:groq";
  
    // Check if API key exists
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
  
    try {
      console.log('🤖 Proxying request to Hugging Face...');
      
      // Forward the request to Hugging Face
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: req.body.messages,
          max_tokens: req.body.max_tokens || 1000,
          temperature: req.body.temperature || 0.7
        })
      });
  
      const data = await response.json();
      
      // Return the response
      res.status(response.status).json(data);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ error: error.message });
    }
  }