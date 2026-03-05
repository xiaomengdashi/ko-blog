---
sidebar_position: 4
slug: /Rust/Rust-范型和-Rust-宏的实战使用场景
---

---
title: Rust 范型和 Rust 宏的实战使用场景
date: '2024-12-04 22:32:41'
updated: '2024-12-23 23:16:05'
slug: /Rust/Rust-范型和-Rust-宏的实战使用场景
在一些规范的 API 接口调用过程中，会有一些公共部分以及其余不同部分。比如如果这批接口中统一使用了 code,message, data 这样三个字段，返回业务代码的调用的状态，错误信息，以及不确定类型的 data。

 1. 返回 null

           ![](/img/posts/03c69d2640b7a0c279490bbdab7ee63d.png)

2. 返回简单数据

            ![](/img/posts/8e9ecfa8ecab33cbe8c79b585a423a03.png)

3. 返回复杂对象        


            ![](/img/posts/e7977c3f0bea4cd0d904669d03f018a8.png)

这时候，可以知道 code, message 可以分别确定是 number，string 类型。data  字段可以返回任意复杂的数据结构。

假设我们单独为这三种返回各自定义返回 struct ，那就会是很多以下这种臃肿的一坨坨结构。  


![](/img/posts/d26e30a6e414448811320cc59d53f66e.png)

  
有没有什么~~偷懒的~~简洁的而又不影响性能的方式？第一时间想到范型上！

Rust 中定义一个范型 Struct  叫 `ApiResponse`&lt;T>` 作为接口的统一返回结构。code 为数值(如果你有正负值，用 i64,i32 什么的)，number 为 String，data 数据是可选切类型为任意就定义为 `Option`<T>`，它可以返回  `Some`&lt;T>` 或者 Some(())。`T` 允许 `ApiResponse` 支持任何类型的数据，增强了代码的灵活性。

![](/img/posts/fbc3b06c6e16f75fef89f7552bf12ef5.png)

因为业务接口起码有两种状态，所以给范型结构定义 success 和 fail 两个函数那么就得到

![](/img/posts/b6034969bae4356a2912ff1e404dfe1a.png)

所以在业务代码最后返回时的调用就很简单，有返回数据时就给 T 赋予具体的结构数据，没有数据返回的就直接一个小括号给 T 就好，非常简洁、灵动。

+ 当 T  为空

![](/img/posts/171398740e4d62ca0dbd614903fd7124.png)

+ 当 T 为对象数据 UserInfo Response

![](/img/posts/5c3c3614401ffe309da389e7b5df3801.png)

+ 当 T 为更复杂的分页查询数据 （这里我用了一个 futures 的 宏try_join!）

![](/img/posts/ec6170430c2dca1c3ed2a65ee38d9983.png)

通过引入 Rust 范型, 我们成功~~偷懒~~简化了一堆的  struct 的返回结构的定义。 你以为这就结束了？No, No, No! 这段代码里面依然还是充斥着一大堆的重复太长代码

```plain
HttpResponse::Ok().json(ApiResponse::`<T>`::success(T)


HttpResponse::Ok().json(ApiResponse::`<()>`::fail(xxx)
```

这怎么能容忍呢？必须继续~~偷懒~~简化！通过观察一下哈，我发现，这除了 T  和 （） 不是没变化了吗？如果我能把前面那一段都拿掉，就剩 success(T) 和 fail(xxx)  那这代码就不是太简洁美观了吗？

那种时候，激动人心的时刻到了，宏(macro) 她要粉末登场！

首先可以明确的是我最后只想要两个宏，一个 success,   一个 fail 。但是在前面已经实现的代码中，返回的数据外面是俩层嵌套，HttpResponse::Ok().json  是外层，ApiResponse::&lt;&gt;是内层，那么先定义一层宏解决掉内层嵌套。

![](/img/posts/f0e75d47eaa90983197491beb7d16bd3.png)

根据宏的定义方式定义出两个宏。

```plain
#[macro_export]
```

告诉编译器我要导出这个宏，在其他模块可以引入使用。

```plain
macro_rules!
```

定义宏，后面跟一个名称 api_response_success。

```plain
($data:expr)
```

宏接受一个表达式参数 $data。（这里success只需要一个T参数，fail 需要 code 和 message )  。

```plain
=> {...}
```

宏展开之后的格式。  


我的思路是首先可以明确的是我最后只想要两个宏，一个 success,   一个 fail 。但是前面是两层嵌套，外层是：

```plain
HttpResponse::Ok().json
```

内层是：

```plain
ApiResponse::`<T>`
```

那么先定义一层宏解决掉内层嵌套，就继续解决外层重复性的代码。  


![](/img/posts/d1b5bfdf26ad235e55daf032ec5b4ce4.png)

也就是 api_response_success! 和 api_reresponse_fail! 这两个宏替代了内层的 ApiResponse::`&lt;T>`

即

```plain
HttpResponse::Ok().json(ApiResponse::`<`PagesRes<Vec<QuestionListRes>`>>::success(ques_items_res))
```

被抽成

```plain
HttpResponse::Ok().json(api_response_success!(ques_items_res))
```

继续减肥瘦身，外层也实现Rust【宏】化！  


![](/img/posts/c38e2de43f92bb9bdf66766c4bcb25c9.png)

这个版本的话，出现两个需要改动的地方。

1. 在调用的地方多一个导入 json_response 的方法。        

```plain
use crate::errcode::{ApiResponse,json_response};
```

2. 就是变成这样，fail!调用时每次传一个 Some()  给到 data 可选填字段。  


![](/img/posts/7af1552daf6ba66e6d2b03a8cde5a653.png)

都没有数据返回，你还让我每次填一个控制，这不是赢下影响我手速吗？这还是我不可接受的。

必须要改一下，现在中间 v1 宏版本被我淘汰了。这已经是过了一天的事情了...

最后我们得到这个最简单的一步到位的宏2 版本的 success_v2! 和 fail_v2! 这两个宏。  


![](/img/posts/aafb9223b62672d834f665e281049d8b.png)

一次小小的 Rust 代码优化，成了！先别忙，先验证一下  


![](/img/posts/1d745fbfb43288eac62dd98de2f6f2f6.png)

cool ，好短！对比三个版本的，还是最后宏2版本富有有表现力啊，眼见的干净利落。

这就是我的 Rust 范型和 Rust 宏的实战场景之一。Rust 的很多特性都好玩的，就比如上图中的 futures 库的 try_join! 是并发的。  


> 来自: [Rust 范型和 Rust 宏的实战使用场景](https://mp.weixin.qq.com/s/fHQVzxobAyCXNW8sIaICfg)
>

