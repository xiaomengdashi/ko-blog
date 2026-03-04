---
sidebar_position: 2
---


本文档旨在介绍**C++11**最核心的新特性，也是整个现代C++的基石，让学完C++基础的人快速入门C++11标准。
包括：
1. **auto** - 让编译器猜类型，代码更简洁
2. **默认函数控制** - 精确控制类的行为
3. **列表初始化** - 统一的{}初始化语法
4. **委托构造** - 构造函数之间可以互相调用
5. **范围for循环** - 遍历容器更简单
6. **emplace系列** - 原地构造，效率更高
7. **可变参数模板** - 处理任意数量参数的魔法  (语法理解起来比较困难)
8. **移动语义** - 搬家代替复制，性能更好  **(重点)**
9. **lambda** - 随手写个函数 **(重点)**
10. **std::function** - 万能函数包装器  **(重点)**
11. **智能指针** - 自动管理内存的好帮手  **(重点)**

....(并发支持部分，在并发编程系列，包含了线程，线程同步，异步操作和原子操作)


## 8. 移动语义

移动语义是C++11引入的重要特性，包括右值引用、移动构造函数和移动赋值运算符。它允许资源从临时对象"移动"到其他对象，而不是进行昂贵的拷贝操作。这个机制基于值类别的概念：左值（有名字、可取地址）和右值（临时对象、字面量）。

就像搬家一样，以前是把所有东西复制一份到新地方（拷贝），现在可以直接把东西搬过去（移动），既快又省力。特别是对于大对象，移动比拷贝效率高得多。

### 左值和右值的区分

**左值（Lvalue）**：
- 有名字的变量，可以取地址
- 在赋值表达式的左边
- 生命周期较长，可以被多次引用
- 例子：变量名、数组元素、解引用的指针

**右值（Rvalue）**：
- 临时对象、字面量、表达式的结果
- 通常在赋值表达式的右边
- 生命周期短暂，即将被销毁
- 例子：字面量（42, "hello"）、函数返回值、算术表达式结果

```cpp
int x = 10;        // x是左值，10是右值
int y = x + 5;     // y是左值，x+5是右值
int&& r = 20;      // r是左值（有名字），20是右值
```

### 1. 右值引用
右值引用是C++11引入的新特性，使用 && 语法声明，专门用于绑定到右值。
语法特点 ：
- 使用 T&& 声明右值引用
- 只能绑定到右值（临时对象、字面量等）
- 延长临时对象的生命周期
- 为移动语义提供基础支持

```cpp
// 右值引用的基本用法
int&& rref1 = 42;           // 绑定到字面量
int&& rref2 = getValue();   // 绑定到函数返回的临时对象
int&& rref3 = x + y;        // 绑定到表达式结果

// 错误用法：不能绑定到左值
int x = 10;
int&& rref4 = x;            // 编译错误！

// 但可以通过std::move转换
int&& rref5 = std::move(x); // 正确
```

**引用折叠规则 ：**
1. T& & 折叠为 T& (左值引用的左值引用 → 左值引用)
2. T& && 折叠为 T& (右值引用的左值引用 → 左值引用)
3. 3.T&& & 折叠为 T& (左值引用的右值引用 → 左值引用)
4. T&& && 折叠为 T&& (右值引用的右值引用 → 右值引用)

**简单记忆： 只有右值引用的右值引用才会折叠为右值引用，其他情况都会折叠为左值引用 。**
### 2.std::move()函数

`std::move()`是C++11提供的工具函数，用于将左值转换为右值引用，从而启用移动语义。

**核心特点**：
- **本质**：等效于`static_cast<T&&>(value)`的类型转换
- **推荐使用**：比直接类型转换更能表达"移动"的语义意图
- **不移动任何东西**：只是类型转换，真正的移动由移动构造函数/赋值运算符完成
- **使用后状态**：原对象变为"已移动"状态，应避免继续使用

