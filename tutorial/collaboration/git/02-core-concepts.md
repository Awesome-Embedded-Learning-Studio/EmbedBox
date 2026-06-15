---
title: 核心概念与第一个项目
description: 仓库、工作区/暂存区/版本库、提交、分支、远程仓库——Git 最核心的几个概念，然后动手建第一个项目、完成第一次提交。
order: 2
---

# 核心概念与第一个项目

## 在动手之前，先把几个概念钉死

上一篇我们把 Git 装好了，但还不知道它内部是怎么运作的。这一篇我们先花力气把几个核心概念搞透——仓库、工作区/暂存区/版本库、提交、分支、远程仓库——理解了它们，后面所有操作就都顺理成章了。理论讲完我们立刻动手，从零建一个项目、完成第一次提交，让你把这套路子跑通一遍。

### 仓库：被 Git 管起来的文件夹

仓库说白了就是一个**被 Git 管理的文件夹**。你的项目文件夹里有一堆文件，当你在里面跑一句 `git init`，这个文件夹就变成了仓库——Git 会偷偷建一个隐藏的 `.git` 文件夹，往里塞所有的版本历史。仓库分两种：在你自己电脑上的叫**本地仓库**，在服务器上（比如 GitHub）大家都能访问的叫**远程仓库**。

### 工作区、暂存区、版本库（最容易混，也最重要）

这三个是 Git 最核心、也最容易把新手绕晕的概念。我们用一个比喻一次讲透。想象你在整理房间、准备拍张照发朋友圈：你的房间本身，就是**工作区**——你在这里挪东西、打扫、装饰，对应到 Git 就是你改代码的项目文件夹；你手边有一张"待拍照清单"，沙发摆好了你就在清单上勾"沙发✓"、书架理好了勾"书架✓"、卧室还乱着就先不勾，这张清单就是**暂存区**，对应到 Git 是你用 `git add` 把改好的文件放进去的那块；最后你照着清单把勾上的东西拍成一张照片、永久存进相册，这张照片就是**版本库里的一次提交**，对应到 Git 是 `git commit`。

你可能会问，为什么非要搞个暂存区当中间环节、不能改完直接提交？因为很多时候你一次性改了十个文件，但它们其实属于两个不同的功能，你想分成两次提交——第一次提交登录功能那三个、第二次提交注册功能那七个。有了暂存区你就能精确控制每次提交包含哪些改动：

```bash
git add login.html login.css login.js
git commit -m "完成登录功能"

git add register.html register.css register.js signup.js form.js validation.js utils.js
git commit -m "完成注册功能"
```

这样提交历史就是清晰的，每一条都对应一个完整的功能，而不是一锅"改了一堆东西"。整个流程画出来是这样：工作区里改文件，`git add` 把要的改动推进暂存区，`git commit` 把暂存区固化成版本库里的一次提交。

### 提交：给项目拍快照

一次提交（commit）就是给你的项目**拍一张快照**，记录下当前所有被跟踪文件的状态。它包含改了什么、提交信息、作者、时间戳，还有一个唯一的 ID（像 `a3f5d9c`）。提交历史可以想象成一条时间线上的珍珠链——每颗珠子是一次提交，按时间串起来，你随时能跳到任何一颗看看那时的项目长什么样。

这里我们必须强调**提交信息**这件事，因为它是几个月后你（和同事）能不能看懂历史的关键。坏的提交信息长这样："修改"、"更新代码"、"aaa"、"修复bug"——三个月后你排查一个线上问题、翻历史看到"修复bug"，根本不知道修的是哪个 bug。好的提交信息是具体的："添加用户登录功能"、"修复首页按钮点击无响应"、"重构数据库连接模块提升性能"。多花十秒写清楚，未来的你会感谢现在的你。

### 分支：项目的平行宇宙

分支是 Git 最强大的能力，也是新手最容易卡的概念。我们接着用写小说的比喻：主线剧情是男主和女主 A 在一起，但你想试一个不同结局——男主和女主 B。没有分支的话，你直接改了结局，发现读者不喜欢、原来的结局已经被覆盖找不回来了；有了分支，你从主线复制出一个"女主B结局"分支，在分支上写新结局，读者喜欢就并回主线（合并）、不喜欢就丢掉分支，主线纹丝未动。

对应到 Git，主分支（`main`，老叫法是 `master`）是项目主线、通常是稳定可发布的版本；功能分支从主线分出去开发新功能，开发完再并回来。团队协作时，张三开 `feature-login` 分支搞登录、李四开 `feature-payment` 分支搞支付，各干各的互不干扰，`main` 始终保持可运行。分支的好处一句话：能放心做实验、并行开发、出问题直接删分支，绝不弄坏主线。

### 远程仓库：云端的那一份

