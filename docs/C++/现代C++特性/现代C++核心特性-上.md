---
sidebar_position: 1
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


## 1. auto 关键字 - 自动类型推导

auto关键字是C++11引入的类型推导机制，允许编译器根据初始化表达式自动推断变量的类型。在C++98中，复杂的模板类型声明往往冗长且容易出错，auto关键字解决了这个问题，让代码更简洁、更易维护。
就像智能助手一样，auto让编译器自动猜出变量的类型，你不用再写那些又长又复杂的类型名了。特别是STL容器的迭代器，以前要写一大串，现在一个auto就搞定。
**注意不要滥用auto，简单明确的类型还是需要显示指出，auto通常用于模板特化参数返回值，不知道具体返回值类型或者类型过于冗长。**
### 语法模板

```cpp
auto variable_name = expression;
```

### 代码示例

```cpp
#include <iostream>
#include <vector>
#include <map>

int main() {
    auto x = 42;        // int
    auto y = 3.14;      // double
    
    std::vector<int> vec = {1, 2, 3};
    auto it = vec.begin();  // 替代 std::vector<int>::iterator
        
    return 0;
}
```

## 2. 默认函数控制 (= default / = delete)

默认函数控制是C++11提供的显式控制编译器生成特殊成员函数的机制。在C++98中，编译器会隐式生成某些特殊成员函数，但程序员无法明确表达意图。这个特性让程序员能够精确控制类的接口和行为。
就像给类的特殊函数贴标签，`= default`是说"编译器你帮我生成默认版本"，`= delete`是说"这个函数我不要，谁都不能用"。这样你就能精确控制类的行为，想要什么有什么，不想要什么就禁掉。
### 语法模板

```cpp
return_type function_name(parameters) = default;
return_type function_name(parameters) = delete;
```

### 代码示例

```cpp
class MyClass {
public:
    MyClass() = default;                    // 要求默认构造函数
    MyClass(int value) : data(value) {}
    
    MyClass(const MyClass&) = delete;      // 禁止拷贝构造
    MyClass& operator=(const MyClass&) = delete; //禁用拷贝赋值
    
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
### 语法模板

```cpp
Type variable{value1, value2, ...};
container_type container{element1, element2, ...};
```

### 代码示例

```cpp
#include <iostream>
#include <vector>
#include <map>

struct Point { int x, y; };

