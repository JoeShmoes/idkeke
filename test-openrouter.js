
const apiKey = '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';
const model = 'deepseek/deepseek-r1:free';

console.log(`Testing OpenRouter API...`);
console.log(`Model: ${model}`);

async function testAI() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
        // Removed optional headers
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: "Hello" }
        ],
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
    } else {
        const data = await response.json();
        console.log("Success! Response:");
        console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Network/Script Error:", error);
  }
}

testAI();
