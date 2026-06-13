# EmbedBox

> 嵌入式开发通用工具链教程——不管走哪条嵌入式航线，都要先会用的工具：终端 / Git / Markdown / GCC / Make / CMake / GDB / 交叉编译 / 串口 / Docker / QEMU。

本教程创建于 2025-12-09 · 作者 Charliechen114514 · 联系方式 725610365@qq.com

本项目隶属于组织 [Awesome-Embedded-Learning-Studio](https://github.com/Awesome-Embedded-Learning-Studio) 的文档教程体系。

## 这是什么？

EmbedBox 是面向嵌入式开发者的「公共语言」入门坡道：在进入 AwesomeQt / ModernCPP / PenguinLab / 各 forge 之前，先把终端、Git、Markdown、编译链、CMake、GDB、交叉编译、串口这些通用工具学会。它只负责把工具教透，不替中心站 [Awesome-Embedded](https://github.com/Awesome-Embedded-Learning-Studio/Awesome-Embedded) 做导航。

## 快速目录

- [WSL2 + Linux + VS Code 远程开发](./tutorial/WSL/wsl.md)
- [Markdown 零基础入门](./tutorial/markdown/markdown.md)
- [Git 团队协作完全入门指南](./tutorial/git/index.md)（分 7 篇）

## 本地预览 / 构建

站点引擎为 [VitePress](https://vitepress.dev)，需要 Node 22 + pnpm 10：

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地预览（默认 http://localhost:5173/EmbedBox/）
pnpm build          # 构建到 site/.vitepress/dist
pnpm preview        # 预览构建产物
```

教程正文 Markdown 在 [`tutorial/`](./tutorial/index.md)；配套的示例代码 / 硬件电路图 / PCB 等资产放在 [`examples/`](./examples/instructions.md)，规则见该目录说明。

推送到 `main` 分支会自动经 GitHub Actions 构建并部署到 GitHub Pages。
