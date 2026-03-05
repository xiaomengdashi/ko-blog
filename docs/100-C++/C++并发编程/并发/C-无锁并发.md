---
sidebar_position: 10
slug: /C++/C++并发编程/并发/C-无锁并发
---

## 1. 无锁并发的概念与原理
### 1.1. 无锁并发的概念
无锁并发（Lock-Free Concurrency）是一种并发编程技术，它不使用传统的互斥锁（mutex）、信号量等同步原语来保护共享数据，而是通过原子操作和特殊的算法设计来实现线程安全的数据访问。

### 1.2. 有锁并发的区别
**有锁并发特点：**

+ 使用互斥锁、读写锁等同步机制
+ 线程在访问共享资源时需要获取锁，可能被阻塞
+ 存在死锁、优先级反转等问题
+ 上下文切换开销较大

**无锁并发特点：**

+ 不使用阻塞式同步原语
+ 线程永远不会被阻塞，始终保持活跃状态
+ 避免了死锁问题
+ 更好的可扩展性和性能

### 1.3. 无锁并发的原理
无锁并发主要基于以下几个核心原理：

**原子操作（Atomic Operations）：** 利用CPU提供的原子指令，如CAS（Compare-And-Swap），确保操作的原子性。这些操作在硬件层面保证不会被中断。

**内存序（Memory Ordering）：** 通过指定内存序来控制内存访问的顺序，防止编译器和CPU的重排序导致的数据竞争。

**重试机制：** 当原子操作失败时（如CAS失败），线程不会阻塞，而是重新尝试操作，直到成功为止。

**ABA检测：** 通过版本号、标记指针等技术来检测和避免ABA问题。

## 2. 无锁并发常见问题及解决方案
### 2.1. ABA问题
#### 2.1.1. 问题详细描述
ABA问题是无锁编程中最经典的问题之一。它发生在以下场景：

1. **线程1**读取共享变量的值为A
2. **线程2**将该变量从A改为B，然后又改回A
3. **线程1**执行CAS操作时发现值仍为A，误认为没有变化，操作成功
4. 但实际上中间状态已经发生了变化，可能导致数据结构损坏

这个问题在指针操作中尤其危险，因为指针可能指向已被释放并重新分配的内存地址。

#### 2.1.2. 问题产生的代码示例
```cpp
#include `<atomic>`
#include `<thread>`
#include `<iostream>`

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class ProblematicLockFreeStack {
private:
    `std::`atomic`<Node*>` head;  // 栈顶指针
    
public:
    ProblematicLockFreeStack() : head(nullptr) {}
    
    void push(int data) {
        Node* newNode = new Node(data);
        Node* oldHead = head.load();  // 读取当前栈顶
        do {
            newNode->next = oldHead;  // 新节点指向当前栈顶
            // 尝试将新节点设为栈顶，如果head仍为oldHead则成功
        } while (!head.compare_exchange_weak(oldHead, newNode));
    }
    
    bool pop(int& result) {
        Node* oldHead = head.load();  // 读取当前栈顶
        do {
            if (oldHead == nullptr) return false;  // 栈为空
            
            // 危险点：在这里oldHead可能被其他线程删除并重新分配
            // 如果内存被重新分配给新的Node，oldHead->next可能指向错误的位置
            // 但CAS仍可能成功，因为指针值相同（ABA问题）
            
        } while (!head.compare_exchange_weak(oldHead, oldHead->next));
        
        result = oldHead->data;
        delete oldHead;  // 危险：可能删除已被重用的内存
        return true;
    }
};

// 演示ABA问题的发生
void demonstrateABA() {
    ProblematicLockFreeStack stack;
    
    // 线程1：尝试pop操作
    std::thread t1([&stack]() {
        int result;
        Node* oldHead = stack.head.load();  // 读取头节点A
        
        // 模拟线程被中断，其他线程有机会修改栈
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        
        // 此时头节点可能经历了A->B->A的变化
        // 但CAS操作仍会成功，导致问题
        while (!stack.head.compare_exchange_weak(oldHead, oldHead->next)) {
            if (oldHead == nullptr) break;
        }
    });
    
    // 线程2：快速进行多次push/pop操作，制造ABA场景
    std::thread t2([&stack]() {
        stack.push(1);  // A
        stack.push(2);  // B
        int temp;
        stack.pop(temp);  // 回到A，但A的内容可能已变化
    });
    
    t1.join();
    t2.join();
}
```

