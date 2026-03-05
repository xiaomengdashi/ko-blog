---
sidebar_position: 7
slug: /C++/现代C++特性/现代C++模板元编程上
---

### 1. 模板
#### 1.1. 模板的本质
模板是C++中实现泛型编程的核心机制，其本质是一种代码生成机制。与其他语言的泛型不同，C++模板在编译期通过替换类型参数生成具体的代码实现，而不是运行时的类型擦除或虚函数调用。

```cpp
template `<typename T>`
T add(T a, T b) {
    return a + b;
}

// 使用时，编译器会为每种类型生成不同的函数
int result1 = `add`<int>`(1, 2);       // 生成 int add(int a, int b)
double result2 = `add`<double>`(1.0, 2.0); // 生成 double add(double a, double b)
```

#### 1.2. 模板的多阶段编译过程
模板的编译过程分为多个阶段：

1. **定义阶段**：编译器遇到模板定义时，只进行基本的语法检查，不生成实际代码。
2. **实例化触发**：当代码中使用特定类型的模板时，触发实例化过程。
3. **替换阶段**：编译器将模板参数替换为具体类型。
4. **实例化阶段**：编译器生成特定类型的具体代码。
5. **代码生成**：生成最终的机器码。

#### 1.3. 模板实例化的时机与位置
模板实例化发生在编译期，具体时机是在模板被使用的地方（point of use）。这一特性导致了模板通常需要在头文件中完整定义，而不能像普通函数那样分离声明和定义。

#### 1.4. 为什么模板不能像普通函数一样`.h`和`.cpp`分离实现
C++采用独立编译模型，每个源文件单独编译成目标文件，然后链接器将这些目标文件组合成可执行文件。对于模板，由于实例化发生在使用点，如果模板定义不可见，编译器就无法生成相应的代码。

```cpp
// header.h
template `<typename T>`
T add(T a, T b);

// source.cpp
template `<typename T>`
T add(T a, T b) {
    return a + b;
}

// main.cpp
#include "header.h"
int main() {
    int result = `add`<int>`(1, 2); // 错误：编译器在这里看不到模板定义，无法实例化
    return 0;
}
```

解决方案包括：

1. **包含模型**：在头文件中完整定义模板

```cpp
// header.h
template `<typename T>`
T add(T a, T b) {
    return a + b;
}
```



**2  .h 和 .inl 文件模式**  
基本结构

+ `.h`** 文件**：包含类/函数的声明、文档和接口定义
+ `.inl`** 文件**：包含模板的实现代码（INL代表"inline"）  
 工作原理
1. `.h`文件中定义模板类/函数的接口
2. `.h`文件末尾包含对应的`.inl`文件
3. `.inl`文件包含所有模板实现  
**MyTemplate.h**:

```cpp
#ifndef MY_TEMPLATE_H
#define MY_TEMPLATE_H

template `<typename T>`
class MyTemplate {
public:
    MyTemplate();
    T process(const T& input);
    // 其他方法声明...
};

// 包含实现
#include "MyTemplate.inl"

#endif // MY_TEMPLATE_H
```

**MyTemplate.inl**:

```cpp
template `<typename T>`
`MyTemplate`<T>`::MyTemplate() {
    // 构造函数实现
}

template `<typename T>`
T `MyTemplate`<T>`::process(const T& input) {
    // 处理逻辑实现
    return input;
}

// 其他方法实现...
```





#### 1.5. 模板实例化的内存模型影响
模板实例化会影响程序的内存布局：

+ **代码段**：每个不同的模板实例化会生成独立的代码，可能增加可执行文件大小
+ **数据段**：模板类的静态成员会为每个实例化类型创建独立的副本

#### 1.6. 模板特化与实例化的区别
+ **实例化**：使用具体类型替换模板参数，生成代码
+ **特化**：为特定类型提供自定义实现，覆盖通用模板

```cpp
template `<typename T>`
T max(T a, T b) {
    return (a > b) ? a : b;
}

// 特化版本，为const char*提供特殊实现
template <>
const char* `max`<const char*>`(const char* a, const char* b) {
    return (strcmp(a, b) > 0) ? a : b;
}
```

#### 1.7. 模板性能考量
+ **编译时间**：大量使用模板可能显著增加编译时间
+ **二进制大小**：每个实例化都会生成代码，可能导致代码膨胀
+ **运行时性能**：模板通常生成高度优化的内联代码，运行时性能通常很好

