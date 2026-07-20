---
title: "裸机装 Arch Linux + KDE：把一块硬盘整个交给 Arch"
description: "拿一台联想 Legion 5 Pro，把整块 NVMe 清空交给 Arch Linux + KDE Plasma——BIOS 开关、启动盘、Live 环境验收、rfkill 那个经典坑、archinstall 手动分区（EFI+swap+Btrfs）、NVIDIA open 驱动选型、首次进 KDE 要补的中文输入法，全程实测记录。"
order: 0
tags:
  - host
  - arch
  - beginner
difficulty: beginner
prerequisites:
  - "前置认知：工具链先行"
related:
  - "WSL2 + Linux + VS Code：Windows 上的嵌入式开发环境"
---

# 裸机装 Arch Linux + KDE：把一块硬盘整个交给 Arch

## 为什么这次不走 WSL

笔者手头有台吃灰的笔记本，原先的想法挺朴素——"反正老了，刷个 Arch 给它续个命"。结果把配置摸出来一看：联想 Legion 5 Pro 16ACH6H（机型代号 82JQ），Ryzen 7 5800H、16GB 双通道内存、RTX 3060 Laptop（6GB GDDR6）、512GB NVMe、2560×1600 165Hz 屏。这玩意儿压根谈不上"老"，纯粹是被 Windows 拖累到不想用了。既然要刷，那就刷个干净利落的 Arch + KDE，别留任何 Windows 的尾巴。

这一篇干的事，跟 [WSL 那一篇](./wsl) 是两条平行路线。WSL 是"我还想留在 Windows 里，顺便要一套真 Linux"——它不打扰你的 Windows，在 NTFS 上空降一个 Linux 内核。而裸机装 Arch 是**把一整块硬盘整个交给 Arch**：Windows 没了、恢复分区没了、出厂镜像没了，从一块空盘开始搭一套原生 Linux 桌面。代价是这台机器从此跟 Windows 再见，收益是你拿到一个没有任何 OEM 负担的干净工作站——它后面就是 EmbedBox 所有命令行操作的落脚点。

路线我事先定死，免得装到一半再纠结：优先走官方 `archinstall` 自动安装器，不手动 `pacstrap`、不手写分区、不手生成 `fstab`；文件系统 Btrfs、引导器 systemd-boot、桌面 KDE Plasma、显示协议默认 Wayland、网络 NetworkManager、音频 PipeWire、中文输入 Fcitx5 + Rime。老机器上对内存友好的那些手段——Btrfs 透明压缩、zram——我们都会用上，唯独 swap 这一项，因为这台机器明确要支持休眠，最后走的是独立 swap 分区而不是 zram，这件事等会儿到分区那一步再展开。

## 先把机器摸清楚：三个真正要处理的点

裸机装机最大的变量永远不是 Arch 本身，而是你那台机器的具体硬件。所以动手之前，我们先把目标机摸透。这台 Legion 摸下来，真正需要专门处理的只有三件事：**AMD 核显 + NVIDIA 独显的混合输出**、**Realtek RTL8852AE 这块 Wi-Fi 6 网卡**、还有**为了休眠而设计的 swap 分区**。其它一切都是标准 UEFI 笔记本该有的样子，没有拦路虎。

安装条件其实已经非常理想：UEFI 启动、GPT 磁盘、Secure Boot 已关、BitLocker 已关、只有一块 512GB NVMe、Windows 和所有分区都允许清空。也就是说，我们**不需要处理双系统、BitLocker 解锁、Intel RST/RAID、Legacy BIOS 或多硬盘误删**这一堆通常会把人卡半天的破事。直接在安装器里认准那块 `WDC PC SN730 SDBPNTY-512G-1101`（约 476.94 GiB），整盘抹掉就行。

如果你的目标机此刻还跑着 Windows，与其一项项去翻"我的电脑→属性"，不如直接让 PowerShell 帮你 dump 一份报告。以管理员身份打开 PowerShell，跑下面这段——它会把整机、主板、BIOS、CPU、显卡、硬盘、分区、网卡、固件启动模式、Secure Boot、BitLocker 状态全部打出来：

