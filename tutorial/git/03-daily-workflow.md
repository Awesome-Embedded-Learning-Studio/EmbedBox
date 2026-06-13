---
title: 日常工作流
---


## 第六章：Git的日常工作流程

现在你已经有了一个Git项目，让我们学习日常工作中最常用的操作流程。

### 6.1 完整的工作流程（重要！）

记住这个流程，以后每天工作都会用到：

```
1. 修改文件（在工作区）
      ↓
2. git add .（添加到暂存区）
      ↓
3. git commit -m "..."（提交到版本库）
      ↓
4. git push（推送到远程仓库，如果有的话）
```

这就像一个生产线：

1. 在工厂里生产零件（修改文件）
2. 把零件放到待检区（git add）
3. 质检通过，打包装箱（git commit）
4. 发货到仓库（git push）

### 6.2 实际操作演练

让我们做一个完整的工作流程演练：

#### 场景：给项目添加一个新功能

**步骤1：修改文件**

假设你要添加一个 `index.html` 文件。用你喜欢的编辑器创建文件：

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的第一个网页</title>
</head>
<body>
    <h1>欢迎来到我的网站！</h1>
    <p>这是我用Git管理的第一个网页项目。</p>
</body>
</html>
```

保存文件。

**步骤2：查看状态**

```bash
git status
```

输出：

```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        index.html

nothing added to commit but untracked files present (use "git add" to track)
```

Git发现了新文件 `index.html`，但它还是"未跟踪"状态。

**步骤3：添加到暂存区**

```bash
git add index.html
```

或者添加所有修改：

```bash
git add .
```

**步骤4：再次查看状态**

```bash
git status
```

输出：

```
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   index.html
```

现在文件在暂存区了，准备提交！

**步骤5：提交**

```bash
git commit -m "添加首页index.html"
```

输出：

```
[main b7d8a2f] 添加首页index.html
 1 file changed, 10 insertions(+)
 create mode 100644 index.html
```

完成！你的修改已经被永久保存了。

**步骤6：查看历史**

```bash
git log --oneline
```

输出：

```
b7d8a2f (HEAD -> main) 添加首页index.html
a3f5d9c 初始化项目，添加README文件
```

现在有两次提交了！

### 6.3 修改已有文件

现在让我们修改已经存在的文件：

**步骤1：编辑 index.html**

打开 `index.html`，添加一段内容：

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的第一个网页</title>
</head>
<body>
    <h1>欢迎来到我的网站！</h1>
    <p>这是我用Git管理的第一个网页项目。</p>
    <p>这是新添加的内容！</p> <!-- 这是新加的 -->
</body>
</html>
```

保存。

**步骤2：查看状态**

```bash
git status
```

输出：

```
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   index.html

no changes added to commit (use "git add" and/or "git commit -a")
```

**解释：**

- `Changes not staged for commit` ← 有修改，但还没放到暂存区
- `modified: index.html` ← 这个文件被修改了

**步骤3：查看具体修改了什么**

```bash
git diff
```

输出类似这样：

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

**解释：**

- 绿色的 `+` 开头的行是新增的内容
- 红色的 `-` 开头的行是删除的内容（这里没有）

按 `q` 退出查看。

**步骤4：添加和提交**

```bash
git add index.html
git commit -m "在首页添加新段落"
```

或者用一个快捷方式（适用于修改已跟踪的文件）：

```bash
git commit -am "在首页添加新段落"
```

**说明：**

- `-a` 选项会自动把所有已跟踪的文件的修改加入暂存区
- `-m` 后面跟提交信息
- `-am` 就是把两个选项合并了

但是注意：`-a` 只对已经被Git跟踪的文件有效，新文件还是要先 `git add`。

### 6.4 删除文件

假设你想删除一个文件：

**方法1：直接删除文件，然后告诉Git**

```bash
rm index.html          # 删除文件（Unix/Mac）
del index.html         # 删除文件（Windows CMD）
git add index.html     # 告诉Git这个删除操作
git commit -m "删除index.html"
```

**方法2：用Git命令删除（推荐）**

```bash
git rm index.html
git commit -m "删除index.html"
```

`git rm` 命令会同时删除文件并告诉Git，一步到位。

### 6.5 重命名文件

假设你想把 `index.html` 改名为 `home.html`：

**方法1：手动改名，然后告诉Git**

```bash
mv index.html home.html    # 重命名（Unix/Mac）
git add home.html
git add index.html
git commit -m "重命名index.html为home.html"
```