**语法形式**：
```cpp
std::move(lvalue)  // 将左值转换为右值引用
```

**使用时机**：
- 当你确定不再需要某个对象的值时
- 想要触发移动构造函数或移动赋值运算符时
- 在函数返回时避免不必要的拷贝


### 3. 移动构造/赋值函数

**移动构造函数签名**：
```cpp
ClassName(ClassName&& other) noexcept;
```

**移动赋值运算符签名**：
```cpp
ClassName& operator=(ClassName&& other) noexcept;
```

**作用**：
- **移动构造函数**：用右值对象的资源来构造新对象（**这个逻辑是需要手动实现的，默认情况下代码什么都不会做**），避免昂贵的深拷贝
- **移动赋值运算符**：将右值对象的资源转移给当前对象，释放当前对象原有资源

**调用时机**：
- 函数返回临时对象时
- 使用`std::move()`显式转换左值为右值时


```cpp
#include <iostream>

class MyClass {
public:
  MyClass() { std::cout << "Constructor called" << std::endl; }
  MyClass(MyClass &&) { std::cout << "Move constructor called" << std::endl; }
  ~MyClass() { std::cout << "Destructor called" << std::endl; }
};

int main() {
  MyClass my_class;
  MyClass my_class_move(std::move(my_class));
  return 0;
}
```

### 4. 完美转发

**语法模板**：
```cpp
template<typename T>
void function_name(T&& param) {
    target_function(std::forward<T>(param));
}
```

**参数含义**：
- **T&&**：万能引用（转发引用），可以绑定左值或右值
- **T**：模板参数，通过引用折叠规则推导实际类型
- **`std::forward<T>(param)`**：根据T的类型保持参数的原始值类别
	  - 如果T是左值引用类型，转发为左值
	  - 如果T是非引用类型，转发为右值
	  - **param**：要转发的参数，在函数内部总是左值（有名字）


``` cpp
#include <iostream>
class MyClass {};

template <typename T> void func(T &t) { std::cout << "左值" << std::endl; }
template <typename T> void func(T &&t) { std::cout << "右值" << std::endl; }

template <typename T> void test(T &&t) {
  // func(t);       //普通传参
  func(std::forward<T>(t)); // 使用完美转发传参
}

int main() {
  MyClass myClass;
  test(myClass);
  test(std::move(myClass));
  return 0;
}
```



###  综合代码示例

