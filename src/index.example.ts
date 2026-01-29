/**
 * Example: Updated index.ts using the new outputManager
 * This demonstrates how to migrate from the old output saving logic
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import chokidar from 'chokidar';
import pLimit from 'p-limit';
import { CONFIG } from './config';
import { DEFOU_SYSTEM_PROMPT } from './templates';
import { saveOutput, archiveFile, getOutputDir, createIndexFile } from './outputManager';

// Limit concurrency to 2 simultaneous requests to avoid Rate Limits
const limit = pLimit(2);

// Initialize Anthropic Client
const anthropic = new Anthropic({
  apiKey: CONFIG.ANTHROPIC_API_KEY || 'dummy',
  baseURL: CONFIG.ANTHROPIC_BASE_URL,
});

async function main() {
  ensureDirectories();

  // Watch Mode
  console.log(`👀 Watching for new files in: ${CONFIG.INPUT_DIR}`);
  console.log(`🚀 Concurrency limit: 2`);

  const watcher = chokidar.watch(CONFIG.INPUT_DIR, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);
    if (!['.md', '.txt', '.json'].includes(path.extname(fileName))) return;

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!fs.existsSync(filePath)) return;

    limit(() => processFile(filePath, fileName));
  });
}

async function processFile(filePath: string, fileName: string) {
  console.log(`\\n⏳ Detected: ${fileName}`);

  // 1. Move to Processing Directory
  const processingPath = path.join(CONFIG.PROCESSING_DIR, fileName);
  try {
    fs.renameSync(filePath, processingPath);
    console.log(`   -> Moved to Processing: ${processingPath}`);
  } catch (err) {
    console.error(`❌ Failed to move file to processing: ${err}`);
    return;
  }

  try {
    const content = fs.readFileSync(processingPath, 'utf-8');
    let markdownContent: string;

    console.log(`   🤖 Generating content for ${fileName}...`);

    if (CONFIG.MOCK_MODE) {
      await new Promise(r => setTimeout(r, 1000));
      markdownContent = getMockResult();
    } else {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        temperature: 0.7,
        system: DEFOU_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Here is the raw content:\\n\\n${content}` }
        ]
      });

      markdownContent = (msg.content[0] as any).text;
    }

    // 2. Save Output using new outputManager
    const outputPath = saveOutput({
      outputDir: CONFIG.OUTPUT_ARTICLES_DIR,
      content: markdownContent,
      metadata: {
        sourceType: 'input_file',
        sourceFile: fileName,
        sourceTitle: path.basename(fileName, path.extname(fileName)),
        generatedAt: new Date(),
        processedBy: 'defou-workflow-agent'
      }
    });

    console.log(`   ✅ Report saved: ${outputPath}`);

    // 3. Archive Original using new outputManager
    const archivePath = archiveFile(processingPath, CONFIG.ARCHIVE_DIR);
    console.log(`   📦 Archived original: ${archivePath}`);

    // 4. Update index file
    createIndexFile(CONFIG.OUTPUT_ARTICLES_DIR);

  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);

    // Move to Error Directory
    const errorPath = path.join(CONFIG.ERRORS_DIR, fileName);
    if (fs.existsSync(processingPath)) {
      fs.renameSync(processingPath, errorPath);
      fs.writeFileSync(`${errorPath}.log`, JSON.stringify(error, null, 2));
      console.log(`   ⚠️  Moved to Errors: ${errorPath}`);
    }
  }
}

function ensureDirectories() {
  [CONFIG.INPUT_DIR, CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_ARTICLES_DIR, CONFIG.OUTPUT_TRENDS_DIR, CONFIG.PROCESSING_DIR, CONFIG.ARCHIVE_DIR, CONFIG.ERRORS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function getMockResult(): string {
  return `# 🚀 Defou x Stanley 内容生成报告 (MOCK)

## 1. 智能路由 (Routing)
*   **匹配模板**：T1
*   **选择理由**：Mock Reason

## 2. 角度构思 (Brainstorming)
*   **Angle 1**: Mock Angle 1
*   **Angle 2**: Mock Angle 2
*   **Angle 3**: Mock Angle 3
*   **Selected Angle**: Mock Angle 1
*   **Selection Reason**: Mock Reason

---

## 3. 内容创作 (Drafting)

### 🔥 版本 A：极致爆款版 (Stanley Style)

> **Hooks (可选开头)**
> *   [反直觉型] Mock Hook 1
> *   [痛点共鸣型] Mock Hook 2
> *   [结果导向型] Mock Hook 3
> *   [悬念型] Mock Hook 4

**正文内容：**

Mock Body Content...

**潜力评估 (Score: 85/100)**
*   Curiosity: 20
*   Resonance: 20
*   Clarity: 25
*   Shareability: 20
*   **Reasoning**: Mock Reasoning

---

### 🧠 版本 B：深度认知版 (Defou Style)

> **Hooks (可选开头)**
> *   [反直觉型] Mock Hook 1
> *   [痛点共鸣型] Mock Hook 2
> *   [结果导向型] Mock Hook 3
> *   [悬念型] Mock Hook 4

**正文内容：**

Mock Body Content...

**潜力评估 (Score: 88/100)**
*   Curiosity: 22
*   Resonance: 22
*   Clarity: 22
*   Shareability: 22
*   **Reasoning**: Mock Reasoning

---

## 4. 发布建议 (Scheduling)
*   **推荐时间**：20:00
*   **理由**：Mock Reason`;
}

main().catch(console.error);