**为什么会发生问题：**

1. **内存重用**：删除的节点内存可能被立即重新分配给新节点
2. **指针值相同**：新节点恰好分配到相同的内存地址
3. **CAS误判**：CAS操作认为指针没有变化，但实际指向的对象已经不同
4. **数据结构损坏**：基于错误假设的操作导致链表结构破坏

#### 2.1.3. 解决方案
**方案一：版本号机制（最常用）**

**总体思路：** 为每个指针附加一个单调递增的版本号，每次修改时同时更新版本号。CAS操作同时比较指针和版本号，确保检测到所有变化。

```cpp
#include `<atomic>`
#include `<cstdint>`

struct TaggedPointer {
    Node* ptr;        // 实际指针
    uint64_t tag;     // 版本号，每次修改时递增
    
    TaggedPointer() : ptr(nullptr), tag(0) {}
    TaggedPointer(Node* p, uint64_t t) : ptr(p), tag(t) {}
    
    // 重载比较操作符，同时比较指针和版本号
    bool operator==(const TaggedPointer& other) const {
        return ptr == other.ptr && tag == other.tag;
    }
};

class SafeLockFreeStack {
private:
    `std::`atomic`<TaggedPointer>` head;  // 带版本号的栈顶指针
    
public:
    SafeLockFreeStack() : head(TaggedPointer()) {}
    
    void push(int data) {
        Node* newNode = new Node(data);
        TaggedPointer oldHead = head.load();  // 读取当前头节点和版本号
        TaggedPointer newHead;
        
        do {
            newNode->next = oldHead.ptr;  // 新节点指向当前栈顶
            // 创建新的头节点，版本号递增
            newHead = TaggedPointer(newNode, oldHead.tag + 1);
            
            // CAS同时比较指针和版本号，确保没有ABA问题
        } while (!head.compare_exchange_weak(oldHead, newHead));
    }
    
    bool pop(int& result) {
        TaggedPointer oldHead = head.load();  // 读取当前头节点和版本号
        TaggedPointer newHead;
        
        do {
            if (oldHead.ptr == nullptr) return false;  // 栈为空
            
            // 创建新的头节点，指向下一个节点，版本号递增
            newHead = TaggedPointer(oldHead.ptr->next, oldHead.tag + 1);
            
            // CAS操作：只有当指针和版本号都匹配时才成功
            // 这样即使指针相同但版本号不同，也会失败并重试
        } while (!head.compare_exchange_weak(oldHead, newHead));
        
        result = oldHead.ptr->data;
        delete oldHead.ptr;  // 安全删除，因为已确保没有其他线程在使用
        return true;
    }
};
```

**方案二：危险指针（Hazard Pointers）**

**总体思路：** 每个线程在访问共享指针前，先将其标记为"危险"（正在使用），其他线程在删除节点前检查是否有线程正在使用该指针，如果有则延迟删除。

```cpp
#include `<atomic>`
#include `<vector>`
#include `<thread>`
#include `<unordered_set>`

class HazardPointerManager {
private:
    // 每个线程的危险指针列表
    static thread_local ``std::`vector`<`std::atomic<void*>`> hazardPtrs;
    // 全局待删除节点列表
    static std::atomic`<`std::vector<Node*>`*> pendingDeletes;
    
