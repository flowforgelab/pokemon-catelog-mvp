import React from 'react';
import { PokemonCard } from '../types/pokemon';
import CardItem from './CardItem';

interface CardGridProps {
  cards: PokemonCard[];
  loading?: boolean;
  onCardClick?: (card: PokemonCard) => void;
}

const CardGrid: React.FC<CardGridProps> = ({ cards, loading, onCardClick }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 h-96 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No cards found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {cards.map((card) => (
        <CardItem 
          key={card.id} 
          card={card} 
          onClick={() => onCardClick?.(card)}
        />
      ))}
    </div>
  );
};

export default CardGrid;