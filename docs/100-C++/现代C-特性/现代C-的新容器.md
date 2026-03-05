---
sidebar_position: 3
slug: /C++/现代C++特性/现代C++的新容器
---

## 1. 总述
+ **std::tuple** : C++11引入。它是一个固定大小的异构容器，存储任意数量（编译时确定）的不同类型元素。
+ **std::variant**:C++17引入。 类型安全的联合体（union），可以存储预定义类型集合中的任意一种类型的值
+ **std::any**: C++17引入。可以存储任意类型的值的类型擦除容器
+ `std::`tuple`<T...>`是存储T...类型对应的各自值（一个类型对一个值）
+ `std::`variant`<T...>`可以存储T..这些类型里的一种类型的一个值（允许多种类型，但是实际存储其其中一个类型的一个值）。
+ std::any可以存储任何类型的一个值

---

## 2. std::tuple
### 2.1. 概述
`std::tuple`是C++11引入的一个模板类，用于存储固定数量的不同类型的元素。

### 2.2. 
+ **类型安全**：编译时确定元素类型，避免运行时类型错误
+ **固定大小**：元素数量在编译时确定，不能动态改变
+ **异构存储**：可以存储不同类型的元素
+ **值语义**：支持拷贝和移动操作
+ **零开销抽象**：编译器优化后几乎没有性能损失

### 2.3. 常用API通用使用模板
#### 2.3.1. 创建
```cpp
// 直接构造
`std::`tuple`<int, std::string, double>` t1(42, "hello", 3.14);

// 使用make_tuple
auto t2 = std::make_tuple(42, "hello", 3.14);

// 列表初始化
`std::`tuple`<int, std::string, double>` t3{42, "hello", 3.14};
```

#### 2.3.2. 查询
```cpp
// 获取元素数量
constexpr size_t size = `std::`tuple_size_v`<decltype(t1)>`;

// 获取指定位置元素的类型
using first_type = `std::`tuple_element_t`<0, decltype(t1)>`;
```

#### 2.3.3. 访问
```cpp
// 使用std::get按索引访问
int value = `std::`get`<0>`(t1);
std::string str = `std::`get`<1>`(t1);

// 使用std::get按类型访问（类型唯一时）
int value2 = `std::`get`<int>`(t1);

// 结构化绑定（C++17）
auto [i, s, d] = t1;
```

#### 2.3.4. 操作
```cpp
// 修改元素
`std::`get`<0>`(t1) = 100;
`std::`get`<1>`(t1) = "world";

// 比较操作
bool equal = (t1 == t2);
bool less = (t1 < t2);

// 交换
std::swap(t1, t2);
```

### 2.4. 具体使用示例代码
```cpp
#include `<iostream>`
#include `<tuple>`
#include `<vector>`

int main() {
  // 初始化列表构造
  std::tuple t1{"hello", 42, ``std::`vector`<int>`{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}};
  // 访问元素
  std::cout `<<`std::get<0>`(t1) `<< "\n";
  // 修改元素
`std::get<0>`(t1) = "world";
  std::cout `<<`std::get<0>`(t1) `<< "\n";
  // 获取元素个数
  std::cout <<`std::tuple_size_v<decltype(t1)>`<< "\n";

  // 使用std::make_tuple构造
  std::tuple t2 = std::make_tuple(
      "hello", 42,`std::vector<int>`{1, 2, 3, 4, 5, 6, 7, 8, 9, 10});
  // 使用结构化绑定访问元素
  auto [e1, e2, e3] = t2;
  std::cout `<< e1 << "\n";
  std::cout << e2 << "\n";
  for (auto &i : e3) {
    std::cout << i << " ";
  }
  return 0;
}
```

---

## 3. std::variant
### 3.1. 概述
`std::variant`是C++17引入的类型安全的联合体（union），它可以在运行时存储其模板参数中指定的任意一种类型的值。与传统的union不同，`std::variant`知道当前存储的是哪种类型。

### 3.2. 
+ **类型安全**：运行时类型检查，避免未定义行为
+ **异常安全**：构造失败时保持有效状态
+ **值语义**：支持拷贝、移动和比较操作
+ **空间效率**：只占用最大类型的空间加上少量元数据
+ **访问者模式支持**：通过`std::visit`实现优雅的类型分发

