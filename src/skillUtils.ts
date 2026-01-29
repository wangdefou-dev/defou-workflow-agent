import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
  const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;

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
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 4000,
    temperature = 0.7
  } = options;

  // 将 system 消息合并到 prompt 中，因为某些第三方 API 不支持独立的 system 参数
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: fullPrompt }]
  });

  return (msg.content[0] as any).text;
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return process.env.MOCK_MODE === 'true';
}
