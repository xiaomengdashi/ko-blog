---
sidebar_position: 8
slug: /Linux网络编程/IO多路复用/Linux-select内核源码剖析_linux-select内核源码分析
---

---
title: Linux select内核源码剖析_linux select内核源码分析-CSDN博客
date: '2025-06-19 02:05:57'
updated: '2025-06-19 02:07:13'
slug: /Linux网络编程/IO多路复用/Linux-select内核源码剖析_linux-select内核源码分析
**IO多路复用接口Linux内核源码剖析，源码之前，了无秘密**

[Linux poll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95241700)

[Linux select内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95315926)

[Linux epoll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95377075)

## 1. Linux select内核源码剖析
#### 1.0.1. 文章目录
+ [Linux select内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95315926#Linux_select_8)
    - [select应用程序](https://blog.csdn.net/weixin_42462202/article/details/95315926#select_14)
    - [select机制内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95315926#select_92)
    - [总结](https://blog.csdn.net/weixin_42462202/article/details/95315926#_318)

select的原理其实是和poll是一样的，都是采用轮询的方式。select相对于poll也许是比较节省空间吧，因为select是采用bitmap来标志的 

本文先讲解一下如何在应用层使用select，然后再深入内核剖析select机制

### 1.1. select应用程序
select可以监听多个文件描述符，直到条件满足或者超时返回

+ select函数原型

```cpp
int select(int nfds, fd_set *readfds, fd_set *writefds,
fd_set *exceptfds, struct timeval *timeout);
```

nfds：最大的文件描述符加1

readfds：监听可读集合

writefds：监听可写集合

exceptfds：监听异常集合

timeout：超时时间

对于这些集合，有一组函数可以进行设置

```cpp
void FD_SET(int fd, fd_set *set); 
void FD_CLR(int fd, fd_set *set); 
int  FD_ISSET(int fd, fd_set *set); 
void FD_ZERO(fd_set *set);
```

**demo**

下面这个程序使用select监听标准输入，直到标准输入可读时，返回并打印内容

```cpp
#include `<stdio.h>`
#include `<sys/select.h>`

int main(int argc, char* argv[])
{
    fd_set rfds;
    int nfds;
    int i;
    char buf[1024];
    int len;

    FD_ZERO(&rfds); 

    FD_SET(0, &rfds); 
    nfds = 0 + 1; 

    while(1)
    {
        fd_set fds = rfds;
        
        
        if(select(nfds, &fds, NULL, NULL, NULL) < 0)
        {
            printf("select err.\n");
            return -1;
        }

        for(i = 0; i < nfds; i++)
        {
            
            if(FD_ISSET(i, &fds))
            {
                len = read(i, buf, 1024);
                buf[len] = '\0';
                printf("read buf: %s\n", buf);
            }
        }
    }

    return 0;
}
```

### 1.2. select机制内核源码剖析
我们先来看看`fd_set`是什么东西

```cpp
typedef __kernel_fd_set		fd_set;

typedef struct {
unsigned long fds_bits [__FDSET_LONGS]; 
} __kernel_fd_set;
```

从上面可以看出，fd_set其实就是一个数组，内核用一个位来表示一个文件描述符，从内核定义来看，一共有1024个位

下面再来看看这四个设置函数

```cpp
void FD_SET(int fd, fd_set *set); 
void FD_CLR(int fd, fd_set *set); 
int  FD_ISSET(int fd, fd_set *set); 
void FD_ZERO(fd_set *set);
```

```cpp
#define FD_SET(fd,fdsetp)	__FD_SET(fd,fdsetp)
#define FD_CLR(fd,fdsetp)	__FD_CLR(fd,fdsetp)
#define FD_ISSET(fd,fdsetp)	__FD_ISSET(fd,fdsetp)
#define FD_ZERO(fdsetp)		__FD_ZERO(fdsetp)
```

先看FD_SET，其实就是将特定的位置1

```cpp
#define __FD_SET(fd, fdsetp) \
		(((fd_set *)(fdsetp))->fds_bits[(fd) >> 5] |= (1`<<((fd) & 31)))
```

再看看FD_CLR，其实就是将特定的位置0

```cpp
#define __FD_CLR(fd, fdsetp) \
		(((fd_set *)(fdsetp))->`fds_bits[(fd) >> 5] &= ~(1`<<((fd) & 31)))
```

看看FD_ISSET，其实就是判断特定的位是否被置1

```cpp
#define __FD_ISSET(fd, fdsetp) \
		((((fd_set *)(fdsetp))->`fds_bits[(fd) >> 5] & (1`<<((fd) & 31))) != 0)
```

看一下FD_ZERO，其实就是将所有的位置0

```cpp
#define __FD_ZERO(fdsetp) \
		(memset (fdsetp, 0, sizeof (*(fd_set *)(fdsetp))))
