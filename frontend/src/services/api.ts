import axios from 'axios';
import { PokemonCard, SearchParams } from '../types/pokemon';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const pokemonAPI = {
  searchCards: async (params: SearchParams) => {
    const response = await api.get<{ 
      cards: PokemonCard[]; 
      totalCount: number;
      page: number;
      pageSize: number;
    }>('/cards/search', { params });
    return response.data;
  },

  getCard: async (id: string) => {
    const response = await api.get<PokemonCard>(`/cards/${id}`);
    return response.data;
  },

  getRelatedCards: async (id: string) => {
    const response = await api.get<PokemonCard[]>(`/relationships/${id}`);
    return response.data;
  },

  getFilterOptions: async () => {
    try {
      const response = await api.get<{
        types: string[];
        rarities: string[];
        sets: { id: string; name: string }[];
      }>('/cards/filters');
      return response.data;
    } catch (error) {
      // Fallback to mock data if endpoint doesn't exist yet
      return {
        types: ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'],
        rarities: ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret'],
        sets: []
      };
    }
  },

  searchSuggestions: async (query: string) => {
    const response = await api.get<string[]>('/search/suggestions', {
      params: { q: query }
    });
    return response.data;
  }
};