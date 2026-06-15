---
title: "WSL2 + Linux + VS Code：Windows 上的嵌入式开发环境"
description: "在 Windows 11 上装好 WSL2、跑通常用 Linux 命令、装上 ARM 交叉工具链，并用 VS Code 连进去开发——嵌入式开发在 Windows 上的地基。"
order: 1
tags:
  - host
  - wsl
  - beginner
difficulty: beginner
prerequisites:
  - "前置认知：工具链先行"
---

# WSL2 + Linux + VS Code：Windows 上的嵌入式开发环境

## 为什么我们非得在 Windows 上装一套 Linux

我们先承认一个现实：嵌入式开发的工具链，几乎全是 Linux 原生的。`arm-none-eabi-gcc`、`openocd`、`make`、各种构建脚本，在 Linux 上装一条命令的事，在 Windows 上原生跑能把你折腾到怀疑人生——要么找人家打包好的 Windows 版、要么踩一堆路径和换行符的坑。可我们很多人主力机就是 Windows，总不能为了搞嵌入式再买台 Linux 机器或者天天切双系统。

WSL2 就是来解决这个矛盾的。它在你 Windows 里跑一个**真正的 Linux 内核**（不是模拟、不是虚拟机里那套精简版），性能接近原生，文件系统和 Windows 还能互通。对嵌入式来说，这意味着你能在 Windows 上用熟悉的 VS Code，背后却是一套货真价实的 Linux 工具链在干活。这一篇我们就把这套环境从零搭起来，并且把 ARM 交叉工具链也一起装上——它后面所有的章节都站在这个地基上。

环境先说清楚：Windows 11、WSL2、默认装 Ubuntu。这一篇是搭环境性质，里面大部分命令得你在自己机器上跑（我在哪一步实测过、输出长什么样，会标出来），不像 GCC 那种"敲一下看结果"的技术篇能全程贴真实输出——这点我们先达成共识。

## 从 0 开始：一条命令装好 WSL2

我们以管理员身份打开 PowerShell——右键开始菜单，选 `Windows Terminal (Admin)` 或 `PowerShell (Admin)`——然后敲这一条：

```powershell
wsl --install
```

这一条命令会自动启用需要的 Windows 功能、装好 WSL2，并且默认给你装一个 Ubuntu。跑完它会提示你重启，重启之后第一次打开 Ubuntu，会让你创建一个 Linux 的用户名和密码，这个就是你在 WSL 里干活用的账号。如果你已经是最新版 Windows 11，`wsl --install` 基本是一步到位，没什么坑。

装好之后，我们用这几条命令管理发行版（都在 PowerShell 里跑）。`wsl -l -v` 列出你装了哪些发行版、各自是 WSL 几；如果你装了不止一个、想把某个设成默认，用 `wsl --set-default <名字>`；如果某个老发行版还是 WSL1、想升到 WSL2，用 `wsl --set-version <名字> 2`：

```powershell
wsl -l -v
wsl --set-default Ubuntu-22.04
wsl --set-version Ubuntu-22.04 2
```

> ⚠️ 注意那个 `<DistributionName>` 是占位符，你得换成 `wsl -l -v` 里实际显示的名字（比如 `Ubuntu-22.04`）。照抄尖括号进去，PowerShell 一定给你报错。

## 上号：第一次进 Linux

我们在开始菜单打开刚装好的 Ubuntu 应用，第一次进去先做一件正经事——更新软件包索引、把已装的包升到最新。Linux 发行版的软件都从软件源拉，`apt update` 是刷新索引、`apt upgrade` 是真升级，两步连着跑：

```bash
sudo apt update && sudo apt upgrade -y
```

接下来熟悉几个你会用到老的命令。别死记，敲两遍手感就有了：`pwd` 看当前在哪个目录、`ls -la` 列出文件（含隐藏的）、`cd ~` 回家目录、`mkdir` 建文件夹、`touch` 建空文件、`nano` 是个新手友好的终端编辑器、`cat` 打印文件内容。

