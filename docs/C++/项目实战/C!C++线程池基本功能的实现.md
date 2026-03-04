---
sidebar_position: 1
slug: /C++/项目实战/C!C++线程池基本功能的实现
---

---
title: 【C/C++】线程池基本功能的实现
date: '2025-09-01 01:44:33'
updated: '2025-09-01 01:44:33'
slug: /C++/项目实战/C!C++线程池基本功能的实现---
## 【C/C++】线程池的基本功能实现
在多线程编程中，频繁创建和销毁线程会带来巨大的性能开销。线程池作为一种经典的并发设计模式，通过预先创建一批线程并复用它们执行任务，有效降低了线程管理成本，提升了程序的响应速度和资源利用率。本文将分别用C和C++实现线程池，并深入解析其核心原理。

## 一、线程池核心原理
**核心原理**  
线程池的本质是**生产者-消费者模型**，包含三个核心组件：

1. 1. **工作线程**：预先创建的线程，循环等待并执行任务；
2. 2. **任务队列**：存放待执行任务的缓冲队列，解耦生产者和消费者；
3. 3. **管理机制**：通过互斥锁和条件变量实现线程安全的任务存取，以及线程池的创建/销毁逻辑。

**工作流程**：

+ • 主线程（生产者）将任务添加到任务队列；
+ • 工作线程（消费者）阻塞等待任务，有任务时唤醒并执行；
+ • 任务执行完毕后，工作线程继续等待下一个任务，避免线程销毁；

## 二、C语言实现线程池
C语言版本基于POSIX线程库（pthread）实现，适合理解底层原理。

### 1. 核心数据结构设计
#### 任务结构体
每个任务包含函数指针、参数、返回值和状态标记，通过互斥锁保护结果访问：

```plain
struct Task {
    void *ret;  // 函数返回值(堆内存)
    void* (*func)(void *arg); // 任务函数指针
    void *arg;  // 函数参数
    bool ready;  // 任务完成标记
    pthread_mutex_t mutex;// 保护结果的互斥锁
};
```

#### 线程池结构体
管理工作线程、任务队列和同步机制：

```plain
struct ThreadPool {
    bool running;   // 线程池运行状态
    uint32_t worker_count;  // 工作线程数量
    pthread_t *workers;   // 工作线程ID数组
    Queue *tasks;  // 任务队列
    pthread_mutex_t mutex;   // 保护队列
    pthread_cond_t tasks_not_empty;  // 队列非空
    pthread_cond_t tasks_not_full;  // 队列非满
};
```

#### 任务队列（Queue）
采用双向链表实现，支持线程安全的入队/出队：

```plain
// 队列结构体
struct Queue {
    Node* front;  // 队头
    Node* rear;  // 队尾
    uint32_t size;   // 当前元素数
    uint32_t capacity;  // 队列最大容量
};
// 队列节点结构体
struct Node {
    Task *task;  // 任务结构体
    Node *prev;  // 指向上一个节点的指针
    Node *next;  // 指向下一个节点的指针
};
```

### 2. 核心函数实现
#### 线程池创建
初始化线程池，创建指定数量的工作线程：

```plain
ThreadPool *threadpool_create(const uint32_t workers_count, const uint32_t tasks_capacity) {
    ThreadPool *pool = (ThreadPool *)malloc(sizeof(ThreadPool));
    if (pool == NULL) {
        perror(" - ERROR: thread pool allocation failed");
        exit(EXIT_FAILURE);
    }
    if(workers_count <= 0 || tasks_capacity <= 0) {
        perror(" - ERROR: workers count or tasks capacity is invalid");
        exit(EXIT_FAILURE);
    }
    pool->running = true;
    pool->worker_count = workers_count;
    pool->workers = malloc(workers_count * sizeof(pthread_t));
    if(pool->workers == NULL) {
        perror(" - ERROR: thread workers allocation failed");
        exit(EXIT_FAILURE);
    }
    pool->tasks = queue_create(tasks_capacity);
    pthread_mutex_init(&pool->mutex, NULL);
    pthread_cond_init(&pool->tasks_not_empty, NULL);
    pthread_cond_init(&pool->tasks_not_full, NULL);
    for(uint32_t i = 0; i < pool->worker_count; i++) {
        // 创建工作线程
        if (pthread_create(&pool->workers[i], NULL, threadpool_worker_thread, pool) != 0) {
            perror("pthread_create failed");
            pool->worker_count = i + 1;    // 创建工作线程失败时保存工作线程个数，以便正确回收资源
            threadpool_destroy(pool);
            return NULL;
        }
    }
    return pool;
}
```

