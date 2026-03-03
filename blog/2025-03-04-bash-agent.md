---
slug: bash-agent
title: 从零认识 ClaudeCode - 基于 QwenCoderPlus 打造 BashAgent
authors: [kolane]
tags: [AI, Agent, Claude, LLM]
---

## 目录
- [1. 背景与项目介绍](#1-背景与项目介绍)
- [2. 基础模型调用 (One Call)](#2-基础模型调用-one-call)
- [3. 赋予模型执行命令的能力](#3-赋予模型执行命令的能力)
- [4. Agentic Loop 核心概念](#4-agentic-loop-核心概念)
- [5. 实现工具调用 (Tool Use)](#5-实现工具调用-tool-use)
- [6. 完整代码逻辑与测试](#6-完整代码逻辑与测试)
- [AI 总结](#ai-总结)

---

## 1. 背景与项目介绍

目前市面上存在多种编程辅助工具，如 OpenAI 的 CodeX、Topaz 的 Claude Code，以及国内的 Kimi、MiniMax 等。虽然模型能力有差异，但系统设计的差距更为明显。

本系列教程参考了 GitHub 上的开源项目 **Learn Claude Code**（由 shanxi-lab 开发），该项目核心依赖仅为 Anthropic 的 SDK，其余部分均用纯 Python 编写。代码虽简洁，但体现了对 Agent 系统设计的深入思考。

## 2. 基础模型调用 (One Call)

最原始的模型调用方式是"一次交互"：用户输入提示词，调用 API，模型返回结果后结束。

### 2.1 环境配置
需要配置三个关键参数：
- `BASE_URL`
- `API_KEY`
- `MODEL_NAME` (例如 `qwen-coder-plus`)

### 2.2 代码实现
使用 SDK 初始化 Client，通过 `client.messages.create` 发送请求。
- **Role**: `user`
- **Content**: 输入的提示词
- **Max Tokens**: 设置为 200

### 2.3 测试案例
- **简单计算**：询问 `1+1` 等于多少，模型能正确返回文本结果。
- **文件统计**：询问 `flow.md` 有多少字符。
    - **结果**：模型返回无法直接访问本地文件，并给出了统计方法的建议（如使用 `wc` 命令）。
    - **原因**：在 One Call 模式下，模型只能返回文本，没有后续动作权限，也无法感知本地环境。

## 3. 赋予模型执行命令的能力

为了让模型能操作本地环境，最粗暴的方法是让模型返回 Linux 命令，然后由代码执行。

### 3.1 提示词工程
在 Prompt 中明确要求："只给我返回 Linux 命令"。
- **效果**：模型会返回类似 `wc -c flow.md` 的命令字符串。

### 3.2 命令提取与执行
1. **提取命令**：从 Response 的 `content` 字段中解析文本，去除 Markdown 格式（如 \`\`\`bash），提取出纯命令。
2. **执行命令**：使用 Python 的 `subprocess` 模块运行提取出的命令。
3. **获取输出**：捕获 `stdout` 作为执行结果。

通过这种方式，我们手动给大模型加上了执行本地 Shell 命令的能力。

## 4. Agentic Loop 核心概念

简单的命令执行无法处理复杂任务。例如："找到项目中最大的 Python 文件，统计函数数量，并在文件开头写入注释"。这需要多步执行：
1. `find` 命令找到文件。
2. `grep` 命令统计函数。
3. `sed` 或 `echo` 命令写入文件。

每一步的输入依赖上一步的输出，模型必须看到结果后才能决定下一步。这就引出了 **Agentic Loop**（代理循环）。

### 4.1 循环流程
模型在循环中不断进行 **观察 (Observe) -> 决策 (Decide) -> 执行 (Execute)**。

### 4.2 消息管理 (History)
为了维持循环，需要管理消息历史 (`history` 列表)：
- 每次调用模型时，需将之前所有的对话记录拼接发送。
- **判断依据**：检查模型的 `stop_reason`。
    - 如果是 `end_turn`：对话结束，返回最终文本。
    - 如果是 `tool_use`：模型请求调用工具，需提取工具信息并执行。

## 5. 实现工具调用 (Tool Use)

为了让模型规范地调用工具，需要在 API 调用时定义 `tools` 参数。

### 5.1 工具定义规范
`tools` 是一个列表，每个工具包含：
- `name`: 工具名称 (如 `bash`)
- `description`: 工具描述 (如 "Execute shell command")
- `input_schema`: 输入参数结构 (JSON Schema)，定义必填参数 `command` (string)。

### 5.2 系统提示词 (System Prompt)
添加 System Message，告知模型角色是 CLI Agent，规则是使用 Bash 命令解决问题，并说明工具调用的流程。

### 5.3 处理 Tool Use 响应
当模型返回 `tool_use` 类型的内容时：
1. **解析**：提取 `tool_use` 块中的 `name` 和 `input`。
2. **执行**：根据 name 调用对应的本地函数（如执行 Bash 命令）。
3. **反馈**：将执行结果封装为 `tool_result` 类型，追加到 `history` 中，再次调用模型。

## 6. 完整代码逻辑与测试

### 6.1 代码结构
1. **初始化**：配置 Client 和 Tools 定义。
2. **While 循环**：
    - 调用 `client.messages.create` (携带 history 和 tools)。
    - 保存 Assistant 的回复到 history。
    - 遍历 `response.content`：
        - 如果是 `text`：累积输出。
        - 如果是 `tool_use`：执行命令，生成 `tool_result`。
    - 将 `tool_result` 以 `user` 角色加入 history。
    - 检查 `stop_reason`，若为 `end_turn` 则退出循环。
3. **输出**：打印最终结果和完整的对话历史。

### 6.2 测试案例
- **统计字符**：询问 `flow.md` 有多少字符。
    - **过程**：模型调用 bash 工具 -> 执行 `wc -c` -> 返回结果 -> 模型总结。
    - **结果**：正确输出字符数 (如 1093)。
- **统计 Python 文件**：询问当前目录下有几个 Python 文件。
    - **过程**：模型调用 `find . -name "*.py" | wc -l`。
    - **结果**：正确输出文件数量 (如 6 个)。

---

## AI 总结

本视频详细讲解了如何从零开始构建一个基于 LLM 的 **BashAgent**。核心在于从单一的"问答模式"进化为具备**工具调用能力**的 **Agentic Loop**。

1.  **局限性突破**：基础 LLM 无法操作本地文件系统，通过让模型输出命令并由代码执行 (`subprocess`) 可初步解决，但缺乏交互性。
2.  **循环机制**：引入 `Agentic Loop`，通过维护 `history` 消息列表，使模型能根据上一步的执行结果决定下一步动作，从而处理多步骤复杂任务。
3.  **工具规范**：利用 `tools` 参数和 `tool_use` / `tool_result` 内容块，实现了标准化的工具调用流程，使 Agent 行为更可控、可观测。
4.  **技术栈**：基于 Python 和 Anthropic SDK 风格接口（兼容 Qwen 等模型），仅需少量代码即可实现一个具备文件操作和命令执行能力的智能体。
