import type MarkdownIt from 'markdown-it'
import type { ProjectConfig } from '../config/schema'

export function resolvePlugins(md: MarkdownIt, config: ProjectConfig): void {
  if (config.plugins.cppTemplateEscape) {
    const { cppTemplateEscapePlugin } = require('./escape-cpp-templates')
    cppTemplateEscapePlugin(md)
  }
  if (config.plugins.kbd) {
    const { kbdPlugin } = require('./kbd-plugin')
    md.use(kbdPlugin)
  }
}