```bash
pwd            # 显示当前目录
ls -la         # 列出当前目录文件（含隐藏）
cd ~           # 回到家目录
mkdir myproj   # 新建文件夹
cd myproj
touch hello.c  # 新建文件
nano hello.c   # 用 nano 打开编辑
cat hello.c    # 显示文件内容
```

再把几个通用工具装上——`build-essential` 里带的是 host 上的 gcc 和 make，`git` 是版本控制，`python3` 写脚本用得着：

```bash
sudo apt install git build-essential python3 python3-pip -y
```

这里有个坑我们必须提前讲，不然你后面会莫名其妙地慢。Windows 的 `C:` 盘在 WSL 里挂在 `/mnt/c`，比如 `C:\Users\你` 对应 `/mnt/c/Users/你`，两边能互通。**但请把你的代码放在 WSL 的家目录 `~` 下，不要放在 `/mnt/c` 下**。原因是 WSL2 的 Linux 文件系统和 Windows 的 NTFS 是两套，跨文件系统读写（在 Linux 里操作 `/mnt/c`）会慢很多；代码放 `~` 下，就是纯 Linux 文件系统操作，飞快。这一点真的会救你大量时间。

## 装上嵌入式的命根子：ARM 交叉工具链

刚才那个 `build-essential` 给你的 gcc，是 host 上的——编出来在你这台 x86 电脑上跑。可我们要的嵌入式目标板是 ARM 架构，程序得在板子上跑，这就得用**交叉工具链**：在 host 上编译、产出给 ARM 板子执行的代码。我们把它装上：

```bash
sudo apt install gcc-arm-none-eabi openocd -y
```

`gcc-arm-none-eabi` 是 ARM 裸机交叉编译器（"none-eabi"表示没操作系统、按 ARM EABI 规约），`openocd` 是连调试探针、当 GDB server 用的那个（GDB 那一卷会用到）。装完我们验证一下，关键看那个前缀——交叉工具链的命令全都带 `arm-none-eabi-` 前缀，跟普通 `gcc` 是两套不同的东西：

```bash
arm-none-eabi-gcc --version
```

它会打印一串版本信息，你只要确认前缀确实是 `arm-none-eabi-`、而不是裸 `gcc`，就说明交叉编译器装对了。接下来做一个后面 Makefile、CMake 都会用的约定——把这个前缀导出成一个环境变量 `CROSS_COMPILE`：

```bash
export CROSS_COMPILE=arm-none-eabi-
${CROSS_COMPILE}gcc --version
```

设完之后，`${CROSS_COMPILE}gcc` 在当前终端里就等价于 `arm-none-eabi-gcc`。这里我们必须强调那个花括号：**必须写成 `${CROSS_COMPILE}gcc`，不能写成 `$CROSS_COMPILEgcc`**。后者 Shell 会把 `CROSS_COMPILEgcc` 整体当成一个变量名去查、查不到就是空，于是你执行的其实是裸 `gcc`——编出来的东西在你电脑上能跑、烧到板子上全不对，而且这个错极难查，因为命令"看起来"是对的。

> ⚠️ 注意，`export` 只对当前这个终端有效，你关了再开就没了。想让它每次开终端自动就位，把这行追加到 `~/.bashrc`——这个文件每次启动交互式 Shell 都会执行一遍：
>
> ```bash
> echo 'export CROSS_COMPILE=arm-none-eabi-' >> ~/.bashrc
> ```

最后我们跑通一个最小闭环，证明这套工具链真能产出 ARM 代码。我们写个占位的 `hello.c`，**只编译、不链接**（这样不需要链接脚本，先验证工具链本身），再用 `objcopy` 把目标文件抽成纯二进制 `.bin`——这就是后面要烧进芯片的镜像形态：

```bash
cat > hello.c <<'EOF'
int main(void) { return 0; }   // 占位：只验证工具链能产出 ARM 目标文件
EOF
arm-none-eabi-gcc -c hello.c -o hello.o            # 交叉编译，产出 ARM 目标文件
arm-none-eabi-objcopy -O binary hello.o hello.bin  # 抽出纯二进制（要烧进芯片的镜像）
file hello.bin                                      # 确认产物
```

