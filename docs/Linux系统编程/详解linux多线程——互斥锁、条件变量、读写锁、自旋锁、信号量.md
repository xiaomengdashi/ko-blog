---
sidebar_position: 1
slug: /Linux系统编程/详解linux多线程——互斥锁、条件变量、读写锁、自旋锁、信号量
---

[  
](https://www.toutiao.com/c/user/token/MS4wLjABAAAAyQOkLlIcbpjOy_gf-_rOYO9ej45Wh5qRvqVGnSm-QdPNDmmpacu7Gm7QKYe1_8Dk/?source=tuwen_detail)

# 一、互斥锁（同步）
在多任务操作系统中，同时运行的多个任务可能都需要使用同一种资源。这个过程有点类似于，公司部门里，我在使用着打印机打印东西的同时（还没有打印完），别人刚好也在此刻使用打印机打印东西，如果不做任何处理的话，打印出来的东西肯定是错乱的。

在线程里也有这么一把锁——互斥锁（mutex），互斥锁是一种简单的加锁的方法来控制对共享资源的访问，互斥锁只有两种状态,即上锁( lock )和解锁( unlock )。

【互斥锁的特点】：

1. 原子性：把一个互斥量锁定为一个原子操作，这意味着操作系统（或pthread函数库）保证了如果一个线程锁定了一个互斥量，没有其他线程在同一时间可以成功锁定这个互斥量；

2. 唯一性：如果一个线程锁定了一个互斥量，在它解除锁定之前，没有其他线程可以锁定这个互斥量；

3. 非繁忙等待：如果一个线程已经锁定了一个互斥量，第二个线程又试图去锁定这个互斥量，则第二个线程将被挂起（不占用任何cpu资源），直到第一个线程解除对这个互斥量的锁定为止，第二个线程则被唤醒并继续执行，同时锁定这个互斥量。

【互斥锁的操作流程如下】：

1. 在访问共享资源后临界区域前，对互斥锁进行加锁；

2. 在访问完成后释放互斥锁导上的锁。在访问完成后释放互斥锁导上的锁；

3. 对互斥锁进行加锁后，任何其他试图再次对互斥锁加锁的线程将会被阻塞，直到锁被释放。对互斥锁进行加锁后，任何其他试图再次对互斥锁加锁的线程将会被阻塞，直到锁被释放。

```cpp
#include <pthread.h>
#include <time.h>
// 初始化一个互斥锁。
int pthread_mutex_init(pthread_mutex_t *mutex, 
						const pthread_mutexattr_t *attr);
// 对互斥锁上锁，若互斥锁已经上锁，则调用者一直阻塞，
// 直到互斥锁解锁后再上锁。
int pthread_mutex_lock(pthread_mutex_t *mutex);
// 调用该函数时，若互斥锁未加锁，则上锁，返回 0；
// 若互斥锁已加锁，则函数直接返回失败，即 EBUSY。
int pthread_mutex_trylock(pthread_mutex_t *mutex);
// 当线程试图获取一个已加锁的互斥量时，pthread_mutex_timedlock 互斥量
// 原语允许绑定线程阻塞时间。即非阻塞加锁互斥量。
int pthread_mutex_timedlock(pthread_mutex_t *restrict mutex,
const struct timespec *restrict abs_timeout);
// 对指定的互斥锁解锁。
int pthread_mutex_unlock(pthread_mutex_t *mutex);
// 销毁指定的一个互斥锁。互斥锁在使用完毕后，
// 必须要对互斥锁进行销毁，以释放资源。
int pthread_mutex_destroy(pthread_mutex_t *mutex);
```

## 【Demo】（阻塞模式）：
```cpp
//使用互斥量解决多线程抢占资源的问题
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
#include <string.h>
 
char* buf[5]; //字符指针数组  全局变量
int pos; //用于指定上面数组的下标
 
//1.定义互斥量
pthread_mutex_t mutex;
 
void *task(void *p)
{
    //3.使用互斥量进行加锁
    pthread_mutex_lock(&mutex);
 
    buf[pos] = (char *)p;
    sleep(1);
    pos++;
 
    //4.使用互斥量进行解锁
    pthread_mutex_unlock(&mutex);
}
 
int main(void)
{
    //2.初始化互斥量, 默认属性
    pthread_mutex_init(&mutex, NULL);
 
    //1.启动一个线程 向数组中存储内容
    pthread_t tid, tid2;
    pthread_create(&tid, NULL, task, (void *)"zhangfei");
    pthread_create(&tid2, NULL, task, (void *)"guanyu");
    //2.主线程进程等待,并且打印最终的结果
    pthread_join(tid, NULL);
    pthread_join(tid2, NULL);
 
    //5.销毁互斥量
    pthread_mutex_destroy(&mutex);
 
    int i = 0;
    printf("字符指针数组中的内容是：");
    for(i = 0; i < pos; ++i)
    {
        printf("%s ", buf[i]);
    }
    printf("\n");
    return 0;
}
```

## 【Demo】（非阻塞模式）：
```cpp
#include <stdio.h>
#include <pthread.h>
#include <time.h>
#include <string.h>
 
int main (void)
{
    int err;
    struct timespec tout;
    struct tm *tmp;
    char buf[64];
    pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
    
    pthread_mutex_lock (&lock);
    printf ("mutex is locked\n");
    clock_gettime (CLOCK_REALTIME, &tout);
    tmp = localtime (&tout.tv_sec); 
    strftime (buf, sizeof (buf), "%r", tmp);
    printf ("current time is %s\n", buf);
    tout.tv_sec += 10;
    err = pthread_mutex_timedlock (&lock, &tout);
    clock_gettime (CLOCK_REALTIME, &tout);
    tmp = localtime (&tout.tv_sec);
    strftime (buf, sizeof (buf), "%r", tmp);
    printf ("the time is now %s\n", buf);
    if (err == 0)
        printf ("mutex locked again\n");
    else 
        printf ("can`t lock mutex again:%s\n", strerror (err));
    return 0;
}
```



# 二、条件变量（同步）
与互斥锁不同，条件变量是用来等待而不是用来上锁的。条件变量用来自动阻塞一个线程，直 到某特殊情况发生为止。通常条件变量和互斥锁同时使用。

条件变量使我们可以睡眠等待某种条件出现。条件变量是利用线程间共享的全局变量进行同步 的一种机制，主要包括两个动作：

一个线程等待"条件变量的条件成立"而挂起；

另一个线程使 “条件成立”（给出条件成立信号）。

## 【原理】：
条件的检测是在互斥锁的保护下进行的。线程在改变条件状态之前必须首先锁住互斥量。如果一个条件为假，一个线程自动阻塞，并释放等待状态改变的互斥锁。如果另一个线程改变了条件，它发信号给关联的条件变量，唤醒一个或多个等待它的线程，重新获得互斥锁，重新评价条件。如果两进程共享可读写的内存，条件变量 可以被用来实现这两进程间的线程同步。

【条件变量的操作流程如下】：

1. 初始化：init()或者pthread_cond_tcond=PTHREAD_COND_INITIALIER；属性置为NULL；

2. 等待条件成立：pthread_wait，pthread_timewait.wait()释放锁,并阻塞等待条件变量为真 timewait()设置等待时间,仍未signal,返回ETIMEOUT(加锁保证只有一个线程wait)；

3. 激活条件变量：pthread_cond_signal,pthread_cond_broadcast(激活所有等待线程)

4. 清除条件变量：destroy;无线程等待,否则返回EBUSY清除条件变量:destroy;无线程等待,否则返回EBUSY

```cpp
#include <pthread.h>
// 初始化条件变量
int pthread_cond_init(pthread_cond_t *cond,
						pthread_condattr_t *cond_attr);
