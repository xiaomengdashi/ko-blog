---
sidebar_position: 2
slug: /C++/现代C++现代特性/现代C++的输入输出
---

### 1. 总述
本文档旨在全面介绍现代C++（C++11及以后版本）中的输入输出相关特性和改进。随着C++标准的不断演进，输入输出系统也得到了显著的增强和优化，为开发者提供了更加强大、灵活和高效的I/O解决方案。

本文档将详细介绍以下现代C++输入输出特性：

1. **基于流的I/O系统** - C++传统的流式输入输出机制
2. **std::syncstream** - C++20引入的同步流，解决多线程输出同步问题
3. **std::println** - C++23引入的现代化打印函数
4. **std::format** - C++20引入的格式化字符串库
5. **文件系统库（std::filesystem）** - C++17引入的现代文件系统操作接口

每个特性将按照概念介绍、常用API通用使用模板、具体使用和示例代码的结构进行详细阐述。

---

### 2. 基于流的I/O系统
#### 2.1. 概念
基于流的I/O是C++的核心输入输出机制，通过流对象（stream objects）来处理数据的输入和输出。流提供了一种统一的接口来处理不同类型的I/O设备，包括控制台、文件、字符串等。主要包括输入流（istream）、输出流（ostream）和双向流（iostream）。

#### 2.2. 常用API通用使用模板
**标准输入输出流模板：**

```cpp
// 基本输入输出模板
std::cin >> variable;                    // 从标准输入读取
std::cout `<< value << std::endl;         // 输出到标准输出并换行
std::cerr << error_message << std::endl; // 错误输出（无缓冲）
std::clog << log_message << std::endl;   // 日志输出（有缓冲）

// 读取整行模板
std::string line;
std::getline(std::cin, line);

// 流状态检查模板
if (stream.good()) { /* 流状态正常 */ }
if (stream.eof()) { /* 到达文件末尾 */ }
if (stream.fail()) { /* 操作失败 */ }
if (stream.bad()) { /* 严重错误 */ }
```

**文件流操作模板：**

```cpp
// 文件输入流模板
std::ifstream input_file("filename.txt");
if (input_file.is_open()) {
    std::string line;
    while (std::getline(input_file, line)) {
        // 处理每一行
    }
    input_file.close();
}

// 文件输出流模板
std::ofstream output_file("filename.txt");
if (output_file.is_open()) {
    output_file << "content" << std::endl;
    output_file.close();
}

// 双向文件流模板
std::fstream file("filename.txt", std::ios::in | std::ios::out);
if (file.is_open()) {
    // 读写操作
    file.close();
}

// 文件模式组合模板
std::ios::in          // 读取模式
std::ios::out         // 写入模式
std::ios::app         // 追加模式
std::ios::trunc       // 截断模式
std::ios::binary      // 二进制模式
```

**字符串流操作模板：**

```cpp
// 输入字符串流模板
std::istringstream iss("input string");
DataType value;
iss >`> value;

// 输出字符串流模板
std::ostringstream oss;
oss `<< "formatted " << value;
std::string result = oss.str();

// 双向字符串流模板
std::stringstream ss;
ss << "input data";
ss >`> output_variable;
```

**格式化操作符模板：**

```cpp
// 数值格式化模板
std::cout `<< std::dec << value;          // 十进制
std::cout << std::hex << value;          // 十六进制
std::cout << std::oct << value;          // 八进制
std::cout << std::showbase << std::hex << value; // 显示进制前缀

// 浮点数格式化模板
std::cout << std::fixed << std::setprecision(2) << float_value;
std::cout << std::scientific << float_value;
std::cout << std::defaultfloat << float_value;

// 字段宽度和对齐模板
std::cout << std::setw(10) << value;              // 设置字段宽度
std::cout << std::left << std::setw(10) << value; // 左对齐
std::cout << std::right << std::setw(10) << value;// 右对齐
std::cout << std::setfill('*') << std::setw(10) << value; // 填充字符

