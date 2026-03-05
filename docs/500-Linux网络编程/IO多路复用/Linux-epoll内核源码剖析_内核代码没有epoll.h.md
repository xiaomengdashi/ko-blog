---
sidebar_position: 6
slug: /Linux网络编程/IO多路复用/Linux-epoll内核源码剖析_内核代码没有epoll.h
---

---
title: Linux epoll内核源码剖析_内核代码没有epoll.h-CSDN博客
date: '2025-06-19 02:01:51'
updated: '2025-06-19 02:03:13'
slug: /Linux网络编程/IO多路复用/Linux-epoll内核源码剖析_内核代码没有epoll.h
**IO多路复用接口Linux内核源码剖析，源码之前，了无秘密**

[Linux poll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95241700)

[Linux select内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95315926)

[Linux epoll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95377075)

## 1. Linux[epoll](https://so.csdn.net/so/search?q=epoll&spm=1001.2101.3001.7020)内核源码剖析
#### 1.0.1. 文章目录
+ [Linux epoll内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95377075#Linux_epoll_9)
    - [epoll应用程序编写](https://blog.csdn.net/weixin_42462202/article/details/95377075#epoll_17)
    - [epoll机制内核源码剖析](https://blog.csdn.net/weixin_42462202/article/details/95377075#epoll_132)
        * [epoll_create](https://blog.csdn.net/weixin_42462202/article/details/95377075#epoll_create_136)
        * [epoll_ctl](https://blog.csdn.net/weixin_42462202/article/details/95377075#epoll_ctl_201)
        * [epoll_wait](https://blog.csdn.net/weixin_42462202/article/details/95377075#epoll_wait_352)
    - [总结](https://blog.csdn.net/weixin_42462202/article/details/95377075#_504)

前面介绍了select/poll，此文章将讲解epoll，epoll是select/poll的增强版，epoll更加高效，当然也更加复杂 

epoll高效的一个重要的原因是在获取事件的时候，它无须遍历整个被侦听的描述符集，只要遍历那些被内核IO事件异步唤醒而加入Ready队列的描述符集合就可以

本文将先讲解如何使用epoll，然后再深入Linux内核源码分析epoll机制

### 1.1. epoll应用程序编写
epoll机制提供了三个系统调用`epoll_create`、`epoll_ctl`、`epoll_wait`

下面是这三个函数的原型

+ epoll_create

```cpp
int epoll_create(int size);
```

此函数返回一个epoll的文件描述符

+ epoll_ctl

```cpp
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

此函数是添加、删除、修改事件

epfd：epoll的文件描述符

op：表示选项，EPOLL_CTL_ADD(添加事件)、EPOLL_CTL_MOD(修改事件)、EPOLL_CTL_DEL(删除事件)

fd：要操作的文件描述符

event：事件信息

+ epoll_wait

```cpp
int epoll_wait(int epfd, struct epoll_event *events,
int maxevents, int timeout);
```

此函数是等待条件满足，放回值为准备就绪的事件数

epfd：epoll的文件描述符

events：返回的事件信息

maxevents：要等待的最大事件数

timeout：超时时间

    - epoll_event

```cpp
struct epoll_event
{
uint32_t events;		
epoll_data_t data; 	
};
```

**demo**

下面这段代码，监听标准输入，当标准输入可读时，就打印读取到的信息

```cpp
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<sys/epoll.h>`

#define MAX_EVENTS 10

int main(int argc, char* argv[])
{
    struct epoll_event ev, events[MAX_EVENTS];
    int nfds, epollfd, len;
    char buf[1024];
    int n;

    epollfd = epoll_create(10);
    if (epollfd == -1)
    {
        perror("epoll_create");
        exit(-1);
    }

    ev.events = EPOLLIN;
    ev.data.fd = 0;
    if (epoll_ctl(epollfd, EPOLL_CTL_ADD, 0, &ev) == -1)
    {
        perror("epoll_ctl: listen_sock");
        exit(-1);
    }

    while(1)
        {
            nfds = epoll_wait(epollfd, events, MAX_EVENTS, -1);
            if (nfds == -1) 
            {
                perror("epoll_pwait");
                exit(-1);
            }

            for (n = 0; n < nfds; ++n)
                {
                    if(events[n].events & EPOLLIN)
                    {
                        len = read(events[n].data.fd, buf, 1024);
                        buf[len] = '\0';
                        printf("fd:%d; read buf:%s\n", events[n].data.fd, buf);
                    }
                }
        }

    return 0;
}
```

### 1.2. epoll机制内核源码剖析
由上面的应用程序可知，epoll机制有三个系统调用，分别为`epoll_create`、`epoll_ctl`、`epoll_wait`，下面将详细地来分析这三个系统调用

#### 1.2.1. epoll_create
epoll_create对应地系统调用如下

```cpp
SYSCALL_DEFINE1(epoll_create, int, size)
```

展开后变成

```cpp
long sys_epoll_create(int size)
```

接下来看看epoll_create做了什么事情

```cpp
SYSCALL_DEFINE1(epoll_create, int, size)
{
    if (size <= 0)
        return -EINVAL;

    return sys_epoll_create1(0);
}
```

由上面的程序可以看出，指定size并没有什么作用，只是判断是否小于等于0而已

下面看一看`sys_epoll_create1`

```cpp
SYSCALL_DEFINE1(epoll_create1, int, flags)
{
    struct eventpoll *ep = NULL;

    ep_alloc(&ep); 


    error = anon_inode_getfd("[eventpoll]", &eventpoll_fops, ep,
        O_RDWR | (flags & O_CLOEXEC));


    return error;
}
```

`eventpoll`起到管理epoll事件的作用，这个结果贯穿整个epoll机制，下面来看看这个结构体

```cpp
struct eventpoll {
    
	wait_queue_head_t wq;
	
    
    struct list_head rdllist;
    
    
    struct rb_root rbr;
    
   	...
};
```

epoll_create的作用是申请一个eventpoll结构体，申请一个epoll文件描述符，然后放回到用户空间

#### 1.2.2. epoll_ctl
epoll_ctl用于添加，删除，修改事件

对应的系统调用如下

```cpp
SYSCALL_DEFINE4(epoll_ctl, int, epfd, int, op, int, fd,
		struct epoll_event __user *, event)
```

展开后得到

```cpp
long sys_epoll_ctl(int epfd, int op, int fd, struct epoll_event __user * event)
```

下面来详细分析

```cpp
SYSCALL_DEFINE4(epoll_ctl, int, epfd, int, op, int, fd,
struct epoll_event __user *, event)
{
    struct eventpoll *ep;
    struct epitem *epi;
    struct epoll_event epds;

    copy_from_user(&epds, event, sizeof(struct epoll_event)); 

    switch (op) {
        case EPOLL_CTL_ADD: 
            ep_insert(ep, &epds, tfile, fd);
            break;
        case EPOLL_CTL_DEL: 
            ep_remove(ep, epi);
            break;
        case EPOLL_CTL_MOD: 
            ep_modify(ep, epi, &epds);
            break;
    }

}
```

在这里主要分析`ep_insert`添加事件，在分析之前，先将一下`epitem`，epoll在内核实现的时候，事件是以`epitem`为单位，保存到红黑树的，下面看一看`epitem`结构体

```cpp
struct epitem {
    struct rb_node rbn; 
    struct list_head rdllink; 
    struct eventpoll *ep; 
    struct epoll_event event; 
};
```

好，接下来分析`ep_insert`

```cpp
static int ep_insert(struct eventpoll *ep, struct epoll_event *event,
		     struct file *tfile, int fd)
{
    struct epitem *epi;
    struct ep_pqueue epq; 
    
    epi = kmem_cache_alloc(epi_cache, GFP_KERNEL); 
    epi->ep = ep; 
    epi->event = *event; 
    
    
    init_poll_funcptr(&epq.pt, ep_ptable_queue_proc);
    
    
    tfile->f_op->poll(tfile, &epq.pt);
    
    
    ep_rbtree_insert(ep, epi);
}
```

+ ep_pqueue

```cpp
struct ep_pqueue {
	poll_table pt; 
	struct epitem *epi; 
};
```

下面分析上面的`tfile->f_op->poll(tfile, &epq.pt)`

一般驱动程序的poll实现如下

```cpp
static unsigned int poll(struct file *fp, poll_table * wait)
{
	unsigned int mask = 0;

    
	poll_wait(fp, &wq, wait); 

	
	if(condition)
		mask |= POLLIN; 

	return mask;
}
```

看一看`poll_wait`什么内容

```cpp
static inline void poll_wait(struct file * filp, wait_queue_head_t * wait_address, poll_table *p)
{
	if (p && wait_address)
		p->qproc(filp, wait_address, p);
}
```

调用了`p->qproc(filp, wait_address, p)`函数，还记得上面程序将其初始化`init_poll_funcptr(&epq.pt, ep_ptable_queue_proc)`吗

```cpp
static void ep_ptable_queue_proc(struct file *file, wait_queue_head_t *whead,
				 poll_table *pt)
{
    struct epitem *epi = ep_item_from_epqueue(pt); 
    struct eppoll_entry *pwq; 
    
    pwq = kmem_cache_alloc(pwq_cache, GFP_KERNEL)； 
        
    
    init_waitqueue_func_entry(&pwq->wait, ep_poll_callback);
    pwq->base = epi; 
    add_wait_queue(whead, &pwq->wait); 
}
```

+ eppoll_entry

```cpp
struct eppoll_entry {
	struct epitem *base; 
    wait_queue_t wait; 
    wait_queue_head_t *whead; 
};
```

回到`ep_insert`函数，我们可知道`tfile->f_op->poll(tfile, &epq.pt)`做了什么事情

+ 1、添加等待队列元素到驱动的等待队列中
+ 2、初始化驱动唤醒等待队列时调用的函数，init_waitqueue_func_entry(&pwq->wait, ep_poll_callback)

#### 1.2.3. epoll_wait
epoll_wait对应的系统调用如下

```cpp
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events,
		int, maxevents, int, timeout)
```

展开后变成

```cpp
long sys_epoll_wait(int epfd, struct epoll_event __user * events, int maxevents, int timeout)
```

下面来详细分析

```cpp
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events,
		int, maxevents, int, timeout)
{
	ep_poll(ep, events, maxevents, timeout);
}
```

```cpp
static int ep_poll(struct eventpoll *ep, struct epoll_event __user *events,
		   int maxevents, long timeout)
{
	init_waitqueue_entry(&wait, current); 
    __add_wait_queue_exclusive(&ep->wq, &wait); 
    
    for (;;) {
    	set_current_state(TASK_INTERRUPTIBLE); 
        
        
        if (!list_empty(&ep->rdllist) || timed_out)
            break;
    
        
    	schedule_hrtimeout_range(to, slack, HRTIMER_MODE_ABS);
    }
    
    
    set_current_state(TASK_RUNNING);

    
	ep_send_events(ep, events, maxevents));

    
	return res;
}
```

当ep_poll调用`schedule_hrtimeout_range`的时候，会睡眠等待，直到驱动程序调用`wake_up`唤醒等待队列时，会再次醒过来，而`wake_up`的实现如下

```cpp
...
wait_queue_t *curr;
curr->func(curr, mode, wake_flags, key)
...
```

会调用等待队列中的等待元素的func函数，epoll添加到驱动程序的等待队列的等待元素的func已经被初始化`init_waitqueue_func_entry(&pwq->wait, ep_poll_callback)`

下面来分析`ep_poll_callback`函数，来看看驱动程序是怎么唤醒进程的

```cpp
static int ep_poll_callback(wait_queue_t *wait, unsigned mode, int sync, void *key)
{
    struct epitem *epi = ep_item_from_wait(wait); 
    struct eventpoll *ep = epi->ep; 
    
    list_add_tail(&epi->rdllink, &ep->rdllist); 
    
    wake_up_locked(&ep->wq); 
}
```

唤醒之后，继续回到`ep_poll`函数运行，此时会判断`if (!list_empty(&ep->rdllist) || timed_out)`就绪链表不为空，则退出循环，然后调用`ep_send_events(ep, events, maxevents)`来获取就绪链表中的epoll项的状态，接下来分析`ep_send_events(ep, events, maxevents))`

```cpp
static int ep_send_events(struct eventpoll *ep,
			  struct epoll_event __user *events, int maxevents)
{
	struct ep_send_events_data esed;

	esed.maxevents = maxevents;
	esed.events = events;

	return ep_scan_ready_list(ep, ep_send_events_proc, &esed);
}
```

```cpp
static int ep_scan_ready_list(struct eventpoll *ep,
			      int (*sproc)(struct eventpoll *,
					   struct list_head *, void *),
			      void *priv)
{
    LIST_HEAD(txlist); 
    
    list_splice_init(&ep->rdllist, &txlist); 
    
    error = (*sproc)(ep, &txlist, priv); 
    
    return error; 
}
```

下面来分析`ep_send_events_proc`函数

```cpp
static int ep_send_events_proc(struct eventpoll *ep, struct list_head *head,
			       void *priv)
{
    struct ep_send_events_data *esed = priv; 
    
    unsigned int revents;
    struct epitem *epi;
    struct epoll_event __user *uevent;

    
    for(...)
    {
        epi = list_first_entry(head, struct epitem, rdllink);
		list_del_init(&epi->rdllink);
        
        
        revents = epi->ffd.file->f_op->poll(epi->ffd.file, NULL) & epi->event.events;
    
        
    	__put_user(revents, &uevent->events);
        __put_user(epi->event.data, &uevent->data);
        
        eventcnt++;
        uevent++;
    }
    
    return eventcnt; 
}
```

到这里可以知道`ep_poll`函数做了什么事情

+ 1、定义一个等待队列元素，添加到eventpoll的等待队列中，等待唤醒
+ 2、当IO准备就绪时，驱动程序会调用回调函数，将就绪的epoll项添加到就绪链表中，并唤醒eventpoll的等待队列
+ 3、继续运行`ep_poll`函数，发现就绪链表中有元素，则跳出循环
+ 4、调用`ep_send_events`函数，调用就绪的epoll项对应驱动程序的poll函数，得到状态，然后再返回到应用层

至此，epoll也就分析完了

### 1.3. 总结
epoll是select/poll的增强版，select/epoll是采用轮询的方式，而epoll是通过回调，然后将就绪的IO添加到就绪链表，然后只查询这些就绪的IO状态，从而大大减少不必要的操作，所以在IO数量较多时，epoll的性能优于select/poll



> 来自: [Linux epoll内核源码剖析_内核代码没有epoll.h-CSDN博客](https://blog.csdn.net/weixin_42462202/article/details/95377075)
>