```cpp
#include <iostream>
#include <string>
class MyString {
private:
  char *data;
  size_t size;

public:
  // 普通构造函数
  MyString(const char *str = "") {
    size = strlen(str);
    data = new char[size + 1];
    strcpy(data, str);
    std::cout << "Construct: " << data << std::endl;
  }

  // 拷贝构造函数
  MyString(const MyString &other) : size(other.size) {
    data = new char[size + 1];
    strcpy(data, other.data);
    std::cout << "Copy: " << data << std::endl;
  }

  // 移动构造函数
  MyString(MyString &&other) noexcept : data(other.data), size(other.size) {
    other.data = nullptr; // 将源对象置为安全状态
    other.size = 0;
    std::cout << "Move: " << data << std::endl;
  }

  // 移动赋值运算符
  MyString &operator=(MyString &&other) noexcept {
    if (this != &other) {
      delete[] data;     // 释放当前资源
      data = other.data; // 转移资源
      size = other.size;
      other.data = nullptr; // 将源对象置为安全状态
      other.size = 0;
      std::cout << "Move assign: " << data << std::endl;
    }
    return *this;
  }

  // 析构函数
  ~MyString() { delete[] data; }

  // 获取字符串内容
  const char *c_str() const { return data ? data : ""; }
};

// 目标函数：处理左值
void process(const MyString &str) {
  std::cout << "Process lvalue: " << str.c_str() << std::endl;
}

// 目标函数：处理右值
void process(MyString &&str) {
  std::cout << "Process rvalue: " << str.c_str() << std::endl;
}

// Demo1: 右值引用基础演示
void demo1() {
  std::cout << "\n=== Demo1: Rvalue Reference ===\n";

  int x = 10;          // x是左值
  int &lref = x;       // 左值引用绑定到左值
  int &&rref1 = 20;    // 右值引用绑定到字面量
  int &&rref2 = x + 5; // 右值引用绑定到表达式结果

  std::cout << "lvalue x: " << x << std::endl;
  std::cout << "rvalue ref: " << rref1 << std::endl;
}

// Demo2: std::move函数演示
void demo2() {
  std::cout << "\n=== Demo2: std::move ===\n";

  MyString str1("Hello");
  MyString str2("World");

  MyString str3 = str1;            // 触发拷贝构造
  MyString str4 = std::move(str2); // 触发移动构造

  std::cout << "After move - str2: " << str2.c_str() << std::endl;
}

// Demo3: 移动构造和移动赋值演示
void demo3() {
  std::cout << "\n=== Demo3: Move Operations ===\n";

  // 返回临时对象的函数
  auto createString = []() -> MyString { return MyString("Temp"); };

  MyString str1 = createString(); // 函数返回值触发移动构造

  MyString str2("Source");
  MyString str3 = std::move(str2); // 显式移动构造

  MyString str4("Target");
  str4 = createString(); // 函数返回值触发移动赋值
}

// Demo4: 完美转发演示（简化版）
template <typename T> void perfect_forward(T &&arg) {
  // 使用std::forward保持参数的原始值类别
  process(std::forward<T>(arg));
}

void demo4() {
  std::cout << "\n=== Demo4: Perfect Forwarding ===\n";

  MyString str("Test");

  std::cout << "Forward lvalue:\n";
  perfect_forward(str); // 传递左值，调用process(const MyString&)

  std::cout << "Forward rvalue:\n";
  perfect_forward(MyString("Temp")); // 传递右值，调用process(MyString&&)

  std::cout << "Forward moved lvalue:\n";
  perfect_forward(std::move(str)); // 将左值转换为右值，调用process(MyString&&)
}

int main() {
  demo1(); // 右值引用基础
  demo2(); // std::move演示
  demo3(); // 移动操作演示
  demo4(); // 完美转发演示
  return 0;
}
```



## 9. Lambda 表达式

Lambda表达式是C++11引入的匿名函数机制，允许在需要函数对象的地方直接定义函数。Lambda表达式让函数式编程变得简洁。

就像随手写个小纸条记录要做的事，不用专门写个函数。特别适合那些简单的、一次性的操作，比如排序时指定比较规则，或者遍历时做点小处理。

```cpp
  auto add = [](int a, int b) { return a + b; };
  add(1, 2);

  int a = 1, b = 2;
  auto add = [a, b]() { return a + b; };
  add();
```


### lambda表达式的本质
**lambda表达式本质上是编译器生成的匿名函数对象（仿函数）**

## 编译器转换机制**
以上代码编译器处理后的代码
```cpp
int main()
{
    
  class __lambda_5_14
  {
    public: 
    inline /*constexpr */ int operator()(int a, int b) const
    {
      return a + b;
    }
    
    using retType_5_14 = int (*)(int, int);
    inline constexpr operator retType_5_14 () const noexcept
    {
      return __invoke;
    };
    
    private: 
    static inline /*constexpr */ int __invoke(int a, int b)
    {
      return __lambda_5_14{}.operator()(a, b);
    }
    
    
  };
  
  __lambda_5_14 add = __lambda_5_14{};
  add.operator()(1, 2);
  return 0;
}
```

### 语法模板
```cpp
[capture_list](parameter_list) -> return_type { function_body }
[capture_list](parameter_list) { function_body }  // 自动推导返回类型
```

### 捕获规则详解

