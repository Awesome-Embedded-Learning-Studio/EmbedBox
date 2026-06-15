---
title: GitHub 完全指南
description: 把项目搬上 GitHub——注册、建远程仓库、连接本地（HTTPS/PAT/SSH）、push/pull/fetch，以及 Issues、Pull Request、Fork 这些协作功能。
order: 5
---

# GitHub 完全指南

## 为什么我们要上 GitHub

前面几篇我们的 Git 都在自己电脑上转，本地仓库用得好好的。可一旦要协作、要备份、要让别人看到你的代码，本地就不够了——我们需要一个放在服务器上、团队都能访问的远程仓库。GitHub 就是全球最大的代码托管平台，几乎所有开发者都在上面，我们这一篇就把它从注册到日常协作完整走一遍。同一组织里还有 GitLab、Gitee 这些同类，玩法相通，我们以最主流的 GitHub 为例。

## 注册账号、建第一个远程仓库

我们先去 [github.com](https://github.com) 注册：点右上角 Sign up，填邮箱、设密码（至少 8 位）、起个用户名——这个用户名会出现在你的仓库网址里（`github.com/你的用户名`），起得正经点；过个人机验证、点 Create account，然后去邮箱点验证链接。登录之后可以进 Settings → Profile 补头像、简介这些，不急。

仓库（repository，社区里常叫 repo）是 GitHub 上的项目单位。建一个：登录后点右上角 `+` 号、选 New repository，填仓库名（只能字母数字连字符下划线，比如 `my-awesome-project`）、可选写一句描述、选 Public（公开，谁都能看）还是 Private（私有）、下面有几个初始化选项——Add a README（建议勾）、`.gitignore` 模板、license。学习项目勾个 README 就够，先别纠结 license。

## 把本地仓库连上 GitHub

现在我们手上有两份：电脑上的本地仓库、GitHub 上的远程仓库，要把它们连起来。我们分两种情况。

### 已有本地仓库、推上 GitHub

假设你本地已经有 `my-first-project`。先在 GitHub 建一个同名仓库，**注意这次别勾任何 Initialize 选项**（因为本地已经有内容了，再让 GitHub 初始化会多出一个无关提交，后面推会冲突）。建完 GitHub 会给你一段提示命令，照着在本地项目目录里跑：

```bash
git remote add origin https://github.com/你的用户名/my-first-project.git
git branch -M main
git push -u origin main
```

我们拆一下这三条。`git remote add origin URL` 是给远程仓库登记一个名字，按习惯叫 `origin`（你也可以起别的，但全人类都用 origin，别标新立异）。`git branch -M main` 是把当前分支改名叫 `main`——老版 Git 默认叫 `master`、新版默认 `main`，跟 GitHub 对齐用 main。`git push -u origin main` 是把本地的 main 推到 origin，`-u` 是记住这个对应关系（设了上游），以后直接 `git push` 不用再写全。

第一次推的时候 GitHub 要验证你是谁，这里有个**坑必须提醒**：从 2021 年起，GitHub 不再接受账号密码推代码，密码那栏你得填一个 **Personal Access Token（PAT）**。生成 PAT 的路径是 头像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，备注写"我的电脑"、权限勾 `repo`（完整仓库控制）、生成后**立刻复制保存**——它只显示这一次，关掉就再也看不到了。以后 push 时用户名填 GitHub 用户名、密码填这个 token。

> ⚠️ 注意，比起每次推都粘 token，**配 SSH 密钥才是正经做法**——一次配好、以后免密、还更安全。下面专门讲。

### 从 GitHub 克隆已有项目

反过来，如果你想加入一个已经在 GitHub 上的项目，一条 `git clone` 把它整个拉到本地，自动建好仓库和远程连接，不用再 `git init`：

```bash
cd ~/Desktop
git clone https://github.com/用户名/项目名.git
cd 项目名
```

## push 和 pull：和远程来回搬

连上之后，日常就是 push（把本地新提交推上去）和 pull（把远程新提交拉下来）。我们在本地改完、add、commit 之后，`git push` 一条推到 GitHub（因为之前 `-u` 设过上游，不用写全）。反过来队友更新了远程、你想同步，`git pull` 把最新提交拉下来并自动合并进当前分支。

> ⚠️ 小习惯：每天开工第一件事先 `git pull` 一下，把昨晚别人推的更新拉下来再开始改，能少撞很多冲突。

还有一个 `git fetch`，它和 pull 的区别是：fetch 只把远程更新下载下来、**不合并**进你的工作区。你想先瞄一眼远程有啥动静再决定合不合并，就用 fetch：

```bash
git fetch origin
git log origin/main      # 看远程比本地多了哪些提交
git diff origin/main     # 看具体差异
git merge origin/main    # 想好了再合并
```

## 配 SSH 密钥：一次配好、永久免密

SSH 是我们推荐的远程认证方式，配好之后 push/pull 再也不用输 token。先看看本机有没有现成的密钥：

```bash
ls -al ~/.ssh
```

看到 `id_ed25519.pub`（或 `id_rsa.pub`）就说明已经有了，跳到复制公钥那步。没有就生成一对：

```bash
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
```

一路回车用默认路径，passphrase 那步可以设个密码（更安全）也可以留空（图省事）。生成完，`~/.ssh/id_ed25519` 是私钥（自己留着绝不外传）、`id_ed25519.pub` 是公钥（要交给 GitHub）。我们把公钥打印出来复制：

```bash
cat ~/.ssh/id_ed25519.pub      # Mac 可以 pbcopy < ~/.ssh/id_ed25519.pub 直接进剪贴板
```

然后去 GitHub：头像 → Settings → SSH and GPG keys → New SSH key，标题随便起（如"我的电脑"）、Key 粘贴刚才那串、Add。回终端测一下连通：

```bash
ssh -T git@github.com
```

第一次会问你要不要信任 github.com，输 `yes`；看到 `Hi 你的用户名! You've successfully authenticated...` 就成了。最后把仓库地址从 HTTPS 换成 SSH，以后就彻底免密了：

```bash
git remote -v       # 看当前远程地址
git remote set-url origin git@github.com:你的用户名/仓库名.git
```

## GitHub 上几个绕不开的功能

### README：项目的门面

`README.md` 是别人点进你仓库第一眼看到的东西，相当于项目的自我介绍。一份合格的 README 至少有项目标题加一句话描述、怎么装、怎么用、给个示例。写法就是我们在 Markdown 那一卷学的那些语法，这里不重复。

### Issues：问题与任务的看板

Issues 用来记 bug、待办、功能需求。在仓库的 Issues 标签里 New issue，填标题描述，可以指派给人、加标签（bug/enhancement/question）、设里程碑。修完之后可以手动 Close，也可以在提交信息里写 `fix #1`——提交合并时它会自动关掉 1 号 issue，这种把代码和议题联动起来的做法非常顺手。

### Pull Request：协作的核心

Pull Request（PR）是 GitHub 协作的核心，本质是"请别人审查并合并我的改动"。我们用个比喻：你想给朋友的小说提意见，就先抄一份（fork/branch）、在副本上改、改完把改动发给朋友请他审（pull request）、他觉得好就采纳（merge）。

我们日常的 PR 流程是这样：在自己的特性分支上开发完、push 到 GitHub：

```bash
git push origin feature-login
```

然后打开仓库页面，GitHub 会提示 `feature-login had recent pushes ... [Compare & pull request]`，点进去填标题和描述（说清做了什么、为什么，必要时 `@` 人审查、用 `Closes #5` 联动 issue），点 Create pull request。审查者可以在 diff 上逐行评论、提建议、Approve 或 Request changes；通过后点 Merge pull request 合并。合并方式有三种：Merge commit（保留全部提交历史，新手用默认这个）、Squash and merge（把多个提交压成一个）、Rebase and merge（重新应用提交）。

### Fork：给别人的项目出份力

Fork 是给不是你自己的开源项目做贡献的玩法。流程是：在目标项目右上角点 Fork（在你的账号下复制一份）、`git clone` 你账号下那份到本地、改完 push 回你账号下那份、再在 GitHub 上向原项目发 Pull Request。整个链条就是 fork → clone → 改 → push → PR，跟在自家分支上提 PR 的逻辑一脉相承，只是源头换成了别人的仓库。

顺带一提 Star 是给项目点赞、Watch 是订阅它的更新通知，这俩跟代码无关，按需点。

## 小结

我们把项目搬上 GitHub 跑通了完整链路：注册建仓库、用 `git remote add origin` 连本地、`git push -u` 推上去；认证上别再用密码——要么 PAT、要么干脆配 SSH 密钥（`ssh-keygen` → 公钥贴 GitHub → `git remote set-url` 换成 SSH 地址）一次配好永久免密；日常 `git push`/`git pull` 来回搬，开工先 pull；`git fetch` 只看不合；README 是门面、Issues 跟 bug 和任务、PR 是审查合并的核心、Fork 是给别人的项目贡献。到这里你已经具备在一个 GitHub 项目里完整协作的能力了。

## 下一站

单人的 push/pull 和 PR 都会了，下一篇我们把视角拉到团队——多人协作的标准流程、角色分工、hotfix 怎么走。

> 下一篇：[团队协作流程](./06-team-collaboration)
