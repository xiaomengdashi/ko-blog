---
sidebar_position: 7
---

## 概述
- std::string_view (C++17) -字符串视图
- std::span (C++20) - 数组视图

## 一、零拷贝

### 什么是零拷贝
零拷贝（Zero-Copy）是一种优化技术，指在数据传输或处理过程中避免不必要的数据复制操作。在传统的数据处理中，当我们需要传递数据时，往往会创建数据的副本，这不仅消耗额外的内存空间，还增加了CPU的处理负担。零拷贝技术通过直接引用原始数据，避免了这些开销。

### C++实现零拷贝的常用手段
1. **引用传递**：使用引用避免对象拷贝 ，const T&
2. **移动语义**：C++11引入的右值引用和移动构造 std::move()
3. **视图类型**：C++17和20引入的std::string_view和std::span，提供对现有数据的非拥有性访问
4. **内存映射**：直接映射文件到内存空间

## 二、std::string_view详解

### 概念
std::string_view是C++17引入的一个轻量级字符串视图类，它提供对字符序列的只读、非拥有性访问。string_view不拥有它所指向的字符数据，仅仅是对现有字符串的一个"窗口"。

### 特点
- **零拷贝**：不复制字符串数据，只存储指针和长度
- **只读访问**：提供const访问，不能修改底层数据
- **轻量级**：只包含两个成员：指针和大小
- **高效传参**：避免了std::string的拷贝开销
- **兼容性好**：可以从多种字符串类型构造

### 应用场景
1. **函数参数传递**：替代const std::string&参数
2. **字符串解析**：高效的子串操作
3. **API设计**：提供统一的字符串接口
4. **性能敏感场景**：避免不必要的内存分配

### 实现原理

```cpp
template <class _CharT, class _Traits = char_traits<_CharT>>
class basic_string_view {
private:
    const value_type* __data_;  // 指向字符数据的指针
    size_type __size_;          // 字符串长度
};
```

**核心设计要点：**
1. **双成员设计**：只包含数据指针和大小，确保轻量级
2. **非拥有性**：不管理内存，不负责数据的生命周期
3. **constexpr支持**：编译期构造和操作
4. **类型安全**：通过模板参数支持不同字符类型

### 常用API详解

#### 1. 构造函数
```cpp
// 默认构造
std::string_view sv1;  // 空视图

// 从C字符串构造
std::string_view sv2("hello");

// 从指针和长度构造
std::string_view sv3("hello world", 5);  // "hello"

// 从std::string构造
std::string str = "example";
std::string_view sv4(str);
```

#### 2. 访问操作
```cpp
std::string_view sv("hello");

// 基本访问
char ch = sv[0];           // 'h'
char front = sv.front();   // 'h'
char back = sv.back();     // 'o'
const char* ptr = sv.data(); // 获取原始指针
size_t len = sv.size();    // 5
bool empty = sv.empty();   // false
```

#### 3. 子串操作
```cpp
std::string_view sv("hello world");

// 获取子串
auto sub1 = sv.substr(0, 5);    // "hello"
auto sub2 = sv.substr(6);       // "world"

// 移除前缀和后缀
sv.remove_prefix(6);  // sv现在是"world"
sv.remove_suffix(2);  // sv现在是"wor"
```

#### 4. 查找操作
```cpp
std::string_view sv("hello world");

// 查找字符
size_t pos1 = sv.find('o');           // 4
size_t pos2 = sv.find("wor");         // 6
size_t pos3 = sv.rfind('o');          // 7

// C++20新增功能
bool starts = sv.starts_with("hello"); // true
bool ends = sv.ends_with("world");     // true

// C++23新增功能
bool contains = sv.contains("lo");     // true
```

#### 5. 比较操作
```cpp
std::string_view sv1("abc");
std::string_view sv2("def");

// 比较
int cmp = sv1.compare(sv2);  // < 0
bool equal = (sv1 == sv2);   // false
bool less = (sv1 < sv2);     // true
```

### 代码示例

