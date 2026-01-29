---
name: article-list-processor
description: 读取包含文章列表的 Markdown 文件，自动抓取原文内容并生成爆款文案。支持批量处理、自动爬取和智能重写。
version: 1.0.0
triggers:
  - "处理文章列表"
  - "批量抓取文章"
  - "文章清单处理"
  - "批量生成内容"
  - "链接列表转换"
---

# Article List Processor Skill

## 概述

这个 Skill 专门用于处理"文章列表"。你只需要提供一个包含多个文章标题和链接的 Markdown 文件，它就会自动遍历列表，逐个抓取网页内容，并应用 Defou x Stanley 工作流进行重写。

## 核心功能

- **智能解析**：自动识别 Markdown 文件中的链接列表
- **内容抓取**：使用 Readability 技术提取网页正文
- **批量重写**：为每篇文章生成 Defou x Stanley 风格内容
- **自动验证**：生成后自动启动爆款要素验证
- **文件监听**：支持后台监听模式，投放即处理

## 使用场景

- 批量处理收藏的文章链接
- 将 Newsletter 内容转化为自己的风格
- 从 Twitter、RSS 收集的文章批量重写
- 建立内容素材库

## 工作流程

```
投放清单文件 → 解析链接 → 抓取正文 → 生成初稿 → 爆款验证 → 输出终稿
```

### 详细步骤

1. **检测文件**：监听 `local_inputs/` 目录
2. **解析链接**：提取所有 `[标题](URL)` 格式的链接
3. **抓取内容**：使用爬虫获取网页正文
4. **生成初稿**：应用 Defou x Stanley 工作流
5. **自动验证**：启动 `viral-verification` 进行优化
6. **归档原文件**：将处理完的文件移入 `archive/`

## 使用方法

### 1. 准备清单文件

在 `defou-workflow-agent/local_inputs/` 下创建 Markdown 文件（例如 `reading_list.md`）：

```markdown
# 我的今日阅读清单

1. [为什么年轻人不爱存钱了？](https://example.com/article1)
2. [如何通过 AI 提高效率](https://example.com/article2)
- [DeepSeek 深度解析](https://example.com/article3)
```

**支持的格式**：
- 有序列表：`1. [标题](链接)`
- 无序列表：`- [标题](链接)`
- 直接链接：`[标题](链接)`

### 2. 启动监听模式

```bash
npm run skill:list
```

终端将显示：

```
👀 Watching directory: /path/to/local_inputs/
等待文件投放...
```

### 3. 投放任务

将准备好的清单文件拖入 `local_inputs/` 文件夹，系统会自动开始处理。

### 4. 查看结果

处理完成后，在以下目录查看结果：
- **初稿**：`outputs/defou-stanley-posts/`
- **终稿**：`outputs/viral-verified-posts/`

## 输出结果

### 文件结构

```
outputs/
├── defou-stanley-posts/          # 初稿
│   ├── article1_20260123.md
│   ├── article2_20260123.md
│   └── article3_20260123.md
└── viral-verified-posts/         # 终稿（经过验证优化）
    ├── verified_article1_20260123.md
    ├── verified_article2_20260123.md
    └── verified_article3_20260123.md

local_inputs/
└── archive/                      # 已处理的原文件
    └── reading_list.md
```

## 前置条件

- 已安装 Node.js 环境
- 已配置 `.env` 文件中的 `ANTHROPIC_API_KEY`
- 网络连接正常（需要抓取网页内容）
- 目标网站允许爬虫访问

## 配置选项

在 `.env` 文件中可配置：

```env
# API 配置
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选

# 爬虫配置
USER_AGENT=Mozilla/5.0...  # 可选，自定义 User Agent
TIMEOUT=30000              # 可选，请求超时时间（毫秒）
```

## 示例

### 输入文件：`reading_list.md`

```markdown
# 本周精选文章

1. [AI 如何改变内容创作](https://example.com/ai-content)
2. [2026 年自媒体趋势](https://example.com/trends-2026)
3. [爆款文案的底层逻辑](https://example.com/viral-logic)
```

### 处理过程

```
📂 检测到新文件：reading_list.md
📋 解析到 3 个链接
🌐 正在抓取：AI 如何改变内容创作...
✅ 抓取成功
📝 正在生成 Defou x Stanley 风格内容...
✅ 初稿已生成：article1_20260123.md
🔍 正在进行爆款验证...
✅ 终稿已生成：verified_article1_20260123.md
---
🌐 正在抓取：2026 年自媒体趋势...
...
🎉 全部完成！共处理 3 篇文章
📂 原文件已归档：archive/reading_list.md
```

## 注意事项

1. **网站限制**：某些网站可能限制爬虫访问，导致抓取失败
2. **内容质量**：抓取的内容质量取决于网页结构，建议选择结构清晰的文章
3. **API 配额**：每篇文章会调用 2 次 API（生成 + 验证），注意配额
4. **处理时间**：取决于文章数量和网络速度，请耐心等待
5. **文件格式**：确保链接格式正确，否则可能无法识别

## 故障排除

### 问题：抓取失败

**可能原因**：
- 网站限制爬虫
- 网络连接问题
- URL 格式错误

**解决方案**：
- 检查 URL 是否可访问
- 尝试更换 User Agent
- 检查网络连接

### 问题：生成内容质量不佳

**可能原因**：
- 抓取的内容不完整
- 原文结构混乱

**解决方案**：
- 选择结构清晰的文章
- 手动检查抓取的内容
- 调整 Readability 配置

## 高级用法

### 单次处理模式

如果不想使用监听模式，可以直接运行：

```bash
npx ts-node src/article-list-processor.ts local_inputs/your-list.md
```

### 自定义输出目录

修改脚本中的输出路径配置：

```typescript
const OUTPUT_DIR = './custom-output/';
```

