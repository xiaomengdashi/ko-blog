---
sidebar_position: 11
slug: /C++/C++并发编程/并发/C-异步编程基础入门
---

## 1. 什么是异步？
想象你在餐厅点餐：

**同步方式（传统方式）**：你点完餐后，就站在柜台前一直等着，直到厨师做完你的菜，你才能拿到食物，然后才能去做其他事情。

**异步方式**：你点完餐后，服务员给你一个号码牌，你可以去找座位、玩手机、聊天，当你的菜做好时，服务员会叫号通知你来取餐。你会有三种情况，第一种是服务员叫号的时候你听到了，你去取餐了；第二种，你通常也会遇到你没听到通知，你可能会在完成你手头的事情自己去看看餐有没有好；第三种，你可能选择刷一会儿手机然后自己去看看餐有没有好，刷一会儿手机然后自己去看看餐有没有好。

在编程中也是如此：

+ **同步**：程序执行一个任务时，必须等待这个任务完全完成后才能继续执行下一个任务
+ **异步**：程序可以启动一个任务，然后不等待它完成就继续执行其他任务，当任务完成时会通过某种方式通知程序

### 1.1. 步编程的优势
1. **提高程序响应性**：UI界面不会因为耗时操作而卡顿
2. **提高资源利用率**：CPU可以在等待I/O操作时处理其他任务
3. **提高程序吞吐量**：可以同时处理多个任务

---

## 2. std::promise - std::future
`std::promise`是一个可以设置值或异常的对象，用于在一个线程中设置结果；`std::future`是一个可以获取异步操作结果的对象，用于在另一个线程中获取结果。它们通过共享状态连接，形成一个单向的通信通道。

`promise`就像是一个"承诺书"，你可以在里面写下承诺要给别人的东西；`future`就像是一个"提货券"，持有者可以用它来获取承诺的东西。当你在`promise`中放入值时，持有`future`的人就能取到这个值。

### 2.1. 常用接口
**std::promise 主要接口**：

+ `set_value(value)`：设置结果值
+ `set_exception(exception_ptr)`：设置异常
+ `get_future()`：获取关联的future对象

**std::future 主要接口**：

+ `get()`：获取结果（阻塞等待）
+ `wait()`：等待结果准备好（阻塞等待）
+ `wait_for(duration)`：等待指定时间
+ `wait_until(time_point)`：等待到指定时间点
+ `valid()`：检查future是否有效

### 2.2. 常用接口的使用方法
```cpp
// 创建promise和future
`std::`promise`<int>` prom;
`std::`future`<int>` fut = prom.get_future();

// 在promise中设置值
prom.set_value(42);

// 从future中获取值
int result = fut.get();  // result = 42

// 检查状态
if (fut.wait_for(std::chrono::seconds(0)) == std::future_status::ready) {

// 结果已准备好

}
```

### 2.3. 完整代码示例
```cpp
#include `<chrono>`
#include `<future>`
#include `<iostream>`
#include `<mutex>`
#include `<thread>`

int main() {
  `std::`promise`<int>` mypromise;
  std::mutex mtx;
  std::thread t1([&]() {
    {
      `std::`lock_guard`<std::mutex>` lock(mtx);
      std::cout `<< "线程: " << std::this_thread::get_id()
                << " 正在执行任务.....\n";
    }
    std::this_thread::sleep_for(std::chrono::seconds(1));
    mypromise.set_value(100);
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout `<< "线程: " << std::this_thread::get_id()
                << " promise设置完毕\n";
    }
  });
  std::thread t2([&]() {
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout `<< "线程: " << std::this_thread::get_id()
                << " 正在执行任务.....\n";
    }
    std::this_thread::sleep_for(std::chrono::seconds(5));
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout `<< "线程: " << std::this_thread::get_id()
                << " 准备开始获取结果.....\n";
    }
    auto res = mypromise.get_future().get();
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout `<< "线程: " << std::this_thread::get_id()
                << " 获取到promise: " << res << std::endl;
    }
  });

  t1.join();
  t2.join();
  return 0;
}
```

---

## 3. std::packaged_task - std::future
`std::packaged_task`是一个可调用对象的包装器，可以异步执行并将结果存储在future中。它将函数调用和future机制结合，自动管理promise-future的创建和连接。

`packaged_task`就像是一个"任务包裹"，你把要执行的函数放进这个包裹里，它会自动帮你准备好"提货券"（future）。当你执行这个包裹时，结果会自动放到提货券里，你可以随时用提货券来取结果。

### 3.1. 常用接口
**std::packaged_task 主要接口**：

+ `packaged_task(function)`：构造函数，包装一个可调用对象
+ `operator()(args...)`：执行包装的函数
+ `get_future()`：获取关联的future对象
+ `valid()`：检查是否有关联的共享状态
+ `reset()`：重置共享状态

### 3.2. 常用接口的使用方法
```cpp
// 创建packaged_task
`std::packaged_task<int(int, int)>`task([](int a, int b) {
    return a + b;
});

