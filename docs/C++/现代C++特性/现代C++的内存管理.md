---
sidebar_position: 3
---

## 一、智能指针之所以智能的核心原理：RAII机制
RAII（Resource Acquisition Is Initialization）是C++管理资源的基石模式，其核心思想是将资源生命周期与对象生命周期绑定。当对象被创建时获取资源，当对象超出作用域析构时自动释放资源，从根本上避免内存泄漏。
### RAII伪代码实现
```cpp
// RAII基类模板
template<typename Resource, typename Deleter>
class RAIIWrapper {
public:
    // 构造时获取资源
    explicit RAIIWrapper(Resource* res) : resource_(res) {}
    
    // 析构时自动释放资源
    ~RAIIWrapper() {
        Deleter{}(resource_);  // 调用删除器释放资源
    }
    
    // 访问资源
    Resource* get() const { return resource_; }
    
private:
    Resource* resource_;  // 管理的资源指针
};
```

## 二、unique_ptr：独占所有权的智能指针

### 核心特性与应用场景
- **独占所有权**：同一时间只能有一个unique_ptr指向对象
- **零开销抽象**：大小等同于原始指针，无额外性能损耗
- **自动释放**：超出作用域时自动调用删除器释放资源
- **禁止拷贝**：但支持移动语义转移所有权
- **应用场景**：动态内存管理、Pimpl惯用法、工厂模式返回值

### 实现原理深度解析

#### 1. 核心成员变量与数据结构
在LLVM libcxx中，unique_ptr通过压缩对（compressed pair）实现高效存储，在删除器为空时可节省内存空间：

```cpp
// ... existing code ...
private:
    _LIBCPP_NO_UNIQUE_ADDRESS __compressed_pair<pointer, deleter_type> __ptr_;
// ... existing code ...
```

`__compressed_pair`是libcxx的优化实现，当删除器是无状态类型（如默认的`default_delete`）时，会被优化掉，使`unique_ptr`大小与原始指针相同。

#### 2. 对象实例化：
**(1)通过new**
**(2)通过`make_unique`**
`make_unique`是C++14引入的安全创建unique_ptr的方式
```cpp
// ... existing code ...
// 非数组版本make_unique
 template <class _Tp, class... _Args>
inline _LIBCPP_HIDE_FROM_ABI
typename __unique_ptr_traits<_Tp>::pointer
__make_unique(_Args&&... __args) {
    return ::new _Tp(std::forward<_Args>(__args)...);
}

 template <class _Tp, class... _Args>
inline _LIBCPP_HIDE_FROM_ABI
unique_ptr<_Tp>
make_unique(_Args&&... __args) {
    return unique_ptr<_Tp>(__make_unique<_Tp>(std::forward<_Args>(__args)...));
}

// ... existing code ...
```

#### 3. 资源销毁机制
unique_ptr的析构函数通过调用删除器释放资源：

```cpp
// ... existing code ...
_LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR_SINCE_CXX23 ~unique_ptr() { reset(); }

// ... existing code ...
```

`release()`方法转移所有权但不释放资源，`reset()`方法则会释放当前资源：

```cpp
// ... existing code ...
_LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR_SINCE_CXX23 pointer release() _NOEXCEPT {
pointer __t = __ptr_;
__ptr_ = pointer();
return __t;
}

_LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR_SINCE_CXX23 void reset(pointer __p = pointer()) _NOEXCEPT {
pointer __tmp = __ptr_;
__ptr_ = __p;
if (__tmp)
__deleter_(__tmp);
}
// ... existing code ...
```

## 三、shared_ptr：共享所有权的智能指针

### 核心特性与应用场景
- **共享所有权**：多个shared_ptr可指向同一对象
- **引用计数**：通过引用计数跟踪对象被引用次数
- **自动析构**：当引用计数为0时自动析构对象
- **应用场景**：需要多个所有者共享资源的场景，如容器元素、组件间共享对象

### 实现原理深度解析

#### 1. 核心成员与数据结构
shared_ptr内部包含两个关键指针：

