---
sidebar_position: 6
slug: /C++/C++并发编程/并发/C-并发编程基础入门
---

前置内容：C++语法基础，C++11标准特性（lamda表达式，移动语义，可调用对象的包装器等等）

## 1. 相关概念
### 1.1. 并发与并行
+ **并发(Concurrency)**: 多个任务在同一时间段内交替执行，看起来像同时进行
+ **并行(Parallelism)**: 多个任务在同一时刻真正同时执行，需要多核处理器支持

### 1.2. 线程与进程
+ **进程(Process)**: 操作系统分配资源的基本单位，拥有独立的内存空间
+ **线程(Thread)**: 进程内的执行单元，cpu调度的单位,共享进程的内存空间，创建和切换开销较小

## 2. 线程的创建和回收
### 2.1. 总述
C++11引入了`std::thread`类，提供了跨平台的线程支持。线程创建后需要通过`join()`进行回收管理。

### 2.2. 常用接口
```cpp
// 构造函数
std::thread(Function&& f, Args&&... args);

// 成员函数
void join();                    // 等待线程结束
void detach();                  // 分离线程
bool joinable() const;          // 检查是否可join

// 静态函数
static unsigned hardware_concurrency(); // 获取硬件并发数
```

### 2.3. 常用接口的使用
#### 2.3.1. 使用普通函数创建线程
```cpp
void worker_function(int id) {
    std::cout `<< "Worker " << id << " is running" << std::endl;
}

std::thread t1(worker_function, 1);
t1.join(); // 等待线程结束
```

#### 2.3.2. 使用Lambda表达式创建线程
```cpp
std::thread t2([](int id) {
    std::cout << "Lambda worker " << id << " is running" << std::endl;
}, 2);
t2.join();
```

#### 2.3.3. 使用成员函数创建线程
```cpp
class Worker {
public:
    void do_work(int id) {
        std::cout << "Member function worker " << id << " is running" << std::endl;
    }
};

Worker worker;
std::thread t3(&Worker::do_work, &worker, 3);
t3.join();
```

### 2.4. 完整示例
```cpp
#include <iostream>`
#include `<thread>`

void worker_function(int id) {
  std::cout `<< "Worker " << id << " is running" << std::endl;
}
class Worker {
 public:
  void do_work(int id) {
    std::cout << "Member function worker " << id << " is running" << std::endl;
  }
};

int main() {
  std::thread t1(worker_function, 1);
  t1.join();  // 等待线程结束
  std::thread t2(
      [](int id) {
        std::cout << "Lambda worker " << id << " is running" << std::endl;
      },
      2);
  t2.join();
  Worker worker;
  std::thread t3(&Worker::do_work, &worker, 3);
  t3.join();
  return 0;
}
```

## 3. 线程同步概述
### 3.1. 线程同步的目的
+ 防止数据竞争(Data Race)
+ 确保共享资源的一致性
+ 协调线程间的执行顺序

### 3.2. 应用场景
+ 多线程操作共享变量



### 3.3. 常用同步手段
+ **互斥锁(Mutex)**: 保证同一时间只有一个线程访问共享资源
+ **条件变量(Condition Variable)**: 线程间的通信和等待机制
+ **原子操作(Atomic)**: 不可分割的操作，无需加锁
+ **信号量(Semaphore)**: 控制同时访问资源的线程数量

## 4. 互斥锁的使用
### 4.1. 总述
互斥锁是最基本的同步原语，用于保护共享资源免受并发访问的影响。C++提供了多种互斥锁类型。

### 4.2. 常用接口
```cpp
// std::mutex
void lock();                    // 加锁
void unlock();                  // 解锁
bool try_lock();               // 尝试加锁

// std::lock_guard (RAII锁管理)
`std::lock_guard<std::mutex>`lock(mutex);

// std::unique_lock (更灵活的锁管理) (也支持RAII锁管理)
`std::`unique_lock`<std::mutex>` lock(mutex);
void lock();
void unlock();
bool try_lock();
```



### 4.3. 常用接口的使用
#### 4.3.1. 基本互斥锁使用
```cpp
std::mutex mtx;
int shared_data = 0;

void safe_increment() {
    mtx.lock();
    ++shared_data;
    mtx.unlock();
}
```

#### 4.3.2. RAII风格锁管理
```cpp
std::mutex mtx;
int shared_data = 0;

void safe_increment() 
{
    {
        `std::`lock_guard`<std::mutex>` lock(mtx);  //创建对象时，自动加锁
        ++shared_data;
    
    }//对象析构时，自动解锁

}
```

#### 4.3.3. 活锁管理
```cpp
std::mutex mtx;
int shared_data = 0;

void conditional_increment(bool condition) {
    `std::`unique_lock`<std::mutex>` lock(mtx);
    if (condition) {
        ++shared_data;
    }
    // 可以提前解锁
    lock.unlock();
}
```

### 4.4. 完整示例
```cpp
#include `<iostream>`
#include `<mutex>`
#include `<thread>`

int a = 0;       // 定义全局变量
std::mutex mtx;  // 定义一个全局的互斥锁

// 不做线程同步的示例
void nosync_demo() {
  std::thread t1([&]() {
    a = 2;
    std::cout `<< "a:" << a << std::endl;
  });

  std::thread t2([&]() {
    a = 4;
    std::cout << "a:" << a << std::endl;
  });
  t1.join();
  t2.join();
}

