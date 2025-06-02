import React, { useRef, useEffect } from 'react'
import { ExecutionResult, SuggestionItem } from '../plugins/types'

interface ResultListProps {
  // 建议相关
  showSuggestions: boolean
  suggestions: SuggestionItem[]
  selectedSuggestionIndex: number
  onSuggestionSelect: (index: number) => void

  // 结果相关
  showResults: boolean
  results: (ExecutionResult & { time: string })[]
}

export const ResultList: React.FC<ResultListProps> = ({
  showSuggestions,
  suggestions,
  selectedSuggestionIndex,
  onSuggestionSelect,
  showResults,
  results
}) => {
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const suggestionsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showResults && resultsContainerRef.current) {
      setTimeout(() => {
        if (resultsContainerRef.current) {
          resultsContainerRef.current.scrollTop = resultsContainerRef.current.scrollHeight
        }
      }, 0)
    }
  }, [results, showResults])

  return (
    <div className="w-full flex-1 overflow-y-auto bg-gray-50 p-4">
      {/* 建议下拉框 */}
      {showSuggestions && (
        <div
          ref={suggestionsContainerRef}
          className="top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-300"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={`w-full p-4 cursor-pointer rounded-xl flex items-center gap-4 transition-all duration-200 mb-1 text-left ${
                index === selectedSuggestionIndex ? 'bg-slate-50 translate-x-1' : ''
              }`}
              onClick={() => onSuggestionSelect(index)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                {suggestion.command.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{suggestion.command.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-mono">
                    {suggestion.command.triggers[0]}
                  </span>
                </div>
                <div className="text-sm text-slate-500">{suggestion.command.description}</div>
              </div>
              {suggestion.command.plugin.params.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md">
                  {suggestion.command.plugin.params.length}参数
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {/* 结果显示区域 */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-8 pt-0 results-container"
        >
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4 last:mb-0 animate-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  {result.icon}
                </div>
                <div className="flex-1 font-semibold text-slate-800 text-lg">{result.title}</div>
                <div className="text-xs text-slate-400 font-mono">{result.time}</div>
              </div>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