```cpp
// ... existing code ...
private:
    element_type* __ptr_;       // 指向实际对象的指针
    __shared_weak_count* __cntrl_;  // 指向控制块的指针
// ... existing code ...
```

**shared_ptr的实例化包含了两个部分的实例化，管理对象的实例化和控制块的实例化**。
这句话意味着：
- 对象实例化和控制块实例化的内存是否是连续的(在一起)
- 如果不连续，他们会单独占两块不同的堆内存
- 如果不连续，shared_ptr的销毁就需要先后释放两部分资源。
- 如果同时，shared_ptr释放内存的时机按照什么规则（不是说引用计数为0释放资源吗？）。
#### 2.构造函数（默认是传入已经实例化好的对象，构造函数只实例化控制块）
```cpp
// 1. 初始化原始指针成员
explicit shared_ptr(_Yp* __p) : __ptr_(__p) {
// 2. 用 unique_ptr 临时持有 __p，确保异常安全
unique_ptr<_Yp> __hold(__p);
// 3. 定义分配器与控制块类型
typedef typename __shared_ptr_default_allocator<_Yp>::type _AllocT;
typedef __shared_ptr_pointer<_Yp*, __shared_ptr_default_delete<_Tp, _Yp>, _AllocT> _CntrlBlk;
// 4. 构造控制块（包含引用计数、删除器、分配器）
__cntrl_ = new _CntrlBlk(__p, __shared_ptr_default_delete<_Tp, _Yp>(), _AllocT());
// 5. 控制块构造成功，释放 unique_ptr 的临时所有权
__hold.release();
// 6. 启用 weak_this 机制（支持 enable_shared_from_this）
__enable_weak_this(__p, __p);

}
```

#### 3. 控制块实现-（引用计数）
控制块核心成员：
- 强引用计数 - shared_ptr的计数，控制所管理对象的生命周期。
		行为：计数器为0，调用管理对象析构；如果内存不连续，同时还会释放对象内存资源
		资源清理函数：__on_zero_shared()
- 弱引用计数 -weak_ptr影响的计数
		行为：计数器为0释放控制块所在内存
		资源清理函数：__on_zero_shared_weak()

核心数据结构`__shared_weak_count`同时管理了强引用计数和弱引用计数

```cpp
class _LIBCPP_EXPORTED_FROM_ABI __shared_weak_count : private __shared_count {

long __shared_weak_owners_;           //弱引用计数

public:

_LIBCPP_HIDE_FROM_ABI explicit __shared_weak_count(long __refs = 0) _NOEXCEPT

: __shared_count(__refs),           //强引用计数

__shared_weak_owners_(__refs) {}

protected:

~__shared_weak_count() override;

public:

#if defined(_LIBCPP_SHARED_PTR_DEFINE_LEGACY_INLINE_FUNCTIONS)

void __add_shared() noexcept;

void __add_weak() noexcept;

void __release_shared() noexcept;

#else

_LIBCPP_HIDE_FROM_ABI void __add_shared() _NOEXCEPT { __shared_count::__add_shared(); }

_LIBCPP_HIDE_FROM_ABI void __add_weak() _NOEXCEPT { __libcpp_atomic_refcount_increment(__shared_weak_owners_); }

_LIBCPP_HIDE_FROM_ABI void __release_shared() _NOEXCEPT {

if (__shared_count::__release_shared())

__release_weak();

}
#endif
void __release_weak() _NOEXCEPT;
_LIBCPP_HIDE_FROM_ABI long use_count() const _NOEXCEPT { return __shared_count::use_count(); }
__shared_weak_count* lock() _NOEXCEPT;
virtual const void* __get_deleter(const type_info&) const _NOEXCEPT;

private:
virtual void __on_zero_shared_weak() _NOEXCEPT = 0;

};
```

强引用计数减少操作在`__shared_count`类中实现：
```cpp
// 减少强引用计数，返回是否为最后一个引用
bool __release_shared() noexcept {
    if (__atomic_fetch_sub(&__shared_, 1, __ATOMIC_ACQ_REL) == 1) {
        __on_zero_shared();
        return true;
    }
    return false;
}
// ... existing code ...
```

