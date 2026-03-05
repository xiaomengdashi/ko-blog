---
sidebar_position: 11
slug: /C++/基础知识/C!C++——new和delete的实现原理---详解---delete的实现原理
---

---
title: 'C/C++——new和delete的实现原理（详解）_delete[]的实现原理-CSDN博客'
date: '2024-12-31 01:07:41'
updated: '2024-12-31 01:10:03'
slug: /C++/基础知识/C!C++——new和delete的实现原理---详解---delete的实现原理
##### 0.0.1. C/C++内存管理
+ [1.C/C++内存分布](https://blog.csdn.net/qq_45657288/article/details/114699235#1CC_1)
+ [2.C语言中动态内存管理方式](https://blog.csdn.net/qq_45657288/article/details/114699235#2C_14)
    - [2.1malloc/calloc/realloc/free区别](https://blog.csdn.net/qq_45657288/article/details/114699235#21malloccallocreallocfree_15)
+ [3.C++中动态内存管理(new和delete)](https://blog.csdn.net/qq_45657288/article/details/114699235#3Cnewdelete_24)
    - [3.1new/delete操作内置类型](https://blog.csdn.net/qq_45657288/article/details/114699235#31newdelete_25)
    - [3.2new/delete操作自定义类型](https://blog.csdn.net/qq_45657288/article/details/114699235#32newdelete_30)
+ [4.operator new和operator delete函数](https://blog.csdn.net/qq_45657288/article/details/114699235#4operator_newoperator_delete_35)
    - [4.1operator new和operator delete 底层原理](https://blog.csdn.net/qq_45657288/article/details/114699235#41operator_newoperator_delete__36)
    - [4.2operaor new和operator delete的类专属重载](https://blog.csdn.net/qq_45657288/article/details/114699235#42operaor_newoperator_delete_47)
+ [5.new和delete的实现原理](https://blog.csdn.net/qq_45657288/article/details/114699235#5newdelete_52)
+ [6.定位new表达式（placement-new）](https://blog.csdn.net/qq_45657288/article/details/114699235#6newplacementnew_59)
+ [7.相关面试题](https://blog.csdn.net/qq_45657288/article/details/114699235#7_68)
    - [7.1malloc/free和new/delete的区别](https://blog.csdn.net/qq_45657288/article/details/114699235#71mallocfreenewdelete_69)
    - [7.2内存泄漏](https://blog.csdn.net/qq_45657288/article/details/114699235#72_79)
        * [7.2.1什么是内存泄漏，内存泄露的危害](https://blog.csdn.net/qq_45657288/article/details/114699235#721_80)
        * [7.2.2内存泄漏的分类](https://blog.csdn.net/qq_45657288/article/details/114699235#722_101)
        * [7.2.3如何避免内存泄漏](https://blog.csdn.net/qq_45657288/article/details/114699235#723_107)
    - [7.3如何一次在堆上申请4G的空间](https://blog.csdn.net/qq_45657288/article/details/114699235#734G_110)

### 1. 1.C/C++内存分布
+ **我们从一段代码来分析内存分布(有图有注释)**  
![](/img/posts/18c4268c21bc4d9d4526bbc64eef36c1.png)

![](/img/posts/46cc38a085119efdd87518504c1e6764.png)

+ **总结**：
+ **栈又叫堆栈**，非静态局部变量/函数参数/返回值等等，栈是向下增长的
+ **内存映射段是高效的I/O映射方式**，用于装载一个共享的动态内存库。用户可使用系统接口创建共享共 享内存，做进程间通信
+ **堆**用于程序运行时动态内存分配，堆是可以上增长的
+ **数据段**–存储全局数据和静态数据
+ **代码段**–可执行的代码/只读常量

### 2. 2.C语言中动态内存管理方式
#### 2.1. 2.1malloc/calloc/[realloc](https://so.csdn.net/so/search?q=realloc&spm=1001.2101.3001.7020)/free区别
![](/img/posts/d38bd31d0311e8fc65a24e59693d7890.png)

+ 总结：
+ **malloc**：只进行`空间申请，不进行初始化`
+ **calloc**：进行`空间申请+零初始化`
+ **realloc**：①如果`传入的第一个参数为nullptr/NULL，功能等价于malloc`
+ ②调整空间大小：`a.直接原地调整大小` b.`重新开空间，内容拷贝，释放原有空间`(注意显式释放问题，引起二次释放的问题)

### 3. 3.C++中动态内存管理(new和delete)
#### 3.1. 3.1new/delete操作内置类型
![](/img/posts/b706570a8b8cbddacc15253b931c1fd1.png)  
![](/img/posts/e1447b0fba881177d4cc3969a270f7ab.png)

#### 3.2. 3.2new/delete操作自定义类型
![](/img/posts/d25a46a6808248d00f61f8ad48728529.png)

+ **注意：**在申请自定义类型的空间时，new会调用构造函数，delete会调用析构函数，而malloc与free不会

### 4. 4.operator new和operator delete函数
#### 4.1. 4.1operator new和operator delete 底层原理
+ `new` 和 `delete`是用户进行**动态内存申请和释放的操作符**，`operator new` 和`operator delete`是系统提供的全局函数，**new在底层调用operator new全局函数来申请空间**，**delete在底层通过operator delete全局函数来释放空间**
+ **operator new**  
![](/img/posts/4036e1cae2d8df6b26c84ae4e0b29fdd.png)
+ **operator delete**

![](/img/posts/d1ef1a7242e8fe3542f6f38c6c487258.png)

#### 4.2. 4.2operaor new和operator delete的类专属重载
+ 通过重载类专属`operator new`,`operator delete`，**实现节点使用内存池申请和释放内存，提高效率**  
![](/img/posts/ef8c7cf305fc012e1240c3e4fa4bbef5.png)

### 5. 5.new和delete的实现原理
### 6. 6.定位new表达式（placement-new）
+ 定位new表达式是**在已分配的原始内存空间中调用构造函数初始化一个对象**
+ **使用格式**：
+ new (place_address) type 或者 new (place_address) type(initializer-list)
+ place_address必须是一个指针，initializer-list是类型的初始化列表
+ **使用场景**：
+ 定位new表达式在实际中一般是**配合内存池使用**。因为内存池分配出的内存没有初始化，所以如果是`自定义类型的对象`，需要使用new的定义表达式进行显示调构造函数进行初始化  
![](/img/posts/3ef7b2b3adb7880efbbf7f1f231191c8.png)

### 7. 7.相关面试题
#### 7.1. 7.1malloc/free和new/delete的区别
+ **共同点：**
+ malloc/free和new/delete的共同点是：都是`从堆上申请空间，并且需要用户手动释放`
+ **不同点：**
+ malloc 和free是`函数`，new和delete是`操作符`
+ malloc申请的空间`不会初始化`，new`可以初始化`
+ malloc申请空间时，需要手动计算空间大小并传递，new只需在其后跟上空间的类型即可
+ malloc的返回值为void*, 在`使用时必须强转`，new不需要，因为new后跟的是空间的类型
+ malloc申请空间失败时，`返回的是NULL`，因此使用时必须判空，new不需要，但是`new需要捕获异常`
+ 申请自定义类型对象时，malloc/free只会开辟空间，不会调用构造函数与析构函数，而new在申请空间后会调用构造函数完成对象的初始化，delete在释放空间前后会调用析构函数完成空间中资源的清理

#### 7.2. 7.2内存泄漏
##### 7.2.1. 7.2.1什么是内存泄漏，内存泄露的危害
+ 内存泄漏：内存泄漏指**因为疏忽或错误造成程序未能释放**已经不再使用的内存的情况。内存泄漏**并不是指内存在物理上的消失**，**而是应用程序分配某段内存后**，**因为设计错误，失去了对该段内存的控制，因而 造成了内存的浪费**
+ 危害：长期运行的程序出现**内存泄漏**，影响很大，如操作系统、后台服务等等，出现内存泄漏会**导致响应越来越慢，最终卡死**
+ 理解：就像在图书馆借书，只借不还，逐渐下去，图书馆自然无法运营下去

```rust
void MemoryLeaks()
    {
    // 1.内存申请了忘记释放
    int* p1 = (int*)malloc(sizeof(int));
int* p2 = new int;

// 2.异常安全问题
int* p3 = new int[10];

Func(); // 这里Func函数抛异常导致 delete[] p3未执行，p3没被释放.

delete[] p3;
}
```

##### 7.2.2. 7.2.2内存泄漏的分类
+ **堆内存泄露（Heap leak）**：
+ 堆内存指的是程序执行中依据须要分配通过malloc / calloc / realloc / new等从堆中分配的一块内存，用完后必须通过调用相应的 free或者delete 删掉。假设程序的设计错误导致这部分内存没有被释放，那么以后这部分空间将无法再被使用，就会产生Heap Leak
+ **系统资源泄露**：
+ 指程序使用系统分配的资源，比方套接字、文件描述符、管道等没有使用对应的函数释放掉，导致系统资源的浪费，严重可导致系统效能减少，系统执行不稳定

##### 7.2.3. 7.2.3如何避免内存泄漏
+ 事前预防——智能指针
+ 事后查错——泄露检测工具

#### 7.3. 7.3如何一次在堆上申请4G的空间
+ 因为32位的环境下虚拟地址空间的大小只有4g，而光内核空间就需要1g，所以不可能申请得到，只有在64位的环境下才可以实现，只需要把执行环境改为64x即可

```rust
#include `<iostream>`
    using namespace std;
int main()
    {
        void* p = new char[0xfffffffful];
cout `<< "new:" << p << endl;
return 0;
}
```

![](/img/posts/a16e31be97135ca4d4807be8e0e61ba0.png)  


>` 来自: [C/C++——new和delete的实现原理（详解）_delete[]的实现原理-CSDN博客](https://blog.csdn.net/qq_45657288/article/details/114699235)
>

