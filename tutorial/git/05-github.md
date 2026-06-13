---
title: GitHub 完全指南
---

## 第八章：GitHub完全指南

GitHub是全球最大的代码托管平台，几乎所有开发者都在用它。让我们详细学习如何使用GitHub。

### 8.1 注册GitHub账号

**步骤1：访问GitHub**

打开浏览器，访问 https://github.com

**步骤2：注册**

1. 点击右上角的 "Sign up"（注册）按钮
2. 输入你的邮箱地址
3. 创建密码（至少8个字符）
4. 输入用户名（这个用户名会出现在你的GitHub网址里，比如 `github.com/你的用户名`）
5. 选择是否接收营销邮件（建议选No）
6. 完成人机验证（点图片之类的）
7. 点击 "Create account"
8. 查看邮箱，点击验证链接

**步骤3：完善个人资料（可选）**

1. 登录后，点击右上角头像
2. 选择 "Settings"
3. 在 "Profile" 里可以添加：
   - 头像
   - 个人简介
   - 所在地
   - 网站链接等

### 8.2 创建远程仓库

**步骤1：创建新仓库**

1. 登录GitHub
2. 点击右上角的 `+` 号
3. 选择 "New repository"（新建仓库）

**步骤2：填写仓库信息**

你会看到一个表单，让我们逐项填写：

- **Repository name（仓库名称）**：给你的项目起个名字
  - 只能包含字母、数字、连字符和下划线
  - 例如：`my-awesome-project`
- **Description（描述）**：简短描述这个项目是干什么的（可选）
  - 例如："我的第一个Git练习项目"
- **Public or Private（公开还是私有）**：
  - **Public（公开）**：任何人都能看到这个仓库（代码是开源的）
  - **Private（私有）**：只有你和你指定的人能看到
  - 对于学习项目，选Public或Private都可以
- **Initialize this repository with（初始化选项）**：
  - **Add a README file**：是否创建README文件（建议勾选）
  - **Add .gitignore**：选择一个.gitignore模板（如果是网页项目，选"Node"）
  - **Choose a license**：选择开源协议（学习项目可以不选）

**步骤3：创建**

点击绿色的 "Create repository" 按钮。

恭喜！你的第一个GitHub仓库创建好了！

### 8.3 连接本地仓库和GitHub

现在你有了：

- 本地的Git仓库（在你电脑上）
- GitHub的远程仓库（在服务器上）

我们要把它们连接起来。

#### 情况1：你已经有了本地仓库

假设你之前创建了 `my-first-project` 这个本地仓库，现在要上传到GitHub。

**步骤1：在GitHub创建仓库**

按照上面的步骤，创建一个名为 `my-first-project` 的仓库。 **注意**：不要勾选"Initialize this repository with"下的任何选项！

**步骤2：GitHub会给你提示**

创建完成后，GitHub会显示一个页面，上面有一些命令。找到 "…or push an existing repository from the command line" 这部分，会有类似这样的命令：

```bash
git remote add origin https://github.com/你的用户名/my-first-project.git
git branch -M main
git push -u origin main
```

**步骤3：在本地执行这些命令**

在你的项目文件夹里，打开命令行，执行：

```bash
# 添加远程仓库地址
git remote add origin https://github.com/你的用户名/my-first-project.git

# 确保分支名是main（如果已经是main就跳过这步）
git branch -M main

# 推送到GitHub
git push -u origin main
```

**详细解释：**

- `git remote add origin URL`：
  - `remote`：远程仓库
  - `add`：添加
  - `origin`：给远程仓库起的名字（习惯上叫origin，你也可以改成别的）
  - `URL`：远程仓库的地址
- `git branch -M main`：
  - 把当前分支重命名为main（老版本Git默认是master，新版本是main）
- `git push -u origin main`：
  - `push`：推送（上传）
  - `-u`：设置上游分支（以后直接`git push`就行了）
  - `origin`：远程仓库的名字
  - `main`：推送的分支名

**步骤4：输入账号密码**

第一次推送时，会要求你输入GitHub的用户名和密码。

