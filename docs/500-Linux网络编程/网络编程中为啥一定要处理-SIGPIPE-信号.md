---
sidebar_position: 4
slug: /Linux网络编程/网络编程中为啥一定要处理-SIGPIPE-信号
---

---
title: 网络编程中为啥一定要处理 SIGPIPE 信号？
date: '2025-01-11 14:04:19'
updated: '2025-01-11 18:10:46'
slug: /Linux网络编程/网络编程中为啥一定要处理-SIGPIPE-信号-
就在前几天，我们在灰度上线时遇到了一个服务程序闪退的问题。最后排查的结果是因为一个小小的网络 SIGPIPE 信号导致的这个严重问题。

今天，我就用一篇文章来介绍下 SIGPIPE 信号是如何发生的、为啥该信号会导致进程的闪退、遇到这种问题该如何解决。

让我们开启今天的内核原理学习之旅！

### 1. 故障背景
我们对某个核心 Go 服务进行了 Rust 重构。由于源码太多，全部重构又不太现实。所以我们采用的方案是将部分代码用 Rust 重构掉。在服务进程中，Go 和 Rust 通过 cgo 进行通信。

但该新服务在线上遇到了崩溃的问题。而且崩溃还不是因为它自己，而是它依赖的另一个业务进程热升级的时候出现的。只要对该依赖热升级，就会导致该新服务崩溃退出，进而导致线上 SLA 出现较为严重的下降。

好在是灰度阶段，影响不大。当时临时禁止热升级后规避了这个问题。但服务进程有概率崩溃终究可不是小事，万一哪天谁不知道，一把线上梭哈升级那可就完犊子了。于是我立即停下了所有手头的工作，帮大伙儿开始排查这个问题。

遇到这种问题，大家第一反应是看日志。但不幸的是在业务日志中没有找到任何线索。然后我的思路是找 coredump 文件单步调试一下，看看崩溃发生在代码的哪一行，结果发现这次崩溃连 core 文件都没有留下，悄无声息的就消失了。

经过七七四十九小时的激情排查后，最终的发现竟然是因为一个小小的网络 SIGPIPE 信号导致的。接下来修改代码，通过设置进程对 SIGPIPE 信号处理方式为 SIGIGN（忽略） 后彻底根治了该问题。

问题是解决了。但我还不满足，想正好借此机会深入地给大家介绍一下内核中信号的工作原理。抽了周末整整两天，写出了本篇文章。

接下来的文章我分三大部分给大家讲解：

+ SIGPIPE 信号是如何发生的，带大家看看为什么连接异常会导致 SIGPIPE 的发生
+ 内核 SIGPIPE 信号处理流程，带大家看看为什么内核默认遇到 SIGPIPE 时会将应用给杀死
+ 应用层该如何应对 SIGPIPE，带大家看语言运行时以及我们自己的程序如何规避该问题

TCP 三次握手成功后会在内核中生成一个 socket 内核对象，通过该内核对象来表示一条 TCP 连接。

但内核对象是不允许我们随便访问的。我们平时在用户态程序中看到的 socket 其实只是一个句柄而已，并不是真正的 socket 对象。

假如由于网络、对端重启等问题这条 TCP 连接断开了。此时我们的用户态程序根本是不知情的。很有可能还会调用 send、write 等系统调用往 socket 里面发送数据。

![](/img/posts/a5eb53ac3b9f0479bac212c71802d42d.png)

当数据包发送过程走到内核中的时候，内核是知道这个 socket 已经断开了的。就会给当前进程发送一个 SIGPIPE 信号。

我们来看下具体的源码。内核的发送会走到 do_tcp_sendpages 函数，在这里内核如果发现该 socket 已经 在这种情况下，会调用 sk_stream_error 函数。

```c
//file:net/core/stream.c
ssize_t do_tcp_sendpages(struct sock *sk, struct page *page, int offset,
                         size_t size, int flags)
{
    ......
        err = -EPIPE;
    if (sk->sk_err || (sk->sk_shutdown & SEND_SHUTDOWN))
        goto out_err;
    out_err:
    return sk_stream_error(sk, flags, err);
}
```

sk_stream_error 函数主要工作就是给正在 current（发送数据的进程）发送一个 SIGPIPE 信号。

```c
int sk_stream_error(struct sock *sk, int flags, int err)
{
    ......
        if (err == -EPIPE && !(flags & MSG_NOSIGNAL))
            send_sig(SIGPIPE, current, 0);
    return err;
}
```

### 2. 内核 SIGPIPE 信号处理流程
上一节我们看到如果遇到网络连接异常断开，内核会给当前进程发送一个 SIGPIPE 信号。那么为啥这个信号就能把服务程序给搞崩而且没留下 coredump 文件呢？

