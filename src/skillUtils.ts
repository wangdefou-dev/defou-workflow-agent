import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

/**
 * Initialize environment variables and return project root
 */
export function initializeEnv(): string {
  const projectRoot = path.resolve(__dirname, '../');
  const envPath = path.join(projectRoot, '.env');

  console.log(`Loading .env from: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
  } else {
    console.error('❌ .env file NOT found');
  }

  dotenv.config({ path: envPath, override: true });

  return projectRoot;
}

/**
 * Initialize Anthropic client with environment variables
 */
export function initializeAnthropic(): Anthropic {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  let ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;

  // Sanitize ANTHROPIC_BASE_URL if it contains Markdown syntax
  if (ANTHROPIC_BASE_URL && ANTHROPIC_BASE_URL.includes('](')) {
    const match = ANTHROPIC_BASE_URL.match(/\((https?:\/\/[^)]+)\)/);
    if (match) {
      ANTHROPIC_BASE_URL = match[1];
      console.log('✅ Sanitized Base URL:', ANTHROPIC_BASE_URL);
    }
  }

  return new Anthropic({
    apiKey: ANTHROPIC_API_KEY || 'dummy',
    baseURL: ANTHROPIC_BASE_URL,
    defaultHeaders: {
      'anthropic-version': '2023-06-01',
    },
  });
}

/**
 * Options for calling Claude API
 */
export interface ClaudeCallOptions {
  anthropic: Anthropic;
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Unified Claude API call function
 * Returns the text content from the first message
 */
export async function callClaude(options: ClaudeCallOptions): Promise<string> {
  const {
    anthropic,
    system,
    prompt,
    model = 'anthropic/claude-sonnet-4.5',
    maxTokens = 4000,
    temperature = 0.7
  } = options;

  if (isMockMode()) {
    console.log('🤖 Mock Mode: Returning dummy response for Claude call');
    return `
Here is a mock response.

If you are looking for JSON:
\`\`\`json
[
  {
    "rank": "1",
    "title": "Mock Topic 1",
    "source": "Mock Source",
    "reason": "This is a mock topic for testing purposes."
  },
  {
    "rank": "2",
    "title": "Mock Topic 2",
    "source": "Mock Source",
    "reason": "Another mock topic."
  }
]
\`\`\`

If you are looking for content:
This is some mock content generated because MOCK_MODE is enabled.
It simulates a response from Claude.
    `;
  }

  // Retry logic
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Use SDK for better compatibility
      console.log(`DEBUG: Sending request with model: ${model}`);
      const msg = await anthropic.messages.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      });

      if (msg.content && msg.content.length > 0 && (msg.content[0] as any).text) {
        return (msg.content[0] as any).text;
      } else {
        throw new Error('Unexpected response format from API');
      }

    } catch (error: any) {
      attempt++;
      
      // Extract status code if available
      const status = error.status || (error.response ? error.response.status : undefined);
      const errorMessage = error.message || String(error);

      console.error(`❌ API Request Failed (Attempt ${attempt}/${maxRetries}):`, errorMessage);
      
      // Retry on 5xx errors or 429 (Too Many Requests) or network errors
      if (attempt < maxRetries && (status >= 500 || status === 429 || !status)) {
          const delay = 1000 * Math.pow(2, attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
      }
      
      throw error;
    }
  }

  throw new Error('Max retries reached');
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return process.env.MOCK_MODE === 'true';
}
