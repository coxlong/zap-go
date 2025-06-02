import { PluginRegistry } from './types'
import { AIPlugin } from './ai-plugin'
import { LinkOpenerPlugin } from './link-opener-plugin'
import { ConfigPlugin } from './config-plugin'

export const pluginRegistry: PluginRegistry = {
  ai: {
    name: 'AI 助手',
    description: '智能对话和查询',
    createPlugin: () => new AIPlugin(),
    configurable: true
  },
  link_opener: {
    name: '链接打开器',
    description: '打开网站链接或应用协议链接',
    createPlugin: () => new LinkOpenerPlugin(),
    configurable: true
  },
  config: {
    name: '配置设置',
    description: '打开应用配置窗口',
    createPlugin: () => new ConfigPlugin(),
    configurable: false
  }
}

export function getAvailablePlugins(): Array<
  { id: string } & PluginRegistry[keyof PluginRegistry]
> {
  return Object.entries(pluginRegistry).map(([id, plugin]) => ({
    id,
    ...plugin
  }))
}
