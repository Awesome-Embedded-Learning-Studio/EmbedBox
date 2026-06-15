---
title: "串口：嵌入式的 stdout"
description: "为什么串口是嵌入式世界里几乎唯一的输出观测手段、协议（波特率/8N1/电平）怎么理解，怎么用 QEMU 无硬件验证、再用 USB-TTL + minicom 在真板上抓日志。"
order: 2
tags:
  - host
  - serial
  - qemu
  - intermediate
difficulty: intermediate
prerequisites:
  - "终端与 Shell 进阶（权限、/dev 设备文件）"
  - "GDB（本卷）"
---

# 串口：嵌入式的 stdout

## 为什么串口是嵌入式的命脉

我们写普通程序，想看个变量直接 `printf`、终端就出来了——因为底下有操作系统、有终端驱动替你把字送到屏幕上。可嵌入式不一样：你的程序跑在裸机芯片上，没有屏幕、没有操作系统、更没有 `printf` 默认就去的那条路。那你怎么知道程序跑到哪了、变量是多少、有没有崩？答案几乎只有一条——**串口（UART）**。芯片上有串口硬件、你拿一根 USB-TTL 线把芯片的 TX/RX 接到电脑，程序往串口寄存器里写字节，电脑这边用工具收下来显示，这就是嵌入式版的 `printf`、也就是你的"stdout"。可以这么说：嵌入式开发离了串口几乎寸步难行，它是你观测板子状态最主要的窗口。

这一篇我们先讲清楚串口的协议（波特率、数据帧、电平），再用 QEMU 在**没有真硬件**的情况下把"程序写字节 → 屏幕显示"这条路真跑通给你看，最后讲真板子怎么用 USB-TTL 和 minicom 抓日志。

## 协议：波特率、8N1、电平

串口通信的核心概念其实就三个。**波特率（baud rate）**是双方约定的"每秒传多少位"的速度，必须收发两端设成一样，常见的有 9600、115200（嵌入式最常用）。**数据帧格式**最常见的是"8N1"——8 个数据位、无校验位（No parity）、1 个停止位，一个字节加上起始位停止位一共 10 位在线上跑。**电平**是另一个新手最容易烧板子的点：芯片那边的串口是 TTL 电平（3.3V 表示高），而你电脑老式串口是 RS232 电平（±12V，方向相反），**两者绝不能直连**，直连轻则通信不通、重则烧芯片。我们日常用 USB-TTL 转换器（一头 USB、一头 3.3V TTL），它在内部把 USB 转成 3.3V TTL，正好跟芯片对接；接的时候 TX 接 RX、RX 接 TX（交叉接），GND 共地，别忘了 VCC 看芯片是 3.3V 还是 5V 别接错。

> ⚠️ 注意，最常见的"串口收到一堆乱码"故障，九成是波特率两端不一致——芯片按 115200 发、你这边按 9600 收，解出来的全是乱码。看到乱码第一反应不是怀疑程序，而是核对接收端的波特率跟程序里设的是否一致。

## 没有硬件？QEMU 帮你把这条路跑通

我们不依赖真板子，先在 QEMU 里把"程序往串口写、屏幕显示出来"这条路完整验证一遍——这正好也是后面 QEMU 那一篇的预热。QEMU 的 `virt` 机器模拟了一个 PL011 串口控制器，它的数据寄存器固定在地址 `0x09000000`，我们往这个地址逐字节写字符，QEMU 用 `-nographic` 启动时会把这条串口路由到你电脑的 stdout。先写一个最小裸机程序：

```c
/* serial_hello.c —— 往 QEMU virt 机器的 PL011 串口数据寄存器逐字节写 */
volatile unsigned int *const UART0_DR = (unsigned int *)0x09000000;
void _start(void) {
    const char *s = "Hello from QEMU bare-metal!\r\n";
    while (*s) *UART0_DR = (unsigned int)*s++;
    for (;;);   /* 写完死循环停住 */
}
```

这个程序没有任何依赖——没有 libc、没有启动文件，`_start` 就是入口，干的事就是把字符串里每个字符写到那个固定的串口寄存器地址。我们用交叉编译器编成 ARM 裸机 ELF、链接到 `virt` 机器的内存起始地址 `0x40000000`：

