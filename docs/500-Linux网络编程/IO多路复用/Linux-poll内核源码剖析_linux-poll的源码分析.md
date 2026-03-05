---
sidebar_position: 7
slug: /Linux网络编程/IO多路复用/Linux-poll内核源码剖析_linux-poll的源码分析
---

---
title: Linux poll内核源码剖析_linux poll的源码分析-CSDN博客
date: '2025-06-19 02:05:23'
updated: '2025-06-19 02:07:49'
slug: /Linux网络编程/IO多路复用/Linux-poll内核源码剖析_linux-poll的源码分析
**IO多路复用接口Linux内核源码剖析，源码之前，了无秘密**

[Linux poll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95241700)

[Linux select内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95315926)

[Linux epoll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95377075)

## 1. Linux poll内核源码剖析
#### 1.0.1. 文章目录
+ [Linux poll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95241700#Linux_poll_8)
    - [poll应用程序编写](https://blog.csdn.net/weixin_42462202/article/details/95241700#poll_16)
        * [demo](https://blog.csdn.net/weixin_42462202/article/details/95241700#demo_51)
    - [poll机制内核源码分析](https://blog.csdn.net/weixin_42462202/article/details/95241700#poll_106)
    - [总结](https://blog.csdn.net/weixin_42462202/article/details/95241700#_307)

一开始学习poll、select、epoll这几个API的时候，知道了poll和select是轮询方式，epoll是通过回调的方式，当监听的IO数量过多时，poll和select的效率会很低，而epoll仍然保持着高效 

虽然知道是这么回事，但心里还是有点空荡荡的感觉，所以分析了一遍内核源码，背景源码之前，了无密码，哈哈，在这里分享出来，希望对大家有所帮助

本文先讲解一下如何在应用层使用poll，然后再深入内核源码分析poll机制

### 1.1. poll应用程序编写
poll可以监听多个文件描述符，直到条件满足或超时的时候，就会返回

+ poll函数原型

```cpp
int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

fds：这是一个数组，每一个数组元素表示要监听的文件描述符以及相应的事件

nfds：数组的个数

timeout：超时时间

放回值：成功放回准备好的事件个数，超时放回0，出错放回-1

+ struct pollfd结构体

```cpp
struct pollfd {
	int   fd;		
    short events;    
    short revents;   
};
```

对于events和revents部分取值如下

   


#### 1.1.1. demo
   


下面这个程序使用poll监听标准输入，知道标准输入可读时，就会返回打印内容

   


```cpp
#include `<stdio.h>`
#include `<poll.h>`
#include `<string.h>`

#define MAX_FD  100

int main(int argc, char* argv[])
{
    struct pollfd fds[MAX_FD];
    int nfds;
    char buf[1024];
    int len;
    int i;

    memset(fds, 0, sizeof(fds));

    fds[0].fd = 0; 
    fds[0].events = POLLIN; 

    while(1)
    {
        nfds = poll(fds, MAX_FD, -1); 
        if(nfds < 0)
        {
            printf("poll err.\n");
            return -1;
        }

        for(i = 0; i < MAX_FD; i++)
        {
            if(fds[i].revents | POLLIN) 
            {
                len = read(fds[i].fd, buf, 1024);
                if(len < 0)
                {
                    printf("read err.\n");
                    return -1;
                }
    
                buf[len] = '\0';
                printf("read buf: %s\n", buf);
            }
        }

    }

    return 0;
}
```

### 1.2. poll机制内核源码分析
由上面的应用程序可知，poll调用传递三个参数，`pollfd数组`，`数组数量`，`超时时间`

当应用层调用poll时，会调用到内核的`sys_poll`系统调用(select.c文件中)，如下

```cpp
SYSCALL_DEFINE3(poll, struct pollfd __user *, ufds, unsigned int, nfds,
		long, timeout_msecs)
```

这是内核的一个宏定义，展开后变成

```cpp
long sys_poll(struct pollfd __user * ufds, unsigned int nfds, long timeout_msecs)
```

下面我们来好好分析这个函数

```cpp
SYSCALL_DEFINE3(poll, struct pollfd __user *, ufds, unsigned int, nfds,
		long, timeout_msecs)
{
    struct timespec end_time, *to;
        
    
	poll_select_set_timeout(to, timeout_msecs / MSEC_PER_SEC,
			NSEC_PER_MSEC * (timeout_msecs % MSEC_PER_SEC));
    
    ret = do_sys_poll(ufds, nfds, to); 

    return ret;
}
```

下面分析`do_sys_poll`函数

```cpp
int do_sys_poll(struct pollfd __user *ufds, unsigned int nfds,
		struct timespec *end_time)
{
    long stack_pps[POLL_STACK_ALLOC/sizeof(long)];
	struct poll_list *const head = (struct poll_list *)stack_pps;
    struct poll_list *walk = head;
    unsigned long todo = nfds;
    
    len = min_t(unsigned int, nfds, N_STACK_PPS);
    
    for (;;) {
    	copy_from_user(walk->entries, ufds + nfds-todo, 
                       	sizeof(struct pollfd) * walk->len));
    
        todo -= walk->len;
        
        len = min(todo, POLLFD_PER_PAGE);
        size = sizeof(struct poll_list) + sizeof(struct pollfd) * len;
        walk = walk->next = kmalloc(size, GFP_KERNEL);
    }
    
    poll_initwait(&table);
    fdcount = do_poll(nfds, head, &table, end_time);
    poll_freewait(&table);
    
    for (walk = head; walk; walk = walk->next) {
        ...
		__put_user(fds[j].revents, &ufds->revents)
    	...
    }
    
    return fdcount;
}
```

由于内容非常多，所以下面按行号来进行说明

+ 4：在栈上定义一段内存
+ 5：定义一个poll_list结构体指针，指向上面定义的内存

这里的poll_list是用来管理内存的，内核需要将用户层传递过来的pollfd数组拷贝到内核空间，而这些数组所占用的内核是使用poll_list来维护的

下面看一看poll_list结构体

```cpp
struct poll_list {
	struct poll_list *next; 
	int len; 
	struct pollfd entries[0]; 
};
```

也是到这里你还有一点不明白，那么看一看下面这张图也许就明白了

![](/img/posts/eb7b3cdb4daeef0e95431292fb02c669.png)

内核使用的第一段内存是在栈上，因为poll的设计本来就预算监听的文件描述符不会很多，所以内存不需要很大，使用栈上的内存可以提高访问速度

**那如果一开始在栈上分配的内存不够用的话，就需要重新分配内存，此时分配的内核是在堆上，内存分布图如下**

![](/img/posts/a5124491f7154b3a3484fbbc77b0c4d5.png)

+ 9：得到pollfd数组个数和栈上内存还可以存放多少个poollfd中的最小值
+ 12：将用户空间传递过来的pollfd数组元素拷贝到内核空间中保存
+ 19：分配新空间以存放pollfd数组元素
+ 23：执行do_poll会调用到每一个文件描述符的驱动程序，然后阻塞等待，直到条件满足，这个函数稍后再详细分析
+ 26-30：将得到的结果拷贝回应用层
+ 32：放回条件满足的个数

**下面详细分析一下do_poll函数干了什么**

```cpp
static int do_poll(unsigned int nfds,  struct poll_list *list,
		   struct poll_wqueues *wait, struct timespec *end_time)
{
    for (;;) {
    	struct poll_list *walk;
        
        for (walk = list; walk != NULL; walk = walk->next) {
        	if (do_pollfd(pfd, pt)) 
                count++;
        }
        
        if (count || timed_out)
            break;
        
        poll_schedule_timeout(wait, TASK_INTERRUPTIBLE, to, slack);
    }
    
    return count;
}
```

+ 7-10：遍历所有的pollfd，调用do_pollfd函数，如果放回值不为0，表示条件满足，count++

看看fo_pollfd函数做了什么

```cpp
static inline unsigned int do_pollfd(struct pollfd *pollfd, poll_table *pwait)
{
    
    mask = file->f_op->poll(file, pwait);
    
    
    return mask;
}
```

来看一看驱动程序一般都是怎么实现poll的

```cpp
static unsigned int button_poll(struct file *fp, poll_table * wait)
{
	unsigned int mask = 0;

    
	poll_wait(fp, &wq, wait); 

	
	if(condition)
		mask |= POLLIN; 

	return mask;
}
```

看看poll_wait做了什么

```cpp
static inline void poll_wait(struct file * filp, wait_queue_head_t * wait_address, poll_table *p)
{
	if (p && wait_address)
		p->qproc(filp, wait_address, p);
}
```

其中p->qproc在`do_sys_poll`中的`poll_initwait(&table)`被赋值为`__pollwait`函数

看看`__pollwait`做了什么

```cpp
static void __pollwait(struct file *filp, wait_queue_head_t *wait_address,
				poll_table *p)
{
    
    struct poll_table_entry *entry = poll_get_entry(pwq);
    
    
	add_wait_queue(wait_address, &entry->wait); 
}
```

所以我们回到`do_poll`中的`do_pollfd`，我们知道了这个函数最后会为每一个文件描述符申请一个等待队列项，然后将其加入对其驱动程序的等待队列头中

+ 15：调度任务

此时poll的进程处于睡眠状态，直到驱动程序唤醒等待队列时，会再次运行，然后继续运行7-10行代码，遍历所有的文件描述符，调用其驱动程序的poll函数，只有返回的掩码不为0时，count才会加1，然后会退出`do_poll`，最后将结果拷贝回应用空间

由此我们也可以看出，poll系统调用至少会调用驱动程序的poll两次，第一次申请一个等待队列元素加入驱动程序的等待队列中，第二次是驱动程序将其唤醒，继续调用驱动程序的poll函数获得一个掩码

至此，poll就分析完了

### 1.3. 总结
当应用层调用`poll`，回调用到内核的`sys_poll`，sys_poll会将polllfd数组的所有内存保存到内核空间中，然后遍历每一个文件描述符对应的驱动程序的poll函数，申请一个等待队列元素，将其添加到驱动程序的等待队列中，然后睡眠，直到驱动程序将其唤醒，再遍历每一个文件描述符对应的驱动程序的poll函数，得到一个掩码，再将结果拷贝会应用空间

所以一次poll调用会有两次遍历，这就是为什么poll会随着监听文件描述符的数量增多，效率降低，此外select的原理和poll也是相同的，具体分析在下一篇文章



> 来自: [Linux poll内核源码剖析_linux poll的源码分析-CSDN博客](https://blog.csdn.net/weixin_42462202/article/details/95241700)
>





