import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { fetchHotList, HotItem } from './tophubFetcher';
import { buildHotTopicPrompt } from './prompts/defouStanley';
import { buildWittyHumorPrompt, WITTY_HUMOR_SYSTEM } from './prompts/wittyHumor';
import { saveOutput, getOutputDir } from './outputManager';
import { initializeEnv, initializeAnthropic, callClaude } from './skillUtils';

// 初始化环境
const projectRoot = initializeEnv();
const anthropic = initializeAnthropic();

/**
 * 爆款验证 Prompt 模板
 */
const VIRAL_VERIFICATION_PROMPT = `你是一位"爆款内容验证专家"和"社交媒体增长黑客"。你的专长是分析内容，预测其病毒式传播的潜力，并对其进行优化以获得最大的互动量。

**任务**：
1. 分析提供的内容。
2. 根据关键的"爆款推文要素"对其进行验证。
3. 提供一个"病毒传播潜力评分"。
4. 识别弱点并提出修改建议。
5. **重写内容**，修复弱点并最大化其爆款潜力。

---

## ⛔ 绝对禁止的 AI 味句式（重写时必须遵守，违反任何一条都视为失败）

以下句式/词汇会让内容显得生硬、模板化，在重写时必须完全避免：

**转折/对比类（禁止）：**
- "不是……而是……"
- "与其说……不如说……"
- "一方面……另一方面……"
- "首先……其次……最后……"

**总结/强调类（禁止）：**
- "值得一提的是"、"需要注意的是"、"有趣的是"、"令人惊讶的是"
- "众所周知"、"毫无疑问"、"毋庸置疑"、"不可否认"、"显而易见"
- "总的来说"、"总而言之"、"综上所述"、"由此可见"、"归根结底"
- "简而言之"、"换句话说"

**修饰/过渡类（禁止）：**
- "事实上"、"实际上"、"本质上"、"从本质上讲"
- "坦率地说"、"坦白说"、"说实话"、"不得不说"
- "更重要的是"、"退一步说"
- "正如……所说"、"这意味着"
- "在这个……的时代"、"让我们……"

**思考/深入类（禁止）：**
- "深入思考"、"细细想来"、"仔细一想"
- "可以说"、"无论如何"

**替代原则：**
- 用直接陈述代替铺垫（直接说结论，不要"事实上"）
- 用具体场景/数据代替概括性词汇
- 用口语化表达代替书面腔（"说白了"优于"简而言之"）
- 用断句留白制造节奏，而非连接词
- 像真人在社交媒体发帖那样写，而不是像 AI

---

**验证的爆款推文要素**：
1. **好奇心缺口 (Curiosity Gap)**：标题/开头是否制造了让人忍不住点击/阅读的冲动？
2. **情绪共鸣 (Emotional Resonance)**：是否触发了高唤醒情绪（愤怒、敬畏、恐惧、喜悦、惊讶）？
3. **价值/实用性 (Value/Utility)**：是否值得"收藏"？是否提供了清晰、可执行或有深刻见解的价值？
4. **关联性/时效性 (Relevance/Timeliness)**：为什么*现在*就要看这个？
5. **叙事/节奏 (Storytelling/Pacing)**：节奏是否吸引人？短句？留白？"滑梯效应"？
6. **反直觉/新颖性 (Counter-Intuitive/Novelty)**：是否挑战了现状或提供了全新的视角？
7. **去 AI 味 (Human-like)**：是否避免了上述禁止句式？读起来像真人写的吗？

**输出格式 (Markdown)**：

# 🧪 爆款要素验证报告

## 1. 评分卡
| 要素 | 得分 (0-10) | 评价 |
| :--- | :---: | :--- |
| 好奇心缺口 | [X] | ... |
| 情绪共鸣 | [X] | ... |
| 价值/实用性 | [X] | ... |
| 关联性 | [X] | ... |
| 节奏/可读性 | [X] | ... |
| 新颖性 | [X] | ... |

**🔥 总体爆款潜力评分**: [X]/100

## 2. 深度分析
### ✅ 优点 (What Works)
* ...
* ...

### ❌ 不足与改进点 (What Needs Improvement)
* ...
* ...

## 3. 优化策略
* **标题修正**: [建议]
* **开头钩子**: [建议]
* **结构调整**: [建议]
* **语气调整**: [建议]

---

## 4. 🚀 最终优化爆款版本 (Final Output)

[在此处提供完全重写、优化后的版本。确保保留核心洞察，但最大化爆款要素。使用"Defou x Stanley"风格：极简、犀利、有洞察力，但强化钩子和节奏感。]

**输入内容**:
{{CONTENT}}

---
`;

/**
 * 选择 Top 10 最具爆款潜力的话题
 */
