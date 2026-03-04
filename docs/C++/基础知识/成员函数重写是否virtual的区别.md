---
sidebar_position: 1
slug: /C++/基础知识/成员函数重写是否virtual的区别
---

### 不使用 `virtual` 关键字
在C++中，如果你在父类中声明了一个非虚函数（即没有使用 `virtual` 关键字），而在子类中重写了这个函数，那么当你通过一个父类指针或引用来调用该函数时，将调用的是父类中的函数，而不是子类中的重写函数。

这种行为是由于C++的**静态绑定**机制决定的。对于非虚函数，编译器在编译时就已经确定了要调用哪个函数，基于指针或引用的类型（而不是实际对象的类型）。

```cpp
#include <iostream>

class Parent {
    public:
    void show() {
        std::cout << "Parent's show" << std::endl;
    }
};

class Child : public Parent {
public:
void show() {
    std::cout << "Child's show" << std::endl;
}
};

int main() {
    Parent* ptr = new Child();
    ptr->show();  // 输出: Parent's show

    delete ptr;
    return 0;
}
```

在这个例子中，`ptr->show()` 调用的是 `Parent` 类中的 `show()` 函数，而不是 `Child` 类中的 `show()` 函数，因为 `show()` 在 `Parent` 类中没有被声明为 `virtual`。

### 使用 `virtual` 关键字
如果你希望实现**动态绑定**（即在运行时根据对象的实际类型来确定调用哪个函数），你需要在父类中将函数声明为 `virtual`：

```cpp
#include <iostream>

class Parent {
public:
virtual void show() {
    std::cout << "Parent's show" << std::endl;
}
};

class Child : public Parent {
public:
void show() override {
    std::cout << "Child's show" << std::endl;
}
};

int main() {
    Parent* ptr = new Child();
    ptr->show();  // 输出: Child's show

    delete ptr;
    return 0;
}
```

在这个例子中，`ptr->show()` 调用的是 `Child` 类中的 `show()` 函数，因为 `show()` 在 `Parent` 类中被声明为 `virtual`，实现了多态。

### 总结
+ 如果父类中的函数没有使用 `virtual` 关键字，且在子类中重写了该函数，那么通过父类指针或引用调用时，会调用父类的函数。
+ 如果父类中的函数使用了 `virtual` 关键字，且在子类中重写了该函数，那么通过父类指针或引用调用时，会调用子类的函数，实现多态。
+ 对于非虚函数，编译器在编译时就能确定要调用哪个函数，这是因为 C++ 使用了 **静态绑定**（Static Binding）机制。静态绑定的核心在于：**函数的调用是基于指针或引用的类型，而不是对象的实际类型**。

### 为什么静态绑定基于指针/引用类型，而不是实际对象类型？
1. **性能优化**  
静态绑定是在编译时完成的，这意味着编译器可以直接生成调用特定函数的代码，而不需要在运行时进行额外的查找或决策。这种方式的执行效率更高，因为不需要在运行时维护虚函数表（vtable）或其他动态分配机制。
2. **语言设计目标**  
C++ 的设计目标之一是提供高效性和灵活性。为了兼顾性能，默认情况下函数调用是静态绑定的。只有在明确使用 `virtual` 关键字时，才会启用动态绑定（Dynamic Binding），以实现多态性。
3. **明确性**  
静态绑定确保了代码的行为是可预测的。如果函数是非虚的，那么无论你如何传递对象，调用哪个函数只取决于指针或引用的类型。这种明确性可以帮助开发者更好地理解代码的行为。

```cpp
#include <iostream>

class Parent {
public:
    void show() {
        std::cout << "Parent's show" << std::endl;
    }
};

class Child : public Parent {
public:
    void show() {
        std::cout << "Child's show" << std::endl;
    }
};

int main() {
    Parent* ptr = new Child(); // ptr 的类型是 Parent*
    ptr->show(); // 调用 Parent::show，因为 show 是非虚函数

    delete ptr;
    return 0;
}
```

#### 解释：
+ 在编译时，编译器看到 `ptr` 的类型是 `Parent*`，而 `show()` 是一个非虚函数，因此直接生成调用 `Parent::show()` 的代码。
+ 即使 `ptr` 实际指向的是一个 `Child` 对象，但由于 `show()` 是非虚函数，编译器不会去检查对象的实际类型。

### 对比动态绑定
如果 `show()` 是虚函数：

```cpp
class Parent {
    public:
    virtual void show() {
        std::cout << "Parent's show" << std::endl;
    }
};

class Child : public Parent {
public:
void show() override {
    std::cout << "Child's show" << std::endl;
}
};

int main() {
    Parent* ptr = new Child(); // ptr 的类型是 Parent*
    ptr->show(); // 调用 Child::show，因为 show 是虚函数

    delete ptr;
    return 0;
}
```

#### 解释：
+ 动态绑定会在运行时根据对象的实际类型（`Child`）来决定调用哪个函数。这是通过虚函数表（vtable）实现的。

### 总结
静态绑定基于指针或引用的类型，是因为：

1. 性能更高，避免了运行时的开销。
2. 提供了明确的行为，使代码更易于理解和预测。
3. 符合 C++ 的设计哲学，允许开发者在需要时才启用动态绑定（通过 `virtual` 关键字）。

