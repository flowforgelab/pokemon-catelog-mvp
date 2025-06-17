import React, { useState } from 'react';
import { PokemonCard } from '../types/pokemon';

interface AttackCalculatorProps {
  attackingCard: PokemonCard;
  defendingCard?: PokemonCard;
  onClose: () => void;
}

const AttackCalculator: React.FC<AttackCalculatorProps> = ({ attackingCard, defendingCard, onClose }) => {
  const [selectedAttack, setSelectedAttack] = useState(attackingCard.attacks?.[0] || null);
  const [modifiers, setModifiers] = useState({
    weakness: false,
    resistance: false,
    plusPower: 0,
    otherModifiers: 0
  });

  const calculateDamage = () => {
    if (!selectedAttack || !selectedAttack.damage) return 0;
    
    // Extract base damage number
    const baseDamage = parseInt(selectedAttack.damage.replace(/[^0-9]/g, '')) || 0;
    
    // Apply modifiers
    let totalDamage = baseDamage + modifiers.plusPower + modifiers.otherModifiers;
    
    // Apply weakness (usually x2)
    if (modifiers.weakness) {
      totalDamage *= 2;
    }
    
    // Apply resistance (usually -20 or -30)
    if (modifiers.resistance && defendingCard?.resistances?.[0]) {
      const resistanceValue = parseInt(defendingCard.resistances[0].value) || -20;
      totalDamage += resistanceValue;
    }
    
    // Damage can't be negative
    return Math.max(0, totalDamage);
  };

  const typeMatchups: Record<string, { weak: string[]; resists: string[] }> = {
    'Fire': { weak: ['Water', 'Ground', 'Rock'], resists: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'] },
    'Water': { weak: ['Electric', 'Grass'], resists: ['Fire', 'Water', 'Ice', 'Steel'] },
    'Grass': { weak: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resists: ['Water', 'Electric', 'Grass', 'Ground'] },
    'Electric': { weak: ['Ground'], resists: ['Electric', 'Flying', 'Steel'] },
    'Psychic': { weak: ['Bug', 'Ghost', 'Dark'], resists: ['Fighting', 'Psychic'] },
    'Fighting': { weak: ['Psychic', 'Flying', 'Fairy'], resists: ['Rock', 'Bug', 'Dark'] },
    'Darkness': { weak: ['Fighting', 'Bug', 'Fairy'], resists: ['Ghost', 'Dark'] },
    'Metal': { weak: ['Fire', 'Fighting', 'Ground'], resists: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'] },
    'Fairy': { weak: ['Poison', 'Steel'], resists: ['Fighting', 'Bug', 'Dark'] },
    'Dragon': { weak: ['Ice', 'Dragon', 'Fairy'], resists: ['Fire', 'Water', 'Electric', 'Grass'] },
    'Colorless': { weak: ['Fighting'], resists: [] }
  };

  const checkAutoWeakness = () => {
    if (!defendingCard || !selectedAttack) return false;
    
    const attackType = attackingCard.types?.[0];
    const defendType = defendingCard.types?.[0];
    
    if (!attackType || !defendType) return false;
    
    // Check if defending card has weakness to attacking type
    if (defendingCard.weaknesses?.some(w => w.type === attackType)) {
      return true;
    }
    
    // Check type matchup table
    const defendTypeMatchup = typeMatchups[defendType];
    return defendTypeMatchup?.weak.includes(attackType) || false;
  };

  const checkAutoResistance = () => {
    if (!defendingCard || !selectedAttack) return false;
    
    const attackType = attackingCard.types?.[0];
    const defendType = defendingCard.types?.[0];
    
    if (!attackType || !defendType) return false;
    
    // Check if defending card has resistance to attacking type
    if (defendingCard.resistances?.some(r => r.type === attackType)) {
      return true;
    }
    
    // Check type matchup table
    const defendTypeMatchup = typeMatchups[defendType];
    return defendTypeMatchup?.resists.includes(attackType) || false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Attack Damage Calculator</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Attacking Card */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Attacking: {attackingCard.name}</h3>
              <img 
                src={attackingCard.images.small} 
                alt={attackingCard.name}
                className="w-48 mx-auto mb-4"
              />
              
              {attackingCard.attacks && attackingCard.attacks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Select Attack:</h4>
                  <div className="space-y-2">
                    {attackingCard.attacks.map((attack, index) => (
                      <label 
                        key={index}
                        className={`block p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                          selectedAttack === attack ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="attack"
                          checked={selectedAttack === attack}
                          onChange={() => setSelectedAttack(attack)}
                          className="sr-only"
                        />
                        <div className="flex justify-between">
                          <span className="font-medium">{attack.name}</span>
                          <span className="font-bold">{attack.damage || '-'}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Cost: {attack.cost?.join(' ') || 'Free'}
                        </div>
                        {attack.text && (
                          <p className="text-sm text-gray-500 mt-1">{attack.text}</p>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Defending Card or Manual Input */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {defendingCard ? `Defending: ${defendingCard.name}` : 'Damage Modifiers'}
              </h3>
              
              {defendingCard && (
                <img 
                  src={defendingCard.images.small} 
                  alt={defendingCard.name}
                  className="w-48 mx-auto mb-4"
                />
              )}

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modifiers.weakness || checkAutoWeakness()}
                      onChange={(e) => setModifiers({...modifiers, weakness: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="font-medium">Apply Weakness (×2)</span>
                  </label>
                  {checkAutoWeakness() && (
                    <p className="text-sm text-green-600 ml-6">Auto-detected weakness!</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modifiers.resistance || checkAutoResistance()}
                      onChange={(e) => setModifiers({...modifiers, resistance: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="font-medium">Apply Resistance (-20)</span>
                  </label>
                  {checkAutoResistance() && (
                    <p className="text-sm text-green-600 ml-6">Auto-detected resistance!</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-1">Plus Power / Damage Boost:</label>
                  <input
                    type="number"
                    value={modifiers.plusPower}
                    onChange={(e) => setModifiers({...modifiers, plusPower: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="10"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Other Modifiers:</label>
                  <input
                    type="number"
                    value={modifiers.otherModifiers}
                    onChange={(e) => setModifiers({...modifiers, otherModifiers: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">Include any other damage modifiers (can be negative)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Damage Calculation Result */}
          {selectedAttack && (
            <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-2">Total Damage</h3>
              <div className="text-5xl font-bold text-blue-600">{calculateDamage()}</div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Base Damage: {parseInt(selectedAttack.damage?.replace(/[^0-9]/g, '') || '0')}</p>
                {modifiers.weakness && <p>Weakness Applied: ×2</p>}
                {modifiers.resistance && <p>Resistance Applied: -20</p>}
                {modifiers.plusPower > 0 && <p>Damage Boost: +{modifiers.plusPower}</p>}
                {modifiers.otherModifiers !== 0 && <p>Other Modifiers: {modifiers.otherModifiers > 0 ? '+' : ''}{modifiers.otherModifiers}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttackCalculator;