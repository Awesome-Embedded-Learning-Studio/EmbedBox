---
title: "Git：内核 / 驱动协作视角"
description: "通用 Git 基础之外，嵌入式/内核社区特有的协作方式：用 submodule 管第三方依赖、用 format-patch + 邮件提交 patch、Signed-off-by 署名规范。"
order: 2
tags:
  - host
  - git
  - intermediate
difficulty: intermediate
prerequisites:
  - "Git 团队协作完全入门指南（本卷）"
---

# Git：内核 / 驱动协作视角

## 这一篇跟通用 Git 教程的区别在哪

通用的 clone、commit、branch、merge、发 PR，我们在 [Git 完全指南](./git/) 里讲过了，这一篇完全不重复那些。我们要讲的是嵌入式和内核社区里另一套、跟 GitHub PR 完全不一样的协作方式，而且这套不是冷知识——Linux 内核、U-Boot、Zephyr、各家芯片厂的 HAL 包，真实用的就是它。具体来说有三件事：用 submodule 管理第三方依赖、用邮件提交 patch、用 `Signed-off-by` 做贡献声明。

## submodule：把第三方依赖挂进你的项目

一份嵌入式 BSP 里，常常同时挂着好几个第三方的仓库——HAL、CMSIS、littleFS、TinyUSB 之类的。逐个手动 clone 进来、再各自 checkout 到某个版本，既乱又没法追踪。Git 的 submodule 就是干这个的：它把另一个仓库"挂"到你仓库的某个子目录里，并且**把你挂的那个时刻、那个子仓库的具体 commit 记录下来**，这样谁 clone 你的项目，都能拿到一模一样的依赖版本。

我们真正操作一遍。先在一个项目里挂一个子模块：

```bash
git submodule add https://github.com/littlefs-project/littlefs.git lib/littlefs
git commit -m "add littlefs submodule"
```

这条命令做了两件事：在 `lib/littlefs` 拉下那个子仓库，并生成一个 `.gitmodules` 文件记录这层关系：

```ini
[submodule "lib/littlefs"]
	path = lib/littlefs
	url = https://github.com/littlefs-project/littlefs.git
```

接下来是一个几乎人人踩的坑。我们模拟"别人 clone 了你的项目"，会发现子模块目录是空的：

```bash
git clone https://github.com/you/your-bsp.git
cd your-bsp
ls lib/littlefs        # 空！
```

原因很直白：Git clone 默认**不会**把 submodule 一并拉下来，主仓库里只存了子模块的"指针"（那个 commit 号），没有内容。补拉的办法是一条命令：

```bash
git submodule update --init --recursive
```

我们实跑这步，输出是这样的：

```text
Submodule path 'lib/littlefs': checked out '5e6c4d71448cde52b65edf511f369f572814b80c'
```

拉完 `lib/littlefs` 里就有内容了。所以记住这个组合拳：clone 别人带 submodule 的项目，要么一开始就 `git clone --recursive`，要么事后 `git submodule update --init --recursive`，否则你面对的就是一堆空目录。

## format-patch：把你的 commit 变成一封 patch 邮件

内核社区不用 PR，它用邮件。你改完代码、提交之后，要把这个 commit 转成一个特定格式的文件——长得像邮件的 patch——然后邮寄到邮件列表，由维护者审完合入。生成这个文件的工具就是 `git format-patch`：

```bash
git format-patch -1 HEAD          # 把最近 1 个 commit 变成 patch
```

我们真跑一遍，它生成一个文件 `0001-xxx.patch`，打开看头部是这样：

```text
From d07206656e2f50bde2e32bdfa8b37d2e5a258cab Mon Sep 17 00:00:00 2001
From: tester <t@t.t>
Date: Mon, 15 Jun 2026 09:34:34 +0800
Subject: [PATCH] driver: add blink function

Signed-off-by: tester <t@t.t>
---
```

你看它自带 `From:`、`Subject: [PATCH]`、还有邮件正文用的 `---` 分隔，本质就是把一个 commit 包装成了一封能直接邮寄的邮件。`-1 HEAD` 是只取最近一个 commit，`origin/main` 这种参数会把你领先上游的所有 commit 都变成一串带编号的 patch（`0001-`、`0002-`……）。

寄出去用 `git send-email`（要配 SMTP，这里不展开），收到 patch 的人——或者你在另一台机器上——用 `git am` 把它应用回来，它会保留原作者、原 message、原署名，变成一个完整的 commit：

```bash
git am < 0001-driver-add-blink-function.patch
```

```text
Applying: driver: add blink function
```

`git am` 这个"应用 patch"的动作，是邮件协作能追溯贡献的根基——它不是手动 copy 代码，而是把带着作者信息的 commit 完整地接进来。

## Signed-off-by：内核的 DCO 规范

上面 patch 头部那行 `Signed-off-by: tester <t@t.t>` 不是装饰。内核社区要求每个被合入的 commit 都带这么一行，它的法律含义是 DCO（Developer Certificate of Origin）——你声明"这段代码我有权提交"。加它的最省事办法是提交时多敲一个 `-s`：

```bash
git commit -s -m "driver: add blink function"
git format-patch -s -1 HEAD
```

`commit -s` 会自动用你的 `user.name` 和 `user.email` 追加 `Signed-off-by` 那一行。

## 把构建变量也纳入版本视角

内核和驱动源码树的构建是认 `ARCH` 和 `CROSS_COMPILE` 这两个环境变量的（我们在[终端那一卷](../environment/terminal)讲过怎么设），所以一个真实的"给内核驱动提 patch"工作流是长这样的：开个特性分支、改代码、用交叉工具链编一遍、`commit -s`、`format-patch`、`send-email` 寄出去。把前面几卷学的串起来，你就能看懂内核邮件列表里那些 `[PATCH]` 邮件到底是怎么产生、又怎么被合进主线的了。

## 小结

这一篇我们补上了通用 Git 教程不讲、但嵌入式/内核社区天天在用的那一套。submodule 用 `git submodule add` 挂依赖、用 `clone --recursive` 或 `update --init --recursive` 补拉，忘了补拉就是空目录；邮件协作用 `format-patch` 把 commit 变成 patch、用 `git am` 把 patch 变回 commit，`commit -s` 给每个 commit 加上 `Signed-off-by` 这行 DCO 声明。能把这些跟之前 PR 那套对应起来，你就具备了给内核和驱动开源项目提贡献的基本能力。

## 下一站

代码版本会管了，接下来进入正题——源码怎么变成能烧进芯片的镜像，从 GCC 编译链接开始。

> 下一卷：[构建系统 · 从一行 gcc 到看懂 .o 里的段](../build-system/gcc/01-compile-pipeline)
