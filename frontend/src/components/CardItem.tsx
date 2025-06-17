import React from 'react';
import { PokemonCard } from '../types/pokemon';
import ImageWithFallback from './ImageWithFallback';

interface CardItemProps {
  card: PokemonCard;
  onClick?: () => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onClick }) => {
  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return '⭐'.repeat(rating);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Fire': 'bg-red-500',
      'Water': 'bg-blue-500',
      'Grass': 'bg-green-500',
      'Electric': 'bg-yellow-400',
      'Psychic': 'bg-purple-500',
      'Fighting': 'bg-orange-600',
      'Darkness': 'bg-gray-800',
      'Metal': 'bg-gray-400',
      'Fairy': 'bg-pink-400',
      'Dragon': 'bg-indigo-600',
      'Colorless': 'bg-gray-300'
    };
    return colors[type] || 'bg-gray-400';
  };

  return (
    <div 
      className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <ImageWithFallback
            src={card.images.small} 
            alt={card.name}
            className="w-full h-auto"
            loading="lazy"
          />
          {card.competitiveRating && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {getRatingStars(card.competitiveRating)}
            </div>
          )}
          {card.set.legalities?.standard === 'Legal' && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Standard
              </span>
            </div>
          )}
          {card.set.legalities?.standard === 'Not Legal' && (
            <div className="absolute top-2 left-2 bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-90">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Rotated
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{card.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600">{card.set.name}</span>
            {card.types && card.types.length > 0 && (
              <div className="flex gap-1">
                {card.types.map((type, index) => (
                  <div 
                    key={index}
                    className={`w-5 h-5 rounded-full ${getTypeColor(type)}`}
                    title={type}
                  />
                ))}
              </div>
            )}
          </div>
          {card.rarity && (
            <span className="text-xs text-gray-500 mt-1 block">{card.rarity}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CardItem);