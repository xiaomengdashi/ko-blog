---
sidebar_position: 1
slug: /C++/基础知识/C++-!-泛型编程，函数模板，类模板-!_泛型编程和函数式编程
---

---
title: C++ | 泛型编程，函数模板，类模板 |_泛型编程和函数式编程-CSDN博客
date: '2025-01-01 01:45:39'
updated: '2025-01-01 01:46:14'
slug: /C++/基础知识/C++-!-泛型编程，函数模板，类模板-!_泛型编程和函数式编程---
#### 模板初阶
+ [1.泛型编程](https://blog.csdn.net/qq_45657288/article/details/114712243#1_1)
    - [1.1实现一个通用的交换函数（函数重载）](https://blog.csdn.net/qq_45657288/article/details/114712243#11_2)
    - [1.2引入泛型编程](https://blog.csdn.net/qq_45657288/article/details/114712243#12_28)
+ [2.函数模板](https://blog.csdn.net/qq_45657288/article/details/114712243#2_32)
    - [2.1函数模板概念](https://blog.csdn.net/qq_45657288/article/details/114712243#21_33)
    - [2.2函数模板格式](https://blog.csdn.net/qq_45657288/article/details/114712243#22_36)
    - [2.3函数模板原理](https://blog.csdn.net/qq_45657288/article/details/114712243#23_38)
    - [2.4函数模板的实例化](https://blog.csdn.net/qq_45657288/article/details/114712243#24_44)
        * [2.4.1隐式实例化](https://blog.csdn.net/qq_45657288/article/details/114712243#241_45)
        * [2.4.2显式实例化](https://blog.csdn.net/qq_45657288/article/details/114712243#242_48)
    - [2.5模板参数的匹配原则](https://blog.csdn.net/qq_45657288/article/details/114712243#25_53)
+ [3.类模板](https://blog.csdn.net/qq_45657288/article/details/114712243#3_58)
    - [3.1类模板的定义格式](https://blog.csdn.net/qq_45657288/article/details/114712243#31_59)
    - [3.2类模板的实例化](https://blog.csdn.net/qq_45657288/article/details/114712243#32_61)

## 1.泛型编程
### 1.1实现一个通用的交换函数（函数重载）
```cpp
void Swap(int& left, int& right) 
{
    int temp = left;
    left = right;
    right = temp; 
}
void Swap(double& left, double& right) 
{
    double temp = left;
    left = right;
    right = temp; 
}
void Swap(char& left, char& right) 
{
    char temp = left;
    left = right;
    right = temp; 
}
```

+ 虽然可以用函数重载实现，但是也有**缺点**：
+ `重载的函数仅仅只是类型不同，代码的复用率比较低，只要有新类型出现时，就需要增加对应的函数`
+ `代码的可维护性比较低，一个出错可能所有的重载均出错`

### 1.2引入泛型编程
+ 如果在C++中，也能够存在这样一个模具，通过给这个模具中填充不同材料(类型)，来获得不同材料的铸件(生成具体类型的代码），那将会节省许多的时间，提高了效率。
+ **泛型编程**：编写与类型无关的通用代码，是代码复用的一种手段  
![](/img/posts/f6d7d73af5da5d967120f99fef7b231d.png)

## 2.函数模板
### 2.1函数模板概念
+ 函数模板代表了一个函数家族，该函数模板**与类型无关**，在使用时被参数化，**根据实参类型产生函数的特定类型版本**

### 2.2函数模板格式
![](/img/posts/37a7f40214ecbf358d3592f6d3b9095a.png)

### 2.3函数模板原理
+ 函数模板是一个蓝图，它本身并不是函数，是编译器用使用方式产生特定具体类型函数的模具。所以其实模板就是将本来应该我们做的重复的事情交给了编译器  
![](/img/posts/3e1c2efb076faca8abd91e332733fbfb.png)
+ 在编译器编译阶段，对于模板函数的使用，编译器需要**根据传入的实参类型来推演生成对应类型的函数以供调用**。
+ 比如：**当用double类型使用函数模板时，编译器通过对实参类型的推演，将T确定为double类型，然后产生一份专门处理double类型的代码**，对于字符类型char也是如此

### 2.4函数模板的实例化
#### 2.4.1隐式实例化
+ **隐式实例化：编译器根据实参进行自动推导，产生直接可执行的代码**  
![](/img/posts/1092b0387aab4ce36ccc5c36d0ac6d32.png)

#### 2.4.2显式实例化
+ **显式实例化：函数名 + <类型> +（参数列表）**  
![](/img/posts/1cf55880dbe4b72a129ecf35a1a872a9.png)
+ **如果类型不匹配，编译器会尝试进行隐式类型转换，如果无法转换成功编译器将会报错**。

### 2.5模板参数的匹配原则
![](/img/posts/caba86d79d8c7ca97cf5fbd9e73b1262.png)

+ **注意： 模板函数不允许自动类型转换，但普通函数可以进行自动类型转换**

## 3.类模板
### 3.1类模板的定义格式
![](/img/posts/7f84b574998b2da94da965d9eaa34692.png)

### 3.2类模板的实例化
+ 类模板实例化与函数模板实例化不同，类模板实例化需要在类模板名字后跟< >，然后将实例化的类型放在< > 中即可，类模板名字不是真正的类，而实例化的结果才是真正的类
+ **拿一个日期类来举例子，上代码**  
![](/img/posts/a34a285b470b9577fe6aaf9cbb2b5c31.png)

  


> 来自: [C++ | 泛型编程，函数模板，类模板 |_泛型编程和函数式编程-CSDN博客](https://blog.csdn.net/qq_45657288/article/details/114712243)
>

