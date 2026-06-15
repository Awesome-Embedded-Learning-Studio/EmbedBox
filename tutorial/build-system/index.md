---
title: 构建系统
description: 把源码变成能烧进芯片的镜像——GCC 编译链接、Makefile、CMake。
order: 4
---

# 构建系统

源码不会自己变成芯片能吃的二进制。这一卷我们从最底层的 **GCC 编译/汇编/链接** 讲起，一路到 **Makefile** 自动化、**CMake** 跨工具链，把"按一下 build 就出固件"这个黑盒彻底拆穿。

建议按顺序读——后面讲的都建立在前面"段、链接、交叉编译"的理解上。

## GCC 编译链接全流程

从一行 `gcc` 开始，走到交叉编译出裸 `.bin`，分三篇：

- [1. 从一行 gcc 到看懂 .o 里的段](./gcc/01-compile-pipeline) —— 预处理/编译/汇编/链接四步 + `.text/.data/.bss/.rodata`
- [2. 链接、库与 undefined reference](./gcc/02-linking) —— 符号对账、链接顺序坑、`ar` 打静态库
- [3. 裸机、链接脚本与 objcopy](./gcc/03-bare-metal) —— 交叉编译、`.data` 的 VMA/LMA、抽出能烧的 `.bin`

## 构建自动化

- [Makefile：把编译流程自动化](./make) —— 变量、自动变量、模式规则、`.PHONY`、增量编译、一键 flash
- [CMake：概念 + 工具链文件](./cmake) —— out-of-source、目标与依赖、`CMAKE_TOOLCHAIN_FILE` 交叉编译
