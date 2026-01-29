import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import chokidar from 'chokidar';
import { saveOutput, getOutputDir } from '../../src/outputManager';
import { initializeEnv, initializeAnthropic, callClaude } from '../../src/skillUtils';
import { buildArticleLinkPrompt, SYSTEM_MESSAGE } from '../../src/prompts/defouStanley';
import { buildWittyHumorPrompt, WITTY_HUMOR_SYSTEM } from '../../src/prompts/wittyHumor';

// 1. 加载环境变量
const projectRoot = initializeEnv();

// 2. 初始化 Anthropic 客户端
const anthropic = initializeAnthropic();

// 3. 定义目录
const INPUT_DIR = path.join(projectRoot, 'input');
const ARCHIVE_DIR = path.join(projectRoot, 'archive_articles');

// 确保目录存在
[INPUT_DIR, ARCHIVE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * 生成 Defou x Stanley 风格
 */
async function generateDefouStyle(title: string, content: string) {
  console.log(`   ✍️  正在生成 Defou x Stanley 风格...`);
  const prompt = buildArticleLinkPrompt({
    title,
    content: content.slice(0, 10000), // 限制上下文窗口
    link: '本地文件',
    includeAIStyleRules: true
  });

  return await callClaude({
    anthropic,
    system: SYSTEM_MESSAGE,
    prompt,
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 4000,
    temperature: 0.7
  });
}

/**
 * 生成睿智幽默风格
 */
async function generateWittyStyle(title: string, content: string) {
  console.log(`   😏 正在生成睿智幽默风格...`);
  // 使用内容作为睿智幽默提示词的上下文
  const prompt = buildWittyHumorPrompt({
    title,
    source: '本地文件',
    context: `原文核心内容摘要：\n${content.slice(0, 3000)}...`, // 限制上下文
    includeRules: true
  });

  return await callClaude({
    anthropic,
    system: WITTY_HUMOR_SYSTEM,
    prompt,
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 1000,
    temperature: 0.8
  });
}

/**
 * 处理单个文章文件
 */
async function processArticle(filePath: string) {
  const filename = path.basename(filePath);
  // 移除扩展名作为标题
  const title = filename.replace(/\.(md|txt)$/i, '');
  
  console.log(`\n📄 正在处理文章: ${title}`);

  // 等待文件写入完成（防抖动）
  await new Promise(r => setTimeout(r, 1000));

  if (!fs.existsSync(filePath)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) {
      console.log(`⚠️  空文件: ${filename}`);
      return;
    }

    // 并行生成
    const limit = pLimit(2);
    const [defouContent, wittyContent] = await Promise.all([
      limit(() => generateDefouStyle(title, content)),
      limit(() => generateWittyStyle(title, content))
    ]);

    // 合并内容
    const combinedContent = `# ${title} - 风格重写

---

## 📊 风格一：Defou x Stanley（深度认知 + 病毒传播）

${defouContent}

---

## 😏 风格二：睿智幽默（一针见血 + 冷幽默）

${wittyContent}

---

**元信息**
- 原文件名：${filename}
- 生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
- 处理工具：本地文章重写器 (Local File Rewriter)
`;

    // 保存输出
    const outputDir = getOutputDir(projectRoot, 'rewritten_articles');
    const outputPath = saveOutput({
      outputDir,
      content: combinedContent,
      metadata: {
        sourceType: 'local_file',
        sourceTitle: title,
        sourceFile: filename,
        generatedAt: new Date(),
        processedBy: 'local-file-rewriter'
      }
    });

    console.log(`✅ 重写完成: ${path.basename(outputPath)}`);

    // 归档源文件
    const archivePath = path.join(ARCHIVE_DIR, `${Date.now()}_${filename}`);
    fs.renameSync(filePath, archivePath);
    console.log(`📦 已归档源文件至: ${path.relative(projectRoot, archivePath)}`);

  } catch (error) {
    console.error(`❌ 处理文件 "${filename}" 失败:`, error);
  }
}

/**
 * 主程序 - 监听模式
 */
async function run() {
  console.log(`
=============================================
📝 Defou x Stanley: 本地文章重写器
=============================================
👀 正在监听目录: ${path.relative(projectRoot, INPUT_DIR)}/
📥 将 Markdown (.md) 或文本 (.txt) 文件拖入此处以重写！
   (支持: Defou x Stanley + 睿智幽默风格)
`);

  const watcher = chokidar.watch(INPUT_DIR, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const filename = path.basename(filePath);
    if (!['.md', '.txt'].includes(path.extname(filename).toLowerCase())) return;
    
    // 忽略隐藏文件（如 .DS_Store）
    if (filename.startsWith('.')) return;

    console.log(`\n✨ 检测到新文件: ${filename}`);
    await processArticle(filePath);
    console.log(`\n👀 等待下一个文件...`);
  });

  watcher.on('error', error => console.error(`监听器错误: ${error}`));
}

if (require.main === module) {
  run();
}
