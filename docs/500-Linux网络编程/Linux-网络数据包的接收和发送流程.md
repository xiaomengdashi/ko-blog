---
sidebar_position: 5
title: Linux 网络数据包的接收和发送流程
date: '2025-01-11 13:45:18'
updated: '2025-01-11 13:45:19'
slug: /Linux网络编程/Linux-网络数据包的接收和发送流程
---

## 1. Linux Network Packet Receiving and Sending Process
## 2. 数据包接收流程
为了简单起见，我们将描述在物理网卡上接收和发送 Linux 网络数据包的过程，以 UDP 数据包处理过程为例，并尽量忽略一些无关的细节。

### 2.1. 从网卡到内存
众所周知，每个网络设备（网卡）都有一个驱动程序来工作，并且该驱动程序需要在内核启动时加载到内核中。从逻辑上看，驱动程序是负责连接网络设备和内核网络协议栈的中间模块。每当网络设备接收到一个新数据包时，它会触发一个中断，而相应的处理中断的程序正是加载到内核中的驱动程序。

下图详细展示了数据包如何从网络设备进入系统内存，并由内核中的驱动程序和网络协议栈处理的过程。

![](/img/posts/2c79daf382ca8a1424a18d5a8c7da233.png)

1. 数据包进入物理网卡，如果目标地址不是该网络设备且该设备没有开启混杂模式，则数据包会被丢弃。
2. 物理网卡通过DMA将数据包写入指定的内存地址，该地址由网卡驱动程序分配和初始化。
3. 物理网卡通过硬件中断（IRQ）通知CPU，有新数据包到达网卡并需要处理。
4. 接下来，CPU根据中断向量表调用已注册的中断函数，该中断函数将调用驱动程序（网卡驱动）中的相应函数。
5. 驱动程序首先禁用网卡的中断，表示驱动已经知道内存中有数据，并告诉物理网卡下次接收到数据包时直接写入内存，不要再通知CPU，以提高效率并避免CPU被不断中断。
6. 启动一个软中断以继续处理数据包。这样做的原因是硬件中断处理程序在执行过程中不能被中断，因此如果执行时间过长，会导致CPU无法响应其他硬件中断，所以内核引入了软中断，使得硬件中断处理程序中耗时的部分可以转移到软中断处理程序中慢慢处理。

### 2.2. 内核数据包处理
上一步中的网络设备驱动程序将通过触发内核网络模块中的软中断处理函数来处理数据包，内核处理数据包的过程如下图所示。

![](/img/posts/21f5299348ca3c5c5fab7f411e7e9b9b.png)

1. 对于上一步中驱动程序发出的软中断，内核中的 ksoftirqd 进程会调用网络模块中相应的软中断处理函数，准确地说，这里调用的是 `net_rx_action` 函数。
2. `net_rx_action` 随后会调用网卡驱动程序中的 `poll` 函数，逐个处理数据包。
3. `poll` 函数会让驱动程序读取网卡写入内存的数据包，实际上，内存中数据包的格式只有驱动程序知道；
4. 驱动程序将内存中的数据包转换为内核网络模块识别的 `skb`（socket buffer）格式，然后调用 `napi_gro_receive` 函数。
5. `napi_gro_receive` 函数会处理GRO（Generic Receive Offload）相关的内容，即合并可以合并的数据包，从而只需调用一次协议栈，然后判断是否启用了 RPS（Receive Packet Steering）；如果启用了，则会调用 `enqueue_to_backlog` 函数。
6. `enqueue_to_backlog` 函数会将数据包放入 `input_pkt_queue` 结构中并返回。

注意：如果 `input_pkt_queue` 已满，数据包将被丢弃，该队列的大小可以通过 `net.core.netdev_max_backlog` 配置。

7. 随后，CPU 会在软中断上下文中处理其 `input_pkt_queue` 中的网络数据，实际上是通过调用 `__netif_receive_skb_core` 函数来完成。
8. 如果未启用RPS，`napi_gro_receive` 函数会直接调用 `__netif_receive_skb_core` 函数来处理网络数据包。
9. 紧接着，如果存在类型为 `AF_PACKET` 的原始套接字（raw socket），CPU会将数据复制一份到该套接字中（tcpdump 捕获的数据包就是这种数据包）。
10. 将数据包传递给内核的 TCP/IP 协议栈进行处理。

当内存中的所有数据包都处理完毕（`poll`函数执行完成）后，重新启用网卡的硬件中断，以便下次网卡再次接收到数据时通知CPU。

### 2.3. 内核网络协议栈
此时，内核 TCP/IP 协议栈接收到的数据包实际上是第3层（网络层）的数据包，所以数据包将首先到达 IP 网络层，然后再传递到传输层进行处理。