#### 捕获列表语法
```cpp
[]              // 不捕获任何变量
[var]           // 按值捕获var
[&var]          // 按引用捕获var
[=]             // 按值捕获所有外部变量
[&]             // 按引用捕获所有外部变量
[=, &var]       // 按值捕获所有变量，但var按引用捕获
[&, var]        // 按引用捕获所有变量，但var按值捕获
[var1, var2]    // 按值捕获指定变量
[&var1, &var2]  // 按引用捕获指定变量
[=, &var1, &var2] // 混合捕获
```

#### 捕获方式说明

**按值捕获 `[var]`**
- 在Lambda创建时复制变量的值
- Lambda内部修改不影响外部变量
- 默认情况下捕获的变量是const的
- 使用`mutable`关键字可以修改副本

**按引用捕获 `[&var]`**
- 直接引用外部变量
- Lambda内部修改会影响外部变量
- 需要确保Lambda执行时变量仍然有效
- 保持变量原有的const性质

**全局捕获**
- `[=]`: 按值捕获Lambda体内使用的所有外部变量
- `[&]`: 按引用捕获Lambda体内使用的所有外部变量
- 只捕获在Lambda体内实际使用的变量

**混合捕获**
- 可以组合不同的捕获方式
- 默认捕获必须放在前面
- 具体变量捕获会覆盖默认捕获方式

### 作用域和可见性规则

#### 1. 捕获范围
```cpp
void function() {
    int local_var = 10;        // 可以捕获
    static int static_var = 20; // 可以直接访问，无需捕获
    
    auto lambda = [local_var]() {
        // 可以使用local_var
        // 可以直接使用static_var，无需捕获
        return local_var + static_var;
    };
}
```

#### 2. 类成员访问
```cpp
class MyClass {
private:
    int member_var = 100;
    
public:
    void method() {
        // 捕获this指针来访问成员变量
        auto lambda1 = [this]() {
            return member_var; // 通过this访问
        };
        
        // C++11中不支持按值捕获this，只能按引用
        auto lambda2 = [=]() {
            // 错误：不能按值捕获this
            // return member_var;
        };
        
        // 正确的方式：显式捕获成员变量
        auto lambda3 = [member_var = this->member_var]() {
            return member_var; // 这是C++14的语法，C++11不支持
        };
        
        // C++11的解决方案：先复制到局部变量
        int local_copy = member_var;
        auto lambda4 = [local_copy]() {
            return local_copy;
        };
    }
};
```

#### 3. 嵌套作用域
```cpp
void outer_function() {
    int outer_var = 1;
    
    {
        int inner_var = 2;
        
        auto lambda = [outer_var, inner_var]() {
            // 可以访问外层和内层变量
            return outer_var + inner_var;
        };
        
        // lambda在这里仍然有效
    }
    // inner_var在这里已经销毁，但lambda中的副本仍然有效
}
```

### 捕获规则要点

#### 1. 可捕获的变量类型
- **局部变量**：需要显式捕获
- **静态变量**：可以直接访问，无需捕获
- **全局变量**：可以直接访问，无需捕获
- **类成员变量**：需要捕获`this`指针
#### 2. 常见使用模式
- `[]`: 纯函数，不依赖外部状态
- `[=]`: 需要使用多个外部变量，且不修改它们
- `[&]`: 需要修改多个外部变量
- `[var]`: 只需要特定变量的值
- `[&var]`: 只需要修改特定变量
- `[this]`: 访问类成员变量和方法

### 详细代码示例

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

