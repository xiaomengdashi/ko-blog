---
sidebar_position: 2
slug: /C++/Boost深度剖析/深度剖析-2-Boost-C-库-函数对象-全维度解析
---

---
title: 深度剖析（2）：Boost C++库，《函数对象》全维度解析
date: '2025-03-09 02:36:39'
updated: '2025-03-09 02:36:39'
slug: /C++/Boost深度剖析/深度剖析-2-Boost-C-库-函数对象-全维度解析
![](/img/posts/8fa85dc8dc78accd3b4280e5652daa96.gif)

在C++的编程世界中，Boost库宛如一座蕴藏着无数编程瑰宝的神秘宝库，为开发者们提供了丰富且强大的工具集，极大地拓展了C++语言的能力边界。

其中，`Boost.Bind`、`Boost.Ref`、`Boost.Function`和`Boost.Lambda这四个组件，更是犹如四颗璀璨的明星，各自散发着独特的光芒，在函数绑定、引用管理、函数封装以及匿名函数创建等方面发挥着至关重要的作用。`

![](/img/posts/47222bf32efec7e7441ac75a458555cd.png)

### 1. 一：基础知识**
本章介绍的是函数对象，可能称为'高阶函数'更为适合。 它实际上是指那些可以被传入到其它函数或是从其它函数返回的一类函数。 在C++中高阶函数是被实现为函数对象的，所以这个标题还是有意义的。

在这整一章中，将会介绍几个用于处理函数对象的Boost C++库。 其中，Boost.Bind可替换来自C++标准的著名的`std::bind1st()`和std::bind2nd()函数，而Boost.Function则提供了一个用于封装函数指针的类。 最后，Boost.Lambda则引入了一种创建匿名函数的方法。

### 2. 二：Boost.Bind**
`Boost.Bind`是Boost库中的一个组件，它提供了一种方便的方式来创建函数对象，用于绑定函数及其参数。下面是一个综合实例，展示了`Boost.Bind`的多种使用场景，包括绑定自由函数、成员函数和带占位符的绑定。

