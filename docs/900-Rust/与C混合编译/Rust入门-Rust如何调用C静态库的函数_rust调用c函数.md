---
sidebar_position: 2
slug: /Rust/与C混合编译/Rust入门-Rust如何调用C静态库的函数_rust调用c函数
---

---
title: Rust入门：Rust如何调用C静态库的函数_rust调用c函数-CSDN博客
date: '2024-12-27 23:06:43'
updated: '2024-12-27 23:07:55'
slug: /Rust/与C混合编译/Rust入门-Rust如何调用C静态库的函数_rust调用c函数
关于[Rust](https://so.csdn.net/so/search?q=Rust&spm=1001.2101.3001.7020)调用C++，因为接口比较复杂，貌似Rust不打算支持。而对于C函数，则相对支持较好。

如果要研究C++/Rust相互关系的话，可以参考：

[https://docs.rs/cxx/latest/cxx/](https://docs.rs/cxx/latest/cxx/)

[Rust ❤️ C++](https://cxx.rs/)

这里只对调用C[静态库](https://so.csdn.net/so/search?q=%E9%9D%99%E6%80%81%E5%BA%93&spm=1001.2101.3001.7020)做一个最简短的介绍。

根据官方教材的内容略作一个说明，官方的程序在这里，

[Unsafe Rust - The Rust Programming Language](https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html)

这里我们建一个StaticLib1.cpp的文件，内容如下，

```cpp
#include `<cstdlib>`
#include `<cinttypes>`

extern "C" std::int32_t abs(std::int32_t n) {
    return std::abs(`static_cast`<std::intmax_t>`(n));
}
```

注意，这里接口是extern "C"，也就是标准C接口。

无论是用visual studio 2019或GCC，在windows下都可以生成这样一个静态库：StaticLib1.lib。

然后新建一个rust程序，

cargo new rust-to-c

将rust-to-c/src/main.rs的内容改为，

```rust
#[link(name = "StaticLib1")]


extern "C" {
    fn abs(input: i32) -> i32;
}


fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

再拷贝lib到，

rust-to-c/StaticLib1.lib，

然后

cargo build

就可以看到生成了文件

rust-to-c/target/debug/rust-to-c.exe，

用指令

cargo run

就可以得到执行结果了，如下，

![](/img/posts/90c820107d2f8e8d44fb2027054f1b2a.png)

参考资料：

[FFI - The Rustonomicon](https://doc.rust-lang.org/nomicon/ffi.html)

本文结束   


> 来自: [Rust入门：Rust如何调用C静态库的函数_rust调用c函数-CSDN博客](https://blog.csdn.net/tanmx219/article/details/136507645)
>

