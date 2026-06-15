---
title: 速查 · FAQ · 进阶 · 总结
---

# 速查 · FAQ · 进阶

前面六篇我们把 Git 从零讲到团队协作，是连贯的叙事。这一篇不一样——它是你的**案头参考**，不追求顺着读。命令忘了、某个报错没见过、想查个进阶技巧，回来翻这里就行。我们按命令速查、常见问题、进阶与最佳实践几块来组织，最后附一张能打印贴墙上的快速命令卡片。

## 第十章：Git常用命令速查

这里整理了最常用的Git命令，建议打印出来贴在电脑旁！

### 10.1 基础操作

```bash
# 初始化仓库
git init

# 克隆仓库
git clone <url>

# 查看状态
git status

# 查看修改内容
git diff                    # 查看工作区和暂存区的区别
git diff --staged           # 查看暂存区和版本库的区别
git diff HEAD              # 查看工作区和版本库的区别

# 添加文件到暂存区
git add <file>              # 添加单个文件
git add .                   # 添加所有修改（最常用！）
git add *.js                # 添加所有js文件

# 提交
git commit -m "提交信息"     # 提交暂存区的内容
git commit -am "提交信息"    # 添加并提交（仅对已跟踪文件有效）
git commit --amend          # 修改最后一次提交

# 查看历史
git log                     # 查看详细历史
git log --oneline           # 查看简洁历史
git log --graph             # 查看分支图
git log --all --graph --oneline  # 查看所有分支的图形历史
```

### 10.2 分支操作

```bash
# 查看分支
git branch                  # 查看本地分支
git branch -a               # 查看所有分支（含远程）
git branch -r               # 只看远程分支

# 创建分支
git branch <分支名>          # 创建分支
git checkout -b <分支名>     # 创建并切换（旧方式）
git switch -c <分支名>       # 创建并切换（新方式）

# 切换分支
git checkout <分支名>        # 切换分支（旧方式）
git switch <分支名>          # 切换分支（新方式）

# 合并分支
git merge <分支名>           # 合并指定分支到当前分支

# 删除分支
git branch -d <分支名>       # 删除本地分支（安全删除）
git branch -D <分支名>       # 强制删除本地分支
git push origin --delete <分支名>  # 删除远程分支
```

### 10.3 远程操作

```bash
# 查看远程仓库
git remote                  # 查看远程仓库名称
git remote -v               # 查看远程仓库地址

# 添加远程仓库
git remote add origin <url>

# 修改远程仓库地址
git remote set-url origin <new-url>

# 拉取和推送
git fetch origin            # 下载远程更新但不合并
git pull origin main        # 拉取并合并
git pull                    # 拉取当前分支
git push origin main        # 推送到远程
git push                    # 推送当前分支
git push -u origin main     # 首次推送并设置上游分支

# 查看远程分支
git branch -r
```

### 10.4 撤销操作

```bash
# 撤销工作区的修改
git checkout -- <file>      # 恢复单个文件
git checkout -- .           # 恢复所有文件
git restore <file>          # 恢复文件（新命令）

# 撤销暂存区的修改（不删除工作区的修改）
git reset HEAD <file>       # 取消暂存单个文件
git restore --staged <file> # 取消暂存（新命令）

# 撤销提交
git reset --soft HEAD~1     # 撤销提交，保留修改在暂存区
git reset --mixed HEAD~1    # 撤销提交，保留修改在工作区（默认）
git reset --hard HEAD~1     # 撤销提交，删除所有修改（危险！）

# 回退到指定版本
git reset --hard <commit-id>  # 回退到指定提交（危险！）
git revert <commit-id>       # 创建新提交来撤销指定提交（安全）
```

### 10.5 暂存操作

```bash
# 暂存当前修改
git stash
git stash save "暂存说明"

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop               # 恢复最近的暂存并删除
git stash apply            # 恢复暂存但不删除
git stash apply stash@{0}  # 恢复指定暂存

# 删除暂存
git stash drop stash@{0}   # 删除指定暂存
git stash clear            # 清空所有暂存
```

### 10.6 标签操作

```bash
# 创建标签
git tag v1.0.0              # 创建轻量标签
git tag -a v1.0.0 -m "版本1.0.0"  # 创建附注标签

# 查看标签
git tag                     # 列出所有标签
git show v1.0.0            # 查看标签详情

# 推送标签
git push origin v1.0.0     # 推送单个标签
git push origin --tags     # 推送所有标签

# 删除标签
git tag -d v1.0.0          # 删除本地标签
git push origin --delete v1.0.0  # 删除远程标签
```

### 10.7 配置相关