class Counter {
private:
    int count = 0;
    
public:
    void demonstrate_capture() {
        std::cout << "=== 类成员捕获示例 ===" << std::endl;
        
        // 捕获this来访问成员
        auto increment = [this]() {
            count++;
            std::cout << "Count: " << count << std::endl;
        };
        
        increment();
        increment();
        std::cout << "Final count: " << count << std::endl;
    }
};

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    int factor = 2;
    int threshold = 5;
    
    std::cout << "=== 基本捕获示例 ===" << std::endl;
    
    // 1. 无捕获
    auto add = [](int a, int b) { return a + b; };
    std::cout << "add(3, 4) = " << add(3, 4) << std::endl;
    
    // 2. 按值捕获
    std::cout << "\n=== 按值捕获 ===" << std::endl;
    auto multiply_by_factor = [factor](int n) { 
        // factor是const的，不能修改
        return n * factor; 
    };
    std::cout << "5 * factor = " << multiply_by_factor(5) << std::endl;
    
    // 3. 按引用捕获
    std::cout << "\n=== 按引用捕获 ===" << std::endl;
    auto increment_factor = [&factor]() { 
        factor++; // 可以修改外部变量
        std::cout << "factor incremented to: " << factor << std::endl;
    };
    increment_factor();
    std::cout << "External factor: " << factor << std::endl;
    
    // 4. mutable关键字
    std::cout << "\n=== mutable关键字 ===" << std::endl;
    int counter = 0;
    auto mutable_lambda = [counter](int n) mutable {
        counter++; // mutable允许修改按值捕获的变量
        std::cout << "Internal counter: " << counter << std::endl;
        return n + counter;
    };
    std::cout << "Result: " << mutable_lambda(10) << std::endl;
    std::cout << "Result: " << mutable_lambda(10) << std::endl;
    std::cout << "External counter: " << counter << std::endl; // 仍为0
    
    // 5. 全局捕获
    std::cout << "\n=== 全局捕获 ===" << std::endl;
    // 按值捕获所有使用的外部变量
    auto filter_and_multiply = [=](int n) {
        return n > threshold ? n * factor : n;
    };
    
    std::vector<int> result1;
    std::transform(numbers.begin(), numbers.end(), 
                   std::back_inserter(result1), filter_and_multiply);
    
    std::cout << "Filtered and multiplied: ";
    for (auto n : result1) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    // 6. 混合捕获
    std::cout << "\n=== 混合捕获 ===" << std::endl;
    int base = 10;
    // 默认按值捕获，但factor按引用捕获
    auto mixed_capture = [=, &factor](int n) {
        factor += 1; // 修改外部factor
        return n + base + threshold; // 使用按值捕获的base和threshold
    };
    
    std::cout << "Before: factor = " << factor << std::endl;
    std::cout << "Result: " << mixed_capture(5) << std::endl;
    std::cout << "After: factor = " << factor << std::endl;
    
    // 7. 作用域和生命周期
    std::cout << "\n=== 作用域示例 ===" << std::endl;
    std::function<int()> lambda_func;
    {
        int local_var = 42;
        // 按值捕获，即使local_var离开作用域，lambda仍然有效
        lambda_func = [local_var]() {
            return local_var * 2;
        };
    } // local_var在这里销毁
    
    std::cout << "Lambda result: " << lambda_func() << std::endl; // 仍然有效
    
    // 8. 静态变量和全局变量
    std::cout << "\n=== 静态变量访问 ===" << std::endl;
    static int static_var = 100;
    auto access_static = []() {
        // 静态变量可以直接访问，无需捕获
        static_var += 10;
        return static_var;
    };
    std::cout << "Static var: " << access_static() << std::endl;
    
    // 9. 类成员示例
    std::cout << "\n=== 类成员示例 ===" << std::endl;
    Counter counter_obj;
    counter_obj.demonstrate_capture();
    
    return 0;
}
```


## 10. std::function 

### 可调用对象概念

在C++中，**可调用对象（Callable Object）**是指可以使用函数调用操作符`()`进行调用的对象。可调用对象包括：
- 普通函数
- 函数指针
- 成员函数指针
- Lambda表达式
- 函数对象（重载了`operator()`的类）
- `std::bind`的返回值

### std::function
`std::function`是头文件functional里通用的函数包装器，可以存储、复制和调用任何可调用对象。

```cpp
std::function<return_type(param_types...)> func_obj;
```

#### 与C函数指针的关系
C++的`std::function`在概念上与C语言的函数指针非常相似，都是用来存储和调用函数的工具。但`std::function`更加强大和安全：
- **C函数指针**：只能指向具有相同签名的函数，类型安全性较弱
- **std::function**：可以包装任何可调用对象，提供类型安全的统一接口，是现代C++中函数指针的理想替代品


### std::bind
`std::bind`是函数绑定工具，可以绑定函数的部分参数。这些工具基于类型擦除技术，提供了统一的函数对象接口。`std::bind`就像给遥控器设置快捷键，把复杂的操作简化成一键操作。不过现在大家更喜欢用lambda，更简单直接。

```cpp

