---
sidebar_position: 9
---


## 总述
1.  **模板机制-SFINAE**  - C++模板的核心机制  **(重点)**
2.  **模板机制-类型萃取**(C++ 11) - 用于在编译时获取和操作类型信息  **(重点)**
3.  **constexpr关键字** (C++11，持续增强) - 编译时计算和常量表达式  **(重点)**
4. **explicit关键字** (C++98/03，C++11增强) - 防止隐式类型转换
5. **decltype关键字** (C++11) - 类型推导机制
6.  **返回值后置语法** (C++11) - 函数返回类型的新写法
7. **std::enable_if**  -（C++11）模板约束的语法糖
8.  **变量模板(C++14)** -  允许创建参数化的变量，就像函数模板和类模板一样
9. **泛型Lambda** (C++14) - 支持auto参数的Lambda表达式
10. **属性(Attributes)** (C++11起) - 编译器提示和优化指令
11. **折叠表达式** (C++17) -可变参数模板的强化

---
## 1. SFINAE 机制

### (1). 概念
SFINAE（Substitution Failure Is Not An Error）是C++模板元编程中的一个重要概念，字面意思是"替换失败不是错误"。它是C++模板系统的一个特性，当编译器在模板实例化过程中进行类型替换时，如果替换失败，编译器不会报错，而是简单地从重载决议候选集中移除该模板。
#### 特点
1. **编译时决策**：SFINAE在编译时进行类型检查和决策
2. **非侵入性**：不需要修改现有代码结构
3. **类型安全**：在编译时确保类型正确性
4. **重载决议**：影响函数模板的重载决议过程
5. **条件编译**：实现条件性的模板实例化

### (2) . 工作原理

SFINAE的工作原理基于C++模板的两阶段编译过程：
#### 阶段一：模板定义检查
编译器检查模板语法的正确性，但不进行类型替换。
#### 阶段二：模板实例化
当模板被使用时，编译器进行类型替换：
1. **成功替换**：模板成为重载决议的候选
2. **替换失败**：模板被静默移除，不产生编译错误
3. **重载决议**：从剩余候选中选择最佳匹配

#### 具体分析

```cpp
#include <iostream>
#include <type_traits>

// 当T是整数类型时启用此函数
template <typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type add(T a, T b) {
  return a + b;
}

// 当T不是整数类型时启用此函数
template <typename T>
typename std::enable_if<!std::is_integral<T>::value, T>::type add(T a, T b) {
  return a + b;
}

int main() {
  auto res1 = add(1, 2);
  std::cout << "int result: " << res1 << std::endl;

  std::string s1 = "1";
  std::string s2 = "2";
  auto res2 = add(s1, s2);
  std::cout << "not int result: " << res2 << std::endl;

  return 0;
}
```

##### 情况一：`T` 是整数类型

当调用 `add(1, 2)` 时，编译器在推导模板参数 `T` 为 `int` 后，开始对两个 `add` 函数模板进行实例化：
- 对于第一个 `add` 函数模板，`std::is_integral<int>::value` 为 `true`，该函数模板实例化成功，成为候选函数。
- 对于第二个 `add` 函数模板，`!std::is_integral<int>::value` 为 `false`，替换失败，根据 SFINAE 规则，编译器不会报错，而是将这个函数模板从候选集中排除。最终，第一个 `add` 函数被调用。

##### 情况二：`T` 不是整数类型
当调用 ` add(s1, s2)` 时，编译器推导模板参数 `T` 为 `string`，然后进行模板实例化：
- 对于第一个 `add` 函数模板，`std::is_integral<string>::value` 为 `false`，替换失败，根据 SFINAE 规则，该函数模板被从候选集中排除。
- 对于第二个 `add` 函数模板，`!std::is_integral<string>::value` 为 `true`，该函数模板实例化成功，最终被调用。

 正是由于 SFINAE 机制的存在，当 `T` 替换失败的时候编译器不会报错，而是排除该模板重载，继续寻找其他合适的模板重载，从而保证代码能够正确编译和运行。
