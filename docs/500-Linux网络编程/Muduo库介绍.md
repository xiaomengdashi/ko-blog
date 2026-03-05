---
sidebar_position: 6
slug: /Linux网络编程/Muduo库介绍
---

Muduo，由陈硕大佬精心开发，是一个基于非阻塞IO和事件驱动的高性能C++ TCP网络编程库。它采用了主从Reactor模型，这种模型特别适用于构建高并发的网络服务器。在Muduo中，使用的线程模型被称为“one loop per thread”，这一理念的核心在于：

+ **一个线程对应一个事件循环（EventLoop）**：这意味着每个线程都维护着它自己的事件循环，该循环专门用于响应和处理该线程内的计时器事件以及IO事件。这样的设计有助于减少线程间的竞争和同步开销，提高系统的并发处理能力。
+ **一个文件描述符（或TCP连接）由单一线程处理**：在Muduo中，每个TCP连接（或更一般地说，每个文件描述符）都被绑定到特定的EventLoop上，并由该EventLoop所在的线程负责其读写操作。这种绑定关系确保了数据的一致性和线程安全，避免了多线程同时操作同一资源可能导致的竞态条件和数据不一致问题。  
![](/img/posts/7f75b2e15257ceaabf789ff730da7bca.png)

  




> **Muduo** 是一个 **高性能的 C++ 网络库**，基于 **Reactor 模式** 和 **多线程编程**，适用于高并发服务器开发。它是 **基于 **`**epoll**`** 和 **`**非阻塞 IO**` 设计的，适合构建 **高效的 TCP 服务器**。
>
> Muduo 的核心组件 **分为 4 大类**：
>
> 1. **事件循环 (**`**EventLoop**`**)**
> 2. **TCP 连接管理 (**`**TcpServer**`**、**`**TcpClient**`**)**
> 3. **网络数据处理 (**`**Buffer**`**)**
> 4. **多线程支持 (**`**ThreadPool**`**)**
>

#### 1. Muduo核心类
> **1. **`**EventLoop**`**（事件循环）**
>
> **作用**：
>
> + 负责 `epoll` 事件处理，管理 `Channel`（文件描述符）。
> + 负责定时器、异步任务调度。
> + 每个 `EventLoop` 运行在 **单独的线程**，通常一个线程只有一个 `EventLoop`。
>

```plain
EventLoop
 ├── Poller（封装 epoll）
 ├── TimerQueue（管理定时器）
 ├── Channel（封装文件描述符）
```

```cpp
class EventLoop : noncopyable  
{  
public:  
    // 开始事件循环，直到调用quit()方法为止  
    void loop();  
      
    // 请求退出事件循环  
    void quit();  
      
    // 在指定的时间运行回调函数一次  
    // 参数time是回调应该被调用的时间戳  
    // 参数cb是当时间到达时应该被调用的回调函数  
    // 返回TimerId，可用于取消定时器  
    TimerId runAt(Timestamp time, TimerCallback cb);  
      
    // 在当前时间加上指定的延迟后运行回调函数一次  
    // 参数delay是延迟时间（秒）  
    // 参数cb是当延迟时间过后应该被调用的回调函数  
    // 返回TimerId，可用于取消定时器  
    TimerId runAfter(double delay, TimerCallback cb);  
      
    // 每隔指定的时间间隔重复运行回调函数  
    // 参数interval是时间间隔（秒）  
    // 参数cb是每隔interval秒应该被调用的回调函数  
    // 返回TimerId，可用于取消定时器  
    TimerId runEvery(double interval, TimerCallback cb);  
      
    // 取消指定的定时器  
    // 参数timerId是之前通过runAt、runAfter或runEvery方法返回的定时器ID  
    void cancel(TimerId timerId);  
      
private:  
    // 原子变量，用于指示事件循环是否应该退出  
    `std::`atomic`<bool>` quit_;
      
    // 指向Poller对象的智能指针，Poller负责轮询I/O事件
    ``std::`unique_ptr`<Poller>` poller_;  
      
    // 互斥锁，用于保护多线程访问共享数据  
    mutable MutexLock mutex_;  
      
    // 存储待执行函数的向量，这些函数将在事件循环的某个点被执行
    ``std::`vector`<Functor>` pendingFunctors_ GUARDED_BY(mutex_);  
};  

```

