---
title: 交叉编译
description: 在我电脑上编译、在板子上运行——嵌入式的定义动作。
order: 6
---

# 交叉编译

交叉编译是嵌入式的定义动作：host 上编译、产出给 target 跑。这一卷讲透两个前缀（`arm-none-eabi-` 裸机 vs `arm-linux-gnueabihf-` Linux）、newlib 对 glibc、硬浮点 ABI 的坑。

> 🚧 规划中。前置：[GCC 裸机与 objcopy](../build-system/gcc/03-bare-metal)、[CMake 工具链文件](../build-system/cmake)。
