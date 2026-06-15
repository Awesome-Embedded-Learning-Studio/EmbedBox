---
title: GCC 编译链接全流程
description: 从一行 gcc 到能烧进芯片的裸 .bin，分三篇拆透编译流水线、链接与库、裸机与 objcopy。
order: 1
---

# GCC 编译链接全流程

这一小串把 gcc 那个黑盒彻底拆穿——从预处理/编译/汇编/链接四阶段，到链接和库，再到交叉编译出能烧进芯片的裸 `.bin`。建议按顺序读。

- [1. 从一行 gcc 到看懂 .o 里的段](./01-compile-pipeline) —— 四阶段 + `.text/.data/.bss/.rodata`
- [2. 链接、库与 undefined reference](./02-linking) —— 符号对账、链接顺序坑、`ar` 打静态库
- [3. 裸机、链接脚本与 objcopy](./03-bare-metal) —— 交叉编译、`.data` 的 VMA/LMA、抽出 `.bin`
