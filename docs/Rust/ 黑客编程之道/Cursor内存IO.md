---
sidebar_position: 1
slug: /Rust/-黑客编程之道/Cursor内存IO
---

📌 原文链接：[https://mp.weixin.qq.com/...](https://mp.weixin.qq.com/s?__biz=MzI0NDYwOTU4NQ==&mid=2247484671&idx=1&sn=9d269c3cac4d59e5279585bcd99cca97&ascene=3&devicetype=iOS18.1.1&version=1800362e&nettype=3G+&abtest_cookie=AAACAA%3D%3D&lang=zh_CN&countrycode=CN&fontScale=100&exportkey=n_ChQIAhIQr%2BUwdshxiIv%2Bsy%2FH7eJBTxLhAQIE97dBBAEAAAAAANxgGpU5CRUAAAAOpnltbLcz9gKNyK89dVj0iHz%2FYsHkXoS5LmRXriJ2gFKZtHIVBIrgYmPnw2cC0JBGjGJYNJuX8q6FjW%2B9zqNjxxw6uwqljZaDoCTTgfChONMyPOE3xlfh%2B%2F25s%2FB9HP6Z2CMjDS2o%2FlnOkBXYPGmETeqDhXpcT6Ik1779Q6LRww3eMV4Qzg1upMHD794%2B4jWnaMWw6Ry3mtqZYtw1esG34hApL3GeMNSSfQ8KlvRrsRgaycz15cAwhofsWnXuy9lJIjn769gmGOHjsQ%3D%3D&pass_ticket=qdj4Zj0bNCqVXGmnxBvTql0vSYTLNKYla072%2BUsC1yeKQsKCWNuoX9ULHS0677JH&wx_header=3) 

🕘 收藏时间：2024年11月29日 

📂 文档目录：**我的云文档/应用/金山收藏助手**

 📑 本文档由[【金山收藏助手】](https://kdocs.cn/l/cpRidR7kBnn3)一键生成

![](/img/posts/e41d8d0c76c626063db79e32debbd83b.jpeg)

在Rust的标准库中，`std::io::Cursor`是一个强大而实用的工具。它能让我们像操作文件一样操作内存中的数据，是实现高性能IO的关键武器。今天就让我们深入了解这个强大的工具！

📌 什么是Cursor？

Cursor是Rust标准库提供的一个内存游标结构体，它可以将字节数组或Vec<u8>包装成一个可以读写的游标。简单来说，它就像一个指针，可以在内存缓冲区中自由移动，进行读写操作。

🔍 Cursor的核心特征

Cursor实现了多个重要的trait：

+ Read：允许从游标当前位置读取数据
+ Write：允许在游标当前位置写入数据
+ Seek：允许移动游标位置

## 🔨 基础使用示例
### 1. 基本读写操作
```rust
use std::io::Cursor;
use std::io::{Read, Write, Seek, SeekFrom};
fn basic_usage() -> std::io::Result<()> {
    // 创建一个Cursor，包装Vec<u8>
    let mut cursor = Cursor::new(Vec::new());
    // 写入数据
    cursor.write_all(b"Hello, Rust!")?;
    // 获取当前位置
    println!("Position after write: {}", cursor.position()); // 输出：12
    // 回到开始位置
    cursor.seek(SeekFrom::Start(0))?;
    // 读取数据
    let mut buffer = String::new();
    cursor.read_to_string(&mut buffer)?;
    println!("Read content: {}", buffer); // 输出：Hello, Rust!
    Ok(())
}
```

### 2. 随机访问示例
```rust
use std::io::Cursor;
use std::io::{Seek, SeekFrom, Write};
fn random_access() -> std::io::Result<()> {
    let mut cursor = Cursor::new(vec![0; 8]);
    // 写入不同位置
    cursor.seek(SeekFrom::Start(4))?;
    cursor.write_all(&[0xFF])?;
    cursor.seek(SeekFrom::Start(2))?;
    cursor.write_all(&[0xAA])?;
    // 获取底层数据
    let data = cursor.into_inner();
    println!("Final data: {:?}", data); 
    // 输出：[0, 0, 170, 0, 255, 0, 0, 0]
    Ok(())
}
```

## 🚀 高级应用场景
### 1. 内存缓存序列化
```rust
use std::io::Cursor;
use std::io::{Read, Write};
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct Person {
    name: String,
    age: u32,
}
fn serialize_to_memory() -> std::io::Result<()> {
    let person = Person {
        name: "Alice".to_string(),
        age: 30,
    };
    // 序列化到内存
    let mut cursor = Cursor::new(Vec::new());
    serde_json::to_writer(&mut cursor, &person)?;
    // 回到开始位置
    cursor.seek(SeekFrom::Start(0))?;
    // 反序列化
    let decoded: Person = serde_json::from_reader(cursor)?;
    assert_eq!(person, decoded);
    Ok(())
}
```

### 2. 高效的数据处理管道
```rust
use std::io::Cursor;
use std::io::{Read, Write};
fn process_data_pipeline() -> std::io::Result<()> {
    // 模拟数据源
    let source_data = b"Hello, World!".to_vec();
    let mut cursor = Cursor::new(source_data);
    // 处理管道
    let mut buffer = Vec::new();
    {
        let mut writer = Cursor::new(&mut buffer);
        let mut chunk = [0; 4];
        while let Ok(n) = cursor.read(&mut chunk) {
            if n == 0 { break; }
            // 转换为大写
            let upper = chunk[..n]
                .iter()
                .map(|&b| b.to_ascii_uppercase())
                .collect::<Vec<_>>();
            writer.write_all(&upper)?;
        }
    }
    println!("Processed data: {}", String::from_utf8_lossy(&buffer));
    // 输出：HELLO, WORLD!
    Ok(())
}
```

## 💡 性能优化技巧
### 1. 预分配缓冲区
```rust
use std::io::Cursor;
use std::io::Write;
fn optimized_buffer() -> std::io::Result<()> {
    // 预分配缓冲区
    let mut cursor = Cursor::new(Vec::with_capacity(1024));
    // 批量写入
    for i in 0..100 {
        writeln!(cursor, "Line {}", i)?;
    }
    println!("Final size: {}", cursor.get_ref().len());
    println!("Capacity: {}", cursor.get_ref().capacity());
    Ok(())
}
```

### 2. 零拷贝读取
```rust
use std::io::Cursor;
use std::io::{Read, Write};
fn zero_copy_reading() -> std::io::Result<()> {
    let data = b"Large data block".to_vec();
    let cursor = Cursor::new(data);
    // 获取引用而不是拷贝数据
    let slice = cursor.get_ref();
    println!("Data: {}", String::from_utf8_lossy(slice));
    Ok(())
}
```

## 📊 性能对比
```rust
use std::io::Cursor;
use std::io::{Read, Write};
use std::time::Instant;
fn performance_comparison() -> std::io::Result<()> {
    let size = 1_000_000;
    let data = vec![1u8; size];
    // 使用Vec直接操作
    let start = Instant::now();
    let mut vec = Vec::new();
    vec.extend_from_slice(&data);
    let vec_time = start.elapsed();
    // 使用Cursor操作
    let start = Instant::now();
    let mut cursor = Cursor::new(Vec::with_capacity(size));
    cursor.write_all(&data)?;
    let cursor_time = start.elapsed();
    println!("Vec time: {:?}", vec_time);
    println!("Cursor time: {:?}", cursor_time);
    Ok(())
}
```

## 🎯 最佳实践
## 1.使用场景选择
            + 需要随机访问内存数据时
            + 实现内存缓存时
            + 构建数据处理管道时
            + 需要像文件一样操作内存数据时
    - **2. 性能优化建议**
            + 合理预分配缓冲区大小
            + 使用批量读写操作
            + 适当利用零拷贝特性
            + 避免频繁的seek操作
    - **3. 注意事项**
            + 大数据量操作时注意内存使用
            + 正确处理错误情况
            + 及时释放不需要的资源

## 📝 总结
+ Cursor是Rust中进行内存IO操作的利器，它不仅提供了灵活的接口，还能带来可观的性能提升。合理使用Cursor可以：
        * 提高代码的可维护性
        * 优化内存使用效率
        * 提升数据处理性能
        * 简化IO操作逻辑
+ 掌握了Cursor，相信你的Rust代码会更上一层楼！

