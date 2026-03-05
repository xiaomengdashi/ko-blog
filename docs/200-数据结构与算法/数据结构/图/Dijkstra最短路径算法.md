---
sidebar_position: 1
slug: /数据结构与算法/数据结构/图/Dijkstra最短路径算法
---

### 0.1. Dijkstra 最短路径算法详解**
**Dijkstra算法** 是一种用于在 **带权有向图（或无向图）** 中计算 **单源最短路径** 的算法，适用于 **边权非负** 的情况。它由荷兰计算机科学家 **Edsger W. Dijkstra** 于1956年提出，广泛应用于 **网络路由、地图导航、任务调度** 等领域。

---

## 1. 1. Dijkstra 算法的核心特性**
### 1.1. (1) 贪心策略（Greedy）**
+ 每次选择当前 **距离起点最近** 的节点进行扩展，逐步确定最短路径。  
+ **局部最优 → 全局最优**（因边权非负，无法被后续路径优化）。

### 1.2. (2) 适用范围**
+ **边权非负**（若存在负权边，需改用 Bellman-Ford 或 SPFA 算法）。  
+ **单源最短路径**（求一个起点到所有其他点的最短路径）。

### 1.3. (3) 时间复杂度**
+ **朴素实现（邻接矩阵）**：`O(V²)`（V=顶点数）。  
+ **优先队列优化（邻接表）**：`O(E + V log V)`（E=边数）。

---

## 2. 2. Dijkstra 算法的步骤与实现**
### 2.1. (1) 算法流程**
1. **初始化**：  
    - 设置起点 `s` 的距离 `dist[s] = 0`，其他节点 `dist[u] = ∞`。  
    - 所有节点标记为 **未访问**。
2. **循环执行以下操作**：  
    - 从 **未访问节点** 中选择 `dist` 最小的节点 `u`（贪心选择）。  
    - 标记 `u` 为 **已访问**。  
    - 对 `u` 的所有邻接节点 `v`，进行 **松弛操作（Relaxation）**：  

```python
if dist[v] > dist[u] + weight(u, v):
    dist[v] = dist[u] + weight(u, v)  # 更新最短距离
    prev[v] = u                       # 记录前驱节点（用于路径回溯）
```

3. **终止条件**：  
    - 所有节点已访问，或剩余节点的 `dist` 均为 `∞`（不可达）。

### 2.2. (2) 代码实现（优先队列优化）**
```python
import heapq

def dijkstra(graph, start):
    n = len(graph)
    dist = [float('inf')] * n
    dist[start] = 0
    heap = [(0, start)]  # (distance, node)
    visited = set()

    while heap:
        current_dist, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)
        for v, weight in graph[u]:
            if dist[v] > current_dist + weight:
                dist[v] = current_dist + weight
                heapq.heappush(heap, (dist[v], v))
    return dist
```

**输入示例（邻接表）**：  

```python
graph = [
    [(1, 4), (2, 1)],    # 节点 0 的邻接边 (邻居, 权重)
    [(3, 2)],             # 节点 1
    [(1, 1), (3, 5)],     # 节点 2
    []                     # 节点 3
]
print(dijkstra(graph, 0))  # 输出: [0, 2, 1, 4]
```

---

## 3. 3. Dijkstra 的适用场景**
| **问题类型** | **是否适用** | **替代算法** |
| --- | --- | --- |
| 地图导航（非负权边） | ✅ | A*（启发式优化） |
| 网络路由（链路延迟） | ✅ | Bellman-Ford（负权） |
| 任务调度（时间约束） | ✅ | 动态规划 |
| 存在负权边 | ❌ | SPFA 或 Bellman-Ford |


---

## 4. 4. 经典例题**
### 4.1. (1) 网络延迟时间（LeetCode 743）**
**问题**：计算信号从起点 `k` 传播到所有节点的最短时间。  
**解法**：Dijkstra 求最长最短路径。  

```python
def networkDelayTime(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    dist = dijkstra(graph, k, n)
    max_dist = max(dist)
    return max_dist if max_dist < float('inf') else -1
```

### 4.2. (2) 最低成本路径（LeetCode 1584）**
**问题**：连接所有点的最小曼哈顿距离和（最小生成树变种）。  
**解法**：Dijkstra 类似 Prim 算法。  

---

## 5. 5. 常见问题与优化**
### 5.1. (1) 为什么不能处理负权边？**
+ 贪心策略假设当前最短路径不会被后续路径优化，但负权边可能使已确定的路径变得更短。  
+ **反例**：  

```latex
0 → 1 (weight: 1)  
0 → 2 (weight: 2)  
2 → 1 (weight: -1)  
Dijkstra 会错误输出 dist[1] = 1（实际应为 0: 0→2→1）。
```

### 5.2. (2) 如何优化时间复杂度？**
+ **优先队列（堆）**：将查找最小 `dist` 的时间从 `O(V)` 降为 `O(log V)`。  
+ **斐波那契堆**：理论最优 `O(E + V log V)`，但实现复杂。

### 5.3. (3) 如何记录最短路径？**
+ 维护 `prev` 数组，回溯路径：  

```python
def reconstruct_path(prev, start, end):
    path = []
    while end != start:
        path.append(end)
        end = prev[end]
    path.append(start)
    return path[::-1]
```

---

## 6. 总结**
| **关键点** | **说明** |
| --- | --- |
| **核心思想** | 贪心策略 + 松弛操作，逐步确定最短路径。 |
| **适用条件** | 边权非负，单源最短路径。 |
| **时间复杂度** | 普通 `O(V²)`，优先队列优化 `O(E + V log V)`。 |
| **对比其他算法** | A*（启发式）、Bellman-Ford（负权）、Floyd-Warshall（多源）。 |
| **实际应用** | 路由协议（OSPF）、导航系统、任务调度。 |


Dijkstra 是理解最短路径算法的基石，掌握后可为学习 **A***、**SPFA** 等算法打下基础！ 🚀