```powershell
$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n========== 整机 ==========" -ForegroundColor Cyan
Get-CimInstance Win32_ComputerSystem |
    Select-Object Manufacturer, Model,
        @{Name="RAM_GB"; Expression={[math]::Round($_.TotalPhysicalMemory / 1GB, 1)}} |
    Format-List

Write-Host "`n========== CPU ==========" -ForegroundColor Cyan
Get-CimInstance Win32_Processor |
    Select-Object Name, NumberOfCores, NumberOfLogicalProcessors |
    Format-List

Write-Host "`n========== 显卡 ==========" -ForegroundColor Cyan
Get-CimInstance Win32_VideoController |
    Select-Object Name, DriverVersion, VideoModeDescription |
    Format-List

Write-Host "`n========== 硬盘 ==========" -ForegroundColor Cyan
Get-Disk |
    Select-Object Number, FriendlyName, BusType, PartitionStyle,
        @{Name="Size_GB"; Expression={[math]::Round($_.Size / 1GB, 1)}} |
    Format-Table -AutoSize

Write-Host "`n========== 固件启动模式 ==========" -ForegroundColor Cyan
(Get-ComputerInfo).BiosFirmwareType

Write-Host "`n========== Secure Boot ==========" -ForegroundColor Cyan
try { Confirm-SecureBootUEFI } catch { Write-Host "无法查询：可能未以 UEFI 启动，或终端没有管理员权限。" }

