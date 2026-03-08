> **仓库**：https://github.com/drogonframework/drogon  
> **官网**：https://drogon.org  
> **License**：MIT  
> **语言标准**：C++17 / C++20  
> **最新版本**：v1.9.12（2026-01-26）  
> **Stars**：13.6k

---

## 一、项目简介

Drogon 是一个基于 C++17/20 的高性能 HTTP Web 应用框架，名字来源于美剧《权力的游戏》中的龙。它基于非阻塞 I/O（epoll/kqueue）提供高并发网络处理能力，支持完全异步的编程模式，是目前 C++ Web 框架中在 TechEmpower 基准测试中表现最突出的框架之一。

与 userver、Seastar、Workflow 这类通用异步框架不同，Drogon 的定位更接近 **Web 应用框架**，内置了路由、控制器、ORM、视图模板、过滤器等 Web 开发所需的完整组件，开发体验更接近 Spring Boot 或 Django，但性能远超它们。

---

## 二、平台支持

| 平台 | 支持情况 |
|---|---|
| Linux | 完整支持（epoll） |
| macOS / FreeBSD / OpenBSD | 支持（kqueue） |
| Windows | 支持 |
| HaikuOS | 支持 |
| ARM 架构 | 支持 |
| 交叉编译 | 支持（需设置 CMAKE_SYSTEM_NAME） |

---

## 三、核心特性

- 基于 epoll/kqueue 的非阻塞 I/O，高并发高性能
- 完全异步编程模式，支持 C++20 协程（co_await）
- 支持 HTTP 1.0 / 1.1（服务端 + 客户端）
- 基于模板的轻量反射机制，实现主程序、控制器、视图的完全解耦
- 内置 Cookie 与 Session 支持
- 支持服务端渲染（CSP 模板，C++ 代码嵌入 HTML）
- 支持视图页面动态加载（运行时动态编译加载）
- 灵活的路由系统（宏注册 / 配置文件注册）
- 支持过滤器链（Filter Chain），统一处理登录验证、Method 约束等
- 支持 HTTPS（基于 OpenSSL）
- 支持 WebSocket（服务端 + 客户端）
- 支持 JSON 请求与响应，对 RESTful API 开发极为友好
- 支持文件上传与下载
- 支持 gzip / brotli 压缩传输
- 支持 HTTP pipelining
- 提供轻量命令行工具 `drogon_ctl`，自动生成控制器、模型代码
- 支持 AOP（面向切面编程），内置 joinpoint
- 提供轻量 ORM，支持对象与数据库双向映射
- 支持插件系统（配置文件加载时安装）

---

## 四、快速上手

### 4.1 最简主程序

```cpp
#include <drogon/drogon.h>
using namespace drogon;

int main() {
    app().setLogPath("./")
         .setLogLevel(trantor::Logger::kWarn)
         .addListener("0.0.0.0", 80)
         .setThreadNum(16)
         .enableRunAsDaemon()
         .run();
}
```

使用配置文件进一步简化：

```cpp
#include <drogon/drogon.h>
using namespace drogon;

int main() {
    app().loadConfigFile("./config.json").run();
}
```

### 4.2 内联注册处理器（适合简单逻辑）

```cpp
app().registerHandler(
    "/test?username={name}",
    [](const HttpRequestPtr& req,
       std::function<void(const HttpResponsePtr&)>&& callback,
       const std::string& name) {
        Json::Value json;
        json["result"] = "ok";
        json["message"] = "hello, " + name;
        auto resp = HttpResponse::newHttpJsonResponse(json);
        callback(resp);
    },
    {Get, "LoginFilter"}
);
```

### 4.3 HttpSimpleController（推荐用于独立业务逻辑）

```cpp
/// TestCtrl.h
#pragma once
#include <drogon/HttpSimpleController.h>
using namespace drogon;

class TestCtrl : public drogon::HttpSimpleController<TestCtrl> {
public:
    void asyncHandleHttpRequest(
        const HttpRequestPtr& req,
        std::function<void(const HttpResponsePtr&)>&& callback) override;

    PATH_LIST_BEGIN
    PATH_ADD("/test", Get);
    PATH_LIST_END
};

/// TestCtrl.cc
#include "TestCtrl.h"
void TestCtrl::asyncHandleHttpRequest(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback) {
    auto resp = HttpResponse::newHttpResponse();
    resp->setBody("<p>Hello, world!</p>");
    resp->setExpiredTime(0);
    callback(resp);
}
```