`file hello.bin` 应该告诉你它是 `data`（纯二进制），说明工具链跑通了。这一步我们其实只证明了"工具链能编出 ARM 的东西"，真正的启动代码——`Reset_Handler`、链接脚本、`.data` 怎么从 Flash 搬到 RAM——这些在 GCC 那一卷的裸机篇会展开，这里先把工具链立起来就够了。

## 把 VS Code 连进 WSL

环境有了，我们再把顺手的编辑器接上。在 Windows 上装好 [VS Code](https://code.visualstudio.com/)，然后装一个叫 **[Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)** 的扩展。装完之后，我们在 WSL 终端里进到项目目录，敲一个 `code .`：

```bash
cd ~/myproj
code .
```

这一步的妙处在于：VS Code 窗口还是在 Windows 上弹出来，但它会以"连接到 WSL"的方式运行——你的编辑器、集成终端、调试器背后全是那套 WSL 里的 Linux 工具，`arm-none-eabi-gcc`、`make` 全都能直接用，不用你在 Windows 和 Linux 之间来回复制文件。体验几乎等同于原生 Linux 开发，但编辑器是你熟悉的 VS Code。

## 顺带：远程 SSH 连开发板或服务器

将来你大概率要连一台远程的 Linux——家里的树莓派、公司的服务器、一块搁在网口的开发板。这时候轮到 **[Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)** 扩展上场，它的玩法跟 Remote-WSL 几乎一样，只是另一头是 SSH 过去的远程机器。我们先在本机生成一对 SSH 密钥（PowerShell 或 WSL 里都行）：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

一路回车用默认路径，它会生成 `~/.ssh/id_ed25519`（私钥，自己留着）和 `id_ed25519.pub`（公钥，要放到远程机器上）。把公钥内容追加到远程机器的 `~/.ssh/authorized_keys` 里——最省事的是 `ssh-copy-id`：

```bash
ssh-copy-id user@remote-host
```

搞完之后，在 VS Code 的 Remote-SSH 面板里连上那台主机，之后编辑、运行、调试远程文件就跟本地一样了。

## 我们踩过的坑，你提前绕开

`wsl --install` 报错或失败，先确认你用的是 Windows 11、而且是管理员身份运行的 PowerShell；实在不行，手动去"启用或关闭 Windows 功能"里勾上"虚拟机平台"和"适用于 Linux 的 Windows 子系统"。`code` 命令提示找不到，在 VS Code 里按 `Ctrl+Shift+P`、搜 `Shell Command: Install 'code' command in PATH` 跑一下；通常装了 Remote-WSL 扩展后这步会自动处理好。文件读写慢，回到那个老问题——代码别放 `/mnt/c`，放 `~` 下。`arm-none-eabi-gcc` 找不到命令，说明工具链没装好或没进 PATH，回去重跑那条 `apt install`。Remote-SSH 连不上，检查公钥是不是真追加到了远程的 `authorized_keys`、以及远程 `~/.ssh` 权限是不是 `700`、`authorized_keys` 是不是 `600`——SSH 对权限极其敏感，权限太松它直接拒你。

## 小结

我们在 Windows 上用 WSL2 起了一套真 Linux，装好了通用工具和 ARM 交叉工具链，并用 VS Code 的 Remote-WSL 把编辑器连了进去。几件必须记住的事：`wsl --install` 一步装好、代码放 `~` 而不是 `/mnt/c`、交叉工具链命令带 `arm-none-eabi-` 前缀、`CROSS_COMPILE` 导出成变量时记得带花括号、`file hello.bin` 是 `data` 就说明工具链通了。环境立起来之后，我们就有了后面所有命令行操作的落脚点。

## 下一站

环境有了，但我们还在用 `cd`/`ls` 这种最基础的命令。接下来把终端升级成真正能控制环境的工具——PATH、管道、权限、烧写，这些是嵌入式命令行的内功。

> 下一卷：[终端与 Shell 进阶：嵌入式开发的那只手](./terminal)