**注意，替换失败不是错误的前提是，总有一个模板是能替换成功的。如果编译器试了你所有的模板还是没有找到可以替换成功的，他依然是错误**


### (3). 偏特化/全特化和SFINAE

#### 全特化（Full Specialization）
全特化是为特定类型提供完全定制的模板实现。

```cpp
// 主模板
template<typename T>
struct TypeTraits {
    static constexpr bool is_pointer = false;
    static constexpr const char* name = "unknown";
};

// 全特化
template<>
struct TypeTraits<int> {
    static constexpr bool is_pointer = false;
    static constexpr const char* name = "integer";
};

template<>
struct TypeTraits<double> {
    static constexpr bool is_pointer = false;
    static constexpr const char* name = "double";
};
```

#### 偏特化（Partial Specialization）
偏特化是为一类类型提供特定实现，仍保留部分模板参数。

```cpp
// 指针类型的偏特化
template<typename T>
struct TypeTraits<T*> {
    static constexpr bool is_pointer = true;
    static constexpr const char* name = "pointer";
};

// 数组类型的偏特化
template<typename T, size_t N>
struct TypeTraits<T[N]> {
    static constexpr bool is_pointer = false;
    static constexpr const char* name = "array";
};
```
#### SFINAE与特化的结合
通过SFINAE可以实现条件性的特化，根据类型特征自动选择合适的实现。

---


##  2. 类型萃取
### (1). 概念
类型萃取是C++模板元编程的核心技术，用于在编译时获取和操作类型信息。它允许我们查询类型的属性、转换类型，以及基于类型特征进行条件编译。
#### 基本原理
类型萃取基于模板特化和SFINAE技术，通过模板元编程在编译时计算类型信息。

### (2). 基础设施

#### 2.1 integral_constant

`integral_constant`是类型萃取的基础模板，定义如下：

```cpp
template <class T, T v>
struct integral_constant {
    static const T value = v;
    typedef T value_type;
    typedef integral_constant type;
    operator value_type() const noexcept { return value; }
};
```

#### 2.2 基础类型定义

```cpp
typedef integral_constant<bool, true>  true_type;
typedef integral_constant<bool, false> false_type;

// C++17引入
template <bool B>
using bool_constant = integral_constant<bool, B>;
```

#### 2.3 核心成员

##### ::value
- 编译期常量，存储萃取结果
- 对于布尔类型萃取，值为`true`或`false`
- 对于数值类型萃取，存储具体的数值

```cpp
static_assert(std::is_integral<int>::value == true);
static_assert(std::rank<int[3][4]>::value == 2);
```

##### ::type
- 类型别名，通常指向自身
- 在类型变换萃取中指向变换后的类型
- 支持嵌套萃取操作

```cpp
using type1 = std::remove_const<const int>::type;  // int
using type2 = std::add_pointer<int>::type;          // int*
```

##### ::value_type
- 值的类型，通常为`bool`或其他基础类型
- 在`integral_constant`中定义

#### 2.4 typename模板功能
1. 声明模板参数 ：用于声明类型模板参数
2. 消除歧义 ：告诉编译器某个依赖名称是一个类型

 **依赖名称消歧义（核心功能）** 
依赖名称是指依赖于模板参数的名称。当编译器遇到依赖名称时，无法确定它是类型还是值，需要 typename 关键字明确指示。

```cpp
template<typename T>
void problematic_function() {
    // 错误：编译器不知道T::type是类型还是静态成员变量
    T::type variable;  // 编译错误
    
    // 正确：使用typename明确指示这是一个类型
    typename T::type variable;  // 正确
}
```

---




## 3. constexpr关键字 (C++11，持续增强)

### 特性说明与通俗解释

`constexpr`是C++11引入的一个革命性特性，它的核心思想是**将计算从运行时转移到编译时**。

