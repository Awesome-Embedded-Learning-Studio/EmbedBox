---
title: "Makefile：把编译流程自动化，顺带驱动交叉工具链"
description: "用 Make 把 GCC 编译链接流程自动化——变量、自动变量、模式规则、伪目标，改了哪个文件只重编哪个，并把交叉工具链和一键 flash 接进来。"
order: 2
tags:
  - host
  - make
  - arm-none-eabi
  - beginner
difficulty: beginner
prerequisites:
  - "GCC 编译-汇编-链接全流程（本卷 gcc 小串）"
---

# Makefile：把编译流程自动化，顺带驱动交叉工具链

## 为什么不能一直手敲 gcc

我们在 gcc 小串里已经把 `blink.c → blink.o → blink.elf → blink.bin` 这条链路走通了，可你只要试过一次就明白：项目稍微大一点，每次手敲一长串 `gcc a.c b.c c.c -I... -L... -l... -o app` 根本不现实，更何况你还想"只重编改过的文件"、想"一键烧录"。Make 就是来解决这个的——它读一个叫 `Makefile` 的文件，根据文件之间的依赖关系，决定哪些需要重做、哪些可以跳过。Linux 内核、U-Boot、Zephyr、STM32 的 Cube 工程，底层构建全是它。

## 最小 Makefile，和那个要命的 Tab

我们从一个最小的例子起步。Makefile 的基本形态是"目标: 依赖"写一行，下面缩进写生成它的命令：

```makefile
main: main.c
	gcc main.c -o main
```

先别急着往下看，注意那个缩进——**命令行前面必须是一个 Tab，不是空格**。这是 Make 最著名、也最坑新手的规则。如果你用了空格，跑 `make` 会直接甩给你一句 `*** missing separator. Stop.`，而且这句话完全不提 Tab，新人看到基本是一脸懵。记住这个对应关系：`missing separator` = 你用了空格。

## 用变量把工具链换成 arm-none-eabi-

真实项目里，我们会把编译器、编译选项都抽成变量，这样要切工具链只改一个地方。我们把 gcc 小串里的 blink 程序组织成一个多文件工程，`main.c` 调 `utils.c` 里的 `add`，Makefile 写成这样：

```makefile
CC      = gcc
CFLAGS  = -Wall -g
OBJS    = main.o utils.o

app: $(OBJS)
	$(CC) $(CFLAGS) $^ -o $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

.PHONY: clean
clean:
	rm -f $(OBJS) app
```

我们实跑一遍，第一次 `make` 会把两个 `.c` 都编出来、再链接：

```text
gcc -Wall -g -c main.c -o main.o
gcc -Wall -g -c utils.c -o utils.o
gcc -Wall -g main.o utils.o -o app
```

跑一下 `./app`，输出 `add(2,3)=5`。这里我们顺带把几个 Make 的关键概念用上了：`$(CC)`、`$(CFLAGS)` 是变量展开；`$@` 代表当前目标名、`$<` 代表第一个依赖、`$^` 代表所有依赖，这三个叫自动变量，能让你少打很多字；`%.o: %.c` 是模式规则，一条规则覆盖所有 `.c` 到 `.o` 的转换，新增文件不用再抄一遍规则。想把这套从"编 host 程序"变成"交叉编译 ARM 固件"，只要把 `CC = gcc` 改成 `CC = arm-none-eabi-gcc`、`CFLAGS` 里加上 `-mcpu=cortex-m4 -mthumb`，其它原封不动。

## Make 真正的红利：增量编译

我们再跑一次 `make`，什么文件都不改，看它怎么说：

```text
make: 'app' is up to date.
```

它什么都没干，直接告诉你"app 是最新的"。这就是 Make 的核心价值：它比较每个目标和它依赖文件的修改时间，**只有依赖比目标新，才重新生成**。我们做个实验，只 `touch utils.c`（把它的修改时间刷成现在），再 `make`：

```text
gcc -Wall -g -c utils.c -o utils.o
gcc -Wall -g main.o utils.o -o app
```

这次它只重编了 `utils.o` 和最后的链接，`main.o` 完全没动。一个几十个文件的工程，你改了一个，Make 只重做必要的两三步，这就是为什么大项目 `make` 几秒就完事。`make clean` 走的是那条 `.PHONY` 声明的伪目标，把产物全删掉、强制下次全量重编：

```text
rm -f main.o utils.o app
```

> ⚠️ 注意 `.PHONY` 这一行。`clean`、`flash`、`all` 这些"动作型"目标并不对应真实文件，你得用 `.PHONY` 声明它们是伪目标，否则哪天你目录里恰好出现一个叫 `clean` 的文件，`make clean` 会觉得"clean 这个文件已经存在、又没有依赖比它新"，于是什么都不干——这种 bug 极其隐蔽。

## 接上交叉工具链和一键 flash

把上面这套拼起来，一个能交叉编译、还能一键烧录的 Makefile 长这样：

```makefile
CC      = arm-none-eabi-gcc
CFLAGS  = -mcpu=cortex-m4 -mthumb -Os -g -Wall
OBJS    = main.o utils.o

app.elf: $(OBJS)
	$(CC) -T linker.ld -nostdlib $^ -o $@

app.bin: app.elf
	arm-none-eabi-objcopy -O binary $< $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

.PHONY: clean flash
clean:
	rm -f $(OBJS) app.elf app.bin
flash: app.bin
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
	        -c "program app.bin reset exit 0x08000000"
```

现在 `make` 编译、`make app.bin` 出裸镜像、`make flash` 一键烧录、`make clean` 清理，整套流程一条命令搞定。这跟内核、U-Boot 里 `make` + `make flash` 的体验是同一回事。

## 小结

Make 的核心是"目标-依赖-命令"三件套，命令行前必须是 Tab，这是 `missing separator` 报错的唯一来源。变量加自动变量（`$@`/`$<`/`$^`）加模式规则（`%.o: %.c`）让你不用重复写；`.PHONY` 声明动作型伪目标，避免跟同名文件撞车。Make 最值钱的能力是增量编译——靠比较修改时间只重做必要的步骤。把 `CC` 换成 `arm-none-eabi-gcc`，再加一个 `flash` 伪目标调 openocd，就得到了嵌入式项目最经典的构建脚本形态。

## 下一站

Make 够用，但项目一大、跨平台跨工具链一多，手写 Makefile 会越来越吃力。CMake 就是来接这个班的——而且 AwesomeQt 这些兄弟仓库都假定你会。

> 下一卷：[CMake：概念 + 工具链文件](./cmake)