public:
    // 保护指针，标记为正在使用
    static void protect(void* ptr, size_t index = 0) {
        if (index >= hazardPtrs.size()) {
            hazardPtrs.resize(index + 1);
        }
        hazardPtrs[index].store(ptr, std::memory_order_release);
    }
    
    // 清除保护，表示不再使用该指针
    static void clear(size_t index = 0) {
        if (index < hazardPtrs.size()) {
            hazardPtrs[index].store(nullptr, std::memory_order_release);
        }
    }
    
    // 检查指针是否被其他线程保护
    static bool isProtected(void* ptr) {
        // 简化实现：实际需要遍历所有线程的危险指针
        // 这里只检查当前线程的危险指针作为示例
        for (const auto& hazardPtr : hazardPtrs) {
            if (hazardPtr.load(std::memory_order_acquire) == ptr) {
                return true;
            }
        }
        return false;
    }
    
    // 安全删除节点
    static void safeDelete(Node* node) {
        if (!isProtected(node)) {
            delete node;  // 没有线程使用，直接删除
        } else {
            // 有线程正在使用，加入待删除列表
            auto* deletes = pendingDeletes.load();
            if (!deletes) {
                deletes = new ``std::`vector`<Node*>`();
                pendingDeletes.store(deletes);
            }
            deletes->push_back(node);
        }
    }
};

// 静态成员定义
thread_local ``std::`vector`<`std::atomic<void*>`> HazardPointerManager::hazardPtrs;
std::atomic`<`std::vector<Node*>`*> HazardPointerManager::pendingDeletes{nullptr};

class HazardPointerLockFreeStack {
private:
    `std::`atomic`<Node*>` head;
    
public:
    HazardPointerLockFreeStack() : head(nullptr) {}
    
    void push(int data) {
        Node* newNode = new Node(data);
        Node* oldHead = head.load();
        
        do {
            newNode->next = oldHead;
        } while (!head.compare_exchange_weak(oldHead, newNode));
    }
    
    bool pop(int& result) {
        Node* oldHead;
        
        do {
            oldHead = head.load();
            if (oldHead == nullptr) return false;
            
            // 关键：在使用指针前先保护它
            HazardPointerManager::protect(oldHead);
            
            // 重新检查头节点是否仍然有效
            // 因为在protect和这里之间，头节点可能已经改变
            if (oldHead != head.load()) {
                continue;  // 头节点已变化，重新开始
            }
            
            // 现在可以安全访问oldHead->next
        } while (!head.compare_exchange_weak(oldHead, oldHead->next));
        
        result = oldHead->data;
        
        // 清除保护
        HazardPointerManager::clear();
        
        // 安全删除节点
        HazardPointerManager::safeDelete(oldHead);
        
        return true;
    }
};
```

### 2.2. 饥饿问题
#### 2.2.1. 问题详细描述
饥饿问题（Starvation）在无锁编程中表现为某些线程长时间无法成功执行关键操作。这通常发生在高竞争环境中，原因包括：

1. **竞争不公平**：某些线程由于调度或硬件因素总是能更快地执行CAS操作
2. **重试风暴**：失败的线程立即重试，加剧竞争，导致所有线程都难以成功
3. **缓存效应**：某些CPU核心的缓存状态更有利，使其线程更容易成功
4. **优先级问题**：高优先级线程可能抢占低优先级线程的执行机会

#### 2.2.2. 问题产生的代码示例
```cpp
#include `<atomic>`
#include `<thread>`
#include `<chrono>`
#include `<vector>`
#include `<iostream>`

`std::`atomic`<int>` counter(0);
`std::`atomic`<int>` successCount(0);  // 统计成功次数
`std::`atomic`<int>` failureCount(0);  // 统计失败次数

// 高频率线程：不断尝试增加计数器，可能导致其他线程饥饿
void aggressiveIncrement(int threadId, int iterations) {
    int localSuccess = 0;
    int localFailure = 0;
    
    for (int i = 0; i < iterations; ++i) {
        int expected = counter.load(std::memory_order_relaxed);
        
        // 问题：立即重试，不给其他线程机会
        while (!counter.compare_exchange_weak(expected, expected + 1, 
                                            std::memory_order_relaxed)) {
            localFailure++;  // 统计失败次数
            // 没有任何延迟，立即重试
            // 这会导致CPU缓存行在线程间频繁传输
            // 某些线程可能长时间无法成功
        }
        localSuccess++;
    }
    
    successCount.fetch_add(localSuccess);
    failureCount.fetch_add(localFailure);
    
    std::cout `<< "Thread " << threadId << ": Success=" << localSuccess 
              << ", Failures=" << localFailure << std::endl;
}

// 演示饥饿问题
void demonstrateStarvation() {
    const int numThreads = 8;
    const int iterations = 10000;
`std::vector<std::thread>`threads;
    
    auto start = std::chrono::high_resolution_clock::now();
    
    // 启动多个竞争激烈的线程
    for (int i = 0; i < numThreads; ++i) {
        threads.emplace_back(aggressiveIncrement, i, iterations);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::`duration_cast`<std::chrono::milliseconds>`(end - start);
    
    std::cout `<< "Total time: " << duration.count() << "ms" << std::endl;
    std::cout << "Total successes: " << successCount.load() << std::endl;
    std::cout << "Total failures: " << failureCount.load() << std::endl;
    std::cout << "Final counter: " << counter.load() << std::endl;
    
    // 通常会看到某些线程的失败次数远高于其他线程
    // 表明存在饥饿问题
}
```

**为什么会发生问题：**

1. **缓存行竞争**：多个线程同时访问同一缓存行，导致频繁的缓存失效
2. **CPU调度不公平**：操作系统调度器可能偏向某些线程
3. **硬件差异**：不同CPU核心的缓存层次和速度可能不同
4. **内存访问模式**：某些线程的内存访问模式更有利于缓存命中

#### 2.2.3. 解决方案
**方案一：指数退避策略（最常用）**

**总体思路：** 当CAS操作失败时，不立即重试，而是等待一段时间再重试。等待时间随失败次数指数增长，减少竞争强度，给其他线程成功的机会。

```cpp
#include <atomic>`
#include `<thread>`
#include `<chrono>`
#include `<random>`

class ExponentialBackoff {
private:
    int minDelay;      // 最小延迟（微秒）
    int maxDelay;      // 最大延迟（微秒）
    int currentDelay;  // 当前延迟
    std::random_device rd;
    std::mt19937 gen;
    
public:
    ExponentialBackoff(int min = 1, int max = 1000) 
        : minDelay(min), maxDelay(max), currentDelay(min), gen(rd()) {}
    
    // 执行退避等待
    void backoff() {
        // 在0到currentDelay之间随机等待，避免所有线程同时重试
        std::uniform_int_distribution<> dis(0, currentDelay);
        int waitTime = dis(gen);
        
        // 使用高精度睡眠
        std::this_thread::sleep_for(std::chrono::microseconds(waitTime));
        
        // 指数增长延迟时间，但不超过最大值
        currentDelay = std::min(currentDelay * 2, maxDelay);
    }
    
    // 成功后重置延迟
    void reset() {
        currentDelay = minDelay;
    }
    
    // 获取当前延迟（用于调试）
    int getCurrentDelay() const {
        return currentDelay;
    }
};

// 使用退避策略的公平增量函数
void fairIncrement(int threadId, int iterations) {
    ExponentialBackoff backoff(1, 1000);  // 1微秒到1毫秒
    int localSuccess = 0;
    int localFailure = 0;
    
    for (int i = 0; i < iterations; ++i) {
        int expected = counter.load(std::memory_order_relaxed);
        
        // 使用退避策略的重试循环
        while (!counter.compare_exchange_weak(expected, expected + 1, 
                                            std::memory_order_relaxed)) {
            localFailure++;
            backoff.backoff();  // 失败时退避
            
            // 重新读取期望值
            expected = counter.load(std::memory_order_relaxed);
        }
        
        localSuccess++;
        backoff.reset();  // 成功时重置退避时间
    }
    
    std::cout `<< "Thread " << threadId << ": Success=" << localSuccess 
              << ", Failures=" << localFailure << std::endl;
}

// 自适应退避策略：根据系统负载动态调整
class AdaptiveBackoff {
private:
`std::atomic<int>`globalFailureRate{0};  // 全局失败率
    int baseDelay;
    int maxDelay;
    
public:
    AdaptiveBackoff(int base = 1, int max = 1000) 
        : baseDelay(base), maxDelay(max) {}
    
    void backoff(int localFailures) {
        // 根据全局失败率和本地失败次数调整延迟
        int globalRate = globalFailureRate.load();
        int adaptiveDelay = baseDelay * (1 + globalRate / 100) * (1 + localFailures);
        adaptiveDelay = std::min(adaptiveDelay, maxDelay);
        
        std::this_thread::sleep_for(std::chrono::microseconds(adaptiveDelay));
    }
    
    void reportFailure() {
        globalFailureRate.fetch_add(1);
    }
    
    void reportSuccess() {
        // 成功时减少全局失败率
        int current = globalFailureRate.load();
        if (current > 0) {
            globalFailureRate.compare_exchange_weak(current, current - 1);
        }
    }
};
```

**方案二：公平锁机制**

**总体思路：** 使用票号系统确保线程按到达顺序执行操作，避免某些线程被饿死。每个线程获取一个票号，按顺序执行操作。

```cpp
#include `<atomic>`
#include `<thread>`

class FairLockFreeCounter {
private:
    `std::`atomic`<int>` counter;    // 实际计数器
    `std::`atomic`<int>` ticket;     // 发号器：分配票号
    `std::`atomic`<int>` serving;    // 当前服务的票号
    
public:
    FairLockFreeCounter() : counter(0), ticket(0), serving(0) {}
    
    // 公平的增量操作
    void increment(int value) {
        // 第一步：获取排队号
        int myTicket = ticket.fetch_add(1, std::memory_order_relaxed);
        
        // 第二步：等待轮到自己
        // 使用relaxed内存序，因为这里只是等待
        while (serving.load(std::memory_order_acquire) != myTicket) {
            // 让出CPU时间片，避免忙等待
            std::this_thread::yield();
            
            // 可选：在等待时间过长时使用sleep
            // std::this_thread::sleep_for(std::chrono::microseconds(1));
        }
        
        // 第三步：执行操作（此时只有当前线程可以执行）
        counter.fetch_add(value, std::memory_order_relaxed);
        
        // 第四步：通知下一个线程
        serving.fetch_add(1, std::memory_order_release);
    }
    
    // 获取当前值
    int getValue() const {
        return counter.load(std::memory_order_acquire);
    }
    
    // 获取队列长度（调试用）
    int getQueueLength() const {
        return ticket.load() - serving.load();
    }
};

// 使用示例
void fairIncrementTest(int threadId, int iterations) {
    static FairLockFreeCounter fairCounter;
    
    auto start = std::chrono::high_resolution_clock::now();
    
    for (int i = 0; i < iterations; ++i) {
        fairCounter.increment(1);
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::`duration_cast`<std::chrono::microseconds>`(end - start);
    
    std::cout `<< "Thread " << threadId << " completed in " 
              << duration.count() << " microseconds" << std::endl;
}
```

### 2.3. 存行伪共享问题
#### 2.3.1. 问题详细描述
缓存行伪共享（False Sharing）是多核系统中的性能杀手。现代CPU使用缓存行（通常64字节）作为缓存的基本单位。当多个线程访问同一缓存行中的不同变量时，会发生以下问题：

1. **缓存行失效**：一个线程修改缓存行中的任何数据，整个缓存行在其他CPU核心中都会失效
2. **频繁传输**：缓存行需要在CPU核心之间频繁传输，造成巨大开销
3. **性能下降**：即使线程访问的是逻辑上独立的变量，也会相互影响性能
4. **扩展性差**：随着CPU核心数增加，问题变得更加严重

#### 2.3.2. 问题产生的代码示例
```cpp
#include <atomic>`
#include `<thread>`
#include `<vector>`
#include `<chrono>`
#include `<iostream>`

// 问题代码：多个原子变量紧密排列，可能位于同一缓存行
struct BadCounters {
    `std::`atomic`<int>` counter1{0};  // 假设从地址0x1000开始
    `std::`atomic`<int>` counter2{0};  // 地址0x1004，与counter1在同一缓存行
    `std::`atomic`<int>` counter3{0};  // 地址0x1008，与counter1在同一缓存行
    `std::`atomic`<int>` counter4{0};  // 地址0x100C，与counter1在同一缓存行
    
    // 在64字节缓存行中，这4个int（每个4字节）都在同一缓存行内
    // 当任何一个counter被修改时，整个缓存行都会失效
};

// 演示伪共享问题的测试函数
void testFalseSharing() {
    BadCounters counters;
    const int iterations = 1000000;
    
    // 工作函数：每个线程操作不同的计数器
    auto worker = [&](`std::`atomic`<int>`& counter, int threadId) {
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < iterations; ++i) {
            // 每次增量操作都会导致缓存行失效
            counter.fetch_add(1, std::memory_order_relaxed);
            
            // 即使使用relaxed内存序，仍然存在缓存行竞争
            // 因为硬件层面的缓存一致性协议仍然需要工作
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::`duration_cast`<std::chrono::milliseconds>`(end - start);
        
        std::cout `<< "Thread " << threadId << " time: " << duration.count() << "ms" << std::endl;
    };
    
    auto globalStart = std::chrono::high_resolution_clock::now();
    
    // 启动4个线程，每个操作不同的计数器
`std::vector<std::thread>`threads;
    threads.emplace_back(worker, std::ref(counters.counter1), 1);
    threads.emplace_back(worker, std::ref(counters.counter2), 2);
    threads.emplace_back(worker, std::ref(counters.counter3), 3);
    threads.emplace_back(worker, std::ref(counters.counter4), 4);
    
    for (auto& t : threads) {
        t.join();
    }
    
    auto globalEnd = std::chrono::high_resolution_clock::now();
    auto totalTime = std::chrono::`duration_cast`<std::chrono::milliseconds>`(globalEnd - globalStart);
    
    std::cout `<< "Total time with false sharing: " << totalTime.count() << "ms" << std::endl;
    std::cout << "Results: " << counters.counter1 << ", " << counters.counter2 
              << ", " << counters.counter3 << ", " << counters.counter4 << std::endl;
}
```

**为什么会发生问题：**

1. **缓存行大小**：现代CPU缓存行通常为64字节，可容纳16个int变量
2. **MESI协议**：CPU使用MESI等协议维护缓存一致性，修改会导致其他核心的缓存行失效
3. **总线竞争**：缓存行在CPU核心间传输需要占用内存总线
4. **写放大**：修改4字节的int导致64字节缓存行的传输，放大了16倍

#### 2.3.3. 解决方案
**方案一：缓存行对齐（最常用）**

**总体思路：** 使用内存对齐确保每个频繁访问的变量独占一个缓存行，避免多个变量共享同一缓存行。

```cpp
#include <atomic>`
#include `<thread>`
#include `<vector>`

// 获取缓存行大小（编译时常量）
constexpr size_t CACHE_LINE_SIZE = 64;  // 大多数现代CPU的缓存行大小

// 方法1：使用alignas关键字对齐到缓存行边界
struct alignas(CACHE_LINE_SIZE) AlignedCounter {
    `std::`atomic`<int>` counter{0};
    // 编译器会自动在结构体末尾添加填充，确保整个结构体大小为缓存行的倍数
    // 这样每个AlignedCounter实例都会独占至少一个缓存行
};

// 方法2：手动填充到缓存行大小
struct PaddedCounter {
    `std::`atomic`<int>` counter{0};
    // 手动添加填充字节，确保结构体大小等于缓存行大小
    char padding[CACHE_LINE_SIZE - sizeof(`std::`atomic`<int>`)];
};

// 方法3：使用模板实现通用的缓存行填充
`template`<typename T>`
struct CacheLinePadded {
    T data;
    // 计算需要的填充大小
    static constexpr size_t paddingSize = 
        CACHE_LINE_SIZE - (sizeof(T) % CACHE_LINE_SIZE);
    char padding[paddingSize == CACHE_LINE_SIZE ? 0 : paddingSize];
    
    // 构造函数
    CacheLinePadded() = default;
    CacheLinePadded(const T& value) : data(value) {}
    
    // 提供便捷的访问接口
    T& operator*() { return data; }
    const T& operator*() const { return data; }
    T* operator->() { return &data; }
    const T* operator->() const { return &data; }
};

// 优化后的计数器结构
struct GoodCounters {
    AlignedCounter counter1;  // 独占缓存行1
    AlignedCounter counter2;  // 独占缓存行2
    AlignedCounter counter3;  // 独占缓存行3
    AlignedCounter counter4;  // 独占缓存行4
    
    // 或者使用模板版本
    // CacheLinePadded`<`std::atomic<int>`> counter1;
    // CacheLinePadded`<`std::atomic<int>`> counter2;
    // CacheLinePadded`<`std::atomic<int>`> counter3;
    // CacheLinePadded`<`std::atomic<int>`> counter4;
};

// 测试优化后的性能
void testNonFalseSharing() {
    GoodCounters counters;
    const int iterations = 1000000;
    
    auto worker = [&](AlignedCounter& counter, int threadId) {
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < iterations; ++i) {
            // 现在每个counter独占缓存行，不会相互影响
            counter.counter.fetch_add(1, std::memory_order_relaxed);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::`duration_cast`<std::chrono::milliseconds>`(end - start);
        
        std::cout `<< "Thread " << threadId << " time: " << duration.count() << "ms" << std::endl;
    };
    
    auto globalStart = std::chrono::high_resolution_clock::now();
    
`std::vector<std::thread>`threads;
    threads.emplace_back(worker, std::ref(counters.counter1), 1);
    threads.emplace_back(worker, std::ref(counters.counter2), 2);
    threads.emplace_back(worker, std::ref(counters.counter3), 3);
    threads.emplace_back(worker, std::ref(counters.counter4), 4);
    
    for (auto& t : threads) {
        t.join();
    }
    
    auto globalEnd = std::chrono::high_resolution_clock::now();
    auto totalTime = std::chrono::`duration_cast`<std::chrono::milliseconds>`(globalEnd - globalStart);
    
    std::cout `<< "Total time without false sharing: " << totalTime.count() << "ms" << std::endl;
    // 通常会看到显著的性能提升
}

// 动态检测缓存行大小的工具函数
size_t detectCacheLineSize() {
    // 在运行时检测缓存行大小（简化版本）
    // 实际实现可能需要读取CPU信息或使用性能测试
    return std::hardware_destructive_interference_size;  // C++17
}
```

**方案二：数据结构重组**

**总体思路：** 重新组织数据结构，将频繁访问的数据分离到不同的缓存行，或者将相关数据聚合到同一缓存行以提高局部性。

```cpp
// 策略1：按访问模式分组
struct ThreadLocalCounters {
    // 每个线程使用自己的计数器，避免共享
    static thread_local int localCounter;
    static`std::atomic<int>`globalCounter;
    
    static void increment() {
        localCounter++;  // 本地增量，无竞争
        
        // 定期同步到全局计数器
        if (localCounter % 1000 == 0) {
            globalCounter.fetch_add(1000, std::memory_order_relaxed);
            localCounter = 0;
        }
    }
    
    static int getTotal() {
        return globalCounter.load() + localCounter;
    }
};

thread_local int ThreadLocalCounters::localCounter = 0;
`std::`atomic`<int>` ThreadLocalCounters::globalCounter{0};

// 策略2：读写分离
struct ReadWriteSeparated {
    // 读频繁的数据放在一起
    struct alignas(CACHE_LINE_SIZE) ReadOnlyData {
        `std::`atomic`<int>` readCounter{0};
        `std::`atomic`<bool>` isActive{true};
    } readData;
    
    // 写频繁的数据放在一起
    struct alignas(CACHE_LINE_SIZE) WriteOnlyData {
        `std::`atomic`<int>` writeCounter{0};
        `std::`atomic`<int>` modificationCount{0};
    } writeData;
};
```

## 3. 高性能无锁队列实现
_（此部分内容待实现）_

