import type { PluginSimple } from 'markdown-it'
import type MarkdownIt from 'markdown-it'

export const mermaidPlugin: PluginSimple = (md: MarkdownIt) => {
  // 把 mermaid 围栏在 Shiki 之前改写成自定义 token，避免 "language not loaded" 警告。
  // core 规则在分词之后、渲染之前执行，所以无论 VitePress 何时覆盖 Shiki 的 fence 渲染都生效。
  md.core.ruler.push('mermaid_block', (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i]
      if (token.type === 'fence' && token.info.trim() === 'mermaid') {
        token.type = 'mermaid_diagram'
        token.tag = ''
        token.nesting = 0
      }
    }
    return true
  })

  md.renderer.rules.mermaid_diagram = (tokens, idx) => {
    const encoded = encodeURIComponent(tokens[idx].content.trim())
    return `<div class="mermaid-diagram" data-mermaid="${encoded}" data-rendered="false"></div>`
  }
}