> **2. **`**TcpServer**`**（TCP 服务器）**
>
> **作用**：
>
> + 监听 `TCP` 端口，管理多个客户端连接。
> + 通过 `Acceptor` 处理新连接，通过 `TcpConnection` 处理数据收发。
>

```plain
TcpServer
 ├── EventLoop（事件循环）
 ├── Acceptor（管理新连接）
 ├── TcpConnection（管理每个客户端）
 ├── Buffer（处理数据收发）
```

```cpp
#include `<memory>`  
#include `<functional>`  
#include `<string>`  
#include "muduo/net/EventLoop.h"  
#include "muduo/net/InetAddress.h"  
#include "muduo/net/Timestamp.h"  
#include "muduo/net/Buffer.h"  
  
typedef ``std::`shared_ptr`<TcpConnection>` TcpConnectionPtr;  
typedef ``std::`function`<void(const TcpConnectionPtr&)>` ConnectionCallback;  
typedef ``std::`function`<void(const TcpConnectionPtr&, Buffer*, Timestamp)>` MessageCallback;  
  
class InetAddress : public muduo::copyable {  
public:  
    InetAddress(StringArg ip, uint16_t port, bool ipv6 = false);  
};  
  
class TcpServer : noncopyable {  
public:  
    enum Option {  
        kNoReusePort,  
        kReusePort,  
    };  
  
    TcpServer(EventLoop* loop,  
              const InetAddress& listenAddr,  
              const std::string& nameArg,  
              Option option = kNoReusePort);  
  
    void setThreadNum(int numThreads);  
    void start();  
  
    // 当一个新连接建立成功的时候被调用  
    void setConnectionCallback(const ConnectionCallback& cb) {  
        connectionCallback_ = cb;  
    }  
  
    // 消息的业务处理回调函数---这是收到新连接消息的时候被调用的函数  
    void setMessageCallback(const MessageCallback& cb) {  
        messageCallback_ = cb;  
    }  
  
private:  
    ConnectionCallback connectionCallback_;  
    MessageCallback messageCallback_;  
};  

```

```cpp
class TcpConnection : noncopyable,  
                      public `std::`enable_shared_from_this`<TcpConnection>`  
{  
public:  
    // 构造函数，用于创建TcpConnection对象  
    // 参数包括事件循环指针、连接名称、套接字文件描述符、本地地址和远程地址  
    TcpConnection(EventLoop* loop,  
                  const string& name,  
                  int sockfd,  
                  const InetAddress& localAddr,  
                  const InetAddress& peerAddr);  
  
    // 检查连接是否已建立  
    bool connected() const { return state_ == kConnected; }  
  
    // 检查连接是否已断开  
    bool disconnected() const { return state_ == kDisconnected; }  
  
    // 发送字符串消息（使用C++11的移动语义）  
    void send(string&& message);  
  
    // 发送原始数据  
    void send(const void* message, int len);  
  
    // 使用StringPiece发送消息（StringPiece是Google的字符串切片类，用于高效处理字符串片段）  
    void send(const StringPiece& message);  
  
    // 发送Buffer对象中的数据  
    void send(Buffer* message);  
  
    // 关闭连接  
    void shutdown();  
  
    // 设置连接上下文，上下文可以是任意类型的数据，通过boost::any存储  
    void setContext(const boost::any& context)  
    { context_ = context; }  
  
    // 获取连接上下文（常量引用）  
    const boost::any& getContext() const  
    { return context_; }  
  
    // 获取连接上下文的可修改指针（注意：这可能不是线程安全的，使用时需要小心）  
    boost::any* getMutableContext()  
    { return &context_; }  
  
    // 设置连接建立时的回调函数  
    void setConnectionCallback(const ConnectionCallback& cb)  
    { connectionCallback_ = cb; }  
  
    // 设置接收到消息时的回调函数  
    void setMessageCallback(const MessageCallback& cb)  
    { messageCallback_ = cb; }  
  
private:  
    // 连接的状态枚举  
    enum StateE { kDisconnected, kConnecting, kConnected, kDisconnecting };  
  
    // 指向事件循环的指针，用于在连接上执行定时任务或异步操作  
    EventLoop* loop_;  
  
    // 连接建立时的回调函数  
    ConnectionCallback connectionCallback_;  
  
    // 接收到消息时的回调函数  
    MessageCallback messageCallback_;  
  
    // 发送完成时的回调函数
    WriteCompleteCallback writeCompleteCallback_;  
  
    // 上下文信息，可以是任意类型的数据，通过boost::any存储  
    boost::any context_;  
  
    // 连接的状态
    StateE state_;  
 
};
```

> **3. **`**TcpClient**`**（TCP 客户端）**
>
> **作用**：
>
> + 连接服务器，发送/接收数据。
> + 通过 `TcpConnection` 进行读写数据。
>

```plain
TcpClient
 ├── EventLoop（事件循环）
 ├── TcpConnection（管理连接）
 ├── Buffer（处理数据收发）
