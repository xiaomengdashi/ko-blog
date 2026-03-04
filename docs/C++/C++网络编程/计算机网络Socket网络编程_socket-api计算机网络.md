---
sidebar_position: 1
slug: /C++/C++网络编程/计算机网络Socket网络编程_socket-api计算机网络
---

## 📄前言
> 现今我们的日常生活当中，网络已经成为了必不可少的存在，大到覆盖全世界的互联网，小到身边的各种电器，可以说网络无处不在。我们作为一名程序员，如果对网络不甚了解，那么~~注定会度过一个相对失败的一生~~，需要利用网络进行通信的应用正变得越来越多，企业对程序员网络知识的需求也越发变得重要，因此，学习网络一定会对你有所帮助。
>

## Socket编程基础
### 概念
Socket 的中文名可以译为[套接字](https://so.csdn.net/so/search?q=%E5%A5%97%E6%8E%A5%E5%AD%97&spm=1001.2101.3001.7020)、插座，就像它的直译插座一样，Socket 是两台机器网络通讯的端点，只要使用Socket就能连接两台机器，从而实现数据的传输、交换。

在介绍Socket是如何工作前，我们需要先了解一下网络的基本术语。

+ **基础术语**
+ **IP地址**：IP地址是设备在网络上的标识符，要进行网络通信就必须拥有一个IP地址
+ **端口**：端口的设计是为了让网络数据正确发送到应用程序，计算机通过IP+端口号来确保数据收发正确。
+ **协议**：协议是定义数据如何在网络传输的规则，Socket编程中会接触到的协议有UDP、TCP协议。

### 工作原理
正如上方所说Socket是网络通信的端点，Socket的工作原理是基于C—S模型，即必定会有客户端与服务端的存在。既然要通信，那么就一定会有协议的存在。**socket 有面向字节流协议的SOCK_STREAM**、**面向数据报的 SOCK_DGRAM** 和 **直接将数据发往IP层的原始套接字 SOCK_RAW。**

其实 SOCK_STREAM 与 SOCK_DGRAM 就已经可以完成99%的网络通讯设计，毕竟现在网络上主流的协议也就是UDP和TCP协议。虽然协议本身区别很大，但在应用层的使用上，大体还是差不多的。

+ 服务器端的工作流程
    1. 创建套接字。
    2. 绑定地址。
    3. 接受数据。
    4. 发送数据。
+ 客户端的工作流程
    1. 创建套接字
    2. 提前确定远端的地址、端口
    3. 发送数据
    4. 接受数据。

## Socket API介绍
### socket函数
socket函数是系统用于创建套接字描述符的接口，该函数会返回一个文件描述符，之后网络的通信便围绕着这个文件描述符进行。

```cpp
#include <sys/socket.h>

//函数原型	
int socket(int domain, int type, int protocol);
// 返回值为文件描述符
int fd = socket(AF_INET, SOCK_STREAM, 0);
```

+ 参数选项 
    - **domain:** 用于指定通信域，常用的选项为`AF_INET`(指定使用IPV4通信)，`AF_INET6`(指定IPV6通信)，`AF_UNIX`(指定本地进程间通信)。
    - **type:** 用于指定socket的类型。常用的选项为`SOCK_STREAM`(提供可靠的流传输服务，也就是TCP)，`SOCK_DGRAM`(提供不可靠的数据报服务，也就是UDP)。
    - **protocl:** 用于指定是否使用特殊协议，一般设为0。

### 绑定、监听函数
**bind 函数用于让程序绑定一个固定的端口号，使套接字只从该端口号接受/发送数据**，一般用于服务器显示绑定地址，客户端通过系统自动分配。**listen 函数用于监听端口号，等待客户端的连接。**

```cpp
#include <sys/socket.h>

int listen(int sockfd, int backlog);	//成功返回0


int bind(int sockfd, const struct sockaddr *addr,	//成功返回0
socklen_t addrlen);

/* socketaddr是C语言历史缘由而留下来的结构体，因为当初C语言还不支持
void* 类型，所以设计出了sockaddr类型，以应对不同的选项。 */

//以下是socketaddr家族
struct sockaddr {	//基础类型
sa_family_t sa_family;	
char        sa_data[14];
}

struct sockaddr_in {	
__uint8_t       sin_len;	//无特殊要求不会指定值
sa_family_t     sin_family;	//设置协议家族（如AF_INET、AF_UNIX）
in_port_t       sin_port;	//设置端口
struct  in_addr sin_addr;	//设置IP地址
char            sin_zero[8];	
};

//socket_in6  用于IPV6设置。
```

+ **bind 参数选项**
    - **sockfd**: socket 文件描述符。
    - **addr:** 绑定socket_addr。
    - **addrlen:** 指定socket_addr的长度。
+ **listen 参数选项**
    - **sockfd:** 指定需要监听的套接字。
    - **backlog:** 用于指定套接字中处于排队TCP连接数（还未得到处理），用于防止 SYN 泛洪攻击。

### accept、connect
accept 和 connect 这两个函数，它们一般用于**TCP协议**，因为UDP是无连接的所以用不上(connect除外)。

accept 函数用于接受一个TCP连接，并返回它的套接字描述符，之后的读写则往该套接字描述符进行。注意，使用前需要先建立好监听状态。

connect 函数用于连接一个远端的服务器，成功则返回0.

```cpp
#include <sys/types.h>
#include <sys/socket.h>

int
accept(int socket, struct sockaddr *address, socklen_t *address_len);


int	//connect函数用于连接服务器
connect(int socket, const struct sockaddr *address, socklen_t address_len);
//UDP连接也可以使用connect函数，一般用于为UDP的套接字绑定一个固定的远端地址，从此该套接字就只能接受该地址的数据（过滤）。
```

+ **accept 的参数选项**
    - **socket:** 指定需要接受数据的套接字接口
    - **address:** 该结构用于接收连接方的协议地址。如果不想要远端的信息，可以设null。
    - **address_len:** 用于指定address的长度。
+ **connect 的参数选项**
    - **socket:** socket 文件描述符
    - **address:** 指向存放目标服务器地址的信息。
    - **addlen:** 指定addr结构体的长度。

### 接受/发送函数
unix like 系统中，UDP与TCP协议数据的收发所使用的函数有些许的差别，主要就是是否需要指定远端的地址、端口的差别，TCP方面因为已经通过 **accpt 创建了一个包含远端信息的套接字**，而UDP是无连接的，所以需要传入一个包含远端信息的sockaddr 结构体。

**TCP协议所使用的接发函数：**

```cpp
#include <sys/socket.h>

// recv send 参数都是一致的。
ssize_t recv(int sockfd, void buf, size_t len,
int flags);		

ssize_t send(int sockfd, const void buf, size_t len, int flags);
```

+ **参数选项：**
    - **sockfd:** 指定远端的套接字接口
    - **buf:** 需要接受/发送的数据
    - **len:** 数据的长度
    - **flags:** 可提供额外的控制选项，如指定`阻塞等待（MSG_DONTWAIT）`。

**UDP协议所使用的接收/发送函数：**

```cpp
ssize_t recvfrom(int sockfd, void buf, size_t len,
                int flags,	
                struct sockaddr * src_addr,	//可设为空，但如果要发送数据则要存储该结构体
                socklen_t * addrlen);	

ssize_t sendto(int sockfd, const void buf, size_t len, int flags,
              const struct sockaddr *dest_addr, socklen_t addrlen);

// 额外所需要用的
uint16_t
htons(uint16_t hostshort);	//将主机序列转为网络序列，网络数据使用大端传送

unsigned long 
inet_addr(const char *cp);	//用于将字符串ip地址转为网络字节序的二进制形式
```

+ **参数选项：**
    - **sockfd:** 指定需要接收/发送数据的套接字。
    - **buf:** 数据所存放的内存
    - **flags:** 发送的选项，与TCP一样
    - **addr:** 如果需要发送数据，则需要在recvfrom指定中存储的sockadd结构体
    - **addrlen:** sockaddr 的长度，如 sockaddr_in 。

## Socket API的应用
介绍完了基本的函数信息，也该到实践的环节了，但如果只是简单写下函数的使用方法，也并没有什么实际意义，那么不如构建一个Socket编程的模版，这样以来使用 [Socket 编程](https://so.csdn.net/so/search?q=Socket%20%E7%BC%96%E7%A8%8B&spm=1001.2101.3001.7020)就不必再敲重复的代码，而且也能提高对设计模式的理解。

**代码的大致样子：**

### Socket类与其派生类的设计
Socket 基类是TcpSocket、UdpSocket的抽象基类，用于提高代码的复用性。

```cpp
#include <iostream>
#include <utility>
#include <arpa/inet.h>

#define MAX_BUFFER_SIZE 1024

struct RemoteData   //用于获取远端数据
{
public:
    RemoteData() = default;
    explicit RemoteData(sockaddr_in& client, int fd = -1)
        :_addr(client), _socket(fd)
    {
     	_data.resize(MAX_BUFFER_SIZE);       
    }
    ~RemoteData() = default;

    sockaddr_in _addr;
    std::string _data;	// 改用 char buffer[];
    int _socket = -1;
};

// 使用模版方法进行封装
class Socket
{
public:
    Socket(std::string ip, int port)
            :_ip(std::move(ip)), _port(port)
    {}

    void BuildServer()  //用于服务器的构造
    {
        bool socket = CreateSocket();
        bool bindSocket = BindSocket();
        if(!(socket && bindSocket))
        {
            std::cerr << "socket build failed\n";
            return;
        }
        std::cout << "socket build success\n";
    }

    void BuildClient()  // 用于客户端的构造
    {
        bool socket = CreateSocket();
        bool connectSocket = ConnectSocket();
        if(!(socket && connectSocket))
        {
            std::cerr << "socket build failed\n";
            return;
        }

        std::cout << "socket build success\n";
    }

protected:
    virtual bool BindSocket()   // 用于绑定套接字
    {
        if(::bind(_socket, (struct sockaddr*)&_addr, sizeof(_addr)) < 0)
            return false;

        return true;
    }

    virtual bool Accept(RemoteData* data)   // 用于接受套接字
    {
        socklen_t len = sizeof (sockaddr_in);
        sockaddr_in* addr =  &data->_addr;
        data->_socket = accept(_socket, (sockaddr*)addr, &len);
        if(data->_socket < 0)
        {
            std::cerr << "accept failed " << strerror(errno) << std::endl;
            return false;
        }
        return true;
    }

    virtual bool ConnectSocket()    // 用于连接套接字
    {
        if(::connect(_socket, (struct sockaddr*)&_addr, sizeof(_addr)) < 0)
            return false;

        return true;
    }

virtual ~Socket() = default;            // 基类继承需要把析构函数设为虚函数。
    virtual bool CreateSocket() = 0;        // 创建套接字
    virtual bool RecvData(RemoteData*) = 0; // 接收数据
    virtual bool SendData(RemoteData*) = 0; // 发送数据
protected:
    int _socket=-1;
    int _port{};
    std::string _ip{};
    sockaddr_in _addr{};
};
```

**TcpSocket 和 UdpSocket**

TcpSocket 与 UdpSocket 就如其名，对应了TCP与UDP的socket编程设计。

```cpp
class UdpSocket : public Socket
{	// UdpSocket如果使用connect函数，可以使用send、recv来代替sendto、recvfrom
public:
    UdpSocket(std::string ip, int port)
            : Socket(std::move(ip), port)	//初始化基类
    {}

    ~UdpSocket() override = default;

protected:
    bool CreateSocket() override
    {
        _addr.sin_family = AF_INET;
        _addr.sin_port = htons(_port);	//将主机字节序列转为网络字节序列
        _addr.sin_addr.s_addr = inet_addr(_ip.c_str());

        _socket = socket(AF_INET, SOCK_DGRAM, 0);
        if(_socket < 0) return false;	//错误处理

        return true;
    }

    bool RecvData(RemoteData* remoteData) override
    {
        char* buffer = remoteData->_data.data();
        socklen_t len = sizeof(sockaddr_in);
        sockaddr_in* client = &remoteData->_addr;
        ssize_t n = recvfrom(_socket, buffer, MAX_BUFFER_SIZE-1, 0, (struct sockaddr*)client, &len);
        if(n == 0)
        {	
            std::cout << "client close\n";
            return false;
        }
        else if(n > 0)
        {
            buffer[n] = '\0';
            std::cout << "recv data : " << buffer << std::endl;
            return true;
        }
        else
        {
            std::cerr << "recvfrom error\n";
            return false;
        }
    }

    bool ConnectSocket() override
    {
        return true;
    }

    bool SendData(RemoteData* data) override
    {
        char* buffer = data->_data.data();
        sockaddr_in* client = &data->_addr;
        ssize_t n = sendto(_socket, buffer, strlen(buffer), 0, (struct sockaddr*)client, sizeof(*client));
        if(n < 0)
        {
            std::cerr << "sendto error: " << strerror(errno) << std::endl;
            return false;
        }
        return true;
    }
};

class TcpSocket : public Socket
{
public:
    TcpSocket(std::string ip, int port)
            : Socket(std::move(ip), port)
    {}

    ~TcpSocket() override = default;

    bool CreateSocket() override
    {	
        _addr.sin_family = AF_INET;
        _addr.sin_port = htons(_port);
        _addr.sin_addr.s_addr = inet_addr(_ip.c_str());

        _socket = socket(AF_INET, SOCK_STREAM, 0); //使用SOCK_STREAM
        if(_socket < 0) return false;
        return true;
    }

    bool BindSocket() override
    {
        if(::bind(_socket, (struct sockaddr*)&_addr, sizeof(_addr)) )
        {
            std::cerr << "bind failed\n";
            return false;
        }
        
        listen(_socket, 5); //TCP服务器需要监听端口

        return true;
    }

    bool RecvData(RemoteData* remoteData) override
    {
        int socket = remoteData->_socket;
        char* buffer = remoteData->_data.data();
        ssize_t n = recv(socket, buffer, MAX_BUFFER_SIZE-1, 0);
        if(n == 0)
        {
            std::cout << "client close\n";
            return false;
        }
        else if(n > 0)
        {
            buffer[n] = '\0';
            std::cout << "recv data : " << buffer << std::endl;
            return true;
        }
        else
        {
            std::cerr << "recv error\n";
            return false;
        }
    }

    bool SendData(RemoteData* data) override
    {
        int socket = data->_socket;
        char* buffer = data->_data.data();
        ssize_t n = send(socket, buffer, strlen(buffer), 0);
        if(n < 0)
        {
            std::cerr << "send error\n";
            return false;
        }
        return true;
    }
};
```

### 服务器与客户端的设计
**服务器设计**

```cpp
#include <memory>
#include <print>
#include "Socket.hpp"
//#include "ThreadPool.hpp"	//不懂线程池的可以去看看我写的线程池博客

class UdpServer : protected UdpSocket
{
public:
    UdpServer(int port, `std::function<void(RemoteData*)>` handler)
            : UdpSocket("0.0.0.0", port), _handle(std::move(handler))
    {
        BuildServer();	//构建Socket
    }

    void Run(RemoteData* data)
    {
        _handle(data);	//业务处理函数
        SendData(data);
    }

    void start()
    {
        std::string msg;
        while (true)
        {
            sockaddr_in client{};
            `std::shared_ptr<RemoteData>` data = std::make_shared<RemoteData>(RemoteData(client));
            if(!RecvData(data.get()))
                continue;
//            ThreadPool::GetInstance()->enqueue([this, data]{ Run(data.get());});
            Run(data.get());
        }
    }

private:
    `std::function<void(RemoteData*)>` _handle;	//业务处理函数
};

class TcpServer : TcpSocket	// 注意：这个TCP协议需要进行粘包处理。
{
public:
    TcpServer(int port, `std::function<void(RemoteData*)>` handler)
        : TcpSocket("0.0.0.0", port), _handle(std::move(handler))
    {
        BuildServer();
    }

    void ThreadRun(RemoteData* data)
    {
        while (true)
        {
            if(!RecvData(data)) break;
            _handle(data);
            if(!SendData(data)) break;
        }
        close(data->_socket);
    }

    void start()
    {
        std::string msg;
        while (true)
        {
            sockaddr_in client{};
            `std::shared_ptr<RemoteData>` data = std::make_shared<RemoteData>(RemoteData(client));
            if(!Accept(data.get()))
                break;
//            ThreadPool::GetInstance()->enqueue([this, data]{ ThreadRun(data.get());});	//最好使用多线程进行业务处理，否则将只能处理一条连接
            ThreadRun(data.get());
        }
    }
private:
    `std::function<void(RemoteData*)>` _handle;
};
```

**客户端设计**

```cpp
class UdpClient : public UdpSocket
{
public:
    UdpClient(std::string ip, int port, `std::function<void(RemoteData*)>` func)
        : UdpSocket(std::move(ip), port), _func(std::move(func))
    {
        BuildClient();	//
    }

    void start()
    {
        while (true)
        {
            `std::shared_ptr<RemoteData>` data = std::make_shared<RemoteData>(RemoteData(_addr));
            _func(data.get());
            SendData(data.get());
            RecvData(data.get());
        }
    }

private:
    `std::function<void(RemoteData*)>` _func;
};

class TcpClient : public TcpSocket
{
public:
    TcpClient(std::string ip, int port, `std::function<void(RemoteData*)>` func)
        : TcpSocket(std::move(ip), port), _func(std::move(func))
        {
            BuildClient();
        }

    void start()
    {
        while (true)
        {
            `std::shared_ptr<RemoteData>` data = std::make_shared<RemoteData>(RemoteData(_addr, _socket));
            _func(data.get());
            SendData(data.get());
            RecvData(data.get());
        }
    }

private:
    `std::function<void(RemoteData*)>` _func;
};
```

### 使用
```cpp
//client.cpp
#include "Client.hpp"

void handler(RemoteData* data)
{
    std::cout << "client: ";
    std::cin >> data->_data;
}

int main()
{					// 使用本地环回进行通信
    UdpClient client("127.0.0.1", 8888, handler);
    client.start();
    return 0;
}

//server.cpp
#include "Server.hpp"

void handler(RemoteData* data)
{}

int main() {
    ThreadPool* pool = ThreadPool::GetInstance(5);
    UdpServer server(8888, `std::function<void(RemoteData*)>`(handler));
    server.start();
    return 0;
}
```

## 📓总结
学习Socket编程只是迈入网络编程的第一步，计算机网络中还有TCP、UDP协议、IP协议等各种难关来等着我们来一一攻破。虽然你可能觉得学习Socket编程对学习TCP/IP协议这些没什么帮助，学校的老师也从来不会从代码开始攻坚计算机网络，但计算机网络就应该自顶至下，从应用层的应用开始学起。

> 📜博客主页：[主页](https://blog.csdn.net/CaTianRi)  
📫我的专栏：[C++](http://t.csdnimg.cn/stIat)  
📱我的github：[github](https://github.com/CaTianRi)
>

![](/img/posts/f87cb6f051e603afc93accdb69882379.gif)  


> 来自: [【计算机网络】Socket网络编程_socket api计算机网络-CSDN博客](https://blog.csdn.net/CaTianRi/article/details/137952324)
>

