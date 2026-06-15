---
title: "终端与 Shell 进阶：嵌入式开发的那只手"
description: "把终端从'会敲 cd/ls'升级成能控制环境的工具——环境变量与 PATH、管道重定向、权限与串口设备、进程与后台、设备文件与 dd 烧写。"
order: 2
tags:
  - host
  - shell
  - beginner
difficulty: beginner
prerequisites:
  - "前置认知：工具链先行"
  - "WSL2 + Linux + VS Code 远程开发"
---

# 终端与 Shell 进阶：嵌入式开发的那只手

## 为什么终端是嵌入式的手

我们先把话说在前面：嵌入式开发几乎没有 GUI。烧录靠命令，串口靠命令，交叉编译靠命令，看日志还是靠命令。这意味着终端不熟，你连"为什么我的 `arm-none-eabi-gcc` 提示找不到命令"都排查不了——而这种问题，十有八九就是 PATH 没配对。这一篇我们假定你已经会 `cd`、`ls`、装好了 Linux 环境（没装的话先去看 WSL 那一卷），现在我们要把终端从"敲几个常用命令"升级成"真正能控制环境的工具"。

## 环境变量：Shell 里的全局设置

环境变量是 Shell 里全局可见的"设置"，读它用 `$` 加名字，设它用 `export`。我们先看一个嵌入式里最典型的例子——交叉编译前缀：

```bash
export CROSS_COMPILE=arm-none-eabi-
${CROSS_COMPILE}gcc --version
```

设完之后，`${CROSS_COMPILE}gcc` 在当前这个终端里就等价于 `arm-none-eabi-gcc`，真实跑出来是这样：

```text
arm-none-eabi-gcc (Arch Repository) 14.2.0
```

> ⚠️ 注意那个花括号：必须写成 `${CROSS_COMPILE}gcc`。如果你偷懒写成 `$CROSS_COMPILEgcc`，Shell 会把 `CROSS_COMPILEgcc` 整体当成一个变量名去查，查不到就是空，于是你执行的其实是裸 `gcc`——编出来的东西在你自己电脑上能跑，烧到板子上就各种不对。这个坑笔者见过不止一个人踩，而且非常难查，因为命令"看起来"是对的。

这里有个绕不开的事实：`export` 设的变量只对**当前这个终端**有效，你关掉再开一个，它就没了。想让交叉编译前缀每次开终端都自动就位，得把它写进 `~/.bashrc`——这个文件每次启动交互式 Shell 时都会被执行一遍：

```bash
echo 'export CROSS_COMPILE=arm-none-eabi-' >> ~/.bashrc
source ~/.bashrc
```

`source` 是让当前终端立刻把 `~/.bashrc` 重新读一遍，省得你关终端重开。内核和驱动那套源码树也认这两个变量，编译内核时经常写成 `ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- make`，本质跟我们是同一回事。

## PATH：Shell 去哪儿找命令

跟环境变量紧挨着的是 PATH。你敲 `arm-none-eabi-gcc`，Shell 不是凭空知道这个命令在哪的，它是在 PATH 列出的一堆目录里挨个找，找到第一个就叫它。我们看一眼自己机器上的 PATH 长什么样：

```bash
echo $PATH
```

```text
/home/charliechen/.local/bin:/opt/arm-gnu-toolchain/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:...
```

这一长串是冒号分隔的目录列表，Shell 按从左到右的顺序找。所以当你解压了一份新的工具链到 `/opt/gcc-arm-none-eabi/bin`，敲命令却提示找不到，原因就是那个目录不在 PATH 里。加进去的办法是在 PATH 末尾追上它：

```bash
export PATH=$PATH:/opt/gcc-arm-none-eabi/bin
```

这里 `$PATH` 是把原来的 PATH 取出来、再拼上新的目录、整体赋回给 PATH——`$PATH:` 后面跟新目录这种写法，是追加而不是覆盖，别写成 `PATH=/opt/...` 把原来的全冲掉。同样想永久生效就写进 `~/.bashrc`。

## 管道与重定向：把命令串起来、把输出存下来

单条命令够用之后，我们马上会想把它们串起来用。管道 `|` 把左边命令的输出喂给右边当输入，重定向 `>` 把输出写进文件，`>>` 是追加。我们看一个调试时极常用的组合——把构建过程既显示在屏幕上、又存进日志，事后还能从日志里捞错误：

```bash
make 2>&1 | tee build.log
grep -i error build.log
```

