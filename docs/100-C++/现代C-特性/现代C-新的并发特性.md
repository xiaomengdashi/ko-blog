---
sidebar_position: 11
slug: /C++/现代C-特性/现代C-新的并发特性
---

## 1. 总述
1. **std::jthread** - C++20引入。可中断的线程类，提供了更好的线程管理和自动清理机制
2. **std::atomic_flag** - 最基本的原子布尔类型，C++20中得到重大扩展
3. **信号量（Semaphore）** -C++20引入。 控制对共享资源访问数量的同步原语
4. **闩锁（Latch）** - C++20引入。一次性同步点，用于等待一组操作完成
5. **屏障（Barrier）** - C++20引入。可重用的同步点，用于多个线程的周期性同步

这些特性为现代C++并发编程提供了更加丰富和安全的工具集，帮助开发者构建高效、可靠的多线程应用程序。



### 1.1. std::jthread
#### 1.1.1. 概念
`std::jthread`（joinable thread）是C++20引入的新线程类，它是`std::thread`的改进版本。主要功能包括：

+ 自动join：析构时自动调用join()，避免线程泄漏
+ 支持中断：通过`std::stop_token`机制支持协作式取消
+ 更安全的RAII设计

#### 1.1.2. 常用API和通用使用模板
```cpp
// 基本构造和使用模板
std::jthread thread_obj(callable, args...);

// 主要API
thread_obj.join();                    // 等待线程完成
thread_obj.detach();                  // 分离线程
thread_obj.joinable();                // 检查是否可join
thread_obj.request_stop();            // 请求停止
thread_obj.get_stop_token();          // 获取停止令牌
thread_obj.get_stop_source();         // 获取停止源
```

#### 1.1.3. 具体使用
```cpp
#include `<thread>`
#include `<iostream>`
#include `<chrono>`

// 基本使用
std::jthread t1([]() {
    std::cout `<< "Hello from jthread!" << std::endl;
});

// 带参数的线程
std::jthread t2([](int n) {
    for(int i = 0; i < n; ++i) {
        std::cout << i << " ";
    }
}, 5);