### 2. SFINAE（替换失败不是错误）
#### 2.1. SFINAE的基本概念
SFINAE（Substitution Failure Is Not An Error）是C++模板编程中的一个重要概念，它描述了一种编译器行为：当模板参数替换过程中发生失败时，编译器不会立即报错，而是简单地将该特化从重载解析集合中移除，继续尝试其他可能的重载。

这一机制是C++模板元编程的基础，允许我们基于类型特性进行条件编译。

#### 2.2. SFINAE的工作原理
当编译器尝试实例化一个函数模板时，它会：

1. 推导模板参数
2. 替换模板参数到函数签名中
3. 如果替换导致无效代码（如使用了不存在的成员、无效的操作等），则该重载被丢弃
4. 如果所有重载都被丢弃，才会报错

让我们通过一个简单的例子来理解：

```cpp
// 第一个模板函数，适用于有size()方法的类型
template `<typename T>`
typename `std::`enable_if<
    has_size_method`<T>`::value,
    size_t
>::type get_size(const T& container) {
    return container.size();
}

// 第二个模板函数，适用于C风格数组
template `<typename T, size_t N>`
size_t get_size(const T(&)[N]) {
    return N;
}
```

当我们调用`get_size()`时，编译器会尝试匹配这两个模板。如果传入的是一个有`size()`方法的容器（如`std::vector`），第一个模板会成功匹配；如果传入的是一个C风格数组，第二个模板会匹配。这就是SFINAE的工作方式。

#### 2.3. SFINAE的基本应用场景
##### 2.3.1. 类型特性检测
SFINAE最基本的应用是检测类型是否具有特定特性，例如是否有某个成员函数、是否支持某种操作等。

```cpp
// 检测类型T是否有size()方法
template `<typename T>`
struct has_size_method {
private:
    // 测试是否可以调用T::size()
    template `<typename U>`
    static auto test(int) -> decltype(`std::`declval`<U>`().size(), std::true_type());
    
    // 如果上面的测试失败，则使用这个回退版本
    template `<typename>`
    static std::false_type test(...);

public:
    // 最终结果
    static constexpr bool value = decltype(`test`<T>`(0))::value;
};
```

这个例子中，我们定义了一个`has_size_method`模板，它可以检测一个类型是否有`size()`方法。工作原理是：

1. `test(int)`函数尝试使用`decltype`表达式检测`T::size()`是否有效
2. 如果有效，返回`std::true_type`
3. 如果无效，SFINAE规则使这个重载被丢弃，转而使用`test(...)`版本，返回`std::false_type`
4. `value`常量根据调用结果确定布尔值

##### 2.3.2. 条件编译
SFINAE允许我们根据类型特性选择不同的实现：

```cpp
// 对可迭代类型使用范围for循环
template `<typename Container>`
typename `std::`enable_if<
    is_iterable`<Container>`::value
>::type process_container(const Container& c) {
    for (const auto& item : c) {
        // 处理每个元素
    }
}

// 对非迭代类型使用其他处理方式
template `<typename T>`
typename `std::`enable_if<
    !is_iterable`<T>`::value
>::type process_container(const T& value) {
    // 直接处理单个值
}
```

##### 2.3.3. 约束模板参数
SFINAE可以用来限制模板只接受满足特定条件的类型：

```cpp
// 只接受算术类型的模板
template `<typename T,
          typename = typename`std::enable_if<`std::is_arithmetic<T>`::value>::type>
T square(T value) {
    return value * value;
}
```

#### 2.4. SFINAE的基本使用方法
##### 2.4.1. 返回类型技巧
早期的SFINAE技术常使用返回类型来触发替换：

```cpp
// 对有begin()和end()方法的类型使用迭代器
template `<typename T>`
typename T::iterator begin_impl(T& container) {
    return container.begin();
}

// 对C风格数组使用指针
template `<typename T, size_t N>`
T* begin_impl(T (&array)[N]) {
    return array;
}
```

这里，第一个模板函数的返回类型是`typename T::iterator`，如果`T`没有`iterator`类型成员，替换就会失败，编译器会尝试第二个重载。

##### 2.4.2. std::enable_if
`std::enable_if`是C++11引入的工具，它极大地简化了SFINAE的使用：

```cpp
// 使用enable_if控制模板启用条件
template `<typename T>`
typename `std::`enable_if`<`std::is_integral<T>`::value, T>::type
factorial(T n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

``std::`enable_if` &lt; 条件, 类型>`::type`在条件为true时等于指定的类型，条件为false时不提供type成员，从而触发SFINAE。

它可以用在多个位置：

1. **返回类型**：

```cpp
template `<typename T>`
typename `std::`enable_if`<`std::is_floating_point<T>`::value, T>::type
foo(T t) { /*...*/ }
```