**通俗比喻**：想象你要做一道数学题，传统方式是考试时现场计算，而`constexpr`就像是提前在家里算好答案，考试时直接写结果。这样不仅节省了考试时间（运行时间），还能提前发现计算错误（编译时错误检查）。

**核心作用**：
1. **性能提升**：编译时完成计算，运行时直接使用结果
2. **类型安全**：编译时就能发现错误
3. **常量需求**：可用于需要编译时常量的场合（如数组大小）
4. **优化机会**：给编译器更多优化空间

### 语法模板
```cpp
// constexpr变量
constexpr 类型 变量名 = 表达式;

// constexpr函数
constexpr 返回类型 函数名(参数列表) {
    // 函数体（需满足constexpr要求）
}

// constexpr构造函数
class ClassName {
public:
    constexpr ClassName(参数列表) : 成员初始化列表 {}
};
```

### constexpr的各种用法及作用

####  constexpr变量 - 编译时常量
**作用**：创建真正的编译时常量，可用于模板参数、数组大小等需要编译时确定值的场合。

```cpp
constexpr int buffer_size = 1024;        // 编译时确定
constexpr double pi = 3.14159265359;     // 数学常量

// 可用于数组大小
int buffer[buffer_size];  // 编译时就知道大小
```

####  constexpr函数 - 编译时计算
**作用**：函数可以在编译时执行，如果参数是编译时常量，结果也是编译时常量。

```cpp
// 简单数学计算
constexpr int square(int x) {
    return x * x;
}

// 递归计算
constexpr int factorial(int n) {
    return (n <= 1) ? 1 : n * factorial(n - 1);
}

// 使用示例
constexpr int result1 = square(10);      // 编译时计算：100
constexpr int result2 = factorial(5);    // 编译时计算：120
```

#### constexpr类和构造函数 - 编译时对象
**作用**：允许在编译时创建和操作对象，实现复杂的编译时计算。

```cpp
class Point {
public:
    constexpr Point(int x, int y) : x_(x), y_(y) {}
    constexpr int getX() const { return x_; }
    constexpr int distanceSquared() const {
        return x_ * x_ + y_ * y_;
    }
private:
    int x_, y_;
};

// 编译时创建对象并计算
constexpr Point p(3, 4);
constexpr int dist = p.distanceSquared();  // 编译时计算：25
```

####  constexpr if - 编译时条件分支 (C++17)
**作用**：在编译时根据条件选择不同的代码路径，实现真正的零开销抽象。这是模板元编程的重要工具，可以根据类型特征在编译时生成不同的代码。

**适用场景**：
- 模板函数中根据类型特征选择不同实现
- 避免运行时分支，提高性能
- 简化SFINAE的使用
- 实现类型安全的泛型代码

```cpp
// 基本用法
template<typename T>
constexpr auto process_value(T value) {
    if constexpr (std::is_integral_v<T>) {
        // 整数类型的处理 - 只有当T是整数时才编译这部分代码
        return value * 2;
    } else if constexpr (std::is_floating_point_v<T>) {
        // 浮点类型的处理 - 只有当T是浮点数时才编译这部分代码
        return value * 1.5;
    } else {
        // 其他类型的处理
        return value;
    }
}

// 编译时就确定调用哪个分支
auto int_result = process_value(10);      // 编译时选择整数分支
auto float_result = process_value(3.14);  // 编译时选择浮点分支

// 复杂示例：根据容器类型选择不同的访问方式
template<typename Container>
void print_container(const Container& c) {
    if constexpr (std::is_same_v<Container, std::string>) {
        // 字符串特殊处理
        std::cout << "String: " << c << std::endl;
    } else if constexpr (requires { c.begin(); c.end(); }) {
        // 可迭代容器
        std::cout << "Container: ";
        for (const auto& item : c) {
            std::cout << item << " ";
        }
        std::cout << std::endl;
    } else {
        // 单个值
        std::cout << "Value: " << c << std::endl;
    }
}
```

