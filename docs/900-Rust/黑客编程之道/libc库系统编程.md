---
sidebar_position: 4
slug: /Rust/黑客编程之道/libc库系统编程
---

今天我们要深入探讨一个强大而神秘的库：libc。这个库就像是连接Rust和底层系统的魔法桥梁，掌握它，你就能驾驭操作系统的力量！准备好了吗？让我们开始这段奇妙的旅程！

## 1. libc：Rust的系统魔法书
libc库是Rust与C标准库的接口。它允许Rust代码直接调用底层系统API，让你能够进行低级系统编程。无论是文件操作、网络通信，还是内存管理，libc都能帮你搞定！

现在，让我们通过6个精彩的例子，一起领略libc的魔力！

### 1.1. 文件描述符操作：直接掌控I/O
```rust
use std::io;
use libc::{c_void, size_t, ssize_t, c_int};

fn main() -> io::`Result`<()>` {
    let message = "Hello, libc!";
    unsafe {
        let fd: c_int = 1;  // stdout的文件描述符
        let buf = message.as_ptr() as *const c_void;
        let count = message.len() as size_t;
        let bytes_written = libc::write(fd, buf, count) as ssize_t;

        if bytes_written < 0 {
            return Err(io::Error::last_os_error());
        }
    }
    Ok(())
}
```

这个例子展示了如何使用libc直接写入标准输出。它绕过了Rust的标准库，直接调用系统的write函数。

### 1.2. 进程控制：创造你的小精灵
```rust
use libc::{c_int, pid_t};
use std::io;

fn main() -> io::`Result`<()>` {
    unsafe {
        let pid: pid_t = libc::fork();

        match pid {
            -1 => Err(io::Error::last_os_error()),
            0  => {
                println!("我是子进程！");
                Ok(())
            },
            _  => {
                println!("我是父进程，子进程ID: {}", pid);
                let mut status: c_int = 0;
                libc::waitpid(pid, &mut status, 0);
                Ok(())
            }
        }
    }
}
```

这个例子展示了如何使用libc创建一个新的进程。fork函数复制当前进程，创建一个子进程。

### 1.3. 内存管理：自己动手，丰衣足食
```rust
use libc::{c_void, size_t};
use std::slice;

fn main() {
    unsafe {
        let size: size_t = 1024;
        let ptr = libc::malloc(size) as *mut u8;

        if ptr.is_null() {
            panic!("内存分配失败");
        }

        let data = slice::from_raw_parts_mut(ptr, size);

        // 使用分配的内存
        for i in 0..size {
            data[i] = (i % 256) as u8;
        }

        println!("前10个字节: {:?}", &data[..10]);

        libc::free(ptr as *mut c_void);
    }
}
```

这个例子展示了如何使用libc直接管理内存。我们分配了一块内存，使用它，然后释放它。**观看**

### 1.4. 系统时间：时间魔法师
```rust
use libc::{time_t, tm, time, localtime};
use std::ffi::CStr;

fn main() {
    unsafe {
        let t: time_t = time(std::ptr::null_mut());
        let tm: *mut tm = localtime(&t);

        let time_str = libc::asctime(tm);
        let time_cstr = CStr::from_ptr(time_str);
        println!("当前时间: {}", time_cstr.to_string_lossy().trim());
    }
}
```

这个例子展示了如何使用libc获取和格式化系统时间。我们直接调用了C库的time和localtime函数。

### 1.5. 信号处理：捕获系统的呼唤
```rust
use libc::{c_int, c_void, sighandler_t, signal, SIGINT};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

static RUNNING: AtomicBool = AtomicBool::new(true);

extern "C" fn handle_sigint(_: c_int) {
    RUNNING.store(false, Ordering::SeqCst);
}

fn main() {
    unsafe {
        signal(SIGINT, handle_sigint as sighandler_t);
    }

    println!("程序运行中，按Ctrl+C退出...");

    while RUNNING.load(Ordering::SeqCst) {
        thread::sleep(Duration::from_secs(1));
    }

    println!("程序正常退出");
}
```

这个例子展示了如何使用libc处理系统信号。我们设置了一个处理函数来捕获SIGINT信号（通常由Ctrl+C触发）。

6. 网络编程：跨越虚拟的海洋

```rust
use libc::{c_int, sockaddr_in, socket, AF_INET, SOCK_STREAM, socklen_t, connect};
use std::mem;

fn main() -> std::io::`Result`<()>` {
    unsafe {
        let sock = socket(AF_INET, SOCK_STREAM, 0);
        if sock < 0 {
            return Err(std::io::Error::last_os_error());
        }

        let mut addr: sockaddr_in = mem::zeroed();
        addr.sin_family = AF_INET as u16;
        addr.sin_port = 80u16.to_be();  // HTTP端口
        addr.sin_addr.s_addr = u32::from_be_bytes([93, 184, 216, 34]);  // example.com的IP

        let connect_result = connect(sock, 
                                     &addr as *const sockaddr_in as *const _,
                                     mem::size_of::`<sockaddr_in>`() as socklen_t);

        if connect_result < 0 {
            return Err(std::io::Error::last_os_error());
        }

        println!("成功连接到example.com:80");

        libc::close(sock);
    }
    Ok(())
}
```

这个例子展示了如何使用libc进行网络编程。我们创建了一个socket并连接到example.com的80端口。

## 2. 总结
通过这6个例子，我们看到了libc在Rust中的强大功能。从文件操作到网络编程，libc为我们打开了系统编程的大门。虽然使用libc需要小心处理unsafe代码，但它给了我们直接与操作系统交互的能力。

记住，每次你使用libc，你都在释放Rust的底层魔力！继续探索，让你的Rust技能更上一层楼吧！