// 阻塞等待
int pthread_cond_wait(pthread_cond_t *cond,pthread_mutex_t *mutex);
// 超时等待
int pthread_cond_timewait(pthread_cond_t *cond,pthread_mutex *mutex,
						const timespec *abstime);
// 解除所有线程的阻塞
int pthread_cond_destroy(pthread_cond_t *cond);
// 至少唤醒一个等待该条件的线程
int pthread_cond_signal(pthread_cond_t *cond);
// 唤醒等待该条件的所有线程
int pthread_cond_broadcast(pthread_cond_t *cond);  
```

1、线程的条件变量实例1

Jack开着一辆出租车来到一个站点停车，看见没人就走了。过段时间，Susan来到站点准备乘车，但是没有来，于是就等着。过了一会Mike开着车来到了这个站点，Sunsan就上了Mike的车走了。如图所示：

![](/img/posts/c79d809006a9a85e65599abef4d2dd68.gif)

```cpp
#include <stdio.h>  
#include <stdlib.h>  
#include <unistd.h>  
#include <pthread.h>  
  
pthread_cond_t taxicond = PTHREAD_COND_INITIALIZER;  
pthread_mutex_t taximutex = PTHREAD_MUTEX_INITIALIZER;  
  
void *traveler_arrive(void *name)  
{  
    char *p = (char *)name;  
  
    printf ("Travelr: %s need a taxi now!\n", p);  
    // 加锁，把信号量加入队列，释放信号量
    pthread_mutex_lock(&taximutex);  
    pthread_cond_wait(&taxicond, &taximutex);  
    pthread_mutex_unlock(&taximutex);  
    printf ("traveler: %s now got a taxi!\n", p);  
    pthread_exit(NULL);  
}  
  
