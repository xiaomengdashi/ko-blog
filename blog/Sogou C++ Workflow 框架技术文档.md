> **仓库**：https://github.com/sogou/workflow  
> **License**：Apache 2.0  
> **语言标准**：C++11 及以上  
> **Stars**：14.3k  
> **定位**：C++ 并行计算与异步网络引擎

---

## 一、项目简介

C++ Workflow 是搜狗公司的后端程序引擎，支撑了搜狗几乎所有的后端 C++ 在线服务，包括搜索、云输入法、在线广告等，**每天处理超过 100 亿次请求**，2019 年以 Apache 2.0 协议开源。

其核心目标是：

> 将通信与计算融合为统一的任务模型，以极轻量的方式构建高性能的复杂后端服务。

---

## 二、核心设计哲学

### 程序 = 协议 + 算法 + 任务流

这是 Workflow 最根本的设计理念，也是它与其他异步框架最大的区别。

- **协议（Protocol）​**：对应网络通信任务（HTTP、Redis、MySQL 等）
- **算法（Algorithm）​**：对应计算任务（sort、merge、reduce 或用户自定义）
- **任务流（Workflow）​**：将协议任务和算法任务统一编排成 Series / Parallel / DAG

如果 RPC 是远程过程调用，那么 Workflow 里的算法调用就是 **APC（Async Procedure Call，异步过程调用）​**。网络 I/O 和 CPU 计算在框架里地位完全对称，可以放进同一个流里混合编排。

### 异步模型：纯回调，不依赖协程

Workflow **不使用协程**，而是基于纯回调 + 任务图的模型：

- 无协程栈开销，内存占用极低
- 库文件可裁剪到 400KB
- 跨平台支持（Linux / macOS / Windows / Android）
- 代价是复杂逻辑下回调可读性不如协程风格

---

## 三、六种基础任务类型

所有任务统一由 **Task Factory** 创建，回调结束后自动回收，用户无需手动管理生命周期。

| 任务类型 | 说明 |
|---|---|
| **Communication Task** | 网络通信（HTTP/Redis/MySQL/Kafka 等） |
| **File IO Task** | 异步文件读写（基于 aio/io_uring） |
| **CPU Task** | 计算任务（内置 sort/merge/reduce 或用户自定义） |
| **GPU Task** | GPU 计算任务 |
| **Timer Task** | 异步定时器 |
| **Counter Task** | 计数器，用于任务间同步 |

---

## 四、任务编排

### 4.1 Series（串行）

任务按顺序执行，前一个完成才启动下一个。

```cpp
// 先请求 Redis，拿到结果后再发 HTTP 请求
WFRedisTask *redis_task = WFTaskFactory::create_redis_task(
    "redis://127.0.0.1/", 3, [](WFRedisTask *task) {
        // 处理 Redis 响应
        auto *http_task = WFTaskFactory::create_http_task(
            "http://example.com", 3, 3, [](WFHttpTask *t) {
                // 处理 HTTP 响应
            }
        );
        // 将 http_task 追加到当前 series
        series_of(task)->push_back(http_task);
    }
);
redis_task->start();
```

### 4.2 Parallel（并行）

多个 Series 并发执行，全部完成后汇聚到一个回调。

```cpp
WFHttpTask *task1 = WFTaskFactory::create_http_task("http://a.com", 3, 3, cb1);
WFHttpTask *task2 = WFTaskFactory::create_http_task("http://b.com", 3, 3, cb2);
WFHttpTask *task3 = WFTaskFactory::create_http_task("http://c.com", 3, 3, cb3);

ParallelWork *parallel = Workflow::create_parallel_work(
    [](const ParallelWork *) {
        // 三个任务全部完成后执行
        printf("All done\n");
    }
);

parallel->add_series(Workflow::create_series_work(task1, nullptr));
parallel->add_series(Workflow::create_series_work(task2, nullptr));
parallel->add_series(Workflow::create_series_work(task3, nullptr));
parallel->start();
```

### 4.3 DAG（有向无环图）

任意复杂的任务依赖关系，适合多阶段处理流水线。

```
         ┌─── task_B ───┐
task_A ──┤               ├─── task_D
         └─── task_C ───┘
```

---

## 五、HTTP 服务快速上手

### 5.1 最简 HTTP 服务端

```cpp
#include "workflow/WFHttpServer.h"

int main() {
    WFHttpServer server([](WFHttpTask *task) {
        task->get_resp()->append_output_body("<html>Hello World!</html>");
    });

    if (server.start(8888) == 0) {
        getchar();  // 按 Enter 停止
        server.stop();
    }
    return 0;
}
```

### 5.2 HTTP 客户端

```cpp
#include "workflow/WFTaskFactory.h"

int main() {
    WFHttpTask *task = WFTaskFactory::create_http_task(
        "http://www.example.com/",
        3,   // 重定向次数
        3,   // 重试次数
        [](WFHttpTask *task) {
            auto *resp = task->get_resp();
            std::string body;
            resp->get_parsed_body(&body);
            printf("%s\n", body.c_str());
        }
    );
    task->start();
    getchar();
    return 0;
}
```

### 5.3 Redis 客户端

```cpp
WFRedisTask *task = WFTaskFactory::create_redis_task(
    "redis://127.0.0.1/0",
    3,  // 重试次数
    [](WFRedisTask *task) {
        protocol::RedisValue val;
        task->get_resp()->get_result(val);
        if (val.is_string())
            printf("value: %s\n", val.string_value().c_str());
    }
);
task->get_req()->set_request("GET", {"my_key"});
task->start();
```

### 5.4 MySQL 客户端

