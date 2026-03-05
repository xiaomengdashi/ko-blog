---
sidebar_position: 5
slug: /C++/现代C++特性/现代C++核心特性
---

本文档旨在介绍**C++11**最核心的新特性，也是整个现代C++的基石，让学完C++基础的人快速入门C++11标准。  
包括：

1. **auto** - 让编译器猜类型，代码更简洁
2. **默认函数控制** - 精确控制类的行为
3. **列表初始化** - 统一的{}初始化语法
4. **委托构造** - 构造函数之间可以互相调用
5. **移动语义** - 搬家代替复制，性能更好
6. **范围for** - 遍历容器更简单
7. **emplace系列** - 原地构造，效率更高
8. **lambda** - 随手写个小函数
9. **std::function/std::bind** - 万能函数包装器
10. **智能指针** - 自动管理内存的好帮手
11. **可变参数模板** - 处理任意数量参数的魔法  
....(并发支持部分，在并发编程系列，包含了线程，线程同步，异步操作和原子操作)

## 1. auto 关键字 - 自动类型推导
auto关键字是C++11引入的类型推导机制，允许编译器根据初始化表达式自动推断变量的类型。在C++98中，复杂的模板类型声明往往冗长且容易出错，auto关键字解决了这个问题，让代码更简洁、更易维护。  
就像智能助手一样，auto让编译器自动猜出变量的类型，你不用再写那些又长又复杂的类型名了。特别是STL容器的迭代器，以前要写一大串，现在一个auto就搞定。  
**注意不要滥用auto，简单明确的类型还是需要显示指出，auto通常用于泛型特化参数返回值或者类型过于冗长。**

### 1.1. 语法模板
```cpp
auto variable_name = expression;
```

### 1.2. 代码示例
```cpp
#include `<iostream>`
#include `<vector>`
#include `<map>`

int main() {
    auto x = 42;        // int
    auto y = 3.14;      // double
    
    ``std::`vector`<int>` vec = {1, 2, 3};
    auto it = vec.begin();  // 替代 ``std::`vector`<int>`::iterator
    
    ``std::`map`<std::string, int>` m;
    auto pair = std::make_pair("key", 100);
    
    return 0;
}
```

## 2. 默认函数控制 (= default / = delete)
默认函数控制是C++11提供的显式控制编译器生成特殊成员函数的机制。在C++98中，编译器会隐式生成某些特殊成员函数，但程序员无法明确表达意图。这个特性让程序员能够精确控制类的接口和行为。  
就像给类的特殊函数贴标签，`= default`是说"编译器你帮我生成默认版本"，`= delete`是说"这个函数我不要，谁都不能用"。这样你就能精确控制类的行为，想要什么有什么，不想要什么就禁掉。

### 2.1. 语法模板
```cpp
return_type function_name(parameters) = default;
return_type function_name(parameters) = delete;
```

### 2.2. 代码示例
```cpp
class MyClass {
public:
    MyClass() = default;                    // 要求默认构造函数
    MyClass(int value) : data(value) {}
    
    MyClass(const MyClass&) = delete;      // 禁止拷贝
    MyClass& operator=(const MyClass&) = delete;
    
private:
    int data = 0;
};

int main() {
    MyClass obj1;           // OK
    MyClass obj2(42);       // OK
    // MyClass obj3 = obj2; // 错误：拷贝被禁止
    return 0;
}
```

## 3. 列表初始化 (Initializer Lists)
列表初始化是C++11引入的统一初始化语法，使用花括号{}进行初始化。它基于`std::initializer_list`模板类，提供了类型安全的初始化方式，并且能够防止窄化转换，统一了C++中多种初始化语法。  
用花括号{}来初始化任何东西，就像填表格一样简单直观。不管是数组、容器还是自定义类，都用同样的语法，而且还能防止数据丢失的转换错误。

### 3.1. 语法模板
```cpp
Type variable{value1, value2, ...};
container_type container{element1, element2, ...};
```