```bash
# 用户配置
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 查看配置
git config --list           # 查看所有配置
git config user.name       # 查看某项配置

# 设置默认编辑器
git config --global core.editor "code --wait"  # VSCode
git config --global core.editor "vim"          # Vim

# 设置别名
git config --global alias.st status     # git st = git status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```

---

## 第十一章：常见问题和解决方案

### 11.1 提交相关问题

#### 问题1：提交了错误的文件

**场景**：不小心把不该提交的文件（如密码文件）提交了。

**解决方案**：

如果还没push：

```bash
# 撤销最后一次提交，保留修改
git reset --soft HEAD~1

# 移除不该提交的文件
git reset HEAD 错误文件.txt

# 重新提交
git add .
git commit -m "正确的提交"
```

如果已经push：

```bash
# 删除文件
git rm 错误文件.txt

# 提交删除
git commit -m "删除错误提交的文件"

# 推送
git push
```

**注意**：即使删除了，文件内容仍然在历史记录里！如果是密码等敏感信息，需要修改密码。

#### 问题2：提交信息写错了

**场景**：提交信息有错别字或描述不准确。

**解决方案**：

如果还没push：

```bash
# 修改最后一次提交的信息
git commit --amend -m "正确的提交信息"
```

如果已经push：

- 最好不要修改已推送的提交
- 如果必须修改，会很麻烦且可能影响其他人
- 建议就让它这样吧，下次注意

#### 问题3：忘记添加文件到提交

**场景**：提交后发现漏了一个文件。

**解决方案**：

如果还没push：

```bash
# 添加漏掉的文件
git add 漏掉的文件.txt

# 追加到上次提交
git commit --amend --no-edit
```

`--no-edit` 表示不修改提交信息。

#### 问题4：提交了太多次，想合并提交

**场景**：你提交了10次小修改，想合并成1次提交。

**解决方案（使用rebase）：**

```bash
# 交互式rebase最近的10次提交
git rebase -i HEAD~10
```

会打开编辑器，显示：

```
pick a3f5d9c 提交1
pick b7d8a2f 提交2
pick c9e6f1d 提交3
...
```

把第2次及以后的 `pick` 改成 `squash` 或 `s`：

```
pick a3f5d9c 提交1
squash b7d8a2f 提交2
squash c9e6f1d 提交3
...
```

保存退出，Git会让你编辑合并后的提交信息。

**注意**：不要rebase已经push的提交！

### 11.2 分支相关问题

#### 问题5：切换分支时提示有未提交的修改

**场景**：

```
error: Your local changes to the following files would be overwritten by checkout
```

**解决方案1**：提交修改

```bash
git add .
git commit -m "临时提交"
```

**解决方案2**：暂存修改

```bash
git stash
git checkout 其他分支
# 回来后恢复
git checkout 原分支
git stash pop
```

**解决方案3**：放弃修改

```bash
git checkout -- .
git checkout 其他分支
```

#### 问题6：删除了不该删的分支

**场景**：不小心删除了还需要的分支。

**解决方案**：

如果刚删除，可以找回：

```bash
# 查看所有操作记录
git reflog

# 找到那个分支最后的commit id
# 然后创建新分支指向它
git checkout -b 分支名 <commit-id>
```

#### 问题7：合并冲突后不知道怎么办

**场景**：执行merge后出现冲突，不知道如何继续。

**解决方案**：

查看冲突状态：

```bash
git status
```

会列出冲突的文件，打开它们，手动解决冲突（参考第七章）。

如果实在解决不了，放弃合并：

```bash
git merge --abort
```

如果已经解决了冲突：

```bash
git add 冲突文件.txt
git commit -m "解决合并冲突"
```

### 11.3 远程操作问题

#### 问题8：push被拒绝

**错误信息**：

```
! [rejected] main -> main (fetch first)
error: failed to push some refs to 'https://github.com/...'
```

**原因**：远程有你本地没有的提交。

**解决方案**：

```bash
# 先拉取远程更新
git pull origin main

# 如果有冲突，解决冲突

# 再推送
git push origin main
```

#### 问题9：push需要密码但记不住

**场景**：每次push都要输入用户名和密码。

**解决方案**：配置SSH密钥（参考第八章8.5节）。

或者使用credential helper：

```bash
# 存储密码
git config --global credential.helper store

# Mac用户
git config --global credential.helper osxkeychain

# Windows用户
git config --global credential.helper wincred
```

#### 问题10：错误的远程地址

**场景**：添加了错误的远程仓库地址。

**解决方案**：

