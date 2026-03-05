---
sidebar_position: 9
slug: /C++/基础知识/C++之多态总结
---

---
title: C++之多态总结（多态的定义及实现，抽象类，多态原理，单继承，多继承中的虚函数表）_c++多态的概念-CSDN博客
date: '2024-12-31 01:12:40'
updated: '2024-12-31 01:12:40'
slug: /C++/基础知识/C++之多态总结
##### 0.0.1. C++中多态相关知识
+ [1.多态的概念](https://blog.csdn.net/qq_45657288/article/details/116376516#1_1)
    - [1.1概念](https://blog.csdn.net/qq_45657288/article/details/116376516#11_2)
+ [2.多态的定义及实现](https://blog.csdn.net/qq_45657288/article/details/116376516#2_7)
    - [2.1多态构成的条件](https://blog.csdn.net/qq_45657288/article/details/116376516#21_8)
    - [2.2虚函数](https://blog.csdn.net/qq_45657288/article/details/116376516#22_16)
    - [2.3虚函数的重写](https://blog.csdn.net/qq_45657288/article/details/116376516#23_20)
        * [2.3.1虚函数重写的两个例外](https://blog.csdn.net/qq_45657288/article/details/116376516#231_26)
    - [2.4 C++11 overrride 和 final](https://blog.csdn.net/qq_45657288/article/details/116376516#24_C11_overrride__final_33)
    - [2.5重载、覆盖(重写)、隐藏(重定义)的对比](https://blog.csdn.net/qq_45657288/article/details/116376516#25_39)
+ [3.抽象类](https://blog.csdn.net/qq_45657288/article/details/116376516#3_44)
    - [3.1概念](https://blog.csdn.net/qq_45657288/article/details/116376516#31_45)
    - [3.2接口继承和实现继承](https://blog.csdn.net/qq_45657288/article/details/116376516#32_49)
+ [4.多态的的原理](https://blog.csdn.net/qq_45657288/article/details/116376516#4_54)
    - [4.1虚函数表](https://blog.csdn.net/qq_45657288/article/details/116376516#41_55)
    - [4.2多态实现的原理](https://blog.csdn.net/qq_45657288/article/details/116376516#42_75)
    - [4.3动态绑定与静态绑定](https://blog.csdn.net/qq_45657288/article/details/116376516#43_93)
+ [5.单继承和多继承关系中的虚函数表](https://blog.csdn.net/qq_45657288/article/details/116376516#5_97)
    - [5.1单继承中的虚函数表](https://blog.csdn.net/qq_45657288/article/details/116376516#51_98)
    - [5.2多继承中的虚函数表](https://blog.csdn.net/qq_45657288/article/details/116376516#52_153)

### 1. 1.多态的概念
#### 1.1. 1.1概念
+ **多态的概念**：通俗来说，就是`多种形态`，`具体点就是去完成某个行为`，`当不同的对象去完成时会产生出不同的状态`
+ 举个例子：比如买票这个行为，当普通人买票时，是全价买票；学生买票时，是半价买票；军人买票时是优先买票

### 2. 2.多态的定义及实现
#### 2.1. 2.1多态构成的条件
#### 2.2. 2.2虚函数
+ **虚函数**：即被virtual修饰的类成员函数称为虚函数  
![](/img/posts/3f8cf7343dcd865d6531e22456cc8851.png)

#### 2.3. 2.3虚函数的重写
##### 2.3.1. 2.3.1虚函数重写的两个例外
#### 2.4. C++11 overrride 和 final
#### 2.5. 2.5重载、覆盖(重写)、隐藏(重定义)的对比
![](/img/posts/774324509ad581850715d2b86cde908b.png)

### 3. 3.[抽象类](https://so.csdn.net/so/search?q=%E6%8A%BD%E8%B1%A1%E7%B1%BB&spm=1001.2101.3001.7020)
#### 3.1. 3.1概念
+ 在虚函数的后面加上 `=0` ，则这个函数为`纯虚函数`。**包含纯虚函数的类叫做抽象类（也叫接口类）**，`抽象类不能实例化出对象`。**派生类继承后也不能实例化出对象**，只有重写纯虚函数，派生类才能实例化出对象。纯虚函数规范了派生类必须重写，另外纯虚函数更体现出了接口继承  
![](/img/posts/2d0f72b83630c26751ce914f5f6111d5.png)

#### 3.2. 3.2接口继承和实现继承
+ **普通函数的继承**是一种`实现继承`，派生类继承了基类函数，可以使用函数，继承的是函数的实现
+ **虚函数的继承**是一种`接口继承`，派生类继承的是基类虚函数的接口，目的是为了重写，达成多态，继承的是接口
+ 所以如果不实现多态，不要把函数定义成虚函数

### 4. 4.多态的的原理
#### 4.1. 4.1虚函数表
+ 我们先看一道常见的笔试题：**求sizeof（class）的大小**
+ **普通函数**  
![](/img/posts/58cba851c71cd28627b2678fc96f532a.png)
+ **虚函数**  
![](/img/posts/82f756c1e929d68780de069bebb1e456.png)
+ **测试完我们发现是8bytes，我们打开监视窗口会发现**  
![](/img/posts/aaef4b86a558e116990e1adacb67a673.png)
+ **我们再增加一个派生类去探一探这虚函数表**  
![](/img/posts/034775f1a6849ba808663cb8d3ec7f9c.png)
+ **我们打开监视窗口看一看**  
![](/img/posts/61323916e71d86b0af9542a1d5be1f0c.png)
+ **总结**：
+ `Ⅰ`.**派生类的虚表生成过程**：`a`.先将基类的虚表内容拷贝一份到派生类虚表中`b`.如果派生类重写了基类中的某个虚函数，用派生类自己的虚函数覆盖基类的虚函数 `c`.派生类新增加的虚函数按其再派生类中的声明顺序依次加到虚表的后面
+ `Ⅱ`.**虚函数表的本质其实是一个指针数组**，数组以`nullptr`结束，`a.`数组中每一个元素为虚函数指针，`b.`子类会继承父类的虚函数表，`c`.普通函数指针不会放在虚表中，`d`.虚函数指针在虚表的存放顺序和声明/定义的顺序一致
+ `Ⅲ`.虚表指针存在对象中，虚表存在代码段，虚函数指针存在虚表中，虚函数再代码段，
+ `Ⅳ`.虚函数指针指向虚函数的首地址，它是一个二级指针，因为指向的虚表是指针数组

#### 4.2. 4.2多态实现的原理
+ 我们还是拿买票来举例子：

![](/img/posts/4f12e2982e2cf94c341a999f7b0e2259.png)

#### 4.3. 4.3动态绑定与静态绑定
+ 静态绑定又称为前期绑定(早绑定)，**在程序编译期间确定了程序的行为**，也称为**静态多态**，比如：`函数重载`，`模板编程`
+ 动态绑定又称后期绑定(晚绑定)，**是在程序运行期间**，**根据具体拿到的类型确定程序的具体行为**，调用具体的函数，也称为**动态多态**，比如：`继承`

### 5. 5.单继承和多继承关系中的虚函数表
#### 5.1. 5.1单继承中的虚函数表
+ 我们举一个单继承的栗子：

![](/img/posts/75386ba7e51c7e236e7dbf894922a65f.png)

![](/img/posts/43b6cb5effd7649fd0f88210f1b67835.png)

+ **那么我可以写一段代码来查看d的虚表**：

```plain
typedef void(*VFPTR) ();
void PrintVTable(VFPTR vTable[])
{
 // 依次取虚表中的虚函数指针打印并调用。调用就可以看出存的是哪个函数
 cout `<< " 虚表地址>`" `<< vTable << endl;
 for (int i = 0; vTable[i] != nullptr; ++i)
 {
 printf(" 第%d个虚函数地址 :0X%x,->`", i, vTable[i]);
 VFPTR f = vTable[i];
 f();
 }
 cout `<< endl; 
 }
// 思路：取出b、d对象的头4bytes，就是虚表的指针，前面我们说了虚函数表本质是一个存虚函数指针的指针数组，这个数组最后面放了一个nullptr
// 1.先取b的地址，强转成一个int*的指针
 // 2.再解引用取值，就取到了b对象头4bytes的值，这个值就是指向虚表的指针
 // 3.再强转成VFPTR*，因为虚表就是一个存VFPTR类型(虚函数指针类型)的数组。
 // 4.虚表指针传递给PrintVTable进行打印虚表
 // 5.需要说明的是这个打印虚表的代码经常会崩溃，因为编译器有时对虚表的处理不干净，虚表最后面没有放nullptr，导致越界，这是编译器的问题。我们只需要点目录栏的-生成-清理解决方案，再编译就好了。
int main()
{
 Base b;
 Derive d;
 VFPTR* vTableb = (VFPTR*)(*(int*)&b);
 PrintVTable(vTableb);
 VFPTR* vTabled = (VFPTR*)(*(int*)&d);
 PrintVTable(vTabled);
 return 0; 
 }
```

+ 运行结果：  
![](/img/posts/9523dd86ea9db17ca6b291f7cd4dfad8.png)
+ 虚表中的位置：

![](/img/posts/e033d44d9735eeb2676e15595f13a505.png)

+ **单继承虚表总结**：
+ `Ⅰ`.子类继承父类的虚表
+ `Ⅱ`.子类重写的虚函数，其虚函数指针会覆盖父类中的虚函数指针
+ `Ⅲ`.子类型定义的虚函数，其虚函数指针会按照定义/声明的顺序存放在继承的父类的虚表末尾

#### 5.2. 5.2多继承中的虚函数表
+ 举一个多继承的栗子：  
![](/img/posts/f050ef5269489655b26b37381025ee4a.png)
+ 我们打开监视窗口：  
![](/img/posts/6c424a6383eba5c692987c4be7c7ffc6.png)
+ 我们依然写一段代码来查看虚表地址：

```plain
typedef void(*VFPTR) ();
void PrintVTable(VFPTR vTable[])
{
 cout << " 虚表地址>`" `<< vTable << endl;
 for (int i = 0; vTable[i] != nullptr; ++i)
 {
 printf(" 第%d个虚函数地址 :0X%x,->`", i, vTable[i]);
 VFPTR f = vTable[i];
 f();
 }
 cout `<< endl; 
 }
int main()
{
 Derive d;
 VFPTR* vTableb1 = (VFPTR*)(*(int*)&d);
 PrintVTable(vTableb1);
 VFPTR* vTableb2 = (VFPTR*)(*(int*)((char*)&d+sizeof(Base1)));
 PrintVTable(vTableb2);
 return 0; 
}
```

+ 运行结果：  
![](/img/posts/ffdeb28f6a305e717f1c7181b4b35926.png)
+ **多继承虚表总结**：
+ `Ⅰ`.虚表的个数与直接父类的个数相同
+ `Ⅱ`.子类继承每一个直接的父类
+ `Ⅲ`.子类重写的虚函数，其虚函数指针会覆盖对应父类中的虚函数指针
+ `Ⅳ`.子类新定义的虚函数，其虚函数指针会按照声明或定义的顺序依次存放在继承的第一个直接父类的虚表末尾

  


>` 来自: [C++之多态总结（多态的定义及实现，抽象类，多态原理，单继承，多继承中的虚函数表）_c++多态的概念-CSDN博客](https://blog.csdn.net/qq_45657288/article/details/116376516)
>

