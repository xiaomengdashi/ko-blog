---
sidebar_position: 1
slug: /C++/现代C++特性/现代C++返回值处理
---

## 一、传统返回值处理的困境
在传统的C++编程中，函数返回值处理存在以下问题：

### 1. 多返回值处理复杂
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

### 2. 空值处理不安全
```cpp
std::string* findUser(int id) {
    // 可能返回nullptr，调用者容易忘记检查
    return nullptr; // 潜在的空指针解引用风险
}
```

### 3. 错误处理-语义不明确
```cpp
int divide(int a, int b) {
    if (b == 0) {
        // 如何表示错误？
        return -1; // 魔数，语义不明确
    }
    return a / b;
}
```

因此现代C++引入以下特性来帮助更好更优雅的处理函数返回值

+ std::tuple - 解决多返回值的良药（C++11）
+ std::optional - 解决空/有效语义C++(17)
+ std::expected - 解决正确错误语义(C++23)



## 二、std::tuple - 解决多返回值的良药
### std::apply 函数详解
`std::apply`（C++17）是处理tuple数据的核心函数，它将tuple的元素作为参数传递给可调用对象。

**功能**：将tuple中的元素展开作为函数参数

**语法**：

```cpp
template<class F, class Tuple>
constexpr decltype(auto) apply(F&& f, Tuple&& t);
```

**使用场景**：

+ 函数参数展开
+ 多返回值的统一处理
+ 泛型编程中的参数传递

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

## 三、std::optional - 解决空/有效语义
### 1. 概述
`std::optional`（C++17）是一个模板类，用于表示可能存在也可能不存在的值。它提供了类型安全的空值处理机制，避免了传统指针的空指针解引用问题。

### 2. 特点
+ **类型安全**：编译时检查，避免空指针解引用
+ **明确语义**：清楚表达值可能不存在的情况（std::nullopt）
+ **零开销抽象**：性能接近原生类型
+ **链式操作**：支持函数式编程风格（C++23）
+ **异常安全**：提供安全的值访问方式

### 3. 常用API通用模板
#### 构造
```cpp
// 默认构造（空值）
`std::optional<int>` opt1;                    // 创建空的optional

// 工厂函数构造
`std::optional<std::string>` opt8 = std::make_optional<std::string>("hello"); // 指定类型

```

#### 基本操作
```cpp
`std::optional<int>` opt = 42;

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
`std::optional<int>` other = 300;
opt.swap(other);                            // 交换两个optional的内容
std::swap(opt, other);                      // 使用std::swap
```

#### 数据处理-基于链式调用风格(C++23)
**transform() 操作** -  返回有效值的时候调用

+ **函数声明**：

```cpp
template<class F>
constexpr auto transform(F&& f) && -> `std::optional<std::invoke_result_t<F, T&&>`>;
```

+ **参数**：`F&& f` - 可调用对象，接受T类型参数，返回任意类型U
+ **返回值**：用户返回optional内部类型，transform自动包装成一个optional
+ **功能**：对包含的值应用变换函数，如果optional为空则保持空状态
+ **调用案例**：`auto doubled = opt.transform([](int x) { return x * 2; });`
+ **说明**：将整数值乘以2，如果opt为空则doubled也为空

**and_then() 操作**  -  返回有效值的时候调用 ，可以返回无效值

+ **函数声明**：

```cpp
constexpr auto and_then(F&& f) && -> std::invoke_result_t<F, T&&>;
```

+ **参数**：`F&& f` - 可调用对象，接受T类型参数，返回``std::optional<U>``类型
+ **返回值**：函数返回的``std::optional<U>``类型
+ **功能**：对包含的值应用返回optional的函数，实现条件性链式操作
+ **调用案例**：`auto result = opt.and_then([](int x) -> `std::optional<int>` { return x > 0 ? `std::optional<int>`{x} : std::nullopt; });`
+ **说明**：只有当值大于0时才保留，否则返回空optional

**or_else() 操作** -  返回无效值的时候调用

+ **函数声明**：

```cpp
template<class F>
constexpr std::optional or_else(F&& f) &&;
```

+ **参数**：`F&& f` - 可调用对象，无参数，返回``std::optional<T>``类型
+ **返回值**：函数返回的``std::optional<T>``类型
+ **功能**：当optional为空时提供替代值，有值时直接返回原值
+ **调用案例**：`auto fallback = empty_opt.or_else([]() { return std::make_optional(42); });`
+ **说明**：当empty_opt为空时，返回包含42的optional

