
const apiKey = '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';

async function listModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
    });

    if (!response.ok) {
        console.error(`API Error (${response.status})`);
        return;
    }

    const data = await response.json();
    const models = data.data;
    
    console.log(`Found ${models.length} models.`);
    
    const deepseekModels = models.filter(m => m.id.includes('deepseek'));
    console.log("\n--- DeepSeek Models ---");
    deepseekModels.forEach(m => console.log(`${m.id} (Pricing: ${JSON.stringify(m.pricing)})`));

    const freeModels = models.filter(m => m.id.includes(':free'));
    console.log("\n--- Other Free Models (First 10) ---");
    freeModels.slice(0, 10).forEach(m => console.log(m.id));

  } catch (error) {
    console.error("Network/Script Error:", error);
  }
}

listModels();