Write-Host "`n========== BitLocker ==========" -ForegroundColor Cyan
manage-bde -status
```

这份报告拿在手，你就能提前判断哪些项要进 BIOS 改、哪块网卡可能要现场折腾驱动，而不是进了 Live 环境才发现两眼一抹黑。

## 进 BIOS：把几个开关拨到对的位置

联想笔记本进 BIOS 最稳的办法是**完全关机**之后，按电源键开机，看到 Lenovo/LEGION 标志前后连续点按 `F2`——注意是点按，不是一直按住；如果 `F2` 被当成亮度/音量功能键，那就用 `Fn + F2`。其实刷 Arch 多数情况下根本不用改永久启动顺序，开机时按 `F12` 调出一次性启动菜单、临时选 U 盘启动更省事。要是按键总来不及，先在 Windows 里执行一次彻底关机再开机：

```powershell
shutdown.exe /s /f /t 0
```

进 BIOS 之后，重点核对下面这几项。图形设备那一栏是这台机器最关键的一项，其它的属于 UEFI 装机的通用要求。

`Graphic Device` 这一项，我们要把它设成 `Discrete Graphics`，也就是把联想的 Hybrid Mode 关掉，让 RTX 3060 独显直连内屏。第一次安装先保持独显直连，是为了让显示链路最简单——KDE 直接跑在 NVIDIA 上，暂时不用处理 PRIME 混合显卡切换那一摊事。代价是续航差一些、待机功耗高一些，但这台机器主要插电用，无所谓；等系统稳定、想提续航了，我们再打开 Hybrid Mode，让 KDE 默认跑 AMD 核显、需要 CUDA 时再调用 RTX 3060。

其它的项，`Boot Mode` 留在 `UEFI`、把 `Legacy Support / CSM` 关掉；`Secure Boot` 确认为 `Disabled`——Arch 官方安装介质和 systemd-boot 都要求 Secure Boot 关闭；`USB Boot` 设为 `Enabled`，方便待会儿从 U 盘启动；如果 BIOS 里有 `Fast Boot`，安装期间先 `Disabled`，装完再决定开不开；`AMD Virtualization / SVM Mode` 顺手 `Enabled`，后面要用 KVM/QEMU，开着正好。`TPM`、`PXE Boot`、`Battery Conservation` 这些不用动。**尤其不要在这个节骨眼上设 BIOS 密码，也不要升级 BIOS**——没有明显故障就别在刷系统前给自己加变量。

## 制作启动盘：ISO + Rufus，走 DD 模式

BIOS 拨弄完，下面走最稳的 Windows 路线：官网下 ISO、校验 SHA256、再用 Rufus 写进 U 盘。先准备一个 4GB 以上的 U 盘（8GB 或更大更稳），写盘会清空 U 盘全部内容，里面有别的东西先拷出来。

从 [Arch Linux 官方下载页](https://archlinux.org/download/) 选中国大陆、香港或全球镜像，下载那个以 `.iso` 结尾的文件。**不要下** `bootstrap.tar.zst`、不要下 torrent 文件本身、不要下 WSL 镜像——我们只要 `.iso`。截至 2026 年 7 月，当前安装镜像是 `archlinux-2026.07.01-x86_64.iso`，大小约 1.5GB。

ISO 下完先校验，别急着写盘。在下载目录打开 PowerShell：

```powershell
Get-FileHash .\archlinux-2026.07.01-x86_64.iso -Algorithm SHA256
```

`Get-FileHash` 算出来的 SHA256 应当和 Arch 官方下载页公布的值一字不差（大小写无所谓，字符必须完全相同）。对不上就删了重下，别拿一个残缺的 ISO 去写盘——否则你后面在 Live 环境里会撞上各种莫名其妙的包损坏。

校验通过后，插上 U 盘，**右键 Rufus → 以管理员身份运行**，参数按下表设。分区类型选 GPT、目标系统选 UEFI（非 CSM），这俩必须对——选错成 MBR/CSM 的话，这台纯 UEFI 机器根本认不出你的启动盘。

```text
设备：选你的 U 盘
引导类型选择：磁盘或 ISO 镜像
镜像文件：archlinux-2026.07.01-x86_64.iso
分区类型：GPT
目标系统：UEFI（非 CSM）
```

其它的保持默认，不需要持久化空间、不需要预先格式化。**最上面"设备"那一栏的名称和容量反复看两眼，千万别选到移动硬盘**——选错的代价是整块移动硬盘被清空。确认后点"开始"。

Rufus 大概率会弹出一个 `检测到 ISOHybrid 镜像` 的对话框，让你二选一：`以 ISO 镜像模式写入` 还是 `以 DD 镜像模式写入`。我们选 **DD 模式**。Arch 安装介质本来就推荐用 DD 方式写入，ISO 模式偶尔会在某些主板上起不来。写完 Rufus 底部显示 `准备就绪` 就行了；这时候 Windows 可能弹"需要格式化磁盘才能使用"，**不要格式化**——那是 Windows 看不懂 Linux 安装盘分区造成的正常现象，直接关掉。

## 点火：进 Live 环境，先验硬件再装

U 盘做好了，保持它插着，重启笔记本。看到 Legion 标志时连续按 `F12` 调出启动菜单，选带 `UEFI:` 前缀的那一项（比如 `UEFI: KESU USB 3.0`），**不要选**没有 `UEFI` 前缀的重复项。接着在 Arch 菜单里选 `Arch Linux install medium (x86_64, UEFI)`，随后应该落到一个黑底终端，提示符长这样：

```text
root@archiso ~ #
```

到这一步，**先别急着敲 `archinstall`**。我们要先做一轮硬件验收——确认 UEFI、认准硬盘、看见显卡、连通 Wi-Fi、同步时间——这些都正常了，再正式清盘安装。这一步省不得，因为它能让你在动手清盘之前就发现"Wi-Fi 上不来""选错盘"这类灾难性问题。

### 先把字体放大

这台机器是 2560×1600 的屏，Live 终端默认字体小得离谱，先把它放大再干活：

```bash
setfont ter-132b
```

如果提示找不到字体，退一档用 `setfont ter-128b`；想看有哪些可选，`ls /usr/share/kbd/consolefonts | grep ter` 列一遍。

### 确认 UEFI 和硬盘

先确认我们真的是在 UEFI 模式下启动的——这一步直接决定后面引导器能不能用 systemd-boot：

```bash
cat /sys/firmware/efi/fw_platform_size
```

期望输出是 `64`（表示 64 位 UEFI）。如果什么都没输出，说明你是 Legacy/CSM 启动的，得回 BIOS 把 Boot Mode 改成 UEFI 再来。

接着认准要清空的那块硬盘，**此时千万不要执行任何格式化命令**，只是看：

```bash
lsblk -d -o NAME,SIZE,MODEL,TRAN
```

你要清空的内部盘应该是 `nvme0n1`，型号 `WDC PC SN730 SDBPNTY-512G-1101`，约 476.9G；U 盘一般显示为 `sda`，容量明显更小。再看一眼现有分区，心里有个数：

```bash
lsblk -f
```

这时候应该还能看到原 Windows 的 FAT32、NTFS 分区——它们马上就要被整盘抹掉了。

### 看一眼显卡

```bash
lspci -k | grep -A4 -E 'VGA|3D|Display'
```

在 `Discrete Graphics` 模式下，这里主要应该看到 `NVIDIA ... RTX 3060 Mobile`。Live 环境当前给这张卡绑了什么临时驱动不重要，重点是 PCI 设备能被识别出来就行。

### 同步时间

```bash
timedatectl set-ntp true
timedatectl status
```

期望看到 `System clock synchronized: yes` 和 `NTP service: active`。时间同步是装机前的标准准备步骤，没同步的话后面软件包签名验证会出莫名其妙的错。

## 那个经典坑：Wi-Fi 被 rfkill 锁死

这台机器的无线网卡是 Realtek RTL8852AE，PCI ID `10EC:8852`，走主线内核的 `rtw89` 驱动，Arch 当前的 `linux-firmware-realtek` 也带了 `rtw8852a` 固件，正常情况下 Live 环境起来就能用 `iwctl` 联网。先把网卡情况摸一遍：

```bash
rfkill
ip link
iwctl device list
```

进 `iwctl` 联网的流程很标准——`device list` 看接口名（一般叫 `wlan0`，偶尔是 `wlan1`），`station wlan0 scan` 扫描，`station wlan0 get-networks` 列出可见网络，`station wlan0 connect "你的WiFi名称"` 连接，输完密码 `exit` 退出。但笔者在这里实打实地卡了二十分钟，现象是 `iwctl` 报 `station wlan0 scan: no station on device`，接口状态显示 `powered off`，再手动 `iwctl device wlan0 set-property Powered on` 直接 `operation failed`。

这个现象的真相几乎只有一个：**网卡其实已经被系统枚举出来了，只是被 `rfkill` 软锁了**，iwd 没法给一个被锁的设备上电。我当时的失误是以为先前执行过 `rfkill unblock`，其实根本没执行成功——经典的"我以为我执行了"。所以 Wi-Fi 一旦拧巴，先别反复敲 `iwctl`，按下面这个顺序排查，从最可能的原因开始：

```bash
rfkill list all
rfkill unblock all
systemctl restart iwd
iwctl device wlan0 set-property Powered on
iwctl station wlan0 get-networks
```

`rfkill list all` 重点看 Wi-Fi 那一项的两个字段。如果是 `Soft blocked: yes`，上面那套 `unblock all` + 重启 iwd 基本一把过；如果是 `Hard blocked: yes`，那就是笔记本的飞行模式热键或固件开关把无线硬关了，软件命令解不开，得按一下键盘上带飞机/无线图标的功能键（可能要 `Fn +` 那个键），再 `rfkill unblock all`。

> ⚠️ 注意，个别联想机型的平台模块 `ideapad_laptop` 会**误报**硬件开关状态——表现是 `rfkill` 显示 `Hard blocked: yes`、按飞行键无效、但 BIOS 里 WLAN 明明是开的。这种情况可以在 Live 环境临时卸载它来排查：`modprobe -r ideapad_laptop` 然后 `rfkill unblock all`。这只是排查手段，不是常规操作。

实在拧巴到现场没法修，别跟它耗——拿一台安卓手机插 USB、打开 **USB 网络共享**，Arch 通常会把它识别成普通有线网卡，先把系统装完、进 KDE 后再回头专门修 RTL8852AE。这条退路比现场编译第三方 Wi-Fi 驱动靠谱得多。

笔者这台最后就是 `rfkill unblock all` 一把解决，网络通了，正式进入安装阶段。顺便说一句，Wi-Fi 信号不稳的时候，软件下载速度可能很拉胯，可以在 Live 环境里用 `reflector` 把镜像换成东亚节点：

```bash
cp /etc/pacman.d/mirrorlist /etc/pacman.d/mirrorlist.archiso
reflector --country China,Japan,Singapore --protocol https --latest 20 --sort rate --save /etc/pacman.d/mirrorlist
pacman -Syy
```

这套镜像配置只影响本次 Live 环境，不会写进装好的系统，放心用。网络和时间都就绪之后，我们才正式敲下 `archinstall`。

## 正式开装：archinstall 分区与选项

```bash
archinstall
```

官方 `archinstall` 是个交互式菜单安装器，菜单名称可能因版本有细微差异，但选项逻辑一致。安装器语言先用 `English`——英文菜单排错方便，KDE 装好后再切中文。镜像区域选 `China`（或 `China` + `Worldwide`），额外仓库 `Multilib` 和 `Testing` 都先 `Disabled`——不装 Steam/Wine 暂时用不上 multilib。键盘 `us`，locale 语言 `en_US.UTF-8`、编码 `UTF-8`，同样是为了 TTY 不乱码、装完再切中文。

### 手动分区：1 GiB EFI + 24 GiB swap + Btrfs

进 `Disk configuration → Manual partitioning`，选中 `/dev/nvme0n1`，`Wipe all selected drives` 整盘清除。**这一步会删掉 Windows、C 盘、D 盘和所有恢复分区，反复确认选中的就是那块 476.9 GiB 的 SN730，别选到 U 盘。** 然后按顺序建三个分区。

第一个是 EFI 系统分区，UEFI 机器必须有它，1 GiB 足够（内核和 initramfs 都会放这里，给足余量）：

```text
Size:       1 GiB
Filesystem: FAT32
Mountpoint: /boot
Flag:       Boot / ESP
```

第二个是 swap 分区。这里就是开头埋的那个伏笔——这台机器明确要**休眠到硬盘**，所以不能只选 zram。ArchWiki 写得很清楚：休眠到 zram 不受支持，必须有磁盘上的 swap 分区或 swap 文件。我给 24 GiB，比 16GB 物理内存大一截，是为了给 NVIDIA 显存、桌面会话和休眠镜像留余量：

```text
Size:       24 GiB
Filesystem: linux-swap
Mountpoint: 留空
```

第三个是 Btrfs 根，吃掉剩余的全部空间（大约 452 GiB），开 `compress=zstd` 透明压缩。不直接设挂载点，而是给它挂上四个子卷：

```text
Size:       Remaining
Filesystem: Btrfs
Compression: zstd

