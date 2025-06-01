export interface Plugin {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string
  parseInput(input: string): ParsedInput
  execute(input: string): Promise<ExecutionResult>
}

// 新增 Command 接口
export interface Command {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string
  plugin: Plugin
  parseInput(input: string): ParsedInput
  execute(input: string): Promise<ExecutionResult>
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
  type: 'command' | 'param'
  command?: Command
  value?: string
  paramName?: string
}

// 基础插件类
export class BasePlugin implements Plugin {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string

  constructor(config: {
    name: string
    description: string
    triggers: string[]
    params?: PluginParam[]
    icon?: string
  }) {
    this.name = config.name
    this.description = config.description
    this.triggers = config.triggers
    this.params = config.params || []
    this.icon = config.icon || '⚡'
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
}

// 新增基础命令类
export class BaseCommand implements Command {
  id: string
  name: string
  description: string
  triggers: string[]
  params: PluginParam[]
  icon: string
  plugin: Plugin

  constructor(
    plugin: Plugin,
    config: {
      name?: string
      description?: string
      triggers: string[]
      params?: PluginParam[]
      icon?: string
    }
  ) {
    this.plugin = plugin
    this.name = config.name || plugin.name
    this.description = config.description || plugin.description
    this.triggers = config.triggers
    this.params = config.params || plugin.params
    this.icon = config.icon || plugin.icon
    this.id = Math.random().toString(36).substring(7)
  }

  parseInput(input: string): ParsedInput {
    return this.plugin.parseInput(input)
  }

  async execute(input: string): Promise<ExecutionResult> {
    return this.plugin.execute(input)
  }
}