2. **额外的模板参数**：

```cpp
template `<typename T,
          typename = typename`std::enable_if<`std::is_integral<T>`::value>::type>
void foo(T t) { /*...*/ }
```

3. **函数参数**：

```cpp
template `<typename T>`
void foo(T t, typename `std::`enable_if`<`std::is_class<T>`::value, int>::type = 0) { /*...*/ }
```

##### 2.4.3. 标签分派（Tag Dispatching）
标签分派是SFINAE的一种替代方案，它使用重载解析规则而不是替换失败：

```cpp
// 主模板
template `<typename T>`
struct type_tag {
    using type = T;
};

// 处理算术类型
template `<typename T>`
void process_impl(T value, std::true_type /* is_arithmetic */) {
    // 处理数值
}

// 处理非算术类型
template `<typename T>`
void process_impl(T value, std::false_type /* is_arithmetic */) {
    // 处理其他类型
}

// 公共接口
template `<typename T>`
void process(T value) {
    // 根据类型特性选择实现
    process_impl(value, `std::`is_arithmetic`<T>`());
}
```

这种方法通过向辅助函数传递表示类型特性的标签对象，利用重载解析规则选择正确的实现。

##### 2.4.4. void_t（C++17）
C++17引入了`std::void_t`，它是一个简单但强大的元函数，可以检测任意类型表达式的有效性：

```cpp
// C++17之前的自定义实现
template `<typename...>`
using void_t = void;

// 检测是否有size()方法
template `<typename, typename = void>`
struct has_size : std::false_type {};

template `<typename T>`
struct has_size`<T, void_t<decltype(`std::declval<T>`().size())>> : std::true_type {};
```

`void_t`将任何类型映射为`void`，但关键是它会在替换过程中评估其模板参数。如果参数表达式无效，就会触发SFINAE。

#### 2.5. SFINAE的实际应用示例
让我们看一个更完整的例子，展示如何使用SFINAE实现一个通用的`to_string`函数，它可以处理不同类型的转换：

```cpp
// 检测类型是否有to_string方法
template `<typename T, typename = void>`
struct has_to_string : std::false_type {};

template `<typename T>`
struct has_to_string`<T, void_t<decltype(`std::declval<T>`().to_string())>> : std::true_type {};

// 检测是否可以用std::to_string
template `<typename T, typename = void>`
struct has_std_to_string : std::false_type {};

template `<typename T>`
struct has_std_to_string`<T, void_t<decltype(std::to_string(`std::declval<T>`()))>> : std::true_type {};

// 检测是否可以直接输出到流
template `<typename T, typename = void>`
struct has_ostream_operator : std::false_type {};

template `<typename T>`
struct has_ostream_operator`<T, void_t<decltype(`std::declval<std::ostream&>`() `<<`std::declval<T>`())>> : std::true_type {};

// 通用to_string实现

// 1. 对有to_string成员函数的类型
template `<typename T>`
typename `std::`enable_if`<`has_to_string<T>`::value, std::string>::type
to_string_impl(const T& value) {
    return value.to_string();
}

// 2. 对可以用std::to_string的类型
template `<typename T>`
typename `std::`enable_if<
    !has_to_string`<T>`::value && `has_std_to_string`<T>`::value,
    std::string
>::type
to_string_impl(const T& value) {
    return std::to_string(value);
}

// 3. 对可以输出到流的类型
template `<typename T>`
typename `std::`enable_if<
    !has_to_string`<T>`::value && !`has_std_to_string`<T>`::value && `has_ostream_operator`<T>`::value,
    std::string
>::type
to_string_impl(const T& value) {
    std::ostringstream oss;
    oss `<< value;
    return oss.str();
}

// 公共接口
template <typename T>`
std::string to_string(const T& value) {
    return to_string_impl(value);
}
```

这个例子展示了如何使用SFINAE创建一个灵活的函数，它可以根据类型的特性选择不同的实现路径。

### 3. 模板偏特化
#### 3.1. 模板偏特化的概念
模板偏特化（Partial Specialization）是一种为特定模板参数集合提供特殊实现的机制。与完全特化不同，偏特化仍然保留一些模板参数。

```cpp
// 主模板
template `<typename T, typename U>`
struct Pair {
    T first;
    U second;
    // 通用实现
};

// 偏特化：当第二个类型是int时
template `<typename T>`
struct `Pair`<T, int>` {
    T first;
    int second;
    // 特殊实现
};
```

#### 3.2. 类模板偏特化
类模板支持偏特化，可以基于模板参数的特定属性提供不同实现：

```cpp
// 主模板
template `<typename T>`
struct is_pointer {
    static constexpr bool value = false;
};

