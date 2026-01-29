#!/usr/bin/env node

/**
 * Migration Script: Rename existing output files to new format
 *
 * Usage:
 *   npm run migrate:outputs
 *
 * This script will:
 * 1. Scan all output directories
 * 2. Rename files to the new format
 * 3. Add standardized metadata blocks
 * 4. Create backup before migration
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const projectRoot = path.resolve(__dirname, '../');
const outputDirs = [
  path.join(projectRoot, 'outputs/articles'),
  path.join(projectRoot, 'outputs/trends'),
  path.join(projectRoot, 'outputs/defou-stanley-posts'),
  path.join(projectRoot, 'outputs/viral-verified-posts')
];

interface FileInfo {
  oldPath: string;
  oldName: string;
  newName: string;
  newPath: string;
  metadata: any;
}

/**
 * Parse old filename to extract information
 */
function parseOldFilename(filename: string): any {
  // Pattern 1: {basename}_report.md
  const reportMatch = filename.match(/^(.+)_report\.md$/);
  if (reportMatch) {
    return {
      type: 'report',
      title: reportMatch[1],
      prefix: ''
    };
  }

  // Pattern 2: post_{ISO_timestamp}_{title}.md
  const postMatch = filename.match(/^post_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}).*?_(.+)\.md$/);
  if (postMatch) {
    return {
      type: 'post',
      timestamp: postMatch[1],
      title: postMatch[2],
      prefix: 'post'
    };
  }

  // Pattern 3: verified_{ISO_timestamp}_{original}.md
  const verifiedMatch = filename.match(/^verified_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}).*?_(.+)\.md$/);
  if (verifiedMatch) {
    return {
      type: 'verified',
      timestamp: verifiedMatch[1],
      title: verifiedMatch[2],
      prefix: 'verified'
    };
  }

  // Pattern 4: list_{ISO_timestamp}_{title}.md
  const listMatch = filename.match(/^list_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}).*?_(.+)\.md$/);
  if (listMatch) {
    return {
      type: 'list',
      timestamp: listMatch[1],
      title: listMatch[2],
      prefix: 'list'
    };
  }

  return null;
}

/**
 * Convert ISO timestamp to readable format
 */