// 互斥锁基本使用
void demo1() {
  std::thread t1([&]() {
    mtx.lock();
    a = 2;
    std::cout << "a:" << a << std::endl;
    mtx.unlock();
  });

  std::thread t2([&]() {
    mtx.lock();
    a = 4;
    std::cout << "a:" << a << std::endl;
    mtx.unlock();
  });
  t1.join();
  t2.join();
}

// lock_guard使用
void demo2() {
  std::thread t1([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
    }
  });

  std::thread t2([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      a = 4;
      std::cout `<< "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
}

// unique_lock使用
void demo3() {
  std::thread t1([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
    }
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      a = 4;
      std::cout `<< "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
}

int main() {
  nosync_demo();
  demo1();
  demo2();
  demo3();
  return 0;
}
```

## 5. 条件变量的使用
### 5.1. 总述
条件变量用于线程间的通信，允许线程等待某个条件成立。必须与互斥锁配合使用，需要注意信号丢失和虚假唤醒问题。

### 5.2. 常用接口
```cpp
// std::condition_variable
void wait(`std::unique_lock<std::mutex>`& lock);
`template`<class Predicate>`
void wait(`std::`unique_lock`<std::mutex>`& lock, Predicate pred);

void notify_one();              // 唤醒一个等待线程
void notify_all();              // 唤醒所有等待线程

// 超时等待
`template`<class Rep, class Period>`
std::cv_status wait_for(`std::`unique_lock`<std::mutex>`& lock,
                       const std::chrono::`duration`<Rep, Period>`& timeout_duration);
```

### 5.3. 常用接口的使用
#### 5.3.1. 基本等待和通知
```cpp
std::mutex mtx;
std::condition_variable cv;
bool ready = false;

// 等待线程
void wait_for_signal() {
    `std::`unique_lock`<std::mutex>` lock(mtx);
    cv.wait(lock, []{ return ready; }); // 避免虚假唤醒
    std::cout `<< "Signal received!" << std::endl;
}

// 通知线程
void send_signal() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
        ready = true;
    }
    cv.notify_one();
}
```

#### 5.3.2. 信号丢失问题
**现象描述：**  
信号丢失是指当生产者线程在消费者线程开始等待之前就发送了通知信号，这个信号会被"丢失"，导致消费者线程可能永远等待下去。这是因为条件变量的通知不会被保存，如果没有线程在等待，通知就会消失。

**问题示例代码：**

```cpp