```

至此我们直到，fd_set其实就是一个数组，然后里面每一个位都表示一个文件描述符的状态，我们将我们要监听的文件描述符对应的位标志好后，传递给内核，内核会将状态通过位标记返回到应用层

**下面就马上来分析select对应的系统调用**

select对应的系统调用如下

```cpp
SYSCALL_DEFINE5(select, int, n, fd_set __user *, inp, fd_set __user *, outp,
		fd_set __user *, exp, struct timeval __user *, tvp)
```

将其展开后得到如下函数

```cpp
long sys_select(int n, fd_set __user * inp, fd_set __user * outp,
                    fd_set __user * exp, struct timeval __user * tvp)
```

```cpp
SYSCALL_DEFINE5(select, int, n, fd_set __user *, inp, fd_set __user *, outp,
		fd_set __user *, exp, struct timeval __user *, tvp)
{
    
    ret = core_sys_select(n, inp, outp, exp, to);
    
    return ret;
}
```

接下来看`core_sys_select`

```cpp
int core_sys_select(int n, fd_set __user *inp, fd_set __user *outp,
			   fd_set __user *exp, struct timespec *end_time)
{
    
    long stack_fds[SELECT_STACK_ALLOC/sizeof(long)];
    
    size = FDS_BYTES(n); 
    
    
    if (size >` sizeof(stack_fds) / 6)
		bits = kmalloc(6 * size, GFP_KERNEL);
    
    
    fds.in      = bits; 
	fds.out     = bits +   size; 
	fds.ex      = bits + 2*size; 
	fds.res_in  = bits + 3*size; 
	fds.res_out = bits + 4*size; 
	fds.res_ex  = bits + 5*size; 
    
    
    get_fd_set(n, inp, fds.in);
    get_fd_set(n, outp, fds.out);
    get_fd_set(n, exp, fds.ex);
    
    
	zero_fd_set(n, fds.res_in);
	zero_fd_set(n, fds.res_out);
	zero_fd_set(n, fds.res_ex);
    
    
    ret = do_select(n, &fds, end_time);
    
    
    set_fd_set(n, inp, fds.res_in);
    set_fd_set(n, outp, fds.res_out);
    set_fd_set(n, exp, fds.res_ex);
    
    return ret;
}
```

下面来看一看`do_select`函数

```cpp
int do_select(int n, fd_set_bits *fds, struct timespec *end_time)
{
    for (;;) {

        for (i = 0; i < n; ++rinp, ++routp, ++rexp)
            {
                for (j = 0; j < __NFDBITS; ++j, ++i, bit `<<= 1)
                    {

                        mask = (*f_op->`poll)(file, wait);


                        if ((mask & POLLIN_SET) && (in & bit)) {
                            res_in |= bit;
                            retval++;
                        }

                        if ((mask & POLLOUT_SET) && (out & bit)) {
                            res_out |= bit;
                            retval++;
                        }

                        if ((mask & POLLEX_SET) && (ex & bit)) {
                            res_ex |= bit;
                            retval++;
                        }
                    }
            }


        if (retval || timed_out || signal_pending(current))
            break;


        poll_schedule_timeout(&table, TASK_INTERRUPTIBLE, to, slack);
    }
}
```

do_select会遍历所有要监听的文件描述符，调用对应驱动程序的poll函数，驱动程序的poll一般实现如下

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

`p->qproc`在之前又被初始化为`__pollwait`

```cpp
static void __pollwait(struct file *filp, wait_queue_head_t *wait_address,
				poll_table *p)
{
    
    struct poll_table_entry *entry = poll_get_entry(pwq);
    
    
	add_wait_queue(wait_address, &entry->wait); 
}
```

由此可知，`do_select`中对每一个文件描述符调用`(*f_op->poll)(file, wait)`，是为每一个文件描述符申请一个等待队列元素，然后将其添加到对应驱动程序的等待队列中，等待条件满足时唤醒

我们再回到`do_select`函数里，第一遍遍历调用``(*f_op->poll)(file, wait)`是为了为每一个文件描述符申请一个等待队列元素，将其添加到对应驱动程序的等待队列中，然后会睡眠等待，当有条件满足时，对应的驱动会通过等待队列唤醒该进程，然后进行第二次遍历，此时得到一个掩码，然后设置好每一个文件描述符状态，退出

至此，select也就分析完了

### 1.3. 总结
select和poll的实现原理是一样的，只是select采用[bitmap](https://so.csdn.net/so/search?q=bitmap&spm=1001.2101.3001.7020)的方式来标记文件描述符，然后select 最不能忍受的是一个进程所打开的FD是有一定限制的，由FD_SETSIZE设置，默认值是1024

select会有两次遍历所有监听的文件描述符，第一次是将等待队列元素添加到对应驱动程序的等待队列中，然后调度，睡眠等待唤醒，第二次是当条件满足时，驱动程序会唤醒等待队列，然后select会进行第二次遍历，获取一个掩码，设置好每一个文件描述符的bitmap，然后再将结果拷贝回用户空间



> 来自: [Linux select内核源码剖析_linux select内核源码分析-CSDN博客](https://blog.csdn.net/weixin_42462202/article/details/95315926)
>





