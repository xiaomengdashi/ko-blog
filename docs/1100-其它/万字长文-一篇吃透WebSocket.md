---
sidebar_position: 1
slug: /其它/万字长文-一篇吃透WebSocket
---

WebSocket 是一种在单个 TCP 连接上进行全双工通讯的协议。它允许服务端主动发送信息给客户端，是实现推送技术的一种非常流行的解决方案。以下是一篇万字长文，带你全面了解 WebSocket 的概念、原理、易错常识以及动手实践。

## 1. 概念
### 1.1. WebSocket 简介
WebSocket 是一种网络通信协议，位于 OSI 模型的应用层。它于2011年由 IETF 正式标准化为 RFC 6455，并在 HTML5 中被广泛支持。

### 1.2. WebSocket 与 HTTP
WebSocket 和 HTTP 都是基于 TCP 协议的应用层协议。但与 HTTP 不同的是，WebSocket 提供了全双工通信能力，即客户端和服务器可以在任何时候发送消息，而无需等待对方的请求。

## 2. 理
### 2.1. WebSocket 连接建立
WebSocket 连接的建立需要借助 HTTP 协议进行握手。以下是握手过程：

（1）客户端发送一个特殊的 HTTP 请求，请求升级协议为 WebSocket。

+ _1）_**Connection**：必须设置 Upgrade，表示客户端希望连接升级；
+ _2）_**Upgrade**：字段必须设置 websocket，表示希望升级到 WebSocket 协议；
+ _3）_**Sec-WebSocket-Version**：表示支持的 WebSocket 版本。RFC6455 要求使用的版本是 13，之前草案的版本均应当弃用；
+ _4）_**Sec-WebSocket-Key**：是随机的字符串，服务器端会用这些数据来构造出一个 SHA-1 的信息摘要；
+ _5）_**Sec-WebSocket-Extensions**：用于协商本次连接要使用的 WebSocket 扩展：客户端发送支持的扩展，服务器通过返回相同的首部确认自己支持一个或多个扩展；
+ _6）_**Origin**：字段是可选的，通常用来表示在浏览器中发起此 WebSocket 连接所在的页面，类似于 Referer。但是，与 Referer 不同的是，Origin 只包含了协议和主机名称。

**针对上述第4）点：**把 “_Sec-WebSocket-Key_” 加上一个特殊字符串 “_258EAFA5-E914-47DA-95CA-C5AB0DC85B11_”，然后计算 SHA-1 摘要，之后进行 Base64 编码，将结果做为 “_Sec-WebSocket-Accept_” 头的值，返回给客户端。

![](/img/posts/3ac261e9c9971d0112e55a26973a433b.png)

（2）服务器收到请求后，如果同意升级，则返回一个 HTTP 响应，表示协议升级成功。

+ _1）_101 响应码确认升级到 WebSocket 协议；
+ _2）_ 设置 Connection 头的值为 “Upgrade” 来指示这是一个升级请求（HTTP 协议提供了一种特殊的机制，这一机制允许将一个已建立的连接升级成新的、不相容的协议）；
+ _3）_ Upgrade 头指定一项或多项协议名，按优先级排序，以逗号分隔。这里表示升级为 WebSocket 协议；
+ _4）_ 签名的键值验证协议支持。

![](/img/posts/75882f9fa81a388184935da09dd38397.png)

（3）客户端和服务器建立 WebSocket 连接，开始双向通信。

（4）客户端关闭连接。

### 2.2. WebSocket 数据帧格式
WebSocket 数据帧分为两种：文本帧和二进制帧。以下是数据帧的基本格式：

+ FIN：表示是否为消息的最后一个分片，1 表示是，0 表示否。
+ RSV1、RSV2、RSV3：扩展位，用于自定义协议扩展。
+ Opcode：操作码，表示帧类型。例如，0x1 表示文本帧，0x2 表示二进制帧。
+ Mask：表示是否对数据进行掩码处理，1 表示是，0 表示否。
+ Payload Length：负载长度，表示实际数据的长度。

![](/img/posts/5af60a098168cc5b17ae402a3c3075ad.png)websocket数据格式帧格式：

![](/img/posts/8ad71dd4be753c2b6505c056f6bbcf03.png)

Payload length 表示以字节为单位的 “有效负载数据” 长度。

**它有以下几种情形：**

+ 1）如果值为 0-125，那么就表示负载数据的长度；
+ 2）如果是 126，那么接下来的 2 个字节解释为 16 位的无符号整形作为负载数据的长度；
+ 3）如果是 127，那么接下来的 8 个字节解释为一个 64 位的无符号整形（最高位的 bit 必须为 0）作为负载数据的长度。

_**数据分片：**_

WebSocket 的每条消息可能被切分成多个数据帧。当 WebSocket 的接收方收到一个数据帧时，会根据 FIN 的值来判断，是否已经收到消息的最后一个数据帧。

利用 FIN 和 Opcode，我们就可以跨帧发送消息。

**操作码告诉了帧应该做什么：**

+ 1）如果是 0x1，有效载荷就是文本；
+ 2）如果是 0x2，有效载荷就是二进制数据；
+ 3）如果是 0x0，则该帧是一个延续帧（这意味着服务器应该将帧的有效负载连接到从该客户机接收到的最后一个帧）。

