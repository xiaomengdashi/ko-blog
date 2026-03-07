> **仓库**：https://github.com/userver-framework/userver  
> **官网**：https://userver.tech  
> **官方文档**：https://userver.tech/de/d6a/md_en_2index.html  
> **License**：Apache 2.0  
> **语言标准**：C++17 / C++20  
> **最新版本**：2.15（2026-01-27）

---

## 一、项目简介

userver 是由 **Yandex 团队**开发并开源的生产级 C++ 异步框架，已在 Yandex 的打车、外卖、电商、金融等大规模服务中运行多年，后以 Apache 2.0 协议开源。

其核心目标是：

> 让开发者写出和普通同步代码一样直观的 C++ 代码，同时框架在底层透明地处理所有异步 I/O，避免 CPU 资源浪费在线程等待上。

---

## 二、核心设计理念

### 2.1 有栈协程（Stackful Coroutine）

userver 使用基于 **boost.context** 的有栈协程，而非 C++20 的无栈协程。

每个协程拥有独立的调用栈，挂起时保存完整的寄存器上下文，恢复时精确还原。这带来了关键优势：**在任意调用深度都可以透明地挂起**，不需要业务代码标注 `async`/`co_await`，整个调用链对开发者完全透明。

```cpp
// 这段代码看起来和普通同步代码一模一样
// 但 Execute() 内部会在等待 DB 响应时自动挂起当前协程
// 线程会去处理其他请求，数据就绪后再恢复执行
auto res = dep.pg().Execute(
    storages::postgres::ClusterHostType::kSlave,
    "SELECT value FROM key_value_table WHERE key=$1", request.key
);
```

### 2.2 M:N 调度模型（TaskProcessor）

userver 使用 **M 个协程运行在 N 个 OS 线程上**的调度模型，N 通常等于 CPU 核心数。

调度的核心组件是 `TaskProcessor`，每个 `TaskProcessor` 拥有：

- 固定数量的 worker 线程（绑定 CPU 核）
- Lock-free 任务队列
- Work-stealing 调度策略（避免线程饥饿）

一个服务通常配置多个 `TaskProcessor`，职责严格分离：

| TaskProcessor | 用途 |
|---|---|
| `main-task-processor` | 处理业务逻辑协程 |
| `io-task-processor` | 运行 event loop（epoll） |
| `fs-task-processor` | 处理阻塞的文件 I/O |
| `bg-task-processor` | 后台低优先级任务 |
| `monitor-task-processor` | 监控与诊断 |

### 2.3 I/O 事件机制

底层使用 **epoll**（Linux）/ kqueue（macOS）/ IOCP（Windows）监听 I/O 就绪事件。当 socket 数据就绪时，event loop 将对应协程放回 runnable 队列，由 worker 线程恢复执行。整个过程 OS 线程从不阻塞。

### 2.4 动态配置（Dynamic Config）

userver 内置了完整的**运行时配置热更新**系统，无需重启服务即可修改：

- 超时设置
- 限流/熔断参数
- 功能开关（Feature Flag）
- 日志级别
- Deadline 传播策略

动态配置通过 JSON 格式分发，支持本地文件缓存作为 fallback。

---

## 三、核心 API

### 3.1 Hello World

```cpp
#include <userver/easy.hpp>

int main(int argc, char* argv[]) {
    using namespace userver;
    easy::HttpWith<>(argc, argv)
        .Get("/hello", [] {
            return std::string("Hello, World!");
        });
}
```

### 3.2 HTTP 服务 + PostgreSQL（完整示例）

```cpp
#include <userver/easy.hpp>
#include "schemas/key_value.hpp"  // 由 JSON Schema 自动生成

int main(int argc, char* argv[]) {
    using namespace userver;

    easy::HttpWith<easy::PgDep>(argc, argv)
        .Get("/kv", [](schemas::KeyRequest&& request, const easy::PgDep& dep) {
            // 异步执行 SQL，当前线程在等待期间处理其他请求
            auto res = dep.pg().Execute(
                storages::postgres::ClusterHostType::kSlave,
                "SELECT value FROM key_value_table WHERE key=$1",
                request.key
            );
            return schemas::KeyValue{
                .key   = std::move(request.key),
                .value = res[0][0].As<std::string>(),
            };
        });
}
```

### 3.3 创建异步任务