int main() {
    // 基本类型和容器
    int x{42};
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::map<std::string, int> m = {{"apple", 1}, {"banana", 2}};
    
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
### 语法模板

```cpp
ClassName(params1) : ClassName(params2) {
    // 额外的初始化代码
}
```

### 代码示例

```cpp
#include <iostream>

class Rectangle {
public:
    // 主构造函数
    Rectangle(int w, int h) : width(w), height(h) {
        std::cout << "Rectangle: " << w << "x" << h << std::endl;
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




## 5. 范围for循环 - 遍历容器更简单

### 简介

范围for循环（Range-based for loop）是C++11引入的一种简化容器遍历的语法，它让代码更简洁、更易读，同时减少了常见的遍历错误。

### 适用场景
- 需要遍历整个容器
- 不需要知道元素的索引位置
- 不需要在遍历过程中修改容器结构

### 基本语法

```cpp
for (声明变量 : 容器) {
    // 循环体
}
```

其中：
- **声明变量**：用于接收容器中的每个元素
- **容器**：可以是数组、vector、list、map等标准容器，或任何提供begin()和end()方法的对象

### 使用方式

#### 1. 按值遍历（拷贝元素）

```cpp
for (int num : numbers) {
    // num是numbers中元素的拷贝
    std::cout << num << " ";
}
```

#### 2. 按引用遍历（避免拷贝）

```cpp
for (auto& elem : container) {
    // elem是container中元素的引用，避免拷贝开销
    std::cout << elem << " ";
}
```


### 代码示例

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <map>

int main() {
    // 1. 遍历数组
    int arr[] = {1, 2, 3, 4, 5};
    std::cout << "数组元素: ";
    for (int num : arr) {
        std::cout << num << " ";
    }
    std::cout << "\n";
    
    // 2. 遍历vector
    std::vector<std::string> fruits = {"苹果", "香蕉", "橙子"};
    std::cout << "水果: ";
    for (const auto& fruit : fruits) {
        std::cout << fruit << " ";
    }
    std::cout << "\n";
    
    // 3. 修改vector中的元素
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    for (auto& num : numbers) {
        num *= 2; // 每个元素翻倍
    }
    
    std::cout << "翻倍后的数字: ";
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    std::cout << "\n";
    
    // 4. 遍历map
    std::map<std::string, int> ages = {
        {"张三", 25},
        {"李四", 30},
        {"王五", 35}
    };
    
    std::cout << "姓名和年龄: \n";
    for (const auto& pair : ages) {
        std::cout << pair.first << ": " << pair.second << "岁\n";
    }
    
    return 0;
}
```





## 6. STL emplace系列接口 - 原地构造

emplace系列函数是C++11为STL容器引入的原地构造接口。与传统的`push_back`、`insert`等函数不同，emplace函数直接在容器的内存位置构造对象，避免了临时对象的创建和拷贝/移动操作，提高了性能。
就像在工厂里直接组装产品，而不是先在别的地方组装好再搬过来。`push_back`是"先造好再放进去"，`emplace_back`是"直接在容器里造"，省去了搬运的麻烦，效率更高。
### 语法模板

```cpp
container.emplace_back(constructor_args...);
container.emplace(position, constructor_args...);
```

### 代码示例

```cpp
#include <iostream>
#include <vector>
#include <string>

struct Person {
    std::string name;
    int age;
    
    Person(const std::string& n, int a) : name(n), age(a) {
        std::cout << "Person created: " << name << std::endl;
    }
};

int main() {
    std::vector<Person> people;
    
    // push_back: 先构造临时对象，再移动
    people.push_back(Person("Alice", 25));
    
    // emplace_back: 直接在容器内构造
    people.emplace_back("Bob", 30);
    
    return 0;
}
```
## 7. 可变参数模板

可变参数模板是C++11引入的模板机制，允许模板接受可变数量的参数。C++98中无法优雅地处理不定数量的参数，可变参数模板提供了类型安全的解决方案，让泛型编程更加灵活。

就像一个万能工具箱，可以根据需要装入不同数量和类型的工具。传统的函数只能装固定数量的工具，而可变参数模板让你的工具箱可以灵活调整大小，想装多少工具就装多少工具。


### 语法模板

```cpp
// 函数模板
template<typename... Args>
return_type function_name(Args... args);

// 类模板
template<typename... Types>
class ClassName;

// 参数包大小
sizeof...(Args)  // 获取包中元素数量

// 展开模式
func(args...)           // 直接展开
func(process(args)...)  // 表达式展开
```


### 四种核心概念

| 概念        | 语法标识               | 展开位置   | 展开内容 | 展开时机  |
| --------- | ------------------ | ------ | ---- | ----- |
| 模板类型形参包   | `typename... Args` | 模板参数列表 | 类型集合 | 声明时   |
| 模板类型形参包展开 | `Args...`          | 类型使用处  | 类型列表 | 编译时   |
| 函数形参包     | `Args... args`     | 函数参数列表 | 参数集合 | 函数定义时 |
| 函数形参包展开   | `args...`          | 表达式中   | 参数列表 | 运行时   |

#### 1. 模板类型形参包（Template Type Parameter Pack）
```cpp
template<typename... Args>  // Args 是模板类型形参包
```
- **位置**：模板参数列表中
- **语法**：`typename...` 或 `class...` + 包名
- **含义**：代表零个或多个类型的集合

#### 2. 模板类型形参包展开（Template Type Parameter Pack Expansion）
```cpp
Args...  // 模板类型形参包的展开
```
- **位置**：类型使用的地方
- **时机**：编译时模板实例化
- **结果**：展开为具体的类型列表

#### 3. 函数形参包（Function Parameter Pack）
```cpp
void func(Args... args)  // args 是函数形参包
```
- **位置**：函数参数列表中
- **语法**：类型形参包 + `...` + 参数名
- **含义**：代表零个或多个函数参数

#### 4. 函数形参包展开（Function Parameter Pack Expansion）
```cpp
args...  // 函数形参包的展开
```
- **位置**：表达式和函数调用中
- **时机**：运行时表达式求值
- **结果**：展开为具体的参数列表


### 行参包展开（获取每一个形参）

**递归展开**
#### 代码示例
```cpp
#include<iostream>

//空的出口函数
void print() {}

//可变参数模板
template <typename T, typename... Args> void print(T v, Args... args) {
  std::cout << v << " ";
  print(args...);
}

int main() { print(1, "hello", 3.14); }
```


#### 原理
- 模板实例化 ：编译器为每种参数组合生成独立的函数实例
- 模式匹配 ： T v, Args... args 分离首元素和剩余包
- 递归展开 ： func(args...) 将剩余包展开为新的参数列表

**以下是示例代码经过编译器处理得到的代码**

**查看编译器处理后的代码的网站地址：** ：https://cppinsights.io/

```cpp
#include <iostream>

void print()
{
}
template<typename T, typename ... Args>
void print(T v, Args... args)
{
  (std::cout << v) << " ";
  print(args... );
}

/* First instantiated from: insights.cpp:9 */
#ifdef INSIGHTS_USE_TEMPLATE
template<>
void print<int, const char *, double>(int v, const char * __args1, double __args2)
{
  std::operator<<(std::cout.operator<<(v), " ");
  print(__args1, __args2);
}
#endif


/* First instantiated from: insights.cpp:6 */
#ifdef INSIGHTS_USE_TEMPLATE
template<>
void print<const char *, double>(const char * v, double __args1)
{
  std::operator<<(std::operator<<(std::cout, v), " ");
  print(__args1);
}
#endif


/* First instantiated from: insights.cpp:6 */
#ifdef INSIGHTS_USE_TEMPLATE
template<>
void print<double>(double v)
{
  std::operator<<(std::cout.operator<<(v), " ");
  print();
}
#endif


int main()
{
  print(1, "hello", 3.1400000000000001);
  return 0;
}

```




