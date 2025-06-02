import React, { useState, useEffect } from 'react'
import { configManager, AppConfig } from '../utils/config'
import { getAvailablePlugins } from '../plugins/registry'
import { CommandConfig } from '../plugins/types'

interface ConfigWindowProps {
  onClose: () => void
}

export const ConfigWindow: React.FC<ConfigWindowProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig())
  const [hasChanges, setHasChanges] = useState(false)
  const availablePlugins = getAvailablePlugins()

  useEffect(() => {
    const loadConfigAsync = async (): Promise<void> => {
      await configManager.loadConfig()
      setConfig(configManager.getConfig())
    }
    loadConfigAsync()
  }, [])

  const handleSave = async (): Promise<void> => {
    await configManager.setConfig(config)
    setHasChanges(false)
  }

  const handleReset = async (): Promise<void> => {
    await configManager.loadConfig()
    const currentConfig = configManager.getConfig()
    setConfig(currentConfig)
    setHasChanges(false)
  }

  const updateConfig = (newConfig: AppConfig): void => {
    setConfig(newConfig)
    setHasChanges(true)
  }

  const handleCommandToggle = (commandId: string, enabled: boolean): void => {
    const updatedCommands = config.commands.map((cmd) =>
      cmd.id === commandId ? { ...cmd, enabled } : cmd
    )
    updateConfig({ ...config, commands: updatedCommands })
  }

  const handleCommandUpdate = (commandId: string, updates: Partial<CommandConfig>): void => {
    const updatedCommands = config.commands.map((cmd) =>
      cmd.id === commandId ? { ...cmd, ...updates } : cmd
    )
    updateConfig({ ...config, commands: updatedCommands })
  }

  const handlePluginParamChange = (commandId: string, paramKey: string, value: string): void => {
    const command = config.commands.find((cmd) => cmd.id === commandId)
    if (command) {
      const updatedPluginParams = { ...command.pluginParams, [paramKey]: value }
      handleCommandUpdate(commandId, { pluginParams: updatedPluginParams })
    }
  }

  const handleFallbackPluginParamChange = (paramKey: string, value: string): void => {
    if (config.fallbackCommand) {
      const updatedPluginParams = { ...config.fallbackCommand.pluginParams, [paramKey]: value }
      handleFallbackUpdate({ pluginParams: updatedPluginParams })
    }
  }

  const handleTriggersChange = (commandId: string, triggersText: string): void => {
    const triggers = triggersText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
    handleCommandUpdate(commandId, { triggers })
  }

  const handleAddCommand = (pluginId: string): void => {
    const newCommandId = `${pluginId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newCommand: CommandConfig = {
      id: newCommandId,
      pluginId,
      enabled: true,
      triggers: [`${pluginId}_new`],
      name: `新${availablePlugins.find((p) => p.id === pluginId)?.name || '命令'}`,
      pluginParams: {}
    }
    updateConfig({ ...config, commands: [...config.commands, newCommand] })
  }

  const handleRemoveCommand = (commandId: string): void => {
    const updatedCommands = config.commands.filter((cmd) => cmd.id !== commandId)
    let updatedFallback = config.fallbackCommand

    // 如果删除的是兜底命令，则清空兜底命令
    if (config.fallbackCommand?.id === commandId) {
      updatedFallback = null
    }

    updateConfig({ ...config, commands: updatedCommands, fallbackCommand: updatedFallback })
  }

  const handleFallbackChange = (pluginId: string): void => {
    if (!pluginId) {
      updateConfig({ ...config, fallbackCommand: null })
      return
    }

    const plugin = availablePlugins.find((p) => p.id === pluginId)
    if (plugin) {
      const fallbackCommand: CommandConfig = {
        id: `fallback_${Date.now()}`,
        pluginId,
        enabled: true,
        triggers: ['fallback'],
        name: `兜底-${plugin.name}`,
        description: `兜底命令：${plugin.description}`,
        pluginParams: {}
      }
      updateConfig({ ...config, fallbackCommand })
    }
  }

  const handleFallbackUpdate = (updates: Partial<CommandConfig>): void => {
    if (config.fallbackCommand) {
      updateConfig({
        ...config,
        fallbackCommand: { ...config.fallbackCommand, ...updates }
      })
    }
  }

  const handleFallbackTriggersChange = (triggersText: string): void => {
    const triggers = triggersText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
    handleFallbackUpdate({ triggers })
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h1 className="text-lg font-semibold text-slate-800">⚙️ 配置设置</h1>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-600"
        >
          ✕
        </button>
      </div>

      {/* 配置内容 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 兜底命令配置 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-800">兜底命令设置</h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择兜底插件
                  </label>
                  <select
                    value={config.fallbackCommand?.pluginId || ''}
                    onChange={(e) => handleFallbackChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">无兜底命令</option>
                    {availablePlugins.map((plugin) => (
                      <option key={plugin.id} value={plugin.id}>
                        {plugin.name} - {plugin.description}
                      </option>
                    ))}
                  </select>
                </div>

                {config.fallbackCommand && (
                  <div className="space-y-3 pt-3 border-t border-blue-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        兜底命令名称
                      </label>
                      <input
                        type="text"
                        value={config.fallbackCommand.name || ''}
                        onChange={(e) => handleFallbackUpdate({ name: e.target.value })}
                        placeholder="输入兜底命令名称"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        兜底触发词 (用逗号分隔)
                      </label>
                      <input
                        type="text"
                        value={config.fallbackCommand.triggers.join(', ')}
                        onChange={(e) => handleFallbackTriggersChange(e.target.value)}
                        placeholder="输入触发词，用逗号分隔"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        兜底命令描述
                      </label>
                      <textarea
                        value={config.fallbackCommand.description || ''}
                        onChange={(e) => handleFallbackUpdate({ description: e.target.value })}
                        placeholder="输入兜底命令描述"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* 兜底命令插件参数 */}
                    {(() => {
                      const plugin = availablePlugins.find(
                        (p) => p.id === config.fallbackCommand?.pluginId
                      )
                      const pluginInstance = plugin?.createPlugin()
                      const configParams = pluginInstance?.getConfigParams?.() || []

                      if (configParams.length === 0) return null

                      return (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            插件参数
                          </label>
                          <div className="space-y-2 p-3 bg-slate-50 rounded border">
                            {configParams.map((paramKey) => (
                              <div key={paramKey} className="flex items-center gap-2">
                                <label className="text-xs text-slate-600 w-20 shrink-0">
                                  {paramKey}:
                                </label>
                                <input
                                  type="text"
                                  value={config.fallbackCommand?.pluginParams?.[paramKey] || ''}
                                  onChange={(e) =>
                                    handleFallbackPluginParamChange(paramKey, e.target.value)
                                  }
                                  placeholder={`输入${paramKey}值`}
                                  className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              <p className="text-sm text-blue-600 mt-4">
                💡 当输入的命令无法匹配任何已配置命令时，将使用兜底命令处理输入
              </p>
            </div>
          </div>

          {/* 命令管理 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-800">自定义命令</h2>
              <span className="text-sm text-slate-500">
                共 {config.commands.length} 个命令，
                {config.commands.filter((c) => c.enabled).length} 个已启用
              </span>
            </div>

            {/* 命令列表 */}
            {config.commands.length > 0 ? (
              <div className="space-y-3">
                {config.commands.map((command) => {
                  const plugin = availablePlugins.find((p) => p.id === command.pluginId)
                  const isConfigurable = plugin?.configurable !== false

                  return (
                    <div
                      key={command.id}
                      className="border border-slate-200 bg-white rounded-lg p-4 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* 启用开关 */}
                        <div className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            checked={command.enabled}
                            onChange={(e) => handleCommandToggle(command.id, e.target.checked)}
                            disabled={!isConfigurable}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </div>

                        {/* 命令信息 */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">
                              {plugin?.name || command.pluginId}
                            </span>
                            {!isConfigurable && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                内置
                              </span>
                            )}
                          </div>

                          {/* 命令名称 */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              命令名称
                            </label>
                            <input
                              type="text"
                              value={command.name || ''}
                              onChange={(e) =>
                                handleCommandUpdate(command.id, { name: e.target.value })
                              }
                              placeholder={plugin?.name || '输入命令名称'}
                              disabled={!isConfigurable || !command.enabled}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            />
                          </div>

                          {/* 触发词 */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              触发词 (用逗号分隔)
                            </label>
                            <input
                              type="text"
                              value={command.triggers.join(', ')}
                              onChange={(e) => handleTriggersChange(command.id, e.target.value)}
                              placeholder="输入触发词，用逗号分隔"
                              disabled={!isConfigurable || !command.enabled}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                            />
                          </div>

                          {/* 描述 */}
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              描述
                            </label>
                            <textarea
                              value={command.description || ''}
                              onChange={(e) =>
                                handleCommandUpdate(command.id, { description: e.target.value })
                              }
                              placeholder={plugin?.description || '输入命令描述'}
                              disabled={!isConfigurable || !command.enabled}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 resize-none"
                            />
                          </div>

                          {/* 插件自定义参数 */}
                          {isConfigurable &&
                            command.enabled &&
                            (() => {
                              // 获取插件支持的配置参数
                              const pluginInstance = plugin?.createPlugin()
                              const configParams = pluginInstance?.getConfigParams?.() || []

                              if (configParams.length === 0) return null

                              return (
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-2">
                                    插件参数
                                  </label>
                                  <div className="space-y-2 p-3 bg-slate-50 rounded border">
                                    {configParams.map((paramKey) => (
                                      <div key={paramKey} className="flex items-center gap-2">
                                        <label className="text-xs text-slate-600 w-20 shrink-0">
                                          {paramKey}:
                                        </label>
                                        <input
                                          type="text"
                                          value={command.pluginParams?.[paramKey] || ''}
                                          onChange={(e) =>
                                            handlePluginParamChange(
                                              command.id,
                                              paramKey,
                                              e.target.value
                                            )
                                          }
                                          placeholder={`输入${paramKey}值`}
                                          className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })()}
                        </div>

                        {/* 操作按钮 */}
                        {isConfigurable && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleRemoveCommand(command.id)}
                              className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="删除命令"
                            >
                              🗑️ 删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg mb-2">暂无自定义命令</p>
                <p className="text-sm">从下方选择插件添加新命令</p>
              </div>
            )}
          </div>

          {/* 添加新命令 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-800">添加新命令</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlugins
                .filter((plugin) => plugin.configurable !== false)
                .map((plugin) => (
                  <div
                    key={plugin.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-1">{plugin.name}</h3>
                        <p className="text-sm text-slate-600">{plugin.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCommand(plugin.id)}
                      className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      ➕ 添加命令
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
              ⚠️ 有未保存的更改
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-500 border border-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            💾 保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