这里 `2>&1` 是关键，它把标准错误（文件描述符 2）合并到标准输出（文件描述符 1）里去。为什么要这么干？因为编译器的报错很多是走标准错误的，如果你只 `make > build.log`，那些错误信息并不会进文件，屏幕上又一闪而过——你既没存下来也没看清。加上 `2>&1`，错误就和正常输出一起进管道、被 `tee` 既显示又存盘了。烧录、跑 openocd 的时候也是同一套，`openocd -f stlink.cfg 2>&1 | tee openocd.log &`，后台跑着、日志存着，随时能翻。

## 权限：串口设备为什么打不开

接下来这个坑，每个碰串口的人都撞过：你插上 USB-TTL，设备出现在 `/dev/ttyUSB0`，结果 minicom 一打开说 permission denied。我们先用 `ls -l` 看看这个设备文件长什么样：

```bash
ls -l /dev/ttyUSB0
# crw-rw---- 1 root uucp ... /dev/ttyUSB0
```

注意中间那串权限和属主属组：这个设备文件的属组是 `uucp`（在某些发行版上是 `dialout`，是同一个角色），而你的账号默认不在这个组里，所以"组用户可读写"那条权限你享受不到。把自己加进去就行：

```bash
groups                            # 先确认自己确实不在 uucp/dialout 里
sudo usermod -aG uucp $USER       # 加进组（Debian/Ubuntu 系把 uucp 换成 dialout）
```

加完之后有个容易忽略的细节：组变更**不会对当前已经登录的会话立即生效**，你得注销重新登录，或者临时 `newgrp uucp` 开个新组上下文。笔者自己机器上 `groups` 出来是 `charliechen uucp wheel docker`——能看到 `uucp` 在里面，所以串口设备我直接就能读写。

## 进程与后台：长跑的 openocd、qemu

烧录器、GDB server、QEMU 这些都是一启动就长期占着终端的程序，你不希望它们把你终端堵死。Shell 用 `&` 把命令丢到后台，用 `jobs` 和 `fg` 管理：

```bash
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg &   # 末尾 & 放后台
jobs                  # 看后台任务编号
fg                    # 把最近的后台任务拉回前台（Ctrl+C 能停）
kill %1               # 干掉 1 号后台任务
```

如果你忘了它后台跑着、又关了终端，任务会跟着没了；想让它脱离终端继续跑，得用 `nohup` 或者 `tmux`/`screen`，这些属于进阶，先知道有这回事就行。

## 设备文件与 dd：烧 SD 卡

Linux 有个哲学叫"一切皆文件"——串口是 `/dev/ttyUSB*`，SD 卡是 `/dev/sdX`，磁盘是 `/dev/nvme0n1`。给树莓派、i.MX 之类的板子烧启动卡，用的就是 `dd`，它把一个文件的内容原样写到设备上：

```bash
lsblk                                # 先看清 SD 卡到底是哪个设备，比如 /dev/sdc
sudo umount /dev/sdc*                # 系统可能已经自动挂载了，先卸载
sudo dd if=firmware.img of=/dev/sdc bs=4M status=progress conv=fsync
sync                                 # 确保数据全部落盘再拔卡
```

> ⚠️ 注意，这一步是整篇里唯一一个写错了**不可逆**的操作。`dd` 的 `of=` 指向哪个设备，它就把那个设备整个覆盖掉，没有确认、没有回收站。如果你把系统盘的 `/dev/sda` 当成了 SD 卡的 `/dev/sdc`，你收获的就是一块干净的、什么都没有的硬盘。所以烧之前一定用 `lsblk` 反复核对设备名和容量，对上了再按回车，这习惯能救你不止一次。

## 小结

我们这一篇把终端从"敲命令"升级成了"控制环境"。环境变量和 PATH 是全局设置，`export` 临时生效、写 `~/.bashrc` 永久生效，记住 `${VAR}gcc` 必须带花括号；管道和 `2>&1 | tee` 是把构建/烧录过程存盘复盘的标准动作；串口打不开八成是组权限，把自己加进 `uucp`/`dialout` 再重登录；长跑的程序用 `&` 丢后台；烧 SD 卡用 `dd`，但 `of=` 写错没有回头路。能把这几件事用顺，你后面所有的嵌入式命令行操作就不会再被环境问题卡住。

## 下一站

环境顺了，下一步是把代码版本管好——尤其是想给内核、驱动这类用邮件协作的开源项目提 patch的话，Git 还有一套跟 GitHub PR 不一样的玩法。

> 下一卷：[协作与文档 · Git 内核 / 驱动协作视角](../collaboration/git-kernel-patch)