```cpp
#include <userver/utils/async.hpp>

// 在当前 TaskProcessor 上启动一个新协程
auto task = utils::Async("my_job", &my_function, arg1, arg2);

// 做其他事情...

// 等待任务完成并获取结果
auto result = task.Get();
```

### 3.4 任务取消与 Deadline 传播

```cpp
// 启动子任务
auto child_task = utils::Async("child", [] {
    // 如果父任务被取消，取消信号会在下一个 yield 点传递到这里
    DoSomeLongWork();
});

SomeOtherWork();

// 等待子任务，如果超时会自动取消
child_task.Get();
```

取消信号通过每个协程携带的 **cancellation token** 传递，在每次 yield 点恢复时检查一次。

### 3.5 动态配置读取

```cpp
#include <userver/dynamic_config/storage/component.hpp>

// 定义一个动态配置 Key（含默认值）
inline constexpr dynamic_config::Key<int> kMyTimeout{
    "MY_SERVICE_TIMEOUT_MS", 5000
};

// 在业务代码中读取
auto& config_source = context.FindComponent<components::DynamicConfig>().GetSource();
auto snapshot = config_source.GetSnapshot();
int timeout_ms = snapshot[kMyTimeout];
```

### 3.6 TaskProcessor 配置（YAML）

```yaml
components_manager:
  coro_pool:
    initial_size: 5000    # 协程池初始大小
    max_size: 50000       # 协程池最大大小
  default_task_processor: main-task-processor
  event_thread_pool:
    threads: 2
  task_processors:
    main-task-processor:
      thread_name: main-worker
      worker_threads: 16
    fs-task-processor:
      thread_name: fs-worker
      worker_threads: 2
    bg-task-processor:
      thread_name: bg-worker
      worker_threads: 2
      os-scheduling: idle   # 后台任务降低 OS 调度优先级
```

---

## 四、支持的数据库与协议

### 4.1 数据库驱动（全部异步）

| 数据库 | 模块 |
|---|---|
| PostgreSQL | `postgresql/` |
| MongoDB | `mongo/` |
| Redis / Valkey | `redis/` |
| ClickHouse | `clickhouse/` |
| MySQL / MariaDB | `mysql/` |
| SQLite | `sqlite/` |
| YDB（Yandex DB） | `ydb/` |
| RocksDB | `rocks/` |

### 4.2 网络协议

| 协议 | 支持情况 |
|---|---|
| HTTP 1.1 / 2.0 | 客户端 + 服务端 |
| gRPC | 客户端 + 服务端（含 retry limiter） |
| WebSocket | 客户端 + 服务端 |
| Kafka | 生产者 + 消费者 |
| AMQP 0-9-1（RabbitMQ） | 支持 |
| TCP / UDP | 低层 socket |
| TLS | 支持 |

---

## 五、高级功能组件

### 5.1 缓存系统

userver 内置多种缓存抽象：

- **LRU 缓存**：带 TTL 的内存缓存
- **全量缓存（Full Cache）​**：定期从数据库全量加载，提供零延迟本地读取
- **增量缓存（Incremental Cache）​**：支持增量更新

### 5.2 分布式锁（DistLock）

基于 PostgreSQL 或 Redis 实现的分布式锁，用于保证定时任务在多实例部署下只有一个节点执行。

### 5.3 日志与追踪（Logging & Tracing）

- 结构化日志，支持多种输出格式
- 内置 OpenTelemetry（OTLP）支持
- 请求链路追踪，trace_id 自动在协程间传播

### 5.4 限流与熔断（Congestion Control）

`congestion_control::Component` 在过载时自动返回 HTTP 429，保护服务不被打垮。关键参数通过动态配置实时调整：

- `USERVER_RPS_CCONTROL`：RPS 限制参数
- `USERVER_RPS_CCONTROL_ENABLED`：开关

### 5.5 Testsuite（功能测试框架）

userver 提供了完整的 Python 测试框架，支持：

- 启动真实服务进行功能测试
- Mock 外部依赖（数据库、HTTP 服务等）
- 混沌测试（Chaos Testing）

```python
async def test_hello(service_client):
    response = await service_client.get('/hello')
    assert response.status == 200
    assert response.text == 'Hello, World!'
```

---

## 六、组件系统

userver 的服务由**组件（Component）​**构成，每个组件封装一块独立的功能逻辑，并通过 `ComponentContext` 声明依赖关系。

