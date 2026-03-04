---
sidebar_position: 6
---

## 总述
- 传统流式IO扩展
- std::format(C++20) - 格式化库
- std::print (C++23) - 基于std::format的格式化输出库
- std::syncstream(C++20) - 同步输出流包装器，用于多线程环境下的安全输出


## 一. 分析C和C++输入输出流的缓冲机制

### 1. C标准库的缓冲机制

C标准库的I/O系统基于FILE*结构，每个FILE*对象都包含一个内部缓冲区：

- **全缓冲（Full Buffering）**：当缓冲区满时才进行实际的I/O操作
- **行缓冲（Line Buffering）**：遇到换行符时进行I/O操作（通常用于终端）
- **无缓冲（No Buffering）**：立即进行I/O操作（如stderr）

C标准库的三个标准流：
- `stdin`：标准输入，通常行缓冲
- `stdout`：标准输出，连接到终端时行缓冲，否则全缓冲
- `stderr`：标准错误，通常无缓冲

### 2. C++标准库的缓冲机制

C++的iostream库建立在streambuf类层次之上：

- **basic_streambuf**：提供缓冲区管理的基础设施
- **输入缓冲区**：由eback()、gptr()、egptr()三个指针管理
- **输出缓冲区**：由pbase()、pptr()、epptr()三个指针管理

C++的标准流对象：
- `std::cin`：对应stdin
- `std::cout`：对应stdout  
- `std::cerr`：对应stderr，无缓冲
- `std::clog`：对应stderr，但有缓冲

### 3. C和C++缓冲区是否为同一个
**答案：在默认情况下，C++流和C流使用相同的底层缓冲区。**
具体来说：
1. **实现层面**：大多数C++标准库实现中，`std::cout`的streambuf内部会包装或直接使用`stdout`的FILE*结构
2. **缓冲区共享**：当流同步开启时（默认状态），C++流会：
   - 使用C标准库的缓冲区
   - 或者维护与C流缓冲区同步的机制

#### (1) 流同步
**流同步（Stream Synchronization）**指的是C++标准流（iostream）与C标准流（stdio）之间的协调机制，确保两套I/O系统的输出顺序正确。
##### 具体行为
1. **缓冲区协调**：确保C++流和C流的缓冲区内容按正确顺序输出
2. **刷新同步**：在适当时机强制刷新缓冲区
3. **顺序保证**：维护混合使用C++流和C流时的输出顺序

#### (2)  为什么要进行流同步
##### 1. 兼容性需求
**历史兼容性**：C++需要与现有的C代码库兼容，许多程序混合使用printf/scanf和cout/cin。

##### 2. 输出顺序保证
**问题场景**：
```cpp
// 没有同步时可能出现的问题
std::cout << "Hello ";
printf("World ");
std::cout << "from C++\n";
// 可能输出：World Hello from C++
```
**同步解决**：确保输出按代码顺序出现："Hello World from C++"

##### 3. 缓冲区一致性
**数据完整性**：防止缓冲区中的数据丢失或重复输出。

##### 4. 线程安全考虑
**多线程环境**：在某些实现中，同步机制也涉及线程安全的考虑。


### 4. C++流同步的具体实现

#### (1). 默认同步机制

当`sync_with_stdio(true)`时（默认状态），C++流会：

##### 输出同步策略：
- **每次输出前检查**：在向C++流写入前，检查C流缓冲区状态
- **强制刷新**：必要时强制刷新C流缓冲区
- **缓冲区协调**：确保两套缓冲系统的一致性

##### 输入同步策略：
- **输入前同步**：从C++流读取前，确保C流的输入缓冲区状态正确
- **位置同步**：维护文件指针位置的一致性

##### 同步的性能开销
1. **额外的系统调用**：频繁的缓冲区检查和刷新
2. **虚函数调用**：同步机制通常通过虚函数实现
3. **锁机制**：某些实现使用锁来保证线程安全

#### (2) std::endl为什么慢
**std::endl 慢的根本原因是它 不仅仅输出换行符，还会强制刷新输出缓冲区** 。
**所以换行如果在意性能那就直接输出`\n`**


## 二 .C++流式IO的一些"高级"用法

#### 格式化操作