```

```cpp
class TcpClient : noncopyable  
{  
public:  
    // 构造函数，用于创建 TcpClient 对象。  
    // 需要提供事件循环指针、服务器地址和客户端名称。  
    TcpClient(EventLoop* loop,  
              const InetAddress& serverAddr,  
              const string& nameArg);  
  
    // 析构函数，声明为 out-of-line（在类定义外部实现），  
    // 以便处理 std::unique_ptr 成员（尽管在这个类的定义中没有直接显示）。  
    ~TcpClient();  
  
    // 连接到服务器。  
    void connect();  
  
    // 关闭连接。  
    void disconnect();  
  
    // 停止客户端操作，可能包括关闭连接和清理资源。  
    void stop();  
  
    // 获取客户端对应的通信连接 TcpConnection 对象的接口。  
    // 注意：在发起 connect 后，连接可能尚未建立成功。  
    TcpConnectionPtr connection() const  
    {  
        MutexLockGuard lock(mutex_); // 加锁以保护 connection_  
        return connection_; // 返回当前连接（如果有的话）  
    }  
  
    // 设置连接成功时的回调函数。  
    void setConnectionCallback(ConnectionCallback cb)  
    {  
        connectionCallback_ = std::move(cb); // 使用移动语义设置回调  
    }  
  
    // 设置收到服务器发送的消息时的回调函数。  
    void setMessageCallback(MessageCallback cb)  
    {  
        messageCallback_ = std::move(cb); // 使用移动语义设置回调  
    }  
  
private:  
    EventLoop* loop_; // 指向事件循环的指针，用于处理异步事件  
    ConnectionCallback connectionCallback_; // 连接成功时的回调函数  
    MessageCallback messageCallback_; // 收到消息时的回调函数  
    // 注意：WriteCompleteCallback 在此类的定义中没有直接出现，但可能在其他地方使用  
    TcpConnectionPtr connection_ GUARDED_BY(mutex_); // 当前连接（受 mutex_ 保护）  
    mutable MutexLock mutex_; // 用于保护 connection_ 的互斥锁  
};  
  
// CountDownLatch 类是一个同步辅助类，用于让一个或多个线程等待直到其他线程的一系列操作完成。  
// 它继承自 noncopyable 以防止被复制。  
class CountDownLatch : noncopyable  
{  
public:  
    // 构造函数，初始化计数器。  
    explicit CountDownLatch(int count);  
  
    // 等待计数器变为零。如果计数器不为零，则当前线程将阻塞。  
    void wait()  
    {  
        MutexLockGuard lock(mutex_); // 加锁以保护 count_ 和 condition_  
        while (count_ > 0) // 如果计数器大于零，则等待  
        {  
            condition_.wait(); // 释放锁并进入等待状态，直到被唤醒  
        }  
    }  
  
    // 将计数器减一。如果计数器变为零，则唤醒所有等待的线程。  
    void countDown()  
    {  
        MutexLockGuard lock(mutex_); // 加锁以保护 count_ 和 condition_  
        --count_; // 计数器减一  
        if (count_ == 0) // 如果计数器变为零  
        {  
            condition_.notifyAll(); // 唤醒所有等待的线程  
        }  
    }  
  
    // 获取当前计数器的值（主要用于调试）。  
    int getCount() const;  
  
private:  
    mutable MutexLock mutex_; // 用于保护 count_ 和 condition_ 的互斥锁  
    Condition condition_ GUARDED_BY(mutex_); // 条件变量，与 mutex_ 一起使用以实现等待/通知机制  
    int count_ GUARDED_BY(mutex_); // 计数器，表示需要等待的操作数量  
};
```

> `**4. Buffer**`**（数据缓冲区）**
>
> **作用**：
>
> + 处理 TCP 数据收发，支持**零拷贝**优化。
>

```plain
ThreadPool
 ├── Thread（线程管理）
 ├── TaskQueue（任务队列）