####  constexpr与其他关键字结合

##### constexpr + static
**作用**：创建编译时确定的静态常量
```cpp
class Config {
public:
    static constexpr int max_connections = 100;
    static constexpr double timeout = 30.0;
};
```

##### constexpr + lambda (C++17)
**作用**：创建可在编译时执行的lambda表达式
```cpp
constexpr auto square_lambda = [](int x) constexpr {
    return x * x;
};

constexpr int result = square_lambda(5);  // 编译时计算：25
```



---


## 4. explicit关键字 (C++98/03，C++11增强)

### 特性说明
`explicit`关键字是一个访问控制修饰符，用于防止编译器进行隐式类型转换。它强制要求必须显式地调用构造函数或转换运算符，从而避免意外的类型转换导致的bug。

### 语法模板
```cpp
// 构造函数
class ClassName {
public:
    explicit ClassName(参数类型 参数名);
};

// 转换运算符 (C++11)
class ClassName {
public:
    explicit operator 目标类型() const;
};
```

### 使用示例

```cpp
class MyString {
public:
    // 防止隐式转换
    explicit MyString(int size) : data(new char[size]), length(size) {}
    
    // C++11: 显式转换运算符
    explicit operator bool() const {
        return data != nullptr;
    }
    
private:
    char* data;
    int length;
};

// 使用示例
MyString str1(10);           // 正确：显式构造
// MyString str2 = 10;       // 错误：禁止隐式转换
// bool valid = str1;        // 错误：禁止隐式转换
bool valid = static_cast<bool>(str1);  // 正确：显式转换
```

---

## 5. decltype关键字 (C++11)

### 特性说明
`decltype`是一个类型推导关键字，它可以在编译时推导出表达式的类型。与`auto`不同，`decltype`会保留表达式的完整类型信息，包括引用、const等修饰符。

### 语法模板
```cpp
decltype(表达式) 变量名;
decltype(表达式) 函数名(参数列表);

// 与auto结合使用
auto 函数名(参数列表) -> decltype(表达式);
```

### 使用示例

```cpp
int x = 42;
const int& ref = x;

// 类型推导示例
decltype(x) y = 100;        // y的类型是int
decltype(ref) z = x;        // z的类型是const int&
decltype(x + y) result;     // result的类型是int

// 与容器结合
std::vector<int> vec = {1, 2, 3};
decltype(vec.begin()) it = vec.begin();  // 迭代器类型

// 函数返回类型推导
template<typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}
```

---

## 6. 返回值后置语法 (C++11)

### 特性说明
返回值后置语法（Trailing Return Type）是一种新的函数声明方式，使用`auto`关键字占位，然后用`->`指定真正的返回类型。这种语法在模板编程中特别有用，可以更容易地表达复杂的返回类型。

### 语法模板
```cpp
auto 函数名(参数列表) -> 返回类型 {
    // 函数体
}

// 模板函数中的应用
template<typename T, typename U>
auto 函数名(T t, U u) -> decltype(表达式) {
    // 函数体
}
```

### 使用示例

```cpp
// 简单函数
auto add(int a, int b) -> int {
    return a + b;
}

// 模板函数中的复杂返回类型
template<typename Container>
auto getFirst(Container& c) -> decltype(c[0]) {
    return c[0];
}

// 与lambda结合
auto lambda = [](int x, int y) -> double {
    return static_cast<double>(x) / y;
};
```

---



## 7. std::enable_if

### std::enable_if 介绍
`std::enable_if`是C++11引入的类型特征工具，是基于SFINAE机制的具体的模板约束的语法糖。

### 定义和参数
```cpp
template<bool B, class T = void>
struct enable_if {};

template<class T>
struct enable_if<true, T> { typedef T type; };
```

**参数说明：**
- `B`：布尔条件，当为`true`时启用模板
- `T`：当条件为`true`时的类型，默认为`void`

