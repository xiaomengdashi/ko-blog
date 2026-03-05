---
sidebar_position: 3
slug: /getting-started/markdown
---

## 1. Markdown 语法

### 1.1. 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 1.2. 代码块

````markdown
```python
def hello():
    print("Hello")
```
````

支持的语言：`javascript`, `typescript`, `python`, `cpp`, `java`, `go`, `rust`, `bash` 等

### 1.3. 链接和图片

```markdown
[链接文字](https://example.com)
![图片描述](./path/to/image.png)
```

### 1.4. 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |
```

### 1.5. 列表

```markdown
- 无序列表项1
- 无序列表项2

1. 有序列表项1
2. 有序列表项2
```

### 1.6. 用

```markdown
> 这是一段引用文字
```

### 1.7. 提示框

```markdown
:::note
这是注释
:::

:::tip
这是提示
:::

:::warning
这是警告
:::

:::danger
这是危险警告
:::
```

### 1.8. 标签

```markdown
`<!-- truncate -->`  `<!-- 摘要分割线 -->`
```

### 1.9. Tabs 选项卡

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`<Tabs>`
  `<TabItem value="apple" label="Apple">`苹果&lt;/TabItem>`
  `&lt;TabItem value="orange" label="Orange">`橙子</TabItem>`&lt;/Tabs>`