void *taxi_arrive(void *name)  
{  
    char *p = (char *)name;  
    printf ("Taxi: %s arrives.\n", p);
    // 给线程或者条件发信号，一定要在改变条件状态后再给线程发信号
    pthread_cond_signal(&taxicond);  
    pthread_exit(NULL);  
}  
  
int main (int argc, char **argv)  
{  
    char *name;  
    pthread_t thread;  
    pthread_attr_t threadattr; // 线程属性 
    pthread_attr_init(&threadattr);  // 线程属性初始化
  
    // 创建三个线程
    name = "Jack";  
    pthread_create(&thread, &threadattr, taxi_arrive, (void *)name);  
    sleep(1);  
    name = "Susan";  
    pthread_create(&thread, &threadattr, traveler_arrive, (void *)name);  
    sleep(1);  
    name = "Mike";  
    pthread_create(&thread, &threadattr, taxi_arrive, (void *)name);  
    sleep(1);  
  
    return 0;  
}
```

2、线程的条件变量实例2

Jack开着一辆出租车来到一个站点停车，看见没人就等着。过段时间，Susan来到站点准备乘车看见了Jack的出租车，于是就上去了。过了一会Mike开着车来到了这个站点，看见没人救等着。如图所示：

![](/img/posts/ecbcda96e3e5cd3f708f83c8c35040ff.gif)

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <pthread.h>
 
int travelercount = 0;
pthread_cond_t taxicond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t taximutex = PTHREAD_MUTEX_INITIALIZER;
 
void *traveler_arrive(void *name)
{
    char *p = (char *)name;
 
    pthread_mutex_lock(&taximutex);
 
    printf ("traveler: %s need a taxi now!\n", p);
    travelercount++;
    pthread_cond_wait(&taxicond, &taximutex);
            
    pthread_mutex_unlock(&taximutex);
    printf ("traveler: %s now got a taxi!\n", p);
    pthread_exit(NULL);
}
 
void *taxi_arrive(void *name)
{
    char *p = (char *)name;
    printf ("Taxi: %s arrives.\n", p);
    for(;;)
    {
        if(travelercount)
        {
            pthread_cond_signal(&taxicond);
            travelercount--;
            break;
        }
    }
    pthread_exit(NULL);
}
 
int main (int argc, char **argv)
{
    char *name;
    pthread_t thread;
    pthread_attr_t threadattr;
    pthread_attr_init(&threadattr);
 
    name = "Jack";
    pthread_create(&thread, &threadattr, taxi_arrive, name);
    sleep(1);
    name = "Susan";
    pthread_create(&thread, &threadattr, traveler_arrive, name);
    sleep(3);
    name = "Mike";
    pthread_create(&thread, &threadattr, taxi_arrive, name);
    sleep(4);
 
    return 0;
}
```

# 三、虚假唤醒(spurious wakeup)
虚假唤醒(spurious wakeup)在采用条件等待时：

```cpp
while(条件不满足)
{  
   condition_wait(cond, mutex);  
}  
// 而不是:  
If( 条件不满足 )
{  
   Condition_wait(cond,mutex);  
}   
```

这是因为可能会存在虚假唤醒”spurious wakeup”的情况。

也就是说，即使没有线程调用condition_signal, 原先调用condition_wait的函数也可能会返回。此时线程被唤醒了，但是条件并不满足，这个时候如果不对条件进行检查而往下执行，就可能会导致后续的处理出现错误。