// 布尔值格式化模板
std::cout << std::boolalpha << bool_value;   // 输出true/false
std::cout << std::noboolalpha << bool_value; // 输出1/0
```

#### 2.3. 具体使用
```cpp
// 基本输入输出
int number;
std::cin >`> number;
std::cout `<< "输入的数字是: " << number << std::endl;

// 读取一行
std::string line;
std::getline(std::cin, line);

// 检查流状态
if (std::cin.good()) { /* 流状态正常 */ }
if (std::cin.eof()) { /* 到达文件末尾 */ }
if (std::cin.fail()) { /* 操作失败 */ }

// 文件操作
std::ofstream file("output.txt");
file << "Hello, File!" << std::endl;
file.close();

// 字符串流
std::stringstream ss;
ss << "数字: " << 42;
std::string result = ss.str();
```

#### 2.4. 示例代码
```cpp
#include <iostream>`
#include `<fstream>`
#include `<sstream>`
#include `<iomanip>`

int main() {
    // 标准输入输出
    std::cout `<< "请输入一个数字: ";
    int num;
    std::cin >`> num;
    std::cout `<< "您输入的是: " << num << std::endl;
    
    // 格式化输出
    double pi = 3.14159;
    std::cout << std::fixed << std::setprecision(2) << "π ≈ " << pi << std::endl;
    std::cout << std::setw(8) << std::setfill('0') << 42 << std::endl;
    
    // 文件操作
    std::ofstream outFile("test.txt");
    outFile << "Hello, World!" << std::endl;
    outFile.close();
    
    std::ifstream inFile("test.txt");
    std::string content;
    std::getline(inFile, content);
    std::cout << "文件内容: " << content << std::endl;
    inFile.close();
    
    // 字符串流
    std::stringstream ss;
    ss << "数字: " << 123 << ", 文本: " << "test";
    std::cout << ss.str() << std::endl;
    
    return 0;
}
```

---

### 3. std::syncstream (C++20)
#### 3.1. 概念
`std::syncstream` 是C++20引入的同步流包装器，主要解决多线程环境下输出流的同步问题。它确保在多线程程序中，每个线程的输出不会相互交错，提供线程安全的输出操作。syncstream通过内部缓冲机制，将多个输出操作作为一个原子单元进行处理。

**核心特性：**

+ 线程安全的输出操作
+ 原子性输出（一次性刷新到底层流）
+ 自动同步管理
+ 与现有流接口兼容

#### 3.2. 常用API通用使用模板
**基本同步流模板：**

```cpp
#include <syncstream>`

// 创建同步输出流模板
std::osyncstream sync_stream(underlying_stream);
sync_stream `<< "thread-safe output" << std::endl;
// 析构时自动emit到底层流

// 手动控制emit模板
std::osyncstream sync_stream(underlying_stream);
sync_stream << "buffered output";
sync_stream.emit(); // 立即刷新到底层流

// 获取底层流模板
auto& wrapped = sync_stream.get_wrapped();
```

**多线程使用模板：**

```cpp
// 线程函数模板
void thread_function(int thread_id) {
    std::osyncstream sync_cout(std::cout);
    sync_cout << "Thread " << thread_id << ": message" << std::endl;
    // 函数结束时自动emit
}

// 作用域控制模板
{
    std::osyncstream sync_cout(std::cout);
    sync_cout << "atomic output block" << std::endl;
} // 作用域结束时自动emit
```

**不同流的包装模板：**

```cpp
// 包装标准输出
std::osyncstream sync_cout(std::cout);

// 包装标准错误
std::osyncstream sync_cerr(std::cerr);

// 包装文件流
std::ofstream file("output.txt");
std::osyncstream sync_file(file);

// 包装字符串流
std::ostringstream oss;
std::osyncstream sync_oss(oss);
```

#### 3.3. 具体使用
```cpp
// 创建同步流
std::osyncstream sync_cout(std::cout);

// 正常使用流操作
sync_cout << "线程ID: " << std::this_thread::get_id() << std::endl;
sync_cout << "数据: " << 42 << std::endl;

// 手动刷新（可选，析构时会自动刷新）
sync_cout.emit();

// 获取被包装的流
auto& wrapped_stream = sync_cout.get_wrapped();

// 检查同步状态
if (sync_cout.get_wrapped() == std::cout) {
    // 确认包装的是标准输出
}
```

#### 3.4. 示例代码
```cpp
#include <iostream>`
#include `<syncstream>`
#include `<thread>`
#include `<vector>`

void safe_worker(int id) {
    std::osyncstream sync_cout(std::cout);
    for (int i = 0; i < 3; ++i) {
        sync_cout `<< "线程" << id << ": 消息" << i << std::endl;
    }
    // 析构时自动emit
}

void unsafe_worker(int id) {
    for (int i = 0; i < 3; ++i) {
        std::cout << "线程" << id << ": 消息" << i << std::endl;
    }
}

int main() {
    std::cout << "=== 安全输出（使用syncstream）===" << std::endl;
`std::vector<std::thread>`threads;
    
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back(safe_worker, i);
    }
    for (auto& t : threads) {
        t.join();
    }
    
    threads.clear();
    std::cout `<< "\n=== 不安全输出（直接使用cout）===" << std::endl;
    
    for (int i = 0; i < 3; ++i) {
        threads.emplace_back(unsafe_worker, i);
    }
    for (auto& t : threads) {
        t.join();
    }
    
    return 0;
}
```

---

### 4. std::println (C++23)
#### 4.1. 概念
`std::println` 是C++23引入的现代化打印函数，提供了类似于其他现代编程语言的简洁打印接口。它基于 `std::format` 构建，自动添加换行符，并提供类型安全的格式化输出。相比传统的iostream，println提供了更简洁的语法和更好的性能。

#### 4.2. 常用API通用使用模板
**基本打印模板：**

```cpp
#include <print>`

// 简单文本输出模板
std::println("message");

// 格式化输出模板
std::println("format string with {} and {}", arg1, arg2);

// 指定输出流模板
std::println(stream, "format string", args...);

// 不自动换行模板
std::print("no newline");
std::print(stream, "format string", args...);
```

**数据类型格式化模板：**

```cpp
// 整数格式化模板
std::println("十进制: {}, 十六进制: {:x}, 二进制: {:b}", num, num, num);
std::println("带前缀: {:#x}, 填充: {:08d}", num, num);

// 浮点数格式化模板
std::println("默认: {}, 固定: {:.2f}, 科学: {:e}", val, val, val);
std::println("精度: {:.{}f}", value, precision);

// 字符串格式化模板
std::println("左对齐: '{:`<10}', 右对齐: '{:>`10}', 居中: '{:^10}'", str, str, str);
std::println("填充: '{:*^10}'", str);

// 布尔值格式化模板
std::println("布尔: {}, 字符串: {:s}", flag, flag);
```

**流输出模板：**

```cpp
// 标准输出模板
std::println(std::cout, "message to stdout");

// 标准错误模板
std::println(std::cerr, "error message");

// 文件输出模板
std::ofstream file("output.txt");
std::println(file, "message to file: {}", data);

// 字符串流输出模板
std::ostringstream oss;
std::println(oss, "message to string stream");
```

#### 4.3. 具体使用
```cpp
// 简单输出
std::println("Hello, World!");

// 格式化输出
int age = 25;
std::string name = "张三";
std::println("姓名: {}, 年龄: {}", name, age);

// 数字格式化
std::println("十六进制: {:x}, 二进制: {:b}", 255, 255);

// 浮点数格式化
std::println("π = {:.3f}", 3.14159);

// 输出到文件
std::ofstream file("output.txt");
std::println(file, "文件输出: {}", "内容");
```

#### 4.4. 示例代码
```cpp
#include `<print>`
#include `<string>`

int main() {
    // 基本使用
    std::println("欢迎使用 std::println!");
    
    // 变量输出
    std::string name = "李四";
    int age = 30;
    std::println("姓名: {}, 年龄: {}", name, age);
    
    // 数字格式化
    int num = 255;
    std::println("十进制: {}, 十六进制: {:x}, 二进制: {:b}", num, num, num);
    
    // 浮点数
    double pi = 3.14159;
    std::println("π = {:.2f}", pi);
    
    // 字符串对齐
    std::println("左对齐: '{:`<10}', 右对齐: '{:>`10}'", "hello", "world");
    
    // 不换行输出
    std::print("这是");
    std::print("同一行");
    std::println("");  // 手动换行
    
    return 0;
}
```

---

### 5. std::format (C++20)
#### 5.1. 概念
`std::format` 是C++20引入的现代字符串格式化库，提供了类型安全、高性能的字符串格式化功能。它采用了类似于Python的格式化语法，支持丰富的格式化选项，是传统sprintf的现代化替代方案。

#### 5.2. 常用API通用使用模板
**基本格式化模板：**

```cpp
#include `<format>`

// 基本格式化模板
std::string result = std::format("format string with {} and {}", arg1, arg2);

// 位置参数模板
std::string result = std::format("{1} {0} {2}", arg0, arg1, arg2);

// 重复使用参数模板
std::string result = std::format("{0} + {0} = {1}", value, result);
```

**输出到迭代器模板：**

```cpp
// 输出到容器模板
``std::`vector`<char>` buffer;
std::format_to(std::back_inserter(buffer), "format: {}", value);

// 输出到数组模板
char buffer[100];
auto result = std::format_to_n(buffer, sizeof(buffer)-1, "format: {}", value);
buffer[result.size] = '\0';

// 输出到字符串模板
std::string str;
std::format_to(std::back_inserter(str), "format: {}", value);
```

**大小计算模板：**

```cpp
// 计算格式化后大小模板
size_t size = std::formatted_size("format string: {}", value);
std::string result;
result.reserve(size);
std::format_to(std::back_inserter(result), "format string: {}", value);
```

**数值格式化模板：**

```cpp
// 整数格式化模板
std::format("{:d}", value);      // 十进制
std::format("{:x}", value);      // 十六进制小写
std::format("{:X}", value);      // 十六进制大写
std::format("{:o}", value);      // 八进制
std::format("{:b}", value);      // 二进制
std::format("{:#x}", value);     // 带前缀十六进制

// 浮点数格式化模板
std::format("{:f}", value);      // 固定小数点
std::format("{:.2f}", value);    // 指定精度
std::format("{:e}", value);      // 科学计数法小写
std::format("{:E}", value);      // 科学计数法大写
std::format("{:g}", value);      // 自动选择格式
std::format("{:G}", value);      // 自动选择格式大写
```

**字符串格式化模板：**

```cpp
// 对齐和宽度模板
std::format("{:`<10}", str);      // 左对齐，宽度10
std::format("{:>`10}", str);      // 右对齐，宽度10
std::format("{:^10}", str);      // 居中，宽度10
std::format("{:*^10}", str);     // 居中，用*填充

// 字符串截断模板
std::format("{:.5}", str);       // 最多显示5个字符
std::format("{:10.5}", str);     // 宽度10，最多5个字符
```

**自定义类型格式化模板：**

```cpp
// 简单自定义格式化器模板
template<>
struct `std::`formatter`<CustomType>` {
    constexpr auto parse(format_parse_context& ctx) {
        return ctx.begin();
    }
    
    auto format(const CustomType& obj, format_context& ctx) const {
        return std::format_to(ctx.out(), "CustomType({})", obj.value);
    }
};

// 支持格式说明符的格式化器模板
template<>
struct `std::`formatter`<CustomType>` {
    char format_type = 'd';
    
    constexpr auto parse(format_parse_context& ctx) {
        auto it = ctx.begin();
        if (it != ctx.end() && (*it == 'd' || *it == 'x')) {
            format_type = *it++;
        }
        return it;
    }
    
    auto format(const CustomType& obj, format_context& ctx) const {
        if (format_type == 'x') {
            return std::format_to(ctx.out(), "{:x}", obj.value);
        }
        return std::format_to(ctx.out(), "{}", obj.value);
    }
};
```

#### 5.3. 具体使用
```cpp
// 基本格式化
std::string msg = std::format("用户: {}, ID: {}", "张三", 123);

// 数字格式化
std::string hex = std::format("十六进制: {:x}", 255);  // "十六进制: ff"
std::string bin = std::format("二进制: {:b}", 15);     // "二进制: 1111"

// 浮点数格式化
std::string fixed = std::format("{:.2f}", 3.14159);   // "3.14"
std::string sci = std::format("{:e}", 1234.5);        // "1.234500e+03"

// 字符串对齐
std::string left = std::format("{:`<10}", "left");     // "left      "
std::string right = std::format("{:>`10}", "right");   // "     right"
std::string center = std::format("{:^10}", "center"); // "  center  "

// 填充字符
std::string filled = std::format("{:*^10}", "test");  // "***test***"
```

#### 5.4. 示例代码
```cpp
#include `<format>`
#include `<iostream>`
#include `<vector>`

struct Person {
    std::string name;
    int age;
};

// 为Person类型定义格式化器
template<>
struct `std::`formatter`<Person>` {
    constexpr auto parse(format_parse_context& ctx) {
        return ctx.begin();
    }
    
    auto format(const Person& p, format_context& ctx) const {
        return std::format_to(ctx.out(), "{}({}岁)", p.name, p.age);
    }
};

int main() {
    // 基本格式化
    std::string greeting = std::format("你好, {}!", "世界");
    std::cout `<< greeting << std::endl;
    
    // 数字格式化
    int num = 255;
    std::cout << std::format("十进制: {}, 十六进制: {:x}, 二进制: {:b}\n", 
                            num, num, num);
    
    // 浮点数格式化
    double pi = 3.14159;
    std::cout << std::format("π = {:.3f}\n", pi);
    
    // 字符串对齐
    std::cout << std::format("'{:<8}' '{:^8}' '{:>`8}'\n", "左", "中", "右");
    
    // 自定义类型
    Person person{"张三", 25};
    std::cout `<< std::format("人员信息: {}\n", person);
    
    return 0;
}
```

---

### 6. 文件系统库 (std::filesystem, C++17)
#### 6.1. 概念
`std::filesystem` 是C++17引入的现代文件系统操作库，提供了跨平台的文件和目录操作接口。它替代了传统的C风格文件操作函数，提供了更安全、更易用的面向对象接口，支持路径操作、文件属性查询、目录遍历等功能。

#### 6.2. 常用API通用使用模板
**路径操作模板：**

```cpp
#include <filesystem>`
namespace fs = std::filesystem;

// 路径构建模板
fs::path path = "directory";
fs::path full_path = path / "subdirectory" / "file.txt";
fs::path absolute_path = fs::absolute(relative_path);
fs::path canonical_path = fs::canonical(path);

// 路径分解模板
fs::path parent = path.parent_path();
fs::path filename = path.filename();
fs::path stem = path.stem();           // 不含扩展名的文件名
fs::path extension = path.extension();
fs::path root = path.root_path();
```

**文件检查模板：**

```cpp
// 存在性检查模板
if (fs::exists(path)) { /* 路径存在 */ }
if (fs::is_regular_file(path)) { /* 是普通文件 */ }
if (fs::is_directory(path)) { /* 是目录 */ }
if (fs::is_symlink(path)) { /* 是符号链接 */ }
if (fs::is_empty(path)) { /* 文件或目录为空 */ }

// 文件属性检查模板
uintmax_t size = fs::file_size(path);
fs::file_time_type time = fs::last_write_time(path);
fs::perms permissions = fs::status(path).permissions();
```

**文件操作模板：**

```cpp
// 复制操作模板
fs::copy_file(source, destination);
fs::copy_file(source, destination, fs::copy_options::overwrite_existing);
fs::copy(source_dir, dest_dir, fs::copy_options::recursive);

// 移动和重命名模板
fs::rename(old_path, new_path);

// 删除操作模板
fs::remove(path);           // 删除单个文件或空目录
fs::remove_all(path);       // 递归删除目录及其内容
```

**目录操作模板：**

```cpp
// 创建目录模板
fs::create_directory(path);        // 创建单级目录
fs::create_directories(path);      // 创建多级目录

// 目录遍历模板
for (const auto& entry : fs::directory_iterator(path)) {
    if (entry.is_regular_file()) {
        // 处理文件
    } else if (entry.is_directory()) {
        // 处理目录
    }
}

// 递归遍历模板
for (const auto& entry : fs::recursive_directory_iterator(path)) {
    // 处理所有子目录中的项目
}
```

**工作目录操作模板：**

```cpp
// 当前目录操作模板
fs::path current = fs::current_path();     // 获取当前目录
fs::current_path(new_path);                // 设置当前目录

// 临时目录模板
fs::path temp_dir = fs::temp_directory_path();
```

**空间信息模板：**

```cpp
// 磁盘空间信息模板
fs::space_info space = fs::space(path);
uintmax_t capacity = space.capacity;    // 总容量
uintmax_t free_space = space.free;      // 可用空间
uintmax_t available = space.available;  // 用户可用空间
```

**错误处理模板：**

```cpp
// 异常处理模板
try {
    fs::copy_file(source, dest);
} catch (const fs::filesystem_error& ex) {
    std::cerr `<< "文件系统错误: " << ex.what() << std::endl;
}

// 错误码处理模板
std::error_code ec;
fs::copy_file(source, dest, ec);
if (ec) {
    std::cerr << "错误: " << ec.message() << std::endl;
}
```

#### 6.3. 具体使用
```cpp
// 路径构建
fs::path file_path = fs::current_path() / "data" / "file.txt";

// 文件信息
if (fs::exists(file_path)) {
    auto size = fs::file_size(file_path);
    auto time = fs::last_write_time(file_path);
}

// 目录遍历
for (const auto& entry : fs::directory_iterator("./")) {
    if (entry.is_regular_file()) {
        std::cout << entry.path().filename() << std::endl;
    }
}

// 递归遍历
for (const auto& entry : fs::recursive_directory_iterator("./")) {
    std::cout << entry.path() << std::endl;
}

// 创建目录
fs::create_directories("path/to/nested/dirs");

// 复制和移动
fs::copy_file("source.txt", "dest.txt");
fs::rename("old_name.txt", "new_name.txt");
```

#### 6.4. 示例代码
```cpp
#include <filesystem>`
#include `<iostream>`
#include `<fstream>`

namespace fs = std::filesystem;

int main() {
    // 当前目录信息
    std::cout << "当前目录: " << fs::current_path() << std::endl;
    
    // 创建测试文件
    const fs::path test_file = "test_example.txt";
    std::ofstream file(test_file);
    file << "这是测试文件内容" << std::endl;
    file.close();
    
    // 文件信息
    if (fs::exists(test_file)) {
        std::cout << "文件存在" << std::endl;
        std::cout << "文件大小: " << fs::file_size(test_file) << " 字节" << std::endl;
        std::cout << "文件名: " << test_file.filename() << std::endl;
        std::cout << "扩展名: " << test_file.extension() << std::endl;
    }
    
    // 创建目录
    const fs::path test_dir = "test_directory";
    fs::create_directory(test_dir);
    
    // 复制文件到目录
    fs::copy_file(test_file, test_dir / "copied_file.txt");
    
    // 遍历目录
    std::cout << "\n目录内容:" << std::endl;
    for (const auto& entry : fs::directory_iterator(".")) {
        std::cout << entry.path().filename();
        if (entry.is_directory()) {
            std::cout << "/";
        }
        std::cout << std::endl;
    }
    
    // 清理
    fs::remove_all(test_dir);
    fs::remove(test_file);
    
    return 0;
}
```

