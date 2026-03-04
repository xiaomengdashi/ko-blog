---
sidebar_position: 5
---


# 概述
- std::tuple - 解决多个返回值的良药（C++11）
- std::variant-解决多类型单一返回值的神奇类型(C++17)
- std::optional - 解决空/有效语义C++(17)
- std::expected - 解决正确错误语义(C++23)


## 一、传统返回值处理的困境

在传统的C++编程中，函数返回值处理存在以下问题：
### 1. 多个返回值处理复杂
```cpp
// 传统方式：使用指针或引用参数
bool parseCoordinates(const std::string& input, int& x, int& y) {
    // 解析逻辑
    if (/* 解析失败 */) {
        return false;
    }
    x = /* 解析出的x值 */;
    y = /* 解析出的y值 */;
    return true;
}
```

### 2. 无法处理多类型单一返回值处理
```cpp
auto func() {
    if(){
    return 1;
    }else if(){
	    return "hello";
    }
}
```

### 3. 空值处理不安全
```cpp
std::string* findUser(int id) {
    // 可能返回nullptr，调用者容易忘记检查
    return nullptr; // 潜在的空指针解引用风险
}
```

### 4. 错误处理-语义不明确
```cpp
int divide(int a, int b) {
    if (b == 0) {
        // 如何表示错误？
        return -1; // 魔数，语义不明确
    }
    return a / b;
}
```

因此现代C++的以下特性来帮助更好更优雅的处理函数返回值
- std::tuple - 解决多个返回值的良药（C++11）
- std::variant-解决多类型单一返回值的神奇类型(C++17)
- std::optional - 解决空/有效语义C++(17)
- std::expected - 解决正确错误语义(C++23)


## 二、std::tuple - 解决多返回值的良药

### 1  概述

`std::tuple`是C++11引入的一个容器，用于存储固定数量的不同类型的元素。

### 2 .特点

- **类型安全**：编译时确定元素类型，避免运行时类型错误
- **固定大小**：元素数量在编译时确定，不能动态改变
- **异构存储**：可以存储不同类型的元素
- **值语义**：支持拷贝和移动操作
- **零开销抽象**：编译器优化后几乎没有性能损失

### 3. 常用API通用使用模板

#### 创建
```cpp
// 直接构造
std::tuple<int, std::string, double> t1(42, "hello", 3.14);

// 使用make_tuple
auto t2 = std::make_tuple(42, "hello", 3.14);

// 列表初始化
std::tuple<int, std::string, double> t3{42, "hello", 3.14};
```

#### 查询
```cpp
// 获取元素数量
constexpr size_t size = std::tuple_size_v<decltype(t1)>;

// 获取指定位置元素的类型
using first_type = std::tuple_element_t<0, decltype(t1)>;
```

#### 访问
```cpp
// 使用std::get按索引访问
int value = std::get<0>(t1);
std::string str = std::get<1>(t1);

// 使用std::get按类型访问（类型唯一时）
int value2 = std::get<int>(t1);

// 结构化绑定（C++17）
auto [i, s, d] = t1;
```

#### 操作
```cpp
// 修改元素
std::get<0>(t1) = 100;
std::get<1>(t1) = "world";

// 比较操作
bool equal = (t1 == t2);
bool less = (t1 < t2);

// 交换
std::swap(t1, t2);
```

### 4. 具体使用示例代码

```cpp
#include <iostream>
#include <tuple>
#include <vector>

int main() {
  // 初始化列表构造
  std::tuple t1{"hello", 42, std::vector<int>{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}};
  // 访问元素
  std::cout << std::get<0>(t1) << "\n";
  // 修改元素
  std::get<0>(t1) = "world";
  std::cout << std::get<0>(t1) << "\n";
  // 获取元素个数
  std::cout << std::tuple_size_v<decltype(t1)> << "\n";

  // 使用std::make_tuple构造
  std::tuple t2 = std::make_tuple(
      "hello", 42, std::vector<int>{1, 2, 3, 4, 5, 6, 7, 8, 9, 10});
  // 使用结构化绑定访问元素
  auto [e1, e2, e3] = t2;
  std::cout << e1 << "\n";
  std::cout << e2 << "\n";
  for (auto &i : e3) {
    std::cout << i << " ";
  }
  return 0;
}

```

