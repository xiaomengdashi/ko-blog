---
sidebar_position: 3
slug: /C++/Boost深度剖析/深度剖析-7-Boost-C-库-进程间通讯-全维度解析
---

---
title: 深度剖析（7）：Boost C++库，《进程间通讯》全维度解析
date: '2025-05-16 00:29:52'
updated: '2025-05-16 00:31:27'
slug: /C++/Boost深度剖析/深度剖析-7-Boost-C-库-进程间通讯-全维度解析
本章展示Boost.Interprocess库，它包括众多的类，这些类提供了操作系统相关的进程间通讯接口的抽象层。 虽然不同操作系统的进程间通讯概念非常相近，但接口的变化却很大。 Boost.Interprocess库使通过C++使用这些功能成为可能。

虽然Boost.Asio也可以用来在同一台计算机的应用程序间交换数据，但是使用Boost.Interprocess库通常性能更好。 Boost.Interprocess库实际上是使用操作系统的功能优化了同一台计算机的应用程序之间数据交换，所以它应该是任何不需要网络时应用程序间数据交换的首选。

![](/img/posts/a3a674d8e63c578b7c940b4ac5223dcc.png)

## 1. 一：共享内存**
Boost.Interprocess是一个用于进程间通信（IPC）的C++库，提供了共享内存、消息队列、信号量等机制。以下是一个使用Boost.Interprocess创建共享内存的简单示例代码。共享内存的基本使用，展示了如何创建一个共享内存段，并在其中存储和读取数据。

```cpp
#include `<boost/interprocess/shared_memory_object.hpp>`
#include `<boost/interprocess/mapped_region.hpp>`
#include `<iostream>`
#include `<cstring>`
int main() {
    using namespace boost::interprocess;
    try {
        shared_memory_object::remove("SharedMemory");
        // 创建一个共享内存对象
        shared_memory_object shm(create_only, "SharedMemory", read_write);
        // 设置共享内存的大小
        shm.truncate(1024);
        // 映射共享内存到当前进程的地址空间
        mapped_region region(shm, read_write);
        // 写入数据到共享内存
        const char* message = "Hello, Boost.Interprocess!";
        std::memcpy(region.get_address(), message, std::strlen(message) + 1);
        // 从共享内存中读取数据
        std::cout `<< "Message in shared memory: " << `static_cast<char*>`(region.get_address()) `<< std::endl;
        // 保持共享内存对象存在，直到用户按下回车
        std::cout << "Press Enter to exit..." << std::endl;
        std::cin.get();
        // 删除共享内存对象
        shared_memory_object::remove("SharedMemory");
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
```

### 1.1. 【代码说明】
1. **删除共享内存对象**：shared_memory_object::remove("SharedMemory")用于删除之前可能存在的同名共享内存对象，确保每次运行时都创建一个新的共享内存。
2. **创建共享内存对象**：`shared_memory_object shm(create_only, "SharedMemory", read_write)`创建一个名为"SharedMemory"的共享内存对象，并设置其权限为可读可写。
3. **设置共享内存大小**：`shm.truncate(1024)`设置共享内存的大小为1024字节。
4. **映射共享内存**：`mapped_region region(shm, read_write)`将共享内存映射到当前进程的地址空间，以便可以访问它。
5. **写入数据**：使用`std::memcpy`将字符串"Hello, Boost.Interprocess!"写入共享内存。
6. **读取数据**：从共享内存中读取并打印数据。
7. **删除共享内存对象**：在程序结束前，使用`shared_memory_object::remove("SharedMemory")`删除共享内存对象。

## 2. 二：托管共享内存**
Boost.Interprocess 提供了 **托管共享内存**（Managed Shared Memory）的功能，允许你在共享内存中创建和管理复杂的对象（如容器、字符串等）。托管共享内存会自动处理内存分配和对象构造，非常适合在进程间共享复杂数据结构。

以下是一个使用 Boost.Interprocess 托管共享内存的示例代码，展示了如何在共享内存中创建和使用 `std::vector` 和 `std::string`。