auto bound_func = std::bind(function, arg1, std::placeholders::_1, ...);
```

### 占位符的作用和使用方法

`std::bind`中的占位符（`std::placeholders::_1`, `_2`, `_3`...）用于指定绑定函数调用时参数的位置：

- `_1`表示绑定函数的第一个参数
- `_2`表示绑定函数的第二个参数
- 以此类推...
- 占位符可以改变参数顺序，也可以重复使用同一个占位符
- 没有占位符的位置会被具体值绑定

**使用时机**：当你需要固定某些参数，只保留部分参数可变时使用占位符。

### 代码示例

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <algorithm>

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    int multiply(int a, int b, int c) { return a * b * c; }
    
    // 类内调用类成员函数示例
    void processWithCallback(std::function<void(int)> callback) {
        for (int i = 1; i <= 3; ++i) {
            callback(i * 10);
        }
    }
};

int add(int a, int b) { return a + b; }
int multiply(int a, int b, int c) { return a * b * c; }

// 简单的回调函数
void printResult(int value) {
    std::cout << "回调函数收到值: " << value << std::endl;
}

int main() {
    // 1. std::function 包装不同类型的可调用对象
    std::function<int(int, int)> func;
    
    func = add;  // 包装普通函数
    std::cout << "普通函数: " << func(3, 4) << std::endl;
    
    func = [](int a, int b) { return a * b; };  // 包装lambda
    std::cout << "Lambda: " << func(3, 4) << std::endl;
    
    // 2. std::bind 基本用法
    auto bound = std::bind(multiply, 2, std::placeholders::_1, 3);
    std::cout << "bind基本用法: " << bound(4) << std::endl; // 2*4*3=24
    
    // 3. 简单的回调函数示例
    std::function<void(int)> callback = printResult;
    std::cout << "\n=== 回调函数示例 ===" << std::endl;
    callback(42);
    
    // 4. 类外调用类成员函数
    Calculator calc;
    std::cout << "\n=== 类外调用类成员函数 ===" << std::endl;
    
    // 绑定成员函数，需要传入对象实例
    auto memberFunc = std::bind(&Calculator::add, &calc, std::placeholders::_1, std::placeholders::_2);
    std::cout << "类成员函数add: " << memberFunc(5, 6) << std::endl;
    
    // 使用std::function包装成员函数
    std::function<int(Calculator*, int, int)> memberAdd = &Calculator::add;
    std::cout << "function包装成员函数: " << memberAdd(&calc, 7, 8) << std::endl;
    
    // 5. 类内调用类成员函数示例
    std::cout << "\n=== 类内调用类成员函数 ===" << std::endl;
    calc.processWithCallback([](int value) {
        std::cout << "类内回调处理: " << value << std::endl;
    });
    
    // 6. 结合lambda表达式的高级示例
    std::cout << "\n=== 结合Lambda表达式 ===" << std::endl;
    
    // lambda作为回调
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::function<bool(int)> predicate = [](int n) { return n % 2 == 0; };
    
    std::cout << "偶数: ";
    for (int n : numbers) {
        if (predicate(n)) {
            std::cout << n << " ";
        }
    }
    std::cout << std::endl;
    
    // bind结合lambda
    auto complexBind = std::bind([](int base, int multiplier, int value) {
        return base + multiplier * value;
    }, 10, std::placeholders::_1, std::placeholders::_2);
    
    std::cout << "复杂bind+lambda: " << complexBind(3, 4) << std::endl; // 10 + 3*4 = 22
    
    // 7. 占位符顺序和重复使用示例
    std::cout << "\n=== 占位符高级用法 ===" << std::endl;
    
    auto reorderBind = std::bind(multiply, std::placeholders::_2, std::placeholders::_1, 5);
    std::cout << "参数重排序: " << reorderBind(2, 3) << std::endl; // 3*2*5 = 30
    
    auto repeatBind = std::bind(add, std::placeholders::_1, std::placeholders::_1);
    std::cout << "重复占位符: " << repeatBind(7) << std::endl; // 7+7 = 14
    
    return 0;
}
```




