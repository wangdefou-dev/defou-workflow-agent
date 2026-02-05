import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import { saveOutput, getOutputDir } from '../../src/outputManager';
import { initializeEnv, initializeAnthropic, callClaude } from '../../src/skillUtils';
import { buildArticleLinkPrompt, SYSTEM_MESSAGE } from '../../src/prompts/defouStanley';

// 1. Load Environment Variables
const projectRoot = initializeEnv();

// 2. Initialize Anthropic Client
const anthropic = initializeAnthropic();

// 3. Define Directories
const INPUT_DIR = path.join(projectRoot, 'local_inputs');
const ARCHIVE_DIR = path.join(projectRoot, 'archive');

// Ensure directories exist
[INPUT_DIR, ARCHIVE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

interface ArticleItem {
  title: string;
  link: string;
}

/**
 * Parse Markdown to extract titles and links
 * Format expected:
 * - [Title](Link)
 * or
 * 1. [Title](Link)
 */
function parseMarkdownLinks(content: string): ArticleItem[] {
  const items: ArticleItem[] = [];
  // Regex to match [Title](Link)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const title = match[1].trim();
    const link = match[2].trim();
    if (title && link && link.startsWith('http')) {
      items.push({ title, link });
    }
  }

  return items;
}

/**
 * Fetch and extract content from URL
 */
async function fetchArticleContent(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error('Failed to parse article content');
    }

    // Return clean text content
    return article.textContent.trim().substring(0, 15000); // Limit to 15k chars to fit context

  } catch (error) {
    console.error(`⚠️  Error fetching ${url}: ${error}`);
    return `[Failed to fetch content from ${url}]`;
  }
}

/**
 * Generate Content using Defou x Stanley Workflow
 */
async function generateContent(articleTitle: string, articleContent: string, sourceLink: string) {
  console.log(`🤖 Generating content for: "${articleTitle}"...`);

  const prompt = buildArticleLinkPrompt({
    title: articleTitle,
    content: articleContent.slice(0, 8000),
    link: sourceLink,
    includeAIStyleRules: false
  });

  return await callClaude({
    anthropic,
    system: SYSTEM_MESSAGE,
    prompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 4000,
    temperature: 0.7
  });
}

/**
 * Run Verification Skill
 */
function runVerifySkill(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔹 [Verification] Triggering skill:verify...`);
    const child = spawn('npm', ['run', 'skill:verify'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Verification completed.`);
        resolve();
      } else {
        console.error(`❌ Verification failed with code ${code}.`);
        // Don't reject, just log error so watcher keeps running
        resolve();
      }
    });
  });
}

/**
 * Process a single input file containing a list of links
 */
async function processInputFile(filePath: string) {
  const filename = path.basename(filePath);
  console.log(`\n📄 Processing input list: ${filename}`);

  // Wait for file write to complete (debounce)
  await new Promise(r => setTimeout(r, 1000));

  if (!fs.existsSync(filePath)) return;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const articles = parseMarkdownLinks(fileContent);

    if (articles.length === 0) {
      console.log(`⚠️  No valid links found in ${filename}`);
      return;
    }

    console.log(`🔍 Found ${articles.length} articles to process.`);

    // Process articles with concurrency limit
    const limit = pLimit(2);
    let successCount = 0;

    const tasks = articles.map((article, index) => {
      return limit(async () => {
        try {
          console.log(`\n[${index + 1}/${articles.length}] Processing: ${article.title}`);
          
          // 1. Fetch Content
          const content = await fetchArticleContent(article.link);
          if (content.startsWith('[Failed')) {
            console.log(`⏭️  Skipping generation due to fetch failure: ${article.title}`);
            return;
          }

          // 2. Generate
          const generatedContent = await generateContent(article.title, content, article.link);

          // 3. Save Output using unified outputManager
          const outputDir = getOutputDir(projectRoot, 'posts');
          const outputPath = saveOutput({
            outputDir,
            content: generatedContent,
            metadata: {
              sourceType: 'article_link',
              sourceTitle: article.title,
              sourceLink: article.link,
              sourceFile: filename,
              generatedAt: new Date(),
              processedBy: 'article-list-processor'
            }
          });

          console.log(`✅ Saved post to: ${outputPath}`);
          successCount++;

        } catch (err) {
          console.error(`❌ Failed to process article "${article.title}":`, err);
        }
      });
    });

    await Promise.all(tasks);
    
    // Archive the input list file after processing
    const archivePath = path.join(ARCHIVE_DIR, `${Date.now()}_${filename}`);
    fs.renameSync(filePath, archivePath);
    console.log(`📦 Archived input list to: ${archivePath}`);

    // Trigger Verification only if we generated something
    if (successCount > 0) {
      await runVerifySkill();
    }

  } catch (error) {
    console.error(`❌ Failed to process input file "${filename}":`, error);
  }
}

/**
 * Main execution - Watch Mode
 */
async function run() {
  console.log(`
=============================================
🔗 Defou x Stanley: Article List Watcher
=============================================
👀 Watching directory: ${INPUT_DIR}
📥 Drop a markdown file with links here to start!
`);

  const watcher = chokidar.watch(INPUT_DIR, {
    persistent: true,
    ignoreInitial: false, // Process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const filename = path.basename(filePath);
    if (!['.md', '.txt'].includes(path.extname(filename).toLowerCase())) return;

    // Use a lock mechanism or queue if needed, but for now sequential processing per file add is fine
    // Since chokidar might fire multiple events, awaitWriteFinish helps.
    
    console.log(`\n✨ Detected new file: ${filename}`);
    await processInputFile(filePath);
    console.log(`\n👀 Waiting for next file...`);
  });

  watcher.on('error', error => console.error(`Watcher error: ${error}`));
}

if (require.main === module) {
  run();
}