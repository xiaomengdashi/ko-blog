---
sidebar_position: 3
slug: /C++/项目实战/C-从零实现一个在线编译器_c-在线编译器
---

---
title: '[C++] 从零实现一个在线编译器_c++在线编译器-CSDN博客'
date: '2024-12-23 23:02:33'
updated: '2024-12-23 23:35:55'
slug: /C++/项目实战/C-从零实现一个在线编译器_c-在线编译器
![](/img/posts/58b94fb209f3db8040e7719d68e1996f.gif)

### 1. 前言
身为一名[程序员](https://so.csdn.net/so/search?q=%E7%A8%8B%E5%BA%8F%E5%91%98&spm=1001.2101.3001.7020)，想必大家都有接触过像leetcode这样的[刷题网站](https://so.csdn.net/so/search?q=%E5%88%B7%E9%A2%98%E7%BD%91%E7%AB%99&spm=1001.2101.3001.7020)，不知你们在刷题的过程中是否思考过一个问题：它们是如何实现在线编译运行的功能。如果你对此感到好奇，那么本文将一步步带你来实现一个简易在线编译器。

### 2. 项目概述
项目的基本逻辑：前端用户在网页上输入代码与参数，后端通过多进程的方式来编译运行代码，然后将标准输出、标准错误信息返回给前端页面。

**前后端交互数据格式**

```cpp
// 前端发送
{
    "code": "代码",
        "cpu_limit": "CPU限制",
        "mem_limit": "内存限制"
        }

// 后端发送
{
    "reason": "错误原因",
        "status": "状态码",
        "stderr": "错误输出",
        "stdout": "标准输出"
        }
```

**使用的第三方库**

**后端：**

+ **cpp-httplib**：用于处理HTTP请求和响应。
+ **jsoncpp**：用于解析和生成JSON数据。
+ **spdlog**：用于日志记录。

**前端：**

+ **jquery**：简化JavaScript操作，方便进行DOM操作和Ajax请求。
+ **ace**：提供代码编辑器功能，支持语法高亮和代码自动完成。

### 3. 运行效果
![](/img/posts/d9113e33f34ba934ed2e2a33cef3bc57.png)

### 4. 具体实现
#### 4.1. 后端逻辑
后端分为编译模块和运行模块，均使用多进程的方式来运行，并根据用户所选语言的语言来选择不同的编译器和运行方式。后端代码分为四部分：公共模块（工具类）、编译模块、运行模块、编译运行模块（整合编译与运行）。

##### 4.1.1. 公共模块
**日记类**

日记系统对spdlog进行了最低程度的封装，实现了单例日记系统，并定义宏来简化其使用。

```cpp
//
// Created by lang liu on 24-4-23.
//

#pragma once

#ifdef DEBUG
#define SPDLOG_ACTIVE_LEVEL SPDLOG_LEVEL_DEBUG
#endif

#include `<spdlog/spdlog.h>`
#include `<spdlog/sinks/stdout_color_sinks.h>`

namespace ns_log {
    //TODO 初始化日记 完善
    class Log {
    public:
    static Log &getInstance() {
        std::call_once(_flag, []() {
            _instance = new Log();
        });
        return *_instance;
    }

    auto getLogger()
    ->``std::`shared_ptr`<spdlog::logger>`
    {
        return _logger;
    }

    private:
    Log() {
        _logger = spdlog::stdout_color_mt("nil");
        _logger->set_level(spdlog::level::debug);
        _logger->set_pattern("[%^%l%$] [%Y-%m-%d %H:%M:%S] [%t] [%s:%#] %v");
    }

    ~Log() {
        spdlog::drop_all();
    }

    private:
    static std::once_flag _flag;
    static Log *_instance;

    ``std::`shared_ptr`<spdlog::logger>` _logger;
};

    std::once_flag Log::_flag;
    Log *Log::_instance = nullptr;


    #define LOG_DEBUG(...)    SPDLOG_LOGGER_DEBUG(Log::getInstance().getLogger(), __VA_ARGS__)
    #define LOG_INFO(...)     SPDLOG_LOGGER_INFO(Log::getInstance().getLogger(), __VA_ARGS__)
    #define LOG_WARN(...)     SPDLOG_LOGGER_WARN(Log::getInstance().getLogger(), __VA_ARGS__)
    #define LOG_ERROR(...)    SPDLOG_LOGGER_ERROR(Log::getInstance().getLogger(), __VA_ARGS__)
    #define LOG_CRITICAL(...) SPDLOG_LOGGER_CRITICAL(Log::getInstance().getLogger(), __VA_ARGS__)
}


// #else
//[x] 无spdlog
// #include `<iostream>`
// #include `<format>`
// #include "util.hpp"

// namespace ns_log {

//     using namespace ns_util;

//     enum {
//         INFO,
//         DEBUG,
//         WARN,
//         ERROR,
//         CRITICAL
//     };

//     inline std::ostream &Log(const std::string &level, const std::string &str) {
//         std::string msg = std::format("[{}] [{}] [{}:{}] {}", level, TimeUtil::GetTimeStamp(), __FILE__, __LINE__,
//                                       str);
//         // auto ret = __FILE_NAME__;
//         return std::cout `<< msg;
//     }

// #define LOG_INFO(...)     Log("INFO", __VA_ARGS__)
// #define LOG_DEBUG(...)    Log("DEBUG", __VA_ARGS__)
// #define LOG_WARN(...)     Log("WARN", __VA_ARGS__)
// #define LOG_ERROR(...)    Log("ERROR", __VA_ARGS__)
// #define LOG_CRITICAL(...) Log("CRITICAL", __VA_ARGS__)

// }

// #endif
```

**工具类**

工具类分为时间工具、文件工具、路径工具。

**时间工具**：时间工具类用于生成时间戳，辅助文件工具生成唯一的文件名（UUID）。

**文件工具**：用于实现读写、创建、删除文件。

**路径工具**：用于更改文件的后缀。

```cpp
//
// Created by lang liu on 24-4-23.
//

#ifndef OJ_UTIL_HPP
#define OJ_UTIL_HPP

#include "log.hpp"
#include <sys/time.h>`
#include `<sys/stat.h>`
#include `<fstream>`
#include `<atomic>`
#include `<unordered_map>`
#include `<filesystem>`
#include `<vector>`

namespace ns_util
{
    using namespace ns_log;

    // 定义文件后缀名的映射表
    static inline `std::`unordered_map`<std::string, std::string>` suffixTable {
    {"c_cpp", ".cc"},
    {"csharp", ".cs"},
    {"python", ".py"},
    {"javascript", ".js"}
};

    // 定义可执行文件后缀名的映射表
    static inline `std::`unordered_map`<std::string, std::string>` excuteTable {
    {"c_cpp", ".exe"},
    {"csharp", ".cs"},
    {"javascript", ".js"},
    {"python", ".py"}
};

    // 时间工具类
    class TimeUtil
    {
    public:
    // 获取时间戳（秒）
    static std::string GetTimeStamp()
    {
        struct timeval _tv{};
        gettimeofday(&_tv, nullptr);    // 获取时间戳
        return std::to_string(_tv.tv_sec);
    }

    // 获取时间戳（毫秒），用于生成随机文件名
    static std::string GetTimeNs()
    {
        struct timeval _tv{};
        gettimeofday(&_tv, nullptr);
        return std::to_string(_tv.tv_sec * 1000 + _tv.tv_usec / 1000);
    }
};

    // 文件路径和后缀名变量
    static std::string path;
    static std::string srcSuffix;
    static std::string excuteSuffix;
    static const std::string temp_path = "./template/";

    // 路径工具类
    class PathUtil
    {
    public:
    // 初始化模板路径和后缀名
    static void InitTemplate(const std::string& lang) {
        path = temp_path + lang + "/";
        srcSuffix = suffixTable.at(lang);
        excuteSuffix = excuteTable.at(lang);
    }

    // 添加后缀名到文件名
    static std::string AddSuffix(const std::string &file_name, const std::string& suffix)
    {
        std::string path_name = path;
        path_name += file_name;
        path_name += suffix;
        return path_name;
    }

    // 获取源文件路径
    static std::string Src(const std::string& file_name)
    {
        return AddSuffix(file_name, srcSuffix);
    }

    // 获取可执行文件路径
    static std::string Exe(const std::string& file_name)
    {
        return AddSuffix(file_name, excuteSuffix);
    }

    // 获取编译错误文件路径
    static std::string CompilerError(const std::string& file_name)
    {
        return AddSuffix(file_name, ".compile_error");
    }

    // 获取标准输入文件路径
    static std::string Stdin(const std::string& file_name)
    {
        return AddSuffix(file_name, ".stdin");
    }

    // 获取标准输出文件路径
    static std::string Stdout(const std::string& file_name)
    {
        return AddSuffix(file_name, ".stdout");
    }

    // 获取标准错误文件路径
    static std::string Stderr(const std::string& file_name)
    {
        return AddSuffix(file_name, ".stderr");
    }
};

    // 文件工具类
    class FileUtil
    {
    public:
    // 移除文件夹中的所有文件（递归）
        static void RemoveAllFile(const std::string& dir) {
            ``std::`vector`<std::filesystem::path>` removeArray;

            try {
                for(auto& it : std::filesystem::directory_iterator(dir)) {
                    if(std::filesystem::is_regular_file(it.path()))
                        removeArray.push_back(it.path());
                    else if (std::filesystem::is_directory(it.path()))
                        RemoveAllFile(it.path().string());
                }

                for(auto& it : removeArray) {
                    std::filesystem::remove(it);
                }
            }
            catch (const std::filesystem::filesystem_error& e) {
                LOG_ERROR("移除全部文件失败: {}", e.what());
            }
        }

        // 移除指定文件
        static void RemoveFile(const std::string& filename) {
            if(std::filesystem::exists(filename)) {
                std::filesystem::remove(filename);
            }
        }

        // 检查文件是否存在
        static bool IsFileExists(const std::string & path_name)
        {
            struct stat st = {};
            if(stat(path_name.c_str(), &st) == 0)
                return true;

            return false;
        }

        // 生成全局唯一的文件名
        static std::string UniqFileName()
        {
            static std::atomic_uint id(0);
            ++id;
            std::string ms = TimeUtil::GetTimeNs();
            std::string uniq_id = std::to_string(id);
            return ms + uniq_id;
        }

        // 将内容写入文件
        static bool WriteFile(const std::string & path_name, const std::string & content)
        {
            std::ofstream out(path_name);
            if(!out.is_open())
            {
                LOG_ERROR("write file failed!");
                return false;
            }
            out.write(content.c_str(), (int)content.size());
            out.close();
            return true;
        }

        // 读取文件内容
        static bool ReadFile(const std::string& path_name, std::string* content)
        {
            content->clear();

            std::ifstream in(path_name);
            if(!in.is_open())
            {
                LOG_ERROR("read file({}) failed!", path_name.c_str());
                return false;
            }
            in.seekg(0, std::ios::end);
            auto size = in.tellg(); // 获取文件大小
            in.seekg(0, std::ios::beg);

            content->resize(size);
            in.read(content->data(), size);

            return true;
        }
    };

};

#endif //OJ_UTIL_HPP
```

##### 4.1.2. 译模块
编译模块因为其大部分代码都是相似的，所以这里将其具体执行逻辑分离开来，并使用工厂模式决定实例化不同的类。

**编译模块**

```cpp
#pragma once

#include `<unistd.h>`
#include `<sys/fcntl.h>`

#include "log.hpp"
#include "util.hpp"

namespace ns_compiler {
    using namespace ns_log;
    using namespace ns_util;

    // 编译器基类
    class Compiler {
    public:
    virtual ~Compiler() = default;

    // 编译函数，接受文件名作为参数
    int Compile(const std::string& file_name) {
        // 打开标准错误和标准输出文件
        int _stderr = open(PathUtil::Stderr(file_name).c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0644);
        int _stdout = open(PathUtil::Stdout(file_name).c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0644);

        // 检查文件是否成功打开
        if(_stderr < 0 || _stdout < 0) {
            LOG_ERROR("打开文件失败");
            return -1;
        }

        // 创建子进程进行编译
        pid_t pid = fork();
        if(pid < 0 ) {
            LOG_ERROR("线程创建失败: {}", strerror(errno));
            return -1;
        }
        else if(pid == 0) {
            // 子进程
            umask(0); // 重置文件掩码

            // 重定向标准错误和标准输出到文件
            dup2(_stderr, STDERR_FILENO);
            dup2(_stdout, STDOUT_FILENO);

            // 执行编译命令
            Execute(file_name);
            LOG_INFO("exec错误：{}", strerror(errno));
            return -1; // exec 出错
        }

        // 父进程等待子进程结束
        waitpid(pid, nullptr, 0);

        // 检查编译后的可执行文件是否存在
        if(!FileUtil::IsFileExists(PathUtil::Exe(file_name))) {
            LOG_INFO("文件编译失败");
            return -2;
        }
        return 0; // 编译成功
    }

    protected:
    // 执行具体编译命令的纯虚函数，需由子类实现
    virtual void Execute(const std::string& filename) = 0;
};

    // C++ 编译器类，继承自 Compiler
    class CppCompiler : public Compiler {
    protected:
    // 执行 g++ 编译命令
    void Execute(const std::string& filename) override {
        execlp("g++", "g++", "-o", PathUtil::Exe(filename).c_str(),
            PathUtil::Src(filename).c_str(), nullptr);
    }
};

    // 编译器工厂类，用于创建编译器对象
    class CompilerFactory {
    public:
    // 根据语言创建相应的编译器对象
    static ``std::`unique_ptr`<Compiler>` CreateCompiler(const std::string& lang) {
        if(lang == "c_cpp")
            return `std::`make_unique`<CppCompiler>`();
            // 如果需要支持其他语言，可以在这里添加相应的编译器创建逻辑
        else
            return {};
    }
};
}
```

##### 4.1.3. 运行模块
运行模块与编译模块的逻辑其实相差不大。

```cpp
#pragma once

#include "compiler.hpp"
#include `<iostream>`
#include `<sys/resource.h>`
#include `<sys/wait.h>`

using namespace ns_log;
using namespace ns_util;

// Runner 基类，负责运行已编译的程序
class Runner {
public:
// 运行指定的程序文件，并限制其 CPU 和内存使用
int Run(const std::string& filename, const int cpu_limit, const int mem_limit) {
    // 获取输入、输出和错误文件路径
    std::string _execute = PathUtil::Exe(filename);
    std::string _stdin = PathUtil::Stdin(filename);
    std::string _stdout = PathUtil::Stdout(filename);
    std::string _stderr = PathUtil::Stderr(filename);

    umask(0); // 重置文件掩码
    // 打开标准输入、输出和错误文件
    int stdin_fd = open(_stdin.c_str(), O_CREAT | O_WRONLY, 0644);
    int stdout_fd = open(_stdout.c_str(), O_CREAT | O_WRONLY, 0644);
    int stderr_fd = open(_stderr.c_str(), O_CREAT | O_WRONLY, 0644);

    // 创建子进程以执行程序
    pid_t pid = fork();
    if(pid < 0) {
        LOG_ERROR("fork error");
        close(stdin_fd);
        close(stdout_fd);
        close(stderr_fd);
        return -1;
    }
    else if(pid == 0) {
        // 子进程
        dup2(stdin_fd, STDIN_FILENO); // 重定向标准输入到文件
        dup2(stdout_fd, STDOUT_FILENO); // 重定向标准输出到文件
        dup2(stderr_fd, STDERR_FILENO); // 重定向标准错误到文件

        signal(SIGXCPU, [](int sig) { // 处理超时信号
            std::cerr `<< "timeout" << std::endl;
        });

        SetProcLimit(mem_limit, cpu_limit); // 设置进程资源限制
        Excute(_execute); // 执行具体的程序
        LOG_ERROR("execute error");
        exit(-1); // exec 出错
    }

    // 父进程等待子进程完成
    int status;
    waitpid(pid, &status, 0);
    close(stderr_fd);
    close(stdout_fd);
    close(stdin_fd);

    return WEXITSTATUS(status); // 返回子进程的退出状态
}

virtual ~Runner() = default;

protected:
// 纯虚函数，由子类实现具体的执行逻辑
virtual void Excute(const std::string& filename) = 0;

// 设置进程的内存和 CPU 使用限制
static void SetProcLimit(const int m_limit, const int c_limit) {
    rlimit memLimit{};
    memLimit.rlim_cur = m_limit * 1024; // 内存限制（KB 转换为字节）
    memLimit.rlim_max = RLIM_INFINITY; // 最大内存限制
    setrlimit(RLIMIT_AS, &memLimit);

    rlimit cpuLimit{};
    cpuLimit.rlim_cur = c_limit; // CPU 时间限制（秒）
    cpuLimit.rlim_max = RLIM_INFINITY; // 最大 CPU 时间限制
    setrlimit(RLIMIT_CPU, &cpuLimit);
}
};

// C++ 运行器类，继承自 Runner
class CppRunner : public Runner {
protected:
// 使用 execlp 执行编译后的 C++ 程序
void Excute(const std::string& exec) override {
    execlp(exec.c_str(), exec.c_str(), nullptr);
}
};

// C# 运行器类，继承自 Runner
class CsharpRunner : public Runner {
protected:
// 使用 execlp 执行 C# 程序
void Excute(const std::string &filename) override {
    execlp("dotnet", "dotnet", "run",  filename.c_str(), "--project", path.c_str(), nullptr);
}
};

// JavaScript 运行器类，继承自 Runner
class JsRunner : public Runner {
protected:
// 使用 execlp 执行 JavaScript 程序
void Excute(const std::string &filename) override {
        execlp("node", "node", filename.c_str(), nullptr);
    }
};

// Python 运行器类，继承自 Runner
class PyRunner : public Runner {
protected:
    // 使用 execlp 执行 Python 程序
    void Excute(const std::string &filename) override {
        execlp("python3", "python3", filename.c_str(), nullptr);
    }
};

// 运行器工厂类，用于创建运行器对象
class RunnerFactory {
public:
    // 根据语言创建相应的运行器对象
    static`std::unique_ptr<Runner>`CreateRunner(const std::string& language) {
        if(language == "c_cpp")
            return `std::`make_unique`<CppRunner>`();
        else if (language == "csharp")
            return `std::`make_unique`<CsharpRunner>`();
        else if(language == "python")
            return `std::`make_unique`<PyRunner>`();
        else
            return `std::`make_unique`<JsRunner>`();
    }
};
```

##### 4.1.4. 译运行模块
编译运行模块是编译模块与运行模块的整合，用于解析前端发送的信息，并编译运行，最后将结果返回给前端网页。

```cpp
#pragma once

#include "runner.hpp"
#include "compiler.hpp"
#include "util.hpp"
#include `<json/json.h>`

using namespace ns_log;
using namespace ns_util;
using namespace ns_compiler;

// json 输入格式
// code: 代码
// language: 编译器
// cpu_limit: CPU 限制
// mem_limit: 内存限制

// json 输出格式
// reason: 错误原因
// status: 状态码
// stderr: 错误输出
// stdout: 标准输出

class CompileAndRun
{
private:
// 将状态码转换为描述信息
static std::string codeToDesc(int status) {
    static `std::`unordered_map`<int, std::string>` errTable = {
    {-1, "未知错误"},
    {-2, "编译错误"},
    {0, "运行成功"},
    // 更多状态码描述
};
    return errTable[status];
}

public:
// 编译并运行
static void Start(std::string& in_json, std::string* out_json)
{
    // 转换 JSON 格式
    Json::Value in_value;
    Json::Value out_value;
    Json::Reader reader;

    if (!reader.parse(in_json, in_value))
    {
        LOG_ERROR("CompileAndRun::Start parse json error");
        return;
    }

    // 记录输入的 JSON 数据
    Json::StyledWriter styledWriter;
    LOG_DEBUG("in_value: {}", styledWriter.write(in_value));

    // 从 JSON 中提取参数
    std::string code = in_value["code"].asString();
    int cpu_limit = in_value["cpu_limit"].asInt();
    int mem_limit = in_value["mem_limit"].asInt();
    std::string lang = in_value["language"].asString();

    int status_code = 0;

    // 初始化模板路径和后缀名
    PathUtil::InitTemplate(lang);
    std::string file_name = FileUtil::UniqFileName(); // 生成唯一文件名

    // 创建编译器和运行器对象
    auto Cp = CompilerFactory::CreateCompiler(lang);
    auto Rn = RunnerFactory::CreateRunner(lang);

    if(code.empty())
    {
        // 如果代码为空，记录错误并设置状态码
        LOG_ERROR("CompileAndRun::Start code is empty");
        status_code = -1;
        goto END;
    }

    // 将代码写入文件
    if(!FileUtil::WriteFile(PathUtil::Src(file_name), code))
    {
        status_code = -1; // 其他错误
        goto END;
    }

    // 编译代码
    if(Cp)
    {
        if(Cp->Compile(file_name) < 0) {
            status_code = -2; // 编译错误
            goto END;
        }
    }

    // 运行编译后的程序
    status_code = Rn->Run(file_name, cpu_limit, mem_limit);
    if(status_code < 0)
    {
        status_code = -1; // 未知错误
        goto END;
    }
    else if(status_code > 0)
    {
        goto END;
    }

    END:
    // 构建输出 JSON 数据
    out_value["status"] = status_code;
    out_value["reason"] = codeToDesc(status_code);
    if(status_code == 0)
    {
        std::string _stdout;
        FileUtil::ReadFile(PathUtil::Stdout(file_name), &_stdout); // 读取标准输出
        out_value["stdout"] = _stdout;
    }
    else
    {
        std::string _stderr;
        FileUtil::ReadFile(PathUtil::Stderr(file_name), &_stderr); // 读取错误输出
        out_value["stderr"] = _stderr;
        }

        Json::StyledWriter writer;
        *out_json = writer.write(out_value); // 将结果写入输出 JSON
        LOG_DEBUG("out_json: {}", *out_json);

        // 清理生成的文件
        RemoveFile(file_name);
    }

private:
    // 移除生成的文件
    static void RemoveFile(const std::string& filename) {
        auto filepath = path + filename;
        auto filesrc = filepath + srcSuffix;
        auto fileexe = filepath + excuteSuffix;

        auto fileout = PathUtil::Stderr(filename);
        auto filein = PathUtil::Stdin(filename);
        auto fileerr = PathUtil::Stdout(filename);

        FileUtil::RemoveFile(filesrc);
        FileUtil::RemoveFile(fileexe);
        FileUtil::RemoveFile(fileout);
        FileUtil::RemoveFile(filein);
        FileUtil::RemoveFile(fileerr);
    }
};
```

**程序入口**

```cpp
#include "compile_run.hpp"
#include `<httplib.h>`


int main()
{
    using namespace httplib;
    using namespace ns_util;



    // system("pwd");

    Server svr;

    svr.set_base_dir("./wwwroot");

    svr.Post("/run", [](const Request & req, Response &res) {
        std::string in_json = req.body;
        std::string out_json;
        CompileAndRun::Start(in_json, &out_json);
        res.set_content(out_json, "application/json");
    });

    // 启动服务器

    svr.listen("0.0.0.0", 8080);

    return 0;
}
```

### 5. 总结
这个简易在线编译器只是我用于学习多进程应用与前后端交互而写的超微小项目，不算上前端网页只有500行代码左右。虽然还有很多设计不完善的地方，但凭我现在的水平也暂时想不到更好的解决方案，有什么不足的地方，欢迎讨论。

github：[完整代码](https://github.com/cyclesw/SimpleOnlineCompiler)

![](/img/posts/88fd8ed0dde39c6528ac667ae6405731.gif)  


> 来自: [【C++项目】从零实现一个在线编译器_c++在线编译器-CSDN博客](https://blog.csdn.net/CaTianRi/article/details/140299962)
>

