---
sidebar_position: 14
slug: /C++/面试题/C-基础面试题-C-中static的作用-
---

---
title: C++基础面试题 | C++中static的作用？
date: '2025-02-17 22:04:18'
updated: '2025-02-17 22:04:19'
slug: /C++/面试题/C-基础面试题-C-中static的作用-
![](/img/posts/965306e98f168a73778f4d3c77ec6f16.png)

### 1. 回答重点：修饰局部变量 修饰[全局变量](https://so.csdn.net/so/search?q=%E5%85%A8%E5%B1%80%E5%8F%98%E9%87%8F&spm=1001.2101.3001.7020)或函数 修饰类的成员变量或函数
1. **修饰局部变量**：当`static`用于修饰局部变量时，该变量的存储位置在程序执行期间保持不变，并且只在程序执行到该变量的声明处时初始化一次。即使函数被多次调用，`static`局部变量也只在第一次调用时初始化，之后的调用不会重新初始化它。

```plain
#include `<iostream>`
using namespace std;

void func() {
    static int count = 0; // 只在第一次调用func时初始化
    cout `<< "Count is: " << count << endl;
    count++;
}

int main() {
    for(int i = 0; i < 5; i++) {
        func(); // 每次调用都会显示增加的count值
    }
    return 0;
}
```

**static局部变量使用场景**：当你需要多次[调用函数](https://so.csdn.net/so/search?q=%E8%B0%83%E7%94%A8%E5%87%BD%E6%95%B0&spm=1001.2101.3001.7020)时**希望保持某个变量的值时**使用。static变量和全局变量相比[生命周期](https://so.csdn.net/so/search?q=%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F&spm=1001.2101.3001.7020)相同，但有更精细化的作用域(只能在函数作用域内使用)。

1. **修饰全局变量或函数**：当`static`用于修饰全局变量或函数时，它限制了这些变量或函数的作用域，使它们只能在定义它们的文件内部访问。这有助于避免在不同文件之间的命名冲突。

```plain
// file1.cpp
static int count = 10; // count变量只能在file1.cpp中访问

static void func() { // func函数只能在file1.cpp中访问
    cout << "Function in file1" << endl;
}

// file2.cpp
extern int count; // 这里会导致编译错误，因为count是static的，不能在file2.cpp中访问

void anotherFunc() {
    func(); // 这里也会导致编译错误，因为func是static的，不能在file2.cpp中访问
}
```

**static全局变量或函数**：当你想要**限制变量或函数的作用域，防止它们在其他文件中被访问**时使用。

1. **修饰类的成员变量或函数**：在类内部，`static`成员变量或函数属于类本身，而不是类的任何特定对象。这意味着所有对象共享同一个`static`成员变量，无需每个对象都存储一份拷贝。`static`成员函数可以在没有类实例的情况下调用。

```plain
#include <iostream>`
using namespace std;

class MyClass {
public:
    static int staticValue; // 静态成员变量
    static void staticFunction() { // 静态成员函数
        cout `<< "Static function called" << endl;
    }
};

int MyClass::staticValue = 10; // 静态成员变量的初始化

int main() {
    MyClass::staticFunction(); // 调用静态成员函数
    cout << MyClass::staticValue << endl; // 访问静态成员变量
    return 0;
}
```

**static类的成员变量或函数**：当你想要**类的所有对象共享某个变量或函数**时，或者当你想要**在没有类实例的情况下访问某个函数时**使用。  


>` 来自: [C++基础面试题 | C++中static的作用？什么场景下会使用static？_c++ static 如何用,何时使用-CSDN博客](https://blog.csdn.net/LiHongyu05/article/details/141784584)
>

