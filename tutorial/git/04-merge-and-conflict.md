---
title: 分支合并与冲突
---

### 7.6 合并分支

当你在 `feature-login` 分支上完成了登录功能，想把它合并到 `main` 分支：

**步骤1：切换到目标分支（main）**

```bash
git checkout main
```

记住：**要合并到哪个分支，就先切换到哪个分支**。

**步骤2：合并**

```bash
git merge feature-login
```

输出：

```
Updating a3f5d9c..e8f2a7b
Fast-forward
 login.html | 13 +++++++++++++
 1 file changed, 13 insertions(+)
 create mode 100644 login.html
```

**解释：**

- `Fast-forward` ← 这是一种合并模式，表示"快进"
- `login.html | 13 +++++++++++++` ← 添加了13行代码

现在，`login.html` 在 `main` 分支上也有了！

**步骤3：删除已合并的分支（可选）**

如果 `feature-login` 分支已经完成使命，可以删除它：

```bash
git branch -d feature-login
```

输出：

```
Deleted branch feature-login (was e8f2a7b).
```

**小提示：**

- `-d` 是安全删除，如果分支还没合并，Git会警告你
- `-D` 是强制删除，不管有没有合并都删除（危险！）

### 7.7 合并冲突（重要！）

当两个分支修改了同一个文件的同一部分，合并时就会发生冲突。这是团队协作中最常见的情况，不要害怕它！

#### 什么时候会发生冲突？

**场景模拟：**

1. 你和同事小王都从 `main` 分支创建了自己的分支
2. 你们两人都修改了 `index.html` 的第10行
3. 小王先完成并合并到了 `main`
4. 当你也想合并时，Git发现第10行有两个不同的版本
5. Git不知道该保留谁的，于是报告冲突，让你来决定

#### 实际演练：制造一个冲突

让我们实际操作一遍，这样你就知道怎么处理了。

**步骤1：创建两个分支**

先在 `main` 分支上创建一个文件：

```bash
git checkout main
echo "这是原始内容" > test.txt
git add test.txt
git commit -m "添加test.txt"
```

创建第一个分支并修改文件：

```bash
git checkout -b branch-a
echo "这是分支A的修改" > test.txt
git commit -am "分支A修改test.txt"
```

回到 `main`，创建第二个分支并修改**同一个文件**：

```bash
git checkout main
git checkout -b branch-b
echo "这是分支B的修改" > test.txt
git commit -am "分支B修改test.txt"
```

**步骤2：先合并分支A**

```bash
git checkout main
git merge branch-a
```

没问题，合并成功！

**步骤3：尝试合并分支B（冲突来了！）**

```bash
git merge branch-b
```

你会看到：

```
Auto-merging test.txt
CONFLICT (content): Merge conflict in test.txt
Automatic merge failed; fix conflicts and then commit the result.
```

**翻译：**

- 自动合并 test.txt
- 冲突！test.txt 的内容有冲突
- 自动合并失败，请修复冲突然后提交结果

**不要慌！** 这很正常，我们来解决它。

**步骤4：查看冲突**

打开 `test.txt` 文件，你会看到：

```
<<<<<<< HEAD
这是分支A的修改
=======
这是分支B的修改
>>>>>>> branch-b
```

**详细解释：**

- `<<<<<<< HEAD` 到 `=======` 之间：是当前分支（main，已经合并了branch-a）的内容
- `=======` 到 `>>>>>>> branch-b` 之间：是要合并进来的分支（branch-b）的内容
- Git用这些符号把两个版本都展示给你，让你决定保留哪个

**步骤5：解决冲突**

你有三个选择：

1. **保留分支A的内容**：删除分支B的部分和所有标记符号
2. **保留分支B的内容**：删除分支A的部分和所有标记符号
3. **两个都保留或写一个新的**：删除标记符号，手动编辑

假设我们两个都保留，编辑文件为：

```
这是分支A的修改
这是分支B的修改
```

**一定要删除那些 `<<<<`、`====`、`>>>>` 符号！**

**步骤6：标记冲突已解决**

保存文件后，告诉Git冲突已解决：

```bash
git add test.txt
```

**步骤7：完成合并**

```bash
git commit -m "合并branch-b，解决冲突"
```

或者直接 `git commit`（不加 `-m`），Git会自动生成一个合并提交信息。

**完成！** 冲突解决了！

#### 冲突解决的建议

1. **不要害怕冲突**：这是正常的，说明团队在协作
2. **仔细阅读冲突内容**：理解两个版本的区别
3. **和相关同事沟通**：如果不确定保留哪个，问问对方
4. **测试解决后的代码**：确保合并后的代码能正常工作
5. **经常从main拉取更新**：减少冲突的可能性

### 7.8 分支管理的最佳实践

**分支命名规范：**

- `feature/功能名`：开发新功能，如 `feature/user-login`
- `bugfix/bug描述`：修复bug，如 `bugfix/header-overlap`
- `hotfix/紧急修复`：紧急修复线上问题
- `release/版本号`：准备发布的版本

**团队分支策略（简化版）：**

- `main` 分支：永远保持稳定，可以随时发布
- `develop` 分支：开发分支，功能开发完成后合并到这里
- `feature/*` 分支：个人开发分支，从develop创建，完成后合并回develop
- 定期把develop合并到main进行发布

---