function convertTimestamp(isoTimestamp: string): string {
  // Input: 2026-01-23T08-23-45-123Z
  // Output: 20260123_162345

  const match = isoTimestamp.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
  if (!match) {
    // Fallback to current time
    const now = new Date();
    return formatTimestamp(now);
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

/**
 * Format date to readable timestamp
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generate safe title with hash
 */
function generateSafeTitle(title: string): string {
  const cleaned = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '');
  const normalized = cleaned.replace(/\s+/g, '_');
  const truncated = normalized.slice(0, 30);
  const hash = crypto.createHash('md5').update(title).digest('hex').slice(0, 6);

  return `${truncated}_${hash}`;
}

/**
 * Extract metadata from old file content
 */
function extractOldMetadata(content: string): any {
  const metadata: any = {};

  // Try to extract from HTML comment
  const commentMatch = content.match(/<!--([\s\S]*?)-->/);
  if (commentMatch) {
    const comment = commentMatch[1];

    const topicMatch = comment.match(/Topic:\s*(.+)/);
    if (topicMatch) metadata.sourceTitle = topicMatch[1].trim();

    const sourceMatch = comment.match(/Source:\s*(.+)/);
    if (sourceMatch) metadata.source = sourceMatch[1].trim();

    const linkMatch = comment.match(/Link:\s*(.+)/);
    if (linkMatch) metadata.sourceLink = linkMatch[1].trim();

    const reasonMatch = comment.match(/Reason:\s*(.+)/);
    if (reasonMatch) metadata.topicReason = reasonMatch[1].trim();

    const generatedMatch = comment.match(/Generated:\s*(.+)/);
    if (generatedMatch) metadata.generatedAt = generatedMatch[1].trim();

    const originalMatch = comment.match(/Original File:\s*(.+)/);
    if (originalMatch) metadata.originalFilename = originalMatch[1].trim();
  }

  // Try to extract from markdown header
  const headerMatch = content.match(/>\s*\*\*源文件\*\*:\s*`(.+)`/);
  if (headerMatch) metadata.sourceFile = headerMatch[1].trim();

  return metadata;
}

/**
 * Create new metadata block
 */
function createMetadataBlock(info: any, oldMetadata: any): string {
  const lines = [
    '<!--',
    '============================================================',
    'METADATA',
    '============================================================'
  ];

  // Determine source type
  let sourceType = 'input_file';
  if (info.type === 'post') sourceType = 'tophub_trend';
  else if (info.type === 'verified') sourceType = 'verification';
  else if (info.type === 'list') sourceType = 'article_link';

  lines.push(`Source Type: ${sourceType}`);
  lines.push(`Generated At: ${oldMetadata.generatedAt || new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push(`Processed By: ${info.type === 'verified' ? 'viral-verification' : info.type === 'list' ? 'article-list-processor' : 'defou-workflow-agent'}`);

  if (oldMetadata.sourceFile) {
    lines.push(`Source File: ${oldMetadata.sourceFile}`);
  }

  if (oldMetadata.sourceTitle || info.title) {
    lines.push(`Source Title: ${oldMetadata.sourceTitle || info.title}`);
  }

  if (oldMetadata.sourceLink) {
    lines.push(`Source Link: ${oldMetadata.sourceLink}`);
  }

  if (oldMetadata.topicReason) {
    lines.push(`Topic Reason: ${oldMetadata.topicReason}`);
  }

  if (oldMetadata.originalFilename) {
    lines.push(`Original Filename: ${oldMetadata.originalFilename}`);
  }

  lines.push('============================================================');
  lines.push('-->');

  return lines.join('\n');
}

/**
 * Migrate a single file
 */
function migrateFile(filePath: string): FileInfo | null {
  const filename = path.basename(filePath);
  const dirname = path.dirname(filePath);

  // Skip if already in new format (contains hash pattern)
  if (/_[a-f0-9]{6}\.md$/.test(filename)) {
    console.log(`⏭️  Skipping (already migrated): ${filename}`);
    return null;
  }

  // Skip INDEX.md
  if (filename === 'INDEX.md') {
    return null;
  }

  const info = parseOldFilename(filename);
  if (!info) {
    console.log(`⚠️  Cannot parse: ${filename}`);
    return null;
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const oldMetadata = extractOldMetadata(content);

  // Generate new filename
  const timestamp = info.timestamp ? convertTimestamp(info.timestamp) : formatTimestamp(new Date());
  const safeTitle = generateSafeTitle(info.title);
  const prefix = info.prefix ? `${info.prefix}_` : '';
  const newFilename = `${prefix}${timestamp}_${safeTitle}.md`;
  const newPath = path.join(dirname, newFilename);

  // Check for duplicates
  let finalPath = newPath;
  let counter = 1;
  while (fs.existsSync(finalPath) && finalPath !== filePath) {
    const filenameWithCounter = `${prefix}${timestamp}_${safeTitle}_v${counter}.md`;
    finalPath = path.join(dirname, filenameWithCounter);
    counter++;
  }

  // Create new metadata block
  const newMetadataBlock = createMetadataBlock(info, oldMetadata);

  // Remove old metadata and add new one
  let newContent = content.replace(/<!--[\s\S]*?-->/, '').trim();
  newContent = content.replace(/>\s*\*\*源文件\*\*:[\s\S]*?\n\n/, '').trim();
  newContent = `${newMetadataBlock}\n\n${newContent}`;

  return {
    oldPath: filePath,
    oldName: filename,
    newName: path.basename(finalPath),
    newPath: finalPath,
    metadata: { info, oldMetadata, newContent }
  };
}

/**
 * Main migration function
 */
function migrate(dryRun: boolean = true) {
  console.log('🚀 Starting Output Files Migration\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify files)'}\n`);

  const allMigrations: FileInfo[] = [];

  for (const dir of outputDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⏭️  Directory not found: ${dir}\n`);
      continue;
    }

    console.log(`📂 Processing: ${dir}`);

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));

    const migrations = files
      .map(f => migrateFile(f))
      .filter(m => m !== null) as FileInfo[];

    allMigrations.push(...migrations);

    console.log(`   Found ${migrations.length} files to migrate\n`);
  }

  if (allMigrations.length === 0) {
    console.log('✨ No files need migration!');
    return;
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total files to migrate: ${allMigrations.length}\n`);

  if (!dryRun) {
    // Create backup directory
    const backupDir = path.join(projectRoot, 'outputs_backup_' + Date.now());
    console.log(`📦 Creating backup: ${backupDir}`);

    for (const dir of outputDirs) {
      if (fs.existsSync(dir)) {
        const relativePath = path.relative(path.join(projectRoot, 'outputs'), dir);
        const backupPath = path.join(backupDir, relativePath);
        fs.mkdirSync(backupPath, { recursive: true });

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        files.forEach(f => {
          fs.copyFileSync(
            path.join(dir, f),
            path.join(backupPath, f)
          );
        });
      }
    }

    console.log(`✅ Backup created\n`);

    // Perform migration
    console.log('🔄 Migrating files...\n');

    for (const migration of allMigrations) {
      try {
        // Write new content
        fs.writeFileSync(migration.newPath, migration.metadata.newContent, 'utf-8');

        // Remove old file if different
        if (migration.oldPath !== migration.newPath) {
          fs.unlinkSync(migration.oldPath);
        }

        console.log(`✅ ${migration.oldName} -> ${migration.newName}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${migration.oldName}:`, error);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`\n💡 Backup location: ${backupDir}`);
  } else {
    console.log('📋 Files to be migrated:\n');
    allMigrations.forEach(m => {
      console.log(`   ${m.oldName}`);
      console.log(`   -> ${m.newName}\n`);
    });

    console.log('\n💡 Run with --live flag to perform actual migration:');
    console.log('   npm run migrate:outputs -- --live');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');

migrate(!isLive);
