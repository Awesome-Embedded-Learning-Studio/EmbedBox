---
title: 开发环境
description: 把开发环境搭起来——WSL/Linux、终端与 Shell、VS Code。
order: 2
---

# 开发环境

在写第一行能跑的嵌入式代码之前，我们得先把工作台支起来：一套能用的 Linux 环境（Windows 用户走 WSL）、一个听话的终端、一个顺手的编辑器。这一卷就是干这个的。

- [WSL2 + Linux + VS Code 远程开发](./wsl) —— Windows 上跑真 Linux、装交叉工具链、Remote 开发
- [终端与 Shell 进阶](./terminal) —— PATH / 环境变量 / 管道重定向 / 权限 / 进程 / 设备文件（串口、dd 烧写）
- [VS Code：指向交叉编译器](./vscode) —— compilerPath 指向 arm-none-eabi-gcc、Cortex-Debug + openocd 一键调试
