const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ override: true });

// Sanitize ANTHROPIC_BASE_URL if it contains Markdown syntax
if (process.env.ANTHROPIC_BASE_URL && process.env.ANTHROPIC_BASE_URL.includes('](')) {
    console.log('⚠️  Detected Markdown in ANTHROPIC_BASE_URL, sanitizing...');
    const match = process.env.ANTHROPIC_BASE_URL.match(/\((https?:\/\/[^)]+)\)/);
    if (match) {
        process.env.ANTHROPIC_BASE_URL = match[1];
        console.log('✅ Sanitized Base URL:', process.env.ANTHROPIC_BASE_URL);
    }
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

console.log('Testing API with:');
console.log('- Base URL:', process.env.ANTHROPIC_BASE_URL);
console.log('- API Key length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('- Model: anthropic/claude-sonnet-4.5');
console.log('\nSending request...\n');

client.messages.create({
  model: 'anthropic/claude-sonnet-4.5',
  max_tokens: 10,
  messages: [{ role: 'user', content: 'Hi' }]
}).then(response => {
  console.log('✅ Success!');
  console.log('Response:', JSON.stringify(response, null, 2));
}).catch(error => {
  console.log('❌ Error:', error.message);
  console.log('Status:', error.status);
  console.log('Error details:', error);
});
