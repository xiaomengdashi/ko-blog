---
sidebar_position: 3
slug: /Linux系统编程/进程间通信-IPC/内存映射-mmap
---

[Linux](https://subingwen.cn/categories/Linux/)[C语言](https://subingwen.cn/tags/C%E8%AF%AD%E8%A8%80/)[多进程](https://subingwen.cn/tags/%E5%A4%9A%E8%BF%9B%E7%A8%8B/)2021-02-052023-04-06

## 1. 创建内存映射区
如果想要实现进程间通信，可以通过函数创建一块内存映射区，和管道不同的是管道对应的内存空间在内核中，而内存映射区对应的内存空间在进程的用户区（用于加载动态库的那个区域），也就是说`进程间通信使用的内存映射区不是一块，而是在每个进程内部都有一块`。

由于每个进程的地址空间是独立的，各个进程之间也不能直接访问对方的内存映射区，需要通信的进程需要将各自的内存映射区和同一个磁盘文件进行映射，这样进程之间就可以通过磁盘文件这个唯一的桥梁完成数据的交互了。

![](/img/posts/c4dc7097a29248223774bfe1b272f00e.png)

如上图所示：`磁盘文件数据可以完全加载到进程的内存映射区也可以部分加载到进程的内存映射区，当进程A中的内存映射区数据被修改了，数据会被自动同步到磁盘文件，同时和磁盘文件建立映射关系的其他进程内存映射区中的数据也会和磁盘文件进行数据的实时同步，这个同步机制保障了各个进程之间的数据共享。`

使用内存映射区既可以进程有血缘关系的进程间通信也可以进程没有血缘关系的进程间通信。创建内存映射区的函数原型如下：

```c
#include `<sys/mman.h>`
// 创建内存映射区
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
```

+ 参数:
    - addr: 从动态库加载区的什么位置开始创建内存映射区，一般指定为NULL, 委托内核分配
        * length: 创建的内存映射区的大小（单位：字节），实际上这个大小是按照4k的整数倍去分配的
        * prot: 对内存映射区的操作权限
            + PROT_READ: 读内存映射区
            + PROT_WRITE: 写内存映射区
            + 如果要对映射区有读写权限: PROT_READ | PROT_WRITE
    - flags:
        * MAP_SHARED: 多个进程可以共享数据，进行映射区数据同步	
        * MAP_PRIVATE: 映射区数据是私有的，不能同步给其他进程
    - fd: 文件描述符, 对应一个打开的磁盘文件，内存映射区通过这个文件描述符和磁盘文件建立关联
    - offset: 磁盘文件的偏移量，文件从偏移到的位置开始进行数据映射，使用这个参数需要注意两个问题：
        * 偏移量必须是4k的整数倍, 写0代表不偏移
        * 这个参数必须是大于 0 的
+ 返回值:
    - 成功: 返回一个内存映射区的起始地址
    - 失败: `MAP_FAILED` (that is, (void *) -1)

> mmap() 函数的参数相对较多，在使用该函数创建用于进程间通信的内存映射区的时候，各参数的指定都有一些注意事项，具体如下：
>

```c
1. 第一个参数 addr 指定为 NULL 即可
2. 第二个参数 length 必须要 > 0
    3. 第三个参数 prot，进程间通信需要对内存映射区有读写权限，因此需要指定为：PROT_READ | PROT_WRITE
4. 第四个参数 flags，如果要进行进程间通信, 需要指定 MAP_SHARED
5. 第五个参数 fd，打开的文件必须大于0，进程间通信需要文件操作权限和映射区操作权限相同
     - 内存映射区创建成功之后, 关闭这个文件描述符不会影响进程间通信
6. 第六个参数 offset，不偏移指定为0，如果偏移必须是4k的整数倍
```

内存映射区使用完之后也需要释放，释放函数原型如下：

```c
int munmap(void *addr, size_t length);
```

+ 参数:
    - addr: mmap()的返回值, 创建的内存映射区的起始地址
    - length: 和mmap()第二个参数相同即可
+ 返回值：函数调用成功返回 0，失败返回 -1

## 2. 进程间通信
操作内存映射区和操作管道是不一样的，得到内存映射区之后是直接对内存地址进行操作，管道是通过文件描述符读写队列中的数据，管道的读写是阻塞的，内存映射区的读写是非阻塞的。内存映射区创建成功之后，得到了映射区内存的起始地址，使用相关的内存操作函数读写数据就可以了。

### 2.1. 有血缘关系
由于创建子进程会发生虚拟地址空间的复制，那么在父进程中创建的内存映射区也会被复制到子进程中，这样在子进程里边就可以直接使用这块内存映射区了，所以对于有血缘关系的进程，进行进程间通信是非常简单的，处理代码如下：

```c
/*
    1. 先创建内存映射区, 得到一个起始地址, 假设使用ptr指针保存这个地址
    2. 通过fork() 创建子进程 -> 子进程中也就有一个内存映射区, 子进程中也有一个ptr指针指向这个地址
    3. 父进程往自己的内存映射区写数据, 数据同步到了磁盘文件中, 磁盘文件数据又同步到子进程的映射区中
       子进程从自己的映射区往外读数据, 这个数据就是父进程写的
*/
```

```c
#include `<sys/mman.h>`
#include `<fcntl.h>`

int main()
{
    // 1. 打开一个磁盘文件
    int fd = open("./english.txt", O_RDWR);
    // 2. 创建内存映射区
    void* ptr = mmap(NULL, 4000, PROT_READ|PROT_WRITE,
                     MAP_SHARED, fd, 0);
    if(ptr == MAP_FAILED)
    {
        perror("mmap");
        exit(0);
    }

    // 3. 创建子进程
    pid_t pid = fork();
    if(pid > 0)
    {
        // 父进程, 写数据
        const char* pt = "我是你爹, 你是我儿子吗???";
        memcpy(ptr, pt, strlen(pt)+1);
    }
    else if(pid == 0)
    {
        // 子进程, 读数据
        usleep(1);	// 内存映射区不阻塞, 为了让子进程读出数据
        printf("从映射区读出的数据: %s\n", (char*)ptr);
    }

    // 释放内存映射区
    munmap(ptr, 4000);

    return 0;
}
```

## 3. 没有血缘关系
对于没有血缘关系的进程间通信，需要在每个进程中分别创建内存映射区，但是这些进程的内存映射区必须要关联相同的磁盘文件，这样才能实现进程间的数据同步。

> 进程A的测试代码:
>

```c
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<unistd.h>`
#include `<string.h>`
#include `<sys/mman.h>`
#include `<fcntl.h>`

int main()
{
    // 1. 打开一个磁盘文件
    int fd = open("./english.txt", O_RDWR);
    // 2. 创建内存映射区
    void* ptr = mmap(NULL, 4000, PROT_READ|PROT_WRITE,
                     MAP_SHARED, fd, 0);
    if(ptr == MAP_FAILED)
    {
        perror("mmap");
        exit(0);
    }

    const char* pt = "==================我是你爹, 你是我儿子吗???****************";
    memcpy(ptr, pt, strlen(pt)+1);

    // 释放内存映射区
    munmap(ptr, 4000);

    return 0;
}
```

> 进程B的测试代码:
>

```c
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<unistd.h>`
#include `<string.h>`
#include `<sys/mman.h>`
#include `<fcntl.h>`

int main()
{
    // 1. 打开一个磁盘文件
    int fd = open("./english.txt", O_RDWR);
    // 2. 创建内存映射区
    void* ptr = mmap(NULL, 4000, PROT_READ|PROT_WRITE,
                     MAP_SHARED, fd, 0);
    if(ptr == MAP_FAILED)
    {
        perror("mmap");
        exit(0);
    }

    // 读内存映射区
    printf("从映射区读出的数据: %s\n", (char*)ptr);

    // 释放内存映射区
    munmap(ptr, 4000);

    return 0;
}
```

## 4. 拷贝文件
使用内存映射区除了可以实现进程间通信，也可以进行文件的拷贝，使用这种方式拷贝文件可以减少程序猿的工作量，我们只需要负责创建内存映射区和打开磁盘文件，关于文件中的数据读写就无需关心了。

使用内存映射区拷贝文件思路：

1. 打开被拷贝文件，得到文件描述符 fd1，并计算出这个文件的大小 size
2. 创建内存映射区A并且和被拷贝文件关联，也就是和fd1关联起来，得到映射区地址 ptrA
3. 创建新文件，得到文件描述符 fd2，用于存储被拷贝的数据，并且将这个文件大小拓展为 size
4. 创建内存映射区B并且和新创建的文件关联，也就是和fd2关联起来，得到映射区地址 ptrB
5. 进程地址空间之间的数据拷贝，memcpy（ptrB， ptrA，size），数据自动同步到新建文件中
6. 关闭内存映射区

文件拷贝示例代码如下：

```c
#include `<stdio.h>`
#include `<stdlib.h>`
#include `<unistd.h>`
#include `<string.h>`
#include `<fcntl.h>`
#include `<sys/mman.h>`

int main()
{
    // 1. 打开一个操盘文件english.txt得到文件描述符
    int fd = open("./english.txt", O_RDWR);
    // 计算文件大小
    int size = lseek(fd, 0, SEEK_END);

    // 2. 创建内存映射区和english.txt进行关联, 得到映射区起始地址
    void* ptrA = mmap(NULL, size, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
    if(ptrA == MAP_FAILED)
    {
        perror("mmap");
        exit(0);
    }

    // 3. 创建一个新文件, 存储拷贝的数据
    int fd1 = open("./copy.txt", O_RDWR|O_CREAT, 0664);
    // 拓展这个新文件
    ftruncate(fd1, size);

    // 4. 创建一个映射区和新文件进行关联, 得到映射区的起始地址second
    void* ptrB = mmap(NULL, size, PROT_READ|PROT_WRITE, MAP_SHARED, fd1, 0);
    if(ptrB == MAP_FAILED)
    {
        perror("mmap----");
        exit(0);
    }
    // 5. 使用memcpy拷贝映射区数据
    // 这两个指针指向两块内存, 都是内存映射区
    // 指针指向有效的内存, 拷贝的是内存中的数据
    memcpy(ptrB, ptrA, size);

    // 6. 释放内存映射区
    munmap(ptrA, size);
    munmap(ptrB, size);
    close(fd);
    close(fd1);

    return 0;
}
```

  


> 来自: [内存映射(mmap) | 爱编程的大丙](https://subingwen.cn/linux/mmap/)
>

