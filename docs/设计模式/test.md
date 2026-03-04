---
sidebar_position: 1
slug: /设计模式/test
---

# 设计模式 测试文章

这是一篇设计模式测试文章。

## 单例模式示例

```cpp
class Singleton {
private:
    static Singleton* instance;
    Singleton() {}
public:
    static Singleton* getInstance() {
        if (instance == nullptr) {
            instance = new Singleton();
        }
        return instance;
    }
};
```