#### 工作线程逻辑
工作线程的核心循环：等待任务→执行任务→更新结果：

```plain
void *threadpool_worker_thread(void *arg) {
    assert(arg != NULL);
    ThreadPool *pool = (ThreadPool *)arg;
    // 工作线程一直运行
    while(1) {
        Task *task;
        pthread_mutex_lock(&pool->mutex);
        // 线程池运行中且任务队列为空时阻塞等待
        while(pool->running && queue_empty(pool->tasks)) {
            pthread_cond_wait(&pool->tasks_not_empty, &pool->mutex);
        }
        // 线程池停止且任务队列为空时退出工作线程
        if(!pool->running && queue_empty(pool->tasks)) {
            pthread_mutex_unlock(&pool->mutex);
            break;
        }
        task = queue_pop(pool->tasks);    // 从工作队列取出任务
        pthread_mutex_unlock(&pool->mutex);
        //! 注意：这里不需要加锁，避免有锁执行耗时间任务
        task->ret = task->func(task->arg);    // 调用目标任务函数
        pthread_mutex_lock(&task->mutex);
        task->ready = true;      // 标记任务已完成
        pthread_mutex_unlock(&task->mutex);
    }
    return NULL;
}
```

#### 任务添加
主线程向队列添加任务，满队列时阻塞等待：

```plain
void threadpool_push(ThreadPool *pool, Task *task) {
    pthread_mutex_lock(&pool->mutex);
    
    // 队列满时阻塞
    while(pool->running && queue_full(pool->tasks)) {
        pthread_cond_wait(&pool->tasks_not_full, &pool->mutex);
    }
    
    queue_push(pool->tasks, task);
    pthread_mutex_unlock(&pool->mutex);
    pthread_cond_signal(&pool->tasks_not_empty);  // 唤醒工作线程
}
```

#### 线程池销毁
安全停止线程池，回收资源：

```plain
void threadpool_destroy(ThreadPool *pool) {
    if (pool == NULL) {
        return;
    }
    pthread_mutex_lock(&pool->mutex);
    pool->running = false;
    pthread_mutex_unlock(&pool->mutex);
    // 唤醒所有工作线程
    pthread_cond_broadcast(&pool->tasks_not_empty);
    for (uint32_t i = 0; i < pool->worker_count; ++i) {
        // 阻塞等待子线程（工作线程）结束
        pthread_join(pool->workers[i], NULL);
    }
    pool->worker_count = 0;
    free(pool->workers);
    queue_destroy(pool->tasks);
    pthread_mutex_destroy(&pool->mutex);
    pthread_cond_destroy(&pool->tasks_not_empty);
    pthread_cond_destroy(&pool->tasks_not_full);
    free(pool);
}
```

### 3. 测试示例
定义三种典型任务（无参无返回、无参有返回、有参有返回），验证线程池功能（Results 和 Args 是用于接收线程返回值和线程参数的结构体）：

```plain
// 1. 无参无返回
void *test1(void *arg) {
    printf("test1: tid = %lu\n", pthread_self());
    sleep(1);
    return NULL;
}
// 2. 无参有返回
void *test2(void *arg) {
    Results2 *results = malloc(sizeof(Results2));
    results->result1 = 100;
    results->result2 = 200;
    printf("test2: tid = %lu, result = %d, %d\n", pthread_self(), results->result1, results->result2);
    sleep(2);
    return results;
}
// 3. 有参有返回
void *test3(void *arg) {
    Args3 *args = (Args3 *)arg;
    Results3 *results = malloc(sizeof(Results3));
    results->result1 = args->arg1 + args->arg2;
    printf("test3: tid = %lu, result = %f\n", pthread_self(), results->result1);
    sleep(3);
    return results;
}
```

主线程添加任务并等待结果：

