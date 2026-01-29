const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

console.log('Testing API with:');
console.log('- Base URL:', process.env.ANTHROPIC_BASE_URL);
console.log('- API Key length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('- Model: claude-sonnet-4-5-20250929');
console.log('\nSending request...\n');

client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
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