// 获取future
`std::`future`<int>` fut = task.get_future();

// 执行任务
task(3, 4);

// 获取结果
int result = fut.get();  // result = 7
```

### 3.3. 完整代码示例
```cpp
#include `<chrono>`
#include `<future>`
#include `<iostream>`
#include `<mutex>`
#include `<thread>`
int main() {
  std::mutex mtx;
  // 创建异步任务包装器
  `std::`packaged_task`<int()>` task([&]() {
    {
      `std::`lock_guard`<std::mutex>` lock(mtx);
      std::cout `<< "子线程开始.....\n";
    }
    int sum = 0;
    for (int i = 0; i < 1000; i++) sum += i;
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout `<< "子线程返回.....\n";
    }
    return sum;
  });
  // 获取到包装器绑定的future
  auto f = task.get_future();
  // 创建异步任务线程
  std::thread t1(std::move(task));

  std::cout << "主线程正在执行任务.....\n";
  std::this_thread::sleep_for(std::chrono::seconds(3));
  std::cout << "主线程开始获取结果.....\n";
  // 调用get方法获取到线程的结果
  auto res = f.get();
  std::cout << "主线程get value: " << res << std::endl;
  t1.join();
  return 0;
}
```

---

## 4. std::async - std::future
`std::async`是一个函数模板，用于异步执行函数并返回future对象。它可以自动管理线程的创建和销毁，支持不同的启动策略，返回的future对象可以用来获取异步操作的结果。

`std::async`就像是一个"万能助手"，你只需要告诉它要做什么事情（函数），它会自动安排人手（线程）去做，并给你一个"取货单"（future）。你不需要关心具体是谁在做这件事，只需要用取货单去拿结果就行了。

### 4.1. 常用接口
**std::async 主要接口**：

+ `async(function, args...)`：使用默认策略异步执行
+ `async(launch_policy, function, args...)`：使用指定策略异步执行

**启动策略**：

+ `std::launch::async`：强制异步执行（创建新线程）
+ `std::launch::deferred`：延迟执行（调用get()时才执行）
+ `std::launch::async | std::launch::deferred`：系统自动选择（默认）

### 4.2. 常用接口的使用方法
```cpp
// 基本用法
auto fut1 = std::async([]() {
    return 42;
});

// 指定启动策略
auto fut2 = std::async(std::launch::async, [](int x) {
    return x * 2;
}, 21);

// 获取结果
int result1 = fut1.get();
int result2 = fut2.get();
```

### 4.3. 完整代码示例
```cpp
#include <chrono>`
#include `<future>`
#include `<iostream>`
#include `<mutex>`
#include `<thread>`

int main() {
  std::mutex mtx;
  auto f = std::async([&]() {
    {
      `std::`lock_guard`<std::mutex>` lock(mtx);
      std::cout `<< "子线程开始.....\n";
    }
    int sum = 0;
    for (int i = 0; i < 1000; i++) sum += i;
    {
`std::lock_guard<std::mutex>`lock(mtx);
      std::cout << "子线程返回.....\n";
    }
    return sum;
  });
  std::cout << "主线程正在执行任务.....\n";
  std::this_thread::sleep_for(std::chrono::seconds(3));
  std::cout << "主线程开始获取结果.....\n";
  // 调用get方法获取到线程的结果
  auto res = f.get();
  std::cout << "主线程get value: " << res << std::endl;

  return 0;
}
```



## 5. 总结：从单值传递到任务调度的递进关系
这三种异步编程方式体现了从基础通信到完整任务调度的递进关系：

### 5.1. 第一层：promise-future（基础的单值传递异步机制）
+ **核心特征**：提供最基础的"单值传递"异步通信
+ **本质**：一个线程承诺给另一个线程传递一个值
+ **机制**：纯粹的数据传递通道，不涉及任务概念



### 5.2. 第二层：packaged_task-future（基于任务的异步机制）
+ **核心特征**：引入了"任务"概念，将函数封装为可异步执行的任务
+ **递进关系**：在单值传递基础上，增加了"任务执行"的抽象
+ **本质**：不再是简单的值传递，而是"执行一个任务并获取结果"
+ **机制**：自动管理promise-future的创建，但仍需手动管理线程

### 5.3. 第三层：async-future（有线程调度的基于任务的异步机制）
+ **核心特征**：在任务概念基础上，增加了自动的"线程调度"
+ **递进关系**：完善了任务执行的整个生命周期管理
+ **本质**："提交任务 + 自动调度 + 获取结果"的完整异步解决方案
+ **机制**：完全自动化的任务执行和线程管理

### 5.4. 进的核心逻辑
1. **promise-future**：解决了"如何在线程间传递单个值"的问题
2. **packaged_task-future**：解决了"如何将函数调用变成异步任务"的问题  
3. **async-future**：解决了"如何自动调度和执行异步任务"的问题