```plain
int main(int argc, char *argv[]) {
    ThreadPool *pool = threadpool_create(4, 10);
    Task task1 = {NULL, test1, NULL, false};
    pthread_mutex_init(&task1.mutex, NULL);
    threadpool_push(pool, &task1);
    Task task2 = {NULL, test2, NULL, false};
    pthread_mutex_init(&task2.mutex, NULL);
    threadpool_push(pool, &task2);
    Args3 args3 = {100, 200.0F};
    Task task3 = {NULL, test3, (void *)&args3, false};
    pthread_mutex_init(&task3.mutex, NULL);
    threadpool_push(pool, &task3);
    Task *tasks[] = {&task1, &task2, &task3};
    uint32_t tasks_count = sizeof(tasks) / sizeof(tasks[0]);
    uint32_t remaining_count = tasks_count;
    bool tasks_completed[] = {false, false, false};
    
    while(remaining_count){
        for(uint32_t i = 0; i < tasks_count; i++) {
            if(tasks_completed[i]) continue;
            pthread_mutex_lock(&tasks[i]->mutex);
            bool ready = tasks[i]->ready;
            pthread_mutex_unlock(&tasks[i]->mutex);
            if(!ready) continue;
            void *ret = tasks[i]->ret;    //! 不需要解锁，因为工作线程已完成任务，无共享资源
            // 任务有返回值
            if(ret != NULL) {
                // 按任务返回值类型强制转换解析
                if(i == 1) {
                    Results2 *results2 = (Results2 *)ret;
                    printf("tesst2 result: %d, %d\n", results2->result1, results2->result2);
                }
                else if(i == 2) {
                    Results3 *results3 = (Results3 *)ret;
                    printf("task3 result: %f\n", results3->result1);
                }
            }
            tasks_completed[i] = true;
            remaining_count--;
        }
        usleep(50000);
    }
    // 释放堆内存
    for(uint32_t i = 0; i < tasks_count; i++) {
        Task *task = tasks[i];
        free(task->ret);
        task->ret = NULL;
        task->ready = false;
    }
    // 销毁互斥锁
    for(uint32_t i = 0; i < tasks_count; i++) {
        Task *task = tasks[i];
        pthread_mutex_destroy(&task->mutex);
    }
    threadpool_destroy(pool);
    pool = NULL;
    return 0;
}
```

## 三、C++实现线程池
C++版本利用STL和C++新特性，相比C语言版本代码简洁很多，支持泛型任务和返回值获取。

### 1. 核心设计优化
#### 线程池类
使用``std::vector<std::thread>``管理工作线程，`std::queue<`std::function<void()>`>`存储任务，通过`std::future`获取任务返回值：

```plain
class ThreadPool {
public:
    ThreadPool(size_t threads);
    ~ThreadPool();
    // 向线程池添加任务，返回一个future对象用于获取结果
    template<class F, class... Args>
    auto enqueue(F&& f, Args&&... args) 
        -> std::future<typename std::result_of<F(Args...)>::type>;
private:
    `std::vector<std::thread>` workers;            // 工作线程数组
    std::queue<`std::function<void()>`> tasks;     // 任务队列
    std::mutex mutex;                            // 用于保护任务队列的互斥锁
    std::condition_variable condition;           // 用于等待新任务的条件变量
    bool running;                                // 线程池是否运行中
};
```

### 2. 核心函数实现
#### 构造函数
创建工作线程，每个线程循环等待任务：

```plain
// 构造函数：初始化线程池，创建指定数量的工作线程
ThreadPool::ThreadPool(size_t threads) : running(true) {
    // 创建工作线程
    for(size_t i = 0; i < threads; ++i) {
        workers.emplace_back(
            [this] {
                // 工作线程一直运行
                while(true) {
                    `std::function<void()>` task;
                    {
                        std::unique_lock<std::mutex> lock(this->mutex);
                        // 线程池运行中且任务队列为空时阻塞等待
                        this->condition.wait(lock,[this] { return !(this->running && this->tasks.empty()); });
                        // 如果线程池已停止且任务队列为空，则退出线程
                        if(!this->running && this->tasks.empty()){
                            break;
                        }
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }
                    //! 注意：这里不需要加锁，避免有锁执行耗时间任务
                    task();    // 调用目标任务函数
                }
            }
        );
    }
}
```

#### 任务添加
通过模板和完美转发支持任意类型的任务和参数，返回`std::future`用于获取结果：

```plain
//! 模板函数不支持先声明再定义
template<typename F, typename... Args>
auto ThreadPool::enqueue(F&& f, Args&&... args) 
    -> std::future<typename std::result_of<F(Args...)>::type> {
    // 推断任务返回值类型
    using return_type = typename std::result_of<F(Args...)>::type;
    // 打包任务以便同意调用不同类型任务
    auto task = std::make_shared<std::packaged_task<return_type()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...)
    );
    
    // 获取future对象
    std::future<return_type> result = task->get_future();
    
    {
        // 作用于结束自动解锁
        std::unique_lock<std::mutex> lock(mutex);
        // 如果线程池已停止，不能添加新任务
        if(!running){
            throw std::runtime_error("enqueue on stopped ThreadPool");
        }
        // 将任务打包成无返回值函数
        tasks.emplace([task]() { (*task)(); });
    }
    // 唤醒一个等待资源的工作线程
    condition.notify_one();
    
    return result;
}
```