虚假唤醒在linux的多处理器系统中/在程序接收到信号时可能回发生。在Windows系统和JAVA虚拟机上也存在。在系统设计时应该可以避免虚假唤醒，但是这会影响条件变量的执行效率，而既然通过while循环就能避免虚假唤醒造成的错误，因此程序的逻辑就变成了while循环的情况。

# 四、读写锁（同步）
读写锁与互斥量类似，不过读写锁允许更改的并行性，也叫共享互斥锁。互斥量要么是锁住状态，要么就是不加锁状态，而且一次只有一个线程可以对其加锁。读写锁可以有3种状态：读模式下加锁状态、写模式加锁状态、不加锁状态。

一次只有一个线程可以占有写模式的读写锁，但是多个线程可以同时占有读模式的读写锁（允许多个线程读但只允许一个线程写）。

---

【读写锁的特点】：

如果有其它线程读数据，则允许其它线程执行读操作，但不允许写操作；

如果有其它线程写数据，则其它线程都不允许读、写操作。

---

【读写锁的规则】：

如果某线程申请了读锁，其它线程可以再申请读锁，但不能申请写锁；

如果某线程申请了写锁，其它线程不能申请读锁，也不能申请写锁。

读写锁适合于对数据结构的读次数比写次数多得多的情况。

---

```cpp
#include <pthread.h>
// 初始化读写锁
int pthread_rwlock_init(pthread_rwlock_t *rwlock, 
						const pthread_rwlockattr_t *attr); 
// 申请读锁
int pthread_rwlock_rdlock(pthread_rwlock_t *rwlock ); 
// 申请写锁
int pthread_rwlock_wrlock(pthread_rwlock_t *rwlock ); 
// 尝试以非阻塞的方式来在读写锁上获取写锁，
// 如果有任何的读者或写者持有该锁，则立即失败返回。
int pthread_rwlock_trywrlock(pthread_rwlock_t *rwlock); 
// 解锁
int pthread_rwlock_unlock (pthread_rwlock_t *rwlock); 
// 销毁读写锁
int pthread_rwlock_destroy(pthread_rwlock_t *rwlock);
```

【Demo】：

```cpp
// 一个使用读写锁来实现 4 个线程读写一段数据是实例。
// 在此示例程序中，共创建了 4 个线程，
// 其中两个线程用来写入数据，两个线程用来读取数据
#include <stdio.h>  
#include <unistd.h>  
#include <pthread.h>  
pthread_rwlock_t rwlock; //读写锁  
int num = 1;  
  
//读操作，其他线程允许读操作，却不允许写操作  
void *fun1(void *arg)  
{  
    while(1)  
    {  
        pthread_rwlock_rdlock(&rwlock);
        printf("read num first == %d\n", num);
        pthread_rwlock_unlock(&rwlock);
        sleep(1);
    }
}
  
//读操作，其他线程允许读操作，却不允许写操作  
void *fun2(void *arg)
{
    while(1)
    {
        pthread_rwlock_rdlock(&rwlock);
        printf("read num second == %d\n", num);
        pthread_rwlock_unlock(&rwlock);
        sleep(2);
    }
}
 
//写操作，其它线程都不允许读或写操作  
void *fun3(void *arg)
{
    while(1)
    {
        pthread_rwlock_wrlock(&rwlock);
        num++;
        printf("write thread first\n");
        pthread_rwlock_unlock(&rwlock);
        sleep(2);
    }
}
 
//写操作，其它线程都不允许读或写操作  
void *fun4(void *arg)
{
    while(1)
    {  
        pthread_rwlock_wrlock(&rwlock);  
        num++;  
        printf("write thread second\n");  
        pthread_rwlock_unlock(&rwlock);  
        sleep(1);  
    }  
}  
  
int main()  
{  
    pthread_t ptd1, ptd2, ptd3, ptd4;  
      
    pthread_rwlock_init(&rwlock, NULL);//初始化一个读写锁  
      
    //创建线程  
    pthread_create(&ptd1, NULL, fun1, NULL);  
    pthread_create(&ptd2, NULL, fun2, NULL);  
    pthread_create(&ptd3, NULL, fun3, NULL);  
    pthread_create(&ptd4, NULL, fun4, NULL);  
      
    //等待线程结束，回收其资源  
    pthread_join(ptd1, NULL);  
    pthread_join(ptd2, NULL);  
    pthread_join(ptd3, NULL);  
    pthread_join(ptd4, NULL);  
      
    pthread_rwlock_destroy(&rwlock);//销毁读写锁  
      
    return 0;  
}  
```

