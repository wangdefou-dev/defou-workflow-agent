const fetch = require('node-fetch');
require('dotenv').config({ override: true });

// Sanitize URL
let baseUrl = process.env.ANTHROPIC_BASE_URL;
if (baseUrl && baseUrl.includes('](')) {
    const match = baseUrl.match(/\((https?:\/\/[^)]+)\)/);
    if (match) baseUrl = match[1];
}

// Adjust base URL to models endpoint
// If base is .../api/anthropic, models might be at .../api/models or similar?
// Usually proxies follow OpenAI or Anthropic patterns.
// Anthropic doesn't have a standard /models endpoint in the same way OpenAI does, but proxies often do.
// Let's try standard OpenAI-like endpoint which many proxies use: v1/models
// But zenmux might be different.
// Let's try the root of the API or look for documentation.
// Assuming it might be compatible with OpenAI style listing or we just test the user's model name.

// Actually, let's just try to test the model the user GAVE US: anthropic/claude-sonnet-4.5
// But wait, the user said "I use model anthropic/claude-sonnet-4.5".
// This format "provider/model" looks like OpenRouter or similar.

const url = 'https://zenmux.ai/api/v1/models'; // Guessing the models endpoint
const key = process.env.ANTHROPIC_API_KEY;

console.log('Using Base URL:', baseUrl);

async function listModels() {
    try {
        // Try to fetch models list if possible, or just test the specific model
        console.log('Listing models from:', url);
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) {
            console.log('Failed to list models:', res.status, res.statusText);
            const text = await res.text();
            console.log('Response:', text);
            return;
        }
        const data = await res.json();
        console.log('Models:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

listModels();