### 3.2. 代码示例
```cpp
#include `<iostream>`
#include `<vector>`
#include `<map>`

struct Point { int x, y; };

int main() {
    // 基本类型和容器
    int x{42};
    ``std::`vector`<int>` vec = {1, 2, 3, 4, 5};
    ``std::`map`<std::string, int>` m = {{"apple", 1}, {"banana", 2}};
    
    // 结构体
    Point p{10, 20};
    
    // 防止窄化转换
    // int bad{3.14}; // 编译错误！
    
    return 0;
}
```

## 4. 委托构造函数
委托构造函数允许一个构造函数调用同一个类的另一个构造函数。在C++98中，多个构造函数之间的代码重复是常见问题，委托构造函数提供了更直接的解决方案，让构造函数之间能够复用初始化逻辑。  
就像工厂流水线，一个构造函数可以调用另一个构造函数来帮忙干活，避免重复写相同的初始化代码。主构造函数负责核心工作，其他构造函数只需要"委托"给它就行了。

### 4.1. 语法模板
```cpp
ClassName(params1) : ClassName(params2) {
    // 额外的初始化代码
}
```

### 4.2. 代码示例
```cpp
#include `<iostream>`

class Rectangle {
public:
    // 主构造函数
    Rectangle(int w, int h) : width(w), height(h) {
        std::cout `<< "Rectangle: " << w << "x" << h << std::endl;
    }
    
    // 委托构造函数
    Rectangle() : Rectangle(0, 0) {}           // 默认
    Rectangle(int size) : Rectangle(size, size) {} // 正方形
    
private:
    int width, height;
};

int main() {
    Rectangle r1;        // 委托到 Rectangle(0, 0)
    Rectangle r2(5);     // 委托到 Rectangle(5, 5)
    Rectangle r3(3, 4);  // 直接调用主构造函数
    return 0;
}
```



## 5. 移动语义
移动语义是C++11引入的重要特性，包括右值引用、移动构造函数和移动赋值运算符。它允许资源从临时对象"移动"到其他对象，而不是进行昂贵的拷贝操作。这个机制基于值类别的概念：左值（有名字、可取地址）和右值（临时对象、字面量）。

就像搬家一样，以前是把所有东西复制一份到新地方（拷贝），现在可以直接把东西搬过去（移动），既快又省力。特别是对于大对象，移动比拷贝效率高得多。

### 5.1. 左值和右值的区分
**左值（Lvalue）**：

+ 有名字的变量，可以取地址
+ 在赋值表达式的左边
+ 生命周期较长，可以被多次引用
+ 例子：变量名、数组元素、解引用的指针

**右值（Rvalue）**：

+ 临时对象、字面量、表达式的结果
+ 通常在赋值表达式的右边
+ 生命周期短暂，即将被销毁
+ 例子：字面量（42, "hello"）、函数返回值、算术表达式结果

```cpp
int x = 10;        // x是左值，10是右值
int y = x + 5;     // y是左值，x+5是右值
int&& r = 20;      // r是左值（有名字），20是右值
```

### 5.2. std::move()函数详解
`std::move()`是C++11提供的工具函数，用于将左值转换为右值引用，从而启用移动语义。

**核心特点**：

+ **本质**：等效于`static_cast<T&&>`(value)`的类型转换
+ **推荐使用**：比直接类型转换更能表达"移动"的语义意图
+ **不移动任何东西**：只是类型转换，真正的移动由移动构造函数/赋值运算符完成
+ **使用后状态**：原对象变为"已移动"状态，应避免继续使用

**语法形式**：

```cpp
std::move(lvalue)  // 将左值转换为右值引用
```

**使用时机**：

+ 当你确定不再需要某个对象的值时
+ 想要触发移动构造函数或移动赋值运算符时
+ 在函数返回时避免不必要的拷贝

