---
title: "VS Code：指向交叉编译器"
description: "把 VS Code 的 C/C++ 扩展指向 arm-none-eabi-gcc，让 IntelliSense 不报红；再用 Cortex-Debug 配 openocd 做一键调试。"
order: 3
tags:
  - host
  - vscode
  - arm-none-eabi
  - intermediate
difficulty: intermediate
prerequisites:
  - "终端与 Shell 进阶"
  - "GCC 编译-汇编-链接全流程（构建系统卷）"
---

# VS Code：指向交叉编译器

## 为什么默认配置在嵌入式上全是红的

我们装好 VS Code 和它的 C/C++ 扩展，打开一个嵌入式项目，大概率看到满屏红色波浪线——头文件找不到、类型不认识、宏没定义。原因很简单：扩展默认用的是你电脑上的 host gcc 和它的 include 路径，可你的项目是给 ARM 编的，include 的是 newlib 和芯片头文件（`stm32f4xx.h` 这种），扩展上哪找去。这一篇我们就是把 VS Code 调教成"知道这是个 ARM 嵌入式项目"——让它用交叉编译器、找对头文件路径、带上芯片的宏定义，最后接上 Cortex-Debug 实现 openocd 一键调试。

环境说明一下：VS Code 的 C/C++ 扩展（`ms-vscode.cpptools`）负责 IntelliSense，Cortex-Debug 扩展（`marus25.cortex-debug`）负责硬件调试。两个都是 VS Code 扩展，在扩展市场搜名字装就行。交叉编译器我们用的是 `arm-none-eabi-gcc`（前面装过）。

## 第一步：告诉 IntelliSense 用交叉编译器

C/C++ 扩展的配置放在项目 `.vscode/c_cpp_properties.json` 里。我们新建这个文件，最关键的一行是 `compilerPath`——把它指向交叉编译器：

```json
{
  "version": 4,
  "configurations": [
    {
      "name": "ARM",
      "compilerPath": "/usr/bin/arm-none-eabi-gcc",
      "compilerArgs": [
        "-mcpu=cortex-m4",
        "-mthumb",
        "-mfloat-abi=hard",
        "-mfpu=fpv4-sp-d16"
      ],
      "intelliSenseMode": "gcc-arm",
      "cStandard": "c11",
      "defines": [
        "STM32F407xx",
        "USE_HAL_DRIVER"
      ],
      "includePath": [
        "${workspaceFolder}/**",
        "${workspaceFolder}/Drivers/CMSIS/Device/ST/STM32F4xx/Include",
        "${workspaceFolder}/Drivers/STM32F4xx_HAL_Driver/Inc"
      ]
    }
  ]
}
```

我们逐项说清楚为什么这么写。`compilerPath` 是这套配置的灵魂——扩展会去问这个编译器"你的内置 include 路径在哪"，从而自动找到 newlib 的头文件（`stdio.h`、`stdint.h` 那些），而不是傻乎乎地去 host gcc 的路径找。`compilerArgs` 里塞的就是你编译时那堆目标芯片 flag（`-mcpu`/`-mthumb`/`-mfloat-abi`），让 IntelliSense 和真实编译用同一套 ABI 参数，分析才准。`intelliSenseMode: gcc-arm` 告诉它这是 ARM gcc 的语法。`defines` 里的宏就是平时编译命令 `-D` 后面那些——芯片型号 `STM32F407xx`、HAL 的开关 `USE_HAL_DRIVER`，这两个一加，条件编译里那些 `#ifdef STM32F407xx` 包着的代码才不会被扩展当成死代码标灰。`includePath` 补上项目自己那些头文件目录（CMSIS、HAL 驱动的 Include），`${workspaceFolder}/**` 表示项目根往下递归。

> ⚠️ 注意，`compilerPath` 一定填交叉编译器的**绝对路径**（用 `which arm-none-eabi-gcc` 查到，比如 `/usr/bin/arm-none-eabi-gcc`）。填成 `gcc` 或者 host 的路径，IntelliSense 就又回退到找 host 头文件的老路了，红波浪线照样满天飞。

