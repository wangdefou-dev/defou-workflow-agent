const fetch = require('node-fetch');
require('dotenv').config({ override: true });

// Sanitize ANTHROPIC_BASE_URL
let baseUrl = process.env.ANTHROPIC_BASE_URL;
if (baseUrl && baseUrl.includes('](')) {
    const match = baseUrl.match(/\((https?:\/\/[^)]+)\)/);
    if (match) baseUrl = match[1];
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = 'anthropic/claude-sonnet-4.5';

console.log('Base URL:', baseUrl);
console.log('API Key length:', apiKey?.length);

async function testUrl(url) {
    console.log(`\nTesting URL: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            const text = await response.text();
            console.log('Error body:', text);
        } else {
            const data = await response.json();
            console.log('Success! Response:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

async function run() {
    // Case 1: /v1/messages (Current implementation)
    let url1 = baseUrl;
    if (!url1.endsWith('/')) url1 += '/';
    url1 += 'v1/messages';
    await testUrl(url1);

    // Case 2: /messages (SDK likely behavior)
    let url2 = baseUrl;
    if (!url2.endsWith('/')) url2 += '/';
    url2 += 'messages';
    await testUrl(url2);
}

run();
