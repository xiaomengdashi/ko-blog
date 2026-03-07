> **仓库**：https://github.com/scylladb/seastar  
> **官网**：https://seastar.io  
> **官方文档**：https://docs.seastar.io  
> **License**：Apache 2.0  
> **语言标准**：C++20 / C++23

---

## 一、项目简介

Seastar 是一个由 **ScyllaDB 团队**开发的高性能 C++ 服务端异步框架，专为构建高并发、低延迟的服务端应用而设计。它被 ScyllaDB、Redpanda、Ceph Crimson 等顶级基础设施软件所采用。

其核心目标是：

> 在现代多核、多 NUMA 节点硬件上，以最小的运行时开销实现极致的 I/O 并发性能。

---

## 二、核心设计理念

### 2.1 Shared-Nothing 架构

这是 Seastar 最根本的设计哲学。

传统多线程程序的问题在于：多个线程共享内存，访问共享数据需要加锁，而锁操作在现代 CPU 上代价极高——原子指令、cache line 争用、内存屏障。在 10Gbps 网络下，一个 2GHz 处理器处理 1024 字节的数据包只有约 1670 个时钟周期可用，锁的开销根本无法承受。

Seastar 的解法是彻底消除共享：

- **每个 CPU 核心运行一个独立线程**，称为一个 **shard**
- 每个 shard 拥有自己的内存区域、网络队列、磁盘队列、任务调度器
- **shard 之间不共享任何数据**，通过显式的消息传递通信
- 无锁、无 cache 争用，性能随核心数线性扩展

```
传统模型：                          Seastar 模型：
┌──────────────────────┐            ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  Thread 1            │            │Shard0│ │Shard1│ │Shard2│ │Shard3│
│  Thread 2  ──┐       │            │ CPU0 │ │ CPU1 │ │ CPU2 │ │ CPU3 │
│  Thread 3    ├─ 锁   │            │ mem0 │ │ mem1 │ │ mem2 │ │ mem3 │
│  Thread 4  ──┘       │            └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
│  共享内存             │               └────────┴── msg ──┴────────┘
└──────────────────────┘                  显式消息传递，无锁
```

### 2.2 Future/Promise 编程模型

Seastar 的异步编程基于 **Future/Promise** 模式，这是无栈协程风格的核心抽象。

- **Future**：代表一个"尚未完成的计算结果"，是消费端
- **Promise**：是 Future 对应的生产端，负责在未来某时刻 `set_value()`
- **Continuation**：通过 `.then()` 链接在 Future 就绪后执行的回调

可以把 Future/Promise 理解为：**容量为 1 的单次使用队列**，Promise 写入，Future 读取，框架保证无论操作顺序如何都能正确工作。

Seastar 的 Future 相比 `std::future` 有本质区别：

| 特性 | `seastar::future` | `std::future` |
|---|---|---|
| 线程安全 | 单线程（shard 内） | 线程安全（有锁） |
| 内存分配 | 不分配（内联状态） | 堆分配 |
| 锁 | 无锁 | 有锁 |
| 适用粒度 | 细粒度非阻塞任务 | 粗粒度阻塞任务 |

### 2.3 Reactor 模式（事件循环）

每个 shard 内部运行一个 **Reactor**，即单线程事件循环。所有任务必须是异步非阻塞的——如果某个任务阻塞，该 shard 上的所有其他任务都会被饿死。

Reactor 负责：

- 调度 CPU 任务（小型 `std::function` 回调）
- 处理网络 I/O 事件
- 处理磁盘 I/O 事件
- 管理定时器

---

## 三、核心 API

### 3.1 Hello World

```cpp
#include <seastar/core/app-template.hh>
#include <seastar/core/future.hh>
#include <iostream>

int main(int argc, char** argv) {
    seastar::app_template app;
    return app.run(argc, argv, [] {
        std::cout << "Hello world\n";
        return seastar::make_ready_future<>();
    });
}
```

### 3.2 Future/Promise 基本用法

```cpp
// .then() 链式风格
seastar::future<std::string> compute_async() {
    return seastar::make_ready_future<std::string>("hello");
}

seastar::future<> f() {
    return compute_async().then([] (std::string result) {
        std::cout << result << std::endl;
        return seastar::make_ready_future<>();
    });
}
```