### 3.3. 常用API通用使用模板
#### 3.3.1. 创建
```cpp
// 直接构造
`std::variant<int, std::string, double>`v1(42);
`std::`variant`<int, std::string, double>` v2(std::string("hello"));

// 使用emplace
`std::`variant`<int, std::string, double>` v3;
v3.`emplace`<std::string>`("world");
```

#### 3.3.2. 查询
```cpp
// 检查当前存储的类型索引
size_t index = v1.index();

// 检查是否存储特定类型
bool is_int = `std::`holds_alternative`<int>`(v1);

// 检查是否处于异常状态
bool is_valid = !v1.valueless_by_exception();
```

#### 3.3.3. 访问
```cpp
// 使用std::get（可能抛出异常）
int value = `std::`get`<int>`(v1);
int value2 = `std::`get`<0>`(v1);  // 按索引访问

// 使用std::get_if（返回指针，失败时返回nullptr）
if (auto ptr = `std::`get_if`<int>`(&v1)) {
    int value = *ptr;
}

// 使用std::visit访问
std::visit([](auto&& arg) {
    std::cout `<< arg << std::endl;
}, v1);
```

#### 3.3.4. 操作
```cpp
// 赋值（改变存储的类型）
v1 = std::string("new value");
v1 = 3.14;

// 比较操作
bool equal = (v1 == v2);

// 交换
std::swap(v1, v2);
```

### 3.4. std::visit详解
#### 3.4.1. 什么是std::visit
`std::visit`是访问`std::variant`内容的推荐方式。它接受一个"访问者"（可调用对象）和一个或多个`variant`对象，根据`variant`当前存储的类型自动调用相应的处理逻辑。

#### 3.4.2. 为什么需要std::visit
由于`std::variant`可以存储多种不同类型，我们需要一种安全的方式来处理所有可能的类型。`std::visit`确保：

+ **类型安全**：编译器保证所有可能的类型都被处理
+ **性能优化**：编译时生成最优的分发代码
+ **代码简洁**：避免手动的类型检查和转换

#### 3.4.3. std::visit的基本用法
**1. 使用lambda表达式**

```cpp
`std::variant<int, std::string, double>`v = 42;

// 通用处理（所有类型用同一个逻辑）
std::visit([](auto value) {
    std::cout `<< "值是: " << value << std::endl;
}, v);
```

**2. 使用函数对象（重载操作符）**

```cpp
struct Printer {
    void operator()(int i) {
        std::cout << "整数: " << i << std::endl;
    }
    void operator()(const std::string& s) {
        std::cout << "字符串: " << s << std::endl;
    }
    void operator()(double d) {
        std::cout << "浮点数: " << d << std::endl;
    }
};

std::visit(Printer{}, v);
```

#### 3.4.4. 什么是overload技巧
当我们需要为不同类型提供不同的处理逻辑时，可以使用"overload"技巧。这是一个辅助工具，让我们可以组合多个lambda表达式：

```cpp
// overload辅助结构
`template<class... Ts>` struct overload : Ts... { using Ts::operator()...; };
`template`<class... Ts>` overload(Ts...) -> `overload`<Ts...>`;

