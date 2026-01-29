# Defou Workflow Agent

一个全自动化的内容创作流水线，从热点发现到爆款验证的零人工干预系统。

## 🆕 最新更新

**v2.0 - 双风格生成 + 去 AI 味优化**

- ✨ **双风格输出**：每篇文章自动生成两种风格（Defou x Stanley + 睿智幽默），方便对比选择
- 🎯 **独立睿智幽默生成**：新增 `npm run skill:witty` 命令，可单独生成睿智幽默风格内容
- 🤖 **去 AI 味优化**：爆款验证新增第 7 维度，自动检测并避免 40+ 种 AI 味句式
- 📂 **输出目录优化**：新增 `witty-humor-posts/` 目录，更清晰的文件组织结构
- 🚀 **性能提升**：优化并发处理，完整流程约 15 分钟完成 10 篇双风格文章

## ✨ 核心特性

- 🤖 **全自动化**：一键完成热点抓取、内容生成、爆款验证全流程
- 🧠 **AI 驱动**：基于 Claude Sonnet 4 的深度内容分析和创作
- 🎨 **三种风格**：Defou x Stanley（深度认知 + 病毒传播）+ 睿智幽默（一针见血 + 冷幽默）
- 📊 **质量保证**：7 维度爆款要素评分和自动优化（含去 AI 味检测）
- 🚀 **即开即用**：简单配置，一条命令搞定一切

## 🎯 四大核心功能

### 1. 🚀 全自动内容生成（推荐）

**一键完成从热点到成品的全流程，每篇文章包含双风格**

```bash
npm run skill:master
```

**工作流程：**
1. 📡 抓取 TopHub 全网热榜
2. 🎯 AI 筛选 Top 10 最具潜力话题
3. ✍️ 对每个话题生成 **双风格内容**：
   - Defou x Stanley 风格（深度认知 + 病毒传播）
   - 睿智幽默风格（一针见血 + 冷幽默）
4. 🔍 对 Defou x Stanley 风格进行 6 维度爆款验证和优化

**输出结果：**
- 双风格初稿：`outputs/defou-stanley-posts/`
  - 每篇文章包含两种风格，方便对比选择
- Defou x Stanley 终稿：`outputs/viral-verified-posts/`
  - 经过爆款验证和优化的版本

**适用场景：**
- 日常内容批量生产（一次获得 10 篇双风格文章）
- 快速响应热点
- 内容储备建设
- 对比两种风格，选择最适合的

---

### 2. 😏 睿智幽默风格生成（独立）

**单独生成睿智幽默风格内容**

```bash
npm run skill:witty
```

**工作流程：**
1. 📡 抓取 TopHub 全网热榜
2. 🧠 AI 筛选适合睿智幽默风格的话题
3. ✍️ 批量生成睿智幽默风格内容
4. 📂 输出到 `outputs/witty-humor-posts/`

**风格特点：**
- 像朋友聊天，不像老师上课
- 用调侃的语气说出残酷的真相
- 挑战大众认知，但逻辑自洽
- 让人会心一笑后陷入沉思

**适用场景：**
- 只需要睿智幽默风格时使用
- 社会热点评论
- 职场观察
- 人生感悟

**注意**：如果运行 `skill:master`，已经包含了睿智幽默风格的生成，无需再单独运行此命令。

---

### 3. 📝 批量处理文章链接

**监听模式，投放即处理**

```bash
npm run skill:list
```

**使用方法：**
1. 启动监听后，将包含文章链接的 Markdown 文件放入 `local_inputs/` 目录
2. 系统自动抓取原文 → 生成内容 → 爆款验证
3. 最终成品保存到 `outputs/viral-verified-posts/`

**支持格式：**
```markdown
1. [文章标题](https://example.com/article1)
2. [另一篇文章](https://example.com/article2)
```

**适用场景：**
- 批量处理收藏的文章
- 将外部内容转化为自己的风格
- 快速生成多篇内容

