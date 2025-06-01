import { useEffect, useRef } from 'react'

export const useAutoResize = (containerRef: React.RefObject<HTMLElement>): void => {
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const debounceTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!containerRef.current) return

    const debounce = <T extends unknown[]>(
      func: (...args: T) => void,
      wait: number
    ): ((...args: T) => void) => {
      return (...args: T) => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = window.setTimeout(() => func(...args), wait)
      }
    }

    const debouncedResize = debounce((width: number, height: number) => {
      if (window.api) {
        window.api.resizeWindow(width, height)
      }
    }, 10)

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        debouncedResize(Math.ceil(width), Math.ceil(height))
      }
    })

    resizeObserverRef.current.observe(containerRef.current)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [containerRef])
}
