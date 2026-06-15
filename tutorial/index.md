---
layout: home
title: EmbedBox
titleTemplate: 嵌入式开发通用工具链教程

hero:
  name: EmbedBox
  text: 嵌入式通用工具链教程
  tagline: 不管走哪条嵌入式航线，都要先会用的工具——终端 / Git / Markdown / GCC / Make / CMake / GDB / 交叉编译 / 串口 / Docker / QEMU。
  actions:
    - theme: brand
      text: 开始阅读
      link: /getting-started/toolchain-first
    - theme: alt
      text: Git 完全指南
      link: /collaboration/git/

features:
  - title: 前置认知
    details: 为什么先学工具、再碰芯片——工具链全景图与同组织各仓库的分工。
    link: /getting-started/
  - title: 开发环境
    details: WSL2 / Linux / 终端与 Shell 进阶（PATH、管道、权限、烧写）/ VS Code。
    link: /environment/
  - title: 协作与文档
    details: Git 团队协作 + 内核 patch 邮件视角、Markdown 写 README / Kconfig / 设备树。
    link: /collaboration/
  - title: 构建系统
    details: GCC 编译链接全流程到 objcopy 裸 .bin、Makefile、CMake 工具链文件。
    link: /build-system/
  - title: 调试
    details: GDB 从段错误到远程调试（target remote / openocd）、串口即嵌入式 stdout。
    link: /debugging/
  - title: 交叉编译与复现
    details: 两前缀与硬浮点 ABI、Docker 钉死工具链、QEMU 无硬件开发、硬件工具速查。
    link: /cross-compile/

---

> EmbedBox 是 [Awesome-Embedded-Learning-Studio](https://github.com/Awesome-Embedded-Learning-Studio) 的通用工具教程仓库：只负责把工具教透，不替中心站做导航。
