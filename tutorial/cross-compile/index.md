---
title: 交叉编译
description: 在我电脑上编译、在板子上运行——嵌入式的定义动作。两个前缀、newlib 对 glibc、硬浮点 ABI 的坑。
order: 6
tags:
  - arm-none-eabi
  - cross-compile
  - intermediate
difficulty: intermediate
prerequisites:
  - "GCC 裸机、链接脚本与 objcopy（构建系统卷）"
---

# 交叉编译：嵌入式的定义动作

## 什么是"交叉"，为什么嵌入式的命根子就是它

我们先把这个词钉死。平时你在电脑上 `gcc main.c -o main`、编出来的程序就在你这台电脑上跑——编译器和运行程序的机器是同一台、同一种 CPU 架构，这叫**本地编译（native compile）**。嵌入式几乎永远不是这样：你在 x86 的电脑上写代码、编译，但编出来的程序要在一颗 ARM 的芯片上跑——编译器和目标机不是同一种架构，这种"跨架构"的编译就叫**交叉编译（cross compile）**。可以说，能不能顺畅地交叉编译，是嵌入式和普通软件开发最本质的分界线，所以这一篇我们把它彻底讲透。

交叉编译的关键是一套**前缀不同的工具链**。你电脑上那个普通 `gcc` 编的是 x86；要编 ARM，你得装一个名字带前缀的交叉编译器，比如 `arm-none-eabi-gcc`。这个前缀本身就是信息——我们拆开看：`arm` 是目标架构（ARM）、`none` 表示没有操作系统（裸机）、`eabi` 是 ARM 的嵌入式应用二进制接口（Embedded ABI）规范。所以 `arm-none-eabi-gcc` = "编 ARM 裸机、按 EABI 规约"的 gcc。

## 两个前缀，代表两条完全不同的路

嵌入式里你会撞上两种主流的交叉工具链，名字长得很像、但服务的场景天差地别，必须分清。第一种是 `arm-none-eabi-`，它编的是**裸机**——没操作系统、程序直接跑在金属上，配套的 C 库是 **newlib**（一个为裸机/资源受限环境精简的 libc）。第二种是 `arm-linux-gnueabihf-`，它编的是**跑在嵌入式 Linux 上**的程序，配套的是完整的 **glibc**（桌面 Linux 那套标准 C 库），末尾的 `hf` 表示硬浮点 ABI。

我们这台机器上装的是 `arm-none-eabi-gcc (Arch Repository) 14.2.0`，所以下面裸机相关的命令我们都是真跑、能看真实输出；而 `arm-linux-gnueabihf-gcc` 没装（它的用途是给跑 Linux 的板子编译用户态程序，得单独装 `gcc-arm-linux-gnueabihf`），涉及它的地方我会标注清楚、不伪造它的输出。一句话区分：**给 Cortex-M 这类裸机/RTOS 芯片编，用 `arm-none-eabi-`；给跑嵌入式 Linux 的板子（树莓派、i.MX 上的 Linux）编用户态程序，用 `arm-linux-gnueabihf-`**。

## newlib 对 glibc：C 库的选择

C 库就是你程序里 `printf`、`malloc`、`strlen` 这些函数的来源。裸机世界用的是 newlib，它体积小、可裁剪，但有个前提——它的很多函数（尤其 `printf` 这种要输出的）依赖底层提供"字符怎么发出去"的系统调用桩（叫 `_write`、`_sbrk` 之类），你得自己实现这些桩、或者用半主机（semihosting）让调试器替你转发。newlib 还有个 nano 变体（`--specs=nano.specs`），进一步砍掉 printf 的体积，Cortex-M 项目几乎标配。而 glibc 是桌面/服务器 Linux 那套又大又全的 libc，跑嵌入式 Linux 的板子才用它。这个区别决定了你链接时报的库、写的系统调用桩都不一样，是你选工具链时第一个要想清楚的事。

## 硬浮点 ABI：一个能让你链接时炸开的坑

