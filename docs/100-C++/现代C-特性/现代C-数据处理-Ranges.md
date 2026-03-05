---
sidebar_position: 10
slug: /C++/现代C++特性/现代C++数据处理-Ranges
---

## 1. 总述
### 1.1. Ranges是什么
C++20 Ranges是一个全新的标准库组件，它提供了一种更加现代化、函数式的方式来处理序列数据。Ranges库的核心思想是将数据处理操作组合成管道（pipeline），类似于Unix命令行中的管道操作，让代码更加简洁、可读和高效。

### 1.2. 主要功能
1. **视图(Views)**：惰性求值的数据变换，不修改原始数据
2. **算法(Algorithms)**：增强版的STL算法，支持ranges和投影
3. **管道操作**：使用`|`操作符连接多个操作
4. **概念约束**：基于C++20概念的类型安全
5. **惰性求值**：只在需要时才进行计算
6. **组合性**：可以轻松组合多个操作

### 1.3. 核心优势
+ **简洁性**：减少样板代码，提高可读性
+ **安全性**：编译时类型检查，避免迭代器错误
+ **性能**：惰性求值和优化的实现
+ **组合性**：操作可以自由组合和重用

---

## 2. 用使用模板
### 2.1. 基本语法模板
```cpp
#include `<ranges>`
#include `<algorithm>`

// 1. 基本视图创建
auto view = container | std::views::view_name(参数);

// 2. 管道操作
auto result = container 
    | std::views::view1(参数1)
    | std::views::view2(参数2)
    | std::views::view3(参数3);

// 3. 算法应用
std::ranges::algorithm_name(range, 其他参数);

// 4. 组合模式
auto processed = source_range
    | std::views::filter(predicate)
    | std::views::transform(function)
    | std::views::take(n);
```

### 2.2. 常用视图模板
```cpp
// 过滤
auto filtered = container | std::views::filter([](const auto& x) { return 条件; });

// 变换
auto transformed = container | std::views::transform([](const auto& x) { return 变换函数(x); });

// 取前N个
auto first_n = container | std::views::take(n);

// 跳过前N个
auto skip_n = container | std::views::drop(n);

// 反转
auto reversed = container | std::views::reverse;

// 枚举（带索引）
auto enumerated = container | std::views::enumerate;
```

---

## 3. 具体使用示例
### 3.1. 基本视图操作
```cpp
#include `<ranges>`
#include `<vector>`
#include `<iostream>`

``std::`vector`<int>` numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// 过滤偶数
auto evens = numbers | std::views::filter([](int x) { return x % 2 == 0; });

// 平方变换
auto squares = numbers | std::views::transform([](int x) { return x * x; });

// 取前5个
auto first_five = numbers | std::views::take(5);
```

### 3.2. 管道组合操作
```cpp
// 组合多个操作：过滤偶数 -> 平方 -> 取前3个
auto result = numbers
    | std::views::filter([](int x) { return x % 2 == 0; })
    | std::views::transform([](int x) { return x * x; })
    | std::views::take(3);

// 输出结果
for (int value : result) {
    std::cout `<< value << " ";  // 输出: 4 16 36
}
```

### 3.3. 算法使用
```cpp
// 查找
auto it = std::ranges::find(numbers, 5);

// 排序
std::ranges::sort(numbers);

// 计数
auto count = std::ranges::count_if(numbers, [](int x) { return x >` 5; });
```

---

## 4. 完整代码示例
### 4.1. 示例1：数据处理管道
```cpp
#include `<ranges>`
#include `<vector>`
#include `<string>`
#include `<iostream>`
#include `<algorithm>`

