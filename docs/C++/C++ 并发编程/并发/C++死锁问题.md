---
sidebar_position: 1
slug: /C++/C++-并发编程/并发/C++死锁问题
---

## 1. 死锁问题是什么
死锁（Deadlock）是指两个或多个线程在执行过程中，因争夺资源而造成的一种互相等待的现象。当多个线程同时被阻塞，它们中的任何一个都无法继续执行，除非其他线程释放资源，但其他线程也在等待资源释放，从而形成循环等待，导致程序永久阻塞。

## 2. 死锁产生的四个必要条件
死锁的产生必须同时满足以下四个条件（Coffman条件）：

1. **互斥条件（Mutual Exclusion）**：资源不能被多个线程同时使用
2. **占有和等待条件（Hold and Wait）**：线程已经持有至少一个资源，同时又在等待获取其他资源
3. **不可剥夺条件（No Preemption）**：资源不能被强制从持有它的线程中抢夺
4. **循环等待条件（Circular Wait）**：存在一个线程等待链，形成环路



## 3. 死锁场景深入剖析
### 3.1 经典双锁死锁场景
```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mutex1;
std::mutex mutex2;

void thread1() {
    std::lock_guard<std::mutex> lock1(mutex1);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    std::lock_guard<std::mutex> lock2(mutex2);  // 等待mutex2
    std::cout << "Thread 1 finished" << std::endl;
}

void thread2() {
    std::lock_guard<std::mutex> lock2(mutex2);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    std::lock_guard<std::mutex> lock1(mutex1);  // 等待mutex1
    std::cout << "Thread 2 finished" << std::endl;
}

int main() {
    std::thread t1(thread1);
    std::thread t2(thread2);
    
    t1.join();
    t2.join();
    return 0;
}
```

**问题分析**：

+ 线程1持有mutex1，等待mutex2
+ 线程2持有mutex2，等待mutex1
+ 形成循环等待，满足死锁的四个条件

### 3.2 多线程资源竞争死锁
```cpp
#include <iostream>
#include <thread>
#include <mutex>

class BankAccount {
public:
    std::mutex mtx;
    int balance;
    
    BankAccount(int bal) : balance(bal) {}
    
    void transfer(BankAccount& to, int amount) {
        std::lock_guard<std::mutex> lock1(mtx);
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        std::lock_guard<std::mutex> lock2(to.mtx);
        
        balance -= amount;
        to.balance += amount;
    }
};

int main() {
    BankAccount acc1(1000);
    BankAccount acc2(1000);
    
    std::thread t1([&]() { acc1.transfer(acc2, 100); });
    std::thread t2([&]() { acc2.transfer(acc1, 200); });
    
    t1.join();
    t2.join();
    return 0;
}
```

**问题分析**：

+ 两个线程分别尝试在不同账户间转账
+ 每个线程都需要同时锁定两个账户
+ 锁定顺序不一致导致循环等待

### 3.3 递归锁死锁场景
```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mtx;

void recursiveFunction(int depth) {
    std::lock_guard<std::mutex> lock(mtx);
    if (depth > 0) {
        recursiveFunction(depth - 1);  // 尝试再次获取同一个锁
    }
}

int main() {
    std::thread t([]() { recursiveFunction(2); });
    t.join();
    return 0;
}
```

**问题分析**：

+ 同一线程尝试多次获取不可重入的mutex
+ 第二次lock_guard尝试获取已被持有的锁
+ 造成自死锁

### 3.4 多层嵌套锁死锁
```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mtx_a, mtx_b, mtx_c;

void worker1() {
    std::lock_guard<std::mutex> lock_a(mtx_a);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_b(mtx_b);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_c(mtx_c);
}

void worker2() {
    std::lock_guard<std::mutex> lock_b(mtx_b);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_c(mtx_c);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_a(mtx_a);
}

void worker3() {
    std::lock_guard<std::mutex> lock_c(mtx_c);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_a(mtx_a);
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::lock_guard<std::mutex> lock_b(mtx_b);
}

int main() {
    std::thread t1(worker1);
    std::thread t2(worker2);
    std::thread t3(worker3);
    
    t1.join();
    t2.join();
    t3.join();
    return 0;
}
```

