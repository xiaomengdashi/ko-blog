---
sidebar_position: 1
slug: /C++/STL/80万年薪C++岗位，掌握STL和你是否一样
---

![](/img/posts/50150ffe1bf7f471cf9bb024a7e55fe1.png)

# 一：STL（标准模板库基础）
**1：认识STL**

C++ STL（Standard Template Library）是C++编程语言中的一个重要组成部分，它提供了一系列通用的模板类和函数，旨在减少编程中重复的代码编写工作，提高代码的复用性、可读性以及开发效率。它涵盖了多种常用的数据结构和算法，让开发者可以方便地操作数据、处理各种常见的编程任务。

**2：常见的数据结构**

STL基于多种常见的数据结构来实现其容器，主要的数据结构包括：

+ 数组（Array）：一种连续存储元素的数据结构，具有固定大小，访问元素速度快，通过索引直接获取元素。
+ 链表（Linked List）：由节点组成，每个节点包含数据和指向下一节点的指针，动态分配内存，插入和删除元素相对灵活。
+ 栈（Stack）：遵循后进先出（LIFO）原则的数据结构，只能在一端（栈顶）进行插入和删除操作。
+ 队列（Queue）：遵循先进先出（FIFO）原则的数据结构，元素在一端（队尾）插入，在另一端（队头）删除。
+ 树（Tree）：如二叉树等，具有节点和分支的层次结构，常用于查找、排序等操作，例如二叉搜索树能高效地进行数据查找。
+ 图（Graph）：由顶点和边组成，用于表示多对多的关系，常用于网络分析、路径规划等复杂场景。

**3：STL容器**

STL容器是用来存储和管理数据的类模板，主要分为以下几类：

**顺序容器（vector）**

特点：动态大小数组，内存连续分配，支持快速随机访问元素（通过`[]`操作符），在末尾插入和删除元素效率较高，但在中间或开头插入/删除元素可能导致元素移动，开销较大。实例代码：

```cpp
#include <iostream>
#include <vector>


int main() 
{
    `std::vector<int>` v;
    v.push_back(10);  // 在末尾添加元素1
    v.push_back(20);
    std::cout << "vector size: " << v.size() << std::endl;
    std::cout << "Element at index 0: " << v[0] << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/21004712c7a8a57512405139e2ce926e.png)

**顺序容器（list）**

特点：双向链表实现，内存非连续，任意位置插入和删除元素效率高（只需修改指针），但随机访问元素速度慢（需要遍历链表）。实例代码：

```cpp
#include <iostream>
#include <list>


