import { BasePlugin, ExecutionResult } from './types'

export class ConfigPlugin extends BasePlugin {
  constructor() {
    super({
      triggers: ['config'],
      name: '配置设置',
      description: '打开应用配置窗口',
      params: [],
      icon: '⚙️'
    })
  }

  async execute(): Promise<ExecutionResult> {
    window.electron.ipcRenderer.send('open-config-window')

    return {
      icon: '⚙️',
      title: '配置窗口',
      content: '正在打开配置设置窗口...'
    }
  }

  canExecute(input: string): boolean {
    return this.triggers.some((t) => t.toLowerCase() === input)
  }
}