```

```cpp
// Buffer 类是一个字节缓冲区类，支持从两端读写数据，以及处理整数和基本字符串。  
// 它继承自 muduo::copyable，表明这个类是可以被拷贝的。  
class Buffer : public muduo::copyable  
{  
public:  
    // 定义了一个便宜的前置空间大小，用于优化读操作。  
    static const size_t kCheapPrepend = 8;  
    // 定义了缓冲区的初始大小。  
    static const size_t kInitialSize = 1024;  
  
    // 构造函数，接受一个可选的初始大小参数。  
    // 缓冲区实际大小为 kCheapPrepend + initialSize，其中 kCheapPrepend 用于优化读操作。  
    explicit Buffer(size_t initialSize = kInitialSize)  
        : buffer_(kCheapPrepend + initialSize),  
          readerIndex_(kCheapPrepend),  
          writerIndex_(kCheapPrepend)  
    {}  
  
    // 与另一个Buffer对象交换内容。  
    void swap(Buffer& rhs);  
  
    // 返回可读字节数，即 writerIndex_ - readerIndex_。  
    size_t readableBytes() const;  
  
    // 返回可写字节数，即 buffer_.size() - writerIndex_。  
    size_t writableBytes() const;  
  
    // 返回一个指向可读数据的指针，但不移动读写索引。  
    const char* peek() const;  
  
    // 查找并返回指向缓冲区中第一个EOL（如"\r\n"）的指针，从头开始搜索。  
    const char* findEOL() const;  
  
    // 查找并返回指向缓冲区中从指定位置开始的第一个EOL的指针。  
    const char* findEOL(const char* start) const;  
  
    // 从缓冲区中移除指定长度的数据。  
    void retrieve(size_t len);  
  
    // 移除并返回缓冲区中下一个 int64_t 类型的数据。  
    void retrieveInt64();  
  
    // 移除并返回缓冲区中下一个 int32_t 类型的数据。  
    void retrieveInt32();  
  
    // 移除并返回缓冲区中下一个 int16_t 类型的数据。  
    void retrieveInt16();  
  
    // 移除并返回缓冲区中下一个 int8_t 类型的数据。  
    void retrieveInt8();  
  
    // 移除并返回缓冲区中所有可读数据作为字符串。  
    string retrieveAllAsString();  
  
    // 移除并返回缓冲区中指定长度的数据作为字符串。  
    string retrieveAsString(size_t len);  
  
    // 向缓冲区末尾追加 StringPiece 对象。  
    void append(const StringPiece& str);  
  
    // 向缓冲区末尾追加指定长度的数据。  
    void append(const char* /*restrict*/ data, size_t len);  
  
    // 向缓冲区末尾追加指定长度的数据（泛型版本）。  
    void append(const void* /*restrict*/ data, size_t len);  
  
    // 返回一个指向缓冲区末尾（用于写入）的指针。  
    char* beginWrite();  
  
    // 返回一个指向缓冲区末尾（用于写入）的常量指针。  
    const char* beginWrite() const;  
  
    // 更新写入索引，表示已经写入了指定长度的数据。  
    void hasWritten(size_t len);  
  
    // 向缓冲区末尾追加一个 int64_t 类型的数据。  
    void appendInt64(int64_t x);  
  
    // 向缓冲区末尾追加一个 int32_t 类型的数据。  
    void appendInt32(int32_t x);  
  
    // 向缓冲区末尾追加一个 int16_t 类型的数据。  
    void appendInt16(int16_t x);  
  
    // 向缓冲区末尾追加一个 int8_t 类型的数据。  
    void appendInt8(int8_t x);  
  
    // 从缓冲区读取一个 int64_t 类型的数据，并移动读索引。  
    int64_t readInt64();  
  
    // 从缓冲区读取一个 int32_t 类型的数据，并移动读索引。  
    int32_t readInt32();  
  
    // 从缓冲区读取一个 int16_t 类型的数据，并移动读索引。  
    int16_t readInt16();  
  
    // 从缓冲区读取一个 int8_t 类型的数据，并移动读索引。  
    int8_t readInt8();  
  
    // 从缓冲区中查看（不移动读索引）下一个 int64_t 类型的数据。  
    int64_t peekInt64() const;  
  
    // 从缓冲区中查看（不移动读索引）下一个 int32_t 类型的数据。  
    int32_t peekInt32() const;  
  
