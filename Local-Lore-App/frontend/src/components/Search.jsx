import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, FileText, Users, MapPin, Calendar, BookOpen, Package } from 'lucide-react';
import { Modal } from './Modal';

const SEARCH_TYPES = {
  chapters: { icon: FileText, label: 'Chapters' },
  characters: { icon: Users, label: 'Characters' },
  places: { icon: MapPin, label: 'Places' },
  events: { icon: Calendar, label: 'Events' },
  lore: { icon: BookOpen, label: 'Lore' },
  items: { icon: Package, label: 'Items' }
};

function SearchModal({ isOpen, onClose, storyElements, chapters, onSelectChapter, onHighlightText, onNavigateToElement }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search chapters
      if (chapters && Array.isArray(chapters)) {
        chapters.forEach(chapter => {
          if (chapter && typeof chapter === 'object') {
            const score = getSearchScore(chapter, lowerQuery, ['title', 'content']);
            if (score > 0) {
              searchResults.push({
                type: 'chapters',
                item: chapter,
                score,
                matchedField: getMatchedField(chapter, lowerQuery, ['title', 'content'])
              });
            }
          }
        });
      }

      // Search story elements
      if (storyElements && typeof storyElements === 'object') {
        Object.entries(storyElements).forEach(([type, items]) => {
          if (items && Array.isArray(items)) {
            items.forEach(item => {
              if (item && typeof item === 'object') {
                const fields = getSearchFields(type);
                const score = getSearchScore(item, lowerQuery, fields);
                if (score > 0) {
                  searchResults.push({
                    type,
                    item,
                    score,
                    matchedField: getMatchedField(item, lowerQuery, fields)
                  });
                }
              }
            });
          }
        });
      }

      // Sort by score (highest first) and limit results
      searchResults.sort((a, b) => b.score - a.score);
      setResults(searchResults.slice(0, 20));
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [query, chapters, storyElements]);

  const getSearchFields = (type) => {
    const fieldMap = {
      characters: ['name', 'description', 'traits'],
      places: ['name', 'description'],
      events: ['title', 'description'],
      lore: ['title', 'content', 'category'],
      items: ['name', 'description', 'properties']
    };
    return fieldMap[type] || ['name', 'description'];
  };

  const getSearchScore = (item, query, fields) => {
    if (!item || !query || !fields) return 0;
    
    let score = 0;
    
    fields.forEach(field => {
      try {
        const value = item[field];
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (lowerValue.includes(query)) {
            // Exact match gets higher score
            if (lowerValue === query) score += 100;
            // Title/name matches get higher score
            else if (field === 'name' || field === 'title') score += 50;
            // Starts with query gets higher score
            else if (lowerValue.startsWith(query)) score += 30;
            // Contains query
            else score += 10;
          }
        }
      } catch (error) {
        // Skip this field if there's an error
      }
    });

    return score;
  };

  const getMatchedField = (item, query, fields) => {
    if (!item || !query || !fields) return fields[0] || 'title';
    
    for (const field of fields) {
      try {
        const value = item[field];
        if (typeof value === 'string' && value.toLowerCase().includes(query)) {
          return field;
        }
      } catch (error) {
        // Skip this field if there's an error
      }
    }
    return fields[0] || 'title';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  const handleSelectResult = (result) => {
    if (result.type === 'chapters' && onSelectChapter) {
      onSelectChapter(result.item);
      
      // If searching within chapter content, highlight the text
      if (result.matchedField === 'content' && onHighlightText) {
        setTimeout(() => {
          onHighlightText(query);
        }, 100); // Small delay to let chapter load
      }
    } else if (onNavigateToElement) {
      // For story elements, navigate to the appropriate sidebar tab and expand the element
      onNavigateToElement(result.type, result.item.id);
    }
    onClose();
  };

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    
    try {
      const index = text.toLowerCase().indexOf(query.toLowerCase());
      if (index === -1) return text;

      return (
        <>
          {text.slice(0, index)}
          <mark className="bg-yellow-200 px-1 rounded">{text.slice(index, index + query.length)}</mark>
          {text.slice(index + query.length)}
        </>
      );
    } catch (error) {
      return text;
    }
  };

  const getDisplayValue = (item, field) => {
    try {
      const value = item[field] || '';
      if (typeof value !== 'string') return '';
      
      if (field === 'content' && value.length > 100) {
        const lowerQuery = query.toLowerCase();
        const lowerValue = value.toLowerCase();
        const index = lowerValue.indexOf(lowerQuery);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(value.length, index + query.length + 50);
          return (start > 0 ? '...' : '') + value.slice(start, end) + (end < value.length ? '...' : '');
        }
        return value.slice(0, 100) + '...';
      }
      return value;
    } catch (error) {
      return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search" size="large">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search chapters, characters, places, events, lore, and items..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query.trim() ? (
            <div className="text-center py-8 text-gray-500">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Start typing to search across all your content</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => {
                try {
                  const Icon = SEARCH_TYPES[result.type]?.icon || FileText;
                  const displayName = result.item?.name || result.item?.title || 'Untitled';
                  const displayValue = getDisplayValue(result.item, result.matchedField);
                  
                  return (
                    <div
                      key={`${result.type}-${result.item?.id || index}`}
                      onClick={() => handleSelectResult(result)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {highlightMatch(displayName, query)}
                            </p>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {SEARCH_TYPES[result.type]?.label || result.type}
                            </span>
                          </div>
                          {displayValue && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {highlightMatch(displayValue, query)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering result:', error);
                  return null;
                }
              })}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Use ↑↓ arrow keys to navigate, Enter to select
          </div>
        )}
      </div>
    </Modal>
  );
}

export function useSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isSearchOpen,
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => setIsSearchOpen(false)
  };
}

export default SearchModal;