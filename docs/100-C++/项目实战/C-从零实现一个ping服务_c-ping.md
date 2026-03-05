---
sidebar_position: 4
slug: /C++/项目实战/C-从零实现一个ping服务_c-ping
---

## 1. 前言
> [ping命令](https://so.csdn.net/so/search?q=ping%E5%91%BD%E4%BB%A4&spm=1001.2101.3001.7020)，因为其简单、易用等特点，几乎所有的操作系统都内置了一个ping命令。如果你是一名C++初学者，对网络编程、系统编程有所了解，但又没有多少实操经验的话，不妨来尝试动手实现一个属于自己的ping命令。这样一来，也能提高你对系统编程、网络编程的能力。
>

## 2. ICMP
### 2.1. 概念
ICMP是工作在网络层的一种**不可靠的传输协议**，意在辅助IP协议获取报文传输与网络连接的情况，被广泛运用于网络诊断工具（如：ping 和 traceroute）。

ICMP协议可以控制路由将报文错误原因返回给源主机，从而实现对网络状况的诊断。

![](/img/posts/31534aedf8f1038c49f6aa8cecc0a65c.png)

### 2.2. 报文格式
ICMP协议被封装在IP协议之中，以下为ICMP的报文固定格式：

![](/img/posts/3e8ff7f46496091e3fcf65aee9248e21.png)

+ **类型**：用于标识报文的类型，ICMP报文类型分为两类：信息类报文、差错类报文。
+ **代码**：用于标识差错类报文的具体错误信息。
+ **校验和**：用于计算报文是否出现损坏（发送方填写，接收方校验）。

**「ICMP常见消息类型」**

| ICMP 类型 | 描述 |
| --- | --- |
| 0 | 回显应答（Echo Reply）：对回显请求的响应，通常用于ping操作。 |
| 3 | 目的不可达（Destination Unreachable）：目标地址无法到达时发送，包括网络不可达、主机不可达等子类型。 |
| 4 | 源抑制（Source Quench）：请求发送方降低发送速率，以防止网络拥塞（现已弃用）。 |
| 5 | 重定向（Redirect）：建议主机将数据包发送到不同的路由器，提供更优路径。 |
| 8 | 回显请求（Echo Request）：请求目标主机返回应答消息，通常用于ping操作。 |
| 11 | 超时（Time Exceeded）：数据包在网络中传输时间超过TTL值，或在分片重组过程中超时。 |
| 12 | 参数问题（Parameter Problem）：数据包的IP头部存在错误，导致无法处理。 |


**「Linux中的实现」**

Linux中ICMP报文格式有不少成员，但只是实现ping服务只需要以下成员：

+ **icmp_type**：icmp报文的类型。
+ **icmp_cksum**：校验和，用于计算数据是否损坏。
+ **icmp_id**：用于标识报文的唯一性。
+ **icmp_seq**：序列号字段，多用于echo、echoreply功能。
+ **icmp_data**：报文的内容，只有**8bit大小**

**「Linux中ICMP报文的描述」**

```cpp
/*Linux中icmp的有较多成员变量，嫌麻烦可以看#define部分来认识主要成员变量*/
struct icmp
{
uint8_t  icmp_type;	/* icmp类型; type of message, see below */
uint8_t  icmp_code;	/* type sub code */
uint16_t icmp_cksum;	/*校验和，用于确定报文是否完整无损*/
union
{
unsigned char ih_pptr;	/* ICMP_PARAMPROB */
struct in_addr ih_gwaddr;	/* gateway address */
struct ih_idseq		/* echo datagram */
{
uint16_t icd_id;
uint16_t icd_seq;
} ih_idseq;
uint32_t ih_void;

/* ICMP_UNREACH_NEEDFRAG -- Path MTU Discovery (RFC1191) */
struct ih_pmtu
{
uint16_t ipm_void;
uint16_t ipm_nextmtu;
} ih_pmtu;

struct ih_rtradv
{
uint8_t irt_num_addrs;
uint8_t irt_wpa;
uint16_t irt_lifetime;
} ih_rtradv;
} icmp_hun;
#define	icmp_pptr	icmp_hun.ih_pptr
#define	icmp_gwaddr	icmp_hun.ih_gwaddr
#define	icmp_id		icmp_hun.ih_idseq.icd_id
#define	icmp_seq	icmp_hun.ih_idseq.icd_seq
#define	icmp_void	icmp_hun.ih_void
#define	icmp_pmvoid	icmp_hun.ih_pmtu.ipm_void
#define	icmp_nextmtu	icmp_hun.ih_pmtu.ipm_nextmtu
#define	icmp_num_addrs	icmp_hun.ih_rtradv.irt_num_addrs
#define	icmp_wpa	icmp_hun.ih_rtradv.irt_wpa
#define	icmp_lifetime	icmp_hun.ih_rtradv.irt_lifetime
union
{
struct    //存储时间戳
{
uint32_t its_otime;        // 原始时间戳，发送时的时间
uint32_t its_rtime;        // 接受时间戳，接受时的时间
uint32_t its_ttime;        // 传输时间戳，传输所用时间
} id_ts;
struct
{
struct ip idi_ip;
/* options and then 64 bits of data */
} id_ip;
struct icmp_ra_addr id_radv;
uint32_t   id_mask;
uint8_t    id_data[1];
} icmp_dun;
#define	icmp_otime	icmp_dun.id_ts.its_otime
#define	icmp_rtime	icmp_dun.id_ts.its_rtime
#define	icmp_ttime	icmp_dun.id_ts.its_ttime
#define	icmp_ip		icmp_dun.id_ip.idi_ip
#define	icmp_radv	icmp_dun.id_radv
#define	icmp_mask	icmp_dun.id_mask
#define	icmp_data	icmp_dun.id_data
};
```

## 3. Ping服务实现
### 3.1. 系统调用函数
**原始套接字**

要使用ICMP协议就必须绕过传输层(TCP/UDP)，直接操作网络层，所以必须使用原始套接字，在Mac、Linux中使用原始套接字可能会**需要root权限**。

```cpp
//函数原型
int socket(int domain, int type, int protocol);

int _sockfd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);  //使用原始套接字
```

**信号转换**

在Linux中的ping服务一般通过ctl+c来实现终止，所以得要将信号执行函数替换成自己的函数。

```cpp
//函数原型
void (*
signal(int sig, void (*func)(int));
)(int);

//使用方式
signal(SIGINT, [](int sig)
{
    printf("sig:%d", sig);
} );
```

**「域名转换为IP地址」**

在Linux中将域名转成ip地址的函数有gethostbyname，但其在新版本的linux中已经被废弃，所以这里使用较新的getaddrinfo。

```cpp
/*通过getaddrinfo获取的数据将存进该结构体*/
struct addrinfo {
int              ai_flags;
int              ai_family;    //协议族
int              ai_socktype;
int              ai_protocol;
socklen_t        ai_addrlen;  // sockaddr 的长度
struct sockaddr *ai_addr;     // 根据需求转换成sockaddr_in
char            *ai_canonname;
struct addrinfo *ai_next;     //下一个addrinfo，使用链表来连接匹配的IP。
};

int getaddrinfo(const char *restrict node,                  //需要转换的域名
const char *restrict service,            //DNS服务器地址，可为空
const struct addrinfo *restrict hints,   //用于限定获取的数据
struct addrinfo **restrict res);         //结果存放的指针
```

### 3.2. 具体实现
ping服务的实现使用了类来进行封装，从而使得其更简洁易懂。

**头文件声明**

```cpp
#include `<netdb.h>`
#include `<sys/socket.h>`
#include `<netinet/in.h>`
#include `<arpa/inet.h>`
#include `<signal.h>`
#include `<unistd.h>`
#include `<stdlib.h>`
#include `<string.h>`
#include `<netinet/ip_icmp.h>`
#include `<string>`
#include `<iostream>`
#include `<format>`
#include `<thread>`


class PingServer
{
public:
PingServer(const char* ip);   

void Start();  

static void TimeEnd();   // ping计算总结，ctrl+c调用。

private:
void Init();     // 初始化类

void SendData();  //发送数据

void RecvData();  //接受数据

unsigned short CheckSum(void* data, int len);   //计算校验和

private:
static std::chrono::system_clock::time_point _oldTime;   //计算ping服务运行时间
static int _sendSeq;  //发送数据次数
static int _recvSeq;  //接受数据次数

struct sockaddr_in _destAddr;  //远端地址信息
const char* _ip;    //需要ping的ip/hostname;
char _recvData[1024];   //接受数据缓冲区

int _sockfd;   //套接字

unsigned short _id;   //用于标识ip报文唯一性。
};

//初始化静态成员
std::chrono::system_clock::time_point PingServer::_oldTime = std::chrono::system_clock::now();
int PingServer::_sendSeq = 0;
int PingServer::_recvSeq = 0;
```

> 介绍完类的成员，也该到其实现了⬇️。
>

```cpp
#include `<netdb.h>`
#include `<sys/socket.h>`
#include `<netinet/in.h>`
#include `<arpa/inet.h>`
#include `<signal.h>`
#include `<unistd.h>`
#include `<stdlib.h>`
#include `<assert.h>`
#include `<stdio.h>`
#include `<string.h>`
#include `<netinet/ip_icmp.h>`
#include `<string>`
#include `<iostream>`
#include `<format>`
#include `<future>`
#include `<thread>`


//TODO chrono时钟实现超时

class PingServer
{
public:
    PingServer(const char* ip)
        :_ip(ip), _id(htons(getpid()))
    {
        Init();
    }

    void Start()
    {
        std::thread(&PingServer::SendData, this).detach();
        RecvData();
    }

    static void TimeEnd()
    {
        auto now = std::chrono::system_clock::now();
        auto sum = std::chrono::`duration_cast`<std::chrono::milliseconds>`(now-_oldTime).count();
        int loss = ((double)(_sendSeq - _recvSeq) / _sendSeq) * 100;

        std::cout `<< std::format("\n{} packets transimitted, {} received, {}% packet loss, time {}ms", _sendSeq, _recvSeq, loss, sum) << std::endl;
    }

private:
    void Init()
    {
        _sockfd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);  //使用原始套接字
        if(_sockfd < 0) 
        {
            std::cerr << "socket error" << std::endl;  
            exit(-1);
        }

        struct addrinfo hints{}, *res{};   
        hints.ai_family = AF_INET;  //限定获取IP为IPV4

        if(getaddrinfo(_ip, nullptr, &hints, &res) != 0) //正确返回0
        {
            std::cerr << "hostname error" << std::endl;
            exit(EXIT_FAILURE);
        }

        sockaddr_in* ipv4 = (sockaddr_in*)res->`ai_addr;  //转换成sockaddr_in结构 sockaddr->sockaddr_in
        memcpy(&_destAddr, ipv4, sizeof(sockaddr_in));
    }

    void SendData()
    {
        while (1)
        {
            //装包
            struct icmp icmphdr{};  //需要发送的ICMP报文
            icmphdr.icmp_seq = ++_sendSeq;  
            icmphdr.icmp_type = ICMP_ECHO;  //ICMP报文的类型
            // icmphdr.icmp_type = ICMP_TIMESTAMP;      
            icmphdr.icmp_id = _id;      

            auto now = std::chrono::system_clock::now();     // 获取时间戳, 8bit
            memcpy(icmphdr.icmp_data, &now, sizeof(now));    

            icmphdr.icmp_cksum = CheckSum(&icmphdr, sizeof(icmphdr));   // 计算校验和

            if(sendto(_sockfd, &icmphdr, sizeof(icmphdr), 0, (struct sockaddr*)&_destAddr, sizeof(_destAddr)) <= 0)
            {   //发送数据
                std::cout `<< "send data fail " << _ip << std::endl;
                exit(EXIT_FAILURE);
            }

            std::this_thread::sleep_for(std::chrono::seconds(1));   //每个一秒发送一次
        }
    }

    void RecvData()
    {
        while (1)
        {
            sockaddr_in addr{};
            socklen_t fromLen = sizeof(_destAddr);
            ssize_t n = recvfrom(_sockfd, _recvData, sizeof(_recvData), 0, (sockaddr*)&addr, &fromLen);
            if(n >` 0)
            {   
                struct ip* ip_hdr = (struct ip*)_recvData;  
                // 获取ICMP报文位置，IP头部计算为首部字段长度*4;
                struct icmp* icmp_hdr = (struct icmp*)(_recvData + (ip_hdr->ip_hl `<< 2));   

                if (icmp_hdr->`icmp_type == ICMP_ECHOREPLY && icmp_hdr->icmp_id == _id)  //筛选
                {
                    ++_recvSeq;
                    //计算耗时
                    auto now = std::chrono::system_clock::now();
                    auto data = (std::chrono::system_clock::time_point*)icmp_hdr->icmp_data;
                    auto sum = std::chrono::`duration_cast`<std::chrono::milliseconds>`(now - *data).count();

                    std::cout `<< std::format("{} bytes from {}: icmp_seq={} ttl={} time={}ms",
                        n, inet_ntoa(_destAddr.sin_addr), icmp_hdr->`icmp_seq, ip_hdr->ip_ttl, sum) `<< std::endl;
                }
                // else 
                // {
                //     std::cout << std::format("icmp_type: {}, icmp_ip: {}, icmp_code: {}", icmp_hdr->`icmp_type, icmp_hdr->icmp_id, icmp_hdr->icmp_code) `<< std::endl;
                // }
            }
            else if(n <= 0)
            {
                std::cerr << "Recv fail" << std::endl;
                exit(EXIT_FAILURE);
            }
        }
        
    }

    unsigned short CheckSum(void* data, int len)
    {   
        unsigned short* buf = (unsigned short*)data;
        unsigned sum = 0;

        // 计算数据的和
        while(len >` 1)
        {
            sum += *buf++;
            len -= 2;
        }
        if(len == 1)
        {
            sum += *(unsigned char*)buf;
        }

        // 把高16位和低16位相加
        sum = (sum >> 16) + (sum & 0xffff);
        sum += (sum >> 16);
        // 取反
        return (unsigned short)(~sum);
    }



private:
    static std::chrono::system_clock::time_point _oldTime;  
    static int _sendSeq;
    static int _recvSeq;

    unsigned short _id;
    int _sockfd;

    struct sockaddr_in _destAddr;
    const char* _ip;    //需要ping的ip;
    char _recvData[1024];
};

std::chrono::system_clock::time_point PingServer::_oldTime = std::chrono::system_clock::now();
int PingServer::_sendSeq = 0;
int PingServer::_recvSeq = 0;
```

**main函数**

```cpp
#include "Ping.hpp"

//TOOD 初始化

void Usage()
{
    std::cout `<< "ping <ip/hostname>`" `<< std::endl;
}

int main(int argc, char* argv[])
{
    if(argc != 2)
    {
        Usage();
        return 1;
    }

    signal(SIGINT, [](int sig)  //当使用 ctl+c 时中断程序。
    {
        PingServer::TimeEnd();
        exit(0);
    });

    PingServer ping(argv[1]);

    ping.Start();

    return 0;
}
```

### 3.3. 运行测试
**CMakeList**

```cpp
cmake_minimum_required(VERSION 3.29)
project(PingServer)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(test test.cpp
        Ping.hpp
)
```

**运行结果：**

![](/img/posts/1ccbf7bb0fffbfba09e1905870dcd67c.png)

## 4. 总结
本篇文章实现了一个简易的ping指令，其对系统编程、[网络编程](https://so.csdn.net/so/search?q=%E7%BD%91%E7%BB%9C%E7%BC%96%E7%A8%8B&spm=1001.2101.3001.7020)都有所涉及，但真实的ping指令可远不止这么简单，感兴趣的读者可以通过访问[Linux开源项目](https://github.com/torvalds/linux/blob/master/net/ipv4/ping.c)来了解真正的实现。

>` 📜博客主页：[主页](https://blog.csdn.net/CaTianRi)  
📫我的专栏：[C++](http://t.csdnimg.cn/stIat)  
📱我的github：[github](https://github.com/CaTianRi)
>

![](/img/posts/d486100920f055066384fbf42ae27e38.gif)  


> 来自: [[C++] 从零实现一个ping服务_c++ ping-CSDN博客](https://blog.csdn.net/CaTianRi/article/details/139487221)
>

