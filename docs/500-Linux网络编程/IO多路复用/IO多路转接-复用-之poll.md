---
sidebar_position: 4
slug: /Linux网络编程/IO多路复用/IO多路转接-复用-之poll
---

---
title: IO多路转接（复用）之poll 
date: '2025-01-05 16:23:05'
updated: '2025-01-06 00:36:40'
slug: /Linux网络编程/IO多路复用/IO多路转接-复用-之poll
[Linux](https://subingwen.cn/categories/Linux/)[C语言](https://subingwen.cn/tags/C%E8%AF%AD%E8%A8%80/)[套接字通信](https://subingwen.cn/tags/%E5%A5%97%E6%8E%A5%E5%AD%97%E9%80%9A%E4%BF%A1/)[并发](https://subingwen.cn/tags/%E5%B9%B6%E5%8F%91/)[TCP](https://subingwen.cn/tags/TCP/)[IO多路复用](https://subingwen.cn/tags/IO%E5%A4%9A%E8%B7%AF%E5%A4%8D%E7%94%A8/)2021-03-312023-04-06

### 1. poll函数
poll的机制与select类似，与select在本质上没有多大差别，使用方法也类似，下面的是对于二者的对比：

+ 内核对应文件描述符的检测也是以线性的方式进行轮询，根据描述符的状态进行处理
+ poll和select检测的文件描述符集合会在检测过程中频繁的进行用户区和内核区的拷贝，它的开销随着文件描述符数量的增加而线性增大，从而效率也会越来越低。
+ `select检测的文件描述符个数上限是1024，poll没有最大文件描述符数量的限制`
+ `select可以跨平台使用，poll只能在Linux平台使用`

poll函数的函数原型如下：

```c
#include `<poll.h>`
// 每个委托poll检测的fd都对应这样一个结构体
struct pollfd {
    int   fd;         /* 委托内核检测的文件描述符 */
    short events;     /* 委托内核检测文件描述符的什么事件 */
    short revents;    /* 文件描述符实际发生的事件 -> 传出 */
};

struct pollfd myfd[100];
int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

+ 函数参数：

fds: 这是一个`struct pollfd`类型的数组, 里边存储了待检测的文件描述符的信息，这个数组中有三个成员：

        * fd：委托内核检测的文件描述符
        * events：委托内核检测的fd事件（输入、输出、错误），每一个事件有多个取值
        * revents：这是一个传出参数，数据由内核写入，存储内核检测之后的结果

                 ![](/img/posts/76635cf6c4d03481e2c9bcb2714b9d83.png)

    - nfds: 这是第一个参数数组中最后一个有效元素的下标 + 1（也可以指定参数1数组的元素总个数）
    - timeout: 指定poll函数的阻塞时长
        * -1：一直阻塞，直到检测的集合中有就绪的文件描述符（有事件产生）解除阻塞
        * 0：不阻塞，不管检测集合中有没有已就绪的文件描述符，函数马上返回
        * 大于0：阻塞指定的毫秒（ms）数之后，解除阻塞
+ 函数返回值：
    - 失败： 返回-1
    - 成功：返回一个大于0的整数，表示检测的集合中已就绪的文件描述符的总个数

### 2. 测试代码
**服务器端**

```c
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<unistd.h>`
#include `<string.h>`
#include `<arpa/inet.h>`
#include `<sys/select.h>`
#include `<poll.h>`

int main()
{
    // 1.创建套接字
    int lfd = socket(AF_INET, SOCK_STREAM, 0);
    if(lfd == -1)
    {
        perror("socket");
        exit(0);
    }
    // 2. 绑定 ip, port
    struct sockaddr_in addr;
    addr.sin_port = htons(9999);
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    int ret = bind(lfd, (struct sockaddr*)&addr, sizeof(addr));
    if(ret == -1)
    {
        perror("bind");
        exit(0);
    }
    // 3. 监听
    ret = listen(lfd, 100);
    if(ret == -1)
    {
        perror("listen");
        exit(0);
    }

    // 4. 等待连接 -> 循环
    // 检测 -> 读缓冲区, 委托内核去处理
    // 数据初始化, 创建自定义的文件描述符集
    struct pollfd fds[1024];
    // 初始化
    for(int i=0; `i`<1024; ++i)
    {
        fds[i].fd = -1;
        fds[i].events = POLLIN;
    }
    fds[0].fd = lfd;

    int maxfd = 0;
    while(1)
    {
        // 委托内核检测
        ret = poll(fds, maxfd+1, -1);
        if(ret == -1)
        {
            perror("select");
            exit(0);
        }

        // 检测的度缓冲区有变化
        // 有新连接
        if(fds[0].revents & POLLIN)
        {
            // 接收连接请求
            struct sockaddr_in sockcli;
            int len = sizeof(sockcli);
            // 这个accept是不会阻塞的
            int connfd = accept(lfd, (struct sockaddr*)&sockcli, &len);
            // 委托内核检测connfd的读缓冲区
            int i;
            for(i=0; `i<1024; ++i)
            {
                if(fds[i].fd == -1)
                {
                    fds[i].fd = connfd;
                    break;
                }
            }
            maxfd = i >` maxfd ? i : maxfd;
        }
        // 通信, 有客户端发送数据过来
        for(int i=1; i<=maxfd; ++i)
        {
            // 如果在集合中, 说明读缓冲区有数据
            if(fds[i].revents & POLLIN)
            {
                char buf[128];
                int ret = read(fds[i].fd, buf, sizeof(buf));
                if(ret == -1)
                {
                    perror("read");
                    exit(0);
                }
                else if(ret == 0)
                {
                    printf("对方已经关闭了连接...\n");
                    close(fds[i].fd);
                    fds[i].fd = -1;
                }
                else
                {
                    printf("客户端say: %s\n", buf);
                    write(fds[i].fd, buf, strlen(buf)+1);
                }
            }
        }
    }
    close(lfd);
    return 0;
}
```

