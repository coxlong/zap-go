import { BasePlugin, ExecutionResult } from './types'

export class LinkOpenerPlugin extends BasePlugin {
  constructor() {
    super({
      triggers: ['open'],
      name: '链接打开器',
      description: '打开网站链接或应用协议链接',
      params: [],
      icon: '🔗'
    })
  }
  template: string = ''
  placeholder_keys: string[] = []

  setConfigParams(pluginParams: Record<string, string> | undefined): void {
    if (pluginParams) {
      this.template = pluginParams['template'] || ''
      const placeholders = pluginParams['placeholders'] || ''
      this.placeholder_keys = placeholders.split(',').filter((key) => key.trim() !== '')
      this.params = []
      this.placeholder_keys.forEach((key) => {
        this.params.push({
          name: key,
          description: key,
          required: true
        })
      })
    }
  }

  getConfigParams(): string[] {
    return ['template', 'placeholders']
  }

  private assembleUrl(input: string): string | null {
    const parsed = this.parseInput(input)
    if (!parsed.isValid) {
      return null
    }
    let url = this.template
    for (let i = 0; i < this.placeholder_keys.length; i++) {
      const arg = parsed.args[i]
      url = url.replace(`{$${this.placeholder_keys[i]}}`, arg.value || '')
    }
    return url
  }

  canExecute(input: string): boolean {
    const url = this.assembleUrl(input)
    return url !== null
  }

  async execute(input: string): Promise<ExecutionResult> {
    const url = this.assembleUrl(input)
    if (url) {
      window.open(url)
    }
    return {
      icon: '🔗',
      title: '打开链接',
      content: url || '无效链接'
    }
  }
}
