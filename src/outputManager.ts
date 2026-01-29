import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Unified Output Manager
 * Provides consistent file naming, metadata, and organization across all modules
 */

export interface OutputMetadata {
  sourceType: 'input_file' | 'tophub_trend' | 'article_link' | 'verification' | 'local_file';
  sourceFile?: string;
  sourceTitle?: string;
  sourceLink?: string;
  topicReason?: string;
  generatedAt: Date;
  processedBy: string;
  originalFilename?: string;
}

export interface SaveOptions {
  outputDir: string;
  content: string;
  metadata: OutputMetadata;
  prefix?: string;
}

/**
 * Generate a human-readable timestamp
 * Format: YYYYMMDD_HHMMSS
 */
function getReadableTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generate date string for folder name
 * Format: YYYYMMDD
 */
function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Generate a safe filename from title
 * - Removes special characters
 * - Limits length to 30 chars
 * - Adds hash suffix to prevent collisions
 */
function generateSafeTitle(title: string): string {
  // Remove special characters, keep Chinese, English, numbers
  const cleaned = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '');

  // Replace spaces with underscores
  const normalized = cleaned.replace(/\s+/g, '_');

  // Truncate to 30 chars
  const truncated = normalized.slice(0, 30);

  // Generate short hash from full title to prevent collisions
  const hash = crypto.createHash('md5').update(title).digest('hex').slice(0, 6);

  return `${truncated}_${hash}`;
}

/**
 * Format metadata as markdown comment block
 */
function formatMetadata(metadata: OutputMetadata): string {
  const lines = [
    '<!--',
    '='.repeat(60),
    'METADATA',
    '='.repeat(60),
  ];

  lines.push(`Source Type: ${metadata.sourceType}`);
  lines.push(`Generated At: ${metadata.generatedAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push(`Processed By: ${metadata.processedBy}`);

  if (metadata.sourceFile) {
    lines.push(`Source File: ${metadata.sourceFile}`);
  }

  if (metadata.sourceTitle) {
    lines.push(`Source Title: ${metadata.sourceTitle}`);
  }

  if (metadata.sourceLink) {
    lines.push(`Source Link: ${metadata.sourceLink}`);
  }

  if (metadata.topicReason) {
    lines.push(`Topic Reason: ${metadata.topicReason}`);
  }

  if (metadata.originalFilename) {
    lines.push(`Original Filename: ${metadata.originalFilename}`);
  }

  lines.push('='.repeat(60));
  lines.push('-->');

  return lines.join('\n');
}

/**
 * Save content with unified naming and metadata
 * Files are saved in date-based folders: outputs/xxx/YYYYMMDD/YYYYMMDD-标题.md
 */
export function saveOutput(options: SaveOptions): string {
  const { outputDir, content, metadata, prefix = '' } = options;

  // Generate date string for folder
  const dateStr = getDateString(metadata.generatedAt);

  // Create date-based subfolder
  const dateFolderPath = path.join(outputDir, dateStr);
  if (!fs.existsSync(dateFolderPath)) {
    fs.mkdirSync(dateFolderPath, { recursive: true });
  }

  // Generate safe title
  const safeTitle = metadata.sourceTitle
    ? generateSafeTitle(metadata.sourceTitle)
    : 'untitled';

  // Build filename: YYYYMMDD-标题.md
  const filename = `${dateStr}-${safeTitle}.md`;
  const filepath = path.join(dateFolderPath, filename);

  // Check for duplicates and add counter if needed
  let finalPath = filepath;
  let counter = 1;
  while (fs.existsSync(finalPath)) {
    const filenameWithCounter = `${dateStr}-${safeTitle}_v${counter}.md`;
    finalPath = path.join(dateFolderPath, filenameWithCounter);
    counter++;
  }

  // Format final content with metadata
  const metadataBlock = formatMetadata(metadata);
  const finalContent = `${metadataBlock}\n\n${content}`;

  // Write file
  fs.writeFileSync(finalPath, finalContent, 'utf-8');

  return finalPath;
}

/**
 * Archive a file with readable timestamp
 */
export function archiveFile(sourceFile: string, archiveDir: string): string {
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const filename = path.basename(sourceFile);
  const timestamp = getReadableTimestamp();
  const archiveFilename = `${timestamp}_${filename}`;
  const archivePath = path.join(archiveDir, archiveFilename);

  // Handle duplicates
  let finalPath = archivePath;
  let counter = 1;
  while (fs.existsSync(finalPath)) {
    const filenameWithCounter = `${timestamp}_v${counter}_${filename}`;
    finalPath = path.join(archiveDir, filenameWithCounter);
    counter++;
  }

  fs.renameSync(sourceFile, finalPath);
  return finalPath;
}

/**
 * Get output directory for specific content type
 */
export function getOutputDir(projectRoot: string, type: 'articles' | 'trends' | 'posts' | 'verified' | 'witty' | 'rewritten_articles'): string {
  const outputBase = path.join(projectRoot, 'outputs');

  const dirMap = {
    articles: path.join(outputBase, 'articles'),
    trends: path.join(outputBase, 'trends'),
    posts: path.join(outputBase, 'defou-stanley-posts'),
    verified: path.join(outputBase, 'viral-verified-posts'),
    witty: path.join(outputBase, 'witty-humor-posts'),
    rewritten_articles: path.join(outputBase, 'rewritten_articles')
  };

  return dirMap[type];
}

/**
 * Create a summary index file for a directory
 * Lists all files with their metadata in a readable format
 */
export function createIndexFile(outputDir: string): void {
  if (!fs.existsSync(outputDir)) return;

  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md')
    .sort()
    .reverse(); // Newest first

  if (files.length === 0) return;

  const indexLines = [
    '# Content Index',
    '',
    `Generated: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    '',
    `Total Files: ${files.length}`,
    '',
    '---',
    ''
  ];

  files.forEach((file, index) => {
    const filepath = path.join(outputDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    // Extract metadata from comment block
    const metadataMatch = content.match(/<!--[\s\S]*?-->/);
    let sourceTitle = 'Unknown';

    if (metadataMatch) {
      const titleMatch = metadataMatch[0].match(/Source Title: (.+)/);
      if (titleMatch) {
        sourceTitle = titleMatch[1];
      }
    }

    indexLines.push(`## ${index + 1}. ${sourceTitle}`);
    indexLines.push(`- **File**: \`${file}\``);
    indexLines.push(`- **Path**: \`${filepath}\``);
    indexLines.push('');
  });

  const indexPath = path.join(outputDir, 'INDEX.md');
  fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf-8');
}
