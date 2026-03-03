---
sidebar_position: 3
---

# Markdown 语法

## 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

## 代码块

````markdown
```python
def hello():
    print("Hello")
```
````

支持的语言：`javascript`, `typescript`, `python`, `cpp`, `java`, `go`, `rust`, `bash` 等

## 链接和图片

```markdown
[链接文字](https://example.com)
![图片描述](./path/to/image.png)
```

## 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |
```

## 列表

```markdown
- 无序列表项1
- 无序列表项2

1. 有序列表项1
2. 有序列表项2
```

## 引用

```markdown
> 这是一段引用文字
```

## 提示框

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

## 标签

```markdown
<!-- truncate -->  <!-- 摘要分割线 -->
```

## Tabs 选项卡

```markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="apple" label="Apple">苹果</TabItem>
  <TabItem value="orange" label="Orange">橙子</TabItem>
</Tabs>
```