**方法2：用Git命令重命名（推荐）**

```bash
git mv index.html home.html
git commit -m "重命名index.html为home.html"
```

一步到位！

### 6.6 忽略某些文件

有些文件我们不想提交到Git，比如：

- 编译生成的文件
- 临时文件
- 包含密码的配置文件
- 系统文件（如Mac的 `.DS_Store`）
- 依赖包文件夹（如 `node_modules/`）

**如何忽略文件？**

创建一个 `.gitignore` 文件：

```bash
touch .gitignore
```

编辑这个文件，添加要忽略的文件或文件夹：

```
# 忽略所有.log文件
*.log

# 忽略临时文件夹
temp/
tmp/

# 忽略Mac系统文件
.DS_Store

# 忽略Node.js的依赖包
node_modules/

# 忽略配置文件中的敏感信息
config/secrets.txt
```

然后提交 `.gitignore`：

```bash
git add .gitignore
git commit -m "添加.gitignore文件"
```

现在，`.gitignore` 里列出的文件就不会被Git跟踪了。

---

## 第七章：分支操作详解

分支是Git最强大的功能，也是团队协作的核心。让我们详细学习分支的使用。

### 7.1 为什么需要分支？（再次强调）

想象一个真实场景：

你们团队在开发一个电商网站：

- 网站现在是v1.0版本，正在线上运行
- 你要开发一个新功能：购物车
- 这个功能需要2周时间
- 但在这2周里，可能会有紧急bug需要修复

**没有分支的情况：**

- 你在主代码上开发购物车功能
- 第3天，发现了一个紧急bug
- 但你的购物车功能还没完成，代码是半成品
- 你无法发布修复，因为会把半成品购物车也发布了
- 你进退两难！

**有分支的情况：**

```
main分支（稳定）:     o---o---o---o---o---o
                          \         \
feature-cart分支:          o---o---o  ← 你在这里开发购物车
                                \
hotfix分支:                      o  ← 紧急修复bug
```

- 你创建 `feature-cart` 分支开发购物车
- 发现紧急bug时，从 `main` 分支创建 `hotfix` 分支
- 在 `hotfix` 分支上修复bug，然后合并回 `main` 并发布
- 购物车功能不受影响，继续在 `feature-cart` 分支上开发
- 完成后再合并回 `main`

### 7.2 查看分支

**查看所有本地分支：**

```bash
git branch
```

输出：

```
* main
```

`*` 号表示你当前在哪个分支上。

**查看所有分支（包括远程分支）：**

```bash
git branch -a
```

### 7.3 创建分支

**创建一个新分支：**

```bash
git branch feature-login
```

这会创建一个叫 `feature-login` 的分支，但你还在 `main` 分支上。

**验证：**

```bash
git branch
```

输出：

```
  feature-login
* main
```

看到了吧，有两个分支了，但 `*` 还在 `main` 上。

### 7.4 切换分支

**切换到新分支：**

```bash
git checkout feature-login
```

或者用新命令（Git 2.23+）：

```bash
git switch feature-login
```

输出：

```
Switched to branch 'feature-login'
```

**验证：**

```bash
git branch
```

输出：

```
* feature-login
  main
```

现在 `*` 在 `feature-login` 上了！

**创建并切换分支（快捷方式）：**

```bash
git checkout -b feature-payment
```

或者：

```bash
git switch -c feature-payment
```

这一个命令相当于：

```bash
git branch feature-payment    # 创建分支
git checkout feature-payment  # 切换过去
```

### 7.5 在分支上工作

现在你在 `feature-login` 分支上，让我们添加一个登录页面：

创建 `login.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>登录</title>
</head>
<body>
    <h1>用户登录</h1>
    <form>
        <input type="text" placeholder="用户名">
        <input type="password" placeholder="密码">
        <button>登录</button>
    </form>
</body>
</html>
```

提交：

```bash
git add login.html
git commit -m "添加登录页面"
```

现在切回 `main` 分支：

```bash
git checkout main
```

**神奇的事情发生了：**

打开你的项目文件夹，`login.html` 消失了！

再切回 `feature-login` 分支：

```bash
git checkout feature-login
```

`login.html` 又出现了！

**这就是分支的魔法：**

- 每个分支有自己独立的文件状态
- 切换分支时，工作区的文件会自动变化
- 就像在不同的平行宇宙之间穿梭

