import React, { useState, useEffect } from 'react';
import { pokemonAPI } from '../services/api';

interface FilterSidebarProps {
  onFiltersChange: (filters: {
    types: string[];
    rarities: string[];
    sets: string[];
    standardOnly?: boolean;
  }) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFiltersChange, isOpen = true, onToggle }) => {
  const [types, setTypes] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [standardOnly, setStandardOnly] = useState(false);

  useEffect(() => {
    pokemonAPI.getFilterOptions()
      .then(({ types, rarities, sets }) => {
        setTypes(types);
        setRarities(rarities);
        setSets(sets);
      })
      .catch(console.error);
  }, []);

  // Remove the automatic filter change effect - only trigger on user interaction

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    onFiltersChange({
      types: newTypes,
      rarities: selectedRarities,
      sets: selectedSets,
      standardOnly
    });
  };

  const handleRarityToggle = (rarity: string) => {
    const newRarities = selectedRarities.includes(rarity)
      ? selectedRarities.filter(r => r !== rarity)
      : [...selectedRarities, rarity];
    
    setSelectedRarities(newRarities);
    onFiltersChange({
      types: selectedTypes,
      rarities: newRarities,
      sets: selectedSets,
      standardOnly
    });
  };

  const handleSetToggle = (setId: string) => {
    const newSets = selectedSets.includes(setId)
      ? selectedSets.filter(s => s !== setId)
      : [...selectedSets, setId];
    
    setSelectedSets(newSets);
    onFiltersChange({
      types: selectedTypes,
      rarities: selectedRarities,
      sets: newSets,
      standardOnly
    });
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedRarities([]);
    setSelectedSets([]);
    setStandardOnly(false);
    onFiltersChange({
      types: [],
      rarities: [],
      sets: [],
      standardOnly: false
    });
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedRarities.length > 0 || selectedSets.length > 0 || standardOnly;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-500 text-white p-3 rounded-full shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Format Filter */}
          <div className="mb-6 p-3 bg-green-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={standardOnly}
                onChange={(e) => {
                  setStandardOnly(e.target.checked);
                  onFiltersChange({
                    types: selectedTypes,
                    rarities: selectedRarities,
                    sets: selectedSets,
                    standardOnly: e.target.checked
                  });
                }}
                className="mr-2 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="font-medium">Standard Legal Only</span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-6">Show only cards legal in Standard format</p>
          </div>

          {/* Types Filter */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Type</h3>
            <div className="space-y-2">
              {types.map(type => (
                <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rarity Filter */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Rarity</h3>
            <div className="space-y-2">
              {rarities.map(rarity => (
                <label key={rarity} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedRarities.includes(rarity)}
                    onChange={() => handleRarityToggle(rarity)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm">{rarity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sets Filter */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Set</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sets.map(set => (
                <label key={set.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedSets.includes(set.id)}
                    onChange={() => handleSetToggle(set.id)}
                    className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm truncate" title={set.name}>{set.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default FilterSidebar;