```bash
# 查看当前远程地址
git remote -v

# 修改地址
git remote set-url origin 正确的地址

# 或者删除后重新添加
git remote remove origin
git remote add origin 正确的地址
```

### 11.4 文件操作问题

#### 问题11：想忽略已经提交的文件

**场景**：忘记添加.gitignore，已经提交了不该提交的文件。

**解决方案**：

```bash
# 1. 创建或编辑.gitignore，添加要忽略的文件

# 2. 从Git中删除文件（但保留本地文件）
git rm --cached 要忽略的文件.txt

# 3. 提交
git commit -m "停止跟踪某文件"

# 4. 推送
git push
```

#### 问题12：误删了文件想恢复

**场景**：删除了文件，还没提交。

**解决方案**：

```bash
# 恢复文件
git checkout -- 文件名.txt
```

**场景**：删除并提交了。

**解决方案**：

```bash
# 查看历史，找到删除前的commit id
git log -- 文件名.txt

# 恢复文件
git checkout <commit-id> -- 文件名.txt

# 提交
git add 文件名.txt
git commit -m "恢复误删的文件"
```

#### 问题13：大文件提交失败

**错误信息**：

```
remote: error: File 大文件.zip is 150.00 MB; this exceeds GitHub's file size limit of 100.00 MB
```

**解决方案**：

从提交中移除大文件：

```bash
# 撤销提交
git reset --soft HEAD~1

# 移除大文件
git reset HEAD 大文件.zip

# 添加到.gitignore
echo "大文件.zip" >> .gitignore

# 重新提交
git add .
git commit -m "移除大文件"
```

**建议**：大文件应该：

- 不要提交到Git
- 使用Git LFS（Large File Storage）
- 放到云存储服务

### 11.5 协作问题

#### 问题14：不小心在main分支上开发了

**场景**：忘记创建功能分支，直接在main上写代码了。

**解决方案**（如果还没提交）：

```bash
# 暂存当前修改
git stash

# 创建新分支
git checkout -b feature/我的功能

# 恢复修改
git stash pop

# 正常提交
git add .
git commit -m "完成功能"
```

**解决方案**（如果已经提交但没push）：

```bash
# 创建新分支（会带着当前的提交）
git checkout -b feature/我的功能

# 回退main分支
git checkout main
git reset --hard origin/main
```

#### 问题15：队友的分支合并后出现问题

**场景**：队友的代码合并到main后，导致项目无法运行。

**解决方案**：

临时回退main：

```bash
# 查看提交历史
git log --oneline

# 回退到出问题前的提交
git reset --hard <出问题前的commit-id>

# 强制推送（危险！最好和团队商量）
git push -f origin main
```

更好的做法：

```bash
# 使用revert创建新提交来撤销
git revert <有问题的commit-id>
git push origin main
```

revert的好处是不会改写历史，更安全。

---

## 第十二章：最佳实践和进阶技巧

### 12.1 提交最佳实践

#### 提交信息规范

好的提交信息应该：

- 第一行：简短的标题（50字符以内）
- 空一行
- 详细描述（如果需要）

**规范格式：**

```
类型: 简短描述

详细说明（可选）

相关Issue（可选）
```

**常用类型：**

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档修改
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

**例子：**

```
feat: 添加用户登录功能

- 实现用户名/密码登录
- 添加登录表单验证
- 集成JWT token认证

Closes #23
```

#### 提交频率

- **太频繁**：每改一个字就提交 ❌
- **太少**：一周就一次提交 ❌
- **刚刚好**：每完成一个小功能就提交 ✅

**建议**：

- 每1-2小时提交一次
- 每完成一个独立的小功能提交一次
- 下班前提交一次
- 提交前测试一下，确保代码能运行

#### 原子性提交

每次提交应该是一个"原子性"的修改：

- 只做一件事
- 可以独立理解
- 可以独立回退

❌ 不好的例子：

```
git commit -m "修改了登录、注册、个人中心，修复了3个bug，更新了文档"
```

✅ 好的例子：

```
git commit -m "添加用户登录功能"
git commit -m "添加用户注册功能"
git commit -m "修复登录按钮无响应问题"
```

### 12.2 分支管理最佳实践

#### Git Flow工作流

这是一个流行的分支管理策略：

```
main (或 master)      ← 生产环境，随时可发布
  |
develop               ← 开发主分支
  |\
  | feature-a         ← 功能分支
  | feature-b
  |
  release-1.0         ← 发布准备分支
  |
  hotfix-urgent       ← 紧急修复分支
```

**分支说明：**