**使用场景**：
- 函数参数展开
- 多返回值的统一处理
- 泛型编程中的参数传递
### 5. std::apply 函数详解

`std::apply`（C++17）是处理tuple数据的核心函数，它将tuple的元素作为参数传递给可调用对象。

**功能**：将tuple中的元素展开作为函数参数

**语法**：
```cpp
template<class F, class Tuple>
constexpr decltype(auto) apply(F&& f, Tuple&& t);

```
**示例代码**：
```cpp
#include <tuple>
#include <iostream>
#include <functional>
#include <string>

// 基本用法
auto add = [](int a, int b, int c) { return a + b + c; };
auto tuple_data = std::make_tuple(1, 2, 3);
auto result = std::apply(add, tuple_data); // result = 6

// 与函数返回值结合
std::tuple<int, std::string, double> getData() {
    return {42, "hello", 3.14};
}

void processData(int num, const std::string& str, double val) {
    std::cout << "Number: " << num << ", String: " << str 
              << ", Value: " << val << std::endl;
}

int main() {
    auto data = getData();
    std::apply(processData, data);
    return 0;
}
```


## 二. std::variant-解决多类型单一返回值的神奇类型

### 2.1 概述

`std::variant`是C++17引入的类型安全的联合体（union），它可以在运行时存储其模板参数中指定的任意一种类型的值。与传统的union不同，`std::variant`知道当前存储的是哪种类型。

### 2.2 特点

- **类型安全**：运行时类型检查，避免未定义行为
- **异常安全**：构造失败时保持有效状态
- **值语义**：支持拷贝、移动和比较操作
- **空间效率**：只占用最大类型的空间加上少量元数据
- **访问者模式支持**：通过`std::visit`实现优雅的类型分发

### 2.3 常用API通用使用模板

#### 创建
```cpp
// 直接构造
std::variant<int, std::string, double> v1(42);
std::variant<int, std::string, double> v2(std::string("hello"));

// 使用emplace
std::variant<int, std::string, double> v3;
v3.emplace<std::string>("world");
```

#### 查询
```cpp
// 检查当前存储的类型索引
size_t index = v1.index();

// 检查是否存储特定类型
bool is_int = std::holds_alternative<int>(v1);

// 检查是否处于异常状态
bool is_valid = !v1.valueless_by_exception();
```

#### 访问
```cpp
// 使用std::get（可能抛出异常）
int value = std::get<int>(v1);
int value2 = std::get<0>(v1);  // 按索引访问

// 使用std::get_if（返回指针，失败时返回nullptr）
if (auto ptr = std::get_if<int>(&v1)) {
    int value = *ptr;
}

// 使用std::visit访问
std::visit([](auto&& arg) {
    std::cout << arg << std::endl;
}, v1);
```

#### 操作
```cpp
// 赋值（改变存储的类型）
v1 = std::string("new value");
v1 = 3.14;

// 比较操作
bool equal = (v1 == v2);

// 交换
std::swap(v1, v2);
```

### 2.4 std::visit详解

#### 什么是std::visit
`std::visit`是访问`std::variant`内容的推荐方式。它接受一个"访问者"（可调用对象）和一个或多个`variant`对象，根据`variant`当前存储的类型自动调用相应的处理逻辑。

#### 为什么需要std::visit
由于`std::variant`可以存储多种不同类型，我们需要一种安全的方式来处理所有可能的类型。`std::visit`确保：
- **类型安全**：编译器保证所有可能的类型都被处理
- **性能优化**：编译时生成最优的分发代码
- **代码简洁**：避免手动的类型检查和转换

#### std::visit的基本用法

**1. 使用lambda表达式**
```cpp
std::variant<int, std::string, double> v = 42;

// 通用处理（所有类型用同一个逻辑）
std::visit([](auto value) {
    std::cout << "值是: " << value << std::endl;
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

#### 什么是overload技巧

当我们需要为不同类型提供不同的处理逻辑时，可以使用"overload"技巧。这是一个辅助工具，让我们可以组合多个lambda表达式：

```cpp
// overload辅助结构
template<class... Ts> struct overload : Ts... { using Ts::operator()...; };
template<class... Ts> overload(Ts...) -> overload<Ts...>;

