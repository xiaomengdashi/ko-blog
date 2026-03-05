---
sidebar_position: 2
slug: /C++/STL/入门级解读-C-STL-中迭代器的本质与实现-含侯捷STL源码剖析-
---

## 1. 一、迭代器到底是什么？**
通俗讲：**迭代器是一个用来遍历容器的“泛型指针”**。

在 C 语言里我们操作数组靠指针，而 C++ STL 容器结构多样：`vector` 是动态数组，`list` 是双向链表，`map` 是红黑树。那么算法如 `sort`、`copy` 如何统一处理？——这就要靠迭代器。

迭代器本质上是一个封装了指针行为的对象，重载了：

+ `*p` 访问元素
+ `++p` / `--p` 移动
+ `p == q` 比较位置

侯捷老师总结：**指针是最原始的迭代器，而 STL 中的迭代器就是“行为像指针的类”**。

---

## 2. 二、五种迭代器类型**
STL 根据操作能力，把迭代器分为五大类，每种都是前一种的超集。

| **类型** | **能力** | **举例容器** |
| :--- | :--- | :--- |
| InputIterator（输入） | 只读，前移 | `istream_iterator` |
| OutputIterator（输出） | 只写，前移 | `ostream_iterator` |
| ForwardIterator（前向） | 可读写，前移 | `forward_list` |
| BidirectionalIterator（双向） | 可读写，前后移动 | `list`<br/>、`set` |
| RandomAccessIterator（随机访问） | 可读写，可跳跃 | `vector`<br/>、`deque` |


你可以理解为五个“段位”：

```cpp
Input < Forward < Bidirectional < RandomAccess
```

侯捷提到：STL 的设计哲学是“最小需求设计”，算法根据最弱要求选择最小类型，然后在运行时通过模板 + traits 实现“能力分发”。

---

## 3. 三、Traits 技术：类型萃取的魔法**
当我们写一个泛型算法时，并不知道传入的迭代器是啥类型。这时就靠 `iterator_traits` 这个结构体提取类型信息：

```cpp
`template`<typename Iterator>`
struct iterator_traits {
    using iterator_category = typename Iterator::iterator_category;
    using value_type = typename Iterator::value_type;
    using difference_type = typename Iterator::difference_type;
    ...
};
```

这样就能在算法中写：

```cpp
typename `iterator_traits`<Iter>`::iterator_category()
```

来获得标签（如 `random_access_iterator_tag`），再通过函数重载进行调度。

👉 侯捷称其为 “类型的标签分发器”。

---

## 4. 四、标签分发：用“空类”实现重载策略**
在 `advance` 和 `distance` 函数中，STL 利用标签分发实现了“为不同迭代器走不同逻辑”的技巧：

### 4.1. 例：advance() 实现**
```cpp
template `<typename InputIterator, typename Distance>`
void advance(InputIterator& it, Distance n) {
    _advance(it, n, `iterator_traits`<InputIterator>`::iterator_category());
}
void _advance(InputIterator& it, Distance n, input_iterator_tag) {
    while (n--) ++it;
}
void _advance(BidirectionalIterator& it, Distance n, bidirectional_iterator_tag) {
    if (n >= 0) while (n--) ++it;
    else while (n++) --it;
}
void _advance(RandomAccessIterator& it, Distance n, random_access_iterator_tag) {
    it += n;
}
```

这样就能根据 `it` 的类型自动调度最高效版本，而不需要用户干预。你不写 `if`，编译器帮你选最优路径。

这就是**模板 + 类型标签**的魅力，侯捷称其为 STL 最经典技巧之一。

---

## 5. 五、常用适配器介绍（配合容器更强大）**
STL 提供了很多“迭代器适配器”，用于将普通容器包装为“具有特殊行为”的对象。

### 5.1. 1）reverse_iterator：反向迭代器**
让你从容器尾部向前遍历。

```cpp
`vector`<int>` v = {1,2,3,4};
for (auto rit = v.rbegin(); rit != v.rend(); ++rit)
    cout `<< *rit; // 输出 4 3 2 1
```

它的 `base()` 实际指向正向迭代器的“后一位”，所以 `*rit` 实际是 `*(base() - 1)`。

### 5.2. 2）back_insert_iterator：尾部插入器**
把赋值操作转成容器的 `push_back`：

```cpp
`vector<int>` v;
auto it = back_inserter(v);
*it = 1;  // 等价于 v.push_back(1);
```

适合配合 `copy` 使用：

```cpp
copy(src.begin(), src.end(), back_inserter(dest));
```

### 5.3. 3）insert_iterator：中间插入器**
让插入发生在指定位置上：

```cpp
insert_iterator it(v, v.begin() + 3);
*it = 99;  // 插入在第4位前
```

---

## 6. 六、源码中 __normal_iterator 的作用**
侯捷特别分析了 `__normal_iterator`：STL 的 vector、string 的迭代器其实就是对原生指针加壳。

```cpp
`template`<typename T>`
class __normal_iterator {
    T* ptr;
public:
    __normal_iterator& operator++() { ++ptr; return *this; }
    reference operator*() const { return *ptr; }
    ...
};
```

为什么不直接用裸指针？为了统一接口（traits支持、自定义功能等），让 ``vector`<int>`::iterator` 看起来也是一个类，而不仅仅是 `int*`。

---

## 7. 七、侯捷源码剖析特色总结**
侯捷老师在书中对迭代器实现做了大量细节还原，比如：

+ 自己写 `__type_traits` 结构体
+ 讲解 `distance_type()`、`value_type()` 这些函数如何萃取类型
+ 反复强调 **template + traits + tag dispatching** 是 STL 三大法宝

这些思想你在看完这篇文章后再读《STL 源码剖析》会更有感觉。

---

## 8. 八、结语：学习迭代器的意义**
理解 STL 迭代器，不只是为了写 `for (auto it = ...)` 而已，更重要的是：

1. 看懂源码 / 编写泛型库
2. 掌握 STL 高性能设计技巧
3. 为自己写容器打基础
4. 为面试算法题打通容器适配技巧

就像侯捷说的：“STL 是 C++ 的皇冠，迭代器是皇冠上的明珠。” 把这颗明珠理解透，你就打开了 C++ 泛型编程的大门。

---

如果你对源码细节感兴趣，推荐搭配阅读：

+ 《STL源码剖析》侯捷著
+ C++标准库实现源码（libstdc++、MSVC STL）

> 来自: [入门级解读：C++ STL 中迭代器的本质与实现（含侯捷STL源码剖析）](https://mp.weixin.qq.com/s?src=11&timestamp=1756393217&ver=6202&signature=KFFYMvZoBAmASEvIazuku7jqXtPTwDNh4cwvB0WNu1qr1wJ1Ag8R*Q7gI*-WC9O0l5gYTcofdCmdPhbilzK4rLP-3arwrMDuYZp32LTp0yX-NfYY-6p2jejtrlg25Q9O&new=1)
>





