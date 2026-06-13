---
title: 团队协作流程
---

## 第九章：团队协作完整流程

现在让我们把所有知识串起来，看看一个真实团队是如何协作的。

### 9.1 团队成员角色

一个典型的团队：

- **项目负责人（Maintainer）**：管理整个项目，审查PR，决定合并
- **开发者（Developer）**：开发新功能，修复bug
- **贡献者（Contributor）**：偶尔贡献代码的外部人员

### 9.2 标准工作流程（完整版）

#### 作为新成员加入项目

**第1步：获取项目权限**

项目负责人需要把你加入GitHub仓库：

1. 仓库页面 → Settings → Collaborators
2. 添加你的GitHub用户名

你会收到邮件邀请，点击接受。

**第2步：克隆项目**

```bash
# 克隆项目到本地
git clone https://github.com/团队/项目名.git

# 进入项目文件夹
cd 项目名

# 查看分支
git branch -a
```

**第3步：了解项目结构**

阅读README文件，了解：

- 项目是干什么的
- 如何运行项目
- 代码结构是什么样的
- 有什么开发规范

#### 开始开发新功能

**第1步：确保代码是最新的**

```bash
# 切换到主分支
git checkout main

# 拉取最新代码
git pull origin main
```

**重要**：每次开始新功能前都要pull，确保基于最新代码！

**第2步：创建功能分支**

```bash
# 创建并切换到新分支
git checkout -b feature/user-profile

# 或者按照团队规范命名，比如：
# git checkout -b feature/你的名字-功能描述
```

**第3步：开发功能**

在你的分支上自由开发：

```bash
# 修改文件...

# 经常提交（每完成一个小功能就提交）
git add .
git commit -m "添加用户头像上传功能"

# 继续修改...
git add .
git commit -m "添加头像裁剪功能"

# 继续修改...
git add .
git commit -m "添加头像预览功能"
```

**小提示**：

- 每个提交应该是一个"原子性"的修改（一个完整的小功能）
- 提交信息要清楚
- 经常提交，不要攒一大堆修改

**第4步：推送到GitHub**

```bash
git push origin feature/user-profile
```

第一次推送这个分支可能会提示：

```
fatal: The current branch feature/user-profile has no upstream branch.
```

按照提示执行：

```bash
git push --set-upstream origin feature/user-profile
```

或者简写：

```bash
git push -u origin feature/user-profile
```

**第5步：同步主分支的更新**

如果开发时间比较长（比如几天），主分支可能已经有了新的提交。你需要把这些更新合并到你的分支：

```bash
# 确保主分支是最新的
git checkout main
git pull origin main

# 回到你的分支
git checkout feature/user-profile

# 把主分支的更新合并进来
git merge main
```

如果有冲突，解决冲突（参考第七章）。

**或者使用rebase（进阶）：**

```bash
git rebase main
```

Rebase会让提交历史更清晰，但对新手来说merge更安全。

**第6步：创建Pull Request**

功能开发完成后：

1. 访问GitHub仓库

2. 会看到黄色提示框，点击 "Compare & pull request"

3. 填写PR信息：

   - 标题：简洁明了，如"添加用户头像功能"

   - 描述：

     ```
     ## 这个PR做了什么？- 添加了头像上传功能- 添加了头像裁剪功能- 添加了头像预览功能## 测试- [x] 本地测试通过- [x] 上传头像正常- [x] 裁剪功能正常## 截图（如果是UI改动，贴上截图）Closes #15  （如果解决了某个Issue）
     ```

4. 选择审查者（Reviewers）

5. 点击 "Create pull request"

**第7步：等待审查**

队友会审查你的代码，可能会：

- 提出修改建议
- 要求你修改某些地方
- 批准你的PR

如果需要修改：

```bash
# 在你的分支上继续修改
git checkout feature/user-profile

# 修改文件...
git add .
git commit -m "根据审查意见修复问题"

# 推送
git push origin feature/user-profile
```

GitHub会自动更新你的PR。

**第8步：合并**

审查通过后，负责人会点击 "Merge pull request" 按钮。你的代码就进入主分支了！

**第9步：清理**

合并后，清理本地分支：

```bash
# 切回主分支
git checkout main

# 拉取最新代码（包含你刚合并的功能）
git pull origin main

# 删除功能分支
git branch -d feature/user-profile

# 删除远程分支（GitHub上会自动删除，但也可以手动删）
git push origin --delete feature/user-profile
```

完整流程结束！

### 9.3 日常工作习惯

**每天开始工作：**

```bash
git checkout main
git pull origin main
git checkout -b feature/今天要做的功能
```

**开发过程中（每隔1-2小时）：**

```bash
git add .
git commit -m "完成了某个小功能"
git push origin feature/今天要做的功能
```

**每天结束工作：**

```bash
# 确保所有修改都提交和推送了
git status  # 应该显示"working tree clean"
git push origin feature/今天要做的功能
```

**功能完成时：**

```bash
# 同步主分支
git checkout main
git pull origin main
git checkout feature/今天要做的功能
git merge main

# 推送并创建PR
git push origin feature/今天要做的功能
# 然后去GitHub创建Pull Request
```

### 9.4 常见协作场景

#### 场景1：同时开发不同功能

**情况**：

- 你在开发"用户登录"功能
- 同事在开发"商品搜索"功能

**解决方案**：

- 各自创建自己的分支
- 互不干扰地开发
- 完成后分别创建PR
- 依次合并到主分支

```
main:        o---o---o-------o-------o
                  \         /       /
feature-login:     o---o---o       /
                    \             /
feature-search:      o---o---o---o
```

#### 场景2：依赖别人的功能

**情况**：

- 同事小王在开发"用户认证"模块
- 你的"个人中心"功能依赖他的认证模块

**解决方案**：

- 等小王完成并合并到main
- 你从最新的main创建分支
- 或者从小王的分支创建分支（不推荐）

```bash
# 等小王合并后
git checkout main
git pull origin main
git checkout -b feature/user-center
```

#### 场景3：紧急修复线上bug

**情况**：

- 你正在开发新功能（还没完成）
- 突然发现线上有个紧急bug需要修复

**解决方案**：

```bash
# 1. 暂存当前工作
git stash

# 2. 切到主分支创建hotfix分支
git checkout main
git pull origin main
git checkout -b hotfix/紧急bug描述

# 3. 修复bug
# 修改文件...
git add .
git commit -m "修复紧急bug"
git push origin hotfix/紧急bug描述

# 4. 创建PR并快速合并

# 5. 回到你的功能分支
git checkout feature/你的功能
git stash pop  # 恢复之前的工作

# 6. 合并hotfix的修复
git merge main
```

**git stash的详细说明：**

```bash
git stash              # 暂存当前修改
git stash list         # 查看暂存列表
git stash pop          # 恢复最近的暂存并删除
git stash apply        # 恢复暂存但不删除
git stash drop         # 删除暂存
git stash clear        # 清空所有暂存
```

---

