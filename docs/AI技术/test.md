---
sidebar_position: 1
slug: /AI技术/test
---

# AI技术 测试文章

这是一篇 AI 技术测试文章。

## LLM 调用示例

```python
import openai

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
