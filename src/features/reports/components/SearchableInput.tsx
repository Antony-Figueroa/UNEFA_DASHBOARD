import { useState, useEffect, useRef, useCallback } from 'react';
import InputField from '../../../components/form/input/InputField';

interface SearchableInputProps<T> {
  placeholder: string;
  search: (query: string) => Promise<T[]>;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  getKey: (item: T) => string | number;
  minChars?: number;
  debounceMs?: number;
  disabled?: boolean;
}

export function SearchableInput<T extends { id: string | number }>({
  placeholder,
  search,
  renderItem,
  onSelect,
  getKey,
  minChars = 2,
  debounceMs = 300,
  disabled = false,
}: SearchableInputProps<T>) {
  const [value, setValue] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < minChars) {
      setItems([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await search(q);
      setItems(results);
      setShowDropdown(results.length > 0);
      setFocusedIndex(-1);
    } catch {
      setItems([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [search, minChars]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < minChars) {
      setItems([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(value), debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, minChars, debounceMs, doSearch]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          handleSelect(items[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setValue('');
    setItems([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <InputField
          ref={inputRef}
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (items.length > 0) setShowDropdown(true); }}
          disabled={disabled}
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showDropdown && items.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {items.map((item, i) => (
            <button
              key={getKey(item)}
              type="button"
              role="option"
              aria-selected={i === focusedIndex}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              className={`w-full text-left px-4 py-3 border-b border-border-default dark:border-border-dark last:border-b-0 transition-colors ${
                i === focusedIndex
                  ? 'bg-gray-100 dark:bg-white/5'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}

      {value.length >= minChars && !isSearching && items.length === 0 && !showDropdown && (
        <p className="text-xs text-text-tertiary mt-1">Sin resultados. Podés ingresar el ID manualmente.</p>
      )}
    </div>
  );
}

export default SearchableInput;