**代码示例：**
```cpp
#include <iostream>
#include <iomanip>

int main() {
    // 三个测试变量
    int hexNum = 255;           // 用于十六进制输出
    double precisionNum = 3.14159;  // 用于精度控制
    int widthNum = 42;          // 用于宽度设置
    
    // 1. 十六进制输出
    std::cout << "十六进制: " << std::hex << hexNum << std::endl;
    
    // 2. 精度控制（两位小数）
    std::cout << "两位精度: " << std::fixed << std::setprecision(2) << precisionNum << std::endl;
    
    // 3. 指定宽度（10个字符宽度）
    std::cout << "指定宽度: [" << std::setw(10) << widthNum << "]" << std::endl;
    
    return 0;
}
```

#### stringstream的流式操作

**获取输入位置函数：**

```cpp
std::streampos tellg();
```

返回值：当前输入位置

**获取输出位置函数：**

```cpp
std::streampos tellp();
```

返回值：当前输出位置

**设置输入位置函数：**

```cpp
std::istream& seekg(std::streampos pos);
```

参数：pos - 新的输入位置
返回值：流的引用

**设置输出位置函数：**

```cpp
std::ostream& seekp(std::streampos pos);
```

参数：pos - 新的输出位置
返回值：流的引用

**流式操作的特点：**

stringstream支持链式操作，可以连续使用`<<`和`>>`操作符进行数据的插入和提取，这种流式操作具有以下优势：
- **类型安全**：编译时确定类型转换
- **可读性强**：操作符直观表达数据流向
- **状态保持**：自动维护解析位置和状态

**代码示例：**

```cpp
#include <sstream>
#include <string>
#include <iostream>

int main() {
    // 流式构建字符串
    std::ostringstream oss;
    oss << "姓名: " << "张三" << ", 年龄: " << 25 << ", 分数: " << 95.5;
    std::string result = oss.str();
    
    // 流式解析字符串
    std::string data = "123 456.78 hello";
    std::istringstream iss(data);
    int num;
    double decimal;
    std::string word;
    iss >> num >> decimal >> word;  // 连续提取不同类型
    
    // 重置和重用
    iss.clear();  // 清除状态
    iss.str("789 world");  // 设置新内容
    int new_num;
    std::string new_word;
    iss >> new_num >> new_word;
    
    return 0;
}
```

#### ofstream的自定义缓冲区

**获取/设置streambuf函数：**

```cpp
std::streambuf* rdbuf(std::streambuf* sb);
```

参数：sb - 新的streambuf指针
返回值：之前的streambuf指针

**设置缓冲区函数：**

```cpp
std::streambuf* pubsetbuf(char* s, std::streamsize n);
```

参数：s - 缓冲区指针，nullptr表示无缓冲
参数：n - 缓冲区大小
返回值：this指针

**同步缓冲区函数：**

```cpp
int pubsync();
```

返回值：成功返回0，失败返回-1

**刷新输出函数：**

```cpp
std::ostream& flush();
```

返回值：流的引用

**启用单元缓冲manipulator：**

```cpp
std::ios_base& unitbuf(std::ios_base& str);
```

参数：str - 流对象引用
返回值：流对象引用

**禁用单元缓冲manipulator：**

```cpp
std::ios_base& nounitbuf(std::ios_base& str);
```

参数：str - 流对象引用
返回值：流对象引用

**代码示例：**

```cpp
#include <fstream>
#include <iostream>
#include <memory>

int main() {
    // 创建大缓冲区以提高性能
    const size_t buffer_size = 64 * 1024; // 64KB
    std::unique_ptr<char[]> buffer(new char[buffer_size]);
    
    std::ofstream file("output.txt");
    
    // 设置自定义缓冲区
    file.rdbuf()->pubsetbuf(buffer.get(), buffer_size);
    
    // 大量数据写入，减少系统调用次数
    for (int i = 0; i < 10000; ++i) {
        file << "数据行 " << i << "\n";
    }
    
    // 手动控制同步时机
    file.rdbuf()->pubsync();  // 强制写入磁盘
    
    // 设置无缓冲模式（立即写入）
    file.rdbuf()->pubsetbuf(nullptr, 0);
    file << "立即写入的重要数据\n";
    
    return 0;
}
```


## 三. std::format (C++20)

### 1. 功能和特点

`std::format`是C++20引入的现代字符串格式化库，提供了类似Python和Rust风格的字符串格式化的功能

**关于std::format相关官方文档链接：**
1. format格式化总文档：https://cppreference.cn/w/cpp/utility/format
2. std::format用法：https://cppreference.cn/w/cpp/utility/format/format
3. std::format_to用法 : https://cppreference.cn/w/cpp/utility/format/format_to
4. std::format标准格式规范：https://cppreference.cn/w/cpp/utility/format/spec
5. 标准库已经特化的std::formatter（支持哪些非基本类型,以及对应格式化参数说明） https://cppreference.cn/w/cpp/utility/format/formatter
6. 自定义format的相关说明（需要实现的接口要求):  https://cppreference.cn/w/cpp/named_req/BasicFormatter