### 基本用法

**1. 函数模板的条件启用**
```cpp
#include <type_traits>

// 只对整数类型启用
template<typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
abs_value(T value) {
    return value < 0 ? -value : value;
}

// 只对浮点类型启用
template<typename T>
typename std::enable_if<std::is_floating_point<T>::value, T>::type
abs_value(T value) {
    return std::abs(value);
}

int main() {
    auto result1 = abs_value(42);     // 调用整数版本
    auto result2 = abs_value(3.14);   // 调用浮点版本
    // auto result3 = abs_value("hello"); // 编译错误，没有匹配的版本
    return 0;
}
```

**2. 模板参数的条件启用**
```cpp
template<typename T, 
         typename = typename std::enable_if<std::is_arithmetic<T>::value>::type>
class Calculator {
public:
    T add(T a, T b) { return a + b; }
    T multiply(T a, T b) { return a * b; }
};

// 使用示例
Calculator<int> int_calc;        // OK
Calculator<double> double_calc;  // OK
// Calculator<std::string> str_calc; // 编译错误
```



---




## 8. 变量模板

变量模板是C++14引入的重要特性，允许创建参数化的变量，就像函数模板和类模板一样。

## 基本语法

```cpp
template<模板参数列表>
变量声明和初始化
```

### 语法示例

```cpp
// 基本语法
template<typename T>
constexpr T pi = T(3.1415926535897932385);

// 实例化变量模板
double pi_double = pi<double>;     // 3.14159...
float pi_float = pi<float>;        // 3.14159...f

```


---



## 9. 泛型Lambda (C++14)

### 特性说明
泛型Lambda是C++14引入的特性，允许Lambda表达式使用`auto`参数，从而支持多种类型的参数。它本质上是函数模板的简化版本，编译器会为每种使用的类型自动生成特化版本。

### 语法模板
```cpp
// 基本语法
auto lambda_name = [捕获列表](auto 参数1, auto 参数2, ...) {
    // 函数体
};

// 带返回类型
auto lambda_name = [捕获列表](auto 参数1, auto 参数2, ...) -> 返回类型 {
    // 函数体
};
```

### 使用示例

```cpp
// 基本泛型lambda
auto add = [](auto a, auto b) {
    return a + b;
};

// 可以处理不同类型
int int_result = add(5, 3);                    // int + int
double double_result = add(2.5, 1.5);          // double + double
std::string str_result = add(std::string("Hello "), std::string("World"));  // string + string

// 与STL算法结合
std::vector<int> numbers = {1, 2, 3, 4, 5};

// 泛型lambda用于变换
auto square = [](auto x) { return x * x; };
std::transform(numbers.begin(), numbers.end(), numbers.begin(), square);

// 泛型lambda用于打印容器
auto print_container = [](const auto& container) {
    for (const auto& item : container) {
        std::cout << item << " ";
    }
    std::cout << std::endl;
};

print_container(numbers);  // 打印vector<int>
print_container(std::vector<std::string>{"a", "b", "c"});  // 打印vector<string>
```

---

## 10. 属性(Attributes) (C++11起)

### 特性说明
属性是一种标准化的语法，用于向编译器提供额外的信息和提示。它们不改变程序的语义，但可以帮助编译器进行优化、生成警告或进行静态分析。

### 语法模板
```cpp
[[属性名]] 声明;
[[属性名(参数)]] 声明;
[[属性1, 属性2]] 声明;
```

### 使用示例

#### [[deprecated]] - 标记弃用
```cpp
[[deprecated("Use newFunction() instead")]]
void oldFunction() {
    // 旧的实现
}

[[deprecated]]
int old_variable = 42;
```

#### [[nodiscard]] - 返回值不应被忽略
```cpp
[[nodiscard]] int calculate() {
    return 42;
}

// 使用
// calculate();  // 警告：忽略返回值
int result = calculate();  // 正确
```

