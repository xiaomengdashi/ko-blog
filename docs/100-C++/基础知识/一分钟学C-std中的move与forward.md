---
sidebar_position: 6
slug: /C++/基础知识/一分钟学C-std中的move与forward
---

---
title: 【一分钟学C++】std中的move与forward
date: '2025-09-01 23:23:24'
updated: '2026-03-04 01:21:11'
slug: /C++/基础知识/一分钟学C-std中的move与forward
当第一次了解到移动语义（move semantics）和完美转发（perfect forwarding）的时候，它们看起来非常直观：

+ 移动语义使编译器有可能用廉价的移动操作来代替昂贵的拷贝操作。正如拷贝构造函数和拷贝赋值操作符给了你控制拷贝语义的权力，移动构造函数和移动赋值操作符也给了你控制移动语义的权力。移动语义也允许创建只可移动（move-only）的类型，例如 std::unique_ptr，std::future 和 std::thread。
+ 完美转发使接收任意数量实参的函数模板成为可能，它可以将实参转发到其他的函数，使目标函数接收到的实参与被传递给转发函数的实参保持一致。

在了解后面的内容之前，非常重要的一点是要牢记形参永远是左值，即使它的类型是一个右值引用，比如：

```plain
void f(Widget&& w);
```

## 1. std::move**
下面给出了 std::move 的一个大致实现。

```plain
namespace std {
    template `<typename T>`
    struct remove_reference {
        using type = T;  // 默认情况下，T 没有引用
    };
    template `<typename T>`
    struct `remove_reference`<T&>` {
        using type = T;  // 对于左值引用类型，去掉引用
    };
    template `<typename T>`
    struct `remove_reference`<T&&>` {
        using type = T;  // 对于右值引用类型，去掉引用
    };
}
```

```plain
`template`<typename T>`                            //在std命名空间
typename `remove_reference`<T>`::type&&
move(T&& param)
{
    using ReturnType =                          //别名声明，见条款9
        typename `remove_reference`<T>`::type&&;
    return `static_cast`<ReturnType>`(param);
}
```

+ remove_reference 结构体利用模版的偏特化，去掉任意类型 T 的引用，返回原始类型。
+ std::move 中通过 remove_reference 去除引用后再定义一个右值引用，这样保证不会发生引用折叠，此时 ReturnType 一定表示右值引用。
+ 然后通过 static_cast 进行强转得到原始变量的右值。

从上面的过程中可以看出 std::move 本质上就是一个强制类型转换。但是 std::move 获得右值作为函数参数时，并不永远保证就能执行移动操作函数，比如下面的场景：

```plain
class Annotation {
public:
    explicit Annotation(const std::string text);
    …
};
```

当复制 text 到一个数据成员的时候，为了避免一次复制操作的代价，把 std::move 应用到 text 上，因此产生一个右值：

```plain
class Annotation {
public:
    explicit Annotation(const std::string text)
    ：value(std::move(text))    //“移动”text到value里；这段代码执行起来
    { … }                       //并不是看起来那样
    
    …
private:
    std::string value;
};
```

这段代码编译运行没有问题。这段代码将数据成员 value 设置为 text 的值，与期望中的完美实现的唯一区别，是 text 并不是被移动到 value，而是被拷贝。诚然，text 通过 std::move 被转换到右值，但是 text 被声明为const std::string，所以在转换之前，text 是一个左值的 const std::string，而转换的结果是一个右值的 const std::string，但是纵观全程，const 属性一直保留。当编译器决定哪一个std::string的构造函数被调用时，考虑它的作用，将会有两种可能性：

```plain
class string {                  //std::string事实上是
public:                         //`std::`basic_string`<char>`的类型别名
    …
    string(const string& rhs);  //拷贝构造函数
    string(string&& rhs);       //移动构造函数
    …
};
```

在类 Annotation 的构造函数的成员初始化列表中，std::move(text) 的结果是一个 const std::string 的右值。这个右值不能被传递给 std::string 的移动构造函数，因为移动构造函数只接受一个指向 non-const 的 std::string 的右值引用。然而，该右值却可以被传递给 std::string 的拷贝构造函数，因为 lvalue-reference-to-const 允许被绑定到一个 const 右值上。因此，std::string 在成员初始化的过程中调用了拷贝构造函数，即使 text 已经被转换成了右值。这样是为了确保维持 const 属性的正确性。从一个对象中移动出某个值通常代表着修改该对象，所以语言不允许 const 对象被传递给可以修改他们的函数（例如移动构造函数）。

## 2. std::forward**
std::forward 目的是实现完美转发，当传入左值引用时，期望能够保留左值属性，当传入右值引用时，期望能够保留右值属性。大致实现如下：

```plain
namespace std {
    template `<typename T>`
    T&& forward(typename `std::`remove_reference`<T>`::type& arg) noexcept {
        // 如果 T 是左值引用类型，arg 是左值，我们保持其为左值引用
        return `static_cast`<T&&>`(arg);  // 转发左值引用，可能发生引用折叠
    }
    template `<typename T>`
    T&& forward(typename `std::`remove_reference`<T>`::type&& arg) noexcept {
        // 如果 T 是右值引用类型，arg 是右值，我们保持其为右值引用
        return `static_cast`<T&&>`(arg);  // 转发右值引用
    }
}
```

图中以 Widget 为例，给出了 std::forward 的基本原理。

![](/img/posts/cb1a9421f888edbd14fa4631339abe21.png)

+ 当传递给 func 函数的实参类型为左值 Widget 时，T 被推导为 Widget& 类别。然后 forward 会实例化为 `std::`forward`<Widget&>`，并返回 Widget&&&，经过引用折叠变成 Widget&（左值引用，根据定义是个左值！）
+ 而当传递给 func 函数的实参类型为右值 Widget 时，T 被推导为 Widget。然后 forward 被实例化为 std::forward，并返回 Widget&&（注意，匿名的右值引用是个右值！）
+ std::forward 本质上也就是 static_cast。

## 3. 比较**
注意，第一，std::move 只需要一个函数实参，而 std::forward 不但需要一个函数实参，还需要一个模板类型实参 T。更重要的是，std::move 的使用代表着无条件向右值的转换，而使用 std::forward 只对绑定了右值的引用进行到右值转换。这是两种完全不同的动作。前者是典型地为了移动操作，而后者只是传递（亦为转发）一个对象到另外一个函数，保留它原有的左值属性或右值属性。

请记住：

+ std::move 执行到右值的无条件的转换，但就自身而言，它不移动任何东西。
+ std::forward 只有当它的参数被绑定到一个右值时，才将参数转换为右值。
+ std::move 和 std::forward 在运行期什么也不做。

> 来自: [【一分钟学C++】std中的move与forward](https://mp.weixin.qq.com/s/o9w31LfwLPKEs1pgBNKNXw)
>