配完存盘，红色波浪线应该大面积消退，芯片头文件里的寄存器定义也能正确跳转了。

## 第二步：一键编译的 tasks.json

我们顺手配个任务，按 `Ctrl+Shift+B` 就能编译，不用每次切终端敲。`.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "make",
      "args": ["-j8"],
      "group": { "kind": "build", "isDefault": true },
      "problemMatcher": ["$gcc"]
    }
  ]
}
```

`command` 按你项目实际来——用 Makefile 就 `make`、用 CMake 就 `cmake --build build`。`problemMatcher: $gcc` 让 VS Code 解析 gcc 的报错格式，编译错了能直接在"问题"面板点跳转到对应行。

## 第三步：Cortex-Debug 连 openocd 做硬件调试

最值钱的一步——按 F5 就能断点单步调试板子上的代码，靠的是 Cortex-Debug 扩展 + openocd。我们在 `.vscode/launch.json` 配一个调试配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug (openocd)",
      "type": "cortex-debug",
      "request": "launch",
      "servertype": "openocd",
      "cwd": "${workspaceFolder}",
      "executable": "${workspaceFolder}/build/app.elf",
      "configFiles": [
        "interface/stlink.cfg",
        "target/stm32f4x.cfg"
      ],
      "svdFile": "${workspaceFolder}/STM32F407.svd",
      "rtos": "FreeRTOS",
      "showDevDebugOutput": "raw"
    }
  ]
}
```

这套配置背后发生的事：按 F5，Cortex-Debug 在后台拉起 openocd（用 `configFiles` 里那两个配置文件连 ST-Link 探针、初始化目标芯片），再拉起 `arm-none-eabi-gdb` 连到 openocd 的 GDB 端口、加载 `executable` 指的那个 `.elf`，然后把控制权交给你——你在 VS Code 里下断点、单步、看变量，底层就是 GDB + openocd 在干活（GDB 那一篇讲过的那套）。几个字段说下：`executable` 必须是**带调试信息（`-g` 编的）的 ELF**，不能是 `.bin`，因为调试要看符号；`configFiles` 是 openocd 的探针+目标配置，按你的探针和芯片换；`svdFile` 是芯片的寄存器描述文件（从芯片厂商下），有了它 Cortex-Debug 能让你直接按名字看外设寄存器，调试外设时极其方便；`rtos` 如果你的固件跑 FreeRTOS 之类，填上它能让调试器正确显示各任务的栈。

> ⚠️ 注意，调试前确认两件事：一是 `.elf` 确实是 `-g` 编的（没调试信息，断点根本下不上）；二是 openocd 能连上探针（终端里先手动跑一次 `openocd -f interface/stlink.cfg -f target/stm32f4x.cfg`，看到 `target halted` 就是通了，不通多半是探针没插或串口/USB 权限没给——参考终端那一卷的 dialout/uucp 组）。

## 小结

VS Code 在嵌入式上满屏红，根因是它默认用 host gcc 找头文件。我们用 `c_cpp_properties.json` 把 `compilerPath` 指向 `arm-none-eabi-gcc`、带上 `-mcpu/-mfloat-abi` 和芯片宏、补上项目 include 路径，IntelliSense 就对了。`tasks.json` 配 `Ctrl+Shift+B` 一键编译。`launch.json` 配 Cortex-Debug + openocd，F5 就能断点调试板子，记得 `.elf` 要带 `-g`、openocd 要先能连上探针。配好这套，VS Code 就从"满屏红"变成顺手的嵌入式 IDE。

## 下一站

开发环境这一卷到这里齐了——WSL、终端、VS Code。接下来进入把代码变成固件、再调试、再上板的那条主线。

> 下一卷：[协作与文档 · Git 内核 / 驱动协作视角](../collaboration/git-kernel-patch)