> 以上代码可由 `drogon_ctl create controller TestCtrl` 自动生成框架，只需填写业务逻辑。

### 4.4 RESTful API（HttpController）

```cpp
/// User.h
#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

namespace api::v1 {

class User : public drogon::HttpController<User> {
public:
    METHOD_LIST_BEGIN
    METHOD_ADD(User::getInfo,       "/{id}",             Get);
    METHOD_ADD(User::getDetailInfo, "/{id}/detailinfo",  Get);
    METHOD_ADD(User::newUser,       "/{name}",           Post);
    METHOD_LIST_END

    void getInfo(const HttpRequestPtr& req,
                 std::function<void(const HttpResponsePtr&)>&& callback,
                 int userId) const;

    void getDetailInfo(const HttpRequestPtr& req,
                       std::function<void(const HttpResponsePtr&)>&& callback,
                       int userId) const;

    void newUser(const HttpRequestPtr& req,
                 std::function<void(const HttpResponsePtr&)>&& callback,
                 std::string&& userName);
};

} // namespace api::v1
```

路由自动映射为 `/api/v1/User/{id}`、`/api/v1/User/{id}/detailinfo` 等。

### 4.5 C++20 协程风格（co_await）

```cpp
Task<HttpResponsePtr> getUser(HttpRequestPtr req, int userId) {
    auto db = app().getDbClient();
    auto result = co_await db->execSqlCoro(
        "SELECT * FROM users WHERE id=$1", userId
    );
    Json::Value json;
    if (result.size() > 0) {
        json["name"] = result[0]["name"].as<std::string>();
    }
    co_return HttpResponse::newHttpJsonResponse(json);
}
```

---

## 五、数据库支持

### 5.1 支持的数据库

| 数据库 | I/O 模式 | 备注 |
|---|---|---|
| PostgreSQL | 异步非阻塞 | 基于 libpq 异步接口 |
| MySQL / MariaDB | 异步非阻塞 | |
| SQLite3 | 基于线程池的异步 | |
| Redis | 异步非阻塞 | |

### 5.2 ORM 使用示例

```bash
# 从数据库自动生成 ORM 模型类
drogon_ctl create model ./models
```

生成后可直接使用对象操作数据库：

```cpp
// 查询
auto mapper = Mapper<User>(db);
auto user = co_await mapper.findByPrimaryKey(1);

// 插入
User newUser;
newUser.setName("Alice");
newUser.setEmail("alice@example.com");
co_await mapper.insert(newUser);
```

---

## 六、过滤器（Filter）

过滤器用于在请求到达控制器之前执行统一逻辑，如登录验证、权限检查等。

```cpp
/// LoginFilter.h
#pragma once
#include <drogon/HttpFilter.h>
using namespace drogon;

class LoginFilter : public HttpFilter<LoginFilter> {
public:
    void doFilter(const HttpRequestPtr& req,
                  FilterCallback&& fcb,
                  FilterChainCallback&& fccb) override;
};

/// LoginFilter.cc
void LoginFilter::doFilter(const HttpRequestPtr& req,
                           FilterCallback&& fcb,
                           FilterChainCallback&& fccb) {
    if (req->getCookie("token").empty()) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        fcb(resp);  // 拦截请求
    } else {
        fccb();     // 放行，继续执行下一个过滤器或控制器
    }
}
```

在路由注册时绑定过滤器：

```cpp
PATH_ADD("/admin", Get, "LoginFilter");
```

---

## 七、WebSocket 支持

```cpp
/// WsCtrl.h
#pragma once
#include <drogon/WebSocketController.h>
using namespace drogon;

class WsCtrl : public WebSocketController<WsCtrl> {
public:
    void handleNewMessage(const WebSocketConnectionPtr&,
                          std::string&&,
                          const WebSocketMessageType&) override;
    void handleNewConnection(const HttpRequestPtr&,
                             const WebSocketConnectionPtr&) override;
    void handleConnectionClosed(const WebSocketConnectionPtr&) override;

    WS_PATH_LIST_BEGIN
    WS_PATH_ADD("/ws");
    WS_PATH_LIST_END
};
```

---