async function selectTop10Topics(hotList: HotItem[]): Promise<Array<HotItem & { reason: string }>> {
  console.log(`\n🧠 AI 正在分析并筛选 Top 10 话题...`);

  const prompt = `你是一位内容策略专家。请从以下热榜中选出 10 个最适合深度分析和创作的话题。

**评选标准**：
1. 话题具有深度讨论空间（不是纯娱乐八卦）
2. 能引发思考或情绪共鸣
3. 适合 Defou x Stanley 风格（结构化分析 + 犀利洞察）
4. 有长期价值，不是纯时效性新闻

**热榜列表**（前 50 条）：
${hotList.slice(0, 50).map((item, idx) => `${idx + 1}. ${item.title} (${item.source}, ${item.hot})`).join('\n')}

**输出格式（JSON）**：
\`\`\`json
[
  {
    "rank": "1",
    "title": "话题标题",
    "source": "来源",
    "reason": "选择理由（一句话说明为什么适合深度创作）"
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
  console.log(`✅ 已选出 ${selectedTopics.length} 个最具潜力的话题`);

  return selectedTopics;
}

/**
 * 生成单个话题的双风格内容（Defou x Stanley + 睿智幽默）
 */
async function generateDualStyleContent(topic: HotItem & { reason: string }, index: number, total: number) {
  console.log(`\n📝 正在生成双风格内容 (${index + 1}/${total}): ${topic.title}`);

  // 生成 Defou x Stanley 风格
  console.log(`   ✍️  生成 Defou x Stanley 风格...`);
  const defouPrompt = buildHotTopicPrompt({
    title: topic.title,
    source: topic.source,
    reason: topic.reason,
    includeVersionC: true,
    includeAIStyleRules: true
  });

  const defouContent = await callClaude({
    anthropic,
    system: "你是 Defou x Stanley，一位病毒式内容专家。",
    prompt: defouPrompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 4000,
    temperature: 0.7
  });

  // 生成睿智幽默风格
  console.log(`   😏 生成睿智幽默风格...`);
  const wittyPrompt = buildWittyHumorPrompt({
    title: topic.title,
    source: topic.source,
    context: topic.reason,
    includeRules: true
  });

  const wittyContent = await callClaude({
    anthropic,
    system: WITTY_HUMOR_SYSTEM,
    prompt: wittyPrompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 800, // 200 个汉字约需 400-600 tokens，留余量
    temperature: 0.8
  });

  // 合并两种风格到一个文件
  const combinedContent = `# ${topic.title}

---

## 📊 风格一：Defou x Stanley（深度认知 + 病毒传播）

${defouContent}

---

## 😏 风格二：睿智幽默（一针见血 + 冷幽默）

${wittyContent}

---

**元信息**
- 来源：${topic.source}
- 选题理由：${topic.reason}
- 生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
`;

  // 保存合并后的内容
  const outputDir = getOutputDir(projectRoot, 'posts');
  const outputPath = saveOutput({
    outputDir,
    content: combinedContent,
    metadata: {
      sourceType: 'tophub_trend',
      sourceTitle: topic.title,
      topicReason: topic.reason,
      generatedAt: new Date(),
      processedBy: 'master-orchestrator-dual-style'
    }
  });

  console.log(`✅ 双风格内容已生成: ${path.basename(outputPath)}`);
  return { outputPath, defouContent, wittyContent, topic };
}

/**
 * 验证并优化内容
 */
async function verifyAndOptimize(filePath: string, content: string, topic: HotItem, index: number, total: number) {
  console.log(`\n🔍 正在验证和优化 (${index + 1}/${total}): ${topic.title}`);

  const prompt = VIRAL_VERIFICATION_PROMPT.replace('{{CONTENT}}', content);

  const verificationResult = await callClaude({
    anthropic,
    system: "You are a Viral Content Validator.",
    prompt,
    model: "anthropic/claude-sonnet-4.5",
    maxTokens: 4000,
    temperature: 0.7
  });

  // 保存终稿
  const outputDir = getOutputDir(projectRoot, 'verified');
  const outputPath = saveOutput({
    outputDir,
    content: verificationResult,
    metadata: {
      sourceType: 'verification',
      sourceTitle: topic.title,
      originalFilename: path.basename(filePath),
      generatedAt: new Date(),
      processedBy: 'master-orchestrator'
    }
  });

  console.log(`✅ 终稿已生成: ${path.basename(outputPath)}`);
  return outputPath;
}

/**
 * 主流程
 */
async function main() {
  console.log(`
=============================================
🤖 Defou x Stanley: Master Orchestrator
=============================================
全自动内容生成流水线启动...
每篇文章包含双风格：Defou x Stanley + 睿智幽默
`)

  try {
    // 第一步：抓取热榜
    console.log(`\n📡 [Step 1/4] 正在抓取 TopHub 热榜...`);
    const hotList = await fetchHotList();
    console.log(`✅ 获取到 ${hotList.length} 条热点`);

    // 第二步：筛选 Top 10 话题
    console.log(`\n🎯 [Step 2/4] 正在筛选最具潜力的话题...`);
    const top10 = await selectTop10Topics(hotList);

    // 第三步：批量生成双风格内容
    console.log(`\n✍️  [Step 3/4] 正在批量生成双风格内容...`);
    console.log(`   每篇文章包含：Defou x Stanley + 睿智幽默`);
    const limit = pLimit(2); // 最多 2 个并发
    const generatedContents = await Promise.all(
      top10.map((topic, idx) =>
        limit(() => generateDualStyleContent(topic, idx, top10.length))
      )
    );

    // 第四步：批量验证和优化 Defou x Stanley 风格
    console.log(`\n🚀 [Step 4/4] 正在验证和优化 Defou x Stanley 风格...`);
    const verifiedPaths = await Promise.all(
      generatedContents.map((item, idx) =>
        limit(() => verifyAndOptimize(item.outputPath, item.defouContent, item.topic, idx, generatedContents.length))
      )
    );

    console.log(`
=============================================
🎉 所有任务执行完毕！
=============================================
✅ 热点已抓取: ${hotList.length} 条
✅ 话题已筛选: ${top10.length} 个
✅ 双风格内容已生成: ${generatedContents.length} 篇
✅ Defou x Stanley 验证已完成: ${verifiedPaths.length} 篇

📂 查看结果:
   - 双风格初稿: outputs/defou-stanley-posts/
     （每篇包含 Defou x Stanley + 睿智幽默两种风格）
   - Defou x Stanley 终稿: outputs/viral-verified-posts/
     （经过爆款验证和优化的版本）

💡 使用建议:
   - 打开 defou-stanley-posts/ 中的文件，可以看到两种风格
   - 根据需要选择使用哪种风格
   - viral-verified-posts/ 中是 Defou x Stanley 的优化版本
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