// 使用overload组合多个lambda
std::visit(overload {
    [](int i) { std::cout << "整数: " << i << std::endl; },
    [](const std::string& s) { std::cout << "字符串: " << s << std::endl; },
    [](double d) { std::cout << "浮点数: " << d << std::endl; }
}, v);
```

##### 代码分解
```cpp
template<class... Ts> 
struct overload : Ts... { 
    using Ts::operator()...; 
};
```
###### 1. 模板结构体定义
- template<class... Ts> ：这是一个可变参数模板， Ts... 表示可以接受任意数量的类型参数
- struct overload : Ts... ：这个结构体通过 多重继承 继承了所有传入的类型 Ts...
- using Ts::operator()... ：这是 C++17 的 using 声明包展开 ，它将所有基类的 operator() 函数都引入到当前作用域中
```cpp
template<class... Ts> 
overload(Ts...) -> overload<Ts...>;
```
##### 2. 推导指引（Deduction Guide）
- 这是 C++17 引入的 类模板参数推导指引
- 它告诉编译器：当你看到 overload(参数...) 这样的构造时，应该推导出 overload<参数类型...>
- 这样就可以不用显式指定模板参数，让编译器自动推导
##### 工作原理
当你传入多个 lambda 表达式时：
```cpp
auto visitor = overload {
    [](int i) { std::cout << "整数: " << i << std::endl; },
    [](const std::string& s) { std::cout << "字符串: " << s << std::endl; },
    [](double d) { std::cout << "浮点数: " << d << std::endl; }
};
```
编译器会：
   - 推导出每个 lambda 的类型（比如 Lambda1 , Lambda2 , Lambda3 ）
   - 创建 overload<Lambda1, Lambda2, Lambda3>
   - 这个类继承了所有 lambda 类型 
   - 通过 using Ts::operator()... 将所有 lambda 的 operator() 都引入
   - 最终得到一个拥有多个重载 operator() 的对象

#### std::visit返回值
```cpp
// visit可以返回值
std::string result = std::visit(overload {
    [](int i) { return "数字: " + std::to_string(i); },
    [](const std::string& s) { return "文本: " + s; },
    [](double d) { return "小数: " + std::to_string(d); }
}, v);

std::cout << result << std::endl;
```

### 2.5 具体使用示例代码

```cpp
#include <iostream>
#include <variant>
#include <vector>

template <typename... Ts> struct overload : Ts... {
  using Ts::operator()...;
};

template <typename... Ts> overload(Ts...) -> overload<Ts...>;

int f1() { return 1; }
bool f2() { return false; }
std::vector<int> f3() { return {1, 2, 3}; }
std::string f4() { return "hello"; }