#### 4. 对象实例化：make_shared 
`make_shared`相比直接使用`new`+`shared_ptr`有显著优势：
- 仅进行一次内存分配（控制块和对象内存一起分配）
- 缓存友好，控制块和对象在同一内存块
- 异常安全

```cpp
// ... existing code ...
template <class _Tp, class... _Args>
inline _LIBCPP_HIDE_FROM_ABI shared_ptr<_Tp>
make_shared(_Args&&... __args) {
    typedef typename __shared_ptr_default_allocator<_Tp>::type _Alloc;
    return std::allocate_shared<_Tp>(_Alloc(), std::forward<_Args>(__args)...);
}

// 分配并构造对象和控制块
 template <class _Tp, class _Alloc, class... _Args>
inline _LIBCPP_HIDE_FROM_ABI shared_ptr<_Tp>
allocate_shared(const _Alloc& __a, _Args&&... __args) {
    return __allocate_shared_common<_Tp>(__a, std::forward<_Args>(__args)...);
}
// ... existing code ...
```

#### 5.资源释放
核心内容：
- **如果对象和控制块内存不连续。强引用计数归零，释放管理的资源；弱引用计时归零释放控制块**
- **如果对象和控制块内存连续。强引用计数归零，调用管理对象的析构函数；弱引用计数归零释放内存**

##### 1. **强引用计数归零（资源销毁）**
当最后一个 `shared_ptr` 离开作用域或被重置时，触发以下步骤：
###### （1）析构函数调用 `__release_shared()`
<mcfile name="shared_ptr.h" path="/Users/liuxiaohua/workspace/open-source-code/llvm-project/libcxx/include/__memory/shared_ptr.h"></mcfile> 中 `shared_ptr` 析构函数实现：
```cpp
~shared_ptr() noexcept {
  if (__cntrl_) __cntrl_->__release_shared(); // __cntrl_ 是控制块指针
}

// 减少强引用计数，返回是否为最后一个引用
bool __release_shared() noexcept {
    if (__atomic_fetch_sub(&__shared_, 1, __ATOMIC_ACQ_REL) == 1) {
        __on_zero_shared();  
        return true;
    }
    return false;
}
// ... existing code ...
```

#####  2. **弱引用计数归零（控制块销毁）**
`weak_ptr` 不直接管理资源，但会增加控制块的弱引用计数。当最后一个 `weak_ptr` 销毁时：

```cpp
void __release_weak() noexcept {
  if (__atomic_fetch_sub(&_weak_count, 1, __ATOMIC_ACQ_REL) == 1) {
    __on_zero_shared_weak(); // 弱引用计数归零，释放控制块内存
  }
}
```

##### 3. 控制块内存管理

| **模板类**   | **__shared_ptr_emplace**        | **__shared_ptr_pointer**     |
| --------- | ------------------------------- | ---------------------------- |
| **内存布局**  | 控制块与对象**同址分配**（节省1次堆分配）         | 控制块与对象**分离分配**               |
| **构造方式**  | 就地构造对象（placement new）           | 接管已构造对象的指针                   |
| **删除器支持** | 不支持（使用默认析构逻辑）                   | 支持自定义删除器（类型擦除存储）             |
| **典型来源**  | `make_shared`/`allocate_shared` | `shared_ptr(p, deleter)`构造函数 |
| **灵活性**   | 仅支持对象构造参数                       | 支持任意指针+删除器组合                 |

两者均继承自`__shared_weak_count`，通过**多态**实现统一的引用计数管理：
```cpp
class __shared_weak_count : public __shared_count {
  long __shared_weak_owners_; // 弱引用计数
public:
  void __add_weak() noexcept;    // 弱引用+1
  void __release_weak() noexcept; // 弱引用-1
};
```
- **强引用操作**：通过`__add_shared()`/`__release_shared()`管理
- **弱引用操作**：通过`__add_weak()`/`__release_weak()`管理
- **资源释放**：通过重写`__on_zero_shared()`和`__on_zero_shared_weak()`实现差异化释放逻辑



#### 6. 线程安全性
***shared_ptr本身不是完全线程安全的，只有其引用计数机制是线程安全的**。

