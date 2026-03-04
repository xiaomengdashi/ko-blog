---
sidebar_position: 1
slug: /C++/现代C++特性/现代C++其他特性
---

## 总述
本文档将详细介绍以下6个重要的C++新特性：

1. **explicit关键字** (C++98/03，C++11增强) - 防止隐式类型转换
2. **decltype关键字** (C++11) - 类型推导机制
3. **返回值后置语法** (C++11) - 函数返回类型的新写法
4. **属性(Attributes)** (C++11起) - 编译器提示和优化指令
5. **constexpr关键字** (C++11，持续增强) - 编译时计算和常量表达式
6. **泛型Lambda** (C++14) - 支持auto参数的Lambda表达式

这些特性极大地提升了C++的表达能力、类型安全性和运行时性能。

---

## 1. explicit关键字 (C++98/03，C++11增强)
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

## 2. decltype关键字 (C++11)
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
`std::vector<int>` vec = {1, 2, 3};
decltype(vec.begin()) it = vec.begin();  // 迭代器类型

// 函数返回类型推导
template<typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}
```

---

## 3. 返回值后置语法 (C++11)
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

## 4. 属性(Attributes) (C++11起)
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
| --- | --- | --- | --- |
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

## 5. constexpr关键字 (C++11，持续增强)
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
#### 5.1 constexpr变量 - 编译时常量
**作用**：创建真正的编译时常量，可用于模板参数、数组大小等需要编译时确定值的场合。

```cpp
constexpr int buffer_size = 1024;        // 编译时确定
constexpr double pi = 3.14159265359;     // 数学常量

// 可用于数组大小
int buffer[buffer_size];  // 编译时就知道大小
```

#### 5.2 constexpr函数 - 编译时计算
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

#### 5.3 constexpr类和构造函数 - 编译时对象
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

#### 5.4 constexpr if - 编译时条件分支 (C++17)
**作用**：在编译时根据条件选择不同的代码路径，实现真正的零开销抽象。这是模板元编程的重要工具，可以根据类型特征在编译时生成不同的代码。

**适用场景**：

+ 模板函数中根据类型特征选择不同实现
+ 避免运行时分支，提高性能
+ 简化SFINAE的使用
+ 实现类型安全的泛型代码

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

#### 5.5 constexpr与其他关键字结合
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

## 6. 泛型Lambda (C++14)
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
`std::vector<int>` numbers = {1, 2, 3, 4, 5};

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
print_container(`std::vector<std::string>`{"a", "b", "c"});  // 打印vector<string>
```