远程仓库就是你项目的云端备份，搁在服务器上（GitHub、GitLab、Gitee 这些），团队都能访问。本地仓库只在你电脑上，远程仓库在服务器上；`git push` 把本地新提交上传到远程，`git pull` 把远程新提交拉回本地。它的价值是备份（电脑坏了代码还在）、协作（互相能看到）、分享（公开仓库全世界能看），后面 GitHub 那一篇会专门讲怎么用。

## 动手：从零建第一个 Git 项目

概念够了，我们立刻实操，把这套路子从头跑一遍。

### 第一步——建项目文件夹、初始化仓库

我们先建个文件夹、进去，然后用 `git init` 把它变成仓库：

```bash
cd ~/Desktop
mkdir my-first-project
cd my-first-project
git init
```

`git init` 会回你一句：

```
Initialized empty Git repository in /Users/zhangsan/Desktop/my-first-project/.git/
```

到这一步，Git 在文件夹里建了隐藏的 `.git`，这个文件夹从此就是仓库了。

> ⚠️ 注意，`.git` 是隐藏文件夹（文件管理器里默认看不到），它装着全部版本历史。**千万不要手贱去改 `.git` 里的任何东西**，改坏了仓库就废了。如果你哪天想"取消"某个文件夹的 Git 管理，删掉 `.git` 就行——但平时根本不需要动它。

### 第二步——建第一个文件、看看 Git 怎么看它

我们往里放一个 `README.md`：

```bash
echo "# 我的第一个Git项目" > README.md
```

`echo` 输出文字、`>` 把输出写进文件。然后我们用一条贯穿全程的命令看看 Git 眼里发生了什么：

```bash
git status
```

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        README.md

nothing added to commit but untracked files present (use "git add" to track)
```

我们逐行读懂：`On branch main` 是你在 main 分支；`No commits yet` 是还没做过任何提交；`Untracked files` 下的 `README.md` 是 Git 看见这个文件了、但还没被正式"收编"管理——这就是"未跟踪"。最后一行直接给了下一步的提示：用 `git add` 把它纳入跟踪。

### 第三步——推进暂存区、完成第一次提交

我们照着提示把文件加进暂存区：

```bash
git add README.md
```

（如果有好几个文件要一起加，`git add .` 一把全加，`.` 表示当前目录。）再看一次 `git status`，状态变了：

```
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   README.md
```

文件从 `Untracked` 变成了 `Changes to be committed`——它进暂存区了。然后我们把它固化成一次提交：

```bash
git commit -m "初始化项目，添加README文件"
```

```
[main (root-commit) a3f5d9c] 初始化项目，添加README文件
 1 file changed, 5 insertions(+)
 create mode 100644 README.md
```

`-m` 是 message 的缩写、后面跟提交说明；`[main (root-commit) a3f5d9c]` 告诉你这是 main 分支上的第一次提交（root-commit）、ID 是 a3f5d9c。到这里，你的第一次提交就完成了。再跑一次 `git status`，它会告诉你 `nothing to commit, working tree clean`——没有待提交的改动、工作区干净，说明都落袋了。

### 第四步——看历史

我们用 `git log` 看看刚才那笔提交长什么样：

```bash
git log
```

```
commit a3f5d9c8b2e1f4d6a8c9e7f5d3b1a9c7e5d3b1a  (HEAD -> main)
Author: 张三 <zhangsan@example.com>
Date:   Mon Dec 23 10:30:00 2024 +0800

    初始化项目,添加README文件
```

`(HEAD -> main)` 表示你当前（HEAD）就在 main 分支这个提交上。默认的 `git log` 信息很全但有点啰嗦，日常我们更爱用简洁版：

```bash
git log --oneline
```

```
a3f5d9c (HEAD -> main) 初始化项目，添加README文件
```

一行一条，干净利落。按 `q` 退出日志浏览。

### 另一种起点：克隆已有项目

如果你的队友已经在 GitHub 上建了项目，你想把它弄到本地，一条 `git clone` 就够，不用再 `git init`：

```bash
cd ~/Desktop
git clone https://github.com/yourteam/awesome-project.git
cd awesome-project
```

`clone` 会把整个项目连同全部历史一起下载下来、自动建好本地仓库和远程的连接。从零建用 `init`、加入已有项目用 `clone`，这两种起点覆盖了你绝大多数场景。

## 小结

我们把 Git 的几个核心概念和第一次实操都过了一遍：仓库是被 Git 管的文件夹；改动从工作区经 `git add` 进暂存区、再经 `git commit` 固化进版本库，暂存区让你能精确控制每次提交包含哪些改动；提交信息要写得具体、对未来的自己负责；分支是平行宇宙、让你放心实验不弄坏主线；远程仓库是云端那一份。实操上，`git init` 起项目、`git status` 看状态、`git add` 进暂存区、`git commit` 提交、`git log --oneline` 看历史——这条链子你跑通一遍，Git 的日常骨架就有了。

## 下一站

骨架有了，下一篇我们进入每天都要用的日常操作——怎么看改了什么、怎么撤销、怎么忽略不想管的文件。

> 下一篇：[日常工作流](./03-daily-workflow)
