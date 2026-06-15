---
title: "裸机、链接脚本与 objcopy：从 .elf 抽出能烧的 .bin"
description: "换上交叉工具链 arm-none-eabi-gcc，编一个最小裸机程序，看懂链接脚本怎么把段摆进 Flash/RAM、.data 的 VMA 与 LMA 为什么不一样，最后用 objcopy 抽出能烧进芯片的裸 .bin。"
order: 3
tags:
  - host
  - gcc
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "从一行 gcc 到看懂 .o 里的段（本卷第 1 篇）"
  - "链接、库与 undefined reference（本卷第 2 篇）"
---

# 裸机、链接脚本与 objcopy：从 .elf 抽出能烧的 .bin

## 这一篇想解决什么

前两篇我们都在 host 上玩，gcc 编出来的程序是在自己电脑上跑的。可嵌入式的本质诉求是另一回事——**在我电脑上编译、在另一颗芯片上运行**，这叫交叉编译。而且裸机程序跟 host 程序有一个根本差别：它没有操作系统兜底，没有 `main` 的标准入口，上电那一刻 CPU 从哪个地址、执行什么，全得我们自己交代清楚。这一篇我们就把这条链路真正走通——换上 `arm-none-eabi-gcc`，编一个最小裸机程序，看懂链接脚本怎么把各个段摆进 Flash 和 RAM，最后用 `objcopy` 抽出芯片真正要的裸 `.bin`。

环境上我们需要交叉工具链。笔者的版本是 `arm-none-eabi-gcc (Arch Repository) 14.2.0`，你在 WSL 里 `sudo apt install gcc-arm-none-eabi` 装的就是它。这一篇全程不需要真板子，我们只编、不烧——产出的 `.bin` 是给芯片吃的，但生成它的全过程在 host 上就能跑通验证。

## 先写一个"没有 main"的最小裸机程序

我们先准备程序本体。在 host 上，程序入口是 `main`，背后其实有一整套 C 运行时（crt0）在 `main` 之前帮你清好了场地。裸机没有这些，芯片一上电，CPU 会从一个固定地址（复位向量）取一条地址、跳过去执行——我们要提供的，就是那个被跳过去的函数，习惯上叫 `Reset_Handler`。为了后面能演示 `.data` 和 `.bss`，我们再放两个全局变量：

```c
/* blink.c —— 最小裸机：没有 main，只有复位入口 */
volatile int counter = 7;        /* .data：有初值，上电要从 Flash 拷到 RAM */
int zero_pad[16];                /* .bss：初值 0，上电清零 */
void Reset_Handler(void) {       /* 复位向量：芯片上电第一个执行的函数 */
    while (1) { counter++; }
}
```

这里有几个跟 host 程序不一样的地方，我们一个个说。首先没有 `main`——取而代之的是 `Reset_Handler`，它的名字得跟链接脚本里的 `ENTRY(...)` 对上，链接器才知道"入口是它"。其次 `counter` 那个 `volatile` 不是装饰——这个程序就是个死循环自增，编译器如果发现没人读 `counter`、又没标 `volatile`，会"好心"地把整个循环优化掉，这不是我们想要的，`volatile` 就是逼着编译器每次都老实读写内存。最后那个 `zero_pad` 是故意放的，等会儿你会看到它在最终镜像里几乎不占 Flash，正好印证上一篇讲的 `.bss` 特性。

## 链接脚本：把段摆进 Flash 和 RAM

接下来是最关键的一份文件——链接脚本（linker script，`.ld`）。host 程序我们从来不写这东西，因为 gcc 自带一个默认的、适合 host 的脚本。裸机不行：Flash 和 RAM 在不同地址、大小不同，每个段的去处我们得自己讲清楚。我们先看一份能跑的最小脚本，再拆解：

```text
/* linker.ld */
ENTRY(Reset_Handler)
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 256K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
SECTIONS {
    .text : { *(.text*) } > FLASH
    .data : { *(.data*) } > RAM AT > FLASH   /* VMA 在 RAM，LMA 在 Flash：启动时拷贝 */
    .bss  : { *(.bss*) *(COMMON) } > RAM      /* 启动时清零 */
}
```

我们逐块看。`ENTRY(Reset_Handler)` 告诉链接器程序入口是哪个符号——还记得上面那个函数名吧，对上的就是它。`MEMORY` 这块是在"画地图"：我们声明有两片存储区，`FLASH` 从 `0x08000000` 开始、256K 大、只读可执行（`rx`），`RAM` 从 `0x20000000` 开始、64K 大、可读可写可执行（`rwx`）——这两个地址是 STM32F4 那一类芯片的典型值，换成别的芯片就改这里。

真正的重头戏在 `SECTIONS`。`.text` 我们扔进 FLASH，这没悬念，代码就该待在掉电不丢的 Flash 里。但 `.data` 那行才是这篇的精华，我们先把它编译出来、用真实输出说话，再回头解释那行 `AT > FLASH` 为什么是整套裸机启动设计的核心。

## 编出来，看 `.data` 的两个地址为什么不一样

现在我们把程序和链接脚本喂给交叉工具链。先 `-c` 出 `.o`，再带链接脚本链接成 `.elf`：

```bash
arm-none-eabi-gcc -c -mcpu=cortex-m4 -mthumb -O2 blink.c -o blink.o
arm-none-eabi-gcc -nostdlib -T linker.ld -mcpu=cortex-m4 -mthumb blink.o -o blink.elf
```

`-mcpu=cortex-m4 -mthumb` 是告诉它目标 CPU 是 Cortex-M4、用 Thumb 指令集；`-nostdlib` 是说不链 host 的标准库（裸机哪来的 libc）；`-T linker.ld` 指定我们刚写的脚本。两步都过了的话，先看段大小：