```cpp
// C++20 co_await 风格（推荐）
seastar::future<> f() {
    auto result = co_await compute_async();
    std::cout << result << std::endl;
}
```

### 3.3 并行执行多个异步操作

```cpp
seastar::future<> f() {
    return seastar::when_all(
        seastar::sleep(200ms),
        seastar::sleep(100ms),
        seastar::sleep(1s)
    ).then([] (auto results) {
        // 全部完成后执行
        std::cout << "All done\n";
    });
}
```

### 3.4 循环与迭代

```cpp
// 持续循环
return seastar::keep_doing([&listener] {
    return listener.accept().then(
        [] (seastar::connected_socket s, seastar::socket_address a) {
            // 处理每个新连接
        }
    );
});

// 对集合异步迭代
return seastar::do_for_each(items, [] (auto& item) {
    return process(item);
});
```

### 3.5 跨 Shard 通信

```cpp
// 在当前 shard 上查询 shard 0 的数据
smp::submit_to(0, [key] {
    return local_database[key];  // 在 shard 0 上执行
}).then([key] (sstring value) {
    print("key=%s, value=%s\n", key, value);
});
```

等价的传统多线程代码需要对 `local_database` 加锁，Seastar 完全无锁。

### 3.6 错误处理

Future 链中的异常会自动向下传播，跳过中间的 `.then()`：

```cpp
return pass()
    .then([] { return fail(); })     // 抛出异常
    .then([] { /* 被自动跳过 */ })
    .handle_exception([] (std::exception_ptr e) {
        // 在这里统一捕获
        std::cerr << "Error occurred\n";
    });
```

### 3.7 Seastar Threads（协作式轻量线程）

对于计算密集型代码或需要同步写法的场景：

```cpp
seastar::future<> f() {
    return seastar::async([] {
        // 可以使用 .get() 同步等待，不会真正阻塞 Reactor
        auto v = read_something().get();
        write_something(v).get();
        std::cout << "done\n";
    });
}
```

这些线程是**协作式**的，会在 `.get()` 调用处主动 yield，不会阻塞 Reactor。

### 3.8 零拷贝存储 I/O

```cpp
// 基于 DMA 的零拷贝文件读取
return file.dma_read<char>(offset, size).then(
    [] (seastar::temporary_buffer<char> buf) {
        // buf 直接指向 DMA 缓冲区，无需拷贝
        process(buf.get(), buf.size());
    }
);
```

---

## 四、网络栈

### 4.1 双栈支持

| 网络栈 | 实现层 | 特点 |
|---|---|---|
| **Seastar Native Stack** | 用户态 TCP/IP（基于 DPDK） | 零拷贝，极低延迟，绕过内核 |
| **POSIX Hosted Stack** | Linux 内核 socket | 兼容性好，无需特殊硬件 |

### 4.2 用户态 TCP/IP 栈（Native Stack）

Seastar 的 Native Stack 基于 **DPDK**（Data Plane Development Kit），直接操作网卡，完全绕过内核网络栈：

- **零拷贝**：数据从网卡 DMA 直接到应用内存，发送时也无需拷贝
- **无内核介入**：消除系统调用开销和内核调度延迟
- **每核独立队列**：网卡硬件队列与 CPU 核心一一对应，无竞争

### 4.3 推荐硬件配置

| 硬件 | 推荐规格 |
|---|---|
| CPU | 核心数越多越好，NUMA 友好 |
| 网卡 | 10G / 40G，支持多硬件队列（每核一个队列最佳） |
| 磁盘 | 高 IOPS 的 NVMe SSD |
| 客户端 | 建议使用多台独立机器进行压测，单机通常无法打满服务端 |

---

## 五、构建与集成

### 5.1 安装依赖

```bash
sudo ./install-dependencies.sh
```

### 5.2 构建模式