    // 从缓冲区中查看（不移动读索引）下一个 int16_t 类型的数据。  
    int16_t peekInt16() const;  
  
    // 从缓冲区中查看（不移动读索引）下一个 int8_t 类型的数据。  
    int8_t peekInt8() const;  
  
    // 在缓冲区开头（readerIndex_ 之前）追加一个 int64_t 类型的数据。  
    void prependInt64(int64_t x);  
  
    // 在缓冲区开头（readerIndex_ 之前）追加一个 int32_t 类型的数据。  
    void prependInt32(int32_t x);  
  
    // 在缓冲区开头（readerIndex_ 之前）追加一个 int16_t 类型的数据。  
    void prependInt16(int16_t x);  
  
    // 在缓冲区开头（readerIndex_ 之前）追加一个 int8_t 类型的数据。  
    void prependInt8(int8_t x);  
  
    // 在缓冲区开头（readerIndex_ 之前）追加指定长度的数据。  
    void prepend(const void* /*restrict*/ data, size_t len);  
  
private:  
    ``std::`vector`<char>` buffer_; // 存储字节数据的向量。  
    size_t readerIndex_; // 读索引，指向下一个可读字节的位置。  
    size_t writerIndex_; // 写索引，指向下一个可写字节的位置。  
    static const char kCRLF[]; // 可能的行结束符，如 "\r\n"。  
};
```

> `**5.ThreadPool**`**（线程池）**
>
> **作用**：
>
> + 用于多线程任务调度，避免线程创建销毁的开销。
>

```plain
ThreadPool
 ├── Thread（线程管理）
 ├── TaskQueue（任务队列）
```

```plain
Muduo
 ├── muduo::base  （基础工具库）
 │   ├── ThreadPool      （线程池）
 │   ├── Logging         （日志系统）
 │   ├── Timestamp       （时间处理）
 │
 ├── muduo::net   （网络库）
 │   ├── EventLoop       （事件循环，基于 epoll）
 │   ├── TcpServer       （TCP 服务器）
 │   ├── TcpClient       （TCP 客户端）
 │   ├── TcpConnection   （管理每个 TCP 连接）
 │   ├── Buffer          （数据缓冲区）
 │   ├── Acceptor        （监听新连接）
 │   ├── TimerQueue      （定时任务）
 │
 ├── muduo::http  （HTTP 服务器）
     ├── HttpServer
     ├── HttpRequest
     ├── HttpResponse
```

#### 2. 1.Muduo实现字典服务端
```cpp
#`include`<muduo/net/TcpServer.h>`
#`include`<muduo/net/EventLoop.h>`
#`include`<muduo/net/TcpConnection.h>`
#`include`<muduo/net/Buffer.h>`
#`include`<iostream>`
#`include`<string>`
#`include`<unordered_map>`
 
class DictServer
{
public:
    DictServer(int port):_server(&_baseloop, muduo::net::InetAddress("0.0.0.0",port),
    "DictServer",muduo::net::TcpServer::kNoReusePort)//kNoReusePort是否启动地址重用?
    {
        //设置回调函数 
        //需要的参数类型 void setConnectionCallback(const ConnectionCallback& cb)
        //typedef ``std::`function`<void (const TcpConnectionPtr&)>` ConnectionCallback;
        //TcpConnectionPtr&就是onConnection函数的参数，但onConnection是类成员函数带有this指针
        //用bind先绑定this指针(最先bind)，其它参数按顺序传
        _server.setConnectionCallback(std::bind(&DictServer::onConnection,this,std::placeholders::_1));
        _server.setMessageCallback(std::bind(&DictServer::onMessage,this,
            std::placeholders::_1,std::placeholders::_2,std::placeholders::_3));
    }
    void start()
    {
        _server.start();//开始监听
        _baseloop.loop();//开始循环事件监控
    }
private:
    void onConnection(const muduo::net::TcpConnectionPtr&conn) //连接建立/断开的回调函数
    {
        if(conn->connected())//判断连接是否存在
            `std::`cout`<<"连接建立"<<std::endl;
        else 
            `std::`cout<<"连接断开"<<std::endl;
    }
    //接收到消息的回调函数
    void onMessage(const muduo::net::TcpConnectionPtr&conn,
        muduo::net::Buffer *buf,muduo::Timestamp)
    {
        static std::unordered_map<std::string,std::string>` dict_map={
            {"hello","你好"},
            {"coke","小猫"},
        };
        std::string msg=buf->retrieveAllAsString();//获取缓冲区的全部数据
        std::string res;
        if(dict_map.find(msg)!=dict_map.end())
            res=dict_map[msg];
        else 
            res="找不到";
        conn->send(res);
    }
private:
    muduo::net::EventLoop _baseloop;
    muduo::net::TcpServer _server;
};
 
int main()
{
    DictServer server(9090);
    server.start();
    return 0;
}
```

> **1.设置回调函数时，为什么bind要传this?**
>
> _**_server.setConnectionCallback(std::bind(&DictServer::onConnection, this, std::placeholders::_1));**_
>
> **&DictServer::onConnection****只是成员函数的地址**，它并不属于任何对象。
>
> **this**用于绑定 onConnection 到当前 DictServer 实例,**告诉 **`**std::bind**`** 这个函数属于哪个对象.**
>
> **(静态成员函数** 不依赖 `this`，所以可以直接使用，而 **非静态成员函数** 需要 `this` 指定对象。**)**
>
> **2.回调函数的参数只需要一个，算上this参数不就是两个了？**
>
> 这是因为 std::bind** 生成了一个新的函数对象**，这个函数对象的参数列表与 setConnectionCallback() **需要的回调完全匹配**，Muduo 可以正确调用它。
>
> 所以最终 **this 只是 std::bind 内部存储的对象指针**，不会影响 setConnectionCallback() 只接受一个参数！
>
> **3.std::bind 绑定成员函数时，this 和参数的顺序**
>
> 在 `std::bind` 绑定类成员函数时：
>
> + `**this**`** 必须是第一个参数**（因为成员函数需要对象实例）。
> + 之后的参数**按照成员函数的参数顺序**传递。**std::placeholders::_1**代表是**未提供默认值的第一个参数的位置**，而**不是成员函数的第一个参数**。
>

makefile:

```makefile
CXXFLAGS= -std=c++11 -I../../build/release-install-cpp11/include/
CXXFLAGS=-L../../build/release-install-cpp11/lib -lmuduo_net -lmuduo_base -pthread
server: server.cpp
	g++ $(CXXFLAGS) $^ -o $@ $(CXXFLAGS)
clean:
	rm -f server
```

> `**CXXFLAGS** `**C++ 编译选项 **
>
> -I../../build/release-install-cpp11/include/ **指定额外的头文件搜索路径**,确保能找到#`include`&lt;muduo/net/Buffer.h>`等相关头文件。
>
> `**LDFLAGS**`** 链接选项**
>
> -L../../build/release-install-cpp11/lib 
>
> **额外的库文件搜索路径**，如果 `server.cpp` 依赖 `muduo` 库（如 `libmuduo_net.so`），编译器会在 `../../build/release-install-cpp11/lib/` 目录查找这些库。
>
> + `-lmuduo_net`：链接 `libmuduo_net.a` 或 `libmuduo_net.so`
> + `-lmuduo_base`：链接 `libmuduo_base.a` 或 `libmuduo_base.so`
> + `**-lxxx**`** 表示链接 **`**libxxx.so**`** 或 **`**libxxx.a**`，前缀 `lib` 可以省略。
>
> **#include" " #include&lt;&gt;查找方式**
>



| 方式 | 作用 |
| --- | --- |
| `#include "file.h"` | **先查找当前目录，再查找 **`**-I**`<br/>** 目录，最后查找系统路径** |
| `#include `&lt;file.h&gt;` | **只查找 **`**-I**`<br/>** 目录和系统路径**，不查找当前目录 |
| `-I/path/to/include` | 添加额外头文件目录 |


> **netstat -anput | grep 9090**
>
> **查看当前系统上所有和 **`**9090**`** 端口相关的网络连接**。
>

| 选项 | 含义 |
| --- | --- |
| `netstat` | 显示网络连接、路由表、接口统计等信息 |
| `-a` | 显示所有套接字（包括监听和已建立的连接） |
| `-n` | 以**数字**格式显示地址（不解析 DNS） |
| `-t` | 仅显示 **TCP** 连接 |
| `-p` | 显示关联的进程（需要 `root`<br/> 权限） |
| `-u` | 显示 **UDP** 连接 |
| `grep 9090` | 过滤出包含 `9090`<br/> 端口的结果 |


#### 3. 2.Muduo实现字典客户端
> 1.**使用 **`**CountDownLatch类**`** 确保连接建立后再发送数据**，防止 `send()` 失败。
>
> 2.**使用 **`**EventLoopThread**`** 让 **`**EventLoop**`** 运行在独立线程**，避免 `main()` 被阻塞，确保可以继续处理用户输入和其他操作。如果 `loop()` 运行在 `main()` 线程，那么 `main()` 线程就会被阻塞，无法执行后续代码，比如 `std::cin` 输入等。
>

```cpp
#include `<muduo/net/TcpClient.h>`
#include `<muduo/net/EventLoop.h>`
#include `<muduo/net/TcpConnection.h>`
#include `<muduo/net/EventLoopThread.h>`
#include `<muduo/net/Buffer.h>`
#include `<muduo/base/CountDownLatch.h>`
#include `<iostream>`
#include `<string>`

class DictClient
{
public:
// TcpClient(EventLoop* loop,
//     const InetAddress& serverAddr,
//     const string& nameArg);
// InetAddress(StringArg ip, uint16_t port, bool ipv6 = false);
DictClient(const std::string &sip, int sport) : 
_downlactch(1), // 初始化计数器=1
_baseloop(_loopthread.startLoop()),
_client(_baseloop, muduo::net::InetAddress(sip, sport), "DictClient")             
{
    // 连接事件回调
    _client.setConnectionCallback(std::bind(&DictClient::onConnection, this, std::placeholders::_1));
    // 连接消息回调
    _client.setMessageCallback(std::bind(&DictClient::onMessage, this,
        std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));

    // 连接服务器 client的connect接口是一个非阻塞的操作
    // 所有可能会出现connect还没建立连接，conntion接口就获取了连接,send()发送数据
    _client.connect();  // 此时计数>0
    _downlactch.wait(); // 等连接建立完成countDown()后计数-- =0继续

    // //在连接建立完成后,可以直接loop吗？
    // //开始事件循环监控,内部是死循环,对于客户端来说不能直接使用,因为一旦循环，就走不下去了
    // //一般再用一个线程单独loop
    // _baseloop.loop();
}
bool send(const std::string &msg)
{
    if (_conn->connected() == false)
    {
        std::cout `<< "连接断开" << std::endl;
        return false;
    }
    _conn->`send(msg);
    return true;
}

private:
void onConnection(const muduo::net::TcpConnectionPtr &conn) // 连接建立/断开的回调函数
{
    if (conn->connected()) // 判断连接是否存在
    {
        std::cout `<< "连接建立" << std::endl;
        _conn = conn;
        _downlactch.countDown(); // 计数-- =0 唤醒wait
    }
    else
        std::cout << "连接断开" << std::endl;
}
// 接收到消息的回调函数
void onMessage(const muduo::net::TcpConnectionPtr &conn,
muduo::net::Buffer *buf, muduo::Timestamp)
{
    std::string res=buf->`retrieveAllAsString();
    `std::`cout`<<`res<<std::endl;
}

private:
muduo::net::TcpConnectionPtr _conn;
muduo::CountDownLatch _downlactch; // 做计数同步的类 void wait()计数>`0阻塞 countDown()-- 计数=0唤醒wait
muduo::net::EventLoopThread _loopthread; //实例化后自动创建一个线程执行loop
muduo::net::EventLoop* _baseloop;
muduo::net::TcpClient _client;
};

int main()
{
    DictClient client("127.0.0.1",9090);
    while(1)
        {
            std::string msg;
            std::cin>>msg;
            client.send(msg);
        }
    return 0;
}
```

> makefile
>

```makefile
CXX = g++
CXXFLAGS = -std=c++11 -I/root/Json-Rpc/build/release-install-cpp11/include/ -Wall -O2
LDFLAGS = -L/root/Json-Rpc/build/release-install-cpp11/lib -lmuduo_net -lmuduo_base -pthread
all: server client
server: server.cpp
	$(CXX) $(CXXFLAGS) $^ -o $@ $(LDFLAGS)
 
client: client.cpp
	$(CXX) $(CXXFLAGS) $^ -o $@ $(LDFLAGS)
clean:
	rm -f server client
```

## 

  


> 来自: [C++ Json-Rpc框架-1准备工作(JsonCpp Muduo 异步操作)-CSDN博客](https://blog.csdn.net/wws7920/article/details/146352849)
>