从上面的测试代码可以得知，使用poll和select进行IO多路转接的处理思路是完全相同的，但是使用poll编写的代码看起来会更直观一些，select使用的位图的方式来标记要委托内核检测的文件描述符（每个比特位对应一个唯一的文件描述符），并且对这个`fd_set`类型的位图变量进行读写还需要借助一系列的宏函数，操作比较麻烦。而poll直接将要检测的文件描述符的相关信息封装到了一个结构体`struct pollfd`中，我们可以直接读写这个结构体变量。

另外poll的第二个参数有两种赋值方式，但是都和第一个参数的数组有关系：

+ 使用参数1数组的元素个数
+ 使用参数1数组中存储的最后一个有效元素对应的下标值 + 1

内核会根据第二个参数传递的值对参数1数组中的文件描述符进行线性遍历，这一点和select也是类似的。

**客户端**

```c
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<unistd.h>`
#include `<string.h>`
#include `<arpa/inet.h>`

int main()
{
    // 1. 创建用于通信的套接字
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if(fd == -1)
    {
        perror("socket");
        exit(0);
    }

    // 2. 连接服务器
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;  // ipv4
    addr.sin_port = htons(9999);   // 服务器监听的端口, 字节序应该是网络字节序
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr.s_addr);
    int ret = connect(fd, (struct sockaddr*)&addr, sizeof(addr));
    if(ret == -1)
    {
        perror("connect");
        exit(0);
    }

    // 通信
    while(1)
    {
        // 读数据
        char recvBuf[1024];
        // 写数据
        // sprintf(recvBuf, "data: %d\n", i++);
        fgets(recvBuf, sizeof(recvBuf), stdin);
        write(fd, recvBuf, strlen(recvBuf)+1);
        // 如果客户端没有发送数据, 默认阻塞
        read(fd, recvBuf, sizeof(recvBuf));
        printf("recv buf: %s\n", recvBuf);
        sleep(1);
    }
    // 释放资源
    close(fd); 
    return 0;
}
```

客户端不需要使用IO多路转接进行处理，因为客户端和服务器的对应关系是 1：N，也就是说客户端是比较专一的，只能和一个连接成功的服务器通信。  


> 来自: [IO多路转接（复用）之poll | 爱编程的大丙](https://subingwen.cn/linux/poll/)
>

