---
sidebar_position: 8
---


## 概述
- requires表达式
- concepts 关键字

## 一. 概念约束

### 概念
概念约束（Concept Constraints）是C++20引入的一种编译时约束机制，用于对模板参数进行类型检查和限制。是std::enable_if的语法优化。它提供了一种声明式的方式来表达模板参数必须满足的要求。
### 与SFINAE的关系
- concepts是基于SFINAE机制的模板约束的语法糖
- concepts就是一个语法更友好的std::enable_if


## 二. requires表达式

### 概念
requires表达式是一种编译时表达式，用于检查给定的类型或表达式是否满足特定要求。它不依赖于concepts关键字，可以独立使用。

### 通用语法模板
```cpp
requires (参数列表) {
    要求1;
    要求2;
    // ...
}
```

### requires表达式本质
requires表达式本质上是一个bool常量表达式，在编译时求值为true或false。

**代码示例证明：**
```cpp
#include <print>
#include <string>

// requires表达式检查类型T是否支持加法
template <typename T> auto is_addable = requires(T a, T b) { a + b; };
struct MyStruct {};

int main(int argc, char *argv[]) {
  std::println("res<int> :{}", is_addable<int>);
  std::println("res<std::string> :{}", is_addable<std::string>);
  std::println("res<MyStruct> :{}", is_addable<MyStruct>);
  return 0;
}
```

### 使用案例

#### 1. 简单要求
```cpp
template<typename T>
constexpr bool is_incrementable = requires(T t) {
    ++t;  // 要求类型T支持前置递增
    t++;  // 要求类型T支持后置递增
};
```

#### 2. 类型要求
```cpp
template<typename T>
constexpr bool has_value_type = requires {
    typename T::value_type;  // 要求T有value_type成员类型
    typename T::iterator;    // 要求T有iterator成员类型
};
```

#### 3. 复合要求
##### 通用语法模板
```cpp
template<typename T>
concept ConceptName = requires(T t, 其他参数...) {
    // 复合要求的通用语法模板
    { 表达式 } -> 类型约束概念<期望类型>;
    { 表达式 } -> 类型约束概念<期望类型1, 期望类型2>;
    { 表达式 } noexcept -> 类型约束概念<期望类型>;
};
```
######  基本结构
```
{ 表达式 } -> 类型约束概念<期望类型>;
```

组成部分：
- {} - 花括号包围表达式，表示这是一个复合要求
- 表达式 - 需要检查的C++表达式
- -> - 返回类型约束操作符
- 类型约束概念 - 标准库或自定义的概念
- <期望类型> - 约束的目标类型

```cpp
template<typename T>
constexpr bool is_container_like = requires(T t) {
    { t.begin() } -> std::same_as<typename T::iterator>;
    { t.end() } -> std::same_as<typename T::iterator>;
    { t.size() } -> std::convertible_to<size_t>;
};
```

#### 4. 嵌套要求
```cpp
template<typename T>
constexpr bool advanced_container = requires(T t) {
    requires std::is_default_constructible_v<T>;
    requires std::is_copy_constructible_v<T>;
    { t.size() } -> std::convertible_to<size_t>;
    requires requires { t.clear(); }; // 嵌套requires
};
```


## 三. requires子句

### 概念
requires子句是在模板声明中使用的约束语法，用于限制模板参数必须满足的条件。它不依赖于concepts关键字。

### 通用语法模板
```cpp
// 函数模板
template<typename T>
return_type function_name(parameters) requires 约束表达式;

// 类模板
template<typename T> requires 约束表达式
class ClassName {
    // ...
};

// 模板特化
template<typename T>
void func() requires 约束表达式 {
    // ...
}
```

### 使用案例

#### 案例1：函数模板约束
```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void print_if_arithmetic(T value) requires std::is_arithmetic_v<T> {
    std::cout << "Arithmetic value: " << value << std::endl;
}

template<typename T>
void print_if_pointer(T ptr) requires std::is_pointer_v<T> {
    std::cout << "Pointer address: " << ptr << std::endl;
}

int main() {
    print_if_arithmetic(42);        // OK
    print_if_arithmetic(3.14);      // OK
    // print_if_arithmetic("hello"); // 编译错误
    
    int x = 10;
    print_if_pointer(&x);           // OK
    // print_if_pointer(42);        // 编译错误
    
    return 0;
}
```

#### 案例2：类模板约束
```cpp
template<typename T> requires std::is_integral_v<T>
class IntegerWrapper {
private:
    T value;
public:
    IntegerWrapper(T v) : value(v) {}
    T get() const { return value; }
    void increment() { ++value; }
};

int main() {
    IntegerWrapper<int> iw(42);     // OK
    IntegerWrapper<long> lw(100L);  // OK
    // IntegerWrapper<double> dw(3.14); // 编译错误
    
    return 0;
}
```

#### 案例3：复杂约束组合
```cpp
template<typename Container>
void process_container(const Container& c) 
requires requires(Container cont) {
    cont.begin();
    cont.end();
    cont.size();
} && std::is_same_v<typename Container::value_type, int> {
    std::cout << "Processing integer container with " << c.size() << " elements\n";
}
```

## 四. 概念concepts

### 概念
concepts是C++20引入的关键字，用于定义命名的约束集合。它将复杂的约束表达式封装成可重用的概念。

### 通用语法模板
```cpp
// 基本语法
template<typename T>
concept ConceptName = 约束表达式;

// 带参数的概念
template<typename T, typename U>
concept ConceptName = 约束表达式;

// 使用概念约束模板
template<ConceptName T>
void function(T param);

// 或者
template<typename T> requires ConceptName<T>
void function(T param);
```

### 使用案例

#### 案例1：基础概念定义
```cpp
#include <iostream>
#include <vector>
#include <list>
#include <type_traits>

// 定义可递增概念
template<typename T>
concept Incrementable = requires(T t) {
    ++t;
    t++;
};

// 定义容器概念
template<typename T>
concept Container = requires(T t) {
    t.begin();
    t.end();
    t.size();
    typename T::value_type;
};

// 使用概念约束函数
template<Incrementable T>
void increment_twice(T& value) {
    ++value;
    ++value;
}

template<Container C>
void print_container_info(const C& container) {
    std::cout << "Container size: " << container.size() << std::endl;
}

int main() {
    int x = 10;
    increment_twice(x);  // OK
    std::cout << "x = " << x << std::endl;
    
    std::vector<int> vec{1, 2, 3, 4, 5};
    print_container_info(vec);  // OK
    
    std::list<double> lst{1.1, 2.2, 3.3};
    print_container_info(lst);  // OK
    
    return 0;
}
```

#### 案例2：组合概念
```cpp
// 定义数值类型概念
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

// 定义可比较概念
template<typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
    { a > b } -> std::convertible_to<bool>;
    { a == b } -> std::convertible_to<bool>;
};

// 组合概念
template<typename T>
concept SortableNumeric = Numeric<T> && Comparable<T>;

// 使用组合概念
template<SortableNumeric T>
T max_value(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << "Max of 10 and 20: " << max_value(10, 20) << std::endl;
    std::cout << "Max of 3.14 and 2.71: " << max_value(3.14, 2.71) << std::endl;
    
    return 0;
}
```