**问题分析**：

+ 三个线程形成复杂的循环等待
+ worker1: A→B→C, worker2: B→C→A, worker3: C→A→B
+ 形成三角形循环依赖



## 4. C++具体解决方法
### 4.1 std::lock - 同时锁定多个互斥量
**核心特点**：

+ 原子性地锁定多个互斥量
+ 避免死锁的同时锁定
+ 使用死锁避免算法  
**解决原理**：  
`std::lock`内部实现了死锁避免算法，通过尝试锁定、回退、重试的机制确保不会产生死锁。当无法同时获取所有锁时，会释放已获取的锁并重试。  
**std::lock源码（两个锁）**

```cpp
template <class _L0, class _L1>
_LIBCPP_HIDE_FROM_ABI void lock(_L0& __l0, _L1& __l1) {
  while (true) {
    {
      unique_lock<_L0> __u0(__l0);     //锁定l0
      if (__l1.try_lock()) {           //尝试l1加锁   
        __u0.release();                //释放l0所有权（__u0在析构时候不会解锁）
        break;                         //退出循环
      }
    }                                   //如果l1尝试加锁失败，__u0会在析构函数中解锁
    __libcpp_thread_yield();             //让出cpu时间
    {
      unique_lock<_L1> __u1(__l1);       //锁定l1
      if (__l0.try_lock()) {             //尝试l0加锁 
        __u1.release();                  //释放l1所有权（__u1在析构时候不会解锁）
        break;
      }
    }                                  //如果l1尝试加锁失败,__u0会在析构函数中解锁
    __libcpp_thread_yield();              //让出cpu时间
  }                                        
}
```

**std::lock源码（多把锁）**  
核心：分治递归+锁顺序重排重试+每次尝试后主动让出cpu  
概述：首先锁定第一个互斥量，然后尝试获取剩余所有锁，失败时锁定第二个互斥量并将第一个锁移至队尾重新尝试，若仍失败则递归调用自身处理从第三个锁开始的子问题，同时将前两个锁移至队尾；每次失败后让出CPU时间片，通过索引跳跃和参数重排实现轮询，当所有锁成功获取时返回，整个过程在有限循环内通过动态调整锁的获取顺序避免死锁。

```cpp
//std::lock主体实现
template <class _L0, class _L1, class _L2, class... _L3>

inline _LIBCPP_HIDE_FROM_ABI void lock(_L0& __l0, _L1& __l1, _L2& __l2, _L3&... __l3) {

std::__lock_first(0, __l0, __l1, __l2, __l3...);

}

//__lock_first主体实现  
template <class _L0, class _L1, class _L2, class... _L3>
void __lock_first(int __i, _L0& __l0, _L1& __l1, _L2& __l2, _L3&... __l3) {

while (true) {
switch (__i) {
    case 0: {
    unique_lock<_L0> __u0(__l0);
    __i = std::try_lock(__l1, __l2, __l3...);
    if (__i == -1) {
        __u0.release();
    return;
    }
}

++__i;
__libcpp_thread_yield();
break;

case 1: {
    unique_lock<_L1> __u1(__l1);
    __i = std::try_lock(__l2, __l3..., __l0);
    if (__i == -1) {
    __u1.release();
    return;
    }
    }
    if (__i == sizeof...(_L3) + 1)
    __i = 0;
    else
    __i += 2;
    __libcpp_thread_yield();
    break;
    default:
        std::__lock_first(__i - 2, __l2, __l3..., __l0, __l1);
return;
}
}
}

//try_lock主体实现
template <class _L0, class _L1, class _L2, class... _L3>
_LIBCPP_HIDE_FROM_ABI int try_lock(_L0& __l0, _L1& __l1, _L2& __l2, _L3&... __l3) {
int __r = 0;
unique_lock<_L0> __u0(__l0, try_to_lock);
if (__u0.owns_lock()) {
__r = std::try_lock(__l1, __l2, __l3...);
if (__r == -1)
__u0.release();
else
++__r;
}
return __r;
}

 -1 ：成功获取所有锁
 0 ：第一个锁获取失败
>0 ：第n个锁获取失败（n从1开始）  


```