```bash
arm-none-eabi-size blink.elf
```

```text
   text	   data	    bss	    dec	    hex	filename
     16	      4	     64	     84	     54	blink.elf
```

`data` 是 4 字节（那个 `int counter = 7`），`bss` 是 64 字节（`zero_pad[16]`，16 个 int）。现在真正的重点来了——我们用 `objdump -h` 看每个段的**两个地址**：

```bash
arm-none-eabi-objdump -h blink.elf | grep -E '\.text|\.data|\.bss'
```

```text
  0 .text         00000010  08000000  08000000  ...
  1 .data         00000004  20000000  08000010  ...
  2 .bss          00000040  20000004  08000014  ...
```

注意看 `.data` 那一行——它有两个地址：第一个 `20000000` 是 VMA（Virtual Memory Address，运行时地址，在 RAM），第二个 `08000010` 是 LMA（Load Memory Address，加载地址，在 Flash）。**这两个地址不一样，正是裸机启动的全部秘密所在**。

我们停下来把这件事想透。`counter = 7` 这个初值，掉电不能丢，所以它的"出厂值"必须存在 Flash 里（LMA `0x08000010`）；可程序运行时要改它，Flash 不能随便写，它运行时必须待在 RAM 里（VMA `0x20000000`）。于是链接器做了一个精妙的安排：把这个段**在 Flash 里存一份初值（LMA），但告诉 CPU"运行时请把它当作在 RAM 地址（VMA）"**。中间这道"从 Flash 拷到 RAM"的工序谁来做？就是我们一直念叨的启动代码——`Reset_Handler` 在干正经事之前，得先把 `.data` 从它的 LMA 拷到 VMA、再把 `.bss` 清零，这两步做完，C 代码里的全局变量才算真正"就位"。

> ⚠️ 注意：我们这个最小 `Reset_Handler` 其实没干拷贝和清零这两步——它直接进了死循环。所以这个程序真烧进板子、`counter` 的初值并不会正确出现在 RAM 里。这是**故意**的，为了把"编译流水线"讲清楚；真正能跑的启动代码（读 LMA/VMA、循环拷 `.data`、清 `.bss`、再跳 `main`）属于具体芯片的 bring-up，留给后面的平台实战卷。这一篇你要带走的是"为什么需要那么做"，而不是这份缩水的实现。

对照一下 `.bss` 那行：它的 VMA 是 `0x20000004`（紧跟 `.data` 后面，都在 RAM），大小 `0x40`（64 字节）。它**没有初值要存**，所以根本不需要 Flash 里那一份，启动代码只要在 RAM 里把这片清成零就行——这就是上一篇说的"`bss` 几乎不占 Flash"的真相，它连 LMA 都不需要真存数据。

## objcopy：抽出芯片要的裸 `.bin`

链接出来的 `.elf` 信息很全（带调试符号、带两个地址），可芯片不认 ELF 这种格式——它的 Flash 控制器只认"从某个地址开始、一字节一字节的纯二进制"。把这层"包装"剥掉、只留裸数据的，就是 `objcopy`：

```bash
arm-none-eabi-objcopy -O binary blink.elf blink.bin
file blink.bin
stat -c%s blink.bin
```

```text
blink.bin: data
20
```

`file` 说它是 `data`（纯二进制），大小只有 20 字节——这 20 字节就是真正要烧进 Flash、芯片上电会逐条执行的内容。到这里整条流水线到头了：`blink.c` → `blink.o` → `blink.elf` → `blink.bin`，从一个 C 函数，变成了一颗芯片能吃的裸镜像。

顺带一提，有些烧录器更喜欢 Intel HEX 格式（带地址、带校验的文本），objcopy 一样能出：

```bash
arm-none-eabi-objcopy -O ihex blink.elf blink.hex
head -3 blink.hex
```

```text
:020000040800F2
:10000000024A136801331360FBE700BF00000020C1
:0400100007000000E5
```

这些 `:` 开头的行就是 HEX 记录，第一行 `020000040800` 是在说"接下来的数据从 `0x0800` 那一段开始"——你能隐约看到 `0800` 这个 Flash 基址的影子。HEX 比 bin 多带地址信息，所以哪怕烧到非零偏移也不乱，这是有些老牌烧录工具偏爱它的原因。

## 小结

这一篇我们把交叉编译的最后一公里走通了。换上 `arm-none-eabi-gcc`、用 `-nostdlib` 摆脱 host 库、用 `-T linker.ld` 交代段的去向，编出一个最小裸机程序。链接脚本里的 `MEMORY` 画好 Flash/RAM 地图，`.data` 那行 `> RAM AT > FLASH` 造就了 VMA 与 LMA 的分离——初值存 Flash、运行时在 RAM，中间的搬运和 `.bss` 清零由启动代码负责。最后 `objcopy -O binary` 把 ELF 剥成芯片要的裸 `.bin`（我们这份是 20 字节），`-O ihex` 还能出带地址的 HEX。

自测：能不能解释 `.data` 为什么有两个地址、分别是给谁用的；`-nostdlib` 在这里为什么不能省；为什么说真正能跑的 `Reset_Handler` 还得补上拷 `.data` 和清 `.bss` 这两步。如果你能把这套讲给一个没碰过裸机的人听懂，那这三篇 GCC 就算真正吃透了。

到这里，从一行 gcc 到一颗芯片能吃的 `.bin`，整条链路我们已经亲手走了一遍，可以庆祝一下了。接下来用构建系统把这套流程自动化（别每次手敲一长串 gcc），就轮到 Makefile 和 CMake 登场。

> 下一卷：Makefile / CMake（见本门类同级目录）
