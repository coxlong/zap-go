import { useState, useCallback, useRef } from 'react'
import { Command, SuggestionItem, ExecutionResult } from '../plugins/types'
import { commandManager } from '../plugins/manager'

export interface UseSearchReturn {
  // 状态
  inputValue: string
  setInputValue: (value: string) => void
  autoSuggestion: string
  suggestionDisplayText: string
  suggestions: SuggestionItem[]
  selectedSuggestionIndex: number
  setSelectedSuggestionIndex: (index: number) => void
  showSuggestions: boolean
  results: (ExecutionResult & { time: string })[]
  showResults: boolean
  currentCommand: Command | null
  paramHints: string[]
  currentParamIndex: number

  // 方法
  clearInput: () => void
  processInput: (value: string) => void
  executeCommand: () => Promise<void>
  acceptAutoSuggestion: () => void
  navigateSuggestions: (direction: number) => void
  selectSuggestion: () => void
}

export const useSearch = (): UseSearchReturn => {
  // 状态定义
  const [inputValue, setInputValue] = useState('')
  const [autoSuggestion, setAutoSuggestion] = useState('')
  const [suggestionDisplayText, setSuggestionDisplayText] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [results, setResults] = useState<(ExecutionResult & { time: string })[]>([])
  const [showResults, setShowResults] = useState(false)
  const [currentCommand, setCurrentCommand] = useState<Command | null>(null)
  const [paramHints, setParamHints] = useState<string[]>([])
  const [currentParamIndex, setCurrentParamIndex] = useState(-1)

  const debounceTimerRef = useRef<number | undefined>(undefined)

  // 工具函数
  const clearAllStates = useCallback(() => {
    setCurrentCommand(null)
    setShowSuggestions(false)
    setAutoSuggestion('')
    setSuggestionDisplayText('')
    setSelectedSuggestionIndex(-1)
    setParamHints([])
    setCurrentParamIndex(-1)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const clearInput = useCallback(() => {
    setInputValue('')
    clearAllStates()
  }, [clearAllStates])

  const addResult = useCallback((result: ExecutionResult) => {
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    setResults((prev) => [...prev, { ...result, time }])
    setShowResults(true)
  }, [])

  // 显示命令建议
  const showCommandSuggestions = useCallback((input: string) => {
    const trigger = input.toLowerCase()
    const commands = commandManager.getCommands()
    const matchedCommands = commands.filter((command) =>
      command.triggers.some((t) => t.toLowerCase().includes(trigger))
    )
    setSuggestions(
      matchedCommands.map((command) => ({
        type: 'command',
        command
      }))
    )
    setShowSuggestions(matchedCommands.length > 0)
    setSelectedSuggestionIndex(matchedCommands.length > 0 ? 0 : -1)
  }, [])

  // 显示参数建议
  const showParamSuggestions = useCallback((input: string, command: Command | null) => {
    if (!command) {
      setShowSuggestions(false)
      return
    }

    const parts = input.split(/\s+/)
    const currentParam = parts[parts.length - 1] || ''
    const paramIndex = parts.length - 2
    const paramDef = command.params[paramIndex]

    if (!paramDef || !paramDef.suggestions) {
      setShowSuggestions(false)
      return
    }

    const matchedSuggestions = paramDef.suggestions.filter((sug) =>
      sug.toLowerCase().includes(currentParam.toLowerCase())
    )
    setSuggestions(
      matchedSuggestions.map((value) => ({
        type: 'param',
        value,
        paramName: paramDef.name
      }))
    )
    setShowSuggestions(matchedSuggestions.length > 0)
    setSelectedSuggestionIndex(matchedSuggestions.length > 0 ? 0 : -1)
  }, [])

  // 更新自动补全
  const updateAutoSuggestion = useCallback((input: string, command: Command | null) => {
    const parts = input.trim().split(/\s+/)
    const currentTrigger = parts[0].toLowerCase()
    const commands = commandManager.getCommands()

    if (parts.length === 1 && currentTrigger.length > 0) {
      // 命令自动补全
      const bestMatch = commands.find((c) =>
        c.triggers.some(
          (t) => t.toLowerCase().startsWith(currentTrigger) && t.toLowerCase() !== currentTrigger
        )
      )
      if (bestMatch) {
        const matchedTrigger = bestMatch.triggers.find((t) =>
          t.toLowerCase().startsWith(currentTrigger)
        )
        if (matchedTrigger) {
          setAutoSuggestion(matchedTrigger.substring(currentTrigger.length))
          setSuggestionDisplayText(matchedTrigger)
          return
        }
      }
    }

    if (parts.length > 1 && command) {
      // 参数自动补全
      const currentParam = parts[parts.length - 1]
      const paramIndex = parts.length - 2
      const paramDef = command.params[paramIndex]

      if (paramDef && paramDef.suggestions) {
        const matchedSuggestion = paramDef.suggestions.find((sug) =>
          sug.toLowerCase().startsWith(currentParam.toLowerCase())
        )
        if (matchedSuggestion && matchedSuggestion !== currentParam) {
          setAutoSuggestion(matchedSuggestion.substring(currentParam.length))
          setSuggestionDisplayText(matchedSuggestion)
          return
        }
      }
    }

    setAutoSuggestion('')
    setSuggestionDisplayText('')
  }, [])

  // 更新参数提示
  const updateParamHints = useCallback((input: string, command: Command | null) => {
    if (!command || !command.params.length) {
      setParamHints([])
      setCurrentParamIndex(-1)
      return
    }

    const parts = input.trim().split(/\s+/)
    if (parts.length <= 1) {
      // 刚输入命令，显示所有参数
      setParamHints(command.params.map((p) => `<${p.name}>`))
      setCurrentParamIndex(0)
    } else {
      // 已经在输入参数
      const inputParamCount = parts.length - 1
      const remainingParams = command.params.slice(inputParamCount)
      setParamHints(remainingParams.map((p) => `<${p.name}>`))
      setCurrentParamIndex(inputParamCount < command.params.length ? 0 : -1)
    }
  }, [])

  // 处理输入
  const processInput = useCallback(
    (value: string) => {
      const command = commandManager.findMatchingCommand(value)
      setCurrentCommand(command)

      updateParamHints(value, command)

      const parts = value.split(' ')
      if (parts.length === 1) {
        showCommandSuggestions(value)
      } else {
        showParamSuggestions(value, command)
      }

      updateAutoSuggestion(value, command)
    },
    [updateParamHints, showCommandSuggestions, showParamSuggestions, updateAutoSuggestion]
  )

  // 接受自动补全
  const acceptAutoSuggestion = useCallback(() => {
    if (!autoSuggestion) return
    const newValue = inputValue + autoSuggestion
    setInputValue(newValue)
    setAutoSuggestion('')
    setSuggestionDisplayText('')

    setTimeout(() => {
      processInput(newValue)
    }, 0)
  }, [autoSuggestion, inputValue, processInput])

  // 导航建议
  const navigateSuggestions = useCallback(
    (direction: number) => {
      const count = suggestions.length
      setSelectedSuggestionIndex((prev) => (prev + direction + count) % count)
    },
    [suggestions.length]
  )

  // 选择建议
  const selectSuggestion = useCallback(() => {
    if (selectedSuggestionIndex === -1 || !suggestions[selectedSuggestionIndex]) return

    const suggestion = suggestions[selectedSuggestionIndex]
    if (suggestion.type === 'command' && suggestion.command) {
      setInputValue(suggestion.command.triggers[0] + ' ')
    } else if (suggestion.type === 'param' && suggestion.value) {
      const parts = inputValue.split(/\s+/)
      const newParts = [...parts.slice(0, -1), suggestion.value]
      setInputValue(newParts.join(' ') + ' ')
    }

    setShowSuggestions(false)
  }, [selectedSuggestionIndex, suggestions, inputValue])

  // 执行命令
  const executeCommand = useCallback(async () => {
    const input = inputValue.trim()
    if (!input) return

    try {
      if (currentCommand) {
        const result = await currentCommand.execute(input)
        addResult(result)
      } else {
        addResult({
          icon: '❓',
          title: '未知命令',
          content: `无法识别命令: "${input}"\n\n请尝试输入有效的命令。`
        })
      }
    } catch (error) {
      addResult({
        icon: '❌',
        title: '执行错误',
        content: (error as Error).message,
        error: true
      })
    }
    clearInput()
  }, [inputValue, currentCommand, addResult, clearInput])

  return {
    inputValue,
    setInputValue,
    autoSuggestion,
    suggestionDisplayText,
    suggestions,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    showSuggestions,
    results,
    showResults,
    currentCommand,
    paramHints,
    currentParamIndex,
    clearInput,
    processInput,
    executeCommand,
    acceptAutoSuggestion,
    navigateSuggestions,
    selectSuggestion
  }
}