**示例代码**

```cpp
#include <iostream>
#include <mutex>
#include <thread>

std::mutex mutex1;
std::mutex mutex2;

void safeThread1() {
    std::lock_guard<std::mutex> lock1(mutex1, std::adopt_lock);
    std::lock_guard<std::mutex> lock2(mutex2, std::adopt_lock);
    std::lock(mutex1, mutex2);  // 原子性锁定
    std::cout << "Thread 1 safely acquired both locks" << std::endl;
}

void safeThread2() {
    std::unique_lock<std::mutex> lock1(mutex1, std::defer_lock);
    std::unique_lock<std::mutex> lock2(mutex2, std::defer_lock);

    std::lock(lock1, lock2);  // 原子性锁定

    std::cout << "Thread 2 safely acquired both locks" << std::endl;
}

int main() {
    std::thread t1(safeThread1);
    std::thread t2(safeThread2);

    t1.join();
    t2.join();
    return 0;
}
```



### 4.2 std::scoped_lock (C++17) - RAII多锁管理
**核心特点**：

+ C++17引入的RAII锁管理器
+ 自动调用std::lock进行死锁避免
+ 构造时锁定，析构时释放

**解决原理**：  
内部封装了std::lock的调用，提供更简洁的RAII接口，确保异常安全。

```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mutex1;
std::mutex mutex2;

void modernSafeThread() {
    std::scoped_lock lock(mutex1, mutex2);  // C++17简化语法
    std::cout << "Modern safe thread acquired locks" << std::endl;
    // 自动释放锁
}

int main() {
    std::thread t1(modernSafeThread);
    std::thread t2(modernSafeThread);
    
    t1.join();
    t2.join();
    return 0;
}
```

### 4.3 std::recursive_mutex - 可重入锁
**核心特点**：

+ 允许同一线程多次获取同一锁
+ 维护锁定计数
+ 必须匹配unlock调用次数

**解决原理**：  
内部维护线程ID和锁定计数，同一线程可以多次锁定而不会阻塞，解决递归调用中的自死锁问题。

```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::recursive_mutex rec_mtx;

void recursiveFunction(int depth) {
    std::lock_guard<std::recursive_mutex> lock(rec_mtx);
    std::cout << "Depth: " << depth << std::endl;
    
    if (depth > 0) {
        recursiveFunction(depth - 1);  // 安全的递归调用
    }
}

class RecursiveClass {
private:
    std::recursive_mutex mtx;
    int value = 0;
    
public:
    void method1() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        value++;
        method2();  // 调用另一个需要锁的方法
    }
    
    void method2() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        value *= 2;
    }
    
    int getValue() {
        std::lock_guard<std::recursive_mutex> lock(mtx);
        return value;
    }
};

int main() {
    std::thread t([]() { recursiveFunction(3); });
    t.join();
    
    RecursiveClass obj;
    obj.method1();
    std::cout << "Final value: " << obj.getValue() << std::endl;
    return 0;
}
```

### 4.4 超时锁机制
**核心特点**：

+ 设置锁获取超时时间
+ 避免无限等待
+ 提供错误处理机制

**解决原理**：  
通过时间限制打破无限等待，允许线程在超时后采取替代策略，如重试、报错或执行其他逻辑。

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <chrono>

std::timed_mutex tmtx1;
std::timed_mutex tmtx2;

void timeoutThread1() {
    std::unique_lock<std::timed_mutex> lock1(tmtx1);
    
    if (tmtx2.try_lock_for(std::chrono::milliseconds(100))) {
        std::cout << "Thread 1 acquired both locks" << std::endl;
        tmtx2.unlock();
    } else {
        std::cout << "Thread 1 timeout, avoiding deadlock" << std::endl;
    }
}

