---
title: "GDB：从段错误到远程调试"
description: "把 GDB 从'调试 host 程序'推进到'远程调试嵌入式'——断点单步看变量、用 core dump 复盘段错误、连 openocd 做 target remote，以及 -O2 下变量消失怎么办。"
order: 1
tags:
  - host
  - gdb
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "GCC 编译-汇编-链接全流程（构建系统卷）"
---

# GDB：从段错误到远程调试

## 为什么不能只靠 printf

我们写嵌入式的人，调试第一反应往往是"加个 printf 看看"。printf 倒也不是不能用，可它有三个硬伤：占 Flash、要串口、要时间，而且最要命的是——**你崩在哪儿，它就来不及打印哪儿**。真正让你能"停在任何地方、单步走、随时看任何变量和寄存器、回溯整条调用栈"的，只有 GDB。这一篇我们把 GDB 从调试 host 程序一路推进到连着硬件探针做嵌入式远程调试。

## 先准备一个会崩的程序

我们故意写一个会段错误的程序——给函数传一个空指针，函数里去解引用它，一运行就崩。这种 bug 在嵌入式里太常见了：某个指针初始化没做好、或者外设还没就绪就去读：

```c
/* crash.c */
#include <stdio.h>
int sum(int *p, int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += p[i];   /* 传 NULL 会在这里崩 */
    return s;
}
int main(void) {
    int *p = 0;            /* 故意给个空指针 */
    printf("sum = %d\n", sum(p, 3));
    return 0;
}
```

编译时一定要加 `-g`（把调试信息编进去，GDB 才能对应到源码行号），并且**别开优化**（`-O2` 会把变量优化进寄存器、甚至直接算掉，调试时各种"看不到"）：

```bash
gcc -g -O0 crash.c -o crash
```

我们直接跑，看它怎么死：

```bash
./crash
```

```text
Segmentation fault
```

退出码是 139，意思是进程收到了 SIGSEGV（段错误信号，128 + 11）。问题是——它崩在哪一行？printf 没来得及说，我们只能靠 GDB。

## 用 GDB 定位崩点：backtrace 是第一招

我们把程序交给 GDB，让它跑到崩、然后打出调用栈。为了演示方便我们用 `-batch` 非交互方式（真实调试时你会进交互式 `(gdb)` 提示符，命令是一样的）：

```bash
gdb -batch -ex run -ex backtrace ./crash
```

```text
Program received signal SIGSEGV, Segmentation fault.
0x0000555555555168 in sum (p=0x0, n=3) at crash.c:4
4	    for (int i = 0; i < n; i++) s += p[i];   /* 传 NULL 会在这里崩 */
#0  0x0000555555555168 in sum (p=0x0, n=3) at crash.c:4
#1  0x000055555555519f in main () at crash.c:9
```

这一坨信息量很大，我们逐行读。GDB 告诉我们程序收到 SIGSEGV，崩在 `sum` 函数、`crash.c` 第 4 行——而且贴心地把当时的参数 `p=0x0, n=3` 也打出来了。下面那个 `#0`、`#1` 就是调用栈（backtrace）：`#0` 是崩点 `sum` 在第 4 行，`#1` 是调用它的 `main` 在第 9 行。看到 `p=0x0` 这个瞬间，病因基本就清楚了——传进来的是空指针。

我们再跳到 `main` 那一帧（`#1`），看看 `main` 里的 `p` 到底是什么：

```bash
gdb -batch -ex run -ex 'frame 1' -ex 'print p' ./crash
```

```text
#1  0x000055555555519f in main () at crash.c:9
9	    printf("sum = %d\n", sum(p, 3));
$1 = (int *) 0x0
```

`frame 1` 把上下文切到 main 那一帧，`print p` 打出 `p`，GDB 回 `$1 = (int *) 0x0`——`p` 确实是空指针，案子破了。这套 `run` → `backtrace` → `frame N` → `print 变量`，就是定位崩溃的标准四步，背下来受用终身。

## 交互式调试：断点、单步、看变量

真实调试更多是交互式的。你进 `gdb ./crash`，在 `(gdb)` 提示符下，常用的就这几条：`break main` 下断点、`run` 跑起来、`next` 单步（不进函数）、`step` 单步（进函数）、`print x` 看变量、`continue` 继续跑。想随时看所有局部寄存器就 `info registers`，想看汇编就 `disassemble main`。这套命令不用死记，用几次就熟了。

## 嵌入式远程调试：target remote

到嵌入式这块，GDB 的用法变了一下形：板子上没有终端给你跑 GDB，所以要拆成两半——**GDB server** 跑在你的 host 上、通过探针连着硬件；**GDB client** 也在 host 上、通过网络端口连 server。典型是这样两个终端：

```bash
# 终端 1：openocd 当 GDB server，连 ST-Link，在本地 3333 端口听
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# 终端 2：交叉 GDB 连上去
arm-none-eabi-gdb ./blink.elf
(gdb) target remote :3333        # 连本地 openocd
(gdb) load                       # 把 .elf 烧进芯片
(gdb) break main
(gdb) monitor reset halt         # 复位并停在复位向量
(gdb) continue
```

除了 openocd，还有 pyocd（对 Cortex-M 支持广、探针兼容多）、SEGGER 的 JLinkGDBServer，用法结构都一样——server 连硬件开个端口，`arm-none-eabi-gdb` 用 `target remote` 接进去。

## 两个嵌入式特有的坑：硬件断点和 -O2

远程调试里有两个坑你必须知道。第一个是**硬件断点**：平时 GDB 下断点，是临时把那条指令换成一个中断指令来实现，可你的代码跑在 Flash 里、Flash 是只读的，根本写不进去。所以调试运行在 Flash 的代码，GDB 会自动改用 CPU 自带的硬件断点——但 Cortex-M 的硬件断点数量有限（通常 4 到 6 个），你断点下太多就会失败，得删掉不用的。

第二个坑是**开了优化之后变量"消失"**。你用 `-Os` 或 `-O2` 编译，很多局部变量会被优化进寄存器、甚至直接算掉，`print x` 会得到一句 `value has been optimized out`。调试时改用 `-Og -g`——这是 GCC 专门为调试设计的优化级别，保留大部分可读性又不太影响行为；实在要看某个变量，`print &x` 拿地址、再用 `x/...` 看那块内存，或者干脆给它加 `volatile` 强制驻留内存（但别滥用，会影响正常优化）。

## 小结

printf 崩了来不及说，所以嵌入式离不开 GDB。定位崩溃的标准四步是 `run` → `backtrace` → `frame N` → `print 变量`，我们用它当场抓到一个 `p=0x0` 的空指针 bug。编译一定带 `-g`、别开高优化；远程调试拆成 GDB server（openocd/pyocd/JLink）和 `arm-none-eabi-gdb` 用 `target remote` 连；Flash 里的代码只能用数量有限的硬件断点，`-O2` 下变量会 optimized out，调试换 `-Og -g`。这套练熟，固件跑飞你就有抓手了。

## 下一站

到这里 P0 的工具链主干——终端、Git、GCC、Make、CMake、GDB——我们已经打通。接下来是把"在我电脑上编、在板子上跑"做到极致的交叉编译（规划中），或者直接进具体平台实战，各 `*-forge` 仓库假定你已经会了上面这套。

> 回到 [工具链先行](../getting-started/toolchain-first) 看全图，或回组织门户 [Awesome-Embedded](https://github.com/Awesome-Embedded-Learning-Studio/Awesome-Embedded)。