---

### 4. 📂 批量重写本地文章（新增）

**直接重写本地 Markdown/Text 文件**

```bash
npm run skill:local
```

**使用方法：**
1. 启动监听后，将文章文件（`.md` 或 `.txt`）放入 `input/` 目录
2. 系统自动读取内容 → 生成双风格（Defou x Stanley + 睿智幽默）
3. 最终成品保存到 `outputs/rewritten_articles/`

**适用场景：**
- 重写自己的草稿
- 重写已保存的本地文档
- 不通过链接，直接处理内容

---

### 5. 🔍 热点分析（可选）

**单独查看热点分析，不生成内容**

```bash
npm run skill:tophub
```

**输出：**
- 热点数据：`outputs/trends/tophub_hot_*.json`
- 分析报告：`outputs/trends/tophub_analysis_*.md`

**适用场景：**
- 寻找选题灵感
- 了解当前热点趋势
- 手动选择话题创作

## 🛠️ 快速开始

### 前置要求

- Node.js (v16+)
- Anthropic API Key

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd defou-workflow-agent
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**

   创建 `.env` 文件：
   ```env
   # Claude API Key (必须)
   ANTHROPIC_API_KEY=sk-ant-api03-...

   # API Base URL (可选)
   ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
   ```

4. **开始使用**
   ```bash
   npm run skill:master
   ```

## 📂 项目结构

```
defou-workflow-agent/
├── src/
│   ├── master.ts              # 核心流程：热点抓取 + 双风格生成 + 爆款验证
│   ├── tophubFetcher.ts       # TopHub 热榜抓取
│   ├── prompts/
│   │   ├── defouStanley.ts    # Defou x Stanley 风格 Prompt
│   │   └── wittyHumor.ts      # 睿智幽默风格 Prompt
│   ├── outputManager.ts       # 统一输出管理
│   └── skillUtils.ts          # 工具函数
├── skills/
│   ├── article-list-processor/  # 批量处理文章链接
│   ├── defou-stanley-workflow/  # Defou x Stanley 风格定义
│   ├── witty-humor-style/       # 睿智幽默风格定义
│   ├── master-orchestrator/     # 总指挥说明文档
│   └── tophub-trends/           # 热点抓取 Skill
├── outputs/
│   ├── defou-stanley-posts/     # 双风格初稿（包含两种风格）
│   ├── viral-verified-posts/    # Defou x Stanley 终稿（经过验证优化）
│   ├── witty-humor-posts/       # 独立的睿智幽默风格输出
│   └── trends/                  # 热点分析报告
├── local_inputs/                # 文章链接列表投放目录
└── .env                         # 环境配置
```

## 🎨 内容风格

### 😏 睿智幽默风格（新增，推荐）

**核心特点：一针见血 + 冷幽默 + 反常识**

这是一种让人看完会心一笑，然后陷入沉思的风格。不说教，不鸡汤，不装逼。

**语言特征：**
- 🎯 **直击要害**：三句话说清楚别人三千字说不明白的事
- 😏 **冷幽默**：用调侃的语气说出残酷的真相
- 💡 **反常识**：挑战大众认知，但逻辑自洽
- 🔪 **一刀见血**：不绕弯子，直接说结论

**写作原则：**
- 像朋友聊天，不像老师上课
- 用数据和案例说话，不用形容词堆砌
- 敢于说出"政治不正确"的真话
- 结尾留白，让读者自己思考

**示例对比：**

❌ **说教版**：
> "在这个快速变化的时代，我们需要不断学习，提升自己的认知水平，才能在竞争中脱颖而出。"

✅ **睿智幽默版**：
> "大部分人的努力，都是在用战术上的勤奋，掩盖战略上的懒惰。
> 说白了，就是不愿意思考。
> 思考太累了。"

---

### Defou x Stanley 融合风格