void timeoutThread2() {
    std::unique_lock<std::timed_mutex> lock2(tmtx2);
    
    if (tmtx1.try_lock_for(std::chrono::milliseconds(100))) {
        std::cout << "Thread 2 acquired both locks" << std::endl;
        tmtx1.unlock();
    } else {
        std::cout << "Thread 2 timeout, avoiding deadlock" << std::endl;
    }
}

// 更复杂的超时重试机制
class TimeoutRetryLock {
private:
    std::timed_mutex& mtx1;
    std::timed_mutex& mtx2;
    
public:
    TimeoutRetryLock(std::timed_mutex& m1, std::timed_mutex& m2) 
        : mtx1(m1), mtx2(m2) {}
    
    bool acquireBothLocks(int maxRetries = 3) {
        for (int retry = 0; retry < maxRetries; ++retry) {
            std::unique_lock<std::timed_mutex> lock1(mtx1, std::defer_lock);
            std::unique_lock<std::timed_mutex> lock2(mtx2, std::defer_lock);
            
            if (std::try_lock(lock1, lock2) == -1) {
                std::cout << "Successfully acquired both locks on retry " << retry << std::endl;
                return true;
            }
            
            std::this_thread::sleep_for(std::chrono::milliseconds(10 * (retry + 1)));
        }
        return false;
    }
};

int main() {
    std::thread t1(timeoutThread1);
    std::thread t2(timeoutThread2);
    
    t1.join();
    t2.join();
    
    // 测试重试机制
    TimeoutRetryLock retryLock(tmtx1, tmtx2);
    if (!retryLock.acquireBothLocks()) {
        std::cout << "Failed to acquire locks after retries" << std::endl;
    }
    
    return 0;
}
```

### 4.5 层次锁（Hierarchical Locking）
**核心特点**：

+ 为锁分配层次级别
+ 只能从高层次向低层次获取锁
+ 编译时或运行时检查锁顺序

**解决原理**：  
通过强制锁的获取顺序，从根本上消除循环等待的可能性。

```cpp


#include <iostream>
#include <mutex>
#include <stdexcept>
#include <thread>

class HierarchicalMutex {
private:
    std::mutex          internal_mutex;            // 内部实际使用的标准互斥锁
    unsigned long const hierarchy_value;           // 当前互斥锁的层次值（构造后不可更改）
    unsigned long       previous_hierarchy_value;  // 保存获取此锁之前线程的层次值，用于解锁时恢复
    static thread_local unsigned long
        this_thread_hierarchy_value;  // 线程局部存储：当前线程持有的最高层次值

    /**
     * 检查层次违规
     * 规则：只能从高层次锁向低层次锁获取
     * 即：当前线程层次值必须大于要获取的锁的层次值
     */
    void check_for_hierarchy_violation() {
        if (this_thread_hierarchy_value <= hierarchy_value) {
            throw std::logic_error("Mutex hierarchy violated");
        }
    }

    /**
     * 更新线程的层次值
     * 保存当前层次值到previous_hierarchy_value，然后将线程层次值更新为当前锁的层次值
     */
    void update_hierarchy_value() {
        previous_hierarchy_value = this_thread_hierarchy_value;  // 保存当前状态，用于解锁时恢复
        this_thread_hierarchy_value = hierarchy_value;           // 更新线程层次值为当前锁的层次值
    }

public:
    /**
     * 构造函数
     * @param value 该互斥锁的层次值，值越大表示层次越高
     */
    explicit HierarchicalMutex(unsigned long value)
        : hierarchy_value(value), previous_hierarchy_value(0) {}

    /**
     * 加锁操作
     * 1. 首先检查是否违反层次规则
     * 2. 获取内部互斥锁
     * 3. 更新线程的层次状态
     */
    void lock() {
        check_for_hierarchy_violation();  // 检查层次违规
        internal_mutex.lock();            // 获取实际的互斥锁
        update_hierarchy_value();         // 更新线程层次状态
    }