```cpp
WFMySQLTask *task = WFTaskFactory::create_mysql_task(
    "mysql://root:password@127.0.0.1/mydb",
    3,
    [](WFMySQLTask *task) {
        auto *resp = task->get_resp();
        MySQLResultCursor cursor(resp);
        // 遍历结果集
        std::vector<MySQLCell> row;
        while (cursor.fetch_row(row)) {
            for (auto &cell : row)
                printf("%s\t", cell.as_string().c_str());
            printf("\n");
        }
    }
);
task->get_req()->set_query("SELECT * FROM users LIMIT 10");
task->start();
```

---

## 六、计算任务

算法任务和网络任务地位完全对称，可以混合编排在同一个 Series 里。

### 6.1 使用内置算法（以排序为例）

```cpp
// 对 vector 进行异步并行排序
std::vector<int> data = {5, 3, 1, 4, 2};

auto *sort_task = WFAlgoTaskFactory::create_sort_task(
    "default",
    data.begin(), data.end(),
    [](WFSortTask<int> *task) {
        auto *output = task->get_output();
        for (auto v : *output)
            printf("%d ", v);
    }
);
sort_task->start();
```

### 6.2 用户自定义计算任务（Go Task）

```cpp
// 最简单的方式：直接提交一个 lambda 到线程池异步执行
auto *go_task = WFTaskFactory::create_go_task(
    "my_compute",
    [](int a, int b) {
        printf("result = %d\n", a + b);
    },
    10, 20
);
go_task->start();
```

---

## 七、连接管理（完全透明）

Workflow 的连接对用户完全透明，框架自动处理：

- **连接复用**：根据目标地址自动查找可复用连接
- **自动重连**：连接断开后透明重建
- **自动重试**：请求失败时按配置自动重试
- **DNS 解析**：异步透明，无需用户关心
- **连接池**：框架内部管理，用户无需配置

用户只需要：填好请求 → start 任务 → 在回调里拿结果。

---

## 八、内置协议支持

| 协议 | 角色 | 备注 |
|---|---|---|
| HTTP / HTTPS | 客户端 + 服务端 | 支持 chunked、gzip |
| Redis | 客户端 | 支持 pipeline |
| MySQL / MariaDB / TiDB | 客户端 | 支持事务 |
| Kafka | 客户端 | 需要 snappy / lz4 |
| 用户自定义协议 | 客户端 + 服务端 | 只需实现序列化/反序列化 |

---

## 九、构建与集成

### 9.1 Linux 快速构建

```bash
git clone https://github.com/sogou/workflow.git
cd workflow
make
```

裁剪功能以减小体积：

```bash
# 去掉 Redis、MySQL、Upstream、Consul 支持
make REDIS=n MYSQL=n UPSTREAM=n CONSUL=n

# 调试版本
make DEBUG=y
```

最小裁剪后库文件可缩减到 **400KB**。

### 9.2 CMake 集成

```cmake
find_package(workflow REQUIRED)

add_executable(my_app main.cpp)
target_link_libraries(my_app workflow pthread ssl crypto)
```

### 9.3 平台支持

| 平台 | 支持情况 |
|---|---|
| Linux | 完整支持（主要平台） |
| macOS | 支持 |
| Windows | 支持 |
| Android | 支持 |

---

## 十、生态：srpc

基于 Workflow 构建的 RPC 框架 **srpc**（https://github.com/sogou/srpc），同时兼容四种协议：

| 协议 | 说明 |
|---|---|
| srpc | Sogou 自有 RPC 协议 |
| brpc | 百度 bRPC 协议 |
| tRPC | 腾讯 tRPC 协议 |
| Thrift | Apache Thrift 协议 |

---

## 十一、与其他框架对比

| 维度 | Workflow | userver | Seastar |
|---|---|---|---|
| 语言 | C++ | C++ | C++ |
| 异步模型 | 回调 + 任务 DAG | 有栈协程 | Future/Promise |
| 协程支持 | 无 | 有（有栈） | 有（C++20 co_await） |
| 计算任务 | 一等公民（与网络对称） | 支持但非核心 | 支持但非核心 |
| 连接管理 | 完全透明自动 | 连接池，用户可配置 | 用户管理 |
| 跨平台 | Linux/macOS/Windows/Android | Linux/macOS | Linux 为主 |
| 库体积 | 极小（最小 400KB） | 较大（完整框架） | 较大 |
| 适用场景 | 多阶段处理流水线、搜索引擎 | C++ 微服务业务系统 | 数据库/存储基础设施 |

---

## 十二、适用场景与局限

### 适合使用 Workflow 的场景

- 业务本质是多阶段处理流水线（如搜索引擎：召回 → 排序 → 截断 → 渲染）
- 需要混合网络 I/O 和 CPU 计算的复杂任务流
- 对库体积有严格要求（嵌入式、移动端）
- 需要跨平台（Windows/Android）支持的项目
- 希望连接管理完全透明、零配置的场景

### 局限与注意事项

- 没有协程支持，复杂嵌套逻辑的可读性不如 userver
- 没有内置的服务治理体系（动态配置、分布式锁、metrics 等需自行实现）
- 社区规模相对 userver/Seastar 较小，英文文档不够完善

---

## 十三、学习资源

| 资源 | 地址 |
|---|---|
| GitHub 仓库 | https://github.com/sogou/workflow |
| FAQ（含架构说明） | https://github.com/sogou/workflow/issues/406 |
| srpc 仓库 | https://github.com/sogou/srpc |
| 示例代码 | https://github.com/sogou/workflow/tree/master/tutorial |
