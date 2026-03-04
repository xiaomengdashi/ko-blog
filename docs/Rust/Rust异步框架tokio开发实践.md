---
sidebar_position: 1
slug: /Rust/Rust异步框架tokio开发实践
---

# Rust异步框架tokio开发实践 
原创 zl  zl.rs _2024年12月01日 19:52_

简介

在异步编程框架上，Rsut只提供了await和async这样的异步原语，前者是对Future特型中poll方法调用的语法糖，后者则会产生一个实现了具有Future特型的匿名对象，而对Future的调度Rust并没有给出标准答案。这好比异步编程框架是一座需要建造的高楼，Rust提供了所需的砖瓦等一切材料，但是需要一个施工团队一砖一瓦将这座大厦建成。

  


基于此，社区中便出现了tokio、async-std等这样的异步框架。而tokio更是因为其高效且可靠的异步I/O、丰富的异步API、强大的错误处理和资源管理能力等特点，成为了Rust异步编程事实上的标准。

  


前段时间一个Rsut服务采用了tokio作为异步框架，下面简单介绍下在这个项目中了解和使用的tokio相关模块。

创建Runtime

使用tokio之前首先需要创建tokio runtime

```rust
async fn test_async() {
    println!("test_async");
}


#[tokio::main]
async fn main() {
    let handle = tokio::spawn(test_async()).await;
}
```

上面使用tokio提供的宏创建了runtime，使用宏创建runtime需要使用到macros feature，建议在Cargo.toml中指定full feature，这将启用除了test-util和tracing之外的所有feature

  


以上创建runtime的方式等价于如下

```rust
fn main(){
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let handle = tokio::spawn(test_async()).await;
        });
}
```

两者区别不大，但是如果你需要在开发过程中集成senrty监控服务的运行状况，异常时进行上报的话，你必须使用第二种方式。

  


创建runtime时，enable_all内部会调用enable_io和enable_time，前者将会启用网络、信号和其他一些I/O类型；后者将会启用定时器，否则无法使用tokio::time中的模块。

  


不管是通过宏#[tokio::main]还是new_multi_thread的方式，都会创建一个多线程的runtime，没有指定线程数量的情况下，默认会创建8个线程，这些线程将会负责执行加入到这个runtime中的异步任务。

向runtime中添加异步任务

前面的代码其实已经向runtime中添加了任务

```rust
async fn test_async() {
    println!("test_async");
}
let handle = tokio::spawn(test_async()).await;
```

tokio::spawn会将传入的Future加入当前的runtime并执行。

定时器

```rust
println!("aaa");
tokio::time::sleep(
    tokio::time::Duration::from_secs(1)
).await;
println!("bbb");
```

在tokio异步环境中如果需要使用定时器，强烈要求不要使用std::thread::sleep，如果使用std::thread::sleep则会导致tokio的线程调度器失去对该线程的控制，从而影响调度策略；如果采用tokio内置的定时器则不然，tokio内置的定时器在sleep时，只是将当前任务放到了阻塞队列，然后线程会去执行其它任务，当定时时间到之后再唤醒该任务继续执行。

通道

tokio为线程间通信设计的通道有oneshot通道、mpsc通道、broadcast通道以及watch通道，我们这里介绍下mpsc。

```rust
let (sender,receiver ) = 
    tokio::sync::mpsc::channel::<u8>(10);
```

以上创建了一个发送数据类型为u8缓冲区长度为10的mpsc通道。可以在不同线程间使用sender和receiver 发送和接收数据。

```rust
async fn test_async_sender(
    sender: tokio::sync::mpsc::Sender<u8> ) {
    loop {
        tokio::time::sleep(
            tokio::time::Duration::from_secs(2)
        ).await;
        if let Err(_) = sender.send(1).await {
            println!("test_async_sender break");
            break;
        }
    }
}


async fn test_asyn_receiver(
    mut receiver: tokio::sync::mpsc::Receiver<u8>) {
    loop {
        if let Some(v) = receiver.recv().await {
            println!("v:{v}");
        } else {
            println!("test_asyn_receiver break");
            break;
        }
    }
}
#[tokio::main]
async fn main(){
    let (sender,receiver ) = 
        tokio::sync::mpsc::channel::<u8>(10);
    tokio::spawn(test_async_sender(sender));
    tokio::spawn(test_asyn_receiver(receiver));
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
    }
}
```

