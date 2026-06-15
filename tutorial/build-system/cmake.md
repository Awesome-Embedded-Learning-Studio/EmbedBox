---
title: "CMake：概念 + 工具链文件"
description: "用 CMakeLists.txt 声明项目、out-of-source 构建、目标与依赖，再到交叉编译的核心——工具链文件 CMAKE_TOOLCHAIN_FILE。不碰任何具体芯片脚本。"
order: 3
tags:
  - host
  - cmake
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "Makefile（本卷）"
  - "GCC 编译-汇编-链接全流程（本卷 gcc 小串）"
---

# CMake：概念 + 工具链文件

## 为什么是 CMake 而不是继续手写 Makefile

上一篇我们用 Make 把编译流程自动化了，挺好用。可当项目变大、要同时支持 host 和交叉编译、要在 Windows 和 Linux 上都能编、还要链一堆第三方库的时候，手写 Makefile 会越来越像在维护一坨条件分支。CMake 的定位是"构建系统的构建系统"——你不直接写怎么编译，而是声明"我要一个可执行，源是这些，依赖那个库"，由 CMake **生成**对应平台的 Makefile 或 Ninja 文件，再让后者真正去编。这一层间接，换来的是跨平台、跨工具链、IDE 友好。同组织的 AwesomeQt 等仓库都假定你会 CMake，所以我们把它讲透。

## 最小 CMakeLists 和 out-of-source 构建

CMake 的输入是一个叫 `CMakeLists.txt` 的文件，最小形态就这么三行：

```cmake
cmake_minimum_required(VERSION 3.16)
project(hello C)                # 项目名 + 用什么语言
add_executable(hello main.c)    # 声明一个可执行 + 它的源文件
```

我们先实跑一遍。CMake 有个特别重要的规矩叫 out-of-source 构建——所有构建产物都关进一个 `build/` 目录，源码树保持干净。具体做法是 `-B build` 让它把生成物都放进 `build/`：

```bash
cmake -B build
```

```text
-- The C compiler identification is GNU 16.1.1
-- Generating done (0.0s)
-- Build files have been written to: /tmp/cmproj/build
```

第一行很关键：CMake 探测到系统上的 C 编译器是 GNU 16.1.1，这是它"配置"阶段干的事——探测编译器、探测依赖、生成构建文件。最后那行"Build files have been written to .../build"说明它已经在 `build/` 里生成好了 Makefile。接下来真正编译：

```bash
cmake --build build
```

```text
[100%] Linking C executable hello
[100%] Built target hello
```

`./build/hello` 跑起来输出 `built by cmake`。清理就 `rm -rf build`，一个目录搞定，源码树一个字都没动。

> ⚠️ 注意，千万别说手快在源码根目录直接敲了 `cmake .`。这叫 in-source build，它会在你的源码里生成 `CMakeCache.txt`、`CMakeFiles/` 一大堆东西，污染源码树还特别难清干净。永远用 `-B build`，已经手滑了就 `rm CMakeCache.txt` 再删 `CMakeFiles/`，重新来。

## 目标、依赖与 PUBLIC/PRIVATE

真实项目不会只有一个可执行，我们会把通用代码抽成库，再让可执行去链它。现代 CMake 围绕"目标"和它的"属性"来组织，比老式的全局函数干净得多：

```cmake
add_library(utils STATIC utils.c)                  # 静态库目标
target_include_directories(utils PUBLIC include)   # 头文件目录：PUBLIC 对外可见
target_compile_options(utils PRIVATE -Wall)        # 编译选项：只对 utils 自己

add_executable(app main.c)
target_link_libraries(app PRIVATE utils)           # app 链接 utils
```

`PUBLIC` 和 `PRIVATE` 的区别值得记住：`PUBLIC` 是"我这个目标需要它、而且依赖我的目标也会传递地需要它"，比如一个库对外暴露的头文件所在目录就该是 PUBLIC；`PRIVATE` 是"只有我自己需要，不传递给别人"，比如编译选项。这个传递性在链多层库时特别有用，能精确控制什么对外、什么不对外。

## 交叉编译的核心：工具链文件

这是 CMake 对嵌入式最关键的一块。前面我们编的是 host 程序，CMake 自动探测到系统的 gcc。可嵌入式要的是"用 `arm-none-eabi-gcc`"，这时候你不能在 CMakeLists 里硬写编译器路径（那会让这份 CMakeLists 只能在你这台机器上用），正确做法是写一个**工具链文件**，构建时通过变量传进去。

工具链文件 `arm-none-eabi.cmake` 长这样：

```cmake
set(CMAKE_SYSTEM_NAME    Generic)                   # 裸机，没有 OS
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER      arm-none-eabi-gcc)
set(CMAKE_CXX_COMPILER    arm-none-eabi-g++)
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)   # 见下方解释
```

构建时把它传进去：

```bash
cmake -B build -DCMAKE_TOOLCHAIN_FILE=arm-none-eabi.cmake
```

这里有个新手必踩的坑，就是最后一行 `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY`。CMake 配置阶段会偷偷编一个小程序去探测编译器各种特性，可交叉编译出来的产物在你电脑上根本跑不起来，这一步就会失败。设成 `STATIC_LIBRARY` 是告诉它"别试运行，只编成静态库就行"，绕开这个坑。我们这一卷只讲工具链文件的概念和通用写法，不写任何芯片特定的链接脚本、启动文件、外设地址——那些属于具体平台，留给 `*-forge` 仓库。

> ⚠️ 注意，工具链文件的路径是写进缓存的。你换了一个工具链文件、或者改了里面的编译器，光重跑 `cmake -B build` 是不够的，必须把 `build/` 整个删掉重来，否则它用的还是旧缓存里的旧编译器，编出来的结果会让你莫名其妙。

## 小结

CMake 让你声明项目结构、它生成具体的构建文件，跨平台跨工具链都靠这层间接。永远用 `cmake -B build` 做 out-of-source 构建，别 in-source 污染源码。现代 CMake 围绕目标和 `target_*` 系列属性组织，`PUBLIC`/`PRIVATE` 控制传递性。嵌入式交叉编译靠工具链文件 `CMAKE_TOOLCHAIN_FILE`，记得配 `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` 防试运行失败，换了工具链就删 `build/` 重来。

## 下一站

能编出固件了，下一步是固件跑飞时怎么定位——GDB 登场，而且要连着硬件探针做远程调试。

> 下一卷：[调试 · GDB：从段错误到远程调试](../debugging/gdb)