### 3. 使用方法

```cpp
#include <format>
#include <iostream>
#include <string>

int main() {
  // 基本用法
  std::string name = "张三";
  int age = 25;
  std::string result = std::format("姓名: {}, 年龄: {}", name, age);
  std::cout << result << std::endl;
  // 位置参数
  std::string msg = std::format("{1}今年{0}岁", age, name);
  std::cout << msg << std::endl;
  // 格式化选项
  double pi = 3.14159;
  std::string formatted = std::format("π ≈ {:.2f}", pi);
  std::cout << formatted << std::endl;
  // 进制和宽度
  int num = 42;
  std::string hex = std::format("十六进制: {:#x}", num);
  std::string padded = std::format("填充: {:0>8}", num);
  std::cout << hex << std::endl;
  std::cout << padded << std::endl;
  return 0;
}
```

### 4. 自定义format

#### 自定义format的方法：
要为自定义类型实现格式化支持，需要特化`std::formatter`模板，并实现两个关键方法：
```cpp
// 特化std::formatter
template<>
struct std::formatter<TYPE> {
    // 解析格式说明符
    constexpr auto parse(format_parse_context& ctx) {}   
    // 执行格式化
    auto format(const TYPE& p, format_context& ctx) const{}    
};
```
#### parse方法

```cpp
constexpr auto parse(format_parse_context& ctx);
```

参数：ctx - 解析上下文，包含格式说明符
返回值：指向格式说明符解析结束位置的迭代器
作用：解析格式化字符串中的格式说明符（如`{:c.2}`中的"c.2"部分）
注意：注意ctx的迭代器的begin指向指向正在格式化的替换字段的 format-spec 在格式字符串中的开头 ： 如果是`{:n}`，那begin就指向n；如果是`{}`，begin就指向`'}'`

#### format方法

```cpp
auto format(const T& value, format_context& ctx) const;
```

参数：value - 要格式化的对象
参数：ctx - 格式化上下文，包含输出迭代器
返回值：指向输出结束位置的迭代器
作用：执行实际的格式化操作，将对象转换为字符串并输出

### 5. 完整代码示例

```cpp
#include <format>
#include <iostream>
#include <string>

// 自定义结构体
struct Person1 {
  std::string name;
  int age;
};

// 最简单自定义格式化
template <> struct std::formatter<Person1> {
  // 注意返回值一定是constexpr auto类型
  constexpr auto parse(format_parse_context &ctx) { return ctx.begin(); }
  // 注意返回值一定要是const类型
  auto format(const Person1 &p, format_context &ctx) const {
    return format_to(ctx.out(), "{} ({})", p.name, p.age);
  }
};
// 自定义结构体
struct Person2 {
  std::string name;
  int age;
};
// 更丰富自定义格式化
//{:n}只输出姓名，{:a}只输出年龄,{}全输出
template <> struct std::formatter<Person2> {
private:
  char flag = '\0'; // 定义一个flag
public:
  // 注意返回值一定是constexpr auto类型
  constexpr auto parse(format_parse_context &ctx) {
    // 注意ctx的迭代器的begin指向指向正在格式化的替换字段的 format-spec 在
    // 格式字符串中的开头
    //  fmt	-	表示格式化字符串的对象。格式化字符串由以下部分组成：
    // { arg-id (可选) }	(1)
    // { arg-id (可选) : format-spec }	(2)
    // 1) 没有格式规范的替换字段
    // 2) 带有格式规范的替换字段
    // arg-id	-	指定 args
    // 中参数的索引，其值将用于格式化；如果省略，则按顺序使用参数。 format-spec
    // -	由相应参数的 std::formatter 特化定义的格式规范。不能以 } 开头。

    // 如果是{:n}，那begin就指向n；如果是{}，begin就指向'}'
    auto it = ctx.begin();
    if (it == ctx.end() || *it == '}') {
      return ctx.begin();
    }

    flag = *it;
    if (flag == 'n' || flag == 'a') {
      return ++it;
    } else {
      throw format_error("invalid format");
    }
  }
  // 注意返回值一定要是const类型
  auto format(const Person2 &p, format_context &ctx) const {
    if (flag == 'n') {
      return format_to(ctx.out(), "{}", p.name);
    } else if (flag == 'a') {
      return format_to(ctx.out(), "{}", p.age);
    } else if (flag == '\0') {
      return format_to(ctx.out(), "{} ({})", p.name, p.age);
    } else {
      throw format_error("invalid format");
    }
  }
};
void demo1() {
  Person1 john{"John", 30};
  std::string result = std::format("{}", john);
  std::cout << result << std::endl;
}
void demo2() {
  Person2 john{"John", 30};
  std::string result1 = std::format("{}", john);
  std::string result2 = std::format("{:a}", john);
  std::string result3 = std::format("{:n}", john);
  std::cout << std::format("res1:{},res2:{},res3:{}", result1, result2, result3)
            << std::endl;
}

int main() {
  demo1();
  demo2();
  return 0;
}
```

