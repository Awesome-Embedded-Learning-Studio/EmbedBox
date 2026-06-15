---
title: "QEMU：无硬件开发使能器"
description: "用 QEMU 在电脑上模拟出一台 ARM 机器，没板子也能跑程序、看输出——机型与 CPU 怎么选、怎么把裸机程序跑起来、以及那个静默挂起的坑。"
order: 1
tags:
  - host
  - qemu
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "GCC 裸机、链接脚本与 objcopy（构建系统卷）"
  - "串口：嵌入式的 stdout（本调试卷）"
---

# QEMU：无硬件开发使能器

## 没板子也能跑，这件事值多少钱

我们前面所有章节，编译出来的 ARM 程序要么烧进真芯片、要么就只是个文件搁那儿。可现实是：板子还没到货、或者你正等着 PCB 打样、或者只是想快速验证一段代码逻辑——这种时候要是没硬件就只能干等。QEMU 解决的就是这个：它是一个开源的**机器模拟器**，能在你电脑上凭空模拟出一台 ARM 机器（连 CPU、内存、串口、甚至网卡都能模拟），你把交叉编译出来的程序丢进去，它就像在真板子上一样跑起来，串口输出还能直接打到你屏幕上。对嵌入式来说，QEMU 是让你"先于硬件开始开发"的使能器——启动代码、驱动框架、甚至一个最小内核，都能先在 QEMU 上调通，等板子到了再迁移。这一篇我们把它从装到跑通一个真程序讲清楚。

## 装上、看它都能模拟什么

QEMU 装上后，我们要用的命令是 `qemu-system-arm`（专门模拟 ARM 系统的）。先看版本、再看它能模拟哪些机器——这两条都是真实输出：

```bash
qemu-system-arm --version
```

```text
QEMU emulator version 11.0.1
```

关键是 `-M help`，它列出 QEMU 支持的所有机器模型，这是你选 `-machine` 参数的依据：

```bash
qemu-system-arm -M help
```

```text
lm3s6965evb          Stellaris LM3S6965EVB (Cortex-M3)
microbit             BBC micro:bit (Cortex-M0)
mps2-an385           ARM MPS2 with AN385 FPGA image for Cortex-M3
mps2-an386           ARM MPS2 with AN386 FPGA image for Cortex-M4
mps2-an500           ARM MPS2 with AN500 FPGA image for Cortex-M7
...
virt                 QEMU virt board (no MMU) ...
```

你会发现这里全是嵌入式里眼熟的机器——`microbit` 就是 BBC micro:bit（M0）、`mps2-an386` 是一颗 Cortex-M4 的参考板、`virt` 是 QEMU 自己定义的通用 ARM 机器（最适合我们做裸机实验，因为它地址固定、外设简单）。选机器就是选 `-machine`（简写 `-M`），比如 `-M virt`、`-M mps2-an386`。`-cpu` 选具体 CPU 核（如 `-cpu cortex-m4`、`-cpu cortex-a15`），得跟你机器模型支持的核对得上。

## 把一个裸机程序真跑起来

我们直接上手跑。串口那一篇已经讲过：QEMU 的 `virt` 机器模拟了一个 PL011 串口、数据寄存器在 `0x09000000`，`-nographic` 启动时这条串口会被路由到 stdout。我们写个往那写"Hello"的最小裸机程序，用交叉编译器编出来、链到 `virt` 的内存起始 `0x40000000`：

```bash
arm-none-eabi-gcc -nostdlib -ffreestanding -mcpu=cortex-a15 -O2 \
    -Wl,-Ttext=0x40000000 hello.c -o hello.elf
qemu-system-arm -M virt -cpu cortex-a15 -m 128M -nographic -kernel hello.elf
```

```text
Hello from QEMU bare-metal!
```

这条输出是真在 QEMU 11.0.1 + `virt` 机型上跑出来的。串口篇里有完整的程序源码，这里我们聚焦 QEMU 这一头：`-M virt` 选机器、`-cpu cortex-a15` 选核、`-m 128M` 给 128M 内存、`-nographic` 关掉图形窗口并把串口接到 stdout、`-kernel hello.elf` 加载我们的程序并跳进去执行。程序写完串口就进死循环挂住，退出 QEMU 按 `Ctrl+A` 松开再按 `X`。

> ⚠️ 注意，`-nographic` 这个参数把串口、监视器、QEMU 自己的控制台全混到了同一个终端，所以退出用的不是 `Ctrl+C`（那只是给程序发信号），而是 QEMU 的组合键 `Ctrl+A X`。新手常在这里卡住——程序挂住了、`Ctrl+C` 没反应、以为 QEMU 崩了，其实是没找对退出键。

## 那个"静默挂起"的坑

QEMU 最让新手发懵的，是它经常**什么都不输出、也不报错、就挂在那儿**，你不知道是程序没跑、还是跑错了、还是压根没加载上。我们得理解这个现象的根因。QEMU 模拟一台机器，需要一个"入口"——要么是 `-kernel` 指定的程序、要么是 `-bios` 指定的固件、要么是机器自带的 ROM。如果你不给它任何入口，或者给的程序入口地址跟机器期望的对不上，QEMU 就会从某个地址开始执行一堆未初始化的内存（通常是 0，ARM 里是 `andeq r0,r0,r0` 这种空操作），表现就是：**不报错、不输出、CPU 100% 空转、永远挂住**。

```bash
# 没给任何程序/固件，QEMU 就这样挂着不动（机器模型没匹配上入口）
qemu-system-arm -M virt -nographic
# （挂住，只能 Ctrl+A X 退出）
```

这就是传说中的"机器模型不匹配静默挂起"。撞上了别慌，按这个顺序排查：先确认你给了入口（`-kernel`/`-bios` 至少一个）、再确认程序的链接地址和机器的内存布局对得上（比如 `virt` 的 RAM 从 `0x40000000` 起，你链到别的地址就跑飞）、再确认 `-machine` 和 `-cpu` 组合是这个机器支持的。串口没输出，也可以先怀疑是程序根本没跑到写串口那一步，而不是串口本身坏了。

## 小结

QEMU 是嵌入式的无硬件使能器——在你电脑上模拟一台 ARM 机器，没板子也能跑程序、看输出。`qemu-system-arm --version` 看版本、`-M help` 看支持的机器（microbit/mps2-an386/virt 这些），`-machine`/`-cpu`/`-m`/`-nographic`/`-kernel` 是跑起来最常用的几个参数。把裸机程序链到机器内存起始地址、`-kernel` 加载就能跑，`-nographic` 把串口接到 stdout，退出按 `Ctrl+A X`。最常见的坑是"静默挂起"——没给入口或地址不对，QEMU 空转不报错，得按"入口→链接地址→机器/CPU 组合"的顺序排查。在板子到货之前，QEMU 让你能先把启动代码和驱动框架跑起来，是嵌入式开发极有用的前置使能器。

## 下一站

QEMU 解决了"没硬件跑不了"的问题，下一个使能器是 Docker——把整套交叉工具链的版本钉死，换台电脑也能复现一模一样的构建环境。

> 下一卷：[Docker 钉死可复现工具链](./docker)
