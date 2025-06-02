import { CommandConfig } from '../plugins/types'

export interface AppConfig {
  commands: CommandConfig[]
  fallbackCommand: CommandConfig | null
}

const defaultConfig: AppConfig = {
  commands: [],
  fallbackCommand: {
    id: '',
    pluginId: 'config',
    triggers: ['fallback'],
    enabled: true,
    pluginParams: {}
  }
}

class ConfigManager {
  private config: AppConfig = { ...defaultConfig }

  async loadConfig(): Promise<void> {
    try {
      const loadedConfig = await window.electron.ipcRenderer.invoke('load-config')
      if (loadedConfig) {
        this.config = { ...defaultConfig, ...loadedConfig }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      this.config = { ...defaultConfig }
    }
  }

  getConfig(): AppConfig {
    return { ...this.config }
  }

  async setConfig(newConfig: AppConfig): Promise<void> {
    this.config = { ...newConfig }
    try {
      await window.electron.ipcRenderer.invoke('save-config', this.config)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  getEnabledCommands(): CommandConfig[] {
    return this.config.commands.filter((cmd) => cmd.enabled)
  }

  getFallbackCommand(): CommandConfig | null {
    return this.config.fallbackCommand
  }

  async updateCommandConfig(commandId: string, updates: Partial<CommandConfig>): Promise<void> {
    const commandIndex = this.config.commands.findIndex((cmd) => cmd.id === commandId)
    if (commandIndex !== -1) {
      this.config.commands[commandIndex] = { ...this.config.commands[commandIndex], ...updates }
      await this.setConfig(this.config)
    } else {
      if (this.config.fallbackCommand?.id !== commandId) {
        this.config.commands.push({
          id: commandId,
          pluginId: updates.pluginId || '',
          enabled: true,
          triggers: [],
          ...updates
        })
        await this.setConfig(this.config)
      }
    }
  }

  async updateFallbackCommand(updates: Partial<CommandConfig>): Promise<void> {
    if (this.config.fallbackCommand) {
      this.config.fallbackCommand = { ...this.config.fallbackCommand, ...updates }
    } else {
      this.config.fallbackCommand = {
        id: updates.id || `fallback_${Date.now()}`,
        pluginId: updates.pluginId || '',
        enabled: true,
        triggers: updates.triggers || ['fallback'],
        ...updates
      }
    }
    await this.setConfig(this.config)
  }

  async setFallbackCommand(commandConfig: CommandConfig | null): Promise<void> {
    this.config.fallbackCommand = commandConfig
    await this.setConfig(this.config)
  }

  async addCommand(pluginId: string, commandConfig: Partial<CommandConfig>): Promise<string> {
    const commandId = `${pluginId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newCommand: CommandConfig = {
      id: commandId,
      pluginId,
      enabled: true,
      triggers: [pluginId],
      pluginParams: {},
      ...commandConfig
    }
    this.config.commands.push(newCommand)
    await this.setConfig(this.config)
    return commandId
  }

  async removeCommand(commandId: string): Promise<void> {
    this.config.commands = this.config.commands.filter((cmd) => cmd.id !== commandId)
    await this.setConfig(this.config)
  }

  getCommandsByPlugin(pluginId: string): CommandConfig[] {
    return this.config.commands.filter((cmd) => cmd.pluginId === pluginId)
  }
}

export const configManager = new ConfigManager()