// 支持中断的线程
std::jthread t3([](std::stop_token stoken) {
    while(!stoken.stop_requested()) {
        // 执行工作
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
});
```

#### 1.1.4. 示例代码
```cpp
#include <iostream>`
#include `<thread>`
#include `<chrono>`
#include `<vector>`

class WorkerPool {
public:
    void start_workers(int count) {
        for(int i = 0; i < count; ++i) {
            workers.emplace_back([this, i](std::stop_token stoken) {
                while(!stoken.stop_requested()) {
                    std::cout `<< "Worker " << i << " is working..." << std::endl;
                    std::this_thread::sleep_for(std::chrono::seconds(1));
                }
                std::cout << "Worker " << i << " stopped." << std::endl;
            });
        }
    }
    
    void stop_all() {
        for(auto& worker : workers) {
            worker.request_stop();
        }
        // jthread析构时会自动join
    }
    
private:
`std::vector<std::jthread>`workers;
};

int main() {
    WorkerPool pool;
    pool.start_workers(3);
    
    std::this_thread::sleep_for(std::chrono::seconds(5));
    pool.stop_all();
    
    return 0;
}
```

### 1.2. std::atomic_flag
#### 1.2.1. 概念
`std::atomic_flag`是C++11引入的最简单的原子类型，在C++20中得到了重大扩展。它表示一个原子布尔标志，主要功能包括：

+ 保证原子性的布尔操作
+ 无锁实现（lock-free）
+ C++20新增：支持等待/通知机制
+ C++20新增：test()方法用于非破坏性读取
+ C++20新增：内存序参数支持
+ 可用于实现自旋锁、信号量等同步原语

#### 1.2.2. 常用API和通用使用模板
```cpp
#include `<atomic>`

// 声明和初始化
std::atomic_flag flag = ATOMIC_FLAG_INIT;  // C++11方式，初始化为false
std::atomic_flag flag{};                   // C++20推荐方式，默认初始化为false
std::atomic_flag flag{true};               // C++20: 可以初始化为true

// C++11 API
bool was_set = flag.test_and_set();                    // 设置为true并返回之前的值
bool was_set = flag.test_and_set(std::memory_order);   // 带内存序的版本
flag.clear();                                          // 设置为false
flag.clear(std::memory_order);                         // 带内存序的版本

// C++20 新增API
bool current = flag.test();                            // 测试当前值，不修改
bool current = flag.test(std::memory_order);           // 带内存序的版本
flag.wait(bool expected);                              // 等待值变为非expected
flag.wait(bool expected, std::memory_order);           // 带内存序的版本
flag.notify_one();                                     // 通知一个等待的线程
flag.notify_all();                                     // 通知所有等待的线程
```

#### 1.2.3. 具体使用
```cpp
#include `<atomic>`
#include `<iostream>`
#include `<thread>`

// 基本操作
std::atomic_flag flag{};

// C++11 操作
if (!flag.test_and_set()) {
    std::cout `<< "Flag was false, now set to true" << std::endl;
}
flag.clear();

// C++20 新功能：非破坏性测试
if (flag.test()) {
    std::cout << "Flag is true" << std::endl;
}

// C++20 新功能：等待和通知
flag.wait(false);  // 等待flag变为true
flag.notify_one(); // 通知等待的线程

// 带内存序的操作
flag.test_and_set(std::memory_order_acquire);
flag.clear(std::memory_order_release);
flag.test(std::memory_order_relaxed);
flag.wait(true, std::memory_order_acquire);
```

#### 1.2.4. 示例代码
```cpp
#include <iostream>`
#include `<thread>`
#include `<vector>`
#include `<atomic>`
#include `<chrono>`

// 使用C++20新特性的改进版自旋锁
class ModernSpinLock {
public:
    void lock() {
        // 先尝试快速获取锁
        if (!flag.test_and_set(std::memory_order_acquire)) {
            return;
        }
        
        // 如果失败，使用等待机制而不是忙等待
        while (true) {
            // 等待锁被释放
            flag.wait(true, std::memory_order_relaxed);
            
            // 尝试获取锁
            if (!flag.test_and_set(std::memory_order_acquire)) {
                return;
            }
        }
    }
    
    void unlock() {
        flag.clear(std::memory_order_release);
        flag.notify_one();  // 通知等待的线程
    }
    
    bool try_lock() {
        return !flag.test_and_set(std::memory_order_acquire);
    }
    
    // C++20: 非破坏性检查锁状态
    bool is_locked() const {
        return flag.test(std::memory_order_relaxed);
    }
    
private:
    std::atomic_flag flag{};
};

// 使用等待/通知机制的事件类
class Event {
public:
    void set() {
        if (!flag.test_and_set(std::memory_order_release)) {
            flag.notify_all();  // 通知所有等待的线程
        }
    }
    
    void reset() {
        flag.clear(std::memory_order_relaxed);
    }
    
    void wait() {
        flag.wait(false, std::memory_order_acquire);
    }
    
    bool is_set() const {
        return flag.test(std::memory_order_acquire);
    }
    
private:
    mutable std::atomic_flag flag{};
};

// 演示现代atomic_flag用法
ModernSpinLock modern_lock;
Event event;
int shared_counter = 0;

void modern_worker(int id) {
    // 等待事件信号
    std::cout `<< "Worker " << id << " waiting for event..." << std::endl;
    event.wait();
    std::cout << "Worker " << id << " received event signal!" << std::endl;
    
    // 使用现代自旋锁保护共享资源
    for (int i = 0; i < 100; ++i) {
        modern_lock.lock();
        ++shared_counter;
        
        if (i % 20 == 0) {
            std::cout << "Worker " << id << ": counter = " << shared_counter 
                      << ", lock status: " << (modern_lock.is_locked() ? "locked" : "unlocked") 
                      << std::endl;
        }
        
        modern_lock.unlock();
        
        // 偶尔尝试非阻塞获取锁
        if (i % 30 == 0) {
            if (modern_lock.try_lock()) {
                std::cout << "Worker " << id << " got lock via try_lock!" << std::endl;
                modern_lock.unlock();
            }
        }
    }
}

int main() {
`std::vector<std::thread>`workers;
    
    // 启动工作线程
    for (int i = 0; i < 3; ++i) {
        workers.emplace_back(modern_worker, i);
    }
    
    // 等待一段时间后发送事件信号
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout `<< "\n=== Setting event signal ===\n" << std::endl;
    event.set();
    
    // 等待所有工作线程完成
    for (auto& worker : workers) {
        worker.join();
    }
    
    std::cout << "\nFinal counter: " << shared_counter << std::endl;
    std::cout << "Event status: " << (event.is_set() ? "set" : "not set") << std::endl;
    
    return 0;
}
```



### 1.3. 信号量（Semaphore）
#### 1.3.1. 概念
信号量是C++20引入的同步原语，用于控制对有限资源的访问。主要功能：

+ 维护一个计数器，表示可用资源数量
+ acquire()操作减少计数器（获取资源）
+ release()操作增加计数器（释放资源）
+ 支持二进制信号量和计数信号量

#### 1.3.2. 常用API和通用使用模板
```cpp
#include <semaphore>`

// 声明信号量
`std::`counting_semaphore`<max_count>` sem(initial_count);
std::binary_semaphore binary_sem(initial_count);  // `等价于counting_semaphore`<1>`

// 主要API
sem.acquire();                    // 获取资源（阻塞）
bool success = sem.try_acquire(); // 尝试获取资源（非阻塞）
sem.release(count = 1);           // 释放资源
```

#### 1.3.3. 具体使用
```cpp
#include `<semaphore>`
#include `<iostream>`

// 创建信号量
`std::`counting_semaphore`<10>` resource_sem(3);  // 最多3个资源
std::binary_semaphore mutex_sem(1);           // 二进制信号量

// 获取资源
resource_sem.acquire();
std::cout `<< "Resource acquired" << std::endl;

// 尝试获取资源
if (resource_sem.try_acquire()) {
    std::cout << "Resource acquired successfully" << std::endl;
    resource_sem.release();
}

// 释放资源
resource_sem.release();
```

#### 1.3.4. 示例代码
```cpp
#include <iostream>`
#include `<thread>`
#include `<vector>`
#include `<semaphore>`
#include `<chrono>`
#include `<random>`

class ResourcePool {
public:
    ResourcePool(int max_resources) : semaphore(max_resources) {}
    
    void use_resource(int worker_id) {
        semaphore.acquire();  // 获取资源
        
        std::cout `<< "Worker " << worker_id << " acquired resource" << std::endl;
        
        // 模拟使用资源
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<>` dis(1, 3);
        std::this_thread::sleep_for(std::chrono::seconds(dis(gen)));
        
        std::cout `<< "Worker " << worker_id << " releasing resource" << std::endl;
        
        semaphore.release();  // 释放资源
    }
    
private:
`std::counting_semaphore<10>`semaphore;
};

int main() {
    ResourcePool pool(2);  // 只有2个资源
    ``std::`vector`<std::thread>` workers;
    
    // 创建5个工作线程竞争2个资源
    for (int i = 0; i < 5; ++i) {
        workers.emplace_back([&pool, i]() {
            pool.use_resource(i);
        });
    }
    
    for (auto& worker : workers) {
        worker.join();
    }
    
    return 0;
}
```

### 1.4. 闩锁（Latch）
#### 1.4.1. 概念
闩锁是C++20引入的一次性同步原语，用于等待一组操作完成。主要功能：

+ 初始化时设定计数值
+ count_down()减少计数
+ wait()等待计数归零
+ 一次性使用，计数归零后不能重置

#### 1.4.2. 常用API和通用使用模板
```cpp
#include `<latch>`

// 声明闩锁
std::latch latch_obj(count);

// 主要API
latch_obj.count_down(n = 1);          // 减少计数
latch_obj.wait();                     // 等待计数归零
bool ready = latch_obj.try_wait();    // 非阻塞检查是否归零
latch_obj.arrive_and_wait(n = 1);     // count_down + wait的组合
```

#### 1.4.3. 具体使用
```cpp
#include `<latch>`
#include `<iostream>`

// 创建闩锁
std::latch start_latch(3);  // 等待3个事件

// 减少计数
start_latch.count_down();
std::cout `<< "One task completed" << std::endl;

// 等待所有任务完成
start_latch.wait();
std::cout << "All tasks completed!" << std::endl;

// 组合操作
start_latch.arrive_and_wait();  // 等价于count_down() + wait()
```

#### 1.4.4. 示例代码
```cpp
#include <iostream>`
#include `<thread>`
#include `<vector>`
#include `<latch>`
#include `<chrono>`
#include `<random>`

class TaskCoordinator {
public:
    TaskCoordinator(int task_count) : completion_latch(task_count) {}
    
    void execute_task(int task_id) {
        // 模拟任务执行时间
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(1, 5);
        
        std::cout `<< "Task " << task_id << " starting..." << std::endl;
        std::this_thread::sleep_for(std::chrono::seconds(dis(gen)));
        std::cout << "Task " << task_id << " completed!" << std::endl;
        
        // 任务完成，减少闩锁计数
        completion_latch.count_down();
    }
    
    void wait_for_all_tasks() {
        std::cout << "Waiting for all tasks to complete..." << std::endl;
        completion_latch.wait();
        std::cout << "All tasks have been completed!" << std::endl;
    }
    
private:
    std::latch completion_latch;
};

int main() {
    const int num_tasks = 4;
    TaskCoordinator coordinator(num_tasks);
`std::vector<std::thread>`task_threads;
    
    // 启动所有任务
    for (int i = 0; i < num_tasks; ++i) {
        task_threads.emplace_back([&coordinator, i]() {
            coordinator.execute_task(i);
        });
    }
    
    // 主线程等待所有任务完成
    coordinator.wait_for_all_tasks();
    
    // 清理线程
    for (auto& t : task_threads) {
        t.join();
    }
    
    std::cout `<< "Program finished." << std::endl;
    return 0;
}
```

### 1.5. 屏障（Barrier）
#### 1.5.1. 概念
屏障是C++20引入的可重用同步原语，用于多个线程的周期性同步。主要功能：

+ 等待指定数量的线程到达同步点
+ 所有线程到达后同时继续执行
+ 可重用，支持多轮同步
+ 支持完成函数（completion function）

#### 1.5.2. 常用API和通用使用模板
```cpp
#include <barrier>`

// 声明屏障
std::barrier<> barrier_obj(thread_count);
`std::`barrier`<CompletionFunction>` barrier_with_func(thread_count, completion_func);

// 主要API
auto token = barrier_obj.arrive();        // 到达屏障，返回令牌
barrier_obj.wait(token);                  // 使用令牌等待
barrier_obj.arrive_and_wait();            // arrive + wait的组合
barrier_obj.arrive_and_drop();            // 到达并永久离开屏障
```

#### 1.5.3. 具体使用
```cpp
#include `<barrier>`
#include `<iostream>`

// 创建屏障
std::barrier sync_point(3);  // 3个线程的同步点

// 到达屏障并等待
sync_point.arrive_and_wait();
std::cout `<< "All threads synchronized!" << std::endl;

// 分步操作
auto token = sync_point.arrive();
// 做其他工作...
sync_point.wait(token);
```

#### 1.5.4. 示例代码
```cpp
#include <iostream>`
#include `<thread>`
#include `<vector>`
#include `<barrier>`
#include `<chrono>`
#include `<random>`

class ParallelProcessor {
public:
    ParallelProcessor(int worker_count, int phases) 
        : phase_barrier(worker_count, [this]() noexcept {
            std::cout `<< "=== Phase " << ++current_phase << " completed by all workers ===" << std::endl;
        }), num_phases(phases), current_phase(0) {}
    
    void worker_function(int worker_id) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<>` dis(1, 3);
        
        for (int phase = 1; phase <= num_phases; ++phase) {
            // 模拟工作
            std::cout `<< "Worker " << worker_id << " working on phase " << phase << std::endl;
            std::this_thread::sleep_for(std::chrono::seconds(dis(gen)));
            std::cout << "Worker " << worker_id << " finished phase " << phase << std::endl;
            
            // 等待所有工作线程完成当前阶段
            phase_barrier.arrive_and_wait();
            
            std::cout << "Worker " << worker_id << " proceeding to next phase" << std::endl;
        }
        
        std::cout << "Worker " << worker_id << " completed all phases" << std::endl;
    }
    
private:
`std::barrier<`std::function<void()>`> phase_barrier;
    int num_phases;
    `std::`atomic`<int>` current_phase;
};

int main() {
    const int num_workers = 3;
    const int num_phases = 3;
    
    ParallelProcessor processor(num_workers, num_phases);
    ``std::`vector`<std::thread>` workers;
    
    std::cout << "Starting " << num_workers << " workers for " << num_phases << " phases" << std::endl;
    
    // 启动工作线程
    for (int i = 0; i < num_workers; ++i) {
        workers.emplace_back([&processor, i]() {
            processor.worker_function(i);
        });
    }
    
    // 等待所有工作线程完成
    for (auto& worker : workers) {
        worker.join();
    }
    
    std::cout << "All workers completed all phases!" << std::endl;
    return 0;
}
```