## 11. 三种智能指针

智能指针是C++11引入的自动内存管理工具，在头文件`<memory>`中提供，基于RAII原则。手动内存管理容易导致内存泄漏、悬空指针等问题，智能指针通过自动化资源管理，消除了这些常见错误。

就像雇了三种不同的管家来管理你的财产。`unique_ptr`是专属管家，只为你一个人服务；`shared_ptr`是共享管家，可以为多个人服务，人走茶凉时自动清理；`weak_ptr`是临时工，只是看看情况，不负责管理。

### 三种智能指针

#### unique_ptr（独占智能指针）
- **独占所有权**：同一时刻只能有一个unique_ptr拥有对象
- **不可拷贝**：只能通过移动语义转移所有权
- **零开销**：没有额外的内存和性能开销
- **自动释放**：离开作用域时自动删除所管理的对象
- **支持数组**：可以管理动态分配的数组

#### shared_ptr（共享智能指针）
- **共享所有权**：多个shared_ptr可以同时拥有同一个对象
- **引用计数**：内部维护引用计数，当计数为0时自动删除对象
- **可拷贝**：支持拷贝构造和拷贝赋值
- **控制块**：额外的内存开销用于存储引用计数和删除器

#### weak_ptr（弱引用智能指针）
- **不拥有对象**：不参与对象的生命周期管理
- **打破循环引用**：解决shared_ptr的循环引用问题
- **安全观察**：可以安全地观察对象是否还存在
- **需要提升**：通过lock()方法转换为shared_ptr才能访问对象
- **不影响引用计数**：不会增加shared_ptr的引用计数

### 语法模板

#### unique_ptr 语法模板
```cpp
#include<memory>

// 创建方式
std::unique_ptr<Type> ptr(new Type(args...));           // 直接构造
auto ptr = std::make_unique<Type>(args...);             // 自动推导
// 数组版本
std::unique_ptr<Type[]> arr(new Type[size]);            // 数组指针
// 基本操作
ptr.get()           // 获取原始指针
ptr.release()       // 释放所有权，返回原始指针
ptr.reset()         // 重置为空
ptr.reset(new_ptr)  // 重置为新指针
std::move(ptr)      // 转移所有权

// 判断和访问
if (ptr)            // 检查是否为空
ptr.operator bool() // 显式布尔转换
*ptr               // 解引用
ptr->member        // 成员访问
ptr[index]         // 数组访问（仅限数组版本）

```