**Defou 风格（深度认知）：**
- 结构化思维
- 底层逻辑拆解
- 长期价值导向
- 冷静克制的语调

**Stanley 风格（病毒传播）：**
- 情绪共鸣
- 尖锐数据
- 金句频出
- 极致传播力

**融合版本：**
- Stanley 的吸引力钩子 + Defou 的深度分析
- 高传播潜力 + 高长期价值
- 极简犀利 + 结构清晰

### 爆款验证 7 维度

| 维度 | 说明 | 满分 |
|------|------|------|
| 好奇心缺口 | 标题/开头是否制造点击冲动 | 10 |
| 情绪共鸣 | 是否触发高唤醒情绪 | 10 |
| 价值/实用性 | 是否值得收藏 | 10 |
| 关联性/时效性 | 为什么现在就要看 | 10 |
| 叙事/节奏 | 节奏是否吸引人 | 10 |
| 反直觉/新颖性 | 是否挑战现状 | 10 |
| 去 AI 味 | 是否避免 AI 生成痕迹 | 10 |

**总分 70 分，换算为百分制**

**去 AI 味规则**：系统会自动检测并避免以下 AI 味句式：
- 转折/对比类："不是……而是……"、"与其说……不如说……"
- 总结/强调类："值得一提的是"、"需要注意的是"、"众所周知"
- 修饰/过渡类："事实上"、"实际上"、"本质上"
- 思考/深入类："深入思考"、"细细想来"

**替代原则**：用直接陈述、具体场景、口语化表达代替书面腔，让内容读起来像真人写的。

## 💡 使用场景

### 场景 1：日常内容生产

```bash
npm run skill:master
```

每天运行一次，自动生成 10 篇高质量文章，建立内容储备。

### 场景 2：快速响应热点

```bash
npm run skill:master
```

发现热点后立即运行，几分钟内获得多篇相关内容。

### 场景 3：批量处理收藏

```bash
npm run skill:list
```

将收藏的文章链接整理成列表，投放到 `local_inputs/`，自动转化为自己的风格。

### 场景 4：寻找选题灵感

```bash
npm run skill:tophub
```

查看热点分析报告，手动选择感兴趣的话题进行创作。

## ⚙️ 高级配置

### 并发控制

默认最多 2 个并发请求，可在 `src/master.ts` 中修改：

```typescript
const limit = pLimit(2); // 修改这里的数字
```

### 自定义 Prompt

编辑以下文件来调整内容风格：

- `src/prompts/defouStanley.ts` - Defou x Stanley 风格 Prompt
- `src/prompts/wittyHumor.ts` - 睿智幽默风格 Prompt
- `src/master.ts` - 爆款验证 Prompt（VIRAL_VERIFICATION_PROMPT 常量）

### 输出目录

所有输出文件保存在 `outputs/` 目录：

- `defou-stanley-posts/` - 双风格初稿（每篇包含 Defou x Stanley + 睿智幽默两种风格）
- `viral-verified-posts/` - Defou x Stanley 终稿（经过爆款验证和优化）
- `witty-humor-posts/` - 独立的睿智幽默风格输出（使用 `npm run skill:witty` 生成）
- `trends/` - 热点分析报告

## 🚨 注意事项

1. **API 配额**：全自动模式会调用多次 Claude API，注意 API 配额
2. **网络要求**：需要稳定的网络连接访问 TopHub
3. **输出管理**：定期清理 `outputs/` 目录，避免文件过多

## 📊 性能指标

- **热点抓取**：~2 秒
- **Top 10 筛选**：~10 秒
- **单篇双风格生成**：~60 秒（Defou x Stanley + 睿智幽默）
- **单篇爆款验证**：~30 秒
- **完整流程（10 篇）**：~15 分钟

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

ISC

---

**快速开始命令：**

```bash
# 安装依赖
npm install

# 配置 .env 文件
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# 开始使用
npm run skill:master
```