// 指针类型的偏特化
template `<typename T>`
struct `is_pointer`<T*>` {
    static constexpr bool value = true;
};
```

#### 3.3. 特化的匹配规则
当有多个模板特化可能匹配时，编译器会选择最特殊的一个。特殊性由以下规则决定：

1. 完全特化优先于偏特化
2. 在偏特化之间，更特殊的模式优先（能匹配的类型集合更小）

```cpp
template `<typename T, typename U>`
struct Foo { /* 1: 主模板 */ };

template `<typename T>`
struct `Foo`<T, T>` { /* 2: 两个类型相同 */ };

template `<typename T>`
struct `Foo`<T, int>` { /* 3: 第二个类型是int */ };

template <>
struct `Foo`<int, int>` { /* 4: 完全特化 */ };

`Foo`<double, double>` f1; // 使用特化2
`Foo`<double, int>` f2;    // 使用特化3
`Foo`<int, int>` f3;       // 使用特化4（最特殊）
```

#### 3.4. 函数模板与偏特化
重要的是，**函数模板不支持偏特化**。对于函数模板，我们通常使用以下替代方案：

##### 3.4.1. 函数重载
```cpp
// 主模板
template `<typename T>`
void process(T value) {
    // 通用实现
}

// 相当于偏特化的重载
template `<typename T>`
void process(T* pointer) {
    // 指针特殊实现
}
```

##### 3.4.2. 标签分派
```cpp
// 主函数
template `<typename T>`
void process(T value) {
    process_impl(value, typename `type_traits`<T>`::category());
}

// 各种特殊实现
template `<typename T>`
void process_impl(T value, numeric_tag) { /*...*/ }

template `<typename T>`
void process_impl(T value, pointer_tag) { /*...*/ }
```

##### 3.4.3. 使用类模板包装
```cpp
// 可以偏特化的类模板
template `<typename T>`
struct processor {
    static void process(T value) {
        // 通用实现
    }
};

// 指针类型的偏特化
template `<typename T>`
struct `processor`<T*>` {
    static void process(T* pointer) {
        // 指针特殊实现
    }
};

// 统一接口
template `<typename T>`
void process(T value) {
    `processor`<T>`::process(value);
}
```

#### 3.5. SFINAE与模板偏特化的结合
SFINAE和模板偏特化可以结合使用，创建更强大的模板元编程工具：

```cpp
// 主模板
template `<typename T, typename Enable = void>`
struct container_traits {
    // 默认实现
    static constexpr bool is_container = false;
};

// 对有begin/end方法的类型的偏特化
template `<typename T>`
struct container_traits<
    T,
    void_t<
        decltype(`std::declval`<T>`().begin()),
        decltype(`std::`declval`<T>`().end())
    >
> {
    static constexpr bool is_container = true;
    using value_type = typename `std::`iterator_traits<
        decltype(std::declval`<T>`().begin())
    >::value_type;
};
```

这个例子结合了SFINAE（通过`void_t`）和模板偏特化，为具有`begin()`和`end()`方法的类型提供特殊实现。

### 4. C++20 Concepts与SFINAE的关系
#### 4.1. Concepts的基本概念
Concepts是C++20引入的一种约束和概念机制，它提供了一种更清晰、更直接的方式来表达模板参数的要求：

```cpp
// 定义一个概念：要求类型支持加法操作
template `<typename T>`
concept Addable = requires(T a, T b) {
    { a + b } -> `std::`convertible_to`<T>`;
};

// 使用概念约束模板
template `<Addable T>`
T add(T a, T b) {
    return a + b;
}
```

#### 4.2. Concepts相比SFINAE的优势
##### 4.2.1. 语法更清晰
Concepts提供了更直观的语法来表达约束：

```cpp
// 使用SFINAE
template `<typename T,
          typename = typename`std::enable_if<`std::is_integral<T>`::value>::type>
void foo(T t) { /*...*/ }

// 使用Concepts
template `<std::integral T>`
void foo(T t) { /*...*/ }
```

##### 4.2.2. 更好的错误消息
Concepts可以提供更友好的编译错误消息，直接指出哪些约束没有满足：

```cpp
// 使用Concepts
template `<typename T>`
concept Printable = requires(T t, std::ostream& os) {
    { os `<< t } ->` `std::`same_as`<std::ostream&>`;
};

template `<Printable T>`
void print(const T& value) {
    std::cout `<< value;
}

