## 使用 PI 构建自定义 Agent 框架

一份详尽的 TypeScript 教程，介绍如何使用 PI 工具包（pi-ai、pi-agent-core、pi-coding-agent、pi-tui）构建生产级 AI Agent —— 这些正是 OpenClaw 的核心依赖

PI 是一个用于构建 AI Agent 的 TypeScript 工具包。它是一个 monorepo，包含多个层次叠加的包：

```
┌─────────────────────────────────────────┐
│  Your Application                       │
│  (OpenClaw, a CLI tool, a Slack bot)    │
├────────────────────┬────────────────────┤
│  pi-coding-agent   │  pi-tui            │
│  Sessions, tools,  │  Terminal UI,      │
│  extensions        │  markdown, editor  │
├────────────────────┴────────────────────┤
│  pi-agent-core                          │
│  Agent loop, tool execution, events     │
├─────────────────────────────────────────┤
│  pi-ai                                  │
│  Streaming, models, multi-provider LLM  │
└─────────────────────────────────────────┘
```

这些包正是 [OpenClaw](https://github.com/openclaw/openclaw) 的核心依赖。PI 由 [@badlogicgames](https://x.com/badlogicgames) 创建。

* * *

### [安装](#安装)

```
mkdir pi-agent && cd pi-agent
npm init -y
npm install @mariozechner/pi-ai @mariozechner/pi-agent-core @mariozechner/pi-coding-agent @mariozechner/pi-tui chalk
npm install -D typescript @types/node tsx
```

### [设置 API Key](#设置-api-key)

```
export ANTHROPIC_API_KEY=sk-ant-...
# 或
export OPENAI_API_KEY=sk-...
```

* * *

### [基础调用](#基础调用)

```
import { getModel, completeSimple } from "@mariozechner/pi-ai";

async function main() {
  const model = getModel("anthropic", "claude-opus-4-5");

  const response = await completeSimple(model, {
    systemPrompt: "You are a helpful assistant.",
    messages: [
      { role: "user", content: "What is the capital of France?", timestamp: Date.now() }
    ],
  });

  for (const block of response.content) {
    if (block.type === "text") {
      console.log(block.text);
    }
  }

  console.log(`\nTokens: ${response.usage.totalTokens}`);
  console.log(`Stop reason: ${response.stopReason}`);
}

main();
```

### [流式输出](#流式输出)

```
import { getModel, streamSimple } from "@mariozechner/pi-ai";

async function main() {
  const model = getModel("anthropic", "claude-opus-4-5");

  const stream = streamSimple(model, {
    systemPrompt: "You are a helpful assistant.",
    messages: [
      { role: "user", content: "Explain how TCP works in 3 sentences.", timestamp: Date.now() }
    ],
  });

  for await (const event of stream) {
    switch (event.type) {
      case "text_delta":
        process.stdout.write(event.delta);
        break;
      case "done":
        console.log(`\n\nTokens: ${event.message.usage.totalTokens}`);
        break;
      case "error":
        console.error("Error:", event.error.errorMessage);
        break;
    }
  }
}

main();
```

### [多供应商切换](#多供应商切换)

只需更改 `getModel` 调用，其他代码保持不变：

```
const model = getModel("anthropic", "claude-opus-4-5");
// const model = getModel("openai", "gpt-4o");
// const model = getModel("google", "gemini-2.5-pro");
// const model = getModel("groq", "llama-3.3-70b-versatile");
```

### [自定义本地模型](#自定义本地模型)

```
import type { Model } from "@mariozechner/pi-ai";

const localModel: Model<"openai-completions"> = {
  id: "llama-3.1-8b",
  name: "llama-3.1-8b",
  api: "openai-completions",
  provider: "ollama",
  baseUrl: "http://localhost:11434/v1",
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128000,
  maxTokens: 8192,
};
```

* * *

### [定义工具](#定义工具)

工具使用 [TypeBox](https://github.com/sinclairzx81/typebox) schema 进行类型安全的参数定义：

```
import { Type } from "@mariozechner/pi-ai";
import type { AgentTool } from "@mariozechner/pi-agent-core";

const weatherParams = Type.Object({
  city: Type.String({ description: "City name" }),
});

const weatherTool: AgentTool<typeof weatherParams> = {
  name: "get_weather",
  label: "Weather",
  description: "Get the current weather for a city",
  parameters: weatherParams,
  execute: async (toolCallId, params, signal, onUpdate) => {
    const temp = Math.round(Math.random() * 30);
    return {
      content: [{ type: "text", text: `${params.city}: ${temp}C, partly cloudy` }],
      details: { temp, city: params.city },
    };
  },
};
```

### [创建 Agent](#创建-agent)

```
import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, streamSimple } from "@mariozechner/pi-ai";

const model = getModel("anthropic", "claude-opus-4-5");

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant with access to tools.",
    model,
    tools: [weatherTool],
    thinkingLevel: "off",
  },
  streamFn: streamSimple,
});
```

### [订阅事件](#订阅事件)

```
agent.subscribe((event) => {
  switch (event.type) {
    case "agent_start":
      console.log("Agent started");
      break;

    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      break;

    case "tool_execution_start":
      console.log(`\nTool: ${event.toolName}(${JSON.stringify(event.args)})`);
      break;

    case "tool_execution_end":
      console.log(`Result: ${event.isError ? "ERROR" : "OK"}`);
      break;

    case "agent_end":
      console.log("\nAgent finished");
      break;
  }
});
```

### [运行 Agent](#运行-agent)

```
await agent.prompt("What's the weather in Tokyo and London?");
```

* * *

### [内置工具](#内置工具)

**默认工具（已启用）：**

| 工具 | 功能 |
| --- | --- |
| `read` | 读取文件内容和图片，支持分页 |
| `bash` | 执行 shell 命令，返回 stdout/stderr |
| `edit` | 精确替换文件中的文本 |
| `write` | 写入文件，自动创建父目录 |

**可选工具：**

| 工具 | 功能 |
| --- | --- |
| `grep` | 搜索文件内容，使用 ripgrep |
| `find` | 按 glob 模式搜索文件 |
| `ls` | 列出目录内容 |

```
import { codingTools, readOnlyTools } from "@mariozechner/pi-coding-agent";

codingTools;    // [read, bash, edit, write]  - 默认
readOnlyTools;  // [read, grep, find, ls]     - 只读探索
```

### [创建会话](#创建会话)

```
import { createAgentSession, SessionManager } from "@mariozechner/pi-coding-agent";
import { getModel, streamSimple } from "@mariozechner/pi-ai";

async function main() {
  const model = getModel("anthropic", "claude-opus-4-5");

  const { session } = await createAgentSession({
    model,
    thinkingLevel: "off",
    sessionManager: SessionManager.inMemory(),
  });

  session.agent.streamFn = streamSimple;

  session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
    if (event.type === "tool_execution_start") {
      console.log(`\n[${event.toolName}]`);
    }
  });

  await session.prompt("What files are in the current directory? Summarize the package.json.");
  console.log();

  session.dispose();
}

main();
```

### [会话持久化](#会话持久化)

```
import * as path from "path";

// 选项 1: 内存中（临时）
const sessionManager = SessionManager.inMemory();

// 选项 2: 新建持久化会话
const sessionManager = SessionManager.create(process.cwd());

// 选项 3: 打开特定会话文件
const sessionManager = SessionManager.open("/path/to/session.jsonl");

// 选项 4: 继续最近的会话
const sessionManager = SessionManager.continueRecent(process.cwd());
```

### [上下文压缩](#上下文压缩)

```
import { estimateTokens } from "@mariozechner/pi-coding-agent";

// 检查 token 数量
const totalTokens = session.messages.reduce(
  (sum, msg) => sum + estimateTokens(msg),
  0
);

// 手动触发压缩
if (totalTokens > 100_000) {
  await session.compact("Preserve all file paths and code changes.");
}
```

### [扩展系统](#扩展系统)

```
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function myExtension(api: ExtensionAPI): void {
  // 在每次 LLM 调用前触发，可重写消息数组
  api.on("context", (event, ctx) => {
    const pruned = event.messages.filter((msg) => {
      // 丢弃超过 10 条消息的大型工具结果
      if (msg.role === "toolResult" && event.messages.indexOf(msg) < event.messages.length - 10) {
        const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
        if (text.length > 5000) return false;
      }
      return true;
    });
    return { messages: pruned };
  });

  // 注册用户命令
  api.registerCommand("stats", {
    description: "Show session statistics",
    handler: async (_args, ctx) => {
      const stats = ctx.session.getSessionStats();
      console.log(`Messages: ${stats.totalMessages}, Cost: $${stats.cost.toFixed(4)}`);
    },
  });
}
```

* * *

```
import {
  TUI,
  ProcessTerminal,
  Editor,
  Markdown,
  Text,
  Loader,
  CombinedAutocompleteProvider,
} from "@mariozechner/pi-tui";
import type { EditorTheme, MarkdownTheme } from "@mariozechner/pi-tui";
import chalk from "chalk";

// 主题配置
const markdownTheme: MarkdownTheme = {
  heading: (s) => chalk.bold.cyan(s),
  code: (s) => chalk.yellow(s),
  codeBlock: (s) => chalk.green(s),
  bold: (s) => chalk.bold(s),
  italic: (s) => chalk.italic(s),
};

// 创建 TUI
const tui = new TUI(new ProcessTerminal());

// 添加编辑器
const editor = new Editor(tui, editorTheme);
editor.setAutocompleteProvider(
  new CombinedAutocompleteProvider(
    [
      { name: "new", description: "Reset the session" },
      { name: "exit", description: "Quit the assistant" },
    ],
    process.cwd(),
  ),
);
tui.addChild(editor);
tui.setFocus(editor);

// 流式更新
let streamingMarkdown: Markdown | null = null;
let streamingText = "";

session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    streamingText += event.assistantMessageEvent.delta;
    if (!streamingMarkdown) {
      streamingMarkdown = new Markdown(streamingText, 1, 0, markdownTheme);
      tui.addChild(streamingMarkdown);
    } else {
      streamingMarkdown.setText(streamingText);
    }
    tui.requestRender();
  }
});

tui.start();
```

* * *

OpenClaw 在此基础上添加了更多生产级功能：

### [多供应商认证](#多供应商认证)

```
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";

const authStorage = AuthStorage.create(path.join(agentDir, "auth.json"));
const modelRegistry = new ModelRegistry(authStorage, modelsConfigPath);

const { session } = await createAgentSession({
  authStorage,
  modelRegistry,
  model: modelRegistry.find("ollama", "llama3.1:8b"),
});
```

### [工作区范围工具](#工作区范围工具)

```
import {
  codingTools,
  createReadTool,
  createWriteTool,
  createEditTool,
} from "@mariozechner/pi-coding-agent";

function buildTools(workspace: string): AgentTool[] {
  return (codingTools as AgentTool[]).map((tool) => {
    if (tool.name === "read") return createReadTool(workspace);
    if (tool.name === "write") return createWriteTool(workspace);
    if (tool.name === "edit") return createEditTool(workspace);
    return tool;
  });
}
```

### [事件路由](#事件路由)

```
session.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        messageBuffer.append(event.assistantMessageEvent.delta);
      }
      break;

    case "tool_execution_start":
      channel.sendNotification(`Running ${event.toolName}...`);
      break;

    case "agent_end":
      messageBuffer.flush();
      break;
  }
});
```

* * *

一个 ~120 行的持久化编程助手，能够：

*   读取文件、运行命令、编辑代码
*   搜索网络
*   跨重启保持对话

运行方式：

```
npx tsx assistant.ts
```

示例会话：

```
PI Assistant
  Model: claude-opus-4-5
  Session: /your/project/.sessions/assistant.jsonl
  History: 0 messages, ~0 tokens
  Tools: read, bash, edit, write, web_search

You: What does this project do? Look at the README and main entry point.

  [read] README.md
  [read] src/index.ts

This is a TypeScript library that...

You: Find all TODO comments in the source code.

  [bash] grep -rn "TODO" src/

Found 3 TODOs:
- src/auth.ts:42 - TODO: add token refresh
- src/api.ts:18 - TODO: handle rate limits
- src/index.ts:7 - TODO: add graceful shutdown

You: Fix the token refresh TODO. Implement a proper refresh flow.

  [read] src/auth.ts
  [edit] src/auth.ts

Done. Added a `refreshToken()` function that...
```

* * *

*   [pi-coding-agent 文档](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)
*   [pi-mono AGENTS.md](https://github.com/badlogic/pi-mono/blob/main/AGENTS.md)
*   [OpenClaw](https://github.com/openclaw/openclaw) - 生产级多通道 AI 助手

* * *

*原文链接：[nader.substack.com/p/how-to-build-a-custom-agent-framework](https://nader.substack.com/p/how-to-build-a-custom-agent-framework)*