- `main`: 生产环境代码，只能从release或hotfix合并
- `develop`: 开发主分支，所有功能开发的基础
- `feature/*`: 功能分支，从develop创建，完成后合并回develop
- `release/*`: 发布准备分支，从develop创建，准备好后合并到main和develop
- `hotfix/*`: 紧急修复分支，从main创建，修复后合并到main和develop

#### 简化的分支策略（推荐新手）

```
main                  ← 主分支，稳定版本
  |\
  | feature-login     ← 功能分支
  | feature-payment
  |
  hotfix-bug          ← 修复分支
```

只需要：

- `main`: 主分支
- `feature/*`: 功能分支
- `hotfix/*`: 修复分支

### 12.3 代码审查（Code Review）

#### 为什么需要代码审查？

- 发现潜在的bug
- 保持代码质量
- 分享知识
- 统一代码风格
- 减少技术债务

#### 如何做好代码审查？

**作为提交者：**

1. 提交前自己先审查一遍
2. PR描述清楚做了什么、为什么这样做
3. 代码要有注释
4. 虚心接受建议

**作为审查者：**

1. 及时审查（不要让PR等太久）
2. 提出建设性的意见
3. 先表扬优点，再指出问题
4. 用疑问句代替命令句："这里是否可以..."

#### Pull Request的描述模板

```markdown
## 改动说明
简要描述这个PR做了什么

## 改动原因
为什么需要这个改动？解决了什么问题？

## 改动内容
- 添加了XX功能
- 修改了YY模块
- 删除了ZZ代码

## 测试
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 在不同浏览器测试

## 截图（如果有UI改动）
贴上改动前后的截图

## 相关Issue
Closes #123
Related to #456
```

### 12.4 效率提升技巧

#### 使用别名

创建Git命令的快捷方式：

```bash
# 在~/.gitconfig中添加
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --graph --oneline --all
    last = log -1 HEAD
    uncommit = reset --soft HEAD~1
    unstage = reset HEAD
```

使用：

```bash
git st      # 相当于 git status
git co main # 相当于 git checkout main
git lg      # 查看图形化历史
```

#### 使用图形化工具

命令行不习惯？试试这些GUI工具：

- **GitHub Desktop**：简单易用，适合新手
- **SourceTree**：功能强大
- **GitKraken**：界面美观
- **VSCode内置Git**：编辑器集成

#### 使用.gitignore模板

GitHub提供了各种语言的.gitignore模板： https://github.com/github/gitignore

比如Node.js项目的.gitignore：

```
node_modules/
.env
.DS_Store
*.log
dist/
build/
```

#### 设置全局.gitignore

有些文件在所有项目中都不想提交：

```bash
# 创建全局gitignore文件
touch ~/.gitignore_global

# 配置Git使用它
git config --global core.excludesfile ~/.gitignore_global
```

在`~/.gitignore_global`中添加：

```
# macOS
.DS_Store
.AppleDouble
.LSOverride

# Windows
Thumbs.db
Desktop.ini

# 编辑器
.vscode/
.idea/
*.swp
*.swo

# 其他
.env.local
.env
```

### 12.5 团队协作技巧

#### 每天的例行工作

**早上到公司：**

```bash
git checkout main
git pull origin main
git checkout -b feature/今天的功能
```

**开发过程中（每隔1-2小时）：**

```bash
git add .
git commit -m "完成了XX"
git push origin feature/今天的功能
```

**下班前：**

```bash
git status          # 确认没有未提交的修改
git push            # 确保代码已上传
```

#### 沟通最佳实践

- 使用Issue跟踪任务和bug
- PR描述要详细，方便审查
- 及时回应别人的PR审查
- 遇到冲突先沟通再解决
- 定期开会同步进度

#### 文档建议

在项目根目录创建这些文件：

- `README.md`: 项目介绍和使用说明
- `CONTRIBUTING.md`: 如何贡献代码
- `.gitignore`: 忽略文件列表
- `LICENSE`: 开源协议（如果开源）

### 12.6 安全建议

#### 不要提交敏感信息

永远不要提交：

- 密码
- API密钥
- 数据库连接字符串
- 私钥
- 个人信息

如果不小心提交了：

1. 立即修改密码/密钥
2. 从Git历史中删除（很复杂，最好找有经验的人帮忙）
3. 以后使用环境变量存储敏感信息

#### 使用.env文件

```bash
# .env文件（不要提交！）
DATABASE_PASSWORD=secret123
API_KEY=your_api_key

# .gitignore
.env
```

创建`.env.example`作为模板（可以提交）：

```bash
# .env.example
DATABASE_PASSWORD=your_password_here
API_KEY=your_api_key_here
```

---

## 第十三章：总结和下一步

