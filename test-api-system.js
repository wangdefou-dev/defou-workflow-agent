const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

console.log('Testing API with system parameter...\n');

client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 100,
  temperature: 0.7,
  system: '你是一位内容策略专家，擅长选题分析。',
  messages: [{ role: 'user', content: '你好' }]
}).then(response => {
  console.log('✅ Success with system parameter!');
  console.log('Response:', response.content[0].text);
}).catch(error => {
  console.log('❌ Error with system parameter:', error.message);
  console.log('Status:', error.status);
});
