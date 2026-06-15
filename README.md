# EmbedBox

![License](https://img.shields.io/github/license/Awesome-Embedded-Learning-Studio/EmbedBox)
![Build](https://img.shields.io/github/actions/workflow/status/Awesome-Embedded-Learning-Studio/EmbedBox/deploy.yml?branch=main)

> 嵌入式开发通用工具链教程——不管走哪条嵌入式航线，都要先会用的工具：终端 / Git / Markdown / GCC / Make / CMake / GDB / 交叉编译 / 串口 / Docker / QEMU。

🌐 **[在线文档站](https://awesome-embedded-learning-studio.github.io/EmbedBox/)**

## 这是什么？

EmbedBox 是面向嵌入式开发者的「公共语言」入门坡道：在进入 AwesomeQt / ModernCPP / PenguinLAB / 各 forge 之前，先把终端、Git、Markdown、编译链、CMake、GDB、交叉编译、串口这些通用工具学会。它只负责把工具教透，不替中心站 [Awesome-Embedded](https://github.com/Awesome-Embedded-Learning-Studio/Awesome-Embedded) 做导航。

**适合谁？** 刚起步的嵌入式自学者 · 只会一点 PowerShell / 命令行的硬件朋友 · 想补齐「工具链前置知识」再啃具体航线的开发者。

## 本地预览 / 构建

站点引擎为 [VitePress](https://vitepress.dev)，需要 Node 22 + pnpm 10：

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地预览（默认 http://localhost:5173/EmbedBox/）
pnpm build          # 构建到 site/.vitepress/dist
pnpm preview        # 预览构建产物
```

## 项目结构

| 目录 / 文件 | 内容 |
|---|---|
| [`tutorial/`](./tutorial/index.md) | 教程正文 Markdown（WSL / Markdown / Git 等） |
| [`site/`](./site/) | VitePress 站点配置、主题、插件（`.vitepress/`） |
| [`examples/`](./examples/instructions.md) | 配套示例代码 / 硬件电路图 / PCB 等资产 |
| [`project.config.ts`](./project.config.ts) | 站点元信息（名称、导航、侧栏 volume 等） |

## 许可证与联系方式

- **许可证**：[MIT License](./LICENSE)
- **Issues**：[提交问题](https://github.com/Awesome-Embedded-Learning-Studio/EmbedBox/issues)
- **Email**：725610365@qq.com
- **组织**：[Awesome-Embedded-Learning-Studio](https://github.com/Awesome-Embedded-Learning-Studio)