```cpp
#include <iostream>
#include <string_view>
#include <string>
#include <vector>

// 零拷贝字符串处理函数
void processString(std::string_view sv) {
    std::cout << "Processing: " << sv << " (length: " << sv.size() << ")\n";
    
    // 高效的子串操作
    if (sv.size() > 5) {
        auto prefix = sv.substr(0, 5);
        std::cout << "Prefix: " << prefix << "\n";
    }
}

// 字符串分割示例
std::vector<std::string_view> split(std::string_view str, char delimiter) {
    std::vector<std::string_view> result;
    size_t start = 0;
    
    while (start < str.size()) {
        size_t end = str.find(delimiter, start);
        if (end == std::string_view::npos) {
            end = str.size();
        }
        
        if (end > start) {
            result.push_back(str.substr(start, end - start));
        }
        start = end + 1;
    }
    
    return result;
}

int main() {
    // 零拷贝处理不同类型的字符串
    const char* cstr = "Hello, World!";
    std::string stdstr = "C++ Programming";
    
    processString(cstr);    // 直接从C字符串构造
    processString(stdstr);  // 从std::string构造，无拷贝
    processString("Literal"); // 从字符串字面量构造
    
    // 字符串分割示例
    std::string data = "apple,banana,cherry,date";
    auto parts = split(data, ',');
    
    std::cout << "Split result:\n";
    for (const auto& part : parts) {
        std::cout << "  '" << part << "'\n";
    }
    
    return 0;
}
```

## 三、std::span详解

### 概念
std::span是C++20引入的一个模板类，提供对连续内存序列的非拥有性访问。它可以看作是数组、vector、array等连续容器的统一视图接口。

### 特点
- **零拷贝**：不复制元素，只存储指针和大小信息
- **类型安全**：提供边界检查和类型安全的访问
- **统一接口**：为不同的连续容器提供统一的访问方式
- **灵活性**：支持静态和动态大小
- **高效性**：minimal overhead，接近原生指针的性能

### 应用场景
1. **函数参数**：统一处理数组、vector、array等容器
2. **算法接口**：提供容器无关的算法实现
3. **内存视图**：安全地访问连续内存区域
4. **API设计**：简化需要处理多种容器类型的接口

**核心设计要点：**
1. **模板特化**：静态大小版本只存储指针，动态版本存储指针和大小
2. **概念约束**：使用C++20概念确保类型安全
3. **边界检查**：在debug模式下提供边界检查
4. **迭代器支持**：提供完整的迭代器接口

### 常用API详解

#### 1. 构造函数
```cpp
// 从数组构造
int arr[] = {1, 2, 3, 4, 5};
std::span<int> sp1(arr);  // 自动推导大小
std::span<int, 5> sp2(arr);  // 静态大小

// 从vector构造
std::vector<int> vec = {1, 2, 3, 4, 5};
std::span<int> sp3(vec);

// 从指针和大小构造
std::span<int> sp4(arr, 3);  // 前3个元素

// 从迭代器构造
std::span<int> sp5(vec.begin(), vec.begin() + 3);
```

#### 2. 访问操作
```cpp
std::vector<int> vec = {1, 2, 3, 4, 5};
std::span<int> sp(vec);

// 基本访问
int first = sp[0];           // 1
int front = sp.front();      // 1
int back = sp.back();        // 5
int* ptr = sp.data();        // 获取原始指针
size_t len = sp.size();      // 5
bool empty = sp.empty();     // false
size_t bytes = sp.size_bytes(); // 5 * sizeof(int)
```

#### 3. 子视图操作
```cpp
std::vector<int> vec = {1, 2, 3, 4, 5};
std::span<int> sp(vec);

// 获取前N个元素
auto first3 = sp.first<3>();    // {1, 2, 3}
auto firstN = sp.first(3);      // {1, 2, 3}

// 获取后N个元素
auto last2 = sp.last<2>();      // {4, 5}
auto lastN = sp.last(2);        // {4, 5}

// 获取子span
auto sub1 = sp.subspan<1, 3>(); // {2, 3, 4}
auto sub2 = sp.subspan(1, 3);   // {2, 3, 4}
auto sub3 = sp.subspan(2);      // {3, 4, 5}
```

