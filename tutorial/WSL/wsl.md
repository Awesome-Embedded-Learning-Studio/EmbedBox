# WSL2（Windows 11） + Linux + VS Code 远程开发 入门教程

> 本文面向对软件不熟、只会一点 PowerShell 的嵌入式硬件朋友。目标是：在 Windows 11 上安装并使用 WSL2，掌握常用 Linux 命令，并用 VS Code 做本地（WSL）和远程（SSH）开发。

## 一、为什么要学 WSL？

WSL（Windows Subsystem for Linux）让你在 Windows 里运行真正的 Linux。对嵌入式开发、脚本、构建工具和很多开源工具来说，Linux 环境更为友好。WSL2 更接近真实的 Linux 内核，性能更好，推荐在 Windows 11 上使用 WSL2。

## 二、准备工作（你需要做的事）

- Windows 11（推荐最新版）。
- 拥有管理员权限的用户账号（安装时需要管理员身份运行 PowerShell）。
- 稳定的网络（安装过程中需要下载文件）。

## 三、一步到位的安装（最简单、推荐）

1. 以管理员身份打开 PowerShell（右键“开始”→`Windows Terminal (Admin)` 或 `PowerShell (Admin)`）。
2. 在管理员 PowerShell 里输入：

```powershell
wsl --install
```

这条命令会自动启用所需 Windows 功能、安装 WSL2（默认会安装 Ubuntu），并提示重启。重启后，首次启动 Ubuntu 时会要求你创建 Linux 的用户名和密码。

> 如果你使用的是最新版 Windows 11，`wsl --install` 通常是最简单的方式。

## 四、检查与常用管理命令

- 列出已安装的 Linux 发行版并查看版本（在 PowerShell 或 Windows Terminal）：

```powershell
wsl -l -v
```

- 如果需要把某个发行版设置为默认（例如 `Ubuntu-22.04`）：

```powershell
wsl --set-default <DistributionName>
```

> `<DistributionName>` 要替换成 `wsl -l -v` 实际显示的发行版名（如 `Ubuntu-22.04`），照抄尖括号会报错。

- 将现有发行版切换到 WSL2（如果不是）：

```powershell
wsl --set-version <DistributionName> 2
```

## 五、第一次进入 Linux（在 Ubuntu 终端里做）

1. 在开始菜单打开刚安装的 `Ubuntu` 应用。
2. 登录后建议先更新系统包索引并升级：

```bash
sudo apt update && sudo apt upgrade -y
```

3. 常用基础命令（直接复制到终端）：

```bash
pwd            # 显示当前目录
ls -la         # 列出当前目录文件（含隐藏）
cd ~           # 回到家目录
mkdir myproj   # 新建文件夹
cd myproj
touch hello.c  # 新建文件
nano hello.c   # 用一个简单编辑器打开文件（不熟可以用 nano）
cat hello.c    # 显示文件内容
```

4. 安装常用工具（示例：git、编译工具、python）：

```bash
sudo apt install git build-essential python3 python3-pip -y
```

> 小提示：Windows 的 `C:` 驱动器在 WSL 里路径是 `/mnt/c`，例如 `C:\Users\你` 在 WSL 为 `/mnt/c/Users/你`。为了更好性能，建议把代码放在 WSL 的家目录（`~`）里。

## 六、为嵌入式装一套交叉工具链（arm-none-eabi）

前面装的 `build-essential` 给你的是 **host（你电脑，x86）** 上的 gcc，编出来的程序只能在本机跑。嵌入式目标板（Cortex-M 之类）是 ARM 架构，要在板子上运行就得用**交叉工具链**——在你电脑上编译、产出给目标板跑的代码。这一节把这套工具链装上，并跑通“交叉编译 → 产出可烧录的 `.bin`”的最小闭环（后面的 GCC/Make/CMake 章节都建立在它上面）。

1. 安装 ARM 裸机交叉工具链 + 调试服务 openocd：

```bash
sudo apt install gcc-arm-none-eabi openocd -y
```

2. 验证装好了——注意前缀 `arm-none-eabi-`，它和普通 `gcc` 是两套不同的编译器：

```bash
arm-none-eabi-gcc --version
```

3. 把交叉编译前缀导出成环境变量，以后写 Makefile/CMake 时直接用 `${CROSS_COMPILE}` 拼接命令：

```bash
export CROSS_COMPILE=arm-none-eabi-
# 验证：${CROSS_COMPILE}gcc 展开后等价于 arm-none-eabi-gcc
# 注意必须用花括号 ${CROSS_COMPILE}gcc，写成 $CROSS_COMPILEgcc 会被当成另一个变量
${CROSS_COMPILE}gcc --version
```

> 小提示：`export` 只在当前终端生效。想每次打开终端都自动生效，把这行追加到 `~/.bashrc`：`echo 'export CROSS_COMPILE=arm-none-eabi-' >> ~/.bashrc`。

4. 跑通最小闭环——只编译、不链接（不需要链接脚本），再抽出纯二进制 `.bin`：

```bash
cat > hello.c <<'EOF'
int main(void) { return 0; }   // 占位：这里只验证工具链能产出 ARM 目标文件
EOF
arm-none-eabi-gcc -c hello.c -o hello.o            # 交叉编译，产出 ARM 目标文件
arm-none-eabi-objcopy -O binary hello.o hello.bin  # 从目标文件抽出纯二进制（要烧进芯片的镜像）
file hello.bin                                      # 确认产物：应显示 data / 二进制
```

