---
sidebar_position: 1
slug: /其它/gRPC
---

Google gRPC（Google Remote Procedure Call）是一个高性能、开源的远程过程调用框架，它允许客户端直接调用远程服务器上的方法，就像调用本地方法一样，屏蔽了网络通信的复杂性。

![](/img/posts/a63ceeae6b17b39bffb59784c24c8345.png)

**假设**：我们有这样一个包含客户端和服务端的程序，客户端要为用户提供天气查询服务。客户端会向服务端发送一个请求，服务端执行某个函数，返回天气数据。在这个过程中，客户端为用户提供服务，可以理解为客户端通过调用了服务端的某个函数来完成，这就是远程函数调用（远程过程调用）。

![](/img/posts/eb8492b7d14e6aa0486d71bf683e9cb2.png)

要实现远程调用，我们得编写网络通信相关的代码，以及相关调用参数信息的封装。这就带来两个问题：

+ 数据封装：客户端和服务端的运行环境不同，为了能够实现客户端和服务端高效、正确的传输、解析数据，得需要一种方式来对传输的数据进行封装，常用的数据格式是：XML、JSON。但是这两种格式传输、解析的效率较低。
+ 我们得自行维护网络通信部分的内容，比如：建立网络连接、发送数据、接受数据、关闭连接等等

这对于开发者而言，就有些复杂。而 gRPC 则是将网络通信部分、数据封装（使用 protobuf）部分进行了实现，使得我们不需要关注这些繁杂的中间过程，简化了远程过程调用的实现。

