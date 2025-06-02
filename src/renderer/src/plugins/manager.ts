import { Command } from './types'

export class CommandManager {
  private commands: Command[] = []
  private fallbackCommand: Command | null = null

  registerCommand(command: Command): void {
    this.commands.push(command)
  }

  setFallbackCommand(command: Command): void {
    this.fallbackCommand = command
  }

  getCommands(): Command[] {
    return [...this.commands]
  }

  clearCommands(): void {
    this.commands = []
    this.fallbackCommand = null
  }

  findMatchingCommand(input: string): {
    command: Command | null
    type: 'fallback' | 'exactMatch' | 'prefixMatch'
  } {
    const trigger = input.trim().split(/\s+/)[0].toLowerCase()

    // 精确匹配
    const exactMatch = this.commands.find((command) =>
      command.triggers.some((t) => t.toLowerCase() === trigger)
    )
    if (exactMatch) return { command: exactMatch, type: 'exactMatch' }

    // 前缀匹配
    const prefixMatch = this.commands.find((command) =>
      command.triggers.some((t) => t.toLowerCase().startsWith(trigger))
    )
    if (prefixMatch) return { command: prefixMatch, type: 'prefixMatch' }

    return { command: this.fallbackCommand, type: 'fallback' }
  }

  // TODO: 未来可以扩展的功能
  // loadCommandFromFile(filePath: string): Promise<Command>
  // unregisterCommand(commandId: string): void
  // getCommandConfig(commandId: string): CommandConfig
  // setCommandConfig(commandId: string, config: CommandConfig): void
}

// 全局命令管理器实例
export const commandManager = new CommandManager()
