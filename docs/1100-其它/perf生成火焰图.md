---
sidebar_position: 5
slug: /其它/perf生成火焰图
---

## 1. 下载火焰图可视化生成器FlameGraph

```
# git clone https://github.com/brendangregg/FlameGraph.git
Cloning into 'FlameGraph'...
remote: Enumerating objects: 961, done.
remote: Total 961 (delta 0), reused 0 (delta 0), pack-reused 961
Receiving objects: 100% (961/961), 1.83 MiB | 118.00 KiB/s, done.
Resolving deltas: 100% (547/547), done.
# ls
FlameGraph
```

### 2. perf采集数据
```
perf record -F 99 -p 2347 -g -- sleep 30
[ perf record: Woken up 1 times to write data ]
[ perf record: Captured and wrote 0.627 MB perf.data (~27375 samples) ]
```


### 3. 生成火焰图
```
perf script -i perf.data | ./stackcollapse-perf.pl | ./flamegraph.pl > perf.svg
```


### 4. 解析火焰图
​ 浏览器打开perf.svg
火焰图是基于stack信息生成的SVG图片， 用来展示CPU的调用栈。

y****轴表示调用栈， 每一层都是一个函数。 调用栈越深， 火焰就越高， 顶部就是正在执行的函数， 下方都是它的父函数。

x****轴表示抽样数， 如果一个函数在x****轴占据的宽度越宽， 就表示它被抽到的次数多， 即执行的时间长。 注意x****轴不代表时间， 而是所有的调用栈合并后， 按字母顺序排列的。

火焰图就是看顶层的哪个函数占据的宽度最大。 只要有 “平顶”(plateaus)， 就表示该函数可能存在性能问题。

颜色没有特殊含义， 因为火焰图表示的是CPU的繁忙程度， 所以一般选择暖色调。