## 八、命令行工具 drogon_ctl

```bash
# 创建新项目
drogon_ctl create project my_project

# 创建控制器
drogon_ctl create controller UserCtrl
drogon_ctl create controller -r api::v1::User   # RESTful 控制器

# 从数据库生成 ORM 模型
drogon_ctl create model ./models

# 创建过滤器
drogon_ctl create filter LoginFilter

# 创建视图（CSP 模板）
drogon_ctl create view ./views
```

---

## 九、配置文件

Drogon 支持 JSON 和 YAML 两种格式的配置文件：

```json
{
    "listeners": [
        {
            "address": "0.0.0.0",
            "port": 80,
            "https": false
        }
    ],
    "thread_num": 16,
    "log": {
        "log_path": "./",
        "log_level": "WARN"
    },
    "db_clients": [
        {
            "name": "default",
            "rdbms": "postgresql",
            "host": "127.0.0.1",
            "port": 5432,
            "dbname": "mydb",
            "user": "postgres",
            "passwd": "",
            "connection_number": 10
        }
    ]
}
```

---

## 十、构建与集成

### 10.1 从源码构建

```bash
git clone https://github.com/drogonframework/drogon
cd drogon
git submodule update --init
mkdir build && cd build
cmake ..
make -j4
sudo make install
```

### 10.2 CMake 集成

```cmake
find_package(Drogon CONFIG REQUIRED)

add_executable(my_app main.cpp)
target_link_libraries(my_app PRIVATE Drogon::Drogon)
```

### 10.3 构建选项

| 选项 | 说明 | 默认值 |
|---|---|---|
| `BUILD_CTL` | 构建 drogon_ctl 工具 | ON |
| `BUILD_EXAMPLES` | 构建示例程序 | ON |
| `BUILD_ORM` | 构建 ORM | ON |
| `BUILD_SHARED_LIBS` | 构建为动态库 | OFF |
| `BUILD_BROTLI` | 构建 Brotli 压缩支持 | ON |
| `BUILD_YAML_CONFIG` | 支持 YAML 配置文件 | ON |
| `COZ_PROFILING` | 使用 coz 进行性能分析 | OFF |

### 10.4 Conan 集成

```bash
conan install drogon/1.9.12@
```

---

## 十一、与其他框架对比

| 维度 | Drogon | userver | Seastar | Workflow |
|---|---|---|---|---|
| 语言 | C++ | C++ | C++ | C++ |
| 定位 | Web 应用框架 | 微服务框架 | 基础设施框架 | 任务流引擎 |
| 异步模型 | 回调 + C++20 协程 | 有栈协程 | Future/Promise | 回调 + DAG |
| 内置 ORM | 有 | 无 | 无 | 无 |
| 内置路由 | 有 | 有 | 无 | 无 |
| 视图模板 | 有（CSP） | 无 | 无 | 无 |
| 数据库支持 | PG/MySQL/SQLite/Redis | 极丰富 | 无内置驱动 | HTTP/Redis/MySQL |
| 开发体验 | 接近 Spring/Django | 接近普通 C++ | Future 链 | 回调编排 |
| 适用场景 | Web API / 网站后端 | C++ 微服务 | 数据库/存储 | 搜索/流水线 |

---

## 十二、适用场景与局限

### 适合使用 Drogon 的场景

- 需要用 C++ 构建高性能 Web API 或网站后端
- 对开发效率有要求，希望有完整的 Web 开发工具链（ORM、路由、模板、过滤器）
- 需要极低延迟的 HTTP 服务，但不想从零搭建框架
- 需要跨平台（Linux/macOS/Windows）的 Web 服务

### 局限与注意事项

- 定位是 Web 框架，不适合构建非 HTTP 的底层基础设施
- 服务治理能力（动态配置、分布式锁、metrics）需自行集成
- 社区规模中等，文档以英文和中文为主

---

## 十三、学习资源

| 资源 | 地址 |
|---|---|
| GitHub 仓库 | https://github.com/drogonframework/drogon |
| 官方 Wiki | https://github.com/drogonframework/drogon/wiki |
| TFB 基准测试 | https://www.techempower.com/benchmarks/ |
| Telegram 群组 | https://t.me/joinchat/_mMNGv0748ZkMDAx |
| Discord | https://discord.gg/drogon |