**重要提示（2021年后的变化）：** GitHub已经不支持用密码来push代码了！你需要使用 **Personal Access Token（个人访问令牌）**。

**如何创建Personal Access Token：**

1. 登录GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单最下面 → Developer settings
4. Personal access tokens → Tokens (classic)
5. Generate new token → Generate new token (classic)
6. 填写：
   - Note（备注）：比如"我的电脑"
   - Expiration（过期时间）：选择一个时间，或选No expiration（永不过期）
   - Select scopes（权限）：勾选`repo`（完全控制仓库）
7. 点击 "Generate token"
8. **复制这个token并保存好！** 它只显示一次，以后就看不到了

以后push时，用户名输入你的GitHub用户名，密码输入这个token。

**或者使用SSH密钥（更方便，推荐！）**

SSH方式不需要每次输入密码，配置方法稍后会讲。

**步骤5：查看GitHub**

刷新GitHub页面，你会看到你的代码已经上传了！

#### 情况2：从GitHub克隆项目

如果你要加入一个已有的GitHub项目：

```bash
# 进入你想存放项目的文件夹
cd ~/Desktop

# 克隆项目
git clone https://github.com/用户名/项目名.git

# 进入项目文件夹
cd 项目名
```

一个命令就搞定了！

### 8.4 推送（Push）和拉取（Pull）

#### 推送（Push）：上传你的修改

当你在本地做了新的提交，想上传到GitHub：

```bash
git push origin main
```

如果你之前用了 `-u` 参数设置了上游分支，可以简写为：

```bash
git push
```

**推送的完整流程：**

```bash
# 1. 修改文件
echo "新内容" >> README.md

# 2. 添加到暂存区
git add README.md

# 3. 提交
git commit -m "更新README"

# 4. 推送到GitHub
git push
```

#### 拉取（Pull）：下载最新的修改

当你的队友更新了GitHub上的代码，你想下载最新版本：

```bash
git pull
```

**Pull做了什么？**

- 从GitHub下载最新的提交
- 自动合并到你的当前分支
- 如果有冲突，会提示你解决

**建议：每天开始工作前先pull一下！**

```bash
git pull
```

这样可以避免很多冲突。

#### Fetch：只下载不合并

如果你想先看看远程有什么更新，但不立即合并：

```bash
git fetch origin
```

这会下载更新，但不会影响你的工作区。然后你可以：

```bash
git log origin/main    # 查看远程的提交历史
git diff origin/main   # 查看和远程的区别
git merge origin/main  # 决定合并
```

### 8.5 配置SSH密钥（推荐！）

使用SSH方式可以避免每次都输入密码，非常方便。

#### 步骤1：检查是否已有SSH密钥

```bash
ls -al ~/.ssh
```

如果看到 `id_rsa.pub` 或 `id_ed25519.pub` 文件，说明已经有了，可以跳到步骤3。

#### 步骤2：生成SSH密钥

```bash
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
```

**说明：**

- 如果你的系统不支持ed25519算法，用：`ssh-keygen -t rsa -b 4096 -C "你的邮箱"`

按回车，会提示：

```
Enter file in which to save the key (/Users/你/.ssh/id_ed25519):
```

直接按回车（使用默认路径）。

然后提示：

```
Enter passphrase (empty for no passphrase):
```

可以输入一个密码（更安全），也可以直接按回车（不设密码）。

再按一次回车确认。

密钥生成完成！

#### 步骤3：复制公钥

```bash
cat ~/.ssh/id_ed25519.pub
```

你会看到一长串以 `ssh-ed25519` 开头的文字。全选并复制它。

**或者（Mac）：**

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

这会自动复制到剪贴板。

#### 步骤4：添加到GitHub

1. 登录GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单 → SSH and GPG keys
4. 点击 "New SSH key"
5. Title（标题）：给这个密钥起个名字，比如"我的MacBook"
6. Key（密钥）：粘贴刚才复制的内容
7. 点击 "Add SSH key"

#### 步骤5：测试连接