int main()
{
    std::list<int> l;
    l.push_back(30);
    l.push_front(20);  // 在链表头部插入元素2
    for (auto it = l.begin(); it != l.end(); ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/25d662dea488cc8e60c69a57479436e3.png)

**顺序容器（deque（双端队列））**

特点：允许在两端快速插入和删除元素，类似动态数组但内存分配更灵活，能高效地在两端操作数据，随机访问性能比list好，但略逊于vector。实例代码：

```cpp
#include <iostream>
#include <deque>


int main() 
{
    std::deque<int> d;
    d.push_back(40);
    d.push_front(50);
    std::cout << "First element: " << d.front() << std::endl;
    std::cout << "Last element: " << d.back() << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/3f2d8facc73842886285318e6d83d79e.png)

**关联容器（set）**

特点：存储唯一元素，元素自动按照特定的排序规则（默认升序）进行排序，基于红黑树实现，查找、插入和删除操作时间复杂度相对稳定（对数时间复杂度）。实例代码：

```cpp
#include <iostream>
#include <set>


int main() 
{
    `std::set<int>` s;
    s.insert(60);
    s.insert(40);
    s.insert(60);  // 重复元素不会被插入
    for (auto element : s) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/7e9df644743fa0918c27811a8d1d4b7c.png)

**关联容器（map）**

特点：以键值对（key-value）形式存储数据，每个键唯一，根据键自动排序，基于红黑树实现，方便通过键来快速查找对应的值。实例代码：

```cpp
#include <iostream>
#include <map>


int main() 
{
    `std::map<std::string, int>` m;
    m["apple"] = 55;
    m["banana"] = 33;
    std::cout << "Value of key 'apple': " << m["apple"] << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/1e6ae1c20caad3a4a882134587a4d0ac.png)

**容器适配器（stack）**

特点：默认基于deque实现（也可指定其他合适的顺序容器），提供了栈的操作接口，如push（入栈）、pop（出栈）、top（获取栈顶元素）等。实例代码：

```cpp
#include <iostream>
#include <stack>


int main() 
{
    std::stack<int> st;
    st.push(77);
    st.push(88);
    std::cout << "Stack top element: " << st.top() << std::endl;
    st.pop();


    return 0;
}
```

运行结果：

![](/img/posts/f63e29ede11ea9af8202afbf94d826d2.png)

**容器适配器（queue）**

特点：通常基于deque实现（同样可指定其他容器），提供队列操作接口，如push（入队）、pop（出队）、front（获取队头元素）等。实例代码：

```cpp
#include <iostream>
#include <queue>


int main() 
{
    std::queue<int> q;
    q.push(90);
    q.push(100);
    std::cout << "Queue front element: " << q.front() << std::endl;
    q.pop();


    return 0;
}
```

运行结果：

![](/img/posts/6de74033f46f659cc9496115e3bc1279.png)

**容器适配器（priority_queue）**

特点：基于堆数据结构实现，默认元素按照降序排列（最大元素在堆顶），可自定义比较规则来改变排序方式，常用于需要按照优先级处理元素的场景。实例代码：

```cpp
#include <iostream>
#include <queue>


int main()
{
    std::priority_queue<int> pq;
    pq.push(112);
    pq.push(115);
    std::cout << "Priority queue top element: " << pq.top() << std::endl;
    pq.pop();


    return 0;
}
```

运行结果：

![](/img/posts/0e8ae99cc97e1f612303159ede35ada3.png)

**STL迭代器**

迭代器（Iterator）是一种类似于指针的对象，用于遍历容器中的元素，它提供了一种统一的方式来访问不同类型容器中的元素，是STL算法和容器之间的桥梁。

迭代器类型

+ 正向迭代器（iterator）：可以按顺序从头到尾遍历容器元素，支持读写操作（对于非const迭代器），例如在vector、list等容器中常用。
+ 常量正向迭代器（const_iterator）：与正向迭代器类似，但不能用于修改所指向的元素，常用于遍历不希望被修改的容器。
+ 反向迭代器（reverse_iterator）：按相反顺序（从尾到头）遍历容器元素，支持读写操作（对于非const反向迭代器）。
+ 常量反向迭代器（const_reverse_iterator）：按相反顺序遍历容器元素，但不能修改元素内容。

迭代器实例分析：以vector容器为例展示迭代器的使用：

```cpp
#include <iostream>
#include <vector>


int main() 
{
    `std::vector<int>` v = { 1, 2, 3, 4 };


    // 使用正向迭代器遍历
    `std::vector<int>`::iterator it;
    for (it = v.begin(); it != v.end(); ++it) 
    {
        std::cout << *it << " ";
    }
    std::cout << std::endl;


    // 使用常量正向迭代器遍历
    `std::vector<int>`::const_iterator cit;
    for (cit = v.cbegin(); cit != v.cend(); ++cit)
    {
        // *cit = 5;  // 错误，不能通过const_iterator修改元素
        std::cout << *cit << " ";
    }
    std::cout << std::endl;


    // 使用反向迭代器遍历
    `std::vector<int>`::reverse_iterator rit;
    for (rit = v.rbegin(); rit != v.rend(); ++rit) 
    {
        std::cout << *rit << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/a9efea537e35b3581a19ee1b8c45ab6b.png)

**STL容器通用操作**

不同的STL容器虽然有各自的特点，但也有一些通用的操作，例如：

+ 获取容器大小：通过size()成员函数可以获取容器中当前元素的个数，例如vector、list、set等容器都支持该操作，像`std::vector<int>` v; v.size();就能得到v的元素个数。
+ 判断容器是否为空：使用empty()成员函数，若容器为空返回true，否则返回false，如std::stack<int> st; st.empty();判断栈是否为空。
+ 清除容器元素：clear()函数用于清空容器中的所有元素，比如`std::map<std::string, int>` m; m.clear();会将m中的所有键值对都删除。
+ 迭代器相关操作：如前面提到的通过begin()获取指向容器第一个元素的迭代器，end()获取指向容器末尾（最后一个元素的下一个位置）的迭代器，对于反向迭代器有rbegin()和rend()分别指向容器的最后一个元素和第一个元素的前一个位置等。

# 二：序列式容器
**1：序列式容器概述**

序列式容器（Sequential Containers）在C++ STL中用于存储一组有序的元素，元素在容器中的顺序通常取决于插入的顺序，或者按照特定的排序规则（如果容器本身有排序功能）。这些容器提供了一系列方法来方便地操作其中存储的元素，比如插入、删除、访问等操作，不同的序列式容器在内部实现机制、性能特点等方面各有差异，适用于不同的应用场景。

**2：array容器**

特点：

- array是固定大小的数组容器，它的大小在编译时就确定了，不能动态改变。

- 它在内存中是连续存储元素的，因此可以像普通数组一样通过索引快速访问元素，效率很高。

- 相比于普通数组，它提供了更丰富的成员函数来操作数组元素，并且具有更好的安全性，例如避免了数组越界访问时出现难以察觉的错误（能通过一些机制捕获越界情况）。实例代码：

```cpp
#include <iostream>
#include <array>


int main() 
{
    std::array<int, 5> arr = { 10, 20, 30, 40, 50 };  // 定义一个包含5个int元素的array容器
    std::cout << "Size of array: " << arr.size() << std::endl;
    std::cout << "Element at index 2: " << arr[2] << std::endl;
    for (size_t i = 0; i < arr.size(); ++i) {  // 遍历array容器
        std::cout << arr[i] << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/bb9dd7e81529c4171615ae2e52b3bc03.png)

**3：vector容器**

特点：

- 动态大小的数组，内存连续分配。这意味着它支持快速的随机访问，通过`[]`操作符或者at()成员函数（at()会进行边界检查，更安全）可以高效地获取指定索引位置的元素，时间复杂度为常数级别 O(1)。

- 在末尾插入和删除元素效率相对较高，平均时间复杂度为常数级别 O(1)，但如果在中间或开头插入/删除元素，会导致后续元素的移动，开销较大，时间复杂度为线性级别O(n)，其中n是容器中元素的数量。

- 当存储的元素数量超过当前分配的内存空间时，会自动重新分配内存并复制原有元素，这个过程相对耗时，但对于使用者来说通常不需要过多关注内存管理细节。实例代码：

```cpp
#include <iostream>
#include <vector>


int main() 
{
    `std::vector<int>` v;
    v.push_back(11);  // 在末尾添加元素
    v.push_back(22);
    std::cout << "Size of vector: " << v.size() << std::endl;
    std::cout << "Element at index 0: " << v[0] << std::endl;
    v.insert(v.begin() + 1, 3);  // 在索引为1的位置插入元素3
    for (auto element : v) {  // 使用范围for循环遍历vector
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/751cf1312287dbaed56af90b9287905b.png)

**4：deque容器**

特点：

- 双端队列（Double-Ended Queue），可以在两端快速地插入和删除元素，时间复杂度为常数级别O(1)，这是它的一大优势。

- 内部实现类似动态数组，但内存分配方式更灵活，它分段存储元素，使得在两端操作时不需要像vector那样大量移动元素，不过随机访问性能比vector略逊一筹，但仍然是比较高效的，时间复杂度为常数级别O(1)。

- 适用于需要频繁在两端进行元素增减的场景。实例代码：

```cpp
#include <iostream>
#include <deque>


int main() 
{
    std::deque<int> d;
    d.push_back(44);
    d.push_front(33);  // 在队头插入元素
    std::cout << "First element: " << d.front() << std::endl;
    std::cout << "Last element: " << d.back() << std::endl;
    d.pop_front();  // 删除队头元素
    for (auto element : d) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/1e7649e282517340a0a057a3e8929ab2.png)

**5：list容器**

特点：

- 双向链表实现，内存是非连续分配的。这使得它在任意位置插入和删除元素的效率都很高，只需要修改相应节点的指针即可，时间复杂度为常数级别O(1)。

- 然而，由于其链表的特性，随机访问元素的速度很慢，需要从链表头（或尾）开始逐个遍历节点，时间复杂度为线性级别O(n)。

- 对于频繁需要在容器中间进行插入、删除操作，而对随机访问要求不高的场景比较适用。实例代码：

```cpp
#include <iostream>
#include <list>


int main() 
{
    std::list<int> l;
    l.push_back(56);
    l.push_front(44);
    l.insert(++l.begin(), 66);  // 在第二个位置插入元素66
    for (auto it = l.begin(); it != l.end(); ++it) {  // 使用迭代器遍历list
        std::cout << *it << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/3fe6010448ee34b1a1f676e376190f6c.png)

**6：forward_list容器**

特点：

- 单向链表实现，相比于list（双向链表），它只维护指向下一个节点的指针，占用内存空间相对更小。

- 只能沿着链表正向遍历，适合一些只需要单向顺序访问元素且对内存占用比较敏感的场景，例如在某些特定的算法实现中，仅需从前向后处理数据。

- 在链表头部插入和删除元素的操作非常高效，时间复杂度为常数级别O(1)，但在其他位置插入或删除元素相对复杂一些，因为需要先找到对应位置的前一个节点（没有直接的反向指针）。实例代码：

```cpp
#include <iostream>
#include <forward_list>


int main() 
{
    std::forward_list<int> fl;
    fl.push_front(77);
    fl.push_front(88);
    auto it = fl.begin();
    fl.insert_after(it, 99);  // 在第一个元素之后插入元素99
    for (auto element : fl) {
        std::cout << element << " ";
    }
    std::cout << std::endl;
    return 0;
}
```

运行结果：

![](/img/posts/acbce1f36f4d59d4526c577b7a446b93.png)

# 三：关联式容器
**1：关联式容器概述**

关联式容器是一种存储元素的容器，其元素的位置取决于特定的排序准则或关联键（key），而非元素插入的顺序。它们提供了高效的查找、插入和删除操作，在很多需要根据特定条件快速定位元素的场景中非常有用。

C++标准库中的关联式容器主要分为两类：有序关联容器（基于红黑树实现，元素自动按照键值排序）和无序关联容器（基于哈希表实现，元素的存储顺序不固定，但提供平均时间复杂度为常数的查找等操作）。本文重点讲解有序关联容器中的相关类型，包括map、multimap、set、multiset，它们在底层都使用红黑树来组织数据。

**2：pair类模板**

定义

pair是C++标准库中的一个类模板，定义在<utility>头文件中，用于将两个值组合成一个单一的对象。这两个值可以是不同的数据类型，通常用于表示具有关联关系的一对值，比如键值对中的键和值。

成员变量及构造函数

pair包含两个公开的数据成员：first和second，分别对应两个组合的值。它有多种构造方式，例如：

```cpp
#include <iostream>
#include <utility>
int main() {
    std::pair<int, std::string> p1(1, "Hello");  // 使用值初始化
    std::pair<int, std::string> p2 = std::make_pair(2, "world");  // 使用make_pair函数初始化


    std::cout << p1.first << " " << p1.second << std::endl;
    std::cout << p2.first << " " << p2.second << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/9aac047f210ef171fb6c18f8613abcde.png)

代码中，展示了两种初始化pair对象的方法，通过访问first和second成员可以获取对应的值。

用途

常用于关联式容器（如map）中作为元素类型，来表示键值对关系；也可以在函数需要返回多个值的场景中使用。

**3：map容器**

定义与特点

map是一种关联式容器，存储的元素是由键（key）和值（value）组成的键值对，并且按照键的大小进行自动排序（默认升序，可以自定义比较函数来改变排序规则）。每个键在map中是唯一的，不允许重复。

**头文件及声明**

使用map需要包含<map>头文件，声明方式如下：

```cpp
#include <map>
#include <iostream>
int main() 
{
    // 定义一个键为int类型，值为string类型的map
    `std::map<int, std::string>` myMap;  


    return 0;
}
```

基本操作及示例代码

**插入元素：**

可以使用insert函数或者[]操作符来插入元素。

```cpp
#include <map>
#include <iostream>
int main() 
{
    `std::map<int, std::string>` myMap;
    // 使用insert方法插入元素
    myMap.insert(std::make_pair(1, "one"));
    myMap.insert(std::pair<int, std::string>(2, "two"));


    // 使用[]操作符插入元素（如果键不存在则创建新元素，如果存在则修改对应的值）
    myMap[3] = "three";


    for (const auto& element : myMap) {
        std::cout << element.first << " : " << element.second << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/67edf897d895d2309bcfbd5fa31bc5e5.png)

**查找元素：**

使用find函数来查找元素，若找到则返回指向该元素的迭代器，若没找到则返回end()迭代器。

```cpp
#include <map>
#include <iostream>
int main() 
{
    `std::map<int, std::string>` myMap;
    myMap[1] = "one";
    myMap[2] = "two";


    auto it = myMap.find(1);
    if (it != myMap.end()) {
        std::cout << "找到元素: " << it->first << " : " << it->second << std::endl;
    }
    else {
        std::cout << "未找到指定元素" << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/9abaa5e41ddb7ce6aaab51a5c734d79c.png)

**删除元素：**

使用erase函数，根据键或者迭代器来删除元素。

```cpp
#include <map>
#include <iostream>
int main() 
{
    `std::map<int, std::string>` myMap;
    myMap[1] = "one";
    myMap[2] = "two";


    myMap.erase(1);  // 根据键删除元素


    for (const auto& element : myMap) {
        std::cout << element.first << " : " << element.second << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/18d9b87ce03fbb96d2adea08c32a0e8b.png)

**4：multimap容器**

定义与特点

multimap同样是关联式容器，存储键值对元素且按键自动排序，但是与 map不同的是，multimap允许键重复出现，适用于需要存储多个具有相同键但不同值的场景。

头文件及声明

同样需要包含<map>头文件，声明示例：

```cpp
#include <map>
#include <iostream>


int main()
{
    // 定义一个键为int类型，值为string类型的multimap
    std::multimap<int, std::string> myMultimap; 


    return 0;
}
```

基本操作及示例代码

**插入元素：**

使用insert函数插入元素，因为允许键重复，所以可以多次插入相同键的不同值。

```cpp
#include <map>
#include <iostream>
int main() 
{
    std::multimap<int, std::string> myMultimap;
    myMultimap.insert(std::make_pair(1, "first"));
    myMultimap.insert(std::make_pair(1, "second"));


    for (const auto& element : myMultimap) {
        std::cout << element.first << " : " << element.second << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/07c458c82dd89bd890d7015861ab4b54.png)

**查找元素：**

使用equal_range函数来获取具有特定键的所有元素的范围（返回一对迭代器，分别指向范围的起始和结束位置）。

```cpp
#include <map>
#include <iostream>
int main() 
{
    std::multimap<int, std::string> myMultimap;
    myMultimap.insert(std::make_pair(1, "first"));
    myMultimap.insert(std::make_pair(1, "second"));


    auto range = myMultimap.equal_range(1);
    for (auto it = range.first; it != range.second; ++it) {
        std::cout << it->first << " : " << it->second << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/c42b45a5aa1a6241af4b44cf29f3137f.png)

**删除元素：**

可以使用erase函数根据键删除所有具有该键的元素，或者根据迭代器删除单个元素。

```cpp
#include <map>
#include <iostream>
int main() 
{
    std::multimap<int, std::string> myMultimap;
    myMultimap.insert(std::make_pair(1, "first"));
    myMultimap.insert(std::make_pair(1, "second"));


    myMultimap.erase(1);  // 删除所有键为1的元素


    for (const auto& element : myMultimap) {
        std::cout << element.first << " : " << element.second << std::endl;
    }


    return 0;
}
```

**5：set容器**

定义与特点

set是一种关联式容器，它只存储键（或者说元素本身就充当键），并且元素会按照一定的顺序自动排序（同样默认升序，可自定义比较规则），不允许有重复的元素。可以把它看作是一种特殊的map，只是map存储的是键值对，而set只关注键本身。

头文件及声明

使用set需要包含<set>头文件，声明示例：

```cpp
#include <set>
#include <iostream>
int main() 
{
    `std::set<int>` mySet;  // 定义一个存储int类型元素的set


    return 0;
}
```

基本操作及示例代码

**插入元素：**

使用insert函数插入元素。

```cpp
#include <set>
#include <iostream>
int main() 
{
    `std::set<int>` mySet;
    mySet.insert(3);
    mySet.insert(1);
    mySet.insert(2);


    for (const auto& element : mySet) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/4a843cc2b9fa42ed95a263d1bf9ef0d3.png)

注意，即使多次插入相同的值，在set中也只会存在一个该元素，因为它不允许重复。

**查找元素：**

使用find函数查找元素，原理和map中的查找类似，找到返回迭代器，没找到返回end()迭代器。

```cpp
#include <set>
#include <iostream>
int main() 
{
    `std::set<int>` mySet;
    mySet.insert(1);
    mySet.insert(2);


    auto it = mySet.find(1);
    if (it != mySet.end()) {
        std::cout << "找到元素: " << *it << std::endl;
    }
    else {
        std::cout << "未找到指定元素" << std::endl;
    }


    return 0;
}
```

运行结果：

![](/img/posts/19afd6ab73fcfc6554c195ac02b30fe7.png)

**删除元素：**

使用erase函数根据元素值或者迭代器来删除元素。

```cpp
#include <set>
#include <iostream>
int main() 
{
    `std::set<int>` mySet;
    mySet.insert(1);
    mySet.insert(2);


    mySet.erase(1);


    for (const auto& element : mySet) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/6086749c51ca0029aa9c35412f388825.png)

**6：multiset容器**

定义与特点

multiset和set类似，也是存储元素且自动排序的关联式容器，不过它允许元素重复出现，就如同multimap与map的关系一样。

**头文件及声明**

**需要包含<set>头文件，声明示例：**

```cpp
#include <set>
#include <iostream>
int main() 
{
    std::multiset<int> myMultiset;  // 定义一个存储int类型元素的multiset
    return 0;
}
```

基本操作及示例代码

**插入元素：**

使用insert函数插入元素，由于允许重复，可多次插入相同的值。

```cpp
#include <set>
#include <iostream>
int main() 
{
    std::multiset<int> myMultiset;
    myMultiset.insert(10);
    myMultiset.insert(10);
    myMultiset.insert(20);


    for (const auto& element : myMultiset) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/4ced5574f48a9ee3d106a980b67baccd.png)

**查找元素：**

使用equal_range函数来获取具有特定值的所有元素的范围，和multimap中查找特定键的元素范围类似。

```cpp
#include <set>
#include <iostream>
int main() 
{
    std::multiset<int> myMultiset;
    myMultiset.insert(1);
    myMultiset.insert(1);
    myMultiset.insert(2);


    auto range = myMultiset.equal_range(1);
    for (auto it = range.first; it != range.second; ++it) {
        std::cout << *it << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/eff2e340c46af3a4c64ed51df7df213c.png)

**删除元素：**

可以使用erase函数根据元素值删除所有该值对应的元素，或者根据迭代器删除单个元素。

```cpp
#include <set>
#include <iostream>
int main() 
{
    std::multiset<int> myMultiset;
    myMultiset.insert(1);
    myMultiset.insert(1);
    myMultiset.insert(2);


    myMultiset.erase(1);


    for (const auto& element : myMultiset) {
        std::cout << element << " ";
    }
    std::cout << std::endl;


    return 0;
}
```

运行结果：

![](/img/posts/e5bf0a2bd0ec126c4c37e71d5cde77ae.png)  


> 来自: [80万年薪C++岗位，掌握STL和你是否一样](https://mp.weixin.qq.com/s?__biz=Mzg5NzA0NjYyNA==&mid=2247484269&idx=1&sn=391b33589cede9da8b6ef85b6f9ab207&chksm=c0768262f7010b74cbbaba2be6537107e6438dddc83aee828dc67ca8369860993fcf69bc1482&cur_album_id=3815854256899440642&scene=190#rd)
>