子卷：
@       → /
@home   → /home
@log    → /var/log
@pkg    → /var/cache/pacman/pkg
```

把 `/var/log` 和 `/var/cache/pacman/pkg` 单独拎出来成子卷，是为了让系统日志和 pacman 包缓存不会污染根子卷的快照——后面配 Snapper 做回滚时这一点会很受用。`@snapshots` 这个子卷先不建，等装好系统配 Snapper 时再建，免得在这里多加一层复杂度。

最终磁盘布局应该是这样：

```text
/dev/nvme0n1p1    1 GiB       FAT32    /boot
/dev/nvme0n1p2   24 GiB       swap
/dev/nvme0n1p3  约 452 GiB     Btrfs
```

### 其余选项：定死 bootloader / kernel / profile / 显卡

分区之外，剩下的选项我们一次性定死。磁盘加密选 `None`——这台机器主要放家里用，老 CPU 做全盘加密有性能损耗，也增加救援系统的复杂度，不值当。主菜单里如果有单独的 `Swap / Swap on zram`，设成 `Disabled`，因为我们已经建了实体 swap 分区，不能再叠一个 zram 抢休眠目标。

引导器选 `Systemd-boot`，UKI（Unified Kernel Image）`Disabled`。systemd-boot 结构简单，特别适合这台单系统 UEFI 机器；它只能用于 UEFI，这也是我们前面反复确认 UEFI 模式的原因。

内核第一次**只选 `linux`**，先不同时装 `linux-lts`。这是为了减少 NVIDIA 驱动这一步的变量——DKMS 要为每一个内核都构建模块，内核越多越容易出岔子。等系统稳定了，再补 `linux-lts` 作为故障回退非常容易，到时候一条 `pacman -S linux-lts linux-lts-headers` 就行。

Profile 进 `Desktop → KDE Plasma`。KDE 在 Arch 里通过 `plasma` 元包安装就够了，完整 KDE 应用集合（那一堆 KDE Gear）是另一组包，不要在安装阶段一次装得太臃肿。显卡驱动选 `NVIDIA (open kernel module)`——也就是 `nvidia-open`，RTX 3060 属于 Ampere 架构，当前 Arch 官方仓库对它主推开放内核模块。登录管理器选 `SDDM`，音频选 `PipeWire`。

网络配置选 `Use NetworkManager`，**不要选**"复制当前 ISO 网络配置"——装好系统后我们要让 KDE 和 NetworkManager 自己管 Wi-Fi，而不是把 Live 环境那套临时配置带进去。Hostname 随便起一个，比如 `legion-arch`。创建一个普通用户（比如 `charlie`），勾上 `Superuser / sudo privileges`、设好密码；root 密码留空，让 root 保持锁定，平时用 `sudo` 提权。时区 `Asia/Shanghai`，自动时间同步 `Enabled`。

Additional packages 填这一行，把装完立刻就要用的东西一次拉下来：

```text
git base-devel firefox vim nano btop fastfetch linux-firmware-realtek bluez bluez-utils nvidia-utils nvidia-prime
```

这里特意不带 `cuda`——它体积大，等第一次正常进 KDE、确认 NVIDIA 工作正常后再单独装，免得安装阶段平白多下几个 G。

### 停在最终确认页

回到主菜单检查摘要，必须跟我们定的方案对上：磁盘 `/dev/nvme0n1` 整盘清除、分区 1 GiB EFI + 24 GiB swap + Btrfs、引导器 systemd-boot、内核 `linux`、Profile KDE Plasma、显卡 NVIDIA open、网络 NetworkManager、音频 PipeWire、加密 None。**先停在 `Install` 最终确认页，别按最后的 Yes。** 重点再扫一眼三个分区有没有误伤 U 盘，摘要对上了再正式清盘安装。

安装器跑完后选 `Reboot system`，拔掉 U 盘。

## NVIDIA 驱动：为什么 RTX 3060 选 open 模块

这里单独把显卡驱动拎出来说透，因为它是这次安装里最容易让人纠结的一步。截至 2026 年 7 月，Arch 官方仓库对 Ampere 及更新架构的 NVIDIA 已经主推**开放内核模块**：普通 `linux` 内核对应 `nvidia-open`，多内核或非标准内核用 `nvidia-open-dkms`（DKMS 会为每个内核分别构建模块），用户态组件统一是 `nvidia-utils`。RTX 3060 属于 Ampere，正好落在这套支持范围内，所以 `archinstall` 里选 `nvidia-open` 是顺理成章的。

等你以后同时保留 `linux` 和 `linux-lts` 两套内核了，再把它换成 `nvidia-open-dkms`，让 DKMS 给两套内核各编一份。这件事不用现在提前折腾，先让单内核跑稳。

> ⚠️ 注意，Ampere 笔记本有一个需要记住的备用方案：万一装完遇到 NVIDIA 完全不启动、休眠黑屏或 GSP 固件异常，再考虑切回闭源内核模块并关闭 GSP。这是**故障回退**，不是默认选择，别在一切正常的时候提前改。

休眠这块还有个 NVIDIA 特有的坑要记住：配置休眠时要避免把 NVIDIA 模块做成不合适的 early KMS——ArchWiki 特别提示，启用 early KMS 时可能无法使用保存显存的临时路径，从而影响休眠恢复。所以休眠参数我们留到系统稳定后单独配，不在装机阶段碰。

## 装完重启：首次进 KDE 要补的几件事

重启之后顺利落到 KDE Plasma 登录界面，输入刚才建的普通用户密码，进桌面。先做一次完整更新，把安装镜像以来可能的版本差补上：

```bash
sudo pacman -Syu
```

然后是几个装完立刻要补的东西。首先是中文输入法和基础桌面组件——`fcitx5-im` 是软件包组，pacman 问你选哪些包时直接回车装全部就行：

```bash
sudo pacman -S --needed \
    firefox git base-devel \
    konsole dolphin kate ark \
    noto-fonts noto-fonts-cjk noto-fonts-emoji \
    fcitx5-im fcitx5-rime
