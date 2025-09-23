'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export type FetchSuggestions = (query: string) => Promise<string[]>

export interface AutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  fetchSuggestions?: FetchSuggestions
  staticOptions?: string[]
  className?: string
}

export default function Autocomplete({
  value = '',
  onChange,
  placeholder = 'Search...',
  fetchSuggestions,
  staticOptions,
  className,
}: AutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const localFilter = useMemo(() =>
    (q: string) => (staticOptions || []).filter((s) => s.toLowerCase().includes(q.toLowerCase())),
  [staticOptions])

  const runFetch = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setIsLoading(true)
    try {
      if (fetchSuggestions) {
        const res = await fetchSuggestions(q)
        setSuggestions(res)
      } else {
        setSuggestions(localFilter(q))
      }
    } finally {
      setIsLoading(false)
    }
  }, [fetchSuggestions, localFilter])

  useEffect(() => {
    const id = setTimeout(() => {
      if (isFocused) runFetch(query)
    }, 250)
    return () => clearTimeout(id)
  }, [query, isFocused, runFetch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange?.(newValue)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => prev < suggestions.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      setQuery(suggestions[selectedIndex])
      onChange?.(suggestions[selectedIndex])
      setSuggestions([])
      setSelectedIndex(-1)
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setSelectedIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onChange?.(suggestion)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setSuggestions([]); setSelectedIndex(-1) }, 120)}
          className="pr-10"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls="suggestions-list"
          aria-expanded={suggestions.length > 0}
        />
        <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {isLoading && isFocused && (
        <div className="mt-2 p-1.5 bg-background border rounded-md shadow-sm absolute z-10 text-sm" aria-live="polite">
          Loading...
        </div>
      )}
      {suggestions.length > 0 && !isLoading && isFocused && (
        <ul id="suggestions-list" className="mt-2 bg-background border rounded-md shadow-sm absolute z-10 max-h-56 overflow-auto text-sm" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion}-${index}`}
              className={["px-3 py-1.5 cursor-pointer hover:bg-muted", index === selectedIndex ? 'bg-muted' : ''].join(' ')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


