---
sidebar_position: 1
slug: /C++/面试题/C-面试之static关键字_牛客网
---

### 1. 不考虑class情况：和`c`语言的`static`一样
1. 隐藏：所有不加`static`的全局变量和函数具有全局可见性，可以在其他文件中使用；加了`static`之后只能在该文件所在的编译模块中使用。
2. 未初始化静态变量默认初始化为0：都存在**静态存储区.BSS**。
3. 静态变量作用持久：静态变量在函数内定义，始终存在，但只进行一次初始化，具有记忆性，其作用范围与局部变量相同，函数退出后仍然存在，但不能够使用。

全局的变量/静态变量，在**编译过程中**，就已经生成在执行文件中了；

局部静态变量在**程序运行时**创建到静态内存区域，此后一直持续到运行结束时候，再消失。

### 2. 考虑class类的情况
+ `static`修饰变量，是整个类的数据成员，存储不占用某个具体对象的空间，其存储在**静态存储区**；

`static`修饰成员函数，用于处理静态成员变量，可以用**类名字来调用**，也可以用**对象名字来调用**。

+ 通过类名`+`作用域运算符`::`直接访问静态成员，并且可以使用类的对象、引用或者指针来访问静态成员。但通过类名不可以访问非静态成员，通过类的对象可以调用静态和非静态的。

原因在于：静态成员函数属于这个类在初始化的时候加载的，在类实例化对象之前，就已经分配了内存空间了；而非静态成员函数必须在类实例化对象后才有内存空间，所以不能通过类名来调用非静态函数，好比调用了一个没有声明的函数。

+ **静态成员函数**：定义在类的内外部都可以；类外部实现逻辑的时候，不需要`static`关键字（类里面已经声明过了）；并且与一般的成员函数的区别就是**没有this指针**，不能访问类的非静态成员变量。

1）原因分析：由于静态成员函数没有this指针，不知道指向哪一个对象，所以无法访问对象的成员变量，只能访问静态成员变量，（也就是每个对象都共有的静态变量）

2）this参数拓展一个问题：（拓展解析：sort函数的比较函数，写在类里面时需要使用`static bool operator`见C++STL模块13th ），由于传入sort函数`sort(nums.begin(), nums.end(), more);`的比较函数`more`，需要符合fefault形式，在类里面声明的话，需要设置成static形式，消除掉这个默认的`this`参数。

3）this参数再次拓展一个问题：对于`pthread_create()`的线程函数（第三个参数）来说，线程函数需要设置成静态成员函数，由于类成员函数，默认的会传入参数`this`指针进去，所以设置为静态成员函数。

+ 静态成员变量：不是在类的构造函数进行初始化（只有在实例化对象的时候才调用）的，它是独立于对象的操作，必须在**类的外部定义和初始化每个静态成员**，存放在**全局变量**`**.data**`**区**，且一直存活在整个文件生命周期内。

> Nonstatic data members 放置的是“个别的class object”感兴趣的数据，Static data members 则放置的是“整个class”感兴趣的数据。
>
> Static data members 永远只存在一份实例（即使该class 没有 任何object实例，其static data members也已存在，在类实例化对象之前就已经分配了内存空间。
>
> --深度探索C++对象模型p88
>

+ 静态成员变量类的初始化例子

```cpp
class Account {
public:
void f1();
static double rate() { retunr interestRate; } 
static void rate(double); // 类在外部定义的时候，不在需要static关键字

private:
std::string owner; // 两个成员
double amount;
static constexpr int period =30; // 是常量表达式就可以直接在内部进行定义
static double interestRate; // 一般的static 变量需要在外部定义    
}

// 一般的话，是在类的外部定义static变量
double Account::interestRate =initRate();


// 类在外部定义的时候，不在需要static关键字
void Account::rate(double a) {
    interestRate =newRate;
}

void main() {
    Account::f1(); // 不可以引用的，非静态成员的引用必须与特定的对象相对
    Account::rate(); // 静态成员是可以的
}
```

+ 优点：1）节省内存空间，因为它是所有对象公有的，对多个对象来说，静态数据成员值存储在全局静态变量`.data`区；2）静态值更新：只初始化一次，只要对静态成员变量的值更新一次，就可以保证所有对象得到的都是更新后的值，提高时间效率；3）内存分配时间阶段：**静态全局变量**，在主程序之前，编译器在**编译时期**已经为其分配好内存并初始化；**局部静态变量**（在函数体内），在**第一次运行时**分配到全局变量区`.data`区，并进行初始化。

### 3. 类中的静态成员函数如何访问非静态成员函数**（延伸一个问题）
由上分析，众所周知，这是不可以访问的，因为1）静态成员函数不属于某一个具体的类的，而是所有类进行共享的；2）static 函数没有默认的this指针作为参数传递进来。

所以，当static成员函数，来调用non-static的成员变量时，不知道调用的是哪个实例的类的成员变量。可以说，就是因为没有this指针的缘故，因此，想访问的话，我们就传递一个this指针给static成员函数即可。

### 4. way-01：在静态函数的形参表里加上实例的地址（直接使用这个即可）
```plain
class A
{
public:
    static void test(A *a)
    {
        a->m_a += 1; /* 通过传递指针作为参数的形式访问 */
    }
    void hello()
    {
    }
private:
    static int m_staticA;
    int m_a
};
```

### 5. way-02：放上全局变量地址（不推荐）:dog:
```plain
A g_a;

class A
{
public:
    static void test()
    {
        g_a.m_a += 1; /* 以全局变量的形式访问 */
    }
    void hello()
    {
    }
private:
    static int m_staticA;
    int m_a
};
```

### 6. way-03：静态函数可以访问静态成员，所以在成员变量里面将一个静态变量保存着this指针即可，在初始化的，将该静态变量初始化为this指针即可。
```plain
class A
{
public:
    A()
    {
        m_gA = this; /* 直接赋值为this指针即可 */
    }
    static void test()
    {
        m_gA.m_a += 1;
    }
    void hello()
    {
    }
private:
    static int m_staticA;
    static A *m_gA; /* 利用这个指针变量即可 */
    int m_a
};
```

+ 参考网址： 
    - [C/C++ 中 static 的用法全局变量与局部变量](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fwww.runoob.com%2Fw3cnote%2Fcpp-static-usage.html)
    - [C++静态成员函数访问非静态成员的几种方法](https://gw-c.nowcoder.com/api/sparta/jump/link?link=https%3A%2F%2Fwww.cnblogs.com%2Frickyk%2Fp%2F4238380.html)

### 7. Q1 类中的静态成员函数可以定义为虚函数吗？
+ 结论

一般的static是不属于任何类对象的，独立于类对像存在的，大家共享一个函数，即便此静态函数加上virtual也是没有意义的。

+ 区别点

回忆静态和非静态成员函数的一个主要区别就是，静态成员函数没有`this`指针，独立于类对象存在。那这样就矛盾起来，虚函数需要依靠类对象的this指针-->虚表指针vptr-->虚表，来进行调用的。

对于静态函数，没有this，所以无法访问虚函数。

+ 虚函数的调用关系

this-->vptr-->vtable-->virtual function



