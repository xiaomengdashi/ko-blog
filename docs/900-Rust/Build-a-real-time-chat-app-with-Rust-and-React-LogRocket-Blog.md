---
sidebar_position: 3
slug: /Rust/Build-a-real-time-chat-app-with-Rust-and-React-LogRocket-Blog
---

---
title: Build a real-time chat app with Rust and React - LogRocket Blog
date: '2024-12-07 11:58:14'
updated: '2024-12-23 23:16:05'
slug: /Rust/Build-a-real-time-chat-app-with-Rust-and-React-LogRocket-Blog---
![](/img/posts/4a3a6f108e95508abf4d9da1ac60c159.png)

### 1. See how LogRocket's AI-powered error tracking works
#### 1.1. no signup required
Check it out 

_**Editor’s Note:**__ This post was reviewed for accuracy on 26 April 2023. Since publication, _[Rust recently released v1.69](https://blog.rust-lang.org/2023/04/20/Rust-1.69.0.html)_, which contains increased capabilities when using _`_cargo_`_ and even more stabilized APIs. You can _[read more about Rust in our archive](https://blog.logrocket.com/tag/rust/)_ and _[in the official docs](https://www.rust-lang.org/learn)_._

![](/img/posts/6fb3cb57b20c6e0873af6a2d5173bb37.png)

If you’re looking to build a real-time chat app that is both fast and reliable, consider using Rust and React. Rust is known for its speed and reliability, while [React is one of the most popular frontend frameworks](https://survey.stackoverflow.co/2022/#most-popular-technologies-webframe-prof) for building user interfaces.

In this article, we’ll demonstrate how to build a real-time chat app with Rust and React that offers functionality for chat, checking user status, and indicating when a user is typing. We’ll use WebSockets to enable the two-way client-server communication.

_Jump ahead:_

+ [Introduction to real-time chat applications](https://blog.logrocket.com/real-time-chat-app-rust-react/#introduction-to-real-time-chat-applications)
+ [Introduction to WebSockets](https://blog.logrocket.com/real-time-chat-app-rust-react/#introduction-to-websockets)
+ [Getting started](https://blog.logrocket.com/real-time-chat-app-rust-react/#getting-started)
+ [Designing the real-time chat app architecture](https://blog.logrocket.com/real-time-chat-app-rust-react/#designing-the-real-time-chat-app-architecture)
+ [Building the WebSocket server in Rust](https://blog.logrocket.com/real-time-chat-app-rust-react/#building-the-websocket-server-in-rust)
    - [Creating the routes](https://blog.logrocket.com/real-time-chat-app-rust-react/#creating-the-routes)
    - [Handling the user session](https://blog.logrocket.com/real-time-chat-app-rust-react/#handling-the-user-session)
+ [Preparing the database with SQLite](https://blog.logrocket.com/real-time-chat-app-rust-react/#preparing-the-database-with-sqlite)
    - [Generating the schema](https://blog.logrocket.com/real-time-chat-app-rust-react/#generating-the-schema)
    - [Creating the structs](https://blog.logrocket.com/real-time-chat-app-rust-react/#creating-the-structs)
    - [Setting up the queries](https://blog.logrocket.com/real-time-chat-app-rust-react/#setting-up-the-queries)
        * [Finding users by phone number](https://blog.logrocket.com/real-time-chat-app-rust-react/#finding-users-by-phone-number)
        * [Adding a new user](https://blog.logrocket.com/real-time-chat-app-rust-react/#adding-a-new-user)
        * [Finding chat rooms and participants](https://blog.logrocket.com/real-time-chat-app-rust-react/#finding-chat-rooms-and-participants)
+ [Building the client UI with React](https://blog.logrocket.com/real-time-chat-app-rust-react/#building-the-client-ui-with-react)
    - [avatar component](https://blog.logrocket.com/real-time-chat-app-rust-react/#avatar-component)
    - [login component](https://blog.logrocket.com/real-time-chat-app-rust-react/#login-component)
    - [room component](https://blog.logrocket.com/real-time-chat-app-rust-react/#room-component)
    - [conversation component](https://blog.logrocket.com/real-time-chat-app-rust-react/#conversation-component)
    - [useWebsocket Hook](https://blog.logrocket.com/real-time-chat-app-rust-react/#usewebsocket-hook)
    - [useLocalStorage Hook](https://blog.logrocket.com/real-time-chat-app-rust-react/#uselocalstorage-hook)
    - [useConversation Hook](https://blog.logrocket.com/real-time-chat-app-rust-react/#useconversation-hook)
+ [Building the chat application](https://blog.logrocket.com/real-time-chat-app-rust-react/#building-the-chat-application)

### 2. Introduction to real-time chat applications
Real-time chat applications allow users to communicate with each other in real time through text, voice, or video. This type of app allows for more immediate messaging than other types of communication such as email or IM.

There are several reasons why chat applications must work in real time:

+ **Improved performance**: More immediate communication allows for more natural conversation
+ **Greater responsiveness**: Real-time functionality results in improved user experience
+ **Superior reliability**: With real-time functionality there‘s less opportunity for messages to be lost or delayed

### 3. Introduction to WebSockets
WebSockets enables two-way communication between the client and server in real-time chat applications. Using Rust to build the WebSocket server will enable the server to handle a large number of connections without slowing down. This is due to Rust’s speed and reliability.

Now that we have a better understanding of WebSockets, let’s get started building our real-time chat application!

### 4. Getting started
First, let’s review some prerequisites:

+ **Rust**: Ensure you have Rust installed on your computer. If you don’t have it, use the following command to install it: 

```rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
// if you are in windows see more installation method here
https://forge.rust-lang.org/infra/other-installation-methods.html
```

+ **React**: Ensure that your environment is ready for React development; use one of the below commands to install React if you don’t already have it: 

```rust
// on mac
brew install node
// on linux
nvm install v14.10.0
// on windows you can download nodejs installer here
https://nodejs.org/en/download/
```

Next, run the following commands to verify that everything is installed and working properly:

```rust
rustc --version
cargo --version
node --version
npm --version
```

### 5. Designing the real-time chat app architecture
Let’s create some design architecture for our real-time chat application. We’ll build a simple server; our application’s architecture will cover the following features:

+ **Chat**: between two users via direct messaging
+ **Typing indicator**: notifies the recipient when a user starts typing a chat to them
+ **User status**: indicates whether the user is online or offline

![](/img/posts/7fc7b28412a497d4060580c3734fc25e.png)

Real-time chat application system architecture.

This architecture is very simple and easy to follow. It consists of just a few components:

+ **WebSocket server**: This is the most important component of our application; it handles all the communication between clients and rooms
+ **Room manager**: This component is responsible for managing all the rooms in our application. It will create, update, and delete rooms. This component will be on the HTTP server
+ **User manager**: This component is responsible for managing all the users in our application. It will create, update, and delete users. This component will be on the HTTP server as well
+ **Message manager**: This component is responsible for managing all the messages in our application. It will create, update, and delete messages. This component one will be on the WebSocket server and the HTTP server. It will be used to store incoming messages from WebSockets and retrieve all messages already in the database when the user opens the chat room via the Rest API

### 6. Building the WebSocket server in Rust
There are many packages we can use to write a WebSocket server in Rust. For this tutorial, we’ll use [Actix Web](https://actix.rs/); it is a mature package and is easy to use.

To start, create a Rust project using the following command:

cargo new rust-react-chat

Next, add this package to the `Cargo.toml` file:

```rust
[package]
name = "rust-react-chat"
version = "0.1.0"
edition = "2021"

[dependencies]
actix = "0.13.0"
actix-files = "0.6.2"
actix-web = "4.2.1"
actix-web-actors = "4.1.0"
rand = "0.8.5"
serde = "1.0.147"
serde_json = "1.0.88"
```

Now, install `diesel_cli`; we’ll use this as our ORM:

:::info
cargo install diesel_cli --no-default-features --features sqlite

:::

Here’s how the structure of the project should look:

```rust
.
├── Cargo.lock
├── Cargo.toml
├── README.md
├── chat.db
├── .env
└── src
    ├── db.rs
    ├── main.rs
    ├── models.rs
    ├── routes.rs
    ├── schema.rs
    ├── server.rs
    └── session.rs
└── static
└── ui
```

Now, here’s a bit of information about the folders:

+ `src`: This folder contains all of our Rust code
+ `static`: This folder contains all of our static assets, HTML files, JavaScript files, and images
+ `ui`: This folder contains our React code; we’ll compile it later to the `static` file and export it to the `static` folder

Next, let’s write the entry point for our WebSocket server:

```rust
// src/main.rs
#[macro_use]
extern crate diesel;
use actix::*;
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{web, http, App, HttpServer};
use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
mod db;
mod models;
mod routes;
mod schema;
mod server;
mod session;
#[actix_web::main]
async fn main() -> std::io::`Result`<()>` {
    let server = server::ChatServer::new().start();
    let conn_spec = "chat.db";
    let manager = ConnectionManager::`<SqliteConnection>`::new(conn_spec);
    let pool = r2d2::Pool::builder().build(manager).expect("Failed to create pool.");
    let server_addr = "127.0.0.1";
    let server_port = 8080;
    let app = HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://localhost:8080")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(3600);
        App::new()
            .app_data(web::Data::new(server.clone()))
            .app_data(web::Data::new(pool.clone()))
            .wrap(cors)
            .service(web::resource("/").to(routes::index))
            .route("/ws", web::get().to(routes::chat_server))
            .service(routes::create_user)
            .service(routes::get_user_by_id)
            .service(routes::get_user_by_phone)
            .service(routes::get_conversation_by_id)
            .service(routes::get_rooms)
            .service(Files::new("/", "./static"))
    })
    .workers(2)
    .bind((server_addr, server_port))?
    .run();
    println!("Server running at http://{server_addr}:{server_port}/");
    app.await
}
```

Here’s some information about the packages we’re using:

+ `actix_cors`: Will be used to debug the UI; we’ll accept POST and GET requests from `localhost:3000` or `localhost:8080`
+ `actix_web`: For all HTTP-related features in the Actix Web package
+ `actix_files`: For embedding static files to one of our routes
+ `diesel`: Will be used to query the data from our SQLite database. If you prefer, you can change this to Postgres or MySQL
+ `serde_json`: Will be used to parse the JSON data that we’ll send to the React app

#### 6.1. Creating the routes
Now let’s make routes for our server. Since we will use a REST HTTP and WebSocket server, we can easily put everything in one file.

First, add all the packages we’ll need:

```rust
// src/routes.rs
use std::time::Instant;
use actix::*;
use actix_files::NamedFile;
use actix_web::{get, post, web, Error, HttpRequest, HttpResponse, Responder};
use actix_web_actors::ws;
use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
use serde_json::json;
use uuid::Uuid;
use crate::db;
use crate::models;
use crate::server;
use crate::session;
type DbPool = r2d2::`Pool`<`ConnectionManager<SqliteConnection>`>;
```

Then, add a route for embedding the home page to the root URL:

```rust
// src/routes.rs
pub async fn index() -> impl Responder {
    NamedFile::open_async("./static/index.html").await.unwrap()
}
```

This is the entry point for our WebSocket server. Right now it’s on `/ws` routes, but you can change it to whatever route name you like. Since we already registered all the dependencies we need in the `main.rs` file, we can just pass the dependency to the function parameter, like so:

```rust
// src/routes.rs
pub async fn chat_server(
    req: HttpRequest,
    stream: web::Payload,
    pool: web::`Data`<DbPool>`,
    srv: web::`Data`<`Addr<server::ChatServer>`>,
) -> `Result`<HttpResponse, Error>` {
    ws::start(
        session::WsChatSession {
            id: 0,
            hb: Instant::now(),
            room: "main".to_string(),
            name: None,
            addr: srv.get_ref().clone(),
            db_pool: pool,
        },
        &req,
        stream
    )
}
```

Next, we need to add a REST API to our route in order to get the necessary data to make our chat work:

```rust
// src/routes.rs
#[post("/users/create")]
pub async fn create_user(
    pool: web::`Data`<DbPool>`,
    form: web::`Json`<models::NewUser>`,
) -> `Result`<HttpResponse, Error>` {
    let user = web::block(move || {
        let mut conn = pool.get()?;
        db::insert_new_user(&mut conn, &form.username, &form.phone)
    })
        .await?
        .map_err(actix_web::error::ErrorUnprocessableEntity)?;
    Ok(HttpResponse::Ok().json(user))
}
#[get("/users/{user_id}")]
pub async fn get_user_by_id(
    pool: web::`Data`<DbPool>`,
    id: web::`Path`<Uuid>`,
) -> `Result`<HttpResponse, Error>` {
    let user_id = id.to_owned();
    let user = web::block(move || {
        let mut conn = pool.get()?;
        db::find_user_by_uid(&mut conn, user_id)
    })
        .await?
        .map_err(actix_web::error::ErrorInternalServerError)?;
    if let Some(user) = user {
        Ok(HttpResponse::Ok().json(user))
    } else {
        let res = HttpResponse::NotFound().body(
            json!({
                "error": 404,
                "message": format!("No user found with phone: {id}")
            })
            .to_string(),
        );
        Ok(res)
    }
}
#[get("/conversations/{uid}")]
pub async fn get_conversation_by_id(
    pool: web::`Data`<DbPool>`,
    uid: web::`Path`<Uuid>`,
) -> `Result`<HttpResponse, Error>` {
    let room_id = uid.to_owned();
    let conversations = web::block(move || {
        let mut conn = pool.get()?;
        db::get_conversation_by_room_uid(&mut conn, room_id)
    })
        .await?
        .map_err(actix_web::error::ErrorInternalServerError)?;
    if let Some(data) = conversations {
        Ok(HttpResponse::Ok().json(data))
    } else {
        let res = HttpResponse::NotFound().body(
            json!({
                "error": 404,
                "message": format!("No conversation with room_id: {room_id}")
            })
            .to_string(),
        );
        Ok(res)
    }
}
#[get("/users/phone/{user_phone}")]
pub async fn get_user_by_phone(
    pool: web::`Data`<DbPool>`,
    phone: web::`Path`<String>`,
) -> `Result`<HttpResponse, Error>` {
    let user_phone = phone.to_string();
    let user = web::block(move || {
        let mut conn = pool.get()?;
        db::find_user_by_phone(&mut conn, user_phone)
    })
        .await?
        .map_err(actix_web::error::ErrorInternalServerError)?;
    if let Some(user) = user {
        Ok(HttpResponse::Ok().json(user))
    } else {
        let res = HttpResponse::NotFound().body(
            json!({
                "error": 404,
                "message": format!("No user found with phone: {}", phone.to_string())
            })
            .to_string(),
        );
        Ok(res)
    }
}
#[get("/rooms")]
pub async fn get_rooms(
    pool: web::`Data`<DbPool>`,
) -> `Result`<HttpResponse, Error>` {
    let rooms = web::block(move || {
        let mut conn = pool.get()?;
        db::get_all_rooms(&mut conn)
    })
        .await?
        .map_err(actix_web::error::ErrorInternalServerError)?;
    if !rooms.is_empty() {
        Ok(HttpResponse::Ok().json(rooms))
    } else {
        let res = HttpResponse::NotFound().body(
            json!({
                "error": 404,
                "message": "No rooms available at the moment.",
            })
            .to_string(),
        );
        Ok(res)
    }
}
```

Now, let’s handle the WebSocket connection. First, let’s import all the packages we need again:

```rust
// src/server.rs
use std::collections::{HashMap, HashSet};
use serde_json::json;
use actix::prelude::*;
use rand::{self, rngs::ThreadRng, Rng};
use crate::session;
#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);
#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
    pub addr: `Recipient`<Message>`,
}
#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: usize,
}
#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    pub id: usize,
    pub msg: String,
    pub room: String,
}
pub struct ListRooms;
impl actix::Message for ListRooms {
    type Result = `Vec`<String>`;
}
#[derive(Message)]
#[rtype(result = "()")]
pub struct Join {
    pub id: usize,
    pub name: String,
}
```

Next, let’s implement the trait to manage the WebSocket connections. This code will handle all the messages coming from users and send them back to participants in the chat room:

```rust
// src/server.rs
#[derive(Debug)]
pub struct ChatServer {
    sessions: `HashMap`<usize, `Recipient<Message>`>,
    rooms: `HashMap`<String, `HashSet<usize>`>,
    rng: ThreadRng,
}
impl ChatServer {
    pub fn new() -> ChatServer {
        let mut rooms = HashMap::new();
        rooms.insert("main".to_string(), HashSet::new());
        Self {
            sessions: HashMap::new(),
            rooms,
            rng: rand::thread_rng()
        }
    }
    fn send_message(&self, room: &str, message: &str, skip_id: usize) {
        if let Some(sessions) = self.rooms.get(room) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(addr) = self.sessions.get(id) {
                        addr.do_send(Message(message.to_owned()));
                    }
                }
            }
        }
    }
}
impl Actor for ChatServer {
    type Context = `Context`<Self>`;
}
impl `Handler`<Connect>` for ChatServer {
    type Result = usize;
    fn handle(&mut self, msg: Connect, _: &mut `Context`<Self>`) -> Self::Result {
        let id = self.rng.gen::`<usize>`();
        self.sessions.insert(id, msg.addr);
        self.rooms
            .entry("main".to_string())
            .or_insert_with(HashSet::new)
            .insert(id);
        self.send_message("main", &json!({
            "value": vec![format!("{}", id)],
            "chat_type": session::ChatType::CONNECT
        }).to_string(), 0);
        id
    }
}
impl `Handler`<Disconnect>` for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: Disconnect, _: &mut Self::Context) -> Self::Result {
        let mut rooms: `Vec`<String>` = vec![];
        if self.sessions.remove(&msg.id).is_some() {
            for (name, sessions) in &mut self.rooms {
                if sessions.remove(&msg.id) {
                    rooms.push(name.to_owned());
                }
            }
        }
        for room in rooms {
            self.send_message("main", &json!({
                "room": room,
                "value": vec![format!("Someone disconnect!")],
                "chat_type": session::ChatType::DISCONNECT
            }).to_string(), 0);
        }
    }
}
impl `Handler`<ClientMessage>` for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: ClientMessage, _: &mut Self::Context) -> Self::Result {
        self.send_message(&msg.room, &msg.msg, msg.id);
    }
}
impl `Handler`<ListRooms>` for ChatServer {
    type Result = `MessageResult`<ListRooms>`;
    fn handle(&mut self, _: ListRooms, _: &mut Self::Context) -> Self::Result {
        let mut rooms = vec![];
        for key in self.rooms.keys() {
            rooms.push(key.to_owned());
        }
        MessageResult(rooms)
    }
}
impl `Handler`<Join>` for ChatServer {
    type Result = ();
    fn handle(&mut self, msg: Join, _: &mut Self::Context) -> Self::Result {
        let Join {id, name} = msg;
        let mut rooms = vec![];
        for (n, sessions) in &mut self.rooms {
            if sessions.remove(&id) {
                rooms.push(n.to_owned());
            }
        }
        for room in rooms {
            self.send_message(&room, &json!({
                "room": room,
                "value": vec![format!("Someone disconnect!")],
                "chat_type": session::ChatType::DISCONNECT
            }).to_string(), 0);
        }
        self.rooms
            .entry(name.clone())
            .or_insert_with(HashSet::new)
            .insert(id);
    }
}
```

#### 6.2. Handling the user session
Now, let’s address the user session. Here we’ll receive a message, save it to the database, and then send it back to the participant in the chat room.

To start, import all the packages:

```rust
// src/session.rs
use std::time::{Duration, Instant};
use actix::prelude::*;
use actix_web::web;
use actix_web_actors::ws;
use serde::{Deserialize, Serialize};
use diesel::{
    prelude::*,
    r2d2::{self, ConnectionManager},
};
use crate::db;
use crate::models::NewConversation;
use crate::server;
```

You can change the duration of the connection to the WebSocket here. So the `HEARTBEAT` is the duration to keep the connection alive with the client. And `CLIENT_TIMEOUT` is the duration to check if the client is still connected:

```rust
// src/session.rs
const HEARBEET: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);
type DbPool = r2d2::`Pool`<`ConnectionManager<SqliteConnection>`>;
```

Now let’s create some structs to store all the data we need:

```rust
// src/session.rs
#[derive(Debug)]
pub struct WsChatSession {
    pub id: usize,
    pub hb: Instant,
    pub room: String,
    pub name: `Option`<String>`,
    pub addr: `Addr`<server::ChatServer>`,
    pub db_pool: web::`Data`<DbPool>`,
}
#[derive(PartialEq, Serialize, Deserialize)]
pub enum ChatType {
    TYPING,
    TEXT,
    CONNECT,
    DISCONNECT,
}
#[derive(Serialize, Deserialize)]
struct ChatMessage {
    pub chat_type: ChatType,
    pub value: `Vec`<String>`,
    pub room_id: String,
    pub user_id: String,
    pub id: usize,
}
```

This struct will be used for the following:

+ `WsChatSession`: To make a custom implementation of the Actix Web actor
+ `ChatMessage`: To define the object that will be sent to and received from the user

Now, let’s implement our session’s `Actor` and stream `Handler`:

```rust
// src/session.rs
impl Actor for WsChatSession {
    type Context = ws::`WebsocketContext`<Self>`;
    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
        let addr = ctx.address();
        self.addr
            .send(server::Connect {
                addr: addr.recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => act.id = res,
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);
    }
    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        self.addr.do_send(server::Disconnect { id: self.id });
        Running::Stop
    }
}
impl `Handler`<server::Message>` for WsChatSession {
    type Result = ();
    fn handle(&mut self, msg: server::Message, ctx: &mut Self::Context) -> Self::Result {
        ctx.text(msg.0);
    }
}
impl `StreamHandler`<`Result<ws::Message, ws::ProtocolError>`> for WsChatSession {
    fn handle(&mut self, item: `Result`<ws::Message, ws::ProtocolError>`, ctx: &mut Self::Context) {
        let msg = match item {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };
        match msg {
            ws::Message::Ping(msg) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.hb = Instant::now();
            }
            ws::Message::Text(text) => {
                let data_json = serde_json::from_str::`<ChatMessage>`(&text.to_string());
                if let Err(err) = data_json {
                    println!("{err}");
                    println!("Failed to parse message: {text}");
                    return;
                }
                let input = data_json.as_ref().unwrap();
                match &input.chat_type {
                    ChatType::TYPING => {
                        let chat_msg = ChatMessage {
                            chat_type: ChatType::TYPING,
                            value: input.value.to_vec(),
                            id: self.id,
                            room_id: input.room_id.to_string(),
                            user_id: input.user_id.to_string(),
                        };
                        let msg = serde_json::to_string(&chat_msg).unwrap();
                        self.addr.do_send(server::ClientMessage {
                            id: self.id,
                            msg,
                            room: self.room.clone(),
                        })
                    }
                    ChatType::TEXT => {
                        let input = data_json.as_ref().unwrap();
                        let chat_msg = ChatMessage {
                            chat_type: ChatType::TEXT,
                            value: input.value.to_vec(),
                            id: self.id,
                            room_id: input.room_id.to_string(),
                            user_id: input.user_id.to_string(),
                        };
                        let mut conn = self.db_pool.get().unwrap();
                        let new_conversation = NewConversation {
                            user_id: input.user_id.to_string(),
                            room_id: input.room_id.to_string(),
                            message: input.value.join(""),
                        };
                        let _ = db::insert_new_conversation(&mut conn, new_conversation);
                        let msg = serde_json::to_string(&chat_msg).unwrap();
                        self.addr.do_send(server::ClientMessage {
                            id: self.id,
                            msg,
                            room: self.room.clone(),
                        })
                    }
                    _ => {}
                }
            }
            ws::Message::Binary(_) => println!("Unsupported binary"),
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            ws::Message::Nop => (),
        }
    }
}
impl WsChatSession {
    fn hb(&self, ctx: &mut ws::`WebsocketContext`<Self>`) {
        ctx.run_interval(HEARBEET, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                act.addr.do_send(server::Disconnect { id: act.id });
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }
}
```

### 7. Preparing the database
Next, let’s prepare the database. We’ll use SQLite to keep things simple. Here’s how the schema will look:

![](/img/posts/3911131708ac794867f13946cc2423da.png)

The table will be used for the following:

+ `users`: Store user data. Since we’re not implementing a full authentication system at this time, we’ll only save the username and phone number for now
+ `rooms`: Store a list of all chat rooms
+ `conversations`: Lists where all messages are stored in our database

Next, let’s generate the database migration for our schema:

```rust
// shell
diesel migration generate create_users
diesel migration generate create_rooms
diesel migration generate create_conversations
```

Here’s how the migration SQL will look:

```rust
-- migrations/2022-11-21-101206_create_users/up.sql
CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    username VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    created_at TEXT NOT NULL,
    unique(phone)
)

-- migrations/2022-11-21-101215_create_rooms/up.sql
CREATE TABLE rooms (
    id TEXT PRIMARY KEY NOT NULL,
    name VARCHAR NOT NULL,
    last_message TEXT NOT NULL,
    participant_ids TEXT NOT NULL,
    created_at TEXT NOT NULL
)

-- migrations/2022-11-21-101223_create_conversations/up.sql
CREATE TABLE conversations (
    id TEXT PRIMARY KEY NOT NULL,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content VARCHAR NOT NULL,
    created_at TEXT NOT NULL
)
```

We also need to add some dummy data just to have some examples for initial rendering to the client later:

diesel migration generate dummy_data

Here’s how the data will look:

```rust
-- migrations/2022-11-24-034153_generate_dummy_data/up.sql
    INSERT INTO users(id, username, phone, created_at) 
    VALUES
    ("4fbd288c-d3b2-4f78-adcf-def976902d50","Ahmad Rosid","123","2022-11-23T07:56:30.214162+00:00"),
    ("1e9a12c1-e98c-4a83-a55a-32cc548a169d","Ashley Young","345","2022-11-23T07:56:30.214162+00:00"),
    ("1bc833808-05ed-455a-9d26-64fe1d96d62d","Charles Edward","678","2022-12-23T07:56:30.214162+00:00");
INSERT INTO rooms(id, name, last_message, participant_ids, created_at)
    VALUES
    ("f061383b-0393-4ce8-9a85-f31d03762263", "Charles Edward", "Hi, how are you?", "1e9a12c1-e98c-4a83-a55a-32cc548a169d,1bc833808-05ed-455a-9d26-64fe1d96d62d", "2022-12-23T07:56:30.214162+00:00"),
    ("008e9dc4-f01d-4429-ba31-986d7e63cce8", "Ahmad Rosid", "Hi... are free today?", "1e9a12c1-e98c-4a83-a55a-32cc548a169d,1bc833808-05ed-455a-9d26-64fe1d96d62d", "2022-12-23T07:56:30.214162+00:00");
INSERT INTO conversations(id, user_id, room_id, content, created_at)
    VALUES
    ("9aeab1a7-e063-40d1-a120-1f7585fa47d6", "1bc833808-05ed-455a-9d26-64fe1d96d62d", "f061383b-0393-4ce8-9a85-f31d03762263", "Hello", "2022-12-23T07:56:30.214162+00:00"),
    ("f4e54e70-736b-4a79-a622-3659b0b555e8", "1e9a12c1-e98c-4a83-a55a-32cc548a169d", "f061383b-0393-4ce8-9a85-f31d03762263", "Hi, how are you?", "2022-12-23T07:56:30.214162+00:00"),
    ("d3ea6e39-ed58-4613-8922-b78f14a2676a", "1bc833808-05ed-455a-9d26-64fe1d96d62d", "008e9dc4-f01d-4429-ba31-986d7e63cce8", "Hi... are free today?", "2022-12-23T07:56:30.214162+00:00");
```

#### 7.1. Generating the schema
Now let’s generate the schema and run the migration:

```rust
diesel database setup
diesel migration run
```

The schema that is generated automatically by the CLI will look like this:

```rust
// src/schema.rs
// @generated automatically by Diesel CLI.
diesel::table! {
    conversations (id) {
        id -> Text,
        room_id -> Text,
        user_id -> Text,
        content -> Text,
        created_at -> Text,
    }
}
diesel::table! {
    rooms (id) {
        id -> Text,
        name -> Text,
        last_message -> Text,
        participant_ids -> Text,
        created_at -> Text,
    }
}
diesel::table! {
    users (id) {
        id -> Text,
        username -> Text,
        phone -> Text,
        created_at -> Text,
    }
}
diesel::allow_tables_to_appear_in_same_query!(
    conversations,
    rooms,
    users,
);
```

The above code is auto generated, so don’t make any changes to this file.

#### 7.2. Creating the structs
Let’s create some structs to store all the tables. One thing to keep in mind is that the order of the property in the struct should be the same as that in the schema file. You’ll get the wrong data if the order doesn’t match.

```rust
// src/model.rs
use serde::{Deserialize, Serialize};
use crate::schema::*;
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
pub struct User {
    pub id: String,
    pub username: String,
    pub phone: String,
    pub created_at: String
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Queryable, Insertable)]
pub struct Conversation {
    pub id: String,
    pub room_id: String,
    pub user_id: String,
    pub content: String,
    pub created_at: String
}
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub last_message: String,
    pub participant_ids: String,
    pub created_at: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUser {
    pub username: String,
    pub phone: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewConversation {
    pub user_id: String,
    pub room_id: String,
    pub message: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomResponse {
    pub room: Room,
    pub users: `Vec`<User>`,
}
```

#### 7.3. Setting up the queries
Now, let’s fetch data from the database.

First, import the dependency:

```rust
// src/db.rs
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use std::{
    collections::{HashMap, HashSet},
    time::SystemTime,
};
use uuid::Uuid;
use crate::models::{Conversation, NewConversation, Room, RoomResponse, User};
type DbError = `Box`<dyn std::error::Error + Send + Sync>`;
```

Since SQLite doesn’t have a date functionality build, we’ll create one:

```rust
// src/db.rs
fn iso_date() -> String {
    let now = SystemTime::now();
    let now: `DateTime`<Utc>` = now.into();
    return now.to_rfc3339();
}
```

##### 7.3.1. Finding users by phone number
Here, we’ll set up a query that will implement a simple login feature and enable us to find a user by phone number. We’re using this login method as an example only. In production, you’ll want to use a method that can be easily verified and debugged:

```rust
// src/db.rs
pub fn find_user_by_phone(
    conn: &mut SqliteConnection,
    user_phone: String,
) -> `Result`<`Option<User>`, DbError> {
    use crate::schema::users::dsl::*;
    let user = users
        .filter(phone.eq(user_phone))
        .first::`<User>`(conn)
        .optional()?;
    Ok(user)
}
```

##### 7.3.2. Adding a new user
Here’s a query for storing a new user who registers for our app. This is also part of our authentication system. Again, please don’t use this approach for your production app:

```rust
// src/db.rs
pub fn insert_new_user(conn: &mut SqliteConnection, nm: &str, pn: &str) -> `Result`<User, DbError>` {
    use crate::schema::users::dsl::*;
    let new_user = User {
        id: Uuid::new_v4().to_string(),
        username: nm.to_owned(),
        phone: pn.to_owned(),
        created_at: iso_date(),
    };
    diesel::insert_into(users).values(&new_user).execute(conn)?;
    Ok(new_user)
}
```

With the new user added, we now insert new conversations:

```rust
// src/db.rs
pub fn insert_new_conversation(
    conn: &mut SqliteConnection,
    new: NewConversation,
) -> `Result`<Conversation, DbError>` {
    use crate::schema::conversations::dsl::*;
    let new_conversation = Conversation {
        id: Uuid::new_v4().to_string(),
        user_id: new.user_id,
        room_id: new.room_id,
        content: new.message,
        created_at: iso_date(),
    };
    diesel::insert_into(conversations)
        .values(&new_conversation)
        .execute(conn)?;
    Ok(new_conversation)
}
```

##### 7.3.3. Finding chat rooms and participants
Next, let’s set up a query to fetch all the chat rooms and participants from the database:

```rust
// src/db.rs
pub fn get_all_rooms(conn: &mut SqliteConnection) -> `Result`<`Vec<RoomResponse>`, DbError> {
    use crate::schema::rooms;
    use crate::schema::users;
    let rooms_data: `Vec`<Room>` = rooms::table.get_results(conn)?;
    let mut ids = HashSet::new();
    let mut rooms_map = HashMap::new();
    let data = rooms_data.to_vec();
    for room in &data {
        let user_ids = room
            .participant_ids
            .split(",")
            .into_iter()
            .collect::`<`Vec<_>`>();
        for id in user_ids.to_vec() {
            ids.insert(id.to_string());
        }
        rooms_map.insert(room.id.to_string(), user_ids.to_vec());
    }
    let ids = ids.into_iter().collect::`<`Vec<_>`>();
    let users_data: `Vec`<User>` = users::table
        .filter(users::id.eq_any(ids))
        .get_results(conn)?;
    let users_map: `HashMap`<String, User>` = HashMap::from_iter(
        users_data
        .into_iter()
        .map(|item| (item.id.to_string(), item)),
    );
    let response_rooms = rooms_data.into_iter().map(|room| {
        let users = rooms_map
            .get(&room.id.to_string())
            .unwrap()
            .into_iter()
            .map(|id| users_map.get(id.to_owned()).unwrap().clone())
            .collect::`<`Vec<_>`>();
        return RoomResponse{ room, users };
    }).collect::`<`Vec<_>`>();
    Ok(response_rooms)
}
```

### 8. Building the client UI with React
Let’s design a user interface for our client app; the end result will look like this:

![](/img/posts/1a6f778da89437173bc93095007f994a.png)

To start, create a UI project with Next.js:

yarn create next-app --js ui

Add Tailwind CSS to the project:

```rust
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Now, change the Tailwind `config` file:

```javascript
// ui/tailwind.config.js
content: [
  "./pages/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
]
```

We will add this `package.json` config to export our Next.js app as static HTML pages so that we can access them through the file server using Actix Web:

```javascript
// ui/package.json
{
  "name": "ui",
    "version": "0.1.0",
    "private": true,
    "scripts": {
    "dev": "next dev",
      "build": "next build && next export -o ../static",
      ...
```

Next, import the Tailwind CSS utility to the `globals.css` file:

```javascript
// ui/styles/global.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Now, let’s create some components for our client app.

#### 8.1. `avatar` component
Here we’ll create the avatar for each user:

```javascript
// ui/components/avatar.js
function getShortName(full_name = '') {
  if (full_name.includes(" ")) {
    const names = full_name.split(" ");
    return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
  }
  return `${full_name.slice(0,2)}`.toUpperCase()
}
export default function Avatar({ children, color = '' }) {
  return (
    `<div className='bg-blue-500 w-[45px] h-[45px] flex items-center justify-center rounded-full' style={{backgroundColor: color}}>`
  `<span className='font-bold text-sm text-white'>`{getShortName(children)}</span>
  </div>
)
}
```

#### 8.2. `login` component
Here we’ll create the user login component:

```javascript
// ui/components/login.js
import { useState } from "react";
async function createAccount({ username, phone }) {
  try {
    const url = "http://localhost:8080/users/create";
    let result = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, phone })
    });
    return result.json();
  } catch (e) {
    return Promise.reject(e);
  }
}
async function signIn({ phone }) {
  try {
    const url = "http://localhost:8080/users/phone/" + phone;
    let result = await fetch(url);
    return result.json();
  } catch (e) {
    return Promise.reject(e);
  }
}
export default function Login({ show, setAuth }) {
  const [isShowSigIn, setShowSignIn] = useState(false);
  const showSignIn = () => {
    setShowSignIn(prev => !prev)
  }
  const FormCreateUsername = ({ setAuth }) => {
    const onCreateUsername = async (e) => {
      e.preventDefault();
      let username = e.target.username.value;
      let phone = e.target.phone.value;
      if (username === "" || phone === "") {
        return;
      }
      let res = await createAccount({ username, phone });
      if (res === null) {
        alert("Failed to create account");
        return;
      }
      setAuth(res)
    }
    return (
      `<form action="" className="mt-4 space-y-2" onSubmit={onCreateUsername}>`
      <div>
      `<label className="text-sm font-light">`Username</label>`
      `<input required type="text" name="username" placeholder="John Doe"
    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" />`
      </div>
      <div>
      `<label className="text-sm font-light">`Phone</label>`
      `<input required type="text" name="phone" placeholder="+1111..."
    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" />`
      </div>
      `<div className="flex items-baseline justify-between">`
      `<button type="submit"
    className="px-6 py-2 mt-4 text-white bg-violet-600 rounded-lg hover:bg-violet-700 w-full">`Submit</button>`</div>`<div className="pt-2 space-y-2 text-center">``
      `<p className="text-base text-gray-700">`Already have a username? `<button onClick={showSignIn} className="text-violet-700 font-light">`Sign ``In</button></p>``
      </div>
      </form>
    )
  }
  const FormSignIn = ({ setAuth }) => {
    const onSignIn = async (e) => {
      e.preventDefault();
      let phone = e.target.phone.value;
      if (phone === "") {
        return;
      }
      let res = await signIn({ phone });
      if (res === null) {
        alert("Failed to create account");
        return;
      }
      if (!res.id) {
        alert(`Phone number not found ${phone}`);
        return;
      }
      setAuth(res)
    }
    return (
      `<form action="" className="mt-4 space-y-2" onSubmit={onSignIn}>`
      <div>
      `<label className="text-sm font-light">`Phone</label>`
      `<input required type="text" name="phone" placeholder="+1111..."
                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" />`
                </div>
                `<div className="flex items-baseline justify-between">`
                    `<button type="submit"
                        className="px-6 py-2 mt-4 text-white bg-violet-600 rounded-lg hover:bg-violet-700 w-full">`Submit</button>`</div>`<div className="pt-2 space-y-2 text-center">``
                    `<p className="text-base text-gray-700">`Don't have username? `<button onClick={showSignIn} className="text-violet-700 font-light">`Create</button></p>``
                </div>
            </form>
        )
    }
    return (
        `<div className={`${show ? '' : 'hidden'} bg-gradient-to-b from-orange-400 to-rose-400`}>`
            `<div className="flex items-center justify-center min-h-screen">`
                `<div className="px-8 py-6 mt-4 text-left bg-white  max-w-[400px] w-full rounded-xl shadow-lg">`
                    `<h3 className="text-xl text-slate-800 font-semibold">`{isShowSigIn ? 'Log in with your phone.' : 'Create your account.'}</h3>
                    {isShowSigIn ? `<FormSignIn setAuth={setAuth} />` : `<FormCreateUsername setAuth={setAuth} />`}
                </div>
            </div>
        </div>
    )
}
```

#### 8.3. `room` component
Here we’ll create the chat room components:

```javascript
// ui/components/room.js
import React, { useState, useEffect } from "react";
import Avatar from "./avatar";
async function getRooms() {
  try {
    const url = "http://localhost:8080/rooms";
    let result = await fetch(url);
    return result.json();
  } catch (e) {
    console.log(e);
    return Promise.resolve(null);
  }
}
function ChatListItem({ onSelect, room, userId, index, selectedItem }) {
  const { users, created_at, last_message } = room;
  const active = index == selectedItem;
  const date = new Date(created_at);
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const time = `${date.getHours()}:${date.getMinutes()} ${ampm}`
  const name = users?.filter(user => user.id != userId).map(user => user.username)[0];
  return (
    `<div
  onClick={() =>` onSelect(index, {})}
  className={`${active ? 'bg-[#FDF9F0] border border-[#DEAB6C]' : 'bg-[#FAF9FE] border border-[#FAF9FE]'} p-2 rounded-[10px] shadow-sm cursor-pointer`} >
  `<div className='flex justify-between items-center gap-3'>`
  `<div className='flex gap-3 items-center w-full'>`
  `<Avatar>`{name}</Avatar>
  `<div className="w-full max-w-[150px]">`
  `<h3 className='font-semibold text-sm text-gray-700'>`{name}</h3>
  `<p className='font-light text-xs text-gray-600 truncate'>`{last_message}</p>
  </div>
  </div>
  `<div className='text-gray-400 min-w-[55px]'>`
  `<span className='text-xs'>`{time}</span>
  </div>
  </div>
  </div>
)
}
export default function ChatList({ onChatChange, userId }) {
  const [data, setData] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(-1);
  useEffect(() => {
    setLoading(true)
    getRooms()
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])
  const onSelectedChat = (idx, item) => {
    setSelectedItem(idx)
    let mapUsers = new Map();
    item.users.forEach(el => {
      mapUsers.set(el.id, el);
    });
    const users = {
      get: (id) => {
        return mapUsers.get(id).username;
      },
      get_target_user: (id) => {
        return item.users.filter(el => el.id != id).map(el => el.username).join("")
      }
    }
    onChatChange({ ...item.room, users })
  }
  return (
    `<div className="overflow-hidden space-y-3">`
    {isLoading && <p>Loading chat lists.</p>}
  {
    data.map((item, index) => {
      return `<ChatListItem
      onSelect={(idx) =>` onSelectedChat(idx, item)}
      room={{ ...item.room, users: item.users }}
             index={index}
    key={item.room.id}
  userId={userId}
  selectedItem={selectedItem} />
    })
}
</div>
)
}
```

#### 8.4. `conversation` component
Here we’ll create the user conversation component:

```javascript
// ui/components/conversation.js
import React, { useEffect, useRef } from "react";
import Avatar from "./avatar"
function ConversationItem({ right, content, username }) {
  if (right) {
    return (
      `<div className='w-full flex justify-end'>`
      `<div className='flex gap-3 justify-end'>`
      `<div className='max-w-[65%] bg-violet-500 p-3 text-sm rounded-xl rounded-br-none'>`
      `<p className='text-white'>`{content}</p>
      </div>
      `<div className='mt-auto'>`
      `<Avatar>`{username}</Avatar>
      </div>
      </div>
      </div>
    )
  }
  return (
    `<div className='flex gap-3 w-full'>`
    `<div className='mt-auto'>`
    `<Avatar color='rgb(245 158 11)'>`{username}</Avatar>
    </div>
    `<div className='max-w-[65%] bg-gray-200 p-3 text-sm rounded-xl rounded-bl-none'>`
    <p>{content}</p>
    </div>
    </div>
  )
}
export default function Conversation({ data, auth, users }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight)
  }, [data]);
  return (
    `<div className='p-4 space-y-4 overflow-auto' ref={ref}>`
    {
      data.map(item => {
        return `<ConversationItem
        right={item.user_id === auth.id}
               content={item.content}
  username={users.get(item.user_id)}
key={item.id} />`
})
  }
  </div>
)
}
```

Now let’s prepare the Hooks needed to interact with our WebSocket server and REST API server.

#### 8.5. `useWebsocket` Hook
This Hook is for connecting to the WebSocket server, enabling us to send and receive messages:

```javascript
// ui/libs/websocket.js
import { useEffect, useRef } from "react";
export default function useWebsocket(onMessage) {
  const ws = useRef(null);
  useEffect(() => {
    if (ws.current !== null) return;
    const wsUri = 'ws://localhost:8080/ws';
    ws.current = new WebSocket(wsUri);
    ws.current.onopen = () => console.log("ws opened");
    ws.current.onclose = () => console.log("ws closed");
    const wsCurrent = ws.current;
    return () => {
      wsCurrent.close();
    };
  }, []);
  useEffect(() => {
    if (!ws.current) return;
    ws.current.onmessage = e => {
      onMessage(e.data)
    };
  }, []);
  const sendMessage = (msg) => {
    if (!ws.current) return;
    ws.current.send(msg);
  }
  return sendMessage;
}
```

#### 8.6. `useLocalStorage` Hook
This Hook enables us to get the user data from localStorage:

```javascript
// ui/libs/useLocalStorage
import { useEffect, useState } from "react";
export default function useLocalStorage(key, defaultValue) {
  const [storedValue, setStoredValue] = useState(defaultValue);
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      let data = item ? JSON.parse(item) : defaultValue;
      setStoredValue(data)
    } catch (error) {}
  }, [])
  return [storedValue, setValue];
}
```

#### 8.7. `useConversation` Hook
We’ll use this Hook to fetch conversations based on the given room `id`:

```javascript
import { useEffect, useState } from "react";
const fetchRoomData = async (room_id) => {
  if (!room_id) return;
  const url = `http://localhost:8080/conversations/${room_id}`;
  try {
    let resp = await fetch(url).then(res => res.json());
    return resp;
  } catch (e) {
    console.log(e);
  }
}
export default function useConversations(room_id) {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const updateMessages = (resp = []) => {
    setIsLoading(false);
    setMessages(resp)
  }
  const fetchConversations = (id) => {
    setIsLoading(true)
    fetchRoomData(id).then(updateMessages)
  }
  useEffect(() => fetchConversations(room_id), []);
  return [isLoading, messages, setMessages, fetchConversations];
}
```

### 9. Building the chat application
Now let’s connect all of our components and Hooks to build our chat application in React with Next.js.

First, let’s import all the dependencies we need:

```javascript
// ui/pages/index.js
import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import Avatar from '../components/avatar'
import ChatList from '../components/rooms'
import Conversation from '../components/conversation'
import Login from '../components/login'
import useConversations from '../libs/useConversation'
import useLocalStorage from '../libs/useLocalStorage'
import useWebsocket from '../libs/useWebsocket'
```

Now, let’s set up the state for our chat pages:

```javascript
// ui/pages/index.js
...
export default function Home() {
  const [room, setSelectedRoom] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showLogIn, setShowLogIn] = useState(false);
  const [auth, setAuthUser] = useLocalStorage("user", false);
  const [isLoading, messages, setMessages, fetchConversations] = useConversations("");
  ...
}
```

The following functions will handle all messages coming in or out of the WebSocket server:

+ `handleTyping`: Updates the state to display the typing indicator
+ `handleMessage`: Handles incoming and outgoing messages to the state
+ `onMessage`: Handles messages retrieved from the WebSocket server
+ `updateFocus`: Tells the WebSocket server if the current user is still typing a message
+ `onFocusChange`: Lets the WebSocket server know when the current user is finished typing
+ `submitMessage`: Updates the message state and then sends the message to the server when a user hits the **send** button

Here’s how we’ll use these functions in our code:

```javascript
// ui/pages/index.js
  const handleTyping = (mode) => {
    if (mode === "IN") {
      setIsTyping(true)
    } else {
      setIsTyping(false)
    }
  }
  const handleMessage = (msg, userId) => {
    setMessages(prev => {
      const item = { content: msg, user_id: userId };
      return [...prev, item];
    })
  }
  const onMessage = (data) => {
    try {
      let messageData = JSON.parse(data);
      switch (messageData.chat_type) {
        case "TYPING": {
          handleTyping(messageData.value[0]);
          return;
        }
        case "TEXT": {
          handleMessage(messageData.value[0], messageData.user_id);
          return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  const sendMessage = useWebsocket(onMessage)
  const updateFocus = () => {
    const data = {
      id: 0,
      chat_type: "TYPING",
      value: ["IN"],
      room_id: room.id,
      user_id: auth.id
    }
    sendMessage(JSON.stringify(data))
  }
  const onFocusChange = () => {
    const data = {
      id: 0,
      chat_type: "TYPING",
      value: ["OUT"],
      room_id: room.id,
      user_id: auth.id
    }
    sendMessage(JSON.stringify(data))
  }
  const submitMessage = (e) => {
    e.preventDefault();
    let message = e.target.message.value;
    if (message === "") {
      return;
    }
    if (!room.id) {
      alert("Please select chat room!")
      return
    }
    const data = {
      id: 0,
      chat_type: "TEXT",
      value: [message],
      room_id: room.id,
      user_id: auth.id
    }
    sendMessage(JSON.stringify(data))
    e.target.message.value = "";
    handleMessage(message, auth.id);
    onFocusChange();
  }
```

We’ll use the following functions to handle state for updating the message and for the user login and logout:

+ `updateMessages`: Fetches the conversation of the given room `id` when a user switches chat rooms
+ `signOut`: Updates the state to signout and removes the user data from local storage

We’ll use these functions in our code, like so:

```javascript
// ui/pages/index.js
  const updateMessages = (data) => {
    if (!data.id) return;
    fetchConversations(data.id)
    setSelectedRoom(data)
  }
  const signOut = () => {
    window.localStorage.removeItem("user");
    setAuthUser(false);
  }
  useEffect(() => setShowLogIn(!auth), [auth])
```

Now, let’s display all the data to the client:

```javascript
return (
    <div>
      `<Head>`
        `<title>`Rust with react chat `app</title>`
        `<meta name="description" content="Rust with react chat app" />`
        `<link rel="icon" href="/favicon.ico" />`
      </Head>
      `<Login show={showLogIn} setAuth={setAuthUser} />`
      `<div className={`${!auth && 'hidden'} bg-gradient-to-b from-orange-400 to-rose-400 h-screen p-12`}>`
        `<main className='flex w-full max-w-[1020px] h-[700px] mx-auto bg-[#FAF9FE] rounded-[25px] backdrop-opacity-30 opacity-95'>`
          `<aside className='bg-[#F0EEF5] w-[325px] h-[700px] rounded-l-[25px] p-4 overflow-auto relative'>`
            `<ChatList onChatChange={updateMessages} userId={auth.id} />`
            `<button onClick={signOut} className='text-xs w-full max-w-[295px] p-3 rounded-[10px] bg-violet-200 font-semibold text-violet-600 text-center absolute bottom-4'>`LOG `OUT</button>`
          </aside>
          {room?.id && (`<section className='rounded-r-[25px] w-full max-w-[690px] grid grid-rows-[80px_minmax(450px,_1fr)_65px]'>`
            `<div className='rounded-tr-[25px] w-ful'>`
              `<div className='flex gap-3 p-3 items-center'>`
                `<Avatar color='rgb(245 158 11)'>`{room.users.get_target_user(auth.id)}</Avatar>
                <div>
                  `<p className='font-semibold text-gray-600 text-base'>`{room.users.get_target_user(auth.id)}</p>
                  `<div className='text-xs text-gray-400'>`{isTyping ? "Typing..." : "10:15 AM"}</div>
                </div>
              </div>
              `<hr className='bg-[#F0EEF5]' />`
            </div>
            {(isLoading && room.id) && `<p className="px-4 text-slate-500">`Loading conversation...</p>}
            `<Conversation data={messages} auth={auth} users={room.users} />`
            `<div className='w-full'>`
              `<form onSubmit={submitMessage} className='flex gap-2 items-center rounded-full border border-violet-500 bg-violet-200 p-1 m-2'>`
                `<input
                  onBlur={onFocusChange}
                  onFocus={updateFocus}
                  name="message"
                  className='p-2 placeholder-gray-600 text-sm w-full rounded-full bg-violet-200 focus:outline-none'
                  placeholder='Type your message here...' />`
                `<button type='submit' className='bg-violet-500 rounded-full py-2 px-6 font-semibold text-white text-sm'>`Sent</button>`
              </form>
            </div>
          </section>)}
        </main>
      </div>
    </div>
  )
```

### 10. Conclusion
In this article, we discussed the features of WebSockets, its applications in Rust, and how to use it with the `actix-web` package. We demonstrated how to create an efficient, real-time chat application, using React and Next.js to establish WebSocket connections to the Actix Web server. The code from this article is available on [GitHub](https://github.com/ahmadrosid/rust-react-chat).

To further improve our sample real-time chat application, you could enable it to display user status (i.e., online or offline) and create an online group chat for users.

Please feel free to leave a comment if you have any questions about this article. Happy coding!

### 11. Get set up with LogRocket's modern React error tracking in minutes:
1.  Visit [https://logrocket.com/signup/](https://lp.logrocket.com/blg/react-signup-general) to get an app ID 
2. Install LogRocket via npm or script tag. `LogRocket.init()` must be called client-side, not server-side 

```javascript
$ npm i --save logrocket 

// Code:

import LogRocket from 'logrocket'; 
LogRocket.init('app/id');
```

3. (Optional) Install plugins for deeper integrations with your stack:
    - Redux middleware 
    - NgRx middleware 
    - Vuex plugin 

[Get started now](https://lp.logrocket.com/blg/react-signup-general)  


> 来自: [Build a real-time chat app with Rust and React - LogRocket Blog](https://blog.logrocket.com/real-time-chat-app-rust-react/#introduction-to-real-time-chat-applications)
>

