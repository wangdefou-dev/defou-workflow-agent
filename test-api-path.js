const fetch = require('node-fetch');

const baseUrl = 'https://api.aigocode.com';
const key = 'sk-09a5867daeaf092f36e04bd8dfef4254f3f30d396c23fd11a3671ce4199dc5d1';

const paths = [
    '/v1/chat/completions',
    '/api/v1/chat/completions',
    '/chat/completions',
    '/v1/messages',
    '/messages',
    '/api/v1/messages',
    '/v1/models'
];

async function test() {
    console.log('Testing API paths...');
    
    for (const path of paths) {
        const url = `${baseUrl}${path}`;
        try {
            const method = path.includes('models') ? 'GET' : 'POST';
            const body = method === 'POST' ? JSON.stringify({
                model: 'gpt-3.5-turbo', // use a safe model for testing path
                messages: [{role: 'user', content: 'hi'}],
                max_tokens: 1
            }) : undefined;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body
            });
            
            console.log(`${url} -> ${res.status} ${res.statusText}`);
            if (res.status === 200) {
                const text = await res.text();
                console.log('Response:', text.substring(0, 100));
            } else if (res.status !== 404) {
                const text = await res.text();
                console.log('Response Error Body:', text.substring(0, 100));
            }
        } catch (e) {
            console.log(`${url} -> Error: ${e.message}`);
        }
    }
}

test();