简单来说，这是 Linux 内核对 SIGPIPE 信号处理的默认行为。飞哥喝口水，接着给你说。

目标进程每当从内核态返回用户态的过程中，会检测是否有挂起的信号。如果有信号存在，就会进入到信号的处理过程中，会执行到 do_notify_resume，然后再进到核心函数 do_signal。我们直接把 do_signal 的源码翻出来。

```c
//file:arch/x86/kernel/signal.c
static void do_signal(struct pt_regs *regs)
{
    struct ksignal ksig;
    ...
        if (get_signal(&ksig)) {
            /* Whee!  Actually deliver the signal.  */
            handle_signal(&ksig, regs);
            return;
        }
    ...
    }
```

在 do_signal 主要包含 get_signal 和 handle_signal 两个操作。

内核在 get_signal 中是获取一个信号。值得注意的是，内核获取到信号后，还会判断信号的关联行为。如果发现这个信号内核可以处理，内核直接就操作了。

如果内核发现获得到的信号内核需要交接给用户态程序处理，才会在 get_signal 函数中返回。接着再把信号交给 handle_signal 函数，由该函数来为用户空间准备好处理信号的环境，进行后面的处理。

服务程序在收到 SIGPIPE 会导致进程崩溃的关键就藏在这个 get_signal 函数里。

```c
//file:kernel/signal.c
bool get_signal(struct ksignal *ksig)
{
    ...
        for (;;) {
            // 1.取出信号
            signr = dequeue_synchronous_signal(&ksig->info);
            if (!signr)
                signr = dequeue_signal(current, &current->blocked,
                          &ksig->info, &type);

            // 2.判断用户进程是否为信号配置了 handler
            // 2.1 如果是 SIG_IGN(ignore的缩写)，就跳过
            if (ka->sa.sa_handler == SIG_IGN) 
                continue;

            // 2.3 判断如果不是 SIG_DFL(default的缩写)，
            //     则证明用户定义了处理函数，break 退出循环后返回信号对象
            if (ka->sa.sa_handler != SIG_DFL) {
                ksig->ka = *ka;
                ...
                    break; 
            }

            // 3.接下来就是内核的默认行为了
            ......
            }
    out:
    ksig->sig = signr; 
    return ksig->sig > 0;
}
```

在 get_signal 函数里主要做了三件事。

+ 一是通过 dequeue_xxx 函数来获取一个信号
+ 二是判断下用户进程是否为信号配置了 handler。如果用户配置的是 SIG_IGN 直接跳过就行了，如果配置了处理函数，get_signal 就会将信号返回交给后面的流程交给用户态程序执行。
+ 三是如果用户没配置 handler，则会进入到内核默认行为中。

由于我们的服务程序没对 SIG_PIPE 信号配过任何处理逻辑，所以 get_signal 在遇到 SIG_PIPE 时会进入到第三步 -- 内核默认行为处理。

我们来继续看看，内核的默认行为究竟是啥样的。

```c
//file:kernel/signal.c
bool get_signal(struct ksignal *ksig)
{
    ...
        for (;;) {
            // 1.取出信号
            ......

                // 2.判断信号是否配置了 handler
                ......

                // 3.接下来就是内核的默认行为了
                // 3.1 如果是可以忽略的信号，直接跳过
                if (sig_kernel_ignore(signr)) /* Default is nothing. */
                    continue;

            // 3.2 判断是否是暂停执行信号，是则暂停其运行
            if (sig_kernel_stop(signr)) {
                do_signal_stop(ksig->info.si_signo)
                }

            fatal:
            // 3.3 判断是否需要 coredump
            //     coredump 会杀死进程下的所有线程，并生成 coredump 文件
            if (sig_kernel_coredump(signr)) {
                do_coredump(&ksig->info);
            }

            // 3.4 对于非以上情形的信号
            //     直接让进程下所有线程退出，并且不生成coredump
            do_group_exit(ksig->info.si_signo);
        }
    ......
    }
```

内核默认行为大概是分成四种。

第一种是默认要忽略的信号。从内核源码里可以看到 SIGCONT、SIGCHLD、SIGWINCH 和 SIGURG，这几个信号内核都是默认忽略的。

```c
//file: include/linux/signal.h
#define sig_kernel_ignore(sig)  siginmask(sig, SIG_KERNEL_IGNORE_MASK)
#define SIG_KERNEL_IGNORE_MASK (\
        rt_sigmask(SIGCONT)   |  rt_sigmask(SIGCHLD)   | \
 rt_sigmask(SIGWINCH)  |  rt_sigmask(SIGURG)    )
```

第二种是暂停信号。内核对 SIGSTOP、SIGTSTP、SIGTTIN、SIGTTOU 这几个信号的默认行为是暂停进程运行。