### 13.1 回顾核心概念

让我们回顾一下Git的核心概念：

1. **仓库（Repository）**：被Git管理的文件夹
2. **工作区**：你修改文件的地方
3. **暂存区**：准备提交的修改
4. **版本库**：永久保存的提交历史
5. **提交（Commit）**：项目的快照
6. **分支（Branch）**：独立的开发线
7. **远程仓库**：云端的代码备份

### 13.2 核心工作流程

记住这个黄金流程：

```
1. git pull           # 拉取最新代码
2. git checkout -b 分支名  # 创建新分支
3. 修改代码...
4. git add .          # 添加修改
5. git commit -m "说明"  # 提交
6. git push           # 推送
7. 创建Pull Request  # 请求审查
8. 合并到主分支      # 完成！
```

### 13.3 从新手到熟练的路径

**第1周：基础操作**

- 熟练使用add、commit、push、pull
- 能够创建和切换分支
- 理解工作区、暂存区、版本库的概念

**第2-4周：分支和协作**

- 熟练使用分支进行开发
- 学会解决合并冲突
- 参与团队的PR审查

**第1-3个月：进阶技能**

- 掌握rebase、cherry-pick等高级命令
- 能够处理复杂的合并场景
- 制定团队的Git规范

**持续学习：**

- 阅读Git官方文档
- 关注最佳实践
- 学习其他人的工作流程

### 13.4 常用资源

**学习资源：**

- [Pro Git](https://git-scm.com/book/zh/v2) - 官方权威教程（中文版）
- [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN) - 可视化交互式教程
- [GitHub Skills](https://skills.github.com/) - GitHub官方课程

**查询资源：**

- [Git命令大全](https://git-scm.com/docs)
- [Oh My Git!](https://ohmygit.org/) - 游戏化学习Git
- Stack Overflow - 遇到问题搜索解决方案

**工具推荐：**

- [GitHub Desktop](https://desktop.github.com/) - 图形化界面
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - VSCode插件
- [tig](https://jonas.github.io/tig/) - 命令行图形化工具

### 13.5 给团队新成员的建议

1. **不要害怕犯错**
   - Git几乎可以撤销任何操作
   - 本地操作很难真正搞坏东西
   - 多尝试，多练习
2. **养成好习惯**
   - 经常提交
   - 写清楚的提交信息
   - 每天开始工作前先pull
   - 使用分支开发功能
3. **多和团队沟通**
   - 不确定的操作先问问
   - 遇到冲突和相关同事讨论
   - 分享你的经验和困惑
4. **持续学习**
   - Git命令很多，不需要全记住
   - 掌握常用的就够了
   - 遇到问题再查资料
5. **使用合适的工具**
   - 命令行不习惯就用GUI
   - 找到适合自己的工作方式
   - 工具是为了提高效率，不是目的

### 13.6 最后的话

恭喜你读完了这篇教程！Git一开始可能看起来很复杂，但其实核心概念就那么几个：

- **提交**：保存快照
- **分支**：平行开发
- **合并**：整合代码
- **远程**：团队协作

记住这个简单的日常流程：

```bash
git pull        # 拉取
修改代码
git add .       # 添加
git commit -m   # 提交
git push        # 推送
```

**85%的日常工作就是这5个命令！**

遇到问题不要慌：

1. 先Google搜索错误信息
2. 查看Git官方文档
3. 询问团队成员
4. 实在不行，重新克隆项目（最后的手段）

Git是一个强大的工具，但记住：

- **工具是为人服务的，不是人为工具服务**
- **重要的是协作，不是炫技**
- **清晰的沟通比完美的Git历史更重要**

现在，打开命令行，创建你的第一个Git项目吧！祝你在 Git 的世界里玩得开心。

---

**附录：快速命令参考卡片**

```bash
# 📋 每天都用
git status          # 查看状态
git add .           # 添加所有修改
git commit -m "..."  # 提交
git push            # 推送
git pull            # 拉取

# 🌿 分支操作
git branch          # 查看分支
git checkout -b xxx # 创建并切换分支
git merge xxx       # 合并分支

# 📜 查看历史
git log --oneline   # 简洁历史
git diff            # 查看修改

# ↩️ 撤销操作
git checkout -- .   # 撤销工作区修改
git reset HEAD file # 取消暂存
git stash          # 暂存当前修改

# 🌐 远程操作
git remote -v       # 查看远程地址
git clone xxx       # 克隆项目
git push origin xxx # 推送分支
```

打印这个卡片，贴在电脑旁边，随时查看！

**谢谢阅读，祝你成为 Git 高手！**
