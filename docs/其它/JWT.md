---
sidebar_position: 1
slug: /其它/JWT
---

### 1. 使用JWT（JSON Web Token）
JWT是一种常用的方式，特别适合无状态的应用场景。用户登录后，服务器生成一个JWT并返回给客户端，客户端将其存储在本地存储（如LocalStorage或SessionStorage）或Cookie中。

#### 实现步骤：
1. **用户登录**：用户在前端页面提交登录表单，前端将用户凭据发送到后端API。
2. **生成JWT**：后端验证用户凭据，如果验证成功，生成一个JWT并返回给前端。
3. **前端保存JWT**：前端将JWT保存在LocalStorage或SessionStorage中。
4. **后续请求**：前端在每次请求时从LocalStorage或SessionStorage中获取JWT，并将其添加到请求头中（如`Authorization: Bearer <token>`）。

```javascript
<form id="loginForm">
  <input type="text" id="username" placeholder="Username" />
  <input type="password" id="password" placeholder="Password" />
  <button type="submit">Login</button>
  </form>

  <script>
  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Logged in successfully');
    } else {
      console.error('Login failed');
    }
  });

function fetchWithAuth(url) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

// 示例：使用fetchWithAuth函数进行后续请求
fetchWithAuth('/api/some-endpoint')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
</script>
```

### 2. 使用Cookie存储Session ID
另一种常见的方法是使用Cookie来存储Session ID。服务器在用户登录成功后，创建一个Session并将Session ID存储在Cookie中。

#### 实现步骤：
1. **用户登录**：用户在前端页面提交登录表单，前端将用户凭据发送到后端API。
2. **创建Session**：后端验证用户凭据，如果验证成功，创建一个Session，并将Session ID存储在Cookie中。
3. **前端请求**：前端在每次请求时自动将Cookie中的Session ID发送到后端。
4. **后端验证Session**：后端从请求中获取Session ID，并根据Session ID验证用户的身份。

```javascript
const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'password') {
    req.session.userId = 'some-user-id';
    res.send({ message: 'Logged in successfully' });
  } else {
    res.status(401).send({ message: 'Login failed' });
  }
});

app.get('/api/some-endpoint', (req, res) => {
  if (req.session.userId) {
    res.send({ data: 'Some protected data' });
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### 3. 混合使用JWT和Cookie
在某些情况下，可以将JWT存储在Cookie中，以便自动在每次请求中发送。

#### 实现步骤：
1. **用户登录**：用户在前端页面提交登录表单，前端将用户凭据发送到后端API。
2. **生成JWT并设置Cookie**：后端验证用户凭据，如果验证成功，生成一个JWT，并将其存储在Cookie中。
3. **前端请求**：浏览器在每次请求时自动将包含JWT的Cookie发送到后端。

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());

const secretKey = 'your-secret-key';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'password') {
    const token = jwt.sign({ userId: 'some-user-id' }, secretKey);
    res.cookie('jwt', token, { maxAge: 900000, httpOnly: true });
    res.send({ message: 'Logged in successfully' });
  } else {
    res.status(401).send({ message: 'Login failed' });
  }
});

app.get('/api/some-endpoint', (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      res.send({ data: 'Some protected data' });
    });
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### 总结
在浏览器中直接访问后端API时，保存登录信息的主要方法包括使用JWT、Cookie存储Session ID，或者混合使用JWT和Cookie。选择哪种方法取决于你的应用场景和安全需求。JWT适合无状态应用，而使用Cookie存储Session ID则适合需要在服务器端管理会话状态的场景。