struct Visit {
  void operator()(int i) { std::cout << "int: " << i << std::endl; }
  void operator()(bool b) { std::cout << "bool: " << b << std::endl; }
  void operator()(const std::string &s) {
    std::cout << "string: " << s << std::endl;
  }
  void operator()(const std::vector<int> &v) {
    std::cout << "vector: ";
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

  std::string operator()(const std::vector<int> &v) {
    std::string result = "处理了向量: ";
    for (auto &i : v) {
      result += std::to_string(i) + " ";
    }
    return result;
  }
};

int main() {
  // 创建一个variant ,variant可以存储多个类型,在同一时刻他只有一个值
  std::variant<int, std::string> v;
  // 可以存储int
  // 可以直接通过=赋值
  v = 42;
  // 可以通过get<类型>(variant)访问元素
  std::cout << std::get<int>(v) << std::endl;
  // 可以存储string
  // 可以通过emplace<类型>(variant)赋值
  v.emplace<std::string>("hello");
  std::cout << std::get<std::string>(v) << std::endl;

  // 错误std::variant<int, std::string, std::vector<int>> 未允许double
  // v = 4.2;

  std::variant<int, bool, std::string, std::vector<int>> v2;
  v2 = f1();
  // v2 = f2();
  // v2 = f3();
  // v2 = f4();

  // 最简单直接 传入重载了()运算符的对象
  std::visit(Visit{}, v2);

  // visit可以有返回值，可以相同类型，可以不用类型(用variant继续套娃)
  auto res = std::visit(Visit_Return{}, v2);
  std::cout << res << std::endl;

  // 使用overload 传入多个lambda，一样可以有返回值
  std::visit(overload{[](int i) { std::cout << "int: " << i << std::endl; },
                      [](bool b) { std::cout << "bool: " << b << std::endl; },
                      [](const std::string &s) {
                        std::cout << "string: " << s << std::endl;
                      },
                      [](const std::vector<int> &v) {
                        std::cout << "vector: ";
                        for (auto &i : v) {
                          std::cout << i << " ";
                        }
                      }},
             v2);

  return 0;
}
```

## 四、std::optional - 解决空/有效语义

### 1. 概述

`std::optional`（C++17）是一个模板类，用于表示可能存在也可能不存在的值。它提供了类型安全的空值处理机制，避免了传统指针的空指针解引用问题。

### 2. 特点

- **类型安全**：编译时检查，避免空指针解引用
- **明确语义**：清楚表达值可能不存在的情况（std::nullopt）
- **零开销抽象**：性能接近原生类型
- **链式操作**：支持函数式编程风格（C++23）
- **异常安全**：提供安全的值访问方式

### 3. 常用API通用模板

#### 构造
```cpp
// 默认构造（空值）
std::optional<int> opt1;                    // 创建空的optional

// 工厂函数构造
std::optional<std::string> opt8 = std::make_optional<std::string>("hello"); // 指定类型

```

#### 基本操作
```cpp
std::optional<int> opt = 42;

// 状态检查
bool has_val1 = opt.has_value();            // 检查是否包含值
bool has_val3 = opt ? true : false;        // 条件表达式中使用

// 值访问
int val1 = opt.value();                     // 安全访问，空值时抛出异常
int val2 = *opt;                            // 直接解引用，空值时未定义行为
int val3 = opt.value_or(0);                 // 提供默认值，空值时返回默认值

// 指针式访问
int* ptr = &(*opt);                         // 获取指向值的指针（需确保非空）
const int* const_ptr = &opt.value();        // 获取const指针

// 赋值操作
opt = 100;                                  // 赋新值
opt = std::nullopt;                         // 重置为空
opt.reset();                                // 重置为空
opt.emplace(200);                           // 就地构造新值
opt.emplace();                              // 默认构造新值

// 交换操作
std::optional<int> other = 300;
opt.swap(other);                            // 交换两个optional的内容
std::swap(opt, other);                      // 使用std::swap
```

#### 数据处理-基于链式调用风格(C++23)

**transform() 操作** -  返回有效值的时候调用
- **函数声明**：
```cpp
template<class F>
constexpr auto transform(F&& f) && -> std::optional<std::invoke_result_t<F, T&&>>;
```
- **参数**：`F&& f` - 可调用对象，接受T类型参数，返回任意类型U
- **返回值**：用户返回optional内部类型，transform自动包装成一个optional
- **功能**：对包含的值应用变换函数，如果optional为空则保持空状态
- **调用案例**：`auto doubled = opt.transform([](int x) { return x * 2; });`
- **说明**：将整数值乘以2，如果opt为空则doubled也为空

**and_then() 操作**  -  返回有效值的时候调用 ，可以返回无效值
- **函数声明**：
```cpp
constexpr auto and_then(F&& f) && -> std::invoke_result_t<F, T&&>;
```
- **参数**：`F&& f` - 可调用对象，接受T类型参数，返回`std::optional<U>`类型
- **返回值**：函数返回的`std::optional<U>`类型
- **功能**：对包含的值应用返回optional的函数，实现条件性链式操作
- **调用案例**：`auto result = opt.and_then([](int x) -> std::optional<int> { return x > 0 ? std::optional<int>{x} : std::nullopt; });`
- **说明**：只有当值大于0时才保留，否则返回空optional

**or_else() 操作** -  返回无效值的时候调用
- **函数声明**：
```cpp
template<class F>
constexpr std::optional or_else(F&& f) &&;
```
- **参数**：`F&& f` - 可调用对象，无参数，返回`std::optional<T>`类型
- **返回值**：函数返回的`std::optional<T>`类型
- **功能**：当optional为空时提供替代值，有值时直接返回原值
- **调用案例**：`auto fallback = empty_opt.or_else([]() { return std::make_optional(42); });`
- **说明**：当empty_opt为空时，返回包含42的optional

### 4. 简单使用代码

```cpp
#include <iostream>
#include <optional>

std::optional<int> f(int x) {
  if (x > 0) {
    return x;
  }
  return std::nullopt;
}

int main() {

  auto res1 = f(10);
  if (res1.has_value()) {
    std::cout << res1.value() << std::endl;
  } else {
    std::cout << "res1 is nullopt" << std::endl;
  }

  auto res2 = f(-1).value_or(-100);
  std::cout << res2 << std::endl;

  auto res3 = f(-1).or_else([]() -> std::optional<int> {
    std::cout << " res 3 is nullopt";
    return std::nullopt;
  });

  auto res4 = f(10).transform([](int x) { return x + 1; });
  if (res4.has_value()) {
    std::cout << res4.value() << std::endl;
  } else {
    std::cout << "res3 is nullopt" << std::endl;
  }

  auto res5 = f(10).and_then([](int x) -> std::optional<int> {
    if (x > 10)
      return std::optional<int>(x);
    return std::nullopt;
  });
  if (res5.has_value()) {
    std::cout << res4.value() << std::endl;
  } else {
    std::cout << "res4 is nullopt" << std::endl;
  }

  auto res6 = f(11)
                  .transform([](int x) { return x + 1; })
                  .and_then([](int x) -> std::optional<int> {
                    if (x > 10) {
                      return std::optional<int>(x);
                    }
                    return std::nullopt;
                  })
                  .or_else([]() -> std::optional<int> {
                    std::cout << "res5 is nullopt" << std::endl;
                    return std::nullopt;
                  });
  std::cout << "res6: " << res6.value() << std::endl;

  return 0;
}
```

## 五、std::expected - 解决正确错误语义

### 1. 概述

`std::expected`（C++23）是一个模板类，用于表示可能成功（包含期望值）或失败（包含错误信息）的操作结果。模板参数为`std::expected<T, E>`，其中T是成功值类型，E是错误类型。

### 2. 特点

- **明确的错误处理**：强制处理错误情况，编译时保证
- **类型安全**：错误和成功值都有明确的类型
- **性能优化**：避免异常的性能开销，零开销抽象
- **函数式编程支持**：支持链式操作和组合
- **丰富的错误信息**：可以携带详细的错误上下文

### 3. 常用API通用模板

#### 构造
```cpp
#include <expected>
#include <string>

// 成功值构造
std::expected<int, std::string> exp2{42};                     // 直接初始化

// 错误值构造
std::expected<int, std::string> exp3 = std::unexpected("Error message");     // 使用unexpected包装
std::expected<int, std::string> exp4{std::unexpect, "Error message"};       // 就地构造错误

// 就地构造
std::expected<std::string, int> exp5{std::in_place, "success"}; // 就地构造成功值
std::expected<std::string, int> exp6{std::unexpect, 404};       // 就地构造错误值
```

#### 基本操作
```cpp
std::expected<int, std::string> exp = 42;

// 状态检查
bool has_value = exp.has_value();           // 检查是否包含成功值
bool is_success = static_cast<bool>(exp);   // 转换为bool

// 成功值访问
int val1 = exp.value();                     // 安全访问，错误时抛出std::bad_expected_access
int val2 = *exp;                            // 直接解引用，错误时未定义行为
int val3 = exp.value_or(0);                 // 提供默认值

// 错误值访问
if (!exp) {
    const std::string& error = exp.error(); // 获取错误值
}

// 赋值操作
exp = 100;                                  // 赋新的成功值
exp = std::unexpected("New error");         // 赋新的错误值
exp.emplace(200);                           // 就地构造新的成功值
```

#### 数据处理

**transform() 操作**
- **函数声明**：
```cpp
template<class F>
constexpr auto transform(F&& f) const& -> std::expected<std::invoke_result_t<F, const T&>, E>;
template<class F>
constexpr auto transform(F&& f) && -> std::expected<std::invoke_result_t<F, T&&>, E>;
```
- **参数**：`F&& f` - 可调用对象，接受T类型参数，返回任意类型U
- **返回值**：`std::expected<U, E>`，其中U是变换函数的返回类型
- **功能**：对成功值应用变换函数，错误值保持不变
- **调用案例**：`auto doubled = exp.transform([](int x) { return x * 2; });`
- **说明**：成功时将值乘以2，失败时错误信息不变

**and_then() 操作**
- **函数声明**：
```cpp
template<class F>
constexpr auto and_then(F&& f) const& -> std::invoke_result_t<F, const T&>;
template<class F>
constexpr auto and_then(F&& f) && -> std::invoke_result_t<F, T&&>;
```
- **参数**：`F&& f` - 可调用对象，接受T类型参数，返回`std::expected<U, E>`类型
- **返回值**：函数返回的`std::expected<U, E>`类型
- **功能**：对成功值应用返回expected的函数，可以引入新的错误
- **调用案例**：`auto result = exp.and_then([](int x) -> std::expected<int, std::string> { return x > 0 ? x : std::unexpected("Invalid"); });`
- **说明**：只有当值大于0时才成功，否则返回错误

**or_else() 操作**
- **函数声明**：
```cpp
template<class F>
constexpr auto or_else(F&& f) const& -> std::invoke_result_t<F, const E&>;
template<class F>
constexpr auto or_else(F&& f) && -> std::invoke_result_t<F, E&&>;
```
- **参数**：`F&& f` - 可调用对象，接受E类型参数，返回`std::expected<T, F>`类型
- **返回值**：函数返回的`std::expected<T, F>`类型
- **功能**：错误时提供恢复逻辑，成功值直接传播
- **调用案例**：`auto recovered = error_exp.or_else([](const std::string& err) -> std::expected<int, std::string> { return 42; });`
- **说明**：当包含错误时，返回默认值42作为恢复

**transform_error() 操作**
- **函数声明**：
```cpp
template<class F>
constexpr auto transform_error(F&& f) const& -> std::expected<T, std::invoke_result_t<F, const E&>>;
template<class F>
constexpr auto transform_error(F&& f) && -> std::expected<T, std::invoke_result_t<F, E&&>>;
```
- **参数**：`F&& f` - 可调用对象，接受E类型参数，返回任意类型F
- **返回值**：`std::expected<T, F>`，其中F是错误变换函数的返回类型
- **功能**：对错误值应用变换函数，成功值保持不变
- **调用案例**：`auto formatted = exp.transform_error([](const std::string& err) { return "Error: " + err; });`
- **说明**：为错误信息添加前缀，成功值不受影响

### 4. 简单使用代码

```cpp
#include <expected>
#include <iostream>

enum class MYERROR { ERR1 = 1, ERR2 = 2, ERR3 = 3 };

std::expected<int, MYERROR> f(int x) {
  if (x > 10)
    return x;
  else if (x > 0 && x <= 10)
    return std::unexpected(MYERROR::ERR1);
  else if (x == 0)
    return std::unexpected(MYERROR::ERR2);
  else
    return std::unexpected(MYERROR::ERR3);
}

int main() {
  auto res1 = f(0);
  if (res1.has_value()) {
    std::cout << res1.value() << std::endl;
  } else {
    std::cout << "error: " << static_cast<int>(res1.error()) << std::endl;
  }
  auto res2 = f(5).value_or(-100);
  std::cout << res2 << std::endl;

  auto res3 =
      f(120)
          .and_then([](int x) -> std::expected<int, MYERROR> { return x + 1; })
          .value_or(0);
  std::cout << res3 << std::endl;

  auto res5 = f(1).or_else([](MYERROR err) -> std::expected<int, MYERROR> {
    std::cout << "error: " << static_cast<int>(err) << std::endl;
    return {};
  });
  return 0;
}```

