export interface Plugin {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string
  parseInput(input: string): ParsedInput
  execute(input: string): Promise<ExecutionResult>
  canExecute?(input: string): boolean
  setConfigParams?(config: Record<string, string> | undefined): void
  getConfigParams?(): string[]
}

export interface Command {
  id: string
  name: string
  description: string
  triggers: string[]
  icon: string
  plugin: Plugin
  parseInput(input: string): ParsedInput
  execute(input: string): Promise<ExecutionResult>
  canExecute(input: string): boolean
}

export interface PluginParam {
  name: string
  required: boolean
  suggestions?: string[]
  description?: string
  validator?: (value: string) => boolean
}

export interface ParsedInput {
  trigger: string
  args: ArgumentInfo[]
  params: Record<string, string>
  isValid: boolean
  missingParams: string[]
  invalidParams: string[]
}

export interface ArgumentInfo {
  value: string | null
  name: string
  required: boolean
  valid: boolean
  missing: boolean
  description: string
}

export interface ExecutionResult {
  icon: string
  title: string
  content: string
  error?: boolean
}

export interface SuggestionItem {
  command: Command
  value: string
  canExecute: boolean
}

export interface CommandConfig {
  id: string
  pluginId: string
  enabled: boolean
  triggers: string[]
  name?: string
  description?: string
  icon?: string
  pluginParams?: Record<string, string>
}

export interface PluginRegistry {
  [key: string]: {
    name: string
    description: string
    createPlugin: () => Plugin
    configurable: boolean // 是否支持自定义配置
  }
}

export class BasePlugin implements Plugin {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string
  pluginParams: Record<string, string>

  constructor(config: {
    name: string
    description: string
    triggers: string[]
    params?: PluginParam[]
    icon?: string
    pluginParams?: Record<string, string>
  }) {
    this.name = config.name
    this.description = config.description
    this.triggers = config.triggers
    this.params = config.params || []
    this.icon = config.icon || '⚡'
    this.pluginParams = config.pluginParams || {}
    this.id = Math.random().toString(36).substring(7)
  }

  parseInput(input: string): ParsedInput {
    const parts = input.trim().split(/\s+/)
    const trigger = parts[0]
    const args = parts.slice(1)

    const result: ParsedInput = {
      trigger,
      args: [],
      params: {},
      isValid: true,
      missingParams: [],
      invalidParams: []
    }

    this.params.forEach((param, index) => {
      const value = args[index] || null
      let isValid = true

      if (param.required && !value) {
        result.isValid = false
        result.missingParams.push(param.name)
        result.args.push({
          value,
          name: param.name,
          required: param.required,
          valid: false,
          missing: true,
          description: param.description || ''
        })
        return
      }

      if (param.validator && value) {
        try {
          isValid = param.validator(value)
        } catch {
          isValid = false
        }
        if (!isValid) {
          result.isValid = false
          result.invalidParams.push(param.name)
        }
      }

      result.args.push({
        value,
        name: param.name,
        required: param.required,
        valid: isValid,
        missing: false,
        description: param.description || ''
      })

      if (value) {
        result.params[param.name] = value
      }
    })

    return result
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_: string): Promise<ExecutionResult> {
    throw new Error('插件需要实现 execute 方法')
  }

  getConfigParams?(): string[] {
    // 子类可以重写此方法返回支持的配置参数
    return []
  }
}

export class BaseCommand implements Command {
  id: string
  name: string
  description: string
  triggers: string[]
  icon: string
  plugin: Plugin

  constructor(
    plugin: Plugin,
    config: {
      name?: string
      description?: string
      triggers: string[]
      icon?: string
      pluginParams?: Record<string, string>
    }
  ) {
    this.plugin = plugin
    this.name = config.name || plugin.name
    this.description = config.description || plugin.description
    this.triggers = config.triggers
    this.icon = config.icon || plugin.icon

    plugin.setConfigParams?.(config.pluginParams)

    this.id = Math.random().toString(36).substring(7)
  }

  parseInput(input: string): ParsedInput {
    return this.plugin.parseInput(input)
  }

  async execute(input: string): Promise<ExecutionResult> {
    return this.plugin.execute(input)
  }

  canExecute(input: string): boolean {
    if (this.plugin.canExecute) {
      return this.plugin.canExecute(input)
    }

    return false
  }
}