主线程创建好通道并将test_async_sender和test_asyn_receiver加入runtime运行后便在main函数中等待，直到收到ctrl_c发送的信号时才会退出。

  


test_async_sender将会使用sender每隔1秒发送一个消息；test_asyn_receiver则在loop中循环接收消息。

  


Receiver的recv方法返回的是一个Option，他将在所有Sender都释放，且通道中没有缓存的数据时，返回None。

  


如果通道中还存在缓存的数据没有来得及使用Receiver读取完，这时候即使所有的Sender都释放了，Receiver的recv方法也不会返回None，直到缓存的数据读取完毕才会返回None。

  


只要有一个Sender存在，且通道中也没有数据，那么recv将会睡眠，直到有数据时再被唤醒。

  


还值得注意的是，我们在创建通道时设置了缓冲区的大小为10，所以当生产者的速度快于消费者时，缓冲区中缓存的数据会逐渐变多，直到达到我们设置的上限时，Sender的send方法将会阻塞睡眠，直到缓冲区中有空间时再被唤醒。

tokio::select

```rust
#[tokio::main]
async fn main(){
    let (sender,mut receiver ) = 
        tokio::sync::mpsc::channel::<u8>(4);
    tokio::spawn(test_async_sender(sender));
    // tokio::spawn(test_asyn_receiver(receiver));
    loop {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                break;
            }

            option = receiver.recv() => {
                if let Some(v) = option {
                    println!("v:{v}");
                } else {
                    break;
                }
            }
        }   // tokio::select!
    }   // loop
}
```

之前的主函数稍加改动，我们不再额外创建一个任务使用receiver接收数据，这次想在主线程中循环接收sender发送的数据，与此同时还想继续监听ctrl_c事件触发程序退出，这就需要使用tokio提供的并发宏select了。

  


select允许我们在多个异步计算中等待，其中某一个异步计算完成后返回，然后执行相关的块。对于其它还未完成的Future则会被取消，Rust中取消一个异步计算的方式就是丢弃对应的Future，所以在使用select时尤其需要注意Future是否是Cancel safety的！

  


select还有一个不得不提的就是其公平性。假如我们在某个loop中循环select很多的Future，我们知道，轮询Future其实就是需要调用其poll函数，如果loop每次循环到select时，select默认从上往下调用每一个Future的poll时，则会出现不公平的情况。

  


试想如果最上面的Future每次poll时都返回Poll::Ready，那么select就会直接执行对应的代码块，即使下面的Future早就已经准备好了Poll::Ready，但是没机会被poll，导致下面的Future永远无法得到返回，这就出现某种程度上的“饿死”了。所以，select默认情况下每次会随机选择一个分支开始poll，这样每个分支都将有机会得到poll，保证了一定的公平性。

  


当然，如果你的需求想要的是前者的效果，那么可以使用biased

```rust
loop {
  tokio::select!{
    biased;
    _ = future1 => {}
    _ = future12 => {}
  }
}
```

这样一来，select每次都会选择future1 开始poll，但是正如上面所说的，一定要注意“饿死”的情况。

锁

在异步函数中如果需要做多线程同步，建议不要使用std::sync::Mutex，因为std::sync::Mutex在lock之后返回的guard是没有Send特型的，所以std::sync::Mutex返回的guard不能在多线程之间传递。

  


但是我们知道，在异步函数中只要await就会出现线程切换，这导致要求每个Future都是具有Send特型的，所以异步函数中await之前如果出现了不具有Send特型的变量guard，将无法通过编译。

  


所以异步函数中，做线程同步需要使用tokio::sync::Mutex，tokio::sync::Mutex返回的guard具有Send特型。

总结

tokio的实现学习了go，以go这门为异步而生的工具为目标，相信tokio一样能扛起Rust异步编程的大旗。

  


---

  


  
  


> 来自: [Rust异步框架tokio开发实践](https://mp.weixin.qq.com/s/d56_crzfliatcmhAfaVhMQ)
>