### 5.3. 语法模板
```cpp
Type&& rvalue_ref = std::move(lvalue);      // 右值引用
ClassName(ClassName&& other) noexcept;      // 移动构造
ClassName& operator=(ClassName&& other) noexcept; // 移动赋值
```

### 5.4. 代码示例
```cpp
#include `<iostream>`
#include `<string>`
#include `<utility>`
#include `<vector>`

class MyString {
public:
    MyString(const char* str = "") {
        size_ = strlen(str);
        data_ = new char[size_ + 1];
        strcpy(data_, str);
        std::cout `<< "Constructor: " << data_ << std::endl;
    }
    
    // 拷贝构造函数
    MyString(const MyString& other) {
        size_ = other.size_;
        data_ = new char[size_ + 1];
        strcpy(data_, other.data_);
        std::cout << "Copy Constructor: " << data_ << std::endl;
    }
    
    // 移动构造函数
    MyString(MyString&& other) noexcept {
        data_ = other.data_;        // 接管资源
        size_ = other.size_;
        other.data_ = nullptr;      // 重置源对象
        other.size_ = 0;
        std::cout << "Move Constructor" << std::endl;
    }
    
    // 移动赋值运算符
    MyString& operator=(MyString&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            size_ = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
            std::cout << "Move Assignment" << std::endl;
        }
        return *this;
    }
    
    ~MyString() { 
        delete[] data_; 
    }
    
    void print() const {
        if (data_) {
            std::cout << "String: " << data_ << std::endl;
        } else {
            std::cout << "String: (moved)" << std::endl;
        }
    }
    
private:
    char* data_;
    size_t size_;
};

// 演示函数返回值优化
MyString createString(const char* str) {
    return MyString(str);  // 返回临时对象（右值）
}