int main() {
    // 原始数据
    ``std::`vector`<std::string>` words = {
        "hello", "world", "cpp", "ranges", "are", "awesome", "programming", "fun"
    };
    
    std::cout `<< "=== 数据处理管道示例 ===\n";
    
    // 管道操作：过滤长度>`3的单词 -> 转大写 -> 取前4个
    auto processed = words
        | std::views::filter([](const std::string& s) { return s.length() > 3; })
        | std::views::transform([](const std::string& s) {
            std::string upper = s;
            std::ranges::transform(upper, upper.begin(), ::toupper);
            return upper;
        })
        | std::views::take(4);
    
    std::cout `<< "处理后的单词: ";
    for (const auto& word : processed) {
        std::cout << word << " ";
    }
    std::cout << "\n\n";
    
    return 0;
}
```

### 4.2. 示例2：数值计算和统计
```cpp
#include <ranges>`
#include `<vector>`
#include `<numeric>`
#include `<iostream>`
#include `<algorithm>`

int main() {
    std::cout `<< "=== 数值计算示例 ===\n";
    
    // 生成数据
    auto numbers = std::views::iota(1, 21);  // 1到20的数字
    
    // 示例1：计算偶数的平方和
    auto even_squares_sum = std::ranges::fold_left(
        numbers 
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; }),
        0,
        std::plus<>`{}
    );
    
    std::cout `<< "偶数平方和: " << even_squares_sum << "\n";
    
    // 示例2：找出所有质数
    auto is_prime = [](int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; ++i) {
            if (n % i == 0) return false;
        }
        return true;
    };
    
    auto primes = numbers | std::views::filter(is_prime);
    
    std::cout << "质数: ";
    for (int prime : primes) {
        std::cout << prime << " ";
    }
    std::cout << "\n";
    
    // 示例3：分组处理
`std::vector<int>`data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    
    // 按奇偶分组处理
    auto odds = data | std::views::filter([](int x) { return x % 2 == 1; });
    auto evens = data | std::views::filter([](int x) { return x % 2 == 0; });
    
    std::cout `<< "奇数: ";
    for (int odd : odds) {
        std::cout << odd << " ";
    }
    std::cout << "\n";
    
    std::cout << "偶数: ";
    for (int even : evens) {
        std::cout << even << " ";
    }
    std::cout << "\n\n";
    
    return 0;
}
```

### 4.3. 示例3：复杂数据结构处理
```cpp
#include <ranges>`
#include `<vector>`
#include `<string>`
#include `<iostream>`
#include `<algorithm>`

struct Person {
    std::string name;
    int age;
    std::string city;
    
    // 用于输出
    friend std::ostream& operator`<<(std::ostream& os, const Person& p) {
        return os << p.name << "(" << p.age << ", " << p.city << ")";
    }
};

int main() {
    std::cout << "=== 复杂数据结构处理示例 ===\n";
    
    // 原始数据
`std::vector<Person>`people = {
        {"Alice", 25, "New York"},
        {"Bob", 30, "London"},
        {"Charlie", 35, "Tokyo"},
        {"Diana", 28, "New York"},
        {"Eve", 32, "London"},
        {"Frank", 27, "Paris"}
    };
    
    // 示例1：查找特定城市的年轻人
    std::cout `<< "纽约的30岁以下人员:\n";
    auto young_ny = people
        | std::views::filter([](const Person& p) { 
            return p.city == "New York" && p.age < 30; 
        });
    
    for (const auto& person : young_ny) {
        std::cout << "  " << person << "\n";
    }
    
    // 示例2：按年龄排序并获取姓名
    std::cout << "\n按年龄排序的姓名:\n";
    
    // 创建副本用于排序
`std::vector<Person>`sorted_people = people;
    std::ranges::sort(sorted_people, {}, &Person::age);
    
    auto names = sorted_people
        | std::views::transform([](const Person& p) { return p.name; });
    
    for (const auto& name : names) {
        std::cout `<< "  " << name << "\n";
    }
    
    // 示例3：统计信息
    auto cities = people
        | std::views::transform([](const Person& p) { return p.city; });
    
    std::cout << "\n所有城市: ";
    for (const auto& city : cities) {
        std::cout << city << " ";
    }
    std::cout << "\n";
    
    // 计算平均年龄
    auto ages = people | std::views::transform(&Person::age);
    auto total_age = std::ranges::fold_left(ages, 0, std::plus<>`{});
    double average_age = `static_cast`<double>`(total_age) / people.size();
    
    std::cout `<< "平均年龄: " << average_age << "\n\n";
    
