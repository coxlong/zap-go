import React, { useState, useRef, useCallback, useEffect } from 'react'
import { SearchBox } from './SearchBox'
import { ResultList } from './ResultList'
import { useSearch } from '../hooks/useSearch'
import { useAutoResize } from '../utils/helpers'
import { commandManager } from '../plugins/manager'

export const MainWindow: React.FC = () => {
  const [isInputFocused, setIsInputFocused] = useState(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  const {
    inputValue,
    setInputValue,
    autoSuggestion,
    suggestions,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    showSuggestions,
    results,
    showResults,
    paramHints,
    currentParamIndex,
    clearInput,
    processInput,
    executeCommand,
    acceptAutoSuggestion,
    navigateSuggestions,
    selectSuggestion
  } = useSearch()

  useAutoResize(mainContainerRef)

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Tab 或右箭头接受自动补全
      if ((e.key === 'Tab' || e.key === 'ArrowRight') && autoSuggestion) {
        e.preventDefault()
        acceptAutoSuggestion()
        return
      }

      // 建议框导航
      if (showSuggestions) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            navigateSuggestions(1)
            break
          case 'ArrowUp':
            e.preventDefault()
            navigateSuggestions(-1)
            break
          case 'Enter':
            e.preventDefault()
            selectSuggestion()
            return
        }
      }

      // 执行命令
      if (e.key === 'Enter') {
        e.preventDefault()
        executeCommand()
      }

      // 清空输入
      if (e.key === 'Escape') {
        clearInput()
      }
    },
    [
      autoSuggestion,
      showSuggestions,
      acceptAutoSuggestion,
      navigateSuggestions,
      selectSuggestion,
      executeCommand,
      clearInput
    ]
  )

  // 建议选择处理
  const handleSuggestionSelect = useCallback(
    (index: number) => {
      setSelectedSuggestionIndex(index)
      selectSuggestion()
    },
    [setSelectedSuggestionIndex, selectSuggestion]
  )

  // 处理输入变化
  useEffect(() => {
    const value = inputValue.trim()
    if (!value) return

    const timer = setTimeout(() => {
      processInput(value)
    }, 150)

    return () => clearTimeout(timer)
  }, [inputValue, processInput])

  return (
    <div ref={mainContainerRef} className="w-full max-h-[500px] bg-white shadow-lg flex flex-col">
      <SearchBox
        inputValue={inputValue}
        setInputValue={setInputValue}
        isInputFocused={isInputFocused}
        setIsInputFocused={setIsInputFocused}
        autoSuggestion={autoSuggestion}
        paramHints={paramHints}
        currentParamIndex={currentParamIndex}
        onKeyDown={handleKeyDown}
      />

      <ResultList
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        selectedSuggestionIndex={selectedSuggestionIndex}
        onSuggestionSelect={handleSuggestionSelect}
        showResults={showResults}
        results={results}
      />

      {/* 状态栏 */}
      <div className="flex items-center flex-shrink-0 justify-between px-8 py-5 bg-slate-50 border-t border-slate-100">
        <div className="flex gap-5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Tab</span>
            <span className="bg-white px-2 py-1 rounded text-xs font-mono shadow-sm">补全</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>↑↓</span>
            <span className="bg-white px-2 py-1 rounded text-xs font-mono shadow-sm">选择</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Enter</span>
            <span className="bg-white px-2 py-1 rounded text-xs font-mono shadow-sm">执行</span>
          </div>
        </div>
        <div className="text-sm text-slate-500">{commandManager.getCommands().length}命令</div>
      </div>
    </div>
  )
}
