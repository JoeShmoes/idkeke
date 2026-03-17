// Simple test script for Groq chat completions
// run with `node test-groq.js` after setting GROCK_GPT_API_KEY in your env
// it will also try to load a local .env file if one exists

require('dotenv').config({ path: '.env' });

(async () => {
  const apiKey = process.env.GROCK_GPT_API_KEY;
  console.log('GROCK_GPT_API_KEY value:', apiKey);
  if (!apiKey) {
    console.error('GROCK_GPT_API_KEY not defined (check .env formatting and spaces around = )');
    process.exit(1);
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROCK_MODEL || 'openai/gpt-oss-20b',
        messages: [
          { role: 'user', content: 'What are the latest major AI announcements from this week?' },
        ],
        tools: [{ type: 'browser_search' }],
        tool_choice: 'auto',
        reasoning_effort: 'low',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('API error', res.status, text);
      return;
    }

    const data = await res.json();
    console.log('completion', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('fetch failed', e);
  }
})();