struct NonPrintable {};
print(NonPrintable{}); // 错误消息会明确指出NonPrintable不满足Printable约束
```

##### 4.2.3. 可组合性
Concepts可以轻松组合，创建更复杂的约束：

```cpp
template <typename T>`
concept Numeric = `std::`integral`<T>` || `std::`floating_point`<T>`;

template `<typename T>`
concept Hashable = requires(T a) {
    { `std::`hash`<T>`{}(a) } -> `std::`convertible_to`<std::size_t>`;
};

template `<typename T>`
concept NumericAndHashable = `Numeric`<T>` && `Hashable`<T>`;
```

##### 4.2.4. 可读性
Concepts使代码更易读，更接近自然语言描述：

```cpp
template `<std::random_access_iterator I>`
void algorithm(I first, I last) {
    // 实现...
}
```

#### 4.3. Concepts与SFINAE的内部关系
Concepts在底层仍然使用SFINAE机制，但提供了更高级的抽象。编译器会将Concepts约束转换为SFINAE条件，但对程序员隐藏了复杂性。



### 5. 高级模板元编程技术与应用
#### 5.1. 类型萃取（Type Traits）
类型萃取是模板元编程的基础工具，用于在编译期获取和转换类型信息：

```cpp
// 自定义类型萃取示例
template `<typename T>`
struct remove_const {
    using type = T;
};

template `<typename T>`
struct `remove_const`<const T>` {
    using type = T;
};

template `<typename T>`
using remove_const_t = typename `remove_const`<T>`::type;
```

#### 5.2. 译期计算
模板元编程可以在编译期执行计算，生成常量表达式：

```cpp
// 编译期阶乘计算
template `<unsigned N>`
struct Factorial {
    static constexpr unsigned value = N * `Factorial`<N-1>`::value;
};

template <>
struct `Factorial`<0>` {
    static constexpr unsigned value = 1;
};

constexpr unsigned fact5 = `Factorial`<5>`::value; // 编译期计算5!
```

#### 5.3. 策略模式与政策类
模板可以用来实现编译期策略模式，通过模板参数注入不同的行为：

```cpp
// 分配器策略
template `<typename T>`
class StandardAllocator {
    // 标准分配实现
};

template `<typename T>`
class PoolAllocator {
    // 池分配实现
};

// 使用策略的容器
template `<typename T, template <typename>` class AllocPolicy = StandardAllocator>
class Container {
    `AllocPolicy`<T>` allocator;
    // 容器实现
};

// 使用不同策略
`Container`<int>` c1; // 使用标准分配器
`Container`<int, PoolAllocator>` c2; // 使用池分配器
```

#### 5.4. 表达式模板
表达式模板是一种高级技术，用于捕获和优化复杂表达式的求值：

```cpp
// 向量表达式模板示例
template `<typename E>`
class VecExpression {
public:
    // 获取表达式在位置i的值
    double operator[](size_t i) const {
        return `static_cast`<const E&>`(*this)[i];
    }
    
    // 获取表达式的大小
    size_t size() const {
        return `static_cast`<const E&>`(*this).size();
    }
    
    // 转换为实际表达式类型
    const E& derived() const {
        return `static_cast`<const E&>`(*this);
    }
};

// 实际向量类
template `<typename T>`
class Vector : public `VecExpression`<`Vector<T>`> {
    ``std::`vector`<T>` data;
    
public:
    // 构造函数等...
    
    // 从任何向量表达式构造
    template `<typename E>`
    Vector(const `VecExpression`<E>`& expr) {
        data.resize(expr.size());
        for (size_t i = 0; i < expr.size(); ++i) {
            data[i] = expr[i];
        }
    }
    
    // 访问操作符
    T operator[](size_t i) const {
        return data[i];
    }
    
    size_t size() const {
        return data.size();
    }
};

// 向量加法表达式
template `<typename E1, typename E2>`
class VecSum : public `VecExpression`<`VecSum<E1, E2>`> {
    const E1& _u;
    const E2& _v;
    
public:
    VecSum(const E1& u, const E2& v) : _u(u), _v(v) {}
    
    double operator[](size_t i) const {
        return _u[i] + _v[i];
    }
    
    size_t size() const {
        return _u.size();
    }
};

// 加法运算符
template `<typename E1, typename E2>`
`VecSum`<E1, E2>` operator+(const `VecExpression`<E1>`& u, const `VecExpression`<E2>`& v) {
    return `VecSum`<E1, E2>`(u.derived(), v.derived());
}
```

这种技术允许编写如`v = a + b + c`的表达式，而不会创建临时向量对象，提高了性能。

