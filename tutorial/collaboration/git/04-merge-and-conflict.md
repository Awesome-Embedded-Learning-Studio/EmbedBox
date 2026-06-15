---
title: 分支合并与冲突
description: 把功能分支合并回 main（fast-forward）、亲手制造并解决一次合并冲突、分支命名与团队策略。
order: 4
---

# 分支合并与冲突

## 把分支并回主线

上一篇我们在 `feature-login` 分支上把登录功能做完了，现在要把它并回 `main`。合并的第一条铁律是：**要合并到哪个分支，就先切到哪个分支**。所以我们先切到 `main`，再合并：

```bash
git switch main
git merge feature-login
```

```
Updating a3f5d9c..e8f2a7b
Fast-forward
 login.html | 13 +++++++++++++
 1 file changed, 13 insertions(+)
 create mode 100644 login.html
```

这里有个词要认识——`Fast-forward`（快进）。它的意思是 `main` 自从分出 `feature-login` 之后自己没动过，所以合并时 Git 直接把 `main` 指针"快进"到 `feature-login` 的最新位置，没有额外的合并提交、历史是一条直线。合并完，`login.html` 就出现在 `main` 上了。

功能并完了，那条 `feature-login` 分支的使命也就结束了，我们可以删掉它保持分支列表干净：

```bash
git branch -d feature-login
```

```
Deleted branch feature-login (was e8f2a7b).
```

> ⚠️ 注意 `-d` 和 `-D` 的区别：小写 `-d` 是安全删除，分支还没合并时它会拦你一下；大写 `-D` 是强制删除，不管合没合并直接干掉。手滑敲成大写 `D`、又恰好删了个没合并的分支，里面的提交就可能找不回来了——所以默认用小写 `-d`，真要强删再上 `-D`。

## 合并冲突：别怕，这是协作的常态

合并最让人紧张的就是冲突。我们先说清楚它什么时候发生：当两个分支改了**同一个文件的同一处**，Git 没法替你决定保留谁，就停下来把两个版本都摆给你看、让你拍板。这不是报错、更不是你搞砸了，恰恰相反——它说明团队在真实协作，Git 负责任地不敢瞎合并。我们亲手制造一次、解决一次，以后再撞上就心里有数了。

### 造一次冲突出来

我们先在 `main` 上建个文件，然后开两个分支、各自改它同一行。先建文件：

```bash
git switch main
echo "这是原始内容" > test.txt
git add test.txt
git commit -m "添加test.txt"
```

开分支 A、改这一行、提交：

```bash
git switch -c branch-a
echo "这是分支A的修改" > test.txt
git commit -am "分支A修改test.txt"
```

回到 `main`、开分支 B、改**同一个文件的同一行**：

```bash
git switch main
git switch -c branch-b
echo "这是分支B的修改" > test.txt
git commit -am "分支B修改test.txt"
```

现在 `branch-a` 和 `branch-b` 都把 `test.txt` 那一行改成了各自的内容。我们回到 `main`，先把 A 合进来（这一步没冲突，`main` 还停在原处）：

```bash
git switch main
git merge branch-a
```

然后再合 B——冲突这就来了：

```bash
git merge branch-b
```

```
Auto-merging test.txt
CONFLICT (content): Merge conflict in test.txt
Automatic merge failed; fix conflicts and then commit the result.
```

Git 直白地告诉我们：自动合 `test.txt` 时撞上内容冲突了、自动合并失败，得我们手动修复、再提交。先别慌。

### 看懂冲突标记、解决它

我们打开 `test.txt`，会看到 Git 往里塞了三组标记：

```
<<<<<<< HEAD
这是分支A的修改
=======
这是分支B的修改
>>>>>>> branch-b
```

这几组标记的读法：`<<<<<<< HEAD` 到 `=======` 之间，是当前分支（`main`，已经合了 A）的内容；`=======` 到 `>>>>>>> branch-b` 之间，是正在合进来的分支 B 的内容。Git 把两个版本原样摆出来，等我们决定。

解决办法就三种：留 A 的、留 B 的、或者两个都要（甚至重写成一句新的）。假设我们两个都留，就把文件编辑成最终想要的样子，**同时把那三组 `<<<<<<<`/`=======`/`>>>>>>>` 标记全部删掉**：

```
这是分支A的修改
这是分支B的修改
```

> ⚠️ 注意，删标记这一步千万别漏。只要你留着哪怕一个 `=======`，Git 就会认为冲突还没解决、提交也过不去，而且这堆符号还会原样渲染进你的代码里。改完务必确认文件里干干净净、只剩你想要的内容。

改完存盘，告诉 Git 这个文件的冲突解决了（用 `git add` 标记），然后完成这次合并：

```bash
git add test.txt
git commit -m "合并branch-b，解决冲突"
```

到这一步冲突就彻底解决了。你也可以直接 `git commit` 不加 `-m`，Git 会自动起一个合并提交的说明。

### 撞上冲突时的几条心法

冲突不可怕，可怕的是不看内容瞎删。我们解决冲突时记住几条：先仔细读两边的改动、搞清楚各自为什么这么改；拿不准该留谁，就去找改了另一边的人当面商量，别自己拍脑袋；解决完一定要**实际编译/跑一下**，确保合出来的代码真没问题，而不是看着对；平时勤从 `main` 拉更新到自己的分支，分歧越小、撞冲突的概率越低。

## 分支怎么管才不乱

分支一多就乱，所以我们靠命名约定和一套简单策略来管。命名上，按用途加前缀：`feature/功能名`（如 `feature/user-login`）是新功能、`bugfix/描述` 是修 bug、`hotfix/描述` 是线上紧急修复、`release/版本号` 是发布准备。团队策略简化版就三层：`main` 永远稳定可发布、`develop` 是开发集成分支、大家各自从 `develop` 拉 `feature/*` 干活、干完合回 `develop`，定期把 `develop` 合到 `main` 做发布。这套不是铁律，小团队两三个人甚至直接在 `main` 上开 `feature/*` 也行，关键是团队约定一致、别各干各的。

## 小结

合并的铁律是"合并到谁就先切到谁"，`Fast-forward` 是主线没动时的直线合并；`git branch -d` 安全删分支、`-D` 强删要慎用。冲突发生在两条分支改了同一处的时候，Git 用 `<<<<<<<`/`=======`/`>>>>>>>` 标出两个版本、交给我们定夺，解决时删干净标记、`git add` 标记已解决、再 `git commit` 完成。撞冲突别慌——读懂两边、拿不准就问、解决完一定跑一下。分支管理靠命名前缀和一套一致的主线/集成/特性分层策略。

## 下一站

本地这套都会了，下一篇我们把项目推上 GitHub——注册、建远程仓库、SSH 免密、用 PR 协作。

> 下一篇：[GitHub 完全指南](./05-github)