| 模式 | CMake 类型 | 优化级别 | Sanitizer | 用途 |
|---|---|---|---|---|
| `debug` | Debug | `-O0` | ASAN + UBSAN | GDB 调试 |
| `dev` | Dev | `-O1` | 无 | 日常开发/测试循环 |
| `release` | RelWithDebInfo | `-O3` | 无 | 生产部署 |
| `sanitize` | Sanitize | `-Os` | ASAN + UBSAN | 深度 bug 追踪 |

> **性能参考**：release 比 dev 快约 2 倍，比 sanitize 快约 150 倍，比 debug 快约 300 倍。

```bash
# 配置为 release 模式
./configure.py --mode=release

# 编译
ninja -C build/release

# 安装（可选）
./configure.py --mode=release --prefix=/usr/local
ninja -C build/release install
```

### 5.3 集成到项目（CMake）

```cmake
set(CMAKE_CXX_STANDARD 23)
find_package(Seastar REQUIRED)

add_executable(my_app my_app.cc)
target_link_libraries(my_app Seastar::seastar)
```

```bash
cmake -DCMAKE_PREFIX_PATH="$seastar_dir/build/release;$seastar_dir/build/release/_cooking/installed" \
      -DCMAKE_MODULE_PATH=$seastar_dir/cmake \
      $my_app_dir
```

### 5.4 通过 pkg-config 集成

```bash
g++ my_app.cc $(pkg-config --libs --cflags --static seastar) -o my_app
```

### 5.5 本地依赖拉取（--cook）

如果系统缺少某个依赖，可以让构建系统自动拉取本地版本：

```bash
./configure.py --mode=dev --cook fmt --cook boost
```

---

## 六、与其他框架对比

| 维度 | Seastar | userver | Node.js | Go |
|---|---|---|---|---|
| 语言 | C++ | C++ | JavaScript | Go |
| 协程模型 | Future/Promise + co_await（无栈） | 有栈协程 | 事件回调 + async/await | goroutine（有栈） |
| 调度模型 | Shared-nothing，每核独立 | M:N TaskProcessor | 单线程事件循环 | M:N runtime |
| 跨核通信 | 显式消息传递 | 共享内存 + 调度器 | 不适用 | channel |
| 用户态网络栈 | 支持（DPDK） | 不支持 | 不支持 | 不支持 |
| 适用场景 | 数据库/存储基础设施 | 微服务业务系统 | Web 应用 | 通用后端服务 |
| 开发难度 | 高（框架侵入性强） | 中（接近普通 C++） | 低 | 低 |

---

## 七、使用 Seastar 的知名项目

| 项目 | 描述 |
|---|---|
| **ScyllaDB** | 兼容 Cassandra/DynamoDB 的高性能 NoSQL 数据库 |
| **Redpanda** | Kafka 的高性能替代品，延迟更低 |
| **Ceph Crimson** | 下一代 Ceph OSD 实现 |
| **smf** | 号称延迟最低的 RPC 框架（优于 gRPC、Thrift、Cap'n Proto） |
| **cpv-cql-driver** | 基于 Seastar 的 Cassandra/Scylla C++ 驱动 |

---

## 八、适用场景与局限

### 适合使用 Seastar 的场景

- 对延迟有极致要求的基础设施软件（数据库、消息队列、存储引擎）
- 需要充分利用多核 + NUMA 架构的服务
- 网络/磁盘 I/O 密集型、吞吐量要求极高的系统
- 愿意接受 Future/Promise 编程范式的团队

### 不适合的场景

- 普通业务微服务（框架侵入性太强，一旦引入 Seastar 整个代码库都必须异步化）
- 团队对 C++ 异步编程不熟悉的项目
- 需要快速迭代的业务系统

---

## 九、学习资源

| 资源 | 地址 |
|---|---|
| 官方教程 | https://docs.seastar.io/master/tutorial.html |
| API 文档 | https://docs.seastar.io |
| Future/Promise 详解 | https://seastar.io/futures-promises/ |
| Shared-nothing 设计 | https://seastar.io/shared-nothing/ |
| GitHub 仓库 | https://github.com/scylladb/seastar |
| 开发者邮件列表 | seastar-dev@googlegroups.com |
| GitHub Discussions | https://github.com/scylladb/seastar/discussions |