```cpp
class MyComponent final : public components::LoggableComponentBase {
public:
    static constexpr std::string_view kName = "my-component";

    MyComponent(const components::ComponentConfig& config,
                const components::ComponentContext& context)
        : LoggableComponentBase(config, context),
          pg_cluster_(
              context.FindComponent<components::Postgres>("postgres-db")
                     .GetCluster()
          ) {}

private:
    storages::postgres::ClusterPtr pg_cluster_;
};
```

组件的构造顺序由依赖关系自动推导，析构顺序与构造顺序相反，保证生命周期安全。

---

## 七、平台支持

| 平台 | 支持情况 |
|---|---|
| Ubuntu 22.04 / 24.04 | 完整支持，提供官方 Docker 镜像 |
| Fedora | 支持 |
| Debian | 支持 |
| Alpine | 支持 |
| Arch Linux | 支持 |
| macOS | 支持 |
| Docker | 提供 CI 镜像 |
| Conan | 支持包管理集成 |

---

## 八、构建与集成

### 8.1 快速开始（使用服务模板）

```bash
# 使用官方服务模板创建新项目
git clone https://github.com/userver-framework/service_template my_service
cd my_service

# 构建（需要 Docker）
make build-debug

# 运行测试
make test-debug
```

### 8.2 CMake 集成

```cmake
find_package(userver COMPONENTS core postgresql redis grpc REQUIRED)

add_executable(my_service main.cpp)
target_link_libraries(my_service userver::postgresql userver::grpc)
```

### 8.3 Conan 集成

```bash
conan install . --build=missing
```

### 8.4 本地依赖拉取（CPM）

userver 使用 CPM.cmake 管理第三方依赖，构建时会自动拉取所需版本。

---

## 九、与其他框架对比

| 维度 | userver | Seastar | Go | Node.js |
|---|---|---|---|---|
| 语言 | C++ | C++ | Go | JavaScript |
| 协程类型 | 有栈协程 | Future/Promise（无栈） | goroutine（有栈） | async/await（无栈） |
| 调度模型 | M:N + TaskProcessor | Shared-nothing，每核独立 | M:N runtime | 单线程事件循环 |
| 数据库支持 | 极丰富（PG/Mongo/Redis/...） | 无内置驱动 | 第三方库 | 第三方库 |
| 动态配置 | 内置完整系统 | 无 | 无 | 无 |
| 用户态网络栈 | 不支持 | 支持（DPDK） | 不支持 | 不支持 |
| 开发体验 | 接近普通 C++ | Future 链，侵入性强 | 简单 | 简单 |
| 适用场景 | C++ 微服务业务系统 | 数据库/存储基础设施 | 通用后端 | Web 应用 |

---

## 十、适用场景与局限

### 适合使用 userver 的场景

- 需要高性能的 C++ 微服务系统
- 数据库操作密集型服务（多种 DB 异步驱动开箱即用）
- 需要运行时动态调整配置的生产服务
- 需要完整可观测性（日志、追踪、指标）的服务
- 从 Yandex 技术栈迁移的团队

### 局限与注意事项

- **不能在协程中使用标准库的阻塞同步原语**（如 `std::mutex`、`std::this_thread::sleep_for`），这些会阻塞 OS 线程，导致性能大幅下降；必须使用 userver 自己的同步原语（`engine::Mutex`、`engine::SleepFor` 等）
- 学习曲线相对陡峭，需要理解协程调度模型
- 重量级框架，不适合简单的小工具程序

---

## 十一、学习资源

| 资源 | 地址 |
|---|---|
| 官方文档首页 | https://userver.tech/de/d6a/md_en_2index.html |
| 基础介绍 | https://userver.tech/d8/d00/md_en_2userver_2intro.html |
| TaskProcessor 指南 | https://userver.tech/db/d90/md_en_2userver_2task__processors__guide.html |
| 动态配置文档 | https://userver.tech/d5/d46/md_en_2userver_2dynamic__config.html |
| 生产服务配置示例 | https://userver.tech/db/d69/md_en_2userver_2tutorial_2production__service.html |
| GitHub 仓库 | https://github.com/userver-framework/userver |
| Telegram 英文群 | https://t.me/userver_en |
| Telegram 中文群 | 暂无，可加英文群 |
