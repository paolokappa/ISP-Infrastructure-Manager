'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { searchFacilities, formatFacilityAddress, type Facility } from '@/app/lib/peeringdb'
import { debounce } from 'lodash'

interface DatacenterAutocompleteProps {
  onSelect: (facility: Facility) => void
  placeholder?: string
  defaultValue?: string
  value?: string
}

export default function DatacenterAutocomplete({
  onSelect,
  placeholder = "Type to search datacenters...",
  defaultValue = "",
  value
}: DatacenterAutocompleteProps) {
  const [query, setQuery] = useState(value || defaultValue)
  const [suggestions, setSuggestions] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Update query when value changes (for external updates)
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value)
    }
  }, [value])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const results = await searchFacilities(searchQuery)
        setSuggestions(results.slice(0, 10)) // Limit to 10 results
      } catch (error) {
        console.error('Failed to search facilities:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const handleSelect = (facility: Facility) => {
    setQuery(facility.name)
    setShowSuggestions(false)
    onSelect(facility)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="form-input pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {!loading && query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-gray-400 text-xs">🔍</span>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-auto">
          {suggestions.map((facility, index) => (
            <div
              key={facility.id}
              onClick={() => handleSelect(facility)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 border-l-2 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-gray-900">
                {facility.name}
                <span className="text-blue-600 text-sm ml-2 font-normal">
                  [{facility.country}]
                </span>
                {facility.aka && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({facility.aka})
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                📍 {facility.city}, {facility.state ? `${facility.state}, ` : ''}{facility.country}
                {facility.org_name && (
                  <span className="ml-2">• {facility.org_name}</span>
                )}
              </div>
              {(facility.net_count > 0 || facility.ix_count > 0) && (
                <div className="text-xs text-gray-500 mt-1">
                  {facility.net_count > 0 && (
                    <span className="inline-block mr-3">
                      🌐 {facility.net_count} networks
                    </span>
                  )}
                  {facility.ix_count > 0 && (
                    <span className="inline-block">
                      🔄 {facility.ix_count} IXPs
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <p className="text-gray-500 text-sm text-center">
            No datacenters found for "{query}"
          </p>
        </div>
      )}

      {/* Popular Swiss datacenters hint */}
      {showSuggestions && !loading && query.length < 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="text-gray-400 text-xs">
            💡 Try: "Equinix CH", "Interxion IT", "MIX", "Green" or add country code (CH, IT, DE, FR)
          </p>
        </div>
      )}
    </div>
  )
}