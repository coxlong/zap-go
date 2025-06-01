import React, { useEffect } from 'react'
import { MainWindow } from './components/MainWindow'
import { commandManager } from './plugins/manager'
import { TimePlugin, AIPlugin, BaseCommand } from './plugins'

const App: React.FC = () => {
  useEffect(() => {
    // 创建插件实例
    const timePlugin = new TimePlugin()
    const aiPlugin = new AIPlugin()

    // 注册命令（一个插件可以创建多个命令）
    commandManager.registerCommand(
      new BaseCommand(timePlugin, {
        triggers: ['time', '时间']
      })
    )

    // 设置兜底命令
    commandManager.setFallbackCommand(
      new BaseCommand(aiPlugin, {
        triggers: ['fallback']
      })
    )
  }, [])

  return <MainWindow />
}

export default App
