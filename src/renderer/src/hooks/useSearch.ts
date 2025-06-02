import { useState, useCallback, useRef } from 'react'
import { Command, SuggestionItem, ExecutionResult } from '../plugins/types'
import { commandManager } from '../plugins/manager'

export interface UseSearchReturn {
  inputValue: string
  setInputValue: (value: string) => void
  autoSuggestion: string
  suggestions: SuggestionItem[]
  selectedSuggestionIndex: number
  setSelectedSuggestionIndex: (index: number) => void
  showSuggestions: boolean
  results: (ExecutionResult & { time: string })[]
  showResults: boolean
  currentCommand: Command | null
  paramHints: string[]
  currentParamIndex: number

  clearInput: () => void
  processInput: (value: string) => void
  executeCommand: () => Promise<void>
  acceptAutoSuggestion: () => void
  navigateSuggestions: (direction: number) => void
  selectSuggestion: () => void
}

export const useSearch = (): UseSearchReturn => {
  const [inputValue, setInputValue] = useState('')
  const [autoSuggestion, setAutoSuggestion] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [results, setResults] = useState<(ExecutionResult & { time: string })[]>([])
  const [showResults, setShowResults] = useState(false)
  const [currentCommand, setCurrentCommand] = useState<Command | null>(null)
  const [paramHints, setParamHints] = useState<string[]>([])
  const [currentParamIndex, setCurrentParamIndex] = useState(-1)

  const debounceTimerRef = useRef<number | undefined>(undefined)

  const clearAllStates = useCallback(() => {
    setCurrentCommand(null)
    setShowSuggestions(false)
    setAutoSuggestion('')
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

  const showCommandSuggestions = useCallback((input: string) => {
    const commands = commandManager.getCommands()

    const sortedCommands = commands.filter((command) =>
      command.triggers.some((trigger) => trigger.toLowerCase().includes(input.toLowerCase()))
    )

    setSuggestions(
      sortedCommands.map((command) => ({
        command,
        value: command.triggers[0],
        canExecute: command.canExecute(command.triggers[0])
      }))
    )
    setShowSuggestions(sortedCommands.length > 0)
    setSelectedSuggestionIndex(sortedCommands.length > 0 ? 0 : -1)
  }, [])

  const showParamSuggestions = useCallback((input: string, command: Command | null) => {
    if (!command) {
      return
    }

    const matchedSuggestions = [input]

    setSuggestions(
      matchedSuggestions.map((value) => ({
        command,
        value,
        canExecute: command.canExecute(value)
      }))
    )
    setShowSuggestions(matchedSuggestions.length > 0)
    setSelectedSuggestionIndex(matchedSuggestions.length > 0 ? 0 : -1)
  }, [])

  const updateAutoSuggestion = useCallback((input: string, command: Command | null) => {
    const parts = input.trim().split(/\s+/)
    const currentTrigger = parts[0].toLowerCase()

    const suggestParams =
      command === null ? false : command.triggers.some((t) => t.toLowerCase() === currentTrigger)

    if (!suggestParams && currentTrigger.length > 0) {
      const commands = commandManager.getCommands()
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
          return
        }
      }
    }
    if (suggestParams && command) {
      const currentParam = parts[parts.length - 1]
      const paramIndex = parts.length - 2
      const paramDef = command.plugin.params[paramIndex]

      if (paramDef && paramDef.suggestions) {
        const matchedSuggestion = paramDef.suggestions.find((sug) =>
          sug.toLowerCase().startsWith(currentParam.toLowerCase())
        )
        if (matchedSuggestion && matchedSuggestion !== currentParam) {
          setAutoSuggestion(matchedSuggestion.substring(currentParam.length))
          return
        }
      }
    }

    setAutoSuggestion('')
  }, [])

  // 更新参数提示
  const updateParamHints = useCallback((input: string, command: Command | null) => {
    if (!command || !command.plugin.params.length) {
      setParamHints([])
      setCurrentParamIndex(-1)
      return
    }

    const parts = input.trim().split(/\s+/)
    if (parts.length <= 1) {
      setParamHints(command.plugin.params.map((p) => `<${p.name}>`))
      setCurrentParamIndex(0)
    } else {
      const inputParamCount = parts.length - 1
      const remainingParams = command.plugin.params.slice(inputParamCount)
      setParamHints(remainingParams.map((p) => `<${p.name}>`))
      setCurrentParamIndex(inputParamCount < command.plugin.params.length ? 0 : -1)
    }
  }, [])

  const processInput = useCallback(
    (value: string) => {
      const { command, type } = commandManager.findMatchingCommand(value)
      setCurrentCommand(command)

      if (type === 'exactMatch') {
        updateParamHints(value, command)
        showParamSuggestions(value, command)
        updateAutoSuggestion(value, command)
      } else if (type === 'prefixMatch') {
        showCommandSuggestions(value)
        updateAutoSuggestion(value, command)
      } else if (type === 'fallback') {
        showParamSuggestions(value, command)
      }
    },
    [updateParamHints, showCommandSuggestions, showParamSuggestions, updateAutoSuggestion]
  )

  const acceptAutoSuggestion = useCallback(() => {
    if (!autoSuggestion) return
    let newValue = inputValue + autoSuggestion
    const canExecute = currentCommand?.canExecute(newValue)
    if (canExecute !== true) {
      newValue += ' '
    }
    setInputValue(newValue)
    setAutoSuggestion('')

    setTimeout(() => {
      processInput(newValue)
    }, 0)
  }, [autoSuggestion, inputValue, processInput, currentCommand])

  const navigateSuggestions = useCallback(
    (direction: number) => {
      const count = suggestions.length
      setSelectedSuggestionIndex((prev) => (prev + direction + count) % count)
    },
    [suggestions.length]
  )

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

  const selectSuggestion = useCallback(() => {
    if (selectedSuggestionIndex === -1 || !suggestions[selectedSuggestionIndex]) return

    const suggestion = suggestions[selectedSuggestionIndex]

    setInputValue(suggestion.value)

    if (suggestion.canExecute) {
      setTimeout(() => {
        executeCommand()
      }, 0)
    }

    setShowSuggestions(false)
  }, [selectedSuggestionIndex, suggestions, executeCommand])

  return {
    inputValue,
    setInputValue,
    autoSuggestion,
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