    return 0;
}
```

### 4.4. 示例4：惰性求值和无限序列
```cpp
#include <ranges>`
#include `<iostream>`
#include `<vector>`

int main() {
    std::cout << "=== 惰性求值和无限序列示例 ===\n";
    
    // 示例1：无限序列（斐波那契数列）
    auto fibonacci = []() {
        return std::views::iota(0)
            | std::views::transform([](int n) {
                if (n <= 1) return n;
                int a = 0, b = 1;
                for (int i = 2; i <= n; ++i) {
                    int temp = a + b;
                    a = b;
                    b = temp;
                }
                return b;
            });
    };
    
    // 取前10个斐波那契数
    std::cout << "前10个斐波那契数: ";
    for (int fib : fibonacci() | std::views::take(10)) {
        std::cout << fib << " ";
    }
    std::cout << "\n";
    
    // 示例2：惰性计算（只在需要时计算）
    auto expensive_computation = [](int x) {
        std::cout << "计算 " << x << " 的平方\n";
        return x * x;
    };
    
    auto lazy_squares = std::views::iota(1, 11)
        | std::views::transform(expensive_computation);
    
    std::cout << "\n创建了惰性视图，但还没有计算\n";
    std::cout << "现在取前3个值:\n";
    
    for (int square : lazy_squares | std::views::take(3)) {
        std::cout << "结果: " << square << "\n";
    }
    
    // 示例3：链式操作的惰性求值
    std::cout << "\n链式惰性操作:\n";
    auto chain = std::views::iota(1, 100)
        | std::views::filter([](int x) { 
            std::cout << "过滤 " << x << "\n";
            return x % 3 == 0; 
        })
        | std::views::transform([](int x) { 
            std::cout << "变换 " << x << "\n";
            return x * 2; 
        })
        | std::views::take(3);
    
    std::cout << "开始迭代:\n";
    for (int value : chain) {
        std::cout << "最终值: " << value << "\n";
    }
    
    return 0;
}
```

---

## 5. 常用Ranges视图和算法
### 5.1. 视图(Views)表格
| 视图 | 功能 | 示例 |
| --- | --- | --- |
| `filter` | 过滤元素 | `data | std::views::filter(predicate)` |
| `transform` | 变换元素 | `data | std::views::transform(func)` |
| `take` | 取前N个 | `data | std::views::take(5)` |
| `drop` | 跳过前N个 | `data | std::views::drop(3)` |
| `reverse` | 反转 | `data | std::views::reverse` |
| `enumerate` | 添加索引 | `data | std::views::enumerate` |
| `zip` | 组合多个范围 | `std::views::zip(range1, range2)` |
| `iota` | 生成序列 | `std::views::iota(1, 10)` |
| `split` | 分割字符串 | `str | std::views::split(' ')` |
| `join` | 连接范围 | `ranges | std::views::join` |


### 5.2. 算法(Algorithms)表格
| 算法 | 功能 | 示例 |
| --- | --- | --- |
| `find` | 查找元素 | `std::ranges::find(range, value)` |
| `find_if` | 条件查找 | `std::ranges::find_if(range, predicate)` |
| `sort` | 排序 | `std::ranges::sort(range)` |
| `count` | 计数 | `std::ranges::count(range, value)` |
| `count_if` | 条件计数 | `std::ranges::count_if(range, predicate)` |
| `all_of` | 全部满足 | `std::ranges::all_of(range, predicate)` |
| `any_of` | 任一满足 | `std::ranges::any_of(range, predicate)` |
| `none_of` | 全不满足 | `std::ranges::none_of(range, predicate)` |
| `fold_left` | 左折叠 | `std::ranges::fold_left(range, init, op)` |
| `for_each` | 遍历执行 | `std::ranges::for_each(range, func)` |