shared_ptr对象包含两个核心成员：
```cpp
private:
    element_type* __ptr_;       // 指向实际对象的指针
    __shared_weak_count* __cntrl_;  // 指向控制块的指针
```

这些指针的读写操作未使用任何同步机制（如互斥锁或原子操作），多线程并发修改时会导致数据竞争。

shared_ptr的线程安全保证：
- 多个线程可以同时读取同一个shared_ptr对象
- 多个线程可以同时修改不同的shared_ptr对象，即使它们指向同一个控制块
- 如果多个线程访问同一个shared_ptr对象，且至少有一个线程在修改它，则需要额外同步
- 不保证弱引用升级为强引用的原子性

## 四、weak_ptr

### 核心特性与应用场景
- **弱引用**：不影响对象的生命周期
- **解决循环引用**：允许观察对象但不持有所有权
- **临时访问**：可通过lock()方法临时获取强引用
- **应用场景**：观察者模式、缓存、避免循环引用

#### 临时获取强引用：lock()方法
weak_ptr通过lock()方法安全获取对象访问权：

```cpp
// ... existing code ...
shared_ptr<_Tp> lock() const noexcept {
    shared_ptr<_Tp> __r;
    __r.__cntrl_ = __cntrl_ ? __cntrl_->lock() : __cntrl_;
    if (__r.__cntrl_)
        __r.__ptr_ = __ptr_;
    return __r;
}
// ... existing code ...
```

`lock()`方法内部调用控制块的`lock()`，只有当强引用计数>0时才会成功获取强引用。

## 五、循环引用问题与解决方案

### 现象描述
当两个或多个shared_ptr相互引用形成闭环时，即使所有外部引用都已释放，内部引用计数仍不为0，导致内存泄漏。

### 示例代码
```cpp
#include <memory>
#include<iostream>
class B;

class A {
public:
    std::shared_ptr<B> b_ptr;
    ~A() { std::cout << "A destroyed" << std::endl; }
};

class B {
public:
    std::shared_ptr<A> a_ptr;
    ~B() { std::cout << "B destroyed" << std::endl; }
};

void test_circular_reference() {
    auto a = std::make_shared<A>();
    auto b = std::make_shared<B>();
    a->b_ptr = b;  // A引用B
    b->a_ptr = a;  // B引用A，形成循环
}
// 函数结束时，a和b析构，但A和B的引用计数仍为1，导致内存泄漏

int main(){
    test_circular_reference();
}
```

引用关系分析 ：
- 在 test_circular_reference() 函数中， a （指向 A 实例）和 b （指向 B 实例）是局部 shared_ptr
- a->b_ptr = b 使 A 实例持有 B 实例的强引用
- b->a_ptr = a 使 B 实例持有 A 实例的强引用
- 形成 A `<->` B 的双向强引用循环
引用计数变化 ：
- 初始状态： A 和 B 的引用计数均为1（分别由 a 和 b 持有）
- 相互赋值后： A 和 B 的引用计数均变为2（各自被对方实例引用）
- 函数结束时：局部变量 a 和 b 析构，引用计数各减1变为1
- 最终状态：两个实例的引用计数永远无法归零，导致内存泄漏
### 解决方案：使用weak_ptr
将循环引用中的一个shared_ptr改为weak_ptr即可打破循环：

```cpp
#include <memory>
#include <iostream>
class B;

class A {
public:
    std::shared_ptr<B> b_ptr;
    ~A() { std::cout << "A destroyed" << std::endl; }
};

class B {
public:
    std::weak_ptr<A> a_ptr;  // 使用weak_ptr打破循环
    ~B() { std::cout << "B destroyed" << std::endl; }
};

void test_solve_circular_reference() {
    auto a = std::make_shared<A>();
    auto b = std::make_shared<B>();
    a->b_ptr = b;
    b->a_ptr = a;  // weak_ptr不增加强引用计数
}
// 函数结束时，a和b析构，A和B的引用计数降为0，正确释放

int main(){
	test_solve_circular_reference(); 
}
```

### 解决原理
weak_ptr只操作弱引用计数，影响的是控制块的生命周期而不影响所管理对象的生命周期：