```plain
#include `<iostream>`
#include `<boost/bind.hpp>`
#include `<vector>`
#include `<algorithm>`
// 自由函数
int add(int a, int b) {
    return a + b;
}
// 类定义
class Calculator {
public:
    int multiply(int a, int b) {
        return a * b;
    }
};
// 接受函数对象的函数
void apply(const ``std::`vector`<int>`& numbers, const boost::`function`<int(int)>`& func) {
    for (int num : numbers) {
        std::cout `<< func(num) << " ";
    }
    std::cout << std::endl;
}
int main() {
    // 绑定自由函数
    // 绑定 add 函数，固定第一个参数为 5
    boost::`function<int(int)>` add_five = boost::bind(add, 5, _1);
    std::cout `<< "Adding 5 to 3: " << add_five(3) << std::endl;
    // 绑定成员函数
    Calculator calc;
    // 绑定 Calculator 的 multiply 成员函数，固定第一个参数为 2
    boost::`function<int(int)>` multiply_by_two = boost::bind(&Calculator::multiply, &calc, 2, _1);
    std::cout `<< "Multiplying 4 by 2: " << multiply_by_two(4) << std::endl;
    // 使用绑定函数对象处理容器元素
`std::vector<int>`numbers = {1, 2, 3, 4, 5};
    // 对容器中的每个元素加 10
    std::cout `<< "Adding 10 to each number: ";
    apply(numbers, boost::bind(add, 10, _1));
    // 对容器中的每个元素乘以 3
    std::cout << "Multiplying each number by 3: ";
    apply(numbers, boost::bind(&Calculator::multiply, &calc, 3, _1));
    return 0;
}
```

### 3. 三：Boost.Ref**
`Boost.Ref` 库提供了 `boost::ref` 和 `boost::cref` 两个工具，用于在需要按引用传递对象时避免对象的复制。`boost::ref` 用于传递非 `const` 对象的引用，`boost::cref` 用于传递 `const` 对象的引用。下面为你提供一个综合实例代码，展示 `Boost.Ref` 在不同场景下的使用。

```plain
#include <iostream>`
#include `<boost/ref.hpp>`
#include `<vector>`
#include `<algorithm>`
// 一个简单的函数，用于修改传入的整数
void increment(int& num) {
    ++num;
}
// 一个简单的类
class Printer {
public:
    void print(const std::string& message) const {
        std::cout `<< message << std::endl;
    }
};
// 函数接受一个函数对象并调用它
void callFunction(const boost::`function<void()>`& func) {
    func();
}
int main() {
    // 1. 使用 boost::ref 在 std::for_each 中按引用传递对象
    ``std::`vector`<int>` numbers = {1, 2, 3, 4, 5};
    std::for_each(numbers.begin(), numbers.end(), boost::bind(increment, boost::ref(_1)));
    std::cout `<< "After incrementing: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    // 2. 使用 boost::ref 传递对象给另一个函数
    int value = 10;
    boost::`function<void()>` incrementValue = boost::bind(increment, boost::ref(value));
    incrementValue();
    std::cout `<< "Value after increment: " << value << std::endl;
    // 3. 使用 boost::cref 传递 const 对象
    Printer printer;
    std::string message = "Hello, Boost.Ref!";
    boost::`function<void()>` printMessage = boost::bind(&Printer::print, boost::cref(printer), boost::cref(message));
    callFunction(printMessage);
    return 0;
}
```

### 4. 四：Boost.Function**
为了封装函数指针，Boost.Function 提供了一个名为 `boost::function` 的类。 它定义于 `boost/function.hpp`，用法如下：

```plain
#include `<iostream>`
#include `<boost/function.hpp>`
#include `<vector>`
// 1. 普通函数
int add(int a, int b) {
    return a + b;
}
// 2. 函数对象（仿函数）
struct Subtract {
    int operator()(int a, int b) const {
        return a - b;
    }
};
// 3. 类及其成员函数
class Calculator {
public:
    int multiply(int a, int b) {
        return a * b;
    }
};
// 4. 接受 Boost.Function 对象作为参数的函数
void performOperation(const boost::`function`<int(int, int)>`& func, int a, int b) {
    std::cout `<< "Result: " << func(a, b) << std::endl;
}
int main() {
    // 5. 存储普通函数
    boost::`function<int(int, int)>` addFunc = add;
    std::cout `<< "Calling add function: ";
    performOperation(addFunc, 3, 5);
    // 6. 存储函数对象
    Subtract subtract;
    boost::`function<int(int, int)>` subtractFunc = subtract;
    std::cout `<< "Calling subtract functor: ";
    performOperation(subtractFunc, 10, 4);
    // 7. 存储成员函数
    Calculator calc;
    // 使用 boost::bind 绑定成员函数
    boost::`function<int(int, int)>` multiplyFunc = boost::bind(&Calculator::multiply, &calc, _1, _2);
    std::cout `<< "Calling multiply member function: ";
    performOperation(multiplyFunc, 2, 6);
    // 8. 存储 Lambda 表达式
    auto divide = [](int a, int b) { return a / b; };
    boost::`function<int(int, int)>` divideFunc = divide;
    std::cout `<< "Calling divide lambda: ";
    performOperation(divideFunc, 12, 3);
    // 9. 将 Boost.Function 对象存储在容器中
`std::vector<boost::function<int(int, int)>`> operations;
    operations.push_back(addFunc);
    operations.push_back(subtractFunc);
    operations.push_back(multiplyFunc);
    operations.push_back(divideFunc);
    int num1 = 20, num2 = 5;
    std::cout `<< "Performing all operations on " << num1 << " and " << num2 << ":\n";
    for (const auto& op : operations) {
        std::cout << "Result: " << op(num1, num2) << std::endl;
    }
    return 0;
}
```

### 5. 五：Boost.Lambda**
`Boost.Lambda` 库允许你在代码中创建轻量级的匿名函数对象，这些函数对象可以在需要函数的地方直接使用，无需显式定义一个命名的函数或函数对象类。下面是一个综合实例代码，展示了 `Boost.Lambda` 在不同场景下的使用：

```plain
#include <iostream>`
#include `<vector>`
#include `<algorithm>`
#include `<boost/lambda/lambda.hpp>`
#include `<boost/lambda/bind.hpp>`
// 一个简单的函数，用于输出信息
void print(int num) {
    std::cout `<< num << " ";
}
int main() {
    // 初始化一个整数向量
`std::vector<int>`numbers = {1, 2, 3, 4, 5};
    // 1. 使用 Boost.Lambda 进行简单的元素输出
    std::cout `<< "Printing numbers using Boost.Lambda: ";
    std::for_each(numbers.begin(), numbers.end(), std::cout << boost::lambda::_1 << " ");
    std::cout << std::endl;
    // 2. 使用 Boost.Lambda 修改向量元素
    std::cout << "Doubling each number using Boost.Lambda: ";
    std::for_each(numbers.begin(), numbers.end(), boost::lambda::_1 *= 2);
    std::for_each(numbers.begin(), numbers.end(), print);
    std::cout << std::endl;
    // 3. 使用 Boost.Lambda 进行条件筛选
    std::cout << "Numbers greater than 5: ";
`std::vector<int>`::iterator it;
    for (it = numbers.begin();
         it != std::remove_if(numbers.begin(), numbers.end(), boost::lambda::_1 <= 5);
         ++it) {
        std::cout `<< *it << " ";
    }
    std::cout << std::endl;
    // 4. 使用 Boost.Lambda 结合 std::transform 进行元素转换
`std::vector<int>`squared;
    squared.resize(numbers.size());
    std::transform(numbers.begin(), numbers.end(), squared.begin(), boost::lambda::_1 * boost::lambda::_1);
    std::cout `<< "Squared numbers: ";
    std::for_each(squared.begin(), squared.end(), print);
    std::cout << std::endl;
    // 5. 使用 Boost.Lambda 调用成员函数
    struct Point {
        int x, y;
        void move(int dx, int dy) {
            x += dx;
            y += dy;
        }
        void print() const {
            std::cout << "(" << x << ", " << y << ") ";
        }
    };
`std::vector<Point>`points = {{1, 2}, {3, 4}, {5, 6}};
    std::cout `<< "Points before moving: ";
    std::for_each(points.begin(), points.end(), boost::lambda::bind(&Point::print, boost::lambda::_1));
    std::cout << std::endl;
    std::for_each(points.begin(), points.end(), boost::lambda::bind(&Point::move, boost::lambda::_1, 1, 1));
    std::cout << "Points after moving: ";
    std::for_each(points.begin(), points.end(), boost::lambda::bind(&Point::print, boost::lambda::_1));
    std::cout << std::endl;
    return 0;
}
```

### 6. 六：综合实战案例（Ubuntu平台运行）**
```plain
#include <iostream>`
#include `<boost/bind.hpp>`
#include `<boost/ref.hpp>`
#include `<boost/function.hpp>`
#include `<boost/lambda/lambda.hpp>`
#include `<vector>`
#include `<algorithm>`
// 一个简单的函数，用于演示 Boost.Bind 和 Boost.Function
int add(int a, int b) {
    return a + b;
}
// 一个需要引用参数的函数，用于演示 Boost.Ref
void increment(int& num) {
    ++num;
}
// 主函数，包含各个组件的使用示例
int main() {
    // 3.2 Boost.Bind
    // 使用 Boost.Bind 绑定 add 函数的参数
    boost::`function`<int(int)>` addFive = boost::bind(add, _1, 5);
    std::cout `<< "Boost.Bind: addFive(3) = " << addFive(3) << std::endl;
    // 3.3 Boost.Ref
    int value = 10;
    // 使用 Boost.Ref 传递引用
    increment(boost::ref(value));
    std::cout << "Boost.Ref: After increment, value = " << value << std::endl;
    // 3.4 Boost.Function
    // 使用 Boost.Function 存储函数指针
    boost::`function<int(int, int)>` func = add;
    std::cout `<< "Boost.Function: func(2, 4) = " << func(2, 4) << std::endl;
    // 3.5 Boost.Lambda
`std::vector<int>`numbers = {1, 2, 3, 4, 5};
    // 使用 Boost.Lambda 进行简单的元素递增操作
    std::for_each(numbers.begin(), numbers.end(), boost::lambda::_1 += 1);
    std::cout `<< "Boost.Lambda: Numbers after increment: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    return 0;
}
```

#### 6.1. 1：打开终端，使用以下命令安装 Boost 库：

```plain
sudo apt-get update
sudo apt-get install libboost-all-dev
```

这个命令会安装 Boost 库的所有开发包，包含头文件、库文件以及相关的文档。

#### 6.2. 2：编译Boost C++程序

在终端中，使用 `g++` 编译器来编译 `.cpp` 文件。由于 Boost 是一个外部库，编译时需要指定 Boost 库的路径和链接选项。不过在 Ubuntu 上使用 `libboost-all-dev` 安装后，编译器通常能自动找到 Boost 库的头文件和库文件。使用以下命令进行编译：

```plain
g++ -o boost_example boost_example.cpp -lboost_system -lboost_filesystem
```

+ `-o boost_example：指定生成的可执行文件名为 ``boost_example``。`
+ `boost_example.cpp：要编译的源文件。`
+ `-lboost_system -lboost_filesystem：链接 Boost 系统库和文件系统库。根据实际使用的 Boost 组件，你可能需要调整链接的库。如果只是使用基本的 Boost 功能，有时不需要显式指定链接库，直接使用 ``g++ -o boost_example boost_example.cpp`` 即可。`

#### 6.3. 3：运行可执行文件

编译成功后，会生成一个可执行文件。在终端中输入以下命令来运行该文件：

```plain
./boost_example
```

#### 6.4. 4：该程序运行如下：

![](/img/posts/e52f4b3454ecebd3ff043fbe4f150448.png)

### 7. 七：动手练习操作**
#### 7.1. 1：简化以下程序，将函数对象divide_by 转换为一个函数，并将for 循环替换为用一个标准的 C++ 算法来输出数据：

```plain
#include <algorithm>` 
#include `<functional>` 
#include `<vector>` 
#include `<iostream>` 
class divide_by 
  : public `std::`binary_function`<int, int, int>` 
{ 
public: 
  int operator()(int n, int div) const 
  { 
    return n / div; 
  } 
}; 
int main() 
{ 
  ``std::`vector`<int>` numbers; 
  numbers.push_back(10); 
  numbers.push_back(20); 
  numbers.push_back(30); 
  std::transform(numbers.begin(), numbers.end(), numbers.begin(), std::bind2nd(divide_by(), 2)); 
  for (``std::`vector`<int>`::iterator it = numbers.begin(); it != numbers.end(); ++it) 
    std::cout `<< *it << std::endl; 
}
```

#### 7.2. 2：简化以下程序，将两个for 循环都替换为标准的 C++ 算法：

```plain
#include <string>` 
#include `<vector>` 
#include `<iostream>` 
int main() 
{ 
  ``std::`vector`<std::string>` strings; 
  strings.push_back("Boost"); 
  strings.push_back("C++"); 
  strings.push_back("Libraries"); 
  ``std::`vector`<int>` sizes; 
  for (``std::`vector`<std::string>`::iterator it = strings.begin(); it != strings.end(); ++it) 
    sizes.push_back(it->size()); 
  for (``std::`vector`<int>`::iterator it = sizes.begin(); it != sizes.end(); ++it) 
    std::cout `<< *it << std::endl; 
}
```

#### 7.3. 3：简化以下程序，修改变量 processors 的类型，并将 for 循环替换为标准的 C++ 算法：

```plain
#include <vector>` 
#include `<iostream>` 
#include `<cstdlib>` 
#include `<cstring>` 
int main() 
{ 
  ``std::`vector`<int(*)(const char*)>` processors; 
  processors.push_back(std::atoi); 
  processors.push_back(`reinterpret_cast`<int(*)(const char*)>`(std::strlen)); 
  const char data[] = "1.23"; 
  for (``std::`vector`<int(*)(const char*)>`::iterator it = processors.begin(); it != processors.end(); ++it) 
    std::cout `<< (*it)(data) << std::endl; 
}
```

  


>` 来自: [深度剖析（2）：Boost C++库，《函数对象》全维度解析](https://mp.weixin.qq.com/s?__biz=Mzg5NzA0NjYyNA==&mid=2247485900&idx=1&sn=f03d1dc84c4fdbba339318913da4e79e&chksm=c07688c3f70101d50e39c627eb89a8e4277695692bc9eb68d760959946eef0e881f0214dc25e&cur_album_id=3814454053487198212&scene=189#wechat_redirect)
>

