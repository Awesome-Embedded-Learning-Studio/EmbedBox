import { defineProject } from './site/.vitepress/config/schema'

export default defineProject({
  name: 'EmbedBox',
  title: { 'zh-CN': 'EmbedBox' },
  description: {
    'zh-CN':
      '嵌入式开发通用工具链教程（终端 / Git / Markdown / GCC / Make / CMake / GDB / 交叉编译 / 串口 / Docker / QEMU）',
  },
  base: '/EmbedBox/',
  copyright: 'Copyright © 2025-2026 Awesome-Embedded-Learning-Studio',

  // srcDir 解析为 ../tutorial，现有内容目录不动
  documentsDir: 'tutorial',
  siteDir: 'site',

  locales: [{ code: 'zh-CN', label: '中文', default: true }],

  nav: {
    'zh-CN': [
      { text: '首页', link: '/' },
      {
        text: 'GitHub',
        link: 'https://github.com/Awesome-Embedded-Learning-Studio/EmbedBox',
      },
    ],
  },

  // 单 volume = 全站一棵连续侧栏树（适合教程顺序阅读）；
  // Layer 2 重排成「领域分组」时再拆 volumes。
  sidebar: {
    volumes: [{ name: 'tutorial', srcDir: '.', urlPrefix: '' }],
  },

  github: {
    owner: 'Awesome-Embedded-Learning-Studio',
    repo: 'EmbedBox',
    branch: 'main',
    documentsPath: 'tutorial',
  },

  build: {
    rootPages: ['index.md'],
  },

  // 先全关，保证首次绿构建；C++ 章节落地后再开 cppTemplateEscape
  plugins: {
    cppTemplateEscape: false,
    kbd: false,
    math: false,
    mermaid: true,
  },

  favicon: '/EmbedBox/Awesome-Embedded.ico',
})