#### 4. 迭代器支持
```cpp
std::vector<int> vec = {1, 2, 3, 4, 5};
std::span<int> sp(vec);

// 正向迭代
for (auto it = sp.begin(); it != sp.end(); ++it) {
    std::cout << *it << " ";
}

// 范围for循环
for (int& val : sp) {
    val *= 2;  // 可以修改元素
}

// 反向迭代
for (auto it = sp.rbegin(); it != sp.rend(); ++it) {
    std::cout << *it << " ";
}
```

#### 5. 字节视图
```cpp
std::vector<int> vec = {0x12345678, 0x9ABCDEF0};
std::span<int> sp(vec);

// 获取字节视图
auto bytes = std::as_bytes(sp);
std::cout << "Size in bytes: " << bytes.size() << "\n";

// 可写字节视图（非const元素）
auto writable_bytes = std::as_writable_bytes(sp);
```

### 代码示例

```cpp
#include <iostream>
#include <span>
#include <vector>
#include <array>
#include <algorithm>
#include <numeric>

// 零拷贝处理不同容器的统一函数
template<typename T>
void processData(std::span<T> data) {
    std::cout << "Processing " << data.size() << " elements:\n";
    
    // 计算统计信息
    if (!data.empty()) {
        auto sum = std::accumulate(data.begin(), data.end(), T{});
        auto avg = sum / data.size();
        std::cout << "  Sum: " << sum << ", Average: " << avg << "\n";
        
        // 查找最大值
        auto max_it = std::max_element(data.begin(), data.end());
        std::cout << "  Max: " << *max_it << "\n";
    }
}

// 矩阵操作示例
template<typename T>
class Matrix {
private:
    std::vector<T> data_;
    size_t rows_, cols_;
    
public:
    Matrix(size_t rows, size_t cols) : data_(rows * cols), rows_(rows), cols_(cols) {}
    
    // 获取行的span视图
    std::span<T> getRow(size_t row) {
        return std::span<T>(data_.data() + row * cols_, cols_);
    }
    
    // 获取整个矩阵的span视图
    std::span<T> getData() {
        return std::span<T>(data_);
    }
    
    void fill(T value) {
        std::fill(data_.begin(), data_.end(), value);
    }
};

// 安全的数组处理函数
template<typename T>
void safeArrayProcess(std::span<T> arr) {
    // 边界安全的访问
    for (size_t i = 0; i < arr.size(); ++i) {
        arr[i] *= 2;
    }
    
    // 子数组处理
    if (arr.size() > 2) {
        auto middle = arr.subspan(1, arr.size() - 2);
        std::cout << "Middle elements: ";
        for (const auto& val : middle) {
            std::cout << val << " ";
        }
        std::cout << "\n";
    }
}

int main() {
    // 处理不同类型的容器
    std::vector<int> vec = {1, 2, 3, 4, 5};
    std::array<int, 5> arr = {6, 7, 8, 9, 10};
    int c_array[] = {11, 12, 13, 14, 15};
    
    std::cout << "=== 统一处理不同容器 ===\n";
    processData<int>(vec);     // vector
    processData<int>(arr);     // array
    processData<int>(c_array); // C数组
    
    // 矩阵操作示例
    std::cout << "\n=== 矩阵操作示例 ===\n";
    Matrix<double> matrix(3, 4);
    matrix.fill(1.5);
    
    // 处理每一行
    for (size_t i = 0; i < 3; ++i) {
        auto row = matrix.getRow(i);
        std::cout << "Row " << i << ": ";
        for (const auto& val : row) {
            std::cout << val << " ";
        }
        std::cout << "\n";
    }
    
    // 安全数组处理
    std::cout << "\n=== 安全数组处理 ===\n";
    std::vector<int> test_data = {1, 2, 3, 4, 5, 6};
    std::cout << "Before: ";
    for (const auto& val : test_data) {
        std::cout << val << " ";
    }
    std::cout << "\n";
    
    safeArrayProcess<int>(test_data);
    
    std::cout << "After: ";
    for (const auto& val : test_data) {
        std::cout << val << " ";
    }
    std::cout << "\n";
    
    return 0;
}
```