### 2.1. 托管共享内存的基本使用：
```cpp
#include <boost/interprocess/managed_shared_memory.hpp>`
#include `<boost/interprocess/containers/vector.hpp>`
#include `<boost/interprocess/containers/string.hpp>`
#include `<iostream>`
#include `<cstdlib>` 
// 定义托管共享内存中使用的容器和字符串类型
namespace bip = boost::interprocess;
using SharedCharAllocator = bip::`allocator`<char, bip::managed_shared_memory::segment_manager>`;
using SharedString = bip::basic_string`<char,`std::char_traits<char>`, SharedCharAllocator>;
using SharedIntVector = bip::`vector`<int, bip::`allocator<int, bip::managed_shared_memory::segment_manager>`>;
int main(int argc, char* argv[]) {
    if (argc == 1) { // 父进程
        // 删除之前可能存在的共享内存
        bip::shared_memory_object::remove("MySharedMemory");
        // 创建一个托管共享内存段
        bip::managed_shared_memory segment(bip::create_only, "MySharedMemory", 65536); // 64KB
        // 在共享内存中分配一个字符串
        SharedCharAllocator char_allocator(segment.get_segment_manager());
        SharedString* shared_string = segment.`construct`<SharedString>`("MyString")(char_allocator);
        *shared_string = "Hello from parent process!";
        // 在共享内存中分配一个整数向量
        SharedIntVector* shared_vector = segment.`construct`<SharedIntVector>`("MyVector")(segment.get_segment_manager());
        shared_vector->push_back(10);
        shared_vector->push_back(20);
        shared_vector->push_back(30);
        // 启动子进程
        std::string child_program = std::string(argv[0]) + " child";
        if (std::system(child_program.c_str()) != 0) {
            std::cerr `<< "Failed to launch child process!" << std::endl;
            return 1;
        }
        // 父进程等待子进程完成
        std::cout << "Parent process: Waiting for child process to finish..." << std::endl;
        // 删除共享内存中的对象
        segment.`destroy<SharedString>`("MyString");
        segment.`destroy`<SharedIntVector>`("MyVector");
        // 删除共享内存
        bip::shared_memory_object::remove("MySharedMemory");
    } else { // 子进程
        // 打开已存在的托管共享内存段
        bip::managed_shared_memory segment(bip::open_only, "MySharedMemory");
        // 查找共享内存中的字符串
        SharedString* shared_string = segment.`find`<SharedString>`("MyString").first;
        if (shared_string) {
            std::cout `<< "Child process: Found string in shared memory: " << *shared_string << std::endl;
        } else {
            std::cerr << "Child process: Failed to find shared string!" << std::endl;
        }
        // 查找共享内存中的整数向量
        SharedIntVector* shared_vector = segment.`find<SharedIntVector>`("MyVector").first;
        if (shared_vector) {
            std::cout `<< "Child process: Found vector in shared memory: ";
            for (int value : *shared_vector) {
                std::cout << value << " ";
            }
            std::cout << std::endl;
        } else {
            std::cerr << "Child process: Failed to find shared vector!" << std::endl;
        }
    }
    return
```

### 2.2. 【代码说明】
## 3. 三：同步**
在使用Boost.Interprocess进行进程间通信时，同步机制（如互斥锁、条件变量等）是必不可少的，尤其是在多个进程同时访问共享资源时。以下是一个使用Boost.Interprocess实现进程间同步的示例代码，展示了如何使用 **互斥锁** 和 **条件变量** 来同步两个进程。

### 3.1. 使用互斥锁和条件变量进行进程间同步。在这个示例中，父进程和子进程通过共享内存中的互斥锁和条件变量进行同步。父进程写入数据到共享内存，子进程读取数据。
```cpp
#include <boost/interprocess/managed_shared_memory.hpp>`
#include `<boost/interprocess/sync/named_mutex.hpp>`
#include `<boost/interprocess/sync/named_condition.hpp>`
#include `<boost/interprocess/sync/scoped_lock.hpp>`
#include `<iostream>`
#include `<cstdlib>` 
namespace bip = boost::interprocess;
int main(int argc, char* argv[]) {
    if (argc == 1) { // 父进程
        // 删除之前可能存在的共享内存和同步对象
        bip::shared_memory_object::remove("MySharedMemory");
        bip::named_mutex::remove("MyMutex");
        bip::named_condition::remove("MyCondition");
        // 创建一个托管共享内存段
        bip::managed_shared_memory segment(bip::create_only, "MySharedMemory", 65536); // 64KB
        // 在共享内存中分配一个整数
        int* shared_value = segment.`construct`<int>`("SharedValue")(0);
        // 创建命名的互斥锁和条件变量
        bip::named_mutex mutex(bip::create_only, "MyMutex");
        bip::named_condition condition(bip::create_only, "MyCondition");
        // 启动子进程
        std::string child_program = std::string(argv[0]) + " child";
        if (std::system(child_program.c_str()) != 0) {
            std::cerr `<< "Failed to launch child process!" << std::endl;
            return 1;
        }
        // 父进程写入数据到共享内存
        {
            bip::`scoped_lock<bip::named_mutex>` lock(mutex);
            *shared_value = 42; // 写入数据
            std::cout `<< "Parent process: Wrote value " << *shared_value << " to shared memory." << std::endl;
            condition.notify_one(); // 通知子进程
        }
        // 父进程等待子进程完成
        std::cout << "Parent process: Waiting for child process to finish..." << std::endl;
        std::cin.get();
        // 销毁共享内存中的对象
        segment.`destroy<int>`("SharedValue");
        // 删除共享内存和同步对象
        bip::shared_memory_object::remove("MySharedMemory");
        bip::named_mutex::remove("MyMutex");
        bip::named_condition::remove("MyCondition");
    } else { // 子进程
        // 打开已存在的托管共享内存段
        bip::managed_shared_memory segment(bip::open_only, "MySharedMemory");
        // 查找共享内存中的整数
        int* shared_value = segment.`find`<int>`("SharedValue").first;
        if (!shared_value) {
            std::cerr `<< "Child process: Failed to find shared value!" << std::endl;
            return 1;
        }
        // 打开命名的互斥锁和条件变量
        bip::named_mutex mutex(bip::open_only, "MyMutex");
        bip::named_condition condition(bip::open_only, "MyCondition");
        // 子进程等待父进程的通知
        {
            bip::`scoped_lock<bip::named_mutex>` lock(mutex);
            condition.wait(lock); // 等待父进程的通知
            std::cout `<< "Child process: Read value " << *shared_value << " from shared memory." << std::endl;
        }
    }
    return 0;
}
```

### 3.2. 【代码说明】
1. **共享内存**：
+ 使用`bip::managed_shared_memory`创建或打开共享内存段。
1. **同步对象**：
    - 使用`bip::named_mutex`创建一个命名的互斥锁，用于保护共享资源。
    - 使用`bip::named_condition`创建一个命名的条件变量，用于进程间通知。
2. **父进程**：
    - 父进程写入数据到共享内存。
    - 使用`condition.notify_one()`通知子进程。
3. **子进程**：
    - 子进程打开共享内存并查找共享的整数。
    - 使用`condition.wait(lock)`等待父进程的通知。
4. **清理**：
    - 父进程在子进程完成后销毁共享内存中的对象，并删除共享内存和同步对象。

## 4. 四：动手练习操作**
创建一个通过共享内存通讯的客户端/服务器应用程序。 文件名称应该作为命令行参数传递给客户端应用程序。 这个文件存储在服务器端应用程序启动的目录下，这个文件应经由共享内存发送给服务器端应用程序。



>` 来自: [深度剖析（7）：Boost C++库，《进程间通讯》全维度解析](https://mp.weixin.qq.com/s?__biz=Mzg5NzA0NjYyNA==&mid=2247485905&idx=1&sn=1a93afe1aa9d838867ed7801758e8a69&chksm=c07688def70101c82ef49bb0ed37af9416c905cdfa30d608a4d1c9bd3b905668e4a6efedcd65&cur_album_id=3814454053487198212&scene=190#rd)
>