#### shared_ptr 语法模板
```cpp
// 创建方式
std::shared_ptr<Type> ptr = std::make_shared<Type>(args...); // 推荐方式
std::shared_ptr<Type> ptr(new Type(args...));           // 直接构造
auto ptr = std::make_shared<Type>(args...);             // 自动推导

// 从unique_ptr转换
std::unique_ptr<Type> uptr = std::make_unique<Type>(args...);
std::shared_ptr<Type> sptr = std::move(uptr);

// 基本操作
ptr.get()           // 获取原始指针
ptr.reset()         // 重置为空
ptr.reset(new_ptr)  // 重置为新指针
ptr.swap(other)     // 交换两个shared_ptr

// 引用计数
ptr.use_count()     // 获取引用计数
ptr.unique()        // 是否唯一拥有（use_count() == 1）

// 判断和访问
if (ptr)            // 检查是否为空
ptr.operator bool() // 显式布尔转换
*ptr               // 解引用
ptr->member        // 成员访问
```

#### weak_ptr 语法模板
```cpp
// 从shared_ptr创建
std::shared_ptr<Type> sptr = std::make_shared<Type>(args...);
std::weak_ptr<Type> wptr = sptr;                        // 直接赋值
std::weak_ptr<Type> wptr(sptr);                         // 构造函数
auto wptr = std::weak_ptr<Type>(sptr);                  // 显式构造

// 从另一个weak_ptr创建
std::weak_ptr<Type> wptr2 = wptr;                       // 拷贝构造
std::weak_ptr<Type> wptr3(wptr);                        // 拷贝构造

// 基本操作
weak.lock()         // 尝试获取shared_ptr，失败返回空
weak.expired()      // 检查所指对象是否已被销毁
weak.reset()        // 重置为空
weak.swap(other)    // 交换两个weak_ptr

// 引用计数
weak.use_count()    // 获取shared_ptr的引用计数
```


### 详细代码示例

```cpp
#include <iostream>
#include <memory>
#include <vector>

class Resource {
public:
    Resource(int id) : id_(id) {
        std::cout << "Resource " << id_ << " created" << std::endl;
    }
    ~Resource() {
        std::cout << "Resource " << id_ << " destroyed" << std::endl;
    }
    void show() { std::cout << "Resource ID: " << id_ << std::endl; }
private:
    int id_;
};

int main() {
    // unique_ptr 示例
    std::cout << "=== unique_ptr 示例 ===" << std::endl;
    auto ptr1 = std::make_unique<Resource>(1);
    ptr1->show();
    std::cout << "ptr1.get(): " << ptr1.get() << std::endl;
    
    auto ptr2 = std::move(ptr1);  // 转移所有权
    std::cout << "After move - ptr1: " << (ptr1 ? "valid" : "null") << std::endl;
    std::cout << "After move - ptr2: " << (ptr2 ? "valid" : "null") << std::endl;
    
    // shared_ptr 示例
    std::cout << "\n=== shared_ptr 示例 ===" << std::endl;
    auto shared1 = std::make_shared<Resource>(2);
    std::cout << "shared1 use_count: " << shared1.use_count() << std::endl;
    
    {
        auto shared2 = shared1;  // 共享所有权
        std::cout << "After copy - use_count: " << shared1.use_count() << std::endl;

    }  // shared2 离开作用域
    
    std::cout << "After scope - use_count: " << shared1.use_count() << std::endl;
    
    // weak_ptr 示例
    std::cout << "\n=== weak_ptr 示例 ===" << std::endl;
    std::weak_ptr<Resource> weak = shared1;
    std::cout << "weak.expired(): " << (weak.expired() ? "true" : "false") << std::endl;
    std::cout << "weak.use_count(): " << weak.use_count() << std::endl;
    
    if (auto locked = weak.lock()) {
        std::cout << "Successfully locked weak_ptr" << std::endl;
        locked->show();
    }
    
    shared1.reset();  // 释放shared_ptr
    std::cout << "After reset - weak.expired(): " << (weak.expired() ? "true" : "false") << std::endl;
    
    if (auto locked = weak.lock()) {
        std::cout << "Still valid" << std::endl;
    } else {
        std::cout << "weak_ptr is expired" << std::endl;
    }
    
    return 0;
}
```