### 4. 简单使用代码
```cpp
#include <iostream>
#include <optional>

`std::optional<int>` f(int x) {
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

  auto res3 = f(-1).or_else([]() -> `std::optional<int>` {
    std::cout << " res 3 is nullopt";
    return std::nullopt;
  });

  auto res4 = f(10).transform([](int x) { return x + 1; });
  if (res4.has_value()) {
    std::cout << res4.value() << std::endl;
  } else {
    std::cout << "res3 is nullopt" << std::endl;
  }

  auto res5 = f(10).and_then([](int x) -> `std::optional<int>` {
    if (x > 10)
      return `std::optional<int>`(x);
    return std::nullopt;
  });
  if (res5.has_value()) {
    std::cout << res4.value() << std::endl;
  } else {
    std::cout << "res4 is nullopt" << std::endl;
  }

  auto res6 = f(11)
                  .transform([](int x) { return x + 1; })
                  .and_then([](int x) -> `std::optional<int>` {
                    if (x > 10) {
                      return `std::optional<int>`(x);
                    }
                    return std::nullopt;
                  })
                  .or_else([]() -> `std::optional<int>` {
                    std::cout << "res5 is nullopt" << std::endl;
                    return std::nullopt;
                  });
  std::cout << "res6: " << res6.value() << std::endl;

  return 0;
}
```

## 四、std::expected - 解决正确错误语义
### 1. 概述
`std::expected`（C++23）是一个模板类，用于表示可能成功（包含期望值）或失败（包含错误信息）的操作结果。模板参数为`std::expected<T, E>`，其中T是成功值类型，E是错误类型。

### 2. 特点
+ **明确的错误处理**：强制处理错误情况，编译时保证
+ **类型安全**：错误和成功值都有明确的类型
+ **性能优化**：避免异常的性能开销，零开销抽象
+ **函数式编程支持**：支持链式操作和组合
+ **丰富的错误信息**：可以携带详细的错误上下文

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

+ **函数声明**：

```cpp
template<class F>
constexpr auto transform(F&& f) const& -> std::expected<std::invoke_result_t<F, const T&>, E>;
template<class F>
constexpr auto transform(F&& f) && -> std::expected<std::invoke_result_t<F, T&&>, E>;
```

+ **参数**：`F&& f` - 可调用对象，接受T类型参数，返回任意类型U
+ **返回值**：`std::expected<U, E>`，其中U是变换函数的返回类型
+ **功能**：对成功值应用变换函数，错误值保持不变
+ **调用案例**：`auto doubled = exp.transform([](int x) { return x * 2; });`
+ **说明**：成功时将值乘以2，失败时错误信息不变

**and_then() 操作**

+ **函数声明**：

```cpp
template<class F>
constexpr auto and_then(F&& f) const& -> std::invoke_result_t<F, const T&>;
template<class F>
constexpr auto and_then(F&& f) && -> std::invoke_result_t<F, T&&>;
```

+ **参数**：`F&& f` - 可调用对象，接受T类型参数，返回`std::expected<U, E>`类型
+ **返回值**：函数返回的`std::expected<U, E>`类型
+ **功能**：对成功值应用返回expected的函数，可以引入新的错误
+ **调用案例**：`auto result = exp.and_then([](int x) -> std::expected<int, std::string> { return x > 0 ? x : std::unexpected("Invalid"); });`
+ **说明**：只有当值大于0时才成功，否则返回错误

**or_else() 操作**

+ **函数声明**：

```cpp
template<class F>
constexpr auto or_else(F&& f) const& -> std::invoke_result_t<F, const E&>;
template<class F>
constexpr auto or_else(F&& f) && -> std::invoke_result_t<F, E&&>;
```

+ **参数**：`F&& f` - 可调用对象，接受E类型参数，返回`std::expected<T, F>`类型
+ **返回值**：函数返回的`std::expected<T, F>`类型
+ **功能**：错误时提供恢复逻辑，成功值直接传播
+ **调用案例**：`auto recovered = error_exp.or_else([](const std::string& err) -> std::expected<int, std::string> { return 42; });`
+ **说明**：当包含错误时，返回默认值42作为恢复

**transform_error() 操作**

+ **函数声明**：

```cpp
template<class F>
constexpr auto transform_error(F&& f) const& -> std::expected<T, std::invoke_result_t<F, const E&>>;
template<class F>
constexpr auto transform_error(F&& f) && -> std::expected<T, std::invoke_result_t<F, E&&>>;
```

+ **参数**：`F&& f` - 可调用对象，接受E类型参数，返回任意类型F
+ **返回值**：`std::expected<T, F>`，其中F是错误变换函数的返回类型
+ **功能**：对错误值应用变换函数，成功值保持不变
+ **调用案例**：`auto formatted = exp.transform_error([](const std::string& err) { return "Error: " + err; });`
+ **说明**：为错误信息添加前缀，成功值不受影响

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
```

