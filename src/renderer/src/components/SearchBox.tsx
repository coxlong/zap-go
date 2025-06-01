import React, { useRef, useEffect } from 'react'

interface SearchBoxProps {
  inputValue: string
  setInputValue: (value: string) => void
  isInputFocused: boolean
  setIsInputFocused: (focused: boolean) => void
  autoSuggestion: string
  paramHints: string[]
  currentParamIndex: number
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  inputValue,
  setInputValue,
  isInputFocused,
  setIsInputFocused,
  autoSuggestion,
  paramHints,
  currentParamIndex,
  onKeyDown
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  return (
    <div
      className={`flex items-center flex-shrink-0 bg-white border-2 border-slate-100 rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md ${
        isInputFocused ? 'border-blue-400 shadow-blue-100 transform -translate-y-0.5' : ''
      }`}
    >
      {/* 搜索图标 */}
      <svg
        className={`w-5 h-5 mr-3 transition-colors duration-300 ${
          isInputFocused ? 'text-blue-500' : 'text-slate-400'
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>

      {/* 输入框容器 */}
      <div className="flex-1 relative">
        {/* 输入框 */}
        <input
          ref={searchInputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          type="text"
          placeholder="输入命令或搜索..."
          autoComplete="off"
          spellCheck="false"
          className="w-full border-none outline-none bg-transparent text-slate-800 text-base font-medium placeholder-slate-400"
        />

        {/* 自动补全提示 */}
        {autoSuggestion && isInputFocused && inputValue && (
          <div className="absolute inset-0 pointer-events-none text-base font-medium flex items-center">
            <span className="invisible">{inputValue}</span>
            <span className="text-blue-500 bg-blue-50 px-1 rounded font-semibold ml-0.5">
              {autoSuggestion}
            </span>
          </div>
        )}

        {/* 参数提示 */}
        {paramHints.length > 0 && isInputFocused && inputValue && !autoSuggestion && (
          <div className="absolute inset-0 pointer-events-none text-base font-medium flex items-center">
            <span className="invisible">{inputValue}</span>
            <div className="flex items-center gap-1 ml-2">
              {paramHints.map((hint, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-md font-mono ${
                    index === currentParamIndex
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