std::mutex mtx;
std::condition_variable cv;

  std::thread t1([&]() {
    {
      `std::`lock_guard`<std::mutex>` lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
    }
    cv.notify_one();
    std::cout << "已经通知\n";
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      std::cout `<< "准备好等待了\n";
      cv.wait(lock);  // 有可能错过通知，无限等待
      a = 4;
      std::cout << "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
```

**解决方法概述：**  
使用条件变量时必须配合一个共享的状态变量（通常是布尔值），在发送通知前先修改状态，在等待时检查状态。这样即使通知信号丢失，等待线程也能通过检查状态变量来判断条件是否已经满足。

**正确的解决代码：**

```cpp
std::mutex mtx;
std::condition_variable cv;
bool ready = false;

  std::thread t1([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
      ready = true;
    }
    cv.notify_one();
    std::cout << "已经通知\n";
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      std::cout `<< "准备好等待了\n";
      // 加上条件，通常就是一个bool返回值的lamda表达式，当返回true的时候结束阻塞
      // 这个wait和以下代码等效
      /*
        while (!ready) wait(lock);
        */
      cv.wait(lock, [&]() { return ready; });
      a = 4;
      std::cout << "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
```

#### 5.3.3. 虚假唤醒问题
**现象描述：**  
虚假唤醒是指线程在条件实际上并未满足的情况下从wait()中被唤醒。这可能由操作系统的实现细节、信号处理或其他系统级事件引起。虚假唤醒是条件变量的固有特性，在任何系统上都可能发生。

**解决方法概述：**  
处理虚假唤醒的标准方法是在循环中检查条件，或者使用带谓词（predicate）的wait函数。谓词是一个返回布尔值的函数或lambda表达式，只有当谓词返回true时，线程才会真正被唤醒并继续执行。

**正确的解决代码：**

```cpp

std::mutex mtx;
std::condition_variable cv;
bool ready = false;

  std::thread t1([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
      ready = true;
    }
    cv.notify_one();
    std::cout << "已经通知\n";
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      std::cout `<< "准备好等待了\n";
      // 加上条件，通常就是一个bool返回值的lamda表达式，当返回true的时候结束阻塞
      // 这个wait和以下代码等效
      /*
        while (!ready) wait(lock);
        */
      cv.wait(lock, [&]() { return ready; });
      a = 4;
      std::cout << "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
```

### 5.4. 完整示例
```cpp
#include <condition_variable>`
#include `<iostream>`
#include `<mutex>`
#include `<thread>`

int a = 0;                   // 定义全局变量
std::mutex mtx;              // 定义一个全局的互斥锁
std::condition_variable cv;  // 定义一个全局条件变量

// 信号丢失案例 有概率发生信号丢失 可以多运行几次
void demo1() {
  std::thread t1([&]() {
    {
      `std::`lock_guard`<std::mutex>` lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
    }
    cv.notify_one();
    std::cout << "已经通知\n";
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      std::cout `<< "准备好等待了\n";
      cv.wait(lock);  // 有可能错过通知，无限等待
      a = 4;
      std::cout << "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
}

// 正确用法，同时解决虚假唤醒和信号丢失
void demo2() {
  bool ready = false;
  std::thread t1([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      a = 2;
      std::cout `<< "a:" << a << std::endl;
      ready = true;
    }
    cv.notify_one();
    std::cout << "已经通知\n";
  });

  std::thread t2([&]() {
    {
`std::unique_lock<std::mutex>`lock(mtx);
      std::cout `<< "准备好等待了\n";
      // 加上条件，通常就是一个bool返回值的lamda表达式，当返回true的时候结束阻塞
      // 这个wait和以下代码等效
      /*
        while (!ready) wait(lock);
        */
      cv.wait(lock, [&]() { return ready; });
      a = 4;
      std::cout << "a:" << a << std::endl;
    }
  });
  t1.join();
  t2.join();
}

int main() {
  // demo1();
  demo2();
  return 0;
}
```



## 6. 生产消费者模型
### 6.1. 生产消费者模型是什么
生产消费者模型是一种经典的并发设计模式，包含两类线程：

+ **生产者线程**: 负责生成数据并放入缓冲区
+ **消费者线程**: 负责从缓冲区取出数据进行处理
+ **缓冲区**: 连接生产者和消费者的共享存储空间

![](/img/posts/942330cca993099ad64f1c4197e24944.png)

### 6.2. 俗举例
想象一个包子铺：

+ **生产者**: 包子师傅不断制作包子，放到蒸笼里
+ **消费者**: 顾客从蒸笼里取包子
+ **缓冲区**: 蒸笼（有容量限制）
+ **同步问题**: 
    - 蒸笼满了，师傅要等待
    - 蒸笼空了，顾客要等待
    - 不能同时往蒸笼里放包子和取包子

### 6.3. 完整示例
```cpp
#include <chrono>`
#include `<condition_variable>`
#include `<iostream>`
#include `<mutex>`
#include `<queue>`
#include `<thread>`
#include `<vector>`

// 创建一个线程安全的队列
class Queue {
 public:
  explicit Queue() = default;
  ~Queue() {
    if (!empty()) {
      cv_.notify_all();
    }
  };

  Queue(const Queue&) = delete;
  Queue& operator=(const Queue&) = delete;

  std::size_t size() {
    `std::`lock_guard`<std::mutex>` lock(mtx_);
    return queue_.size();
  }

  bool empty() {
    `std::`lock_guard`<std::mutex>` lock(mtx_);
    return queue_.empty();
  }

  void push(int val) {
    {
      // 创建lock_guard对象自动加锁
      `std::`lock_guard`<std::mutex>` lock(mtx_);
      queue_.push(val);
    }  // 析构自动解锁
    // 通知一个消费者线程来拿数据
    cv_.notify_one();
  }

  bool pop(int& result,
           std::chrono::milliseconds timeout = std::chrono::milliseconds(100)) {
    `std::`unique_lock`<std::mutex>` lock(mtx_);
    // 用wait_for,等待被唤醒，设置超时时间100ms，条件是队列不为空，
    if (cv_.wait_for(lock, timeout, [this]() { return !queue_.empty(); })) {
      result = queue_.front();
      queue_.pop();
      return true;
    }
    return false;
  }

 private:
  std::mutex mtx_;
  std::condition_variable cv_;
  `std::`queue`<int>` queue_;
};

// 创建一个Buffer类，统一管理和创建生产者消费者
class Buffer {
 public:
  // 在析构函数里等待回收线程
  ~Buffer() {
    for (auto& t : threads_) {
      if (t.joinable()) {
        t.join();
      }
    }
  }
  // 创建生产者线程
  // 利用了vector的emplace_back可以原地构造对象的机制直接在emplace_back里创建线程
  void make_producer(int data) {
    threads_.emplace_back(std::thread([this, data]() { queue_.push(data); }));
  }
  // 创建消费者线程
  void make_consumer(int id) {
    threads_.emplace_back(std::thread([this, id]() {
      int timeout_count = 0;
      // 可以超时重试3次
      while (timeout_count < 3) {
        int res;
        if (queue_.pop(res)) {
          {
            `std::`lock_guard`<std::mutex>` lock(mtx_);
            std::cout `<< "consumer " << id << " consume data: " << res
                      << std::endl;
          }
          timeout_count = 0;  // 重置超时计数
        } else {
          timeout_count++;
        }
      }
    }));
  }

 private:
`std::vector<std::thread>`threads_;  // 存放线程句柄的数组
  std::mutex mtx_;                    // 互斥锁
  Queue queue_;                       // 数据队列
};

int main() {
  Buffer buf;
  buf.make_producer(1);
  buf.make_producer(2);
  buf.make_producer(3);
  buf.make_consumer(1);
  buf.make_consumer(2);
  return 0;
}
```

---