    /**
     * 解锁操作
     * 1. 恢复线程之前的层次值
     * 2. 释放内部互斥锁
     * 注意：解锁顺序与加锁顺序相反，符合栈的LIFO特性
     */
    void unlock() {
        this_thread_hierarchy_value = previous_hierarchy_value;  // 恢复之前的层次值
        internal_mutex.unlock();                                 // 释放实际的互斥锁
    }

    /**
     * 尝试加锁操作（非阻塞）
     * 1. 检查层次违规
     * 2. 尝试获取内部互斥锁
     * 3. 如果成功，更新层次状态
     * @return true表示成功获取锁，false表示锁已被占用
     */
    bool try_lock() {
        check_for_hierarchy_violation();  // 检查层次违规
        if (!internal_mutex.try_lock()) {
            return false;  // 锁已被占用，直接返回false
        }
        update_hierarchy_value();  // 成功获取锁，更新层次状态
        return true;
    }
};

/**
 * 线程局部存储变量的定义
 * 初始值设为ULONG_MAX，表示最高层次，允许获取任何层次的锁
 * 每个线程都有自己独立的this_thread_hierarchy_value副本
 */
thread_local unsigned long HierarchicalMutex::this_thread_hierarchy_value(ULONG_MAX);

// 创建三个不同层次的互斥锁实例
// 层次值越大表示层次越高，必须按照从高到低的顺序获取
HierarchicalMutex high_level_mutex(10000);  // 高层次互斥锁
HierarchicalMutex mid_level_mutex(5000);    // 中层次互斥锁
HierarchicalMutex low_level_mutex(1000);    // 低层次互斥锁

/**
 * 低层次操作函数
 * 获取最低层次的锁并执行操作
 */
void do_low_level_stuff() {
    std::lock_guard<HierarchicalMutex> lock(low_level_mutex);  // RAII方式自动管理锁
    std::cout << "Low level operation" << std::endl;
}

/**
 * 中层次操作函数
 * 获取中层次锁，然后调用低层次操作
 * 这是正确的：从中层次(5000)到低层次(1000)
 */
void do_mid_level_stuff() {
    std::lock_guard<HierarchicalMutex> lock(mid_level_mutex);  // 获取中层次锁
    do_low_level_stuff();  // 正确：从中层次到低层次，5000 > 1000
    std::cout << "Mid level operation" << std::endl;
}

/**
 * 高层次操作函数
 * 获取高层次锁，然后调用中层次操作
 * 这是正确的：从高层次(10000)到中层次(5000)
 */
void do_high_level_stuff() {
    std::lock_guard<HierarchicalMutex> lock(high_level_mutex);  // 获取高层次锁
    do_mid_level_stuff();  // 正确：从高层次到中层次，10000 > 5000
    std::cout << "High level operation" << std::endl;
}

/**
 * 主函数
 * 创建线程执行高层次操作，演示层次化互斥锁的正确使用
 */
int main() {
    try {
        std::thread t(do_high_level_stuff);  // 创建线程执行高层次操作
        t.join();                            // 等待线程完成
    } catch (const std::exception& e) {
        std::cout << "Exception: " << e.what() << std::endl;  // 捕获并打印异常信息
    }
    return 0;
}
```

**工作原理**

+ 初始状态：this_thread_hierarchy_value = ULONG_MAX
+ 执行流程：
    - do_high_level_stuff(): 获取high_level_mutex(10000)；检查：ULONG_MAX > 10000 ✓ 通过；更新：this_thread_hierarchy_value = 10000
    - do_mid_level_stuff(): 获取mid_level_mutex(5000)；检查：10000 > 5000 ✓ 通过；更新：this_thread_hierarchy_value = 5000
    - do_low_level_stuff(): 获取low_level_mutex(1000)；检查：5000 > 1000 ✓ 通过；更新：this_thread_hierarchy_value = 1000
+ 解锁过程：按照栈的方式（LIFO）逐层恢复层次值

