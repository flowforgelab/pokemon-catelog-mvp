export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp: string | null;
  types: string[] | null;
  evolvesFrom: string | null;
  abilities: any[] | null;
  attacks: any[] | null;
  weaknesses: any[] | null;
  resistances: any[] | null;
  retreatCost: string[] | null;
  convertedRetreatCost: number | null;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities: {
      standard?: string;
      expanded?: string;
      unlimited?: string;
    };
    releaseDate: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
  number: string;
  artist: string | null;
  rarity: string | null;
  flavorText: string | null;
  images: {
    small: string;
    large: string;
  };
  tcgplayer: any | null;
  cardmarket: any | null;
  competitiveRating: 1 | 2 | 3 | null;
  relatedCardIds: string[] | null;
}

export interface FilterOptions {
  types: string[];
  rarities: string[];
  sets: string[];
  supertypes: string[];
}

export interface SearchParams {
  query?: string;
  types?: string[];
  rarities?: string[];
  sets?: string[];
  sortBy?: 'name' | 'number' | 'type' | 'rarity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}