到这里你就具备了“装交叉工具链 → 交叉编译 → 产出 `.bin`”的最小能力。真正的启动代码（`Reset_Handler`、链接脚本、`.data`/`.bss` 初始化）会在后续 GCC 章节展开——本节先把工具链跑通。

## 七、用 VS Code 在 WSL 里开发（推荐）

1. 在 Windows 上安装 VS Code（从[官网](https://code.visualstudio.com/)下载安装程序）。
2. 在 VS Code 中安装扩展：**[Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)**。
3. 在 WSL 终端进入项目目录并执行：

```bash
cd ~/myproj
code .
```

- `code .` 会在 Windows 的 VS Code 中打开该目录，但 VS Code 会以“连接到 WSL”的方式运行扩展与终端。此时你的编辑器、终端和调试都在 Linux 环境下工作（工具依赖都安装在 WSL）。

优点：几乎不用配置，体验接近原生 Linux。

## 八、用 VS Code 远程 SSH（当你要连接远程开发板或服务器时）

当你未来需要连到学校/公司/家中的远程 Linux（比如树莓派、开发板、远程服务器），可以使用 VS Code 的 **[Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)** 扩展。基本步骤：

1. 在 Windows 上安装 VS Code 并安装 `Remote - SSH` 扩展。
2. 生成 SSH 密钥（在 Windows 的 PowerShell 或 WSL 都可以）：

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
# 回车使用默认路径（会生成 ~/.ssh/id_ed25519 和 id_ed25519.pub）
```

3. 把**公钥**内容（`~/.ssh/id_ed25519.pub`）复制到远程主机的 `~/.ssh/authorized_keys`（远程主机需要能 SSH 登录）。可以用 `ssh-copy-id`（在 WSL 下可用）或手动拷贝：

```bash
# 在 WSL 下：
ssh-copy-id user@remote-host
# 或者手动复制公钥内容到远端 ~/.ssh/authorized_keys
```

4. 在 VS Code 的 Remote-SSH 面板中配置主机（或者直接通过扩展的命令 `Remote-SSH: Connect to Host...`），连接成功后即可像本地一样编辑、运行和调试远程文件。

## 九、常见问题与快速排查

- **`wsl --install` 报错或失败**：确认你用的是 Windows 11，且以管理员权限运行 PowerShell。必要时手动启用 Windows 功能（Virtual Machine Platform、Windows Subsystem for Linux）。
- **VS Code Remote-SSH 连接失败**：检查公钥是否已经追加到远程 `~/.ssh/authorized_keys`，并且远程 `~/.ssh` 权限为 `700`，`authorized_keys` 权限为 `600`。
- **文件读写/性能慢**：**这个很重要：把代码放在 WSL 的家目录（`~`）而不是 `C:` 驱动器下**。WSL2 在文件系统交互上会比直接访问 `C:` 快很多。
- **找不到 `code` 命令**：在 Windows 的 VS Code 里按 `Ctrl+Shift+P`，输入 `Shell Command: Install 'code' command in PATH`（如果没有看到，用 VS Code 的安装说明手动添加）。注意：打开 WSL 的终端时，VS Code 的 Remote - WSL 扩展通常会自动处理 `code` 命令。
- **`arm-none-eabi-gcc` 找不到命令**：说明交叉工具链没装好或没进 PATH，回到第六节重跑 `sudo apt install gcc-arm-none-eabi`。

## 十、练习清单（按顺序做）

1. 管理员 PowerShell 执行 `wsl --install` 并重启。完成后打开 Ubuntu，创建 Linux 用户。
2. 在 Ubuntu 里运行 `sudo apt update && sudo apt upgrade -y`。
3. 安装 `git` 并验证 `git --version`。
4. 在家目录创建项目：`mkdir ~/hello-wsl && cd ~/hello-wsl`，写个小脚本 `echo 'print("hello from python")' > hello.py`，运行 `python3 hello.py`。
5. 在 Windows 安装 VS Code，添加 Remote - WSL 扩展；在 WSL 里 `cd ~/hello-wsl`，运行 `code .` 并在 VS Code 里运行脚本。
6. 按第六节装交叉工具链，跑通 `arm-none-eabi-gcc -c hello.c -o hello.o` 并用 `objcopy` 产出 `hello.bin`。
7. 如果有远程 Linux 设备，生成 SSH 密钥并用 Remote-SSH 连接一次。

## 十一、速查表（常用命令）

```text
# Windows（管理员 PowerShell）
wsl --install
wsl -l -v
wsl --set-version <DistributionName> 2

# WSL / Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt install git build-essential python3 python3-pip -y
pwd            # 当前目录
ls -la         # 列文件
cd ~/myproj    # 进项目
nano file      # 编辑

# 嵌入式交叉工具链（arm-none-eabi）
sudo apt install gcc-arm-none-eabi openocd -y
export CROSS_COMPILE=arm-none-eabi-
${CROSS_COMPILE}gcc --version
arm-none-eabi-gcc -c hello.c -o hello.o
arm-none-eabi-objcopy -O binary hello.o hello.bin

# SSH（生成密钥）
ssh-keygen -t ed25519 -C "you@example.com"
ssh-copy-id user@remote-host
```
