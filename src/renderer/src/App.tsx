import React, { useEffect, useState } from 'react'
import { MainWindow } from './components/MainWindow'
import { commandManager } from './plugins/manager'
import { BaseCommand } from './plugins/types'
import { pluginRegistry } from './plugins/registry'
import { configManager } from './utils/config'

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        await configManager.loadConfig()
        commandManager.clearCommands()

        const enabledCommands = configManager.getEnabledCommands()
        const fallbackCommand = configManager.getFallbackCommand()

        const configPlugin = pluginRegistry.config.createPlugin()
        commandManager.registerCommand(
          new BaseCommand(configPlugin, {
            triggers: ['config']
          })
        )

        enabledCommands.forEach((commandConfig) => {
          const pluginDef = pluginRegistry[commandConfig.pluginId]
          if (pluginDef) {
            const plugin = pluginDef.createPlugin()
            commandManager.registerCommand(
              new BaseCommand(plugin, {
                triggers: commandConfig.triggers,
                name: commandConfig.name,
                description: commandConfig.description,
                icon: commandConfig.icon,
                pluginParams: commandConfig.pluginParams
              })
            )
          }
        })

        if (fallbackCommand && pluginRegistry[fallbackCommand.pluginId]) {
          const fallbackPlugin = pluginRegistry[fallbackCommand.pluginId].createPlugin()
          commandManager.setFallbackCommand(
            new BaseCommand(fallbackPlugin, {
              triggers: fallbackCommand.triggers,
              name: fallbackCommand.name,
              description: fallbackCommand.description,
              icon: fallbackCommand.icon,
              pluginParams: fallbackCommand.pluginParams
            })
          )
        }
      } catch (error) {
        console.error('应用初始化失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-slate-600">正在加载...</div>
      </div>
    )
  }

  return <MainWindow />
}

export default App