# 五、自旋锁（同步）
自旋锁与互斥量功能一样，唯一一点不同的就是互斥量阻塞后休眠让出cpu，而自旋锁阻塞后不会让出cpu，会一直忙等待，直到得到锁。

自旋锁在用户态使用的比较少，在内核使用的比较多！自旋锁的使用场景：锁的持有时间比较短，或者说小于2次上下文切换的时间。

自旋锁在用户态的函数接口和互斥量一样，把pthread_mutex_xxx()中mutex换成spin，如：pthread_spin_init()。

# 六、信号量（同步与互斥）
信号量广泛用于进程或线程间的同步和互斥，信号量本质上是一个非负的整数计数器，它被用来控制对公共资源的访问。

编程时可根据操作信号量值的结果判断是否对公共资源具有访问的权限，当信号量值大于 0 时，则可以访问，否则将阻塞。PV 原语是对信号量的操作，一次 P 操作使信号量减１，一次 V 操作使信号量加１。

```cpp
#include <semaphore.h>
// 初始化信号量
int sem_init(sem_t *sem, int pshared, unsigned int value);
// 信号量 P 操作（减 1）
int sem_wait(sem_t *sem);
// 以非阻塞的方式来对信号量进行减 1 操作
int sem_trywait(sem_t *sem);
// 信号量 V 操作（加 1）
int sem_post(sem_t *sem);
// 获取信号量的值
int sem_getvalue(sem_t *sem, int *sval);
// 销毁信号量
int sem_destroy(sem_t *sem);
```

## 【信号量用于同步】：
![](/img/posts/87a2e1c7ff31221ce061ebca95e4ca5c.png)

```cpp
// 信号量用于同步实例
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
 
sem_t sem_g,sem_p;   //定义两个信号量
char ch = 'a';
 
void *pthread_g(void *arg)  //此线程改变字符ch的值
{
    while(1)
    {
        sem_wait(&sem_g);
        ch++;
        sleep(1);
        sem_post(&sem_p);
    }
}
 
void *pthread_p(void *arg)  //此线程打印ch的值
{
    while(1)
    {
        sem_wait(&sem_p);
        printf("%c",ch);
        fflush(stdout);
        sem_post(&sem_g);
    }
}
 
int main(int argc, char *argv[])
{
    pthread_t tid1,tid2;
    sem_init(&sem_g, 0, 0); // 初始化信号量为0
    sem_init(&sem_p, 0, 1); // 初始化信号量为1
    
    // 创建两个线程
    pthread_create(&tid1, NULL, pthread_g, NULL);
    pthread_create(&tid2, NULL, pthread_p, NULL);
    
    // 回收线程
    pthread_join(tid1, NULL);
    pthread_join(tid2, NULL);
    
    return 0;
}
```

## 【信号量用于互斥】：
![](/img/posts/7fc6a143f770037a7a5439181aa5846e.png)

```cpp
// 信号量用于互斥实例
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
#include <semaphore.h>
 
sem_t sem; //信号量
 
void printer(char *str)
{
    sem_wait(&sem);//减一，p操作
    while(*str) // 输出字符串（如果不用互斥，此处可能会被其他线程入侵）
    {
        putchar(*str);  
        fflush(stdout);
        str++;
        sleep(1);
    }
    printf("\n");
    
    sem_post(&sem);//加一，v操作
}
 
void *thread_fun1(void *arg)
{
    char *str1 = "hello";
    printer(str1);
}
 
void *thread_fun2(void *arg)
{
    char *str2 = "world";
    printer(str2);
}
 
int main(void)
{
    pthread_t tid1, tid2;
    
    sem_init(&sem, 0, 1); //初始化信号量，初始值为 1
    
    //创建 2 个线程
    pthread_create(&tid1, NULL, thread_fun1, NULL);
    pthread_create(&tid2, NULL, thread_fun2, NULL);
    
    //等待线程结束，回收其资源
    pthread_join(tid1, NULL);
    pthread_join(tid2, NULL); 
    
    sem_destroy(&sem); //销毁信号量
    
    return 0;
}
```

[原文链接](https://www.toutiao.com/a6850002300325347843/?log_from=5f73e86eb2ad_1632848827300)