```bash
ssh -T git@github.com
```

第一次连接会提示：

```
The authenticity of host 'github.com (...)' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

输入 `yes`，按回车。

如果看到：

```
Hi 你的用户名! You've successfully authenticated...
```

说明成功了！

#### 步骤6：更换仓库地址为SSH

如果你的仓库之前用的是HTTPS地址，现在要换成SSH：

```bash
# 查看当前的远程地址
git remote -v

# 更换为SSH地址
git remote set-url origin git@github.com:你的用户名/仓库名.git
```

以后push和pull就不需要输入密码了！

### 8.6 GitHub的重要功能

#### README文件

README.md是项目的"门面"，告诉别人你的项目是干什么的。

**好的README应该包含：**

- 项目标题和简短描述
- 安装方法
- 使用方法
- 示例
- 贡献指南（如果是开源项目）

**Markdown语法速查：**

~~~markdown
# 一级标题
## 二级标题
### 三级标题

**粗体**
*斜体*

- 列表项1
- 列表项2

1. 有序列表1
2. 有序列表2

[链接文字](https://example.com)

![图片描述](图片URL)

```代码块```
~~~

#### Issues（问题跟踪）

Issues用来记录bug、任务、功能需求等。

**创建Issue：**

1. 在仓库页面点击 "Issues" 标签
2. 点击 "New issue"
3. 填写标题和描述
4. 可以：
   - 指派给某人（Assignees）
   - 添加标签（Labels）：bug、enhancement、question等
   - 设置里程碑（Milestones）
5. 点击 "Submit new issue"

**关闭Issue：**

- 在Issue页面点击 "Close issue"
- 或者在提交信息里写 `fix #1`（关闭编号为1的issue）

#### Pull Request（PR）

Pull Request是GitHub协作的核心，用于代码审查。

**什么是Pull Request？**

想象你要给朋友的小说提意见：

- 你复制了一份他的小说（fork）
- 你在副本上做了修改
- 你把修改后的内容发给他，请他审查（pull request）
- 他觉得你的修改不错，就采纳了（merge）

**创建Pull Request：**

1. 在你的分支上完成开发并push到GitHub

```bash
git push origin feature-login
```

2. 访问GitHub仓库页面，会看到提示：

```
feature-login had recent pushes less than a minute ago
[Compare & pull request]
```

3. 点击 "Compare & pull request" 按钮
4. 填写PR信息：
   - 标题：简短描述这次修改
   - 描述：详细说明做了什么，为什么这样做
   - 可以@某人请他审查
   - 可以链接相关Issue（如"Closes #5"）
5. 点击 "Create pull request"

**审查Pull Request：**

作为审查者，你可以：

- 查看代码变更
- 在代码行上添加评论
- 提出修改建议
- 批准（Approve）或请求修改（Request changes）

**合并Pull Request：**

审查通过后，点击 "Merge pull request" 按钮。有三种合并方式：

- **Merge commit**：保留所有提交历史
- **Squash and merge**：把多个提交合并成一个
- **Rebase and merge**：重新应用提交

新手推荐用默认的 "Merge commit"。

#### Fork（分叉）

Fork是GitHub的特色功能，用于给别人的项目做贡献。

**什么是Fork？**

想象你看到一个很棒的开源项目，你想改进它：

1. **Fork**：在GitHub上"复制"一份到你的账号下
2. **Clone**：把你账号下的版本克隆到本地
3. **修改**：在本地做修改
4. **Push**：推送到你账号下的版本
5. **Pull Request**：向原项目提交你的修改

**操作步骤：**

1. 访问你想贡献的项目
2. 点击右上角的 "Fork" 按钮
3. 选择你的账号（会复制一份到你的账号下）
4. 克隆到本地：

```bash
git clone https://github.com/你的用户名/项目名.git
```

5. 做修改，提交，push
6. 在GitHub上创建Pull Request到原项目

#### Star（星标）和 Watch（关注）

- **Star**：给项目点赞，表示你喜欢这个项目
- **Watch**：关注项目，有更新时会通知你

---

