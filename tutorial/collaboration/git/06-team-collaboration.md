---
title: 团队协作流程
description: 把单人 Git 操作串成一套团队标准流程——角色分工、特性分支开发、PR 审查合并、hotfix 救火，以及 git stash 救场。
order: 6
---

# 团队协作流程

## 从单兵作战到团队协作

前面几篇我们都是一个人在本地转 Git，push/pull/PR 都摸过了。这一篇我们把视角拉到团队，看看一个真实项目里多人是怎么用 Git 协作的。角色上，一个典型团队有三类人：管整个项目、审 PR、拍板合并的**负责人（maintainer）**；开发新功能、修 bug 的**开发者**；偶尔贡献代码的外部**贡献者**。流程上，核心就是"特性分支 + Pull Request + 审查合并"这一套，我们一步步走完它。

## 标准协作流程，从头到尾走一遍

### 加入项目、把代码弄到本地

新成员进项目，先得有权限——负责人在仓库 Settings → Collaborators 里加你的 GitHub 用户名，你收到邮件邀请点接受。然后克隆项目、看看分支全貌：

```bash
git clone https://github.com/团队/项目名.git
cd 项目名
git branch -a          # 看本地和远程都有哪些分支
```

进项目第一件事是读 README，搞清楚项目是干什么的、怎么跑起来、代码怎么组织、有没有开发规范。

### 开一个特性分支、干活

我们准备开发新功能，**每次开新功能前都先 pull**，确保基于最新代码起分支——这条习惯能省掉一半冲突。切到 main、拉最新、起一条特性分支：

```bash
git switch main
git pull origin main
git switch -c feature/user-profile
```

在分支上自由开发。我们的提交节奏是：**完成一个小功能就提交一次**，让每次提交都是一个完整、可理解的小改动，别攒一大坨一次性提交。比如做用户头像功能，就拆成上传、裁剪、预览三次提交：

```bash
# 改代码……
git add .
git commit -m "添加用户头像上传功能"
# 继续改……
git add .
git commit -m "添加头像裁剪功能"
# 继续改……
git add .
git commit -m "添加头像预览功能"
```

### 推到 GitHub、建 PR

功能做完了，推到远程：

```bash
git push -u origin feature/user-profile
```

`-u` 是第一次推这个分支时设上游（等于 `--set-upstream`），设完以后这条分支直接 `git push` 就行。推完打开 GitHub 仓库，会看到黄色提示 `Compare & pull request`，点进去填 PR。PR 的描述要写清楚做了什么、为什么，带个测试清单、联动相关 issue——一份像样的模板长这样：

````markdown
## 这个 PR 做了什么
- 添加了头像上传功能
- 添加了头像裁剪功能
- 添加了头像预览功能

## 测试
- [x] 本地测试通过
- [x] 上传头像正常
- [x] 裁剪功能正常

## 截图
（如果是 UI 改动，贴上截图）

Closes #15
````

填完选好审查者（Reviewers），点 Create pull request。

### 等审查、按意见改、合并

队友会审你的代码，可能提建议、要求改某处、或者直接 Approve。要改的话，**继续在你原来的特性分支上改**，然后 push——GitHub 会自动把这些新提交补进同一个 PR，不用重新建：

```bash
git switch feature/user-profile
# 按审查意见改……
git add .
git commit -m "根据审查意见修复问题"
git push origin feature/user-profile
```

审查通过、负责人点 Merge pull request，你的代码就进 main 了。

> ⚠️ 注意一个开发周期长（好几天）的特性分支：等你做完，main 多半已经被别人推了新东西。建 PR 之前先把 main 的更新并进你的分支、在本地解掉冲突再推，别把冲突留到 PR 里让审查者替你擦——那是很失礼的。并更新用 `git merge main`（稳）或 `git rebase main`（历史更干净、但改写历史，新手优先 merge）。

### 合并之后清理现场

合并完，特性分支的使命结束，我们切回 main、拉下最新（含刚合并的功能）、删掉本地和远程的特性分支，保持分支列表干净：

```bash
git switch main
git pull origin main
git branch -d feature/user-profile
git push origin --delete feature/user-profile
```

到这里一条完整的"分支开发 → PR → 审查 → 合并 → 清理"就走完了。

## 把流程压成日常习惯

这套流程浓缩成每天的习惯就是三段。开工先同步、起当天分支：

```bash
git switch main && git pull origin main
git switch -c feature/今天要做的功能
```

开发中每隔一两个小时就 add、commit、push 一次，让进度随时在远程有备份：

```bash
git add .
git commit -m "完成了某个小功能"
git push origin feature/今天要做的功能
```

收工前确认 `git status` 是 `working tree clean`、再 push 一次，确保没有改动烂在本地。

## 三个高频协作场景

**场景一：多人同时开发不同功能。** 你做登录、同事做搜索，各自起自己的特性分支、互不干扰，做完各自发 PR、依次合并进 main——这正是分支存在的意义。

**场景二：你的功能依赖别人的功能。** 比如你的"个人中心"依赖小王还在做的"认证模块"。正确做法是等小王合并进 main 之后，你从最新 main 起分支接着做；别图省事从小王那条还没合并的分支拉，那会把没定型的代码搅进来。

**场景三：正在开发，线上突然出 bug 要紧急修。** 这时候 `git stash` 救场——它把你当前没提交的改动临时藏起来、让工作区变干净，你就能切到 main 去 hotfix：

```bash
git stash                          # 把当前改动藏起来
git switch main && git pull origin main
git switch -c hotfix/紧急bug描述
# 修 bug……
git add . && git commit -m "修复紧急bug"
git push -u origin hotfix/紧急bug描述
# 发 PR、快速合并
git switch feature/你的功能        # 回到原来的活
git stash pop                      # 把刚才藏的改动恢复回来
git merge main                     # 顺便把 hotfix 的修复合进你的分支
```

`git stash` 这套命令顺手记一下：`stash` 暂存、`stash list` 看暂存了哪些、`stash pop` 恢复最近一笔并删掉、`stash apply` 恢复但不删、`stash drop` 删一笔、`stash clear` 清空。它是处理"手头活没干完、又得先去干别的"这类中断的神器。

## 小结

团队协作的核心是"特性分支 + Pull Request + 审查合并"这一套：每次开功能先 pull 最新、起 `feature/*` 分支、小步勤提交、推上去发 PR、按审查意见在同一分支上接着改、合并后删掉分支。开发周期长的分支要在合并前先把 main 同步进来。日常压成"开工同步起分支、中途勤提交推送、收工确认干净"三段。紧急修 bug 用 `git stash` 把手头活藏起来、切走 hotfix、回来 `stash pop` 恢复。这套流程跑顺，你在任何 Git 团队项目里都能顺畅协作。

## 下一站

正文流程到这就完整了，最后一篇是速查表 + 常见问题 + 进阶技巧，平时忘了命令回来翻。

> 下一篇：[速查 · FAQ · 进阶](./07-cheatsheet-and-advanced)
