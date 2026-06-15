---
title: 日常工作流
description: 每天都要用的 Git 操作——改文件、看 diff、提交、删改重命名、.gitignore，以及分支的查看、创建、切换。
order: 3
---

# 日常工作流

## 每天都在转的这条流水线

上一篇我们把第一次提交跑通了，这一篇进入你**每天**都要重复的那套操作。我们先把这条主流程像生产线一样记在脑子里：在工作区改文件，`git add .` 把改动推进暂存区，`git commit -m "..."` 固化成提交，需要的话再 `git push` 推到远程。换个说法就是工厂里那一套：车间生产零件（改文件）、零件进待检区（`git add`）、质检通过打包装箱（`git commit`）、发货进仓库（`git push`）。记住这条线，剩下的操作都是围着它转的细节。

## 跑一遍完整的流程

我们拿一个真实场景走一遍——给项目加个首页。先用编辑器建一个 `index.html`，存盘。然后看状态：

```bash
git status
```

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        index.html

nothing added to commit but untracked files present (use "git add" to track)
```

Git 发现了新文件 `index.html`，但它还是"未跟踪"。我们把它推进暂存区，再确认一次状态：

```bash
git add index.html     # 或 git add . 一把全加
git status
```

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   index.html
```

文件从 `Untracked` 变成 `Changes to be committed`——进暂存区了。提交：

```bash
git commit -m "添加首页index.html"
```

```
[main b7d8a2f] 添加首页index.html
 1 file changed, 10 insertions(+)
 create mode 100644 index.html
```

改动永久存下了。看一眼历史，能看到两次提交了：

```bash
git log --oneline
```

```
b7d8a2f (HEAD -> main) 添加首页index.html
a3f5d9c 初始化项目，添加README文件
```

这就是最朴素的一轮"改 → add → commit → 看历史"。

## 改已有文件、看清楚改了什么

加新文件会了，改老文件也一样。我们打开 `index.html` 加一段内容、存盘，然后 `git status`：

```bash
git status
```

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html
```

这次的状态是 `Changes not staged for commit`——有修改、但还没进暂存区。光知道"改了"还不够，我们想看具体改了哪几行，这就用上 `git diff`：

```bash
git diff
```

```diff
diff --git a/index.html b/index.html
index e5f3d9a..7d8a2bf 100644
--- a/index.html
+++ b/index.html
@@ -6,5 +6,6 @@
 <body>
     <h1>欢迎来到我的网站！</h1>
     <p>这是我用Git管理的第一个网页项目。</p>
+    <p>这是新添加的内容！</p>
 </body>
