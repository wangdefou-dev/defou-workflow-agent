import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

let ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;
// Sanitize ANTHROPIC_BASE_URL if it contains Markdown syntax
if (ANTHROPIC_BASE_URL && ANTHROPIC_BASE_URL.includes('](')) {
  const match = ANTHROPIC_BASE_URL.match(/\((https?:\/\/[^)]+)\)/);
  if (match) {
    ANTHROPIC_BASE_URL = match[1];
  }
}

export const CONFIG = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL: ANTHROPIC_BASE_URL,
  INPUT_DIR: path.resolve(__dirname, '../inputs'),
  OUTPUT_DIR: path.resolve(__dirname, '../outputs'),
  OUTPUT_ARTICLES_DIR: path.resolve(__dirname, '../outputs/articles'),
  OUTPUT_TRENDS_DIR: path.resolve(__dirname, '../outputs/trends'),
  PROCESSING_DIR: path.resolve(__dirname, '../processing'),
  ARCHIVE_DIR: path.resolve(__dirname, '../archive'),
  ERRORS_DIR: path.resolve(__dirname, '../errors'),
  // If true, uses a dummy response instead of calling the API (to save credits/testing)
  MOCK_MODE: process.env.MOCK_MODE === 'true'
};

if (!CONFIG.ANTHROPIC_API_KEY && !CONFIG.MOCK_MODE) {
  console.warn("⚠️  Warning: ANTHROPIC_API_KEY is missing in .env file.");
  console.warn("   You can still run in Mock Mode by setting MOCK_MODE=true in .env");
}
