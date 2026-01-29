import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch'; // We might need to install this or use built-in if node version is high enough. Using https for node 18+

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.ANTHROPIC_BASE_URL; // e.g. https://zenmux.ai/api/anthropic

console.log('🔍 Starting API Diagnostics...');
console.log(`🔑 Key length: ${API_KEY?.length}`);
console.log(`🌐 Base URL: ${BASE_URL}`);

const payload = {
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 10,
  messages: [{ role: "user", content: "Hi" }]
};

async function testUrl(url: string) {
  console.log(`\nTesting Endpoint: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(`👉 Status: ${response.status}`);
    console.log(`👉 Response: ${text.substring(0, 200)}...`);
    
    if (response.status === 200) {
      console.log('✅ SUCCESS! This is the correct URL.');
      return true;
    }
  } catch (error: any) {
    console.log(`❌ Network Error: ${error.message}`);
  }
  return false;
}

async function run() {
  if (!BASE_URL) return;

  // Scenario 1: SDK adds /messages automatically. Let's try what SDK does.
  // If base is .../anthropic, SDK likely hits .../anthropic/messages
  await testUrl(`${BASE_URL}/messages`);

  // Scenario 2: Maybe it needs /v1/messages
  await testUrl(`${BASE_URL}/v1/messages`);

  // Scenario 3: Maybe the user provided URL ALREADY has /v1 implied?
  // Try removing /api/anthropic and adding /v1 (Standard OpenAI/OneAPI style)
  // But user said specifically /api/anthropic. 
}

run();