是的，你没猜错。各个 IDE 中集成的代码断点调试器就是使用 SIGSTOP 信号来工作的。调试器给被调试进程发送 SIGSTOP 信号，让其进入停止状态。等到需要继续运行的时候，再发送 SIGCONT 信号让被调试进程继续运行。

理解了 SIGSTOP 你也就理解调试器的底层工作原理了。调试器通过 SIGSTOP 和 SIGCONT 等信号将被调试进程玩弄于股掌之间！

```c
//file: include/linux/signal.h
#define sig_kernel_stop(sig)  siginmask(sig, SIG_KERNEL_STOP_MASK)
#define SIG_KERNEL_STOP_MASK (\
 rt_sigmask(SIGSTOP)   |  rt_sigmask(SIGTSTP)   | \
 rt_sigmask(SIGTTIN)   |  rt_sigmask(SIGTTOU)   )
```

第三种是需要终止程序运行，并生成 coredump 文件的信号。通过源码我们可以看到 SIGQUIT、SIGILL、SIGTRAP、SIGABRT、SIGABRT、SIGFPE、SIGSEGV、SIGBUS、SIGSYS、SIGXCPU、SIGXFSZ 这些信号的默认行为走这个逻辑。

我们以 SIGSEGV 为例，当应用程序试图访问空指针、数组越界访问等无效的内存操作时，内核会给当前进程发送 SIGSEGV 信号。

内核对于这些信号的默认行为就是会调用 do_coredump 内核函数。这个函数会杀死目标程序所有线程的运行，并生成 coredump 文件。

我们线上遇到的绝大部分程序崩溃都是这一类。

```c
//file: include/linux/signal.h
#define sig_kernel_coredump(sig) siginmask(sig, SIG_KERNEL_COREDUMP_MASK)
#define SIG_KERNEL_COREDUMP_MASK (\
        rt_sigmask(SIGQUIT)   |  rt_sigmask(SIGILL)    | \
 rt_sigmask(SIGTRAP)   |  rt_sigmask(SIGABRT)   | \
        rt_sigmask(SIGFPE)    |  rt_sigmask(SIGSEGV)   | \
 rt_sigmask(SIGBUS)    |  rt_sigmask(SIGSYS)    | \
        rt_sigmask(SIGXCPU)   |  rt_sigmask(SIGXFSZ)   | \
 SIGEMT_MASK           )
```

但是看了这么多信号名了，还是找不到我们开篇提到的 SIGPIPE，好气！！！

最后仔细看完代码以后，发现对于非上面提到的信号外，对于其它的所有信号包括 SIGPIPE 的默认行为都是调用 do_group_exit。这个内核函数的行为也是杀死进程下的所有线程，但**不生成 coredump 文件！！！**

### 3. 应用层如何应对 SIGPIPE
看完前面两节，我们彻底弄明白了为什么我们的应用程序会崩溃了。

事故大体逻辑是这样的：

+ 1.服务依赖的程序热升级的时候有连接异常断开
+ 2.服务并不知道连接异常，还是正常向连接里发送数据
+ 3.内核在处理数据发送时发现，该连接已经异常中断了，直接给应用程序发送一个 SIGPIPE 信号
+ 4.服务程序会进入到信号处理流程中
+ 5.由于应用程序未对 SIGPIPE 定义处理逻辑，所以走的是内核默认行为
+ 6.内核对于 SIGPIPE 的默认行为是终止程序运行，但不生成 coredump 文件

弄懂了崩溃发生的原因，解决方法自然就明朗了。只需要在应用程序中定义对 SIGPIPE 的处理逻辑就行了。我在项目中增加了以下简单的几行代码。

```rust
// 设置 SIGPIPE 的信号处理器为忽略
let ignore_action = SigAction::new(
    SigHandler::SigIgn, // SigIgn表示忽略信号
    signal::SaFlags::empty(),
    SigSet::empty(),
);

// 注册信号处理器
unsafe {
    signal::sigaction(Signal::SIGPIPE, &ignore_action)
        .expect("Failed to set SIGPIPE handler to ignore");
}
```

这样就不会走到内核在处理 SIGPIPE 信号时，在 get_signal 函数中发现用户进程设置了 SIGPIPE 信号的行为是 SIG_IGN，则就直接跳过，再也不会把进程杀死了。

```c
//file:kernel/signal.c
bool get_signal(struct ksignal *ksig)
{
    ...
        for (;;) {
            // 1.取出信号
            ...
                // 2.判断用户进程是否为信号配置了 handler
                // 2.1 如果是 SIG_IGN(ignore的缩写)，就跳过
                if (ka->sa.sa_handler == SIG_IGN) 
                    continue;
            // 3.接下来就是内核的默认行为了
            ...
            }
    ...
    }
```

不少同学可能会好奇，为啥我的进程中从来没处理过 SIGPIPE 信号，咋就没遇到过这种诡异的崩溃问题呢？