### 2.3. webSocket 连接关闭
1. **发送关闭帧**：客户端发送一个关闭控制帧到服务器。这个帧包含一个状态代码和一个可选的关闭消息，用于说明关闭连接的原因。![](/img/posts/24bf0202b6b3a1ee813b4f9ef45d3731.png)

2. **等待服务器响应**：客户端发送关闭帧后，它会等待服务器发送一个确认的关闭帧。如果服务器正确地遵循协议，它会发送一个关闭帧作为回应。

![](/img/posts/e84f7f05d70fc1410c50b15121e86e3a.png)

## 3. WebSocket 心跳
网络中的接收和发送数据都是使用 Socket 进行实现。但是如果此套接字已经断开，那发送数据和接收数据的时候就一定会有问题。

**可是如何判断这个套接字是否还可以使用呢？**这个就需要在系统中创建心跳机制。

所谓 “心跳” 就是定时发送一个自定义的结构体（心跳包或心跳帧），让对方知道自己 “在线”，以确保链接的有效性。

而所谓的心跳包就是客户端定时发送简单的信息给服务器端告诉它我还在而已。代码就是每隔几分钟发送一个固定信息给服务端，服务端收到后回复一个固定信息，如果服务端几分钟内没有收到客户端信息则视客户端断开。

**在 WebSocket 协议中定义了 心跳 Ping 和 心跳 Pong 的控制帧：**

+ _1）_心跳 Ping 帧包含的操作码是 0x9：如果收到了一个心跳 Ping 帧，那么终端必须发送一个心跳 Pong 帧作为回应，除非已经收到了一个关闭帧。否则终端应该尽快回复 Pong 帧；
+ _2）_心跳 Pong 帧包含的操作码是 0xA：作为回应发送的 Pong 帧必须完整携带 Ping 帧中传递过来的 “应用数据” 字段。

**针对第2）点：**如果终端收到一个 Ping 帧但是没有发送 Pong 帧来回应之前的 Ping 帧，那么终端可以选择仅为最近处理的 Ping 帧发送 Pong 帧。此外，可以自动发送一个 Pong 帧，这用作单向心跳。

## 4. 易错常识
1. WebSocket 是一种与 HTTP 不同的协议。两者都位于 OSI 模型的应用层，并且都依赖于传输层的 TCP 协议。

**虽然它们不同，但是 RFC 6455 中规定：**WebSocket 被设计为在 HTTP 80 和 443 端口上工作，并支持 HTTP 代理和中介，从而使其与 HTTP 协议兼容。 为了实现兼容性，WebSocket 握手使用 HTTP Upgrade 头，从 HTTP 协议更改为 WebSocket 协议。

2. WebSocket 连接一旦建立，即可双向通信，不再需要 HTTP 请求。
3. WebSocket 不支持跨域请求，但可以通过设置代理来实现。

## 5. 动手实践
以下是一个简单的 WebSocket 实践，包括客户端和服务器端代码。

1. 服务器端（使用 Node.js 和 ws 库）

先安装ws，在运行server

```bash
mkdir web
node install ws
node server.js
```

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send('Hello, ' + message);
  });
});
```

2. 客户端（使用浏览器和原生 WebSocket API）

```html
`<!DOCTYPE html>`
`<html lang="zh-CN">`
`<head>`
    `<meta charset="UTF-8">`
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
    `<title>`WebSocket `示例</title>`</head>`<body>``
    `<h1>`WebSocket `客户端示例</h1>`<div>`<label for="messageInput">``发送消息:</label>
        `<input type="text" id="messageInput" placeholder="输入消息">`
        `<button onclick="sendMessage()">`发送</button>`
    </div>
    <div>
        `<h2>`接收到的消息:</h2>
        `<ul id="messageList">`</ul>
    </div>

    `<script>`
        // WebSocket 服务器地址
        const websocketServerUrl = "ws://localhost:8080";

        // 创建 WebSocket 连接
        const socket = new WebSocket(websocketServerUrl);

        // 当连接成功时触发
        socket.onopen = function(event) {
            appendMessage("WebSocket 连接成功!");
        };

        // 当收到消息时触发
        socket.onmessage = function(event) {
            appendMessage("收到消息: " + event.data);
        };

        // 当连接关闭时触发
        socket.onclose = function(event) {
            appendMessage("WebSocket 连接已关闭");
        };

        // 当发生错误时触发
        socket.onerror = function(error) {
            appendMessage("WebSocket 错误: " + error.message);
        };

        // 发送消息到服务器
        function sendMessage() {
            const messageInput = document.getElementById("messageInput");
            const message = messageInput.value;
            if (message) {
                socket.send(message);
                appendMessage("发送消息: " + message);
                messageInput.value = "";
            }
        }

        // 在消息列表中追加消息
        function appendMessage(message) {
            const messageList = document.getElementById("messageList");
            const messageItem = document.createElement("li");
            messageItem.textContent = message;
            messageList.appendChild(messageItem);
        }
    </script>
</body>
</html>
```