```

装完 Fcitx5，在 KDE 里走 `系统设置 → 输入和输出 → 键盘 → 虚拟键盘 → Fcitx 5` 把它设成虚拟键盘。KDE Plasma Wayland 下，应当让 KWin 来启动 Fcitx5，而不是单纯依赖传统的开机自启动——这一点不做的话，输入法会在某些 Wayland 原生应用里失灵。重新登录一次，打开 Fcitx5 配置器，把 `Rime` 加进去，默认 `Ctrl + Space` 切换输入法。

> ⚠️ 注意，如果首次进桌面找不到终端模拟器（archinstall 的 KDE profile 偶尔会漏装 konsole），先按 `Alt + Space` 搜一下 `konsole`；确实没有的话，按 `Ctrl + Alt + F3` 切到 TTY，用普通用户登录后 `sudo pacman -Syu konsole` 装上，再 `Ctrl + Alt + F1`（必要时 `F2`）切回图形桌面。

中文界面这块，先把 locale 生成出来。注意保留 `/etc/locale.conf` 的英文系统默认值——TTY 下中文 locale 会乱码，系统层留英文、KDE 层切中文是最稳的做法：

```bash
sudo sed -i.bak '/^#zh_CN.UTF-8 UTF-8/s/^#//' /etc/locale.gen
sudo locale-gen
locale -a | grep -i zh_CN
```

重新登录后，在 `系统设置 → 区域与语言 → 语言` 里把"简体中文"添加并置顶。字体方面，`noto-fonts-cjk` 装好之后，常规字体选 `Noto Sans CJK SC`，等宽字体可以补一个 `ttf-jetbrains-mono`；2560×1600 的内屏全局缩放先试 125%，还觉得小再加到 150%。KDE 中文翻译包是 `kde-l10n-zh_cn`，想要完整中文化的话一并装上。

## 后续计划：休眠、远程桌面、SDDM

到这一步，一台开机直奔 KDE、中文输入法就绪、NVIDIA 跑在开源内核模块上的原生 Linux 工作站已经立起来了。下面这几件事笔者列成待办，不在本篇展开，但路线先记下来，免得以后忘了从哪入手。

**休眠**是头一个要补的。我们建了 24 GiB 的 swap 分区就是为了它，但装机阶段没有进 `archinstall` 的 chroot 去配恢复参数，所以现在休眠还用不了。要启用它，得拿到 swap 分区的 UUID、往 systemd-boot 的内核命令行加 `resume=UUID=<swap分区UUID>`、给 mkinitcpio 加 `resume` hook 并重新生成 initramfs，还要注意前面说的 NVIDIA early KMS 那个坑。这块等单独一篇再细写。

**远程桌面**这边，Win11 专业版能原生当 RDP 主机，所以优先配"Arch 远程进入 Windows"。Windows 那头在 `设置 → 系统 → 远程桌面` 开启、记下电脑名或局域网 IPv4、确保登录账户有真实密码（不能只有 PIN）；Arch 这头装 `remmina` 和 `freerdp`，协议选 RDP、服务器填 Windows 的局域网 IPv4、开启动态分辨率和剪贴板同步。**千万别在路由器上把 RDP 的 3389 端口直接映射到公网**，要外网访问就用 Tailscale 这类组网方案。反向（Windows 远程进 Arch）可以装 `krdp`，在 KDE 的 `系统设置 → 远程桌面` 里开，按需启用。

**SDDM 登录界面美化**走官方路线，不要从 AUR 装不明主题。先 `sudo pacman -S --needed sddm-kcm`，在 `系统设置 → 颜色与主题 → 登录界面（SDDM）` 里点"应用 Plasma 设置…"，把 Plasma 的分辨率和缩放同步给 SDDM，再在主题列表里挑一个。后续想要深色 + 个人壁纸 + 大字体的本地主题，基于官方 Breeze 主题改最稳。

## 小结

我们从一块装着 Windows 的 NVMe 开始，一路走完了 BIOS 开关、启动盘制作、Live 环境验收、`rfkill` 那个经典坑、`archinstall` 手动分区、NVIDIA 驱动选型，最后落到一台能用的 KDE 工作站。几件必须记住的事：装机前先用 PowerShell 把目标机硬件 dump 一份，提前发现拦路虎；BIOS 里 `Graphic Device` 先设成 `Discrete Graphics`，让显示链路最简单；Rufus 一律走 DD 模式；进 Live 环境先验收 UEFI、硬盘、显卡、网络、时间，确认无误再清盘；Wi-Fi 一旦 `powered off` / `operation failed`，先怀疑 `rfkill` 没解开，别跟 `iwctl` 死磕；要休眠就必须有磁盘 swap 分区，zram 当不了休眠目标；NVIDIA 在 Ampere 上选 `nvidia-open`，多内核时换 `nvidia-open-dkms`。到这里，原生 Linux 地基就打好了。

## 下一站

这台 Arch + KDE 工作站立起来之后，我们就有了 EmbedBox 所有命令行操作的落脚点。如果你是从 Windows 过来、暂时还不想把整台机器交给 Linux，那条路线在 [WSL 那一篇](./wsl)。地基有了，接下来把终端从"会敲 cd/ls"升级成真正能控制环境的工具——PATH、管道、权限、烧写，这些是嵌入式命令行的内功。

> 下一卷：[终端与 Shell 进阶：嵌入式开发的那只手](./terminal)

## 参考资源

- [Arch Linux 官方下载页](https://archlinux.org/download/)
- [Installation guide — ArchWiki](https://wiki.archlinux.org/title/Installation_guide)
- [archinstall — ArchWiki](https://wiki.archlinux.org/title/Archinstall)
- [USB flash installation medium — ArchWiki](https://wiki.archlinux.org/title/USB_flash_installation_medium)
- [Systemd-boot — ArchWiki](https://wiki.archlinux.org/title/Systemd-boot)
- [Btrfs — ArchWiki](https://wiki.archlinux.org/title/Btrfs)
- [NVIDIA — ArchWiki](https://wiki.archlinux.org/title/NVIDIA)
- [NVIDIA Optimus — ArchWiki](https://wiki.archlinux.org/title/NVIDIA_Optimus)
- [Power management/Suspend and hibernate — ArchWiki](https://wiki.archlinux.org/title/Power_management/Suspend_and_hibernate)
- [iwd — ArchWiki](https://wiki.archlinux.org/title/Iwd)
- [Fcitx5 — ArchWiki](https://wiki.archlinux.org/title/Fcitx5)
- [Lenovo Legion 5 Pro 16ACH6H 规格（PSREF）](https://psref.lenovo.com/syspool/Sys/PDF/Legion/Lenovo_Legion_5_Pro_16ACH6H/Lenovo_Legion_5_Pro_16ACH6H_Spec.pdf)