</html>
```

diff 的读法是这样的：`+` 开头的行是新增的（这里那行新段落）、`-` 开头是删掉的（这里没有），`@@` 那行告诉你改动发生在原文件的第几行附近。按 `q` 退出。看清楚改对了，再 add + commit。对已经跟踪的文件，有个快捷方式能省一步：

```bash
git commit -am "在首页添加新段落"
```

`-a` 会自动把所有已跟踪文件的改动推进暂存区、`-m` 是提交信息，`-am` 合在一起。

> ⚠️ 注意，`-a` 只对**已经被跟踪**的文件生效。新建的文件 Git 还没跟踪，`-am` 不会把它带上，必须先 `git add`。新手常在这栽——以为 `-am` 万能，结果新文件没提交进去。

## 删文件、改名：交给 Git 来做

删文件和改名，我们推荐直接用 Git 自己的命令，一步到位、不用再单独 `git add`。删一个文件用 `git rm`：

```bash
git rm index.html
git commit -m "删除index.html"
```

改名用 `git mv`：

```bash
git mv index.html home.html
git commit -m "重命名index.html为home.html"
```

`git rm` / `git mv` 会同时改文件系统、并把这次删除/重命名登记给 Git，省去你手动 `rm` 之后再 `git add` 的麻烦。当然你用系统的 `rm`/`mv` 也行，那就得再 `git add` 一下让 Git 知道——殊途同归，Git 命令只是更省事。

## 把不想提交的东西挡在门外：`.gitignore`

项目里总会有一堆不该进版本库的东西：编译产物、临时文件、带密码的配置、系统文件（Mac 的 `.DS_Store`）、依赖目录（`node_modules/`）。我们建一个 `.gitignore` 文件，把要忽略的规则写进去：

```bash
touch .gitignore
```

```
# 忽略所有日志
*.log
# 临时目录
temp/
tmp/
# 系统文件
.DS_Store
# 依赖
node_modules/
# 敏感配置
config/secrets.txt
```

然后把 `.gitignore` 本身提交进仓库：

```bash
git add .gitignore
git commit -m "添加.gitignore"
```

从此 `.gitignore` 里列出的文件就不会被 Git 跟踪了。一个团队约定俗成的 `.gitignore` 能避免一堆"不小心把密钥/产物提交上去"的事故，值得早早配好。

## 分支操作：平行宇宙的日常

分支是团队协作的核心，我们前面讲过它的概念，这里讲怎么操作。先看为什么日常离不开它：假设线上跑着 v1.0、你要花两周开发购物车功能，可这两天线上冒出个紧急 bug 要修。没分支的话，你只能在主代码上改购物车，代码是半成品、根本没法发布修复——进退两难。有分支就不一样，你在 `feature-cart` 上安心开发购物车、紧急 bug 时从 `main` 拉个 `hotfix` 分支修完合并发布，两条线互不耽误。

我们先看现有分支：

```bash
git branch
```

```
* main
```

`*` 标的是你当前所在的分支。`git branch -a` 能连远程分支一起看。建一个新分支：

```bash
git branch feature-login
```

这条只建分支、不切过去，`*` 还在 `main`。切过去用 `git checkout`（老命令）或 `git switch`（Git 2.23 起新命令，语义更清晰）：

```bash
git switch feature-login      # 或 git checkout feature-login
```

```
Switched to branch 'feature-login'
```

> ⚠️ 小提示：新项目建议养成用 `git switch` 切分支、`git restore` 撤销的习惯，把 `git checkout`（一个命令干太多事）留给老脚本。`git switch -c feature-payment` 还能一步建分支并切过去，等于 `git branch` + `git switch` 两步合一。

现在我们在 `feature-login` 上建个 `login.html`、提交：

```bash
# 用编辑器建好 login.html
git add login.html
git commit -m "添加登录页面"
```

接下来体会一下分支的"魔法"。我们切回 `main`：

```bash
git switch main
```

打开项目文件夹看一眼——`login.html` 不见了。再切回 `feature-login`：

```bash
git switch feature-login
```

`login.html` 又回来了。这就是分支的本质：每个分支有自己独立的文件状态，切换分支时工作区的文件会自动跟着变，就像在平行宇宙之间穿梭。你在 `feature-login` 上做的登录功能，`main` 上完全看不到，等开发完了再合并过去（合并是下一篇的主题）。

## 小结

我们把每天的 Git 主流程跑熟了：改文件 → `git add` 进暂存区 → `git commit` 固化 → 需要时 `git push`。改老文件用 `git diff` 看具体改了哪几行、`git commit -am` 能省一步但只对已跟踪文件生效。删文件用 `git rm`、改名用 `git mv`，比手动操作后再 add 省事。`.gitignore` 把产物、临时文件、密钥挡在版本库外，早点配好省心。分支上 `git switch` 切换、`git switch -c` 一步建并切，每个分支是独立的文件状态、切换时工作区自动变。这条日常流水线和分支操作，是你用 Git 干活时重复最多的一套动作。

## 下一站

分支会建会切了，下一篇就讲分支之间最绕也最关键的操作——合并，以及合并时撞上的冲突怎么解决。

> 下一篇：[分支合并与冲突](./04-merge-and-conflict)