```bash
arm-none-eabi-gcc -nostdlib -ffreestanding -mcpu=cortex-a15 -O2 \
    -Wl,-Ttext=0x40000000 serial_hello.c -o serial_hello.elf
```

然后用 QEMU 跑起来（`-M virt` 选机型、`-nographic` 把串口接到 stdout、`-kernel` 加载我们的 ELF）：

```bash
qemu-system-arm -M virt -cpu cortex-a15 -m 128M -nographic -kernel serial_hello.elf
```

跑出来的结果是真真切切的一行字：

```text
Hello from QEMU bare-metal!
```

（注：这个程序在 QEMU 11.0.1、`virt` 机型上实测通过，输出就是上面这行；写完它会进死循环挂住，按 `Ctrl+A X` 退出 QEMU。）

这条链路打通的意义在于：**它用零硬件证明了一个嵌入式程序的输出是怎么从芯片流到屏幕的**——程序写字节到串口寄存器 → 串口控制器按 8N1、约定波特率把位打到线上 → 接收端（这里是 QEMU）按同样的约定把位拼回字节 → 显示。真板子上唯一多了的，是中间那根 USB-TTL 线和一个 minicom 之类的接收工具。

## 真板子：USB-TTL + minicom 抓日志

到了真板子，我们用 USB-TTL 线把芯片串口接到电脑 USB，插上后设备出现在 `/dev/ttyUSB0`（Linux）。接收这头我们用 minicom 或 picocom——它们就是"串口版的终端"，按你设的波特率收字节、显示成字符。先确认设备权限（终端那一卷讲过，串口设备属 `dialout`/`uucp` 组，没权限会 permission denied）：

```bash
ls -l /dev/ttyUSB0
groups                       # 看自己在不在 dialout(uucp) 组
sudo usermod -aG dialout $USER   # 不在就加上，然后重新登录生效
```

然后用 minicom 打开串口、设好波特率（比如 115200、8N1）。minicom 是交互式的，进去之后一般 `Ctrl+A Z` 调菜单、`Ctrl+A Q` 退出；打开时可以直接 `-b` 指定波特率、`-D` 指定设备：

```bash
minicom -b 115200 -D /dev/ttyUSB0
```

> 说明：minicom / picocom 这类工具和 `/dev/ttyUSB0` 设备需要真实硬件——本机没有 USB-TTL 和板子，所以这一节的命令是你在有硬件时跑的，我们没法在这里贴真实的串口接收输出。如果你只想快速看一眼串口、又不想装 minicom，Linux 自带的 `stty` 也能配串口参数、再 `cat /dev/ttyUSB0` 直接读，够应急用。

想存日志的话，minicom 里能 `Ctrl+A Z` 开 log 到文件；或者命令行直接 `cat /dev/ttyUSB0 | tee serial.log` 把收到的字节同时显示和存盘，跟我们在终端篇讲的 `tee` 一回事。

## 小结

串口是嵌入式的 stdout——裸机上没有操作系统的 `printf`，程序往串口寄存器写字节、电脑这头用工具收下来显示，就是你看板子状态的主要窗口。协议三件事：波特率两端必须一致（不一致就乱码）、最常见 8N1 帧、TTL 电平（3.3V）绝不能跟 RS232 直连、接法是 TX 交叉接 RX。没硬件时用 QEMU 的 `virt` 机型（PL011 串口在 `0x09000000`）能零成本把"写字节→显示"这条路真跑通。真板子上 USB-TTL + minicom（`-b 波特率 -D /dev/ttyUSB0`），记得先把串口设备权限（dialout/uucp 组）搞定。串口是你和板子之间最基础也最可靠的那条观测通道。

## 下一站

串口讲完了，调试这一卷（GDB + 串口）就齐了。接下来如果你手里暂时没板子、又想跑 ARM 程序，下一篇 QEMU 是你的无硬件开发使能器——这一篇里那个 `virt` 机型的程序，下一篇会展开讲。

> 下一卷：[模拟与复现 · QEMU 无硬件开发使能器](../simulation/qemu)