#### [[maybe_unused]] - 可能未使用
```cpp
void debugFunction() {
    [[maybe_unused]] int debugVar = 100;
    // debugVar可能只在调试时使用
}
```

### 常用属性表格

| 属性 | 标准版本 | 作用 | 示例 |
|------|----------|------|------|
| `[[noreturn]]` | C++11 | 函数不返回 | `[[noreturn]] void exit_program();` |
| `[[carries_dependency]]` | C++11 | 内存序依赖传递 | `void func([[carries_dependency]] int* p);` |
| `[[deprecated]]` | C++14 | 标记弃用 | `[[deprecated]] void old_func();` |
| `[[deprecated("msg")]]` | C++14 | 带消息的弃用标记 | `[[deprecated("Use new_func")]] void old_func();` |
| `[[fallthrough]]` | C++17 | switch穿透 | `case 1: doSomething(); [[fallthrough]];` |
| `[[nodiscard]]` | C++17 | 返回值不应忽略 | `[[nodiscard]] int get_value();` |
| `[[maybe_unused]]` | C++17 | 可能未使用 | `[[maybe_unused]] int debug_var = 0;` |
| `[[likely]]` | C++20 | 分支可能执行 | `if (condition) [[likely]] { ... }` |
| `[[unlikely]]` | C++20 | 分支不太可能执行 | `if (error) [[unlikely]] { ... }` |
| `[[no_unique_address]]` | C++20 | 空基类优化 | `[[no_unique_address]] Empty e;` |

--- 


## 11 . 折叠表达式

### 概述

折叠表达式（Fold Expressions）是C++17引入的一项功能，它提供了一种简洁的语法来实现对参数包（parameter pack）的操作，可以将二元运算符应用于参数包中的所有元素，从而将参数包"折叠"成单个值。

### 语法

折叠表达式有四种形式：

1. **一元右折叠**：`(pack op ...)`
2. **一元左折叠**：`(... op pack)`
3. **二元右折叠**：`(pack op ... op init)`
4. **二元左折叠**：`(init op ... op pack)`

其中：
- `pack` 是包含参数包的表达式
- `op` 是二元运算符
- `init` 是初始值

### 结合性

- 左折叠：`(... op pack)` 展开为 `(((...(init op e1) op e2) op ...) op eN)`
- 右折叠：`(pack op ...)` 展开为 `(e1 op (e2 op (... op (eN op init))))`

结合性对于某些运算符（如减法`-`）会产生不同的结果。

### 空参数包处理

当使用一元折叠处理空参数包时，只有以下运算符允许使用：

1. 逻辑与（`&&`）：空包的值为`true`
2. 逻辑或（`||`）：空包的值为`false`
3. 逗号运算符（`,`）：空包的值为`void()`

### 使用示例

#### 1. 求和

```cpp
template<typename... Args>
auto sum(Args... args) {
    return (... + args); // 一元左折叠
}

// 使用：sum(1, 2, 3) 展开为 ((1 + 2) + 3) = 6
```

#### 2. 打印参数

```cpp
template<typename... Args>
void printer(Args&&... args) {
    (std::cout << ... << args) << '\n'; // 使用<<运算符的折叠表达式
}

// 使用：printer("Hello", ' ', "World", '!') 输出 "Hello World!"
```

#### 3. 使用逗号运算符执行多个操作

```cpp
template<typename T, typename... Args>
void push_back_vec(std::vector<T>& v, Args&&... args) {
    // 静态断言检查每个参数是否可构造为T类型
    static_assert((std::is_constructible_v<T, Args&&> && ...));
    
    // 对每个参数执行push_back操作
    (v.push_back(std::forward<Args>(args)), ...);
}
```

#### 4. 类型特性检查

```cpp
template<typename... Ts>
constexpr bool all_integral = (std::is_integral_v<Ts> && ...);

// 使用：all_integral<int, char, long> 为 true
// 使用：all_integral<int, double> 为 false
```

