---
sidebar_position: 2
---

# 常用命令

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器 (localhost:3000) |
| `npm run build` | 构建生产版本 |
| `npm run serve` | 本地预览构建结果 |
| `npm run deploy` | 部署到 GitHub Pages |

## 创建新内容

### 创建博客文章

在 `blog/` 目录下创建文件，命名格式：`YYYY-MM-DD-title.md`

```markdown
---
slug: my-post
title: 文章标题
authors: [kolane]
tags: [标签1, 标签2]
---

文章内容...

<!-- truncate -->

更多内容...
```

### 创建文档

在 `docs/` 目录下创建 `.md` 或 `.mdx` 文件：

```markdown
---
sidebar_position: 1
---

# 文档标题

内容...
```

### 创建自定义页面

在 `src/pages/` 目录下创建：

```tsx
import React from 'react';

export default function MyPage() {
  return <h1>自定义页面</h1>;
}
```
