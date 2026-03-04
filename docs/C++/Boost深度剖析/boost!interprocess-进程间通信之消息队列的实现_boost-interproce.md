---
sidebar_position: 1
slug: /C++/Boost深度剖析/boost!interprocess-进程间通信之消息队列的实现_boost-interproce
---

---
title: 'boost::interprocess 进程间通信之消息队列的实现_boost interproce'
date: '2025-05-15 23:55:44'
updated: '2025-05-16 00:49:56'
slug: /C++/Boost深度剖析/boost!interprocess-进程间通信之消息队列的实现_boost-interproce---
## boost::interprocess 进程间通信之消息队列的实现
### 1. 首先需要建立两个工程，processA, ProcessB
### ![](/img/posts/dae5255d27e3b9639698e479cd8d9396.png)
### 2. 写一个消息队列的类，"Condition_shared_data.hpp"
```cpp
#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/sync/interprocess_mutex.hpp>
#include <boost/interprocess/sync/interprocess_condition.hpp>
#include <boost/interprocess/detail/config_end.hpp>

struct trace_queue
{
	enum { LineSize = 100 };
 
	trace_queue()
		: message_in(false)
	{}
 
	//Mutex to protect access to the queue
	boost::interprocess::interprocess_mutex      mutex;
 
	//Condition to wait when the queue is empty
	boost::interprocess::interprocess_condition  cond_empty;
 
	//Condition to wait when the queue is full
	boost::interprocess::interprocess_condition  cond_full;
 
	//Items to fill
	char   items[LineSize];
 
	//Is there any message
	bool message_in;
};
 

```

### 3. 进程A的函数，"ProcessA.cpp"
```cpp
#include"stdafx.h"
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include<boost\thread\thread.hpp>
#include<boost\date_time\posix_time\posix_time.hpp>
#include <iostream>
#include <cstdio>
#include "Condition_shared_data.hpp"
 
 
using namespace boost::interprocess;
 
int main()
{
 
	//Erase previous shared memory and schedule erasure on exit
	struct shm_remove
	{
		shm_remove() { shared_memory_object::remove("MySharedMemory"); }
		~shm_remove() { shared_memory_object::remove("MySharedMemory"); }
	} remover;
	//<-
	(void)remover;
	//->
 
	//Create a shared memory object.
	shared_memory_object shm
	(create_only               //only create
		, "MySharedMemory"           //name
		, read_write                //read-write mode
	);
	try {
		//Set size
		shm.truncate(sizeof(trace_queue));
 
		//Map the whole shared memory in this process
		mapped_region region
		(shm                       //What to map
			, read_write //Map it as read-write
		);
 
		//Get the address of the mapped region
		void * addr = region.get_address();
 
		//Construct the shared structure in memory
		trace_queue * data = new (addr) trace_queue;
 
		const int NumMsg = 100;
 
		for (int i = 0; i < NumMsg; ++i) {
			scoped_lock<interprocess_mutex> lock(data->mutex);
			if (data->message_in) {
				data->cond_full.wait(lock);
			}
			if (i == (NumMsg - 1))
			{
				std::sprintf(data->items, "%s", "last message");
				std::cout << "last message:" << i << std::endl;
			}		
			else
			{
				std::sprintf(data->items, "%s_%d", "my_trace", i);
				std::cout << "My trace:" << i << std::endl;
				boost::this_thread::sleep(boost::posix_time::milliseconds(100));
			}
 
 
			//Notify to the other process that there is a message
			data->cond_empty.notify_one();
 
			//Mark message buffer as full
			data->message_in = true;
		}
	}
	catch (interprocess_exception &ex) {
		std::cout << ex.what() << std::endl;
		return 1;
	}
 
	getchar();
	return 0;
}
```

### 3. 进程B的函数，"ProcessB.cpp"
```cpp
#include"stdafx.h"
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include <iostream>
#include <cstring>
#include "Condition_shared_data.hpp"
 
using namespace boost::interprocess;
 
int main()
{
	//Create a shared memory object.
	shared_memory_object shm
	(open_only							 //only create
		, "MySharedMemory"              //name
		, read_write                   //read-write mode
	);
 
	try 
	{
		//Map the whole shared memory in this process
		mapped_region region
		(shm                       //What to map
			, read_write //Map it as read-write
		);
 
		//Get the address of the mapped region
		void * addr = region.get_address();
 
		//Obtain a pointer to the shared structure
		trace_queue * data = static_cast<trace_queue*>(addr);
 
		//Print messages until the other process marks the end
		bool end_loop = false;
		do {
			scoped_lock<interprocess_mutex> lock(data->mutex);
			if (!data->message_in) 
			{
				data->cond_empty.wait(lock);
			}
			if (std::strcmp(data->items, "last message") == 0)
			{
				end_loop = true;
				std::cout << "last message !" << std::endl;
			}
			else 
			{
				//Print the message
				std::cout << "Receive the message:"<<data->items << std::endl;
				//Notify the other process that the buffer is empty
				data->message_in = false;
				data->cond_full.notify_one();
			}
		} while (!end_loop);
	}
	catch (interprocess_exception &ex) {
		std::cout << ex.what() << std::endl;
		return 1;
	}
	getchar();
	return 0;
}
```

### 同时运行两个进程
### ![](/img/posts/df5a687765ce5d8750ad219524f9420a.png)
内容来源：csdn.net

作者昵称：ZhongNanJingYun_Blog

原文链接：https://blog.csdn.net/a1534219218/article/details/102493129

作者主页：https://blog.csdn.net/a1534219218



> 来自: [boost::interprocess 进程间通信之消息队列的实现_boost interprocess-CSDN博客](https://blog.csdn.net/a1534219218/article/details/102493129)
>





