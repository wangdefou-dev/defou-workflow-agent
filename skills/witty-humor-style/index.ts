import pLimit from 'p-limit';
import { fetchHotList, HotItem } from '../../src/tophubFetcher';
import { buildWittyHumorPrompt, WITTY_HUMOR_SYSTEM } from '../../src/prompts/wittyHumor';
import { saveOutput, getOutputDir } from '../../src/outputManager';
import { initializeEnv, initializeAnthropic, callClaude } from '../../src/skillUtils';

// 初始化环境
const projectRoot = initializeEnv();
const anthropic = initializeAnthropic();

/**
 * 选择适合睿智幽默风格的话题
 */
async function selectWittyTopics(hotList: HotItem[]): Promise<Array<HotItem & { reason: string }>> {
  console.log(`\n🧠 AI 正在筛选适合睿智幽默风格的话题...`);

  const prompt = `你是一位内容策略专家。请从以下热榜中选出 10 个最适合"睿智幽默"风格创作的话题。

**睿智幽默风格特点：**
- 一针见血、冷幽默、反常识
- 适合调侃、讽刺、反思
- 能引发会心一笑和深度思考

**评选标准**：
1. 话题有争议性或反常识的空间
2. 适合用调侃的语气评论
3. 能挖掘出人性或社会的深层问题
4. 不是纯娱乐八卦（除非能挖掘深层洞察）

**热榜列表**（前 50 条）：
${hotList.slice(0, 50).map((item, idx) => `${idx + 1}. ${item.title} (${item.source}, ${item.hot})`).join('\n')}

**输出格式（JSON）**：
\`\`\`json
[
  {
    "rank": "1",
    "title": "话题标题",
    "source": "来源",
    "reason": "选择理由（一句话说明为什么适合睿智幽默风格）"
  }
]
\`\`\`

请只输出 JSON 数组，不要其他内容。`;

  const response = await callClaude({
    anthropic,
    system: "你是一位内容策略专家，擅长选题分析。",
    prompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 2000,
    temperature: 0.7
  });

  // 解析 JSON
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const selectedTopics = JSON.parse(jsonMatch[1]);
  console.log(`✅ 已选出 ${selectedTopics.length} 个适合睿智幽默风格的话题`);

  return selectedTopics;
}

/**
 * 生成单个话题的睿智幽默风格内容
 */
async function generateWittyContent(topic: HotItem & { reason: string }, index: number, total: number) {
  console.log(`\n📝 正在生成内容 (${index + 1}/${total}): ${topic.title}`);

  const prompt = buildWittyHumorPrompt({
    title: topic.title,
    source: topic.source,
    context: topic.reason,
    includeRules: true
  });

  const content = await callClaude({
    anthropic,
    system: WITTY_HUMOR_SYSTEM,
    prompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 800, // 200 个汉字约需 400-600 tokens，留余量
    temperature: 0.8 // 稍微提高温度，增加创意性
  });

  // 保存内容
  const outputDir = getOutputDir(projectRoot, 'witty');
  const outputPath = saveOutput({
    outputDir,
    content,
    metadata: {
      sourceType: 'tophub_trend',
      sourceTitle: topic.title,
      topicReason: topic.reason,
      generatedAt: new Date(),
      processedBy: 'witty-humor-style'
    }
  });

  console.log(`✅ 内容已生成: ${outputPath.split('/').pop()}`);
  return outputPath;
}

/**
 * 主流程
 */
async function main() {
  console.log(`
=============================================
😏 睿智幽默风格内容生成器
=============================================
一针见血 + 冷幽默 + 反常识
`);

  try {
    // 第一步：抓取热榜
    console.log(`\n📡 [Step 1/3] 正在抓取 TopHub 热榜...`);
    const hotList = await fetchHotList();
    console.log(`✅ 获取到 ${hotList.length} 条热点`);

    // 第二步：筛选适合睿智幽默风格的话题
    console.log(`\n🎯 [Step 2/3] 正在筛选适合睿智幽默风格的话题...`);
    const wittyTopics = await selectWittyTopics(hotList);

    // 第三步：批量生成内容
    console.log(`\n✍️  [Step 3/3] 正在批量生成睿智幽默风格内容...`);
    const limit = pLimit(2); // 最多 2 个并发
    const generatedPaths = await Promise.all(
      wittyTopics.map((topic, idx) =>
        limit(() => generateWittyContent(topic, idx, wittyTopics.length))
      )
    );

    console.log(`
=============================================
🎉 所有任务执行完毕！
=============================================
✅ 热点已抓取: ${hotList.length} 条
✅ 话题已筛选: ${wittyTopics.length} 个
✅ 内容已生成: ${generatedPaths.length} 篇

📂 查看结果: outputs/witty-humor-posts/
    `);

  } catch (error) {
    console.error(`\n💥 Workflow Failed:`, error);
    process.exit(1);
  }
}

// 运行主流程
if (require.main === module) {
  main();
}