#### 2.3.1. IP网络层
![](/img/posts/bfcb8e5e4e870993c4fc8e49973da785.png)

+ `ip_rcv` 是 IP 网络层处理模块的入口函数，它首先确定数据包是否需要被丢弃（目标 MAC 地址不是当前网卡且网卡未设置为混杂模式），如果需要进一步处理，则调用在 netfilter 中注册的 `NF_INET_PRE_ROUTING` 链中的处理函数。
+ `NF_INET_PRE_ROUTING` 是 netfilter 在协议栈中放置的一个钩子函数，通过 iptables 注入一些数据包处理函数来修改或丢弃数据包。如果数据包未被丢弃，将继续向下传递。

netfilter 链中的处理逻辑，如 `NF_INET_PRE_ROUTING`，可以通过 iptables 进行设置。

+ 路由处理：如果目标 IP 不是本地 IP 且未启用 IP 转发，则数据包将被丢弃；否则，数据包将传递到 `ip_forward` 函数进行转发处理。
+ `ip_forward` 函数将首先调用 netfilter 在 `NF_INET_FORWARD` 链中注册的处理函数，如果数据包未被丢弃，将继续调用 `dst_output_sk` 函数。
+ `dst_output_sk` 函数将调用 IP 网络层的适当函数来发送数据包，此步骤的详细内容将在下一节关于发送数据包的部分中描述。
+ `ip_local_deliver`：如果上述路由处理发现目标 IP 是本地网卡的 IP，则将调用 `ip_local_deliver` 函数，该函数首先调用 `NF_INET_LOCAL_IN` 链中相关的处理函数，如果通过，则将数据包传递到传输层。

#### 2.3.2. 传输层
![](/img/posts/970a5ba485c2c889be6d8d3065ef62ee.png)

+ `udp_rcv` 函数是 UDP 处理层模块的入口函数，它首先调用 `__udp4_lib_lookup_skb` 函数，根据目标 IP 和端口查找对应的套接字（所谓的套接字基本上是由 IP+端口组成的结构）。如果未找到对应的套接字，则数据包将被丢弃；否则，继续处理。
+ `sock_queue_rcv_skb` 函数首先检查套接字的接收缓存是否已满，如果已满则丢弃数据包；其次，它调用 `sk_filter` 检查数据包是否符合条件。如果当前套接字上设置了过滤器且数据包不符合条件，则数据包也会被丢弃。

> sk_filter 函数是 Linux 内核中用于套接字过滤（Socket Filtering）的一个接口。它允许应用程序在数据包到达用户空间之前，在内核空间对数据包进行过滤。这个函数的主要目的是执行与给定套接字关联的BPF过滤器程序。具体实现参考 net/core/filter.c 中的 `sk_filter_trim_cap` 函数。
>

+ `__skb_queue_tail` 函数将数据包放入套接字的接收队列末尾。
+ `sk_data_ready` 通知套接字数据包已准备好。
+ 调用 `sk_data_ready` 后，一个数据包处理完毕，等待应用层读取。

注意：上述所有执行过程都在软中断上下文中进行。

## 3. 数据包的发送流程
从逻辑上讲，Linux 网络数据包的发送过程与接收过程相反，因此，我们仍然以通过物理网卡发送 UDP 数据包为例进行说明。

### 3.1. 应用层
应用层的开始是应用程序调用 Linux 网络接口创建套接字，下图详细展示了应用层如何构建套接字并将其发送到传输层。

![](/img/posts/d06a85ccb8434084a6a27d2aed3a3b79.png)

+ 调用 `socket(...)` 来创建一个套接字结构并初始化相应的操作函数。
+ `sendto(sock, ...)` 由应用层程序调用以开始发送数据包；此函数调用后面的 `inet_sendmsg` 函数。
+ `inet_sendmsg` 此函数主要检查当前套接字是否绑定了源端口，如果没有，则调用 `inet_autobind` 函数分配一个端口，然后调用 UDP 层函数进行传输。
+ `inet_autobind` 函数将调用 `get_port` 函数以获取一个可用的端口。

### 3.2. 传输层
![](/img/posts/7f66c83cb96ddfc1f482357829d87776.png)

