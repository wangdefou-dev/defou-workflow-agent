import fs from 'fs';
import path from 'path';
import { saveOutput, getOutputDir } from '../../src/outputManager';
import { fetchHotList, HotItem } from '../../src/tophubFetcher';
import { initializeEnv, initializeAnthropic, callClaude, isMockMode } from '../../src/skillUtils';

// 1. Load Environment Variables
const projectRoot = initializeEnv();

// 2. Initialize Anthropic Client
const anthropic = initializeAnthropic();
const MOCK_MODE = isMockMode();

/**
 * Analyze the list using Claude
 */
export async function analyzeHotList(items: HotItem[]): Promise<string> {
  const topItems = items.slice(0, 30); // Analyze top 30 items
  const itemsText = topItems.map(item => 
    `${item.rank}. [${item.source}] ${item.title} (Hot: ${item.hot}) - Link: ${item.link}`
  ).join('\n');

  const prompt = `
You are a content strategy expert. Here is a list of current trending topics from TopHub (Hot List):

${itemsText}

Please perform the following tasks:
1. **Analyze Traffic Potential**: Identify which of these topics have the highest potential for viral traffic *right now*. Look for topics that arouse strong curiosity, controversy, or urgency.
2. **Topic Suggestions**: Based on the high-potential topics, suggest 5 specific content angles/titles that a creator could use.
3. **Format**: Output your response in Markdown.

For the suggestions, use this format:
- **Topic**: [Original Topic Title]
- **Angle**: [Proposed Content Angle]
- **Why it works**: [Brief explanation of traffic potential]
`;

  console.log('🤖 Analyzing hot list with Claude...');
  
  if (MOCK_MODE) {
    return `# Mock Analysis\n\n- Mock Suggestion 1\n- Mock Suggestion 2`;
  }

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    temperature: 0.7,
    system: "You are an expert content strategist and trend analyst.",
    messages: [
      { role: "user", content: prompt }
    ]
  });

  return (msg.content[0] as any).text;
}

/**
 * Main execution function
 */
export async function run() {
  try {
    // 1. Fetch
    const items = await fetchHotList();
    console.log(`✅ Fetched ${items.length} items.`);

    // 2. Save Raw Data (still save JSON in date folder)
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-');
    const outputDir = getOutputDir(projectRoot, 'trends');

    // Create date folder for raw JSON
    const dateFolder = path.join(outputDir, now.toISOString().slice(0, 10).replace(/-/g, ''));
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder, { recursive: true });
    }

    const rawFilename = `tophub_hot_${dateStr}.json`;
    const rawPath = path.join(dateFolder, rawFilename);

    fs.writeFileSync(rawPath, JSON.stringify(items, null, 2));
    console.log(`✅ Saved raw data to ${rawPath}`);

    // 3. Analyze
    const report = await analyzeHotList(items);

    // 4. Save Report using unified outputManager
    const reportPath = saveOutput({
      outputDir,
      content: report,
      metadata: {
        sourceType: 'tophub_trend',
        sourceTitle: 'TopHub热榜分析',
        generatedAt: now,
        processedBy: 'tophub-trends'
      }
    });

    console.log(`✅ Saved analysis report to ${reportPath}`);

    return reportPath;

  } catch (error) {
    console.error('❌ Error running TopHub skill:', error);
    process.exit(1);
  }
}

// Allow running directly
if (require.main === module) {
  run();
}
