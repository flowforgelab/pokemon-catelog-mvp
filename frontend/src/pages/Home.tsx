import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import CardGrid from '../components/CardGrid';
import CardDetail from '../components/CardDetail';
import { PokemonCard, SearchParams } from '../types/pokemon';
import { pokemonAPI } from '../services/api';

const Home: React.FC = () => {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 60,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [totalCount, setTotalCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pokemonAPI.searchCards(searchParams);
      setCards(response.cards);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      setError('Failed to load Pokemon cards. Please check your connection and try again.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFiltersChange = useCallback((filters: { types: string[]; rarities: string[]; sets: string[] }) => {
    setSearchParams(prev => ({
      ...prev,
      types: filters.types,
      rarities: filters.rarities,
      sets: filters.sets,
      page: 1
    }));
  }, []);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-') as [SearchParams['sortBy'], SearchParams['sortOrder']];
    setSearchParams(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(totalCount / (searchParams.limit || 60));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Pokémon Card Catalog</h1>
            <div className="flex-1 max-w-2xl">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <FilterSidebar 
          onFiltersChange={handleFiltersChange}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4">
          {/* Results header */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-gray-600">
              {loading ? 'Loading...' : `${totalCount} cards found`}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
                onChange={handleSortChange}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="number-asc">Number (Low-High)</option>
                <option value="number-desc">Number (High-Low)</option>
                <option value="type-asc">Type</option>
                <option value="rarity-asc">Rarity</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && !loading && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => fetchCards()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Card Grid */}
          {!error && (
            <CardGrid 
              cards={cards} 
              loading={loading}
              onCardClick={setSelectedCard}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(searchParams.page! - 1)}
                  disabled={searchParams.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {searchParams.page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(searchParams.page! + 1)}
                  disabled={searchParams.page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetail 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

export default Home;