+ `udp_sendmsg` 函数是 UDP 传输层模块发送数据包的入口点。该函数首先调用 `ip_route_output_flow` 函数获取路由信息（主要是源 IP 和网卡），然后调用 `ip_make_skb` 构造 `skb` 结构，最后将网卡信息与 `skb` 关联。
+ `ip_route_output_flow` 函数主要处理路由信息，它将根据路由表和目标 IP 确定数据包应从哪个网络设备发送。如果套接字未绑定源 IP，该函数还将根据路由表为其找到最合适的源 IP。如果套接字绑定了源 IP，但根据路由表，与该源 IP 对应的网卡无法到达目标地址，则数据包将被丢弃，并返回错误以表示发送失败。该函数最终将找到的网络设备和源 IP 填充到 `flowi4` 结构中，并将其返回给 `udp_sendmsg` 函数。
+ `ip_make_skb` 函数使用分配的 IP 数据包头（包括源 IP 信息）构造 `skb` 数据包，并调用 `__ip_append_dat` 函数对数据包进行切片，检查套接字的发送缓存是否已耗尽，如果已耗尽则返回 `ENOBUFS` 错误消息。
+ `udp_send_skb(skb, fl4)` 函数用 UDP 数据包头填充 `skb` 并处理校验和，然后将其传递给 IP 网络层中的相应函数。

### 3.3. IP 网络层
![](/img/posts/b890e5f19021d1662fd66722499615a9.png)

+ `ip_send_skb` 是 IP 网络层模块发送数据包的入口函数，它实质上调用后面的一系列函数来发送网络层数据包。
+ `__ip_local_out_sk` 函数用于设置 IP 数据包头的长度和校验和值，然后调用在 `NF_INET_LOCAL_OUT` 钩子链上注册的后续处理函数。
+ `NF_INET_LOCAL_OUT` 是一个 netfilter 钩子门，可以通过 iptables 配置链上的处理函数；如果数据包未被丢弃，将继续沿链传递。
+ `dst_output_sk` 函数根据 `skb` 内部的信息调用相应的输出函数 `ip_output`。
+ `ip_output` 函数将前一层 `udp_sendmsg` 获取的网卡信息写入 `skb`，然后调用在 `NF_INET_POST_ROUTING` 钩子链上注册的处理函数。*`NF_INET_POST_ROUTING` 是 netfilter 钩子链 `NF_INET_POST_ROUTING`。
+ `NF_INET_POST_ROUTING` 是一个 netfilter 钩子门，可以通过 iptables 配置链上的处理函数；在这个步骤中，主要配置源地址转换（SNAT），这会导致此 `skb` 的路由信息发生变化。
+ `ip_finish_output` 函数确定自上一步以来路由信息是否已发生变化，如果已变化，则需要再次调用 `dst_output_sk` 函数（当此函数再次被调用时，可能不会进入调用 `ip_output` 函数的分支，而是进入 netfilter 指定的输出函数，可能是 `xfrm4_transport_output`），否则将继续传递。
+ `ip_finish_output2` 函数根据目标 IP 在路由表中查找下一跳地址，然后调用 `__ipv4_neigh_lookup_noref` 函数在 ARP 表中查找下一跳的邻居信息，如果未找到，则调用 `__neigh_create` 函数构建一个空的邻居结构。
+ `dst_neigh_output` 函数调用 `neigh_resolve_output` 函数获取邻居信息，并用其中的 MAC 地址填充 `skb`，然后调用 `dev_queue_xmit` 函数发送数据包。

### 3.4. 内核处理数据包
![](/img/posts/a66215cdee99434c8024c644d76ab470.png)

+ `dev_queue_xmit` 函数是内核模块开始处理发送数据包的入口点，此函数将首先获取设备的相应队列规则（qdisc），如果没有（例如环回接口或 IP 隧道），则会直接调用 `dev_hard_start_xmit` 函数，否则数据包将通过流量控制(TC)模块进行处理。
+ 流量控制模块主要负责过滤和排序数据包，如果队列已满，数据包将被丢弃，详情请参阅：http://tldp.org/HOWTO/Traffic-Control-HOWTO/intro.html
+ `dev_hard_start_xmit` 函数首先将 `skb` 的一个副本复制到“数据包探针”（`tcpdump` 命令从这里获取数据包），然后调用 `ndo_start_xmit` 函数发送数据包。如果 `dev_hard_start_xmit` 函数返回错误，调用它的函数会将 `skb` 放置在某个位置，并抛出一个软中断 `NET_TX_SOFTIRQ` 到软中断处理函数 `net_tx_action`，以便稍后重试处理。
+ `ndo_start_xmit` 函数绑定到特定驱动程序处理发送数据的处理函数。

**注意**：`ndo_start_xmit` 函数将指向特定网卡驱动程序以发送数据包，在此步骤之后，发送数据包的任务将交给网络设备驱动程序，不同的网络设备驱动程序有不同的处理方式，但整体流程基本相同。

+ 将 `skb` 放入网卡的传输队列。
+ 通知网卡发送数据包。
+ 网卡发送完成后向 CPU 发送中断。
+ 收到中断后清理 `skb`。

## 4. Source
https://www.sobyte.net/post/2022-10/linux-net-snd-rcv/  


> 来自: [Linux 网络数据包的接收和发送流程](https://mp.weixin.qq.com/s/yhcJ9KiYwRSDRNfVyjMVVA)
>
