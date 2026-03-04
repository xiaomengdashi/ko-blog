---
sidebar_position: 1
slug: /C++/面试题/C++基础面试题-!-C++中const的作用？
---

---
title: C++基础面试题 | C++中const的作用？
date: '2025-02-17 22:03:58'
updated: '2025-02-17 22:03:59'
slug: /C++/面试题/C++基础面试题-!-C++中const的作用？---
![](/img/posts/a462cbb90a858ac8b305fef3d6c370bd.png)

### 回答重点
在C++中，`const`[关键字](https://so.csdn.net/so/search?q=%E5%85%B3%E9%94%AE%E5%AD%97&spm=1001.2101.3001.7020)的最主要作用是用于声明变量为常量，也就是说，这个变量的值一旦确定就不能再被修改。

1. **修饰普通变量**：最基本的用途是定义一个常量值，这个值在初始化后不能被修改。此时，作用效果与`define`类似：

```plain
const int MAX_USERS = 100;
```

2. **修饰指针**：`const` 可以用于指针，以限制指针指向的数据或指针本身的修改。例如：

```plain
const int* ptr; // 指针指向的值不能被修改
int* const ptr = &someInt; // 指针本身不能被修改，只能指向最初的地址
const int* const ptr = &someInt; // 指针指向的值和指针本身都不能被修改
```

3. **修饰引用**：在函数参数中使用 `const` 可以保证函数不会修改传入的参数。这对于传递大型对象或不想被修改的对象非常有用，可以提高程序的安全性和可读性。

```plain
void printMessage(const std::string& message);
```

4. **修饰成员函数**：在类中，`const` 可以修饰成员函数，表示该成员函数不会修改类的任何成员变量（除了那些用 `mutable` 修饰的成员）。

```plain
class MyClass {
public:
    void display() const; // 常量成员函数
};
```

5. **修饰成员变量**：在C++中，const 关键字修饰类成员变量时，表示该成员变量的值在对象的生命周期内是不可变的。这意味着类对象一旦确定被实例化后，成员变量的值已经固定，不能再被修改。

```plain
class MyClass {
 public:
     const int a = 5; // 定义一个常量成员变量a，初始化为5
 };
```

### 知识拓展——不同的const指针
1. **指向常量的指针**：  
指针指向的内容是常量，不能通过该指针修改其所指向的值。

```plain
int x = 10;
const int* ptr = &x; // ptr 是一个指向常量的指针
// *ptr = 20; // 错误：不能通过 ptr 修改 x 的值
```

1. **常量指针**：  
指针本身是常量，指针的值（即指向的地址）不能被修改，但可以通过该指针修改其所指向的值（如果所指向的不是常量）。

```plain
int x = 10;
int* const ptr = &x; // ptr 是一个常量指针
// ptr = &y; // 错误：不能修改 ptr 的值（地址）
*ptr = 20; // 正确：可以通过 ptr 修改 x 的值
```

1. **指向常量的常量指针**：  
指针本身是常量，且指针指向的内容也是常量。

```plain
int x = 10;
const int* const ptr = &x; // ptr 是一个指向常量的常量指针
// ptr = &y; // 错误：不能修改 ptr 的值（地址）
// *ptr = 20; // 错误：不能通过 ptr 修改 x 的值
```

  


> 来自: [C++基础面试题 | C++中const的作用？谈谈你对const的理解？_c++面试题c++中 const (定义, 用途)-CSDN博客](https://blog.csdn.net/LiHongyu05/article/details/142022095)
>

