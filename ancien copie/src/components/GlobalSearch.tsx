import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, User, Mail, MapPin, Globe, Phone, Folder } from 'lucide-react';
import { globalSearch, saveSearch, type SearchResult } from '../lib/search';

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  autoFocus?: boolean;
}

export default function GlobalSearch({ onResultClick, autoFocus }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setIsOpen(false);
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const searchResults = await globalSearch(searchQuery);
    setResults(searchResults);
    setSelectedIndex(0);
    setLoading(false);

    if (searchResults.length > 0) {
      await saveSearch(searchQuery);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(results.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'dossier': return Folder;
      case 'target': return User;
      case 'credential': return Mail;
      case 'phone': return Phone;
      case 'social_media': return Globe;
      case 'address': return MapPin;
      case 'note': return FileText;
      default: return Search;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'dossier': return 'DOSSIER';
      case 'target': return 'TARGET';
      case 'credential': return 'CREDENTIAL';
      case 'phone': return 'PHONE';
      case 'social_media': return 'SOCIAL';
      case 'address': return 'ADDRESS';
      case 'note': return 'NOTE';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search everything... (targets, emails, phones, addresses)"
          className="w-full bg-black border-2 border-zinc-800 text-zinc-200 py-3 pl-12 pr-12 font-mono focus:border-zinc-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 border-2 border-zinc-800 bg-black shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-zinc-500">
              <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              SEARCHING...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-4 text-center text-zinc-500">
              NO RESULTS FOUND
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="p-2 border-b border-zinc-800 text-xs text-zinc-500">
                {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOUND
              </div>
              {results.map((result, index) => {
                const Icon = getResultIcon(result.type);
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`p-4 border-b border-zinc-800 cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-900/50 border-l-4 border-l-white' : 'hover:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-zinc-200 font-semibold truncate">
                            {result.title}
                          </div>
                          <div className="text-xs px-2 py-0.5 bg-zinc-900/50 border border-zinc-800 text-amber-600 ml-2 flex-shrink-0">
                            {getResultTypeLabel(result.type)}
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 mb-1 truncate">
                          {result.subtitle}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {result.preview}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="p-2 text-xs text-zinc-500 text-center border-t border-zinc-800">
                Use ↑↓ to navigate, ENTER to select, ESC to close
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