## 四. std::print (C++23)

### 1. 功能和特点

`std::print`是C++23引入的现代输出函数，结合了`std::format`的强大格式化能力和直接输出功能：

**本身特点：**
- **简洁语法**：一步完成格式化和输出
- **高性能**：避免中间字符串创建
- **Unicode支持**：原生支持Unicode输出
- **错误处理**：更好的错误处理机制

**与format的关系：**
- `std::print`内部使用`std::format`进行格式化
- 可以看作是`std::format`的直接输出版本
- 支持所有`std::format`的格式化选项


### 3. 使用方法

```cpp
#include <print>
#include <iostream>

int main() {
    // 基本用法 - 输出到stdout
    std::print("Hello, World!\n");
    
    // 格式化输出
    std::string name = "Alice";
    int score = 95;
    std::print("学生 {} 的分数是 {}\n", name, score);
    
    // 输出到指定文件
    std::print(stderr, "错误信息: {}\n", "文件未找到");
    
    // 复杂格式化
    double value = 123.456789;
    std::print("格式化数值: {:.2f}\n", value);
    
    return 0;
}
```

### 4. 简单代码示例

```cpp
#include <print>
#include <vector>

int main() {
    // 基本数据类型
    std::print("整数: {}, 浮点数: {:.3f}\n", 42, 3.14159);
    
    // 自定义类型（使用前面定义的Point）
    Point p(1.5, 2.5);
    std::print("点坐标: {}\n", p);
    std::print("向量形式: {:v}\n", p);
    
    // 条件输出
    bool success = true;
    std::print("操作{}: {}\n", success ? "成功" : "失败", 
               success ? "✓" : "✗");
    
    return 0;
}
```

## 五. std::syncstream

### 1. 功能和特点

`std::syncstream`（C++20）是一个同步输出流包装器，主要用于多线程环境下的安全输出：

- **线程安全**：保证多线程输出不会交错
- **原子性**：整个输出操作作为一个原子单元
- **性能优化**：减少锁竞争
- **兼容性**：与现有流完全兼容

### 2. 主要API函数声明

#### 构造函数

```cpp
std::osyncstream::osyncstream(std::ostream& os);
```

参数：os - 要包装的输出流

#### 获取包装的流函数

```cpp
std::ostream* get_wrapped() const noexcept;
```

返回值：被包装的流指针

#### 手动发出输出函数

```cpp
void emit();
```

作用：立即将缓冲的内容输出到包装的流


### 3. 使用方法和示例

```cpp
#include <syncstream>
#include <iostream>
#include <thread>
#include <vector>

// 使用syncstream的安全示例
void safe_output(int id) {
    for (int i = 0; i < 5; ++i) {
        std::osyncstream(std::cout) << "线程 " << id << " 输出: " << i << std::endl;
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
}

// 批量输出示例
void batch_output(int id) {
    std::osyncstream sync_out(std::cout);
    
    sync_out << "=== 线程 " << id << " 开始 ===\n";
    for (int i = 0; i < 3; ++i) {
        sync_out << "  项目 " << i << ": 值 = " << (i * id) << "\n";
    }
    sync_out << "=== 线程 " << id << " 结束 ===\n";
    
    // 析构时自动同步输出
}

int main() {
    std::cout << "=== 安全输出示例 ===\n";
    {
        std::vector<std::thread> threads;
        for (int i = 0; i < 3; ++i) {
            threads.emplace_back(safe_output, i);
        }
        for (auto& t : threads) {
            t.join();
        }
    }
    
    std::cout << "\n=== 批量输出示例 ===\n";
    {
        std::vector<std::thread> threads;
        for (int i = 0; i < 3; ++i) {
            threads.emplace_back(batch_output, i);
        }
        for (auto& t : threads) {
            t.join();
        }
    }
    
    return 0;
}
```

