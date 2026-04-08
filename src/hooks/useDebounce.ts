import { useState, useEffect } from 'react';

/**
 * 对值进行防抖处理，延迟指定毫秒后才更新
 * 用于减少流式输出时 ReactMarkdown 的高频重渲染，避免 removeChild DOM 错误
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}