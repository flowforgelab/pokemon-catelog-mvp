import React, { useEffect, useState } from 'react';
import { PokemonCard } from '../types/pokemon';
import { pokemonAPI } from '../services/api';
import AttackCalculator from './AttackCalculator';

interface CardDetailProps {
  card: PokemonCard;
  onClose: () => void;
}

const CardDetail: React.FC<CardDetailProps> = ({ card, onClose }) => {
  const [relatedCards, setRelatedCards] = useState<PokemonCard[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (card.relatedCardIds && card.relatedCardIds.length > 0) {
      setLoadingRelated(true);
      pokemonAPI.getRelatedCards(card.id)
        .then(setRelatedCards)
        .catch(console.error)
        .finally(() => setLoadingRelated(false));
    }
  }, [card.id, card.relatedCardIds]);

  const getRatingStars = (rating: number | null) => {
    if (!rating) return 'Not Rated';
    return '⭐'.repeat(rating) + ` (Tier ${rating})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{card.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img 
                src={card.images.large} 
                alt={card.name}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Card Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Set:</span> {card.set.name}</div>
                  <div><span className="font-medium">Number:</span> {card.number}/{card.set.printedTotal}</div>
                  {card.artist && <div><span className="font-medium">Artist:</span> {card.artist}</div>}
                  {card.rarity && <div><span className="font-medium">Rarity:</span> {card.rarity}</div>}
                  {card.types && <div><span className="font-medium">Type:</span> {card.types.join(', ')}</div>}
                  {card.hp && <div><span className="font-medium">HP:</span> {card.hp}</div>}
                  <div>
                    <span className="font-medium">Competitive Rating:</span> {getRatingStars(card.competitiveRating)}
                  </div>
                  <div>
                    <span className="font-medium">Standard Legal:</span> {' '}
                    <span className={card.set.legalities?.standard === 'Legal' ? 'text-green-600' : 'text-red-600'}>
                      {card.set.legalities?.standard || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {card.abilities && card.abilities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Abilities</h3>
                  {card.abilities.map((ability, index) => (
                    <div key={index} className="mb-2">
                      <div className="font-medium">{ability.type}: {ability.name}</div>
                      <div className="text-sm text-gray-600">{ability.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {card.attacks && card.attacks.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">Attacks</h3>
                    <button
                      onClick={() => setShowCalculator(true)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Damage Calculator
                    </button>
                  </div>
                  {card.attacks.map((attack, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{attack.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{attack.text}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{attack.damage || '-'}</div>
                          <div className="text-xs">
                            {attack.cost?.join(' ') || 'Free'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {card.weaknesses && card.weaknesses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Weaknesses</h3>
                  <div className="flex gap-2">
                    {card.weaknesses.map((weakness, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        {weakness.type} {weakness.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.resistances && card.resistances.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Resistances</h3>
                  <div className="flex gap-2">
                    {card.resistances.map((resistance, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        {resistance.type} {resistance.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.retreatCost && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Retreat Cost</h3>
                  <div className="flex gap-1">
                    {card.retreatCost.map((cost, index) => (
                      <div key={index} className="w-6 h-6 bg-gray-300 rounded-full" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {relatedCards.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-4">Related Cards</h3>
              {loadingRelated ? (
                <div className="text-center py-4">Loading related cards...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {relatedCards.map((relatedCard) => (
                    <div key={relatedCard.id} className="cursor-pointer hover:opacity-80">
                      <img 
                        src={relatedCard.images.small} 
                        alt={relatedCard.name}
                        className="w-full rounded"
                      />
                      <p className="text-xs text-center mt-1">{relatedCard.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showCalculator && (
        <AttackCalculator
          attackingCard={card}
          defendingCard={undefined}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
};

export default CardDetail;