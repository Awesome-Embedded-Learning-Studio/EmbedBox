---
title: "Docker：钉死可复现的工具链"
description: "用 Docker 把整套交叉工具链的版本钉死成一个镜像，换台电脑、新人入职、CI 都能复现一模一样的构建环境，再也不用'在我电脑上能编'。"
order: 2
tags:
  - host
  - docker
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "Makefile 或 CMake（构建系统卷）"
  - "交叉编译（交叉编译卷）"
---

# Docker：钉死可复现的工具链

## "在我电脑上能编"这句话，我们受够了

嵌入式项目最让人崩溃的场景之一：你电脑上编得好好的，推到 CI、或者交给新人、或者换台机器，立刻一堆 "找不到 arm-none-eabi-gcc / 版本不对 / 库缺失"。根因是工具链环境没钉死——每个人的系统、装的包版本、路径都不一样，编译产物和行为就漂移。Docker 解决的就是这个：我们把整套工具链（gcc-arm-none-eabi、openocd、make、cmake、甚至 qemu-user-static）装进一个 Docker 镜像里，镜像一旦构建好就固定了，谁拉下来用的都是一模一样的环境，"在我电脑上能编"彻底变成"在这个镜像里一定能编"。这一篇我们写一个能用的交叉工具链 Dockerfile，讲怎么用它构建、怎么把项目挂进去编译。

先说一句实话：本机没有装 Docker，所以下面 Dockerfile 是一份正确、可直接用的配方，但 `docker build`/`docker run` 的运行输出我没法在这里贴真实的——你在装了 Docker 的机器上照着跑就行，命令本身都是标准 Docker 用法。

## 一份能用的交叉工具链 Dockerfile

我们在项目根放一个 `Dockerfile`，基于 Ubuntu、装上交叉工具链和构建工具：

```dockerfile
FROM ubuntu:22.04

# 别让 apt 交互式提问卡住构建
ENV DEBIAN_FRONTEND=noninteractive

# 装交叉工具链 + 构建工具 + qemu-user-static（能在容器里跑 ARM 二进制）
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc-arm-none-eabi \
        libnewlib-arm-none-eabi \
        openocd \
        make \
        cmake \
        ninja-build \
        git \
        qemu-user-static \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 设工作目录，项目代码运行时挂进来，不打进镜像
WORKDIR /workspace

# 默认进容器开个 bash
CMD ["bash"]
```

我们逐行看为什么这么写。基础镜像选 `ubuntu:22.04` 是因为它的软件源里有打包好的 `gcc-arm-none-eabi`，一条 `apt install` 就装齐，省去自己编译工具链的麻烦。`DEBIAN_FRONTEND=noninteractive` 是必须的，不然 `apt` 装包时会弹出时区选择这类交互提示、把构建卡死。装的包里：`gcc-arm-none-eabi` 是交叉编译器、`libnewlib-arm-none-eabi` 是 newlib（C 库）、`openocd` 调试用、`make`/`cmake`/`ninja-build` 构建系统、`git` 拉依赖、`qemu-user-static` 让你能在容器里直接跑 ARM 二进制（比如测一个编译出来的程序）。最后 `rm -rf /var/lib/apt/lists/*` 清掉 apt 缓存，缩小镜像体积。`WORKDIR /workspace` 定个干活目录，项目代码我们用挂载的方式进去、不打进镜像（这样镜像和代码解耦，改代码不用重 build 镜像）。

## 构建、挂进去编译

有了 Dockerfile，我们构建镜像（这条会在项目目录跑，`-t` 给镜像起名）：

```bash
docker build -t embedbox-toolchain .
```

构建好之后，`embedbox-toolchain` 这个镜像里就装好了固定版本的工具链。我们把项目目录挂进容器、在容器里编译——`-v` 把当前目录挂到容器的 `/workspace`，`-w` 设工作目录，`--rm` 退出后自动删容器：

```bash
docker run --rm -v "$PWD":/workspace -w /workspace embedbox-toolchain make
```

这条命令做的事是：起一个 `embedbox-toolchain` 容器、把你当前的项目目录挂进去、在工作目录里跑 `make`。你拿到的就是用镜像里那套固定工具链编出来的产物——跟你同事、跟 CI 编出来的完全一致，因为大家用的是同一个镜像。想交互式进去调试（开个 shell、手动敲命令），把命令换成 `bash`：

```bash
docker run --rm -it -v "$PWD":/workspace -w /workspace embedbox-toolchain bash
```

进去之后 `arm-none-eabi-gcc --version`、`make`、`cmake` 随便用，跟你本机装了一模一样的环境。

## 两个嵌入式场景特有的接法

**在容器里跑 ARM 二进制**：我们装了 `qemu-user-static`，它能通过 binfmt_misc 把 ARM 二进制"伪装"成能直接执行的——你在容器里编出一个 ARM 程序、直接 `./app`，qemu-user-static 在背后透明地用模拟器跑它。这对单元测试特别有用：编完不烧板子、直接在容器里跑起来看输出。

**透传 USB 探针给容器**：如果你要在容器里用 openocd 连真探针调试，得把 USB 设备透传进去，加 `--device`：

```bash
docker run --rm -it --device=/dev/bus/usb \
    -v "$PWD":/workspace -w /workspace embedbox-toolchain bash
```

`--device=/dev/bus/usb` 把整个 USB 总线透传进容器，openocd 就能看见你的 ST-Link/J-Link 了。注意这通常还需要容器有访问 USB 的权限（`--privileged` 或更精细的 device cgroup 配置），生产环境别滥用 `--privileged`。

## 小结

Docker 把整套交叉工具链钉死成一个镜像，换电脑、入职、CI 拉下来用的都是同一套环境，根除"工具链漂移"。我们基于 Ubuntu 写了个 Dockerfile，`apt` 装齐 `gcc-arm-none-eabi`/newlib/openocd/make/cmake/qemu-user-static，项目代码用 `-v` 挂进去、不打进镜像。`docker build` 出镜像、`docker run -v ... make` 在容器里编译、`bash` 交互进去调试；要连真探针就 `--device` 透传 USB。配上 Docker，"在我电脑上能编"就成了"在这个镜像里一定能编"，构建环境的可复现性问题就被彻底钉死了。

## 下一站

模拟与复现这一卷（Docker + QEMU）到这就齐了。整个工具链主线——从终端、Git、Markdown，到 GCC/Make/CMake，到 GDB/串口，再到交叉编译、QEMU/Docker——到这里全部讲完。接下来你可以挑具体平台（各 `*-forge` 仓库）进入实战，那里假定你已经会了上面这一整套。

> 回到 [工具链先行](../getting-started/toolchain-first) 看全图。
