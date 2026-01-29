const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

console.log('Testing API with system in messages...\n');

// 方法1：将 system 作为第一条 user 消息
client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 100,
  temperature: 0.7,
  messages: [
    { role: 'user', content: '你是一位内容策略专家，擅长选题分析。\n\n你好' }
  ]
}).then(response => {
  console.log('✅ Success with system in user message!');
  console.log('Response:', response.content[0].text);
}).catch(error => {
  console.log('❌ Error:', error.message);
});
