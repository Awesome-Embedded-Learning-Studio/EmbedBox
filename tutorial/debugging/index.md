---
title: 调试
description: GDB 调试与串口观测——固件跑飞时的定位手段。
order: 5
---

# 调试

固件跑飞、行为异常，靠 `printf` 不够用。这一卷讲 GDB（从 host 段错误一路到连硬件探针的远程调试）和串口（嵌入式世界里几乎唯一的输出观测手段）。

- [GDB：从段错误到远程调试](./gdb) —— 断点/单步/backtrace、core dump、`target remote` + openocd、硬件断点、`-O2` 变量消失
- [串口：嵌入式的 stdout](./serial) —— 波特率/8N1/电平、QEMU 无硬件验证、USB-TTL + minicom 物理 bring-up