// 使用overload组合多个lambda
std::visit(overload {
    [](int i) { std::cout `<< "整数: " << i << std::endl; },
    [](const std::string& s) { std::cout << "字符串: " << s << std::endl; },
    [](double d) { std::cout << "浮点数: " << d << std::endl; }
}, v);
```

##### 3.4.4.1. 代码分解
```cpp
`template<class... Ts>` 
struct overload : Ts... { 
    using Ts::operator()...; 
};
```

###### 3.4.4.1.1. 模板结构体定义
+ `template`&lt;class... Ts>` ：这是一个可变参数模板， Ts... 表示可以接受任意数量的类型参数
+ struct overload : Ts... ：这个结构体通过 多重继承 继承了所有传入的类型 Ts...
+ using Ts::operator()... ：这是 C++17 的 using 声明包展开 ，它将所有基类的 operator() 函数都引入到当前作用域中

```cpp
`template`<class... Ts>` 
overload(Ts...) -> `overload`<Ts...>`;
```

##### 3.4.4.2. 推导指引（Deduction Guide）
+ 这是 C++17 引入的 类模板参数推导指引
+ 它告诉编译器：当你看到 overload(参数...) 这样的构造时，应该推导出 `overload` < 参数类型...>`
+ 这样就可以不用显式指定模板参数，让编译器自动推导

##### 3.4.4.3. 工作原理
当你传入多个 lambda 表达式时：

```cpp
auto visitor = overload {
    [](int i) { std::cout `<< "整数: " << i << std::endl; },
    [](const std::string& s) { std::cout << "字符串: " << s << std::endl; },
    [](double d) { std::cout << "浮点数: " << d << std::endl; }
};
```

编译器会：

+ 推导出每个 lambda 的类型（比如 Lambda1 , Lambda2 , Lambda3 ）
+ 创建 `overload<Lambda1, Lambda2, Lambda3>`
+ 这个类继承了所有 lambda 类型 
+ 通过 using Ts::operator()... 将所有 lambda 的 operator() 都引入
+ 最终得到一个拥有多个重载 operator() 的对象

#### 3.4.5. std::visit返回值
```cpp
// visit可以返回值
std::string result = std::visit(overload {
    [](int i) { return "数字: " + std::to_string(i); },
    [](const std::string& s) { return "文本: " + s; },
    [](double d) { return "小数: " + std::to_string(d); }
}, v);

std::cout `<< result << std::endl;
```

### 3.5. 具体使用示例代码
```cpp
#include <iostream>`
#include `<variant>`
#include `<vector>`

template `<typename... Ts>` struct overload : Ts... {
  using Ts::operator()...;
};

template `<typename... Ts>` overload(Ts...) -> `overload`<Ts...>`;

int f1() { return 1; }
bool f2() { return false; }
``std::`vector`<int>` f3() { return {1, 2, 3}; }
std::string f4() { return "hello"; }

struct Visit {
  void operator()(int i) { std::cout `<< "int: " << i << std::endl; }
  void operator()(bool b) { std::cout << "bool: " << b << std::endl; }
  void operator()(const std::string &s) {
    std::cout << "string: " << s << std::endl;
  }
  void operator()(const`std::vector<int>`&v) {
    std::cout `<< "vector: ";
    for (auto &i : v) {
      std::cout << i << " ";
    }
  }
};

struct Visit_Return {
  // 所有 operator() 都返回 std::string
  std::string operator()(int i) { return "处理了整数: " + std::to_string(i); }

  std::string operator()(bool b) { return "处理了布尔值: "; }

  std::string operator()(const std::string &s) { return "处理了字符串: " + s; }

  std::string operator()(const`std::vector<int>`&v) {
    std::string result = "处理了向量: ";
    for (auto &i : v) {
      result += std::to_string(i) + " ";
    }
    return result;
  }
};

int main() {
  // 创建一个variant ,variant可以存储多个类型,在同一时刻他只有一个值
  `std::`variant`<int, std::string>` v;
  // 可以存储int
  // 可以直接通过=赋值
  v = 42;
  // `可以通过get` < 类型>`(variant)访问元素
  std::cout `<<`std::get<int>`(v) `<< std::endl;
  // 可以存储string
  // `可以通过emplace<类型>`(variant)赋值
  v.`emplace`<std::string>`("hello");
  std::cout `<<`std::get<std::string>`(v) `<< std::endl;

  // 错误`std::variant<int, std::string, `std::vector<int>`> 未允许double
  // v = 4.2;

  std::variant`<int, bool, std::string,`std::vector<int>`> v2;
  v2 = f1();
  // v2 = f2();
  // v2 = f3();
  // v2 = f4();

  // 最简单直接 传入重载了()运算符的对象
  std::visit(Visit{}, v2);

  // visit可以有返回值，可以相同类型，可以不用类型(用variant继续套娃)
  auto res = std::visit(Visit_Return{}, v2);
  std::cout `<< res << std::endl;

  // 使用overload 传入多个lambda，一样可以有返回值
  std::visit(overload{[](int i) { std::cout << "int: " << i << std::endl; },
                      [](bool b) { std::cout << "bool: " << b << std::endl; },
                      [](const std::string &s) {
                        std::cout << "string: " << s << std::endl;
                      },
                      [](const`std::vector<int>`&v) {
                        std::cout `<< "vector: ";
                        for (auto &i : v) {
                          std::cout << i << " ";
                        }
                      }},
             v2);

  return 0;
}
```

---

## 4. std::any
### 4.1. 概述
`std::any`是C++17引入的类型擦除容器，可以存储任意类型的值。与`std::variant`不同，`std::any`不需要在编译时指定可能的类型，可以在运行时存储任何可拷贝构造的类型。

### 4.2. 
+ **类型擦除**：可以存储任意类型，不需要预先声明
+ **运行时类型信息**：保存类型信息，支持安全的类型转换
+ **值语义**：存储对象的拷贝，不是引用或指针
+ **异常安全**：类型转换失败时抛出异常而不是未定义行为
+ **空状态支持**：可以不存储任何值

### 4.3. 常用API通用使用模板
#### 4.3.1. 创建
```cpp
// 默认构造（空状态）
std::any a1;

// 直接构造
std::any a2(42);
std::any a3(std::string("hello"));

// 使用make_any
auto a4 =`std::make_any<std::string>`("world");

// 使用emplace
std::any a5;
a5.emplace`<`std::vector<int>`>(10, 42);
```

#### 4.3.2. 查询
```cpp
// 检查是否有值
bool has_value = a2.has_value();

// 获取类型信息
const std::type_info& type = a2.type();

// 检查类型
if (a2.type() == typeid(int)) {
    // 是int类型
}
```

#### 4.3.3. 访问
```cpp
// 使用any_cast（可能抛出异常）
int value = `std::`any_cast`<int>`(a2);

// 使用any_cast获取指针（失败时返回nullptr）
if (auto ptr = `std::`any_cast`<int>`(&a2)) {
    int value = *ptr;
}
```

#### 4.3.4. 操作
```cpp
// 赋值（可以改变类型）
a1 = 3.14;
a1 = std::string("new value");
a1 = ``std::`vector`<int>`{1, 2, 3};

// 重置为空状态
a1.reset();

// 交换
std::swap(a1, a2);
```

### 4.4. 具体使用示例代码
```cpp
#include `<iostream>`
#include `<any>`
#include `<string>`
#include `<vector>`
#include `<map>`

// 通用打印函数
void print_any(const std::any& a) {
    if (!a.has_value()) {
        std::cout `<< "空值" << std::endl;
        return;
    }
    
    // 尝试不同的类型
    if (a.type() == typeid(int)) {
        std::cout << "整数: " <<`std::any_cast<int>`(a) `<< std::endl;
    } else if (a.type() == typeid(double)) {
        std::cout << "浮点数: " <<`std::any_cast<double>`(a) `<< std::endl;
    } else if (a.type() == typeid(std::string)) {
        std::cout << "字符串: " <<`std::any_cast<std::string>`(a) `<< std::endl;
    } else {
        std::cout << "未知类型" << std::endl;
    }
}

int main() {
    // 创建和使用any
    std::any value;
    
    // 存储不同类型的值
    value = 42;
    print_any(value);
    
    value = 3.14159;
    print_any(value);
    
    value = std::string("Hello, std::any!");
    print_any(value);
    
    // 安全的类型转换
    std::any int_value = 100;
    
    try {
        // 正确的类型转换
        int i =`std::any_cast<int>`(int_value);
        std::cout `<< "成功转换: " << i << std::endl;
        
        // 错误的类型转换（会抛出异常）
        std::string s =`std::any_cast<std::string>`(int_value);
    } catch (const std::bad_any_cast& e) {
        std::cout `<< "类型转换失败: " << e.what() << std::endl;
    }
    
    // 使用指针版本的any_cast（更安全）
    if (auto ptr =`std::any_cast<int>`(&int_value)) {
        std::cout `<< "指针转换成功: " << *ptr << std::endl;
    } else {
        std::cout << "指针转换失败" << std::endl;
    }
    
    // 实际应用：简单的配置系统
`std::map<std::string, std::any>`config;
    config["window_width"] = 1920;
    config["window_height"] = 1080;
    config["fullscreen"] = true;
    config["title"] = std::string("我的应用");
    
    // 读取配置
    std::cout << "\n配置信息:" << std::endl;
    print_any(config["window_width"]);
    print_any(config["title"]);
    
    return 0;
}
```