原因是 Golang 等语言运行时会替我们做好这个设置。但我的开发场景是使用 Golang 作为宿主，又通过 cgo 调用了 Rust 的动态链接库。而 Golang 并没有针对这种场景做好处理。

Golang 语言运行时的处理行为解释参见 Go 源码的 os/signal/doc.go 文件中的注释。

```go
If the program has not called Notify to receive SIGPIPE signals, then
the behavior depends on the file descriptor number. A write to a
broken pipe on file descriptors 1 or 2 (standard output or standard
                                        error) will cause the program to exit with a SIGPIPE signal. A write
to a broken pipe on some other file descriptor will take no action on
the SIGPIPE signal, and the write will fail with an EPIPE error.
```

这段注释清晰地说了 Go 语言运行时对于 SIGPIPE 信号处理

+ 如果 fd 是 stdout、stderr，那么程序收到 SIGPIPE 信号，默认行为是程序会退出；
+ 如果是其他 fd（比如 TCP 连接），程序收到SIGPIPE信号，不采取任何动作，返回一个EPIPE错误即可

对于 cgo 场景，Go 的源码注释中讲了很多，我把其中最关键的一句摘出来

```go
If the SIGPIPE is received on a non-Go thread the signal will
be forwarded to the non-Go handler, if any; if there is none the
default system handler will cause the program to terminate.
```

如果 SIGPIPE 是在非 go 线程上执行，那么就取决于另一个语言运行时有没有设置 handler 了。如果没有设置，就会走到内核的默认行为中，导致程序终止。

显然我遇到的问题就让注释中这句话给说完了。

### 4. 总结
好了，最后我们再总结一下。我们的应用程序会崩溃的原因是这样的：

+ 1.服务依赖的程序热升级的时候有连接异常断开
+ 2.服务并不知道连接异常，还是正常向连接里发送数据
+ 3.内核在处理数据发送时发现，该连接已经异常中断了，直接给应用程序发送一个 SIGPIPE 信号
+ 4.服务程序会进入到信号处理流程中
+ 5.由于应用程序未对 SIGPIPE 定义处理逻辑，所以走的是内核默认行为
+ 6.内核对于 SIGPIPE 的默认行为是终止程序运行，但不生成 coredump 文件

Golang 为了避免网络断连把程序搞崩在语言运行时中，设置了对非 0、1 文件句柄的默认处理行为为忽略。但是对于我使用的 Go 在进程内通过 cgo 访问 Rust 代码的情况并没有很好地处理。

最终导致在 SIGPIPE 信号发生时，进入到了内核的默认处理行为中，服务程序退出且不留 coredump。

线上问题最难的地方在于定位根因，一但根因定位出来了，处理起来就简单多了。最后我在 Rust 代码中配置了对 SIGPIPE 的处理行为为 SIGIGN 后问题就彻底搞定了！！

推荐阅读

+ [高级 C++ 开发综合岗面试题，能挑战否？](http://mp.weixin.qq.com/s?__biz=Mzk0MjUwNDE2OA==&mid=2247499559&idx=1&sn=5f60c7cfa07c6e6a52c3d2cf8dcbcffe&chksm=c2c09ea0f5b717b6449581cf1565deccdce295b9d142b5b048166265408d5a74e3dd3b5f0559&scene=21#wechat_redirect)
+ [大型开源 FTP 软件 FileZilla 源码分析](http://mp.weixin.qq.com/s?__biz=Mzk0MjUwNDE2OA==&mid=2247499465&idx=1&sn=f72c14841b77c69a6ae65fa6fad209e2&chksm=c2c09f4ef5b716589e74597438ce2cb7eee390ca8b2907a974530661e6b2c5afb03274912280&scene=21#wechat_redirect)
+ [如何尽快适应大型 C++ 项目？](http://mp.weixin.qq.com/s?__biz=Mzk0MjUwNDE2OA==&mid=2247499555&idx=1&sn=fc0b86a694a023a61b7640406f13919e&chksm=c2c09ea4f5b717b2c94cfba5f2067fd7a7386c93b94b3cbde10331a65382f1b1bf06b5919ef5&scene=21#wechat_redirect)  

+ [如果你想低成本的快速提高开发水平，推荐这个](http://mp.weixin.qq.com/s?__biz=Mzk0MjUwNDE2OA==&mid=2247499473&idx=1&sn=c9dce8726b24b393a2820d3edb06fe4c&chksm=c2c09f56f5b71640341cd63d42ee1914d89a9778c9278abe5a05e0c697cc039bfd9db2a27528&scene=21#wechat_redirect)

  


> 来自: [网络编程中为啥一定要处理 SIGPIPE 信号？](https://mp.weixin.qq.com/s/ZnhpYl8BZA9-LqfU4kfX2Q)
>