接下来这个坑，是新手交叉编译时最常见的"明明编过了、链接却报一堆 undefined"。它叫**浮点 ABI**。ARM 芯片有的带硬件浮点单元（FPU）、有的不带；浮点运算既可以由 FPU 直接算（硬浮点 hard），也可以用软件模拟（软浮点 soft）。问题在于：**库是按某种 ABI 编的，你的程序必须和它一致**——你用 `-mfloat-abi=hard` 编、却链了一个 soft 的库，链接器就找不到符号（比如硬浮点要 `__aeabi_dadd`，软浮点库给的是另一套），报一堆 undefined。

我们用真实输出看清楚两者的区别。写一个算圆面积的浮点函数，分别用软、硬浮点编：

```bash
# 软浮点：浮点运算走软件库
arm-none-eabi-gcc -c -mcpu=cortex-m4 -mthumb -mfloat-abi=soft -O2 fpu.c -o fpu_soft.o

# 硬浮点：浮点运算用 FPU 指令
arm-none-eabi-gcc -c -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 -O2 fpu.c -o fpu_hard.o
```

我们反汇编硬浮点那个产物，能看到它用的是货真价实的 FPU 指令：

```text
0:   eddf 7a03    vldr   s15, [pc, #12]     ; 把常数装进浮点寄存器
4:   ee60 7a27    vmul.f32 s15, s0, s15     ; 硬件浮点乘法
8:   ee27 0a80    vmul.f32 s0, s15, s0
```

`vldr`、`vmul.f32` 这些 `v` 开头的指令就是 FPU 在干活。而软浮点产物里你 grep 不到任何这类指令——它的浮点运算是靠调用 `__aeabi_fmul` 之类的软件函数实现的，又慢又占空间。所以只要芯片带 FPU（Cortex-M4F/M7 都带），就一定要用 `-mfloat-abi=hard -mfpu=<对应型号>`，把浮点交给硬件，性能和体积都更好。

> ⚠️ 注意，硬浮点不只是"编自己代码"时加个 flag 的事——**你链的所有库（newlib、HAL、第三方）都必须是同一个 ABI 编的**。混链是交叉编译第一杀手：症状就是链接阶段一堆 `undefined reference to __aeabi_xxx`，根因是你的程序是 hard、某个库是 soft。一旦撞上，先核对所有参与链接的东西是不是统一的 `-mfloat-abi`。

## 用工具链文件把这套固化下来

每个目标芯片的 `-mcpu`、`-mthumb`、`-mfloat-abi`、`-mfpu` 这堆 flag 老是手敲很容易错，正经做法是写进构建系统里固化。如果你用 CMake，就写一个工具链文件（`CMAKE_TOOLCHAIN_FILE`）把这些 flag 跟编译器路径一起声明死，构建时 `-DCMAKE_TOOLCHAIN_FILE=arm-none-eabi.cmake` 传进去——这套我们在 CMake 那一篇讲过。如果你用 Makefile，就把它们放进 `CFLAGS` 变量。无论哪种，核心都是：**让"目标芯片的 ABI 参数"成为一份可复用的配置，而不是每次手敲**。

## 小结

交叉编译是嵌入式的定义动作：在 host 上编、产出给 target 跑。两条路要分清——`arm-none-eabi-` 配 newlib 编裸机、`arm-linux-gnueabihf-` 配 glibc 编嵌入式 Linux 用户态。浮点 ABI 是最大的坑：硬浮点（`-mfloat-abi=hard`）用 FPU 指令（`vldr`/`vmul.f32`），但要求你链的所有库都是同一 ABI，否则链接报 undefined。把 `-mcpu/-mthumb/-mfloat-abi/-mfpu` 这套用工具链文件固化，别每次手敲。能把这些讲清楚、选对工具链和 ABI，你就跨过了嵌入式最关键的那道坎。

## 下一站

编译链搞定了，可没硬件怎么办？下一篇讲 QEMU——让你在电脑上模拟出一台 ARM 机器，没板子也能把程序跑起来、看输出。

> 下一卷：[模拟与复现 · QEMU 无硬件开发使能器](../simulation/qemu)
