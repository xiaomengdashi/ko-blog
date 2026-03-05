---
sidebar_position: 9
slug: /C++/Boost深度剖析/boost使用CMake和MinGW-w64的编译安装-CherryHua-Blog
---

---
title: boost使用CMake和MinGW-w64的编译安装 | CherryHua Blog
date: '2025-03-10 22:59:26'
updated: '2025-03-10 22:59:27'
slug: /C++/Boost深度剖析/boost使用CMake和MinGW-w64的编译安装-CherryHua-Blog
### 1. 1.环境
+ 操作系统: Windows 10
+ Boost 版本: 1.84.0
+ GCC 版本: mingw-x64
+ CMake

#### 1.1. 1.**下载解压 Boost 源码，并解压**
#### 1.2. 2.安装
1. 进入 `tools\build\v2\` 目录(注: 此处**最好查阅一下官方文档**, 如最新 Boost 1.80.0 版本中只进入到 `tools\build\` 目录), **重点是确认当前路径下具有 **`**bootstrap.bat**`**（一定要有） 和 **`**b2.exe**`**（这个文件没有也没关系，新版本可能没有） 两个文件**.
2. 运行**使用 GCC** 运行 `bootstrap.bat` 脚本, **注意要使用 **`**gcc**`** 作为参数**.
3. 运行 `.\b2 install --prefix=PREFIX` 安装 Boost.Build, **其中 **`**PREFIX**`** 是 Boost.Build 的安装路径**, 此处路径为 `D:\ProgTools\boost_1_54_0\boost_build`.

命令：

#### 1.3. bash
**安装成功后, 在 Boost.Build 安装路径下找到 **`**b2.exe**`** 文件: 在 1.54.0 版本是在 **`**bin**`** 目录下; 而在 1.80.0 版本直接在 Boost.Build 的安装目录下.**

#### 1.4. 3.**编译安装 Boost**
在 Boost 的根目录使用以下命令使用 GCC 编译安装 Boost:

#### 1.5. bash
+ `b2` 即上文 Boost.Build 路径下的 `b2.exe` 文件, 此处可以通过完整路径运行, 也可以将其添加到环境变量从而省去路径部分.
+ `-build_dir`: 编译生成的中间文件存放目录, 可以不指定.
+ `toolset`: 编译所用的工具集, 此处**使用 GCC 编译所用要特别指明为 **`**gcc**`.
+ `-build_type`: 构建类型, `complete` 表示构建库的所有支持的编译版本, 包括静态库、动态库、调试版本等

**编译需要一段时间, 完成后, 可以在 **`**stage\lib**`** 目录下看到生成的库文件:**

![](/img/posts/042f71534abb24734d350187e3db1064.png)

### 2. 3.程序使用
#### 2.1. 1.测试代码
#### 2.2. cpp
#### 2.3. 2.CMakeLists.txt
#### 2.4. bash
+ `set(BOOST_ROOT "D:/ProgTools/boost_1_54_0/")`: 指定 Boost 库的根目录. 由于是编译安装的 Boost 库, 因此一般需要该语句, 否则会出现找不到 Boost 库的情况.
+ `find_package(Boost COMPONENTS regex REQUIRED)`: 查找 Boost 库配置, `COMPONENTS` 选项用于指定所使用的具体的 Boost 库名称, 完整指令格式如下:
+ `include_directories(${Boost_INCLUDE_DIRS})`: 包含 Boost 库的头文件目录
+ `target_link_libraries(cppexp ${Boost_LIBRARIES})`: 链接 Boost 库
+ `set(Boost_USE_STATIC_LIBS ON)`: 设置使用 Boost 静态库. **笔者在不使用该语句时会出现运行异常退出的情况**, 如下图所示:
+ `set(Boost_ARCHITECTURE "-x64")`: **指定库架构为 **`**x64**`. 该指令在 1.54.0 版本并不需要, 但**在 1.80.0 则必须加上**, 这是因为 1.80.0 版本生成的**库文件中有 **`**x32**`** 和 **`**x64**`** 的后缀**, 需要用该选项进行指定, 否则会出现找到 Boost 库但找不到具体模块的情况.

![](/img/posts/4a561a8c99e1aa6a96e1fa7661c3ce62.png)

### 3. 4.**MinGW编译Boost库报错处理**
#### 3.1. 1.错误
运行[boost](https://so.csdn.net/so/search?q=boost&spm=1001.2101.3001.7020)编译指令，报错“notice: could not find main target stage

notice: assuming it is a name of file to create.

don’t know how to make stage

…found 1 target…

…can’t find 1 target…”

#### 3.2. 2.解决
要在根路径执行

#### 3.3. plain
#### 3.4. 3.其它
“…found 1 target…”：忽略此类错误也可以执行代码

### 4. 5.参考链接：
  


> 来自: [boost使用CMake和MinGW-w64的编译安装 | CherryHua Blog](https://www.cherrylord.cn/article/post-37)
>

