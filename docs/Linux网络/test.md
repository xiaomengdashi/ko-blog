---
sidebar_position: 1
slug: /Linux网络/test
---

# Linux网络 测试文章

这是一篇 Linux 网络测试文章。

## Socket 编程示例

```cpp
#include <sys/socket.h>
#include <netinet/in.h>

int server_fd = socket(AF_INET, SOCK_STREAM, 0);
```