int main() {
    std::cout << "=== 左值和右值示例 ===" << std::endl;
    
    // 左值示例
    MyString str1("hello");     // str1是左值
    MyString str2 = str1;       // 拷贝构造（左值）
    
    std::cout << "\n=== std::move()使用示例 ===" << std::endl;
    
    // 使用std::move将左值转换为右值
    MyString str3 = std::move(str1);  // 移动构造
    str1.print();  // str1已被移动，处于未定义状态
    str3.print();  // str3获得了str1的资源
    
    std::cout << "\n=== 移动赋值示例 ===" << std::endl;
    MyString str4("world");
    str4 = std::move(str2);     // 移动赋值
    str2.print();  // str2已被移动
    str4.print();  // str4获得了str2的资源
    
    std::cout << "\n=== 右值引用绑定 ===" << std::endl;
    
    // 右值引用可以绑定到右值
    MyString&& rref1 = MyString("temporary");  // 绑定临时对象
    MyString&& rref2 = createString("function"); // 绑定函数返回值
    MyString&& rref3 = std::move(str4);        // 绑定std::move结果
    
    std::cout << "\n=== 容器中的移动语义 ===" << std::endl;
    
`std::vector<MyString>`vec;
    MyString str5("vector_element");
    
    vec.push_back(str5);              // 拷贝
    vec.push_back(std::move(str5));   // 移动
    vec.emplace_back("emplace");      // 直接构造
    
    std::cout `<< "\n=== std::move vs 类型转换对比 ===" << std::endl;
    
    MyString str6("compare");
    
    // 两种方式等效，但std::move更清晰
    MyString str7 = std::move(str6);                    // 推荐
    MyString str8 = `static_cast<MyString&&>`(str7);      // 不推荐
    
    return 0;
}
```



## 6. 基于范围的for循环 (Range-based for)
基于范围的for循环是C++11引入的语法糖，提供了遍历容器和数组的简洁方式。传统的for循环在遍历容器时代码冗长且容易出错，范围for循环提供了更安全、更简洁的遍历方式。

就像说"把这个盒子里的每个东西都拿出来看看"，不用关心盒子有多大、东西放在哪个位置，自动帮你一个个遍历。比传统的for循环简单多了，也不容易出错。

### 6.1. 语法模板
```cpp
for (auto element : container) { /* 按值访问 */ }
for (auto& element : container) { /* 按引用访问，可修改 */ }
for (const auto& element : container) { /* 按const引用访问 */ }
```

### 6.2. 代码示例
```cpp
#include `<iostream>`
#include `<vector>`

int main() {
    ``std::`vector`<int>` numbers = {1, 2, 3, 4, 5};
    
    // 只读遍历
    for (const auto& num : numbers) {
        std::cout `<< num << " ";
    }
    std::cout << std::endl;
    
    // 修改元素
    for (auto& num : numbers) {
        num *= 2;
    }
    
    // 遍历数组
    int arr[] = {10, 20, 30};
    for (const auto& item : arr) {
        std::cout << item << " ";
    }
    
    return 0;
}
```

## 7. STL emplace系列接口 - 原地构造
emplace系列函数是C++11为STL容器引入的原地构造接口。与传统的`push_back`、`insert`等函数不同，emplace函数直接在容器的内存位置构造对象，避免了临时对象的创建和拷贝/移动操作，提高了性能。  
就像在工厂里直接组装产品，而不是先在别的地方组装好再搬过来。`push_back`是"先造好再放进去"，`emplace_back`是"直接在容器里造"，省去了搬运的麻烦，效率更高。

### 7.1. 语法模板
```cpp
container.emplace_back(constructor_args...);
container.emplace(position, constructor_args...);
```

### 7.2. 代码示例
```cpp
#include <iostream>`
#include `<vector>`
#include `<string>`

struct Person {
    std::string name;
    int age;
    
    Person(const std::string& n, int a) : name(n), age(a) {
        std::cout `<< "Person created: " << name << std::endl;
    }
};

int main() {
`std::vector<Person>`people;
    
    // push_back: 先构造临时对象，再移动
    people.push_back(Person("Alice", 25));
    
    // emplace_back: 直接在容器内构造
    people.emplace_back("Bob", 30);
    
    return 0;
}
```

## 8. Lambda 表达式
Lambda表达式是C++11引入的匿名函数机制，允许在需要函数对象的地方直接定义函数。在C++98中，使用STL算法时经常需要定义函数对象或函数指针，代码冗长且不直观，Lambda表达式让函数式编程变得简洁。

就像随手写个小纸条记录要做的事，不用专门写个函数。特别适合那些简单的、一次性的操作，比如排序时指定比较规则，或者遍历时做点小处理。

### 8.1. 语法模板
```cpp
[capture_list](parameter_list) -> return_type { function_body }
[capture_list](parameter_list) { function_body }  // 自动推导返回类型
```

### 8.2. 捕获规则详解
#### 8.2.1. 捕获列表语法
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

#### 8.2.2. 捕获方式说明
**按值捕获 **`[var]`

+ 在Lambda创建时复制变量的值
+ Lambda内部修改不影响外部变量
+ 默认情况下捕获的变量是const的
+ 使用`mutable`关键字可以修改副本

**按引用捕获 **`[&var]`

+ 直接引用外部变量
+ Lambda内部修改会影响外部变量
+ 需要确保Lambda执行时变量仍然有效
+ 保持变量原有的const性质

**全局捕获**

+ `[=]`: 按值捕获Lambda体内使用的所有外部变量
+ `[&]`: 按引用捕获Lambda体内使用的所有外部变量
+ 只捕获在Lambda体内实际使用的变量

**混合捕获**

+ 可以组合不同的捕获方式
+ 默认捕获必须放在前面
+ 具体变量捕获会覆盖默认捕获方式

### 8.3. 作用域和可见性规则
#### 8.3.1. 捕获范围
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

#### 8.3.2. 类成员访问
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

#### 8.3.3. 嵌套作用域
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

### 8.4. 捕获规则要点
#### 8.4.1. 可捕获的变量类型
+ **局部变量**：需要显式捕获
+ **静态变量**：可以直接访问，无需捕获
+ **全局变量**：可以直接访问，无需捕获
+ **类成员变量**：需要捕获`this`指针

#### 8.4.2. 常见使用模式
+ `[]`: 纯函数，不依赖外部状态
+ `[=]`: 需要使用多个外部变量，且不修改它们
+ `[&]`: 需要修改多个外部变量
+ `[var]`: 只需要特定变量的值
+ `[&var]`: 只需要修改特定变量
+ `[this]`: 访问类成员变量和方法

### 8.5. 详细代码示例
```cpp
#include `<iostream>`
#include `<vector>`
#include `<algorithm>`
#include `<functional>`

class Counter {
private:
    int count = 0;
    
public:
    void demonstrate_capture() {
        std::cout `<< "=== 类成员捕获示例 ===" << std::endl;
        
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
`std::vector<int>`numbers = {5, 2, 8, 1, 9};
    int factor = 2;
    int threshold = 5;
    
    std::cout `<< "=== 基本捕获示例 ===" << std::endl;
    
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
        return n >` threshold ? n * factor : n;
    };
    
    ``std::`vector`<int>` result1;
    std::transform(numbers.begin(), numbers.end(), 
                   std::back_inserter(result1), filter_and_multiply);
    
    std::cout `<< "Filtered and multiplied: ";
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
`std::function<int()>`lambda_func;
    {
        int local_var = 42;
        // 按值捕获，即使local_var离开作用域，lambda仍然有效
        lambda_func = [local_var]() {
            return local_var * 2;
        };
    } // local_var在这里销毁
    
    std::cout `<< "Lambda result: " << lambda_func() << std::endl; // 仍然有效
    
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



## 9. std::function 和 std::bind
### 9.1. 可调用对象概念
在C++中，**可调用对象（Callable Object）**是指可以使用函数调用操作符`()`进行调用的对象。可调用对象包括：

+ 普通函数
+ 函数指针
+ 成员函数指针
+ Lambda表达式
+ 函数对象（重载了`operator()`的类）
+ `std::bind`的返回值

`std::function`是头文件functional里通用的函数包装器，可以存储、复制和调用任何可调用对象。`std::bind`是函数绑定工具，可以绑定函数的部分参数。这些工具基于类型擦除技术，提供了统一的函数对象接口。

`std::function`就像一个万能遥控器，可以控制各种不同的"设备"（函数、lambda、函数对象）。`std::bind`就像给遥控器设置快捷键，把复杂的操作简化成一键操作。不过现在大家更喜欢用lambda，更简单直接。

### 9.2. C函数指针的关系
C++的`std::function`在概念上与C语言的函数指针非常相似，都是用来存储和调用函数的工具。但`std::function`更加强大和安全：

+ **C函数指针**：只能指向具有相同签名的函数，类型安全性较弱
+ **std::function**：可以包装任何可调用对象，提供类型安全的统一接口，是现代C++中函数指针的理想替代品

### 9.3. 语法模板
```cpp
`std::function<return_type(param_types...)>`func_obj;

auto bound_func = std::bind(function, arg1, std::placeholders::_1, ...);
```

### 9.4. 占位符的作用和使用方法
`std::bind`中的占位符（`std::placeholders::_1`, `_2`, `_3`...）用于指定绑定函数调用时参数的位置：

+ `_1`表示绑定函数的第一个参数
+ `_2`表示绑定函数的第二个参数
+ 以此类推...
+ 占位符可以改变参数顺序，也可以重复使用同一个占位符
+ 没有占位符的位置会被具体值绑定

**使用时机**：当你需要固定某些参数，只保留部分参数可变时使用占位符。

### 9.5. 代码示例
```cpp
#include `<iostream>`
#include `<functional>`
#include `<vector>`
#include `<algorithm>`

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    int multiply(int a, int b, int c) { return a * b * c; }
    
    // 类内调用类成员函数示例
    void processWithCallback(``std::`function`<void(int)>` callback) {
        for (int i = 1; i <= 3; ++i) {
            callback(i * 10);
        }
    }
};

int add(int a, int b) { return a + b; }
int multiply(int a, int b, int c) { return a * b * c; }

// 简单的回调函数
void printResult(int value) {
    std::cout `<< "回调函数收到值: " << value << std::endl;
}

int main() {
    // 1. std::function 包装不同类型的可调用对象
`std::function<int(int, int)>`func;
    
    func = add;  // 包装普通函数
    std::cout `<< "普通函数: " << func(3, 4) << std::endl;
    
    func = [](int a, int b) { return a * b; };  // 包装lambda
    std::cout << "Lambda: " << func(3, 4) << std::endl;
    
    // 2. std::bind 基本用法
    auto bound = std::bind(multiply, 2, std::placeholders::_1, 3);
    std::cout << "bind基本用法: " << bound(4) << std::endl; // 2*4*3=24
    
    // 3. 简单的回调函数示例
`std::function<void(int)>`callback = printResult;
    std::cout `<< "\n=== 回调函数示例 ===" << std::endl;
    callback(42);
    
    // 4. 类外调用类成员函数
    Calculator calc;
    std::cout << "\n=== 类外调用类成员函数 ===" << std::endl;
    
    // 绑定成员函数，需要传入对象实例
    auto memberFunc = std::bind(&Calculator::add, &calc, std::placeholders::_1, std::placeholders::_2);
    std::cout << "类成员函数add: " << memberFunc(5, 6) << std::endl;
    
    // 使用std::function包装成员函数
`std::function<int(Calculator*, int, int)>`memberAdd = &Calculator::add;
    std::cout `<< "function包装成员函数: " << memberAdd(&calc, 7, 8) << std::endl;
    
    // 5. 类内调用类成员函数示例
    std::cout << "\n=== 类内调用类成员函数 ===" << std::endl;
    calc.processWithCallback([](int value) {
        std::cout << "类内回调处理: " << value << std::endl;
    });
    
    // 6. 结合lambda表达式的高级示例
    std::cout << "\n=== 结合Lambda表达式 ===" << std::endl;
    
    // lambda作为回调
`std::vector<int>`numbers = {1, 2, 3, 4, 5};
    ``std::`function`<bool(int)>` predicate = [](int n) { return n % 2 == 0; };
    
    std::cout `<< "偶数: ";
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



## 10. 三种智能指针
智能指针是C++11引入的自动内存管理工具，基于RAII原则。手动内存管理容易导致内存泄漏、悬空指针等问题，智能指针通过自动化资源管理，消除了这些常见错误。

就像雇了三种不同的管家来管理你的财产。`unique_ptr`是专属管家，只为你一个人服务；`shared_ptr`是共享管家，可以为多个人服务，人走茶凉时自动清理；`weak_ptr`是临时工，只是看看情况，不负责管理。

### 10.1. 语法模板
```cpp
// unique_ptr
`std::unique_ptr<Type>`ptr = `std::`make_unique`<Type>`(args...);
``std::`unique_ptr`<Type>` ptr(new Type(args...));
``std::`unique_ptr`<Type[]>` arr(new Type[size]);

// shared_ptr
``std::`shared_ptr`<Type>` ptr = `std::`make_shared`<Type>`(args...);
``std::`shared_ptr`<Type>` ptr(new Type(args...));

// weak_ptr
`std::`weak_ptr`<Type>` weak_ptr = shared_ptr;
```

### 10.2. 常用功能接口
#### 10.2.1. unique_ptr 常用接口
```cpp
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

#### 10.2.2. shared_ptr 常用接口
```cpp
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

#### 10.2.3. weak_ptr 常用接口
```cpp
// 基本操作
weak.lock()         // 尝试获取shared_ptr，失败返回空
weak.expired()      // 检查所指对象是否已被销毁
weak.reset()        // 重置为空
weak.swap(other)    // 交换两个weak_ptr

// 引用计数
weak.use_count()    // 获取shared_ptr的引用计数
```

### 10.3. 详细代码示例
```cpp
#include `<iostream>`
#include `<memory>`
#include `<vector>`

class Resource {
public:
    Resource(int id) : id_(id) {
        std::cout `<< "Resource " << id_ << " created" << std::endl;
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
    auto ptr1 =`std::make_unique<Resource>`(1);
    ptr1->show();
    std::cout `<< "ptr1.get(): " << ptr1.get() << std::endl;
    
    auto ptr2 = std::move(ptr1);  // 转移所有权
    std::cout << "After move - ptr1: " << (ptr1 ? "valid" : "null") << std::endl;
    std::cout << "After move - ptr2: " << (ptr2 ? "valid" : "null") << std::endl;
    
    // shared_ptr 示例
    std::cout << "\n=== shared_ptr 示例 ===" << std::endl;
    auto shared1 =`std::make_shared<Resource>`(2);
    std::cout `<< "shared1 use_count: " << shared1.use_count() << std::endl;
    
    {
        auto shared2 = shared1;  // 共享所有权
        std::cout << "After copy - use_count: " << shared1.use_count() << std::endl;

    }  // shared2 离开作用域
    
    std::cout << "After scope - use_count: " << shared1.use_count() << std::endl;
    
    // weak_ptr 示例
    std::cout << "\n=== weak_ptr 示例 ===" << std::endl;
`std::weak_ptr<Resource>`weak = shared1;
    std::cout `<< "weak.expired(): " << (weak.expired() ? "true" : "false") << std::endl;
    std::cout << "weak.use_count(): " << weak.use_count() << std::endl;
    
    if (auto locked = weak.lock()) {
        std::cout << "Successfully locked weak_ptr" << std::endl;
        locked->`show();
    }
    
    shared1.reset();  // 释放shared_ptr
    std::cout `<< "After reset - weak.expired(): " << (weak.expired() ? "true" : "false") << std::endl;
    
    if (auto locked = weak.lock()) {
        std::cout << "Still valid" << std::endl;
    } else {
        std::cout << "weak_ptr is expired" << std::endl;
    }
    
    return 0;
}
```

#### 10.3.1. unique_ptr 适用场景
+ 独占资源所有权
+ 作为函数返回值传递所有权

#### 10.3.2. shared_ptr 适用场景
+ 多个对象需要共享同一资源
+ 不确定哪个对象最后使用资源
+ 需要在多个线程间共享资源（线程安全的引用计数）

#### 10.3.3. weak_ptr 适用场景
+ 打破shared_ptr的循环引用
+ 观察者模式中的观察者
+ 缓存场景中检查对象是否仍然存在

## 11. 可变参数模板
可变参数模板是C++11引入的模板机制，允许模板接受可变数量的参数。C++98中无法优雅地处理不定数量的参数，可变参数模板提供了类型安全的解决方案，让泛型编程更加灵活。

就像一个万能工具箱，可以根据需要装入不同数量和类型的工具。传统的函数只能装固定数量的工具，而可变参数模板让你的工具箱可以灵活调整大小，想装多少工具就装多少工具。

### 11.1. 四种核心概念详解
#### 11.1.1. 模板类型形参包（Template Type Parameter Pack）
```cpp
`template<typename... Args>`  // Args 是模板类型形参包
```

+ **位置**：模板参数列表中
+ **语法**：`typename...` 或 `class...` + 包名
+ **含义**：代表零个或多个类型的集合

#### 11.1.2. 模板类型形参包展开（Template Type Parameter Pack Expansion）
```cpp
Args...  // 模板类型形参包的展开
```

+ **位置**：类型使用的地方
+ **时机**：编译时模板实例化
+ **结果**：展开为具体的类型列表

#### 11.1.3. 函数形参包（Function Parameter Pack）
```cpp
void func(Args... args)  // args 是函数形参包
```

+ **位置**：函数参数列表中
+ **语法**：类型形参包 + `...` + 参数名
+ **含义**：代表零个或多个函数参数

#### 11.1.4. 函数形参包展开（Function Parameter Pack Expansion）
```cpp
args...  // 函数形参包的展开
```

+ **位置**：表达式和函数调用中
+ **时机**：运行时表达式求值
+ **结果**：展开为具体的参数列表

### 11.2. 手动演示例子
#### 11.2.1. 调用示例：`demo_function(42, "hello", 3.14)`
```cpp
// 原始模板定义
`template`<typename... Args>`  // 1. Args: 模板类型形参包
void demo_function(Args... args) {  // 2. args: 函数形参包
    other_func(args...);  // 3. args...: 函数形参包展开
    `std::`tuple`<Args...>` t;  // 4. Args...: 模板类型形参包展开
}
```

**第1步：模板类型形参包确定**

```cpp
// 编译器推导：
Args = {int, const char*, double}  // 模板类型形参包的内容
```

**第2步：模板类型形参包展开**

```cpp
// `std::`tuple`<Args...>` 展开为：
`std::`tuple`<int, const char*, double>` t;

// 函数签名中 Args... args 展开为：
void demo_function(int arg0, const char* arg1, double arg2)
```

**第3步：函数形参包确定**

```cpp
// 函数调用时：
args = {42, "hello", 3.14}  // 函数形参包的内容
// 对应：arg0=42, arg1="hello", arg2=3.14
```

**第4步：函数形参包展开**

```cpp
// other_func(args...) 展开为：
other_func(42, "hello", 3.14);
```

### 11.3. 语法模板
```cpp
// 函数模板
`template`<typename... Args>`
return_type function_name(Args... args);

// 类模板
`template`<typename... Types>`
class ClassName;

// 参数包大小
sizeof...(Args)  // 获取包中元素数量

// 展开模式
func(args...)           // 直接展开
func(process(args)...)  // 表达式展开
`std::`tuple`<Args...>`     // 类型展开
```

### 11.4. 代码示例
```cpp
#include `<iostream>`
#include `<tuple>`
#include `<string>`

// 递归终止
void print() { std::cout `<< std::endl; }

// 可变参数模板函数
template <typename T, typename... Args>`
void print(T&& first, Args&&... args) {
  std::cout `<< first << " ";
  print(args...);  // 递归调用
}

// 演示四种概念的完整例子
template <typename... Args>`         // Args: 模板类型形参包
void detailed_demo(Args... args) {  // args: 函数形参包
  // 显示参数包信息
  std::cout `<< "类型数量: " << sizeof...(Args) << std::endl;
  std::cout << "参数数量: " << sizeof...(args) << std::endl;

  // 函数形参包展开
  print(args...);

  // 模板类型形参包展开
`std::tuple<Args...>`type_tuple(args...);

  // 表达式展开 - using a lambda to handle different types
  auto process = [](auto arg) { return arg + arg; };
  print("处理后:", process(args)...);
}

// 可变参数模板类
template `<typename... Args>`
auto make_tuple(Args... args) {
  return std::make_tuple(args...);
}

int main() {
  // 可变参数函数
  print(1, 2.5, "hello", 'c');
  print("Just a string");

  // 详细演示 - using std::string instead of string literals for the demo
  detailed_demo(10, 20.5, std::string("world"));

  // 可变参数类
  auto t = make_tuple(1, 2.5, "hello");

  return 0;
}
```

### 11.5. 关键区别总结
| 概念 | 语法标识 | 展开位置 | 展开内容 | 展开时机 |
| --- | --- | --- | --- | --- |
| 模板类型形参包 | `typename... Args` | 模板参数列表 | 类型集合 | 声明时 |
| 模板类型形参包展开 | `Args...` | 类型使用处 | 类型列表 | 编译时 |
| 函数形参包 | `Args... args` | 函数参数列表 | 参数集合 | 函数定义时 |
| 函数形参包展开 | `args...` | 表达式中 | 参数列表 | 运行时 |