#### 析构函数
停止线程池并等待所有线程结束：

```plain
ThreadPool::~ThreadPool() {
    {
        std::unique_lock<std::mutex> lock(mutex);
        running = false;
    }
    // 唤醒所有等待资源的工作线程
    condition.notify_all();
    // 等待所有工作线程完成
    for(std::thread &worker : workers){
        worker.join();
    } 
}
```

### 3. 测试示例
C++版本支持直接传递函数和参数，通过`std::future`非阻塞获取结果：

```plain
// 1. 无参无返回
void test1() {
    std::ostringstream oss;
    oss << "test1: tid = " << std::this_thread::get_id() << "\n";
    std::cout << oss.str();
    std::this_thread::sleep_for(std::chrono::seconds(1));
}
// 2. 无参有返回
int test2() {
    int retval = 1;
    std::ostringstream oss;
    oss << "test2: tid = " << std::this_thread::get_id() << ", retval = " << retval << "\n";
    std::cout << oss.str();
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return retval;
}
// 3. 有参有返回
int test3(int a, int b) {
    std::ostringstream oss;
    oss << "test3: tid = " << std::this_thread::get_id() << ", args = " << a << ", " << b << "\n";
    std::cout << oss.str();
    std::this_thread::sleep_for(std::chrono::seconds(3));
    return a + b;
}
```

主线程使用示例：

```plain
int main() {
    ThreadPool pool(4);
    `std::vector<std::future<int>`> results;
    for (int i = 0; i < 10; ++i) {
        if(i % 3 == 0) pool.enqueue(test1);
        else if(i % 3 == 1) results.emplace_back(pool.enqueue(test2));
        else results.emplace_back(pool.enqueue(test3, i, i * 2));
    }
    `std::vector<bool>` completed(results.size(), false);
    int remaining = results.size();
    // 或者创建新的线程监控也可以
    while (remaining > 0) {
        for (size_t i = 0; i < results.size(); ++i) {
            if (completed[i]) continue;
            // 检查任务是否已完成（非阻塞）
            std::future_status status = results[i].wait_for(std::chrono::milliseconds(10));
            if (status == std::future_status::ready) {
                auto res = results[i].get();    //! 先把future的值取出来，防止与锁冲突导致死锁
                std::ostringstream oss;
                oss << "task" << i << " result: " << res << std::endl;
                std::cout << oss.str();
                completed[i] = true;
                remaining--;
            }
        }
        // 短暂休眠，避免空轮询占用CPU
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
    return 0;
}
```

## 四、C vs C++实现对比
| 特性 | C语言版本 | C++版本 |
| :--- | :--- | :--- |
| 线程管理 | pthread库（pthread_create/join） | std::thread（RAII自动管理） |
| 任务队列 | 自定义双向链表 | std::queue<`std::function<void()>`> |
| 同步机制 | pthread_mutex_t/pthread_cond_t | std::mutex/std::condition_variable |
| 返回值获取 | 手动管理void*指针+互斥锁 | std::future/std::packaged_task |
| 泛型支持 | 需手动强制类型转换 | 模板+完美转发（支持任意任务类型） |
| 代码简洁度 | 代码量大，需手动管理资源 | 代码简洁，RAII自动释放资源 |


## 五、线程池关键注意事项
1. 1. **线程安全**：任务队列的存取必须加互斥锁，避免数据竞争；
2. 2. **条件变量使用**：必须用`while`循环判断条件（避免虚假唤醒）；
3. 3. **资源释放**：任务返回值若使用堆内存，需手动释放；线程池销毁时需唤醒所有线程并等待结束；
4. 4. **任务执行效率**：任务执行逻辑应避免持有锁，防止阻塞其他任务；
5. 5. **线程数量选择**：CPU密集型任务线程数建议等于CPU核心数；IO密集型任务可适当增加线程数。

## 六、总结
线程池是并发编程中的重要工具，通过复用线程有效提升了程序性能。C语言版本更贴近底层，适合理解线程池的核心机制；C++版本利用现代特性简化了实现，支持更灵活的任务处理。掌握线程池的实现原理，不仅能应对实际开发中的并发需求，也能加深对多线程同步机制的理解。

## 完整源码地址
+ • https://gitee.com/Naezaer/ThreadPool.git

> 来自: [【C/C++】线程池基本功能的实现](https://mp.weixin.qq.com/s/uVV6KRef0Ebx2znP8xYMww?click_id=4)
>