Doc：[https://grpc.io/docs/](https://grpc.io/docs/)， [https://grpc.org.cn/docs/](https://grpc.org.cn/docs/languages/cpp/quickstart/)

## 1. 编译安装
从 GitHub 下载 gRPC 以及子模块：

:::info
git clone --recurse-submodules -b v1.68.0 --depth 1 --shallow-submodules https://github.com/grpc/grpc

:::

进行如下两项配置，否则在配置、生成项目时会出现警告。

```plain
CMake Warning at cmake/ssl.cmake:37 (message):
  Disabling SSL assembly support because NASM could not be found
Call Stack (most recent call first):
  CMakeLists.txt:385 (include)


# gRPC 的依赖库编译时，会使用到汇编编译器 nasm.exe，我们可以预先配置 
# 从 https://www.nasm.us/pub/nasm/releasebuilds/2.16.03/win64/ 下载 nasm-2.16.03-win64.zip
# 解压 nasm-2.16.03-win64.zip
# 将 nasm.exe 所在目录添加到 PATH 环境变量
# 将 nasm.exe 所在目录添加到 CMAKE_ASM_NASM_COMPILER 环境变量
```

```plain
CMake Deprecation Warning at third_party/cares/cares/CMakeLists.txt:1 (CMAKE_MINIMUM_REQUIRED):
  Compatibility with CMake < 3.5 will be removed from a future version of
  CMake.

  Update the VERSION argument <min> value or use a ...<max> suffix to tell
  CMake that the project does not need compatibility with older versions.


# 修改默认配置使用的 cmake 版本要求
# 打开源码中 third_party/cares/cares/CMakeLists.txt 文件
# 查看自己使用的是 cmake 是 3.29.5 版本
# 将第一行 CMAKE_MINIMUM_REQUIRED (VERSION 3.1.0) 修改为 CMAKE_MINIMUM_REQUIRED (VERSION 3.29.5)
```

使用 cmake 打开项目，按照下图进行配置：

![](/img/posts/5ed0f4499596e9fe07c3f725dafa24c6.png)

![](/img/posts/f285a352cb46be26e2cd74f02501cc8c.png)

点击 Configure、Generate 生成 Visual Studio 库项目。使用 Visual Studio 2022 打开生成的 gRPC 库项目，并进行编译，在我的电脑上编译过程大概耗时 20 分钟。

![](/img/posts/8a32e71fbfe1ce4aa2c78225b9e965bc.png)

编译完成之后，用**管理员权限打开终端**，cd 到 build 目录下，执行下面的命令，执行 grpc 安装：

cmake --install .

我们所需要的 protoc 编译器、用于生成 gRPC cpp 代码的插件，开发需要的头文件、静态库文件都会拷贝到先前配置的 CMAKE_INSTALL_PREFIX 指定的 C:\Users\china\Desktop\grpc\install 目录。

最后，将 bin 目录配置到系统环境变量 PATH 中，完成安装。

**注意：编译之后的文件在右侧的百度网盘中。**

## 2. 使用示例
一个 gRPC 程序包含服务端、客户端程序，各自承担不同的角色：

+ 服务端是 gRPC 程序中的核心部分，它提供了各种服务，并处理来自客户端的请求。
+ 客户端是与服务端进行交互的程序，向服务端发起请求并接收响应。

```protobuf
syntax = "proto3";

service Greeter 
{
  rpc sayHello (Request) returns (Response) {}
}

message Request 
{
  string name = 1;
  int32 age = 2;
}

message Response 
{
  string message = 1;
}
```

```bash
# 生成 RPC 相关代码
where grpc_cpp_plugin

protoc --cpp_out=. --grpc_out=. --plugin=protoc-gen-grpc="C:\Users\china\Desktop\grpc\install\bin\grpc_cpp_plugin.exe" greeter.proto
```

## 2.1 服务端
服务端核心的程序代码包含：

+ 服务类实现、注册
+ 服务器构建、启动

```cpp
#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <cstdio>
#include "greeter.grpc.pb.h"
#include "grpcpp/grpcpp.h"



class MyGreeterService : public Greeter::Service
{
public:
	virtual grpc::Status sayHello(::grpc::ServerContext* context, const ::Request* request, ::Response* response)
	{
		std::cout << "Name:" << request->name() << " Age:" << request->age() << std::endl;
		std::ostringstream message;
		message << "SayHello Name:" << request->name() << " Age:" << request->age();
		response->set_message(message.str());

		return grpc::Status::OK;
	}
};

void runServer()
{
	// 设置服务器参数
	grpc::ServerBuilder builder;
	// 设置网络参数
	builder.AddListeningPort("0.0.0.0:50052", grpc::InsecureServerCredentials());
	// 设置服务函数
	MyGreeterService service;
	builder.RegisterService(&service);

	// 创建服务器
	`std::unique_ptr<grpc::Server>` server = builder.BuildAndStart();
	server->Wait();
}


int main()
{
	runServer();
	return 0;
}
```

## 2.2 客户端
客户端的核心程序代码包含：

+ 连接服务端
+ 调用服务函数

```cpp
#include <iostream>
#include "grpcpp/grpcpp.h"
#include "greeter.grpc.pb.h"


void runClient()
{	
	// 构建远程连接通道
	`std::shared_ptr<grpc::Channel>` channel = grpc::CreateChannel("127.0.0.1:50052", grpc::InsecureChannelCredentials());
	// 创建远程调用代理
	`std::unique_ptr< Greeter::Stub>` stub = Greeter::NewStub(channel);

	// 传递额外信息
	grpc::ClientContext context;
	
	// 传递调用参数
	Request request;
	request.set_name("张三");
	request.set_age(18);

	// 保存调用结果
	Response result;

	// 远程调用
	grpc::Status status = stub->sayHello(&context, request, &result);

	if (status.ok())
	{
		std::cout << "调用结果:" << result.message() << std::endl;
	}
	else
	{
		std::cerr << "调用错误:" << status.error_code() << std::endl;
	}
}


int main()
{
	runClient();
	return 0;
}
```



参考：

[https://github.com/Gooddbird/rocket](https://github.com/Gooddbird/rocket/blob/main/rocket/common/util.cc)



> 来自: [Google gRPC 编译、安装、使用 - 一亩三分地](https://mengbaoliang.cn/archives/101382/)
>





