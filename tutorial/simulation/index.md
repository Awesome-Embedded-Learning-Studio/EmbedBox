---
title: 模拟与复现
description: Docker 钉死可复现的工具链，QEMU 让你手里没板子也能跑。
order: 7
---

# 模拟与复现

两块"使能器"：Docker 把整套交叉工具链版本钉死，换台电脑也能复现一模一样的构建；QEMU 让你在没有真硬件的情况下把程序跑起来、做原型验证。

- Docker 钉死可复现交叉工具链（规划中）—— 镜像带工具链、qemu-user-static、JTAG/USB `--device`
- QEMU 无硬件开发使能器（规划中）—— `-machine`/`-cpu`/`-nographic`、机器模型不匹配静默挂起
