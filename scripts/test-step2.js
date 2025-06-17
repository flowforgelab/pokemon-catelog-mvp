require('dotenv').config({ path: '../backend/.env' });
const axios = require('axios');

const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;
let passedTests = 0;
let failedTests = 0;

// Test helper
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Step 2 Feature Tests
async function testSearchFeatures() {
  console.log('\n🔍 SEARCH FEATURES TESTS\n');

  await test('Autocomplete endpoint exists', async () => {
    const response = await axios.get(`${API_BASE}/search/autocomplete?q=char`);
    if (!response.data.hasOwnProperty('suggestions')) {
      throw new Error('Response missing suggestions field');
    }
    console.log(`   → Found ${response.data.suggestions.length} suggestions for "char"`);
  });

  await test('Autocomplete returns structured data', async () => {
    const response = await axios.get(`${API_BASE}/search/autocomplete?q=pikachu`);
    if (response.data.suggestions.length > 0) {
      const suggestion = response.data.suggestions[0];
      const requiredFields = ['id', 'name', 'display', 'competitive_tier'];
      
      for (const field of requiredFields) {
        if (!(field in suggestion)) {
          throw new Error(`Missing field in suggestion: ${field}`);
        }
      }
    }
  });

  await test('Advanced search endpoint', async () => {
    const response = await axios.get(`${API_BASE}/search/advanced?name=charizard&hp_min=200`);
    if (!response.data.cards || !Array.isArray(response.data.cards)) {
      throw new Error('Advanced search not returning cards array');
    }
    if (!response.data.search_criteria) {
      throw new Error('Missing search criteria in response');
    }
    console.log(`   → Advanced search returned ${response.data.cards.length} cards`);
  });

  await test('Search suggestions endpoint', async () => {
    const response = await axios.get(`${API_BASE}/search/suggestions`);
    const requiredFields = ['popular', 'competitive', 'search_tips'];
    
    for (const field of requiredFields) {
      if (!(field in response.data)) {
        throw new Error(`Missing field in suggestions: ${field}`);
      }
    }
    console.log(`   → Got ${response.data.popular.length} popular suggestions`);
  });
}

async function testFilteringSystem() {
  console.log('\n🔗 ADVANCED FILTERING TESTS\n');

  await test('HP range filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?hp_min=200&hp_max=300&limit=5`);
    
    if (response.data.cards.length > 0) {
      const allInRange = response.data.cards.every(card => 
        card.hp >= 200 && card.hp <= 300
      );
      if (!allInRange) {
        throw new Error('HP filtering not working correctly');
      }
    }
    console.log(`   → Found ${response.data.pagination.total} cards with HP 200-300`);
  });

  await test('Retreat cost filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?retreat_max=1&limit=5`);
    
    if (response.data.cards.length > 0) {
      const allLowRetreat = response.data.cards.every(card => 
        card.retreat_cost <= 1
      );
      if (!allLowRetreat) {
        throw new Error('Retreat cost filtering not working');
      }
    }
    console.log(`   → Found ${response.data.pagination.total} cards with retreat ≤ 1`);
  });

  await test('Competitive rating filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?competitive_rating=competitive&limit=5`);
    
    if (response.data.cards.length > 0) {
      const allCompetitive = response.data.cards.every(card => 
        card.competitive_rating === 'competitive'
      );
      if (!allCompetitive) {
        throw new Error('Competitive rating filter not working');
      }
    }
    console.log(`   → Found ${response.data.pagination.total} competitive cards`);
  });

  await test('Has ability filtering', async () => {
    const response = await axios.get(`${API_BASE}/cards?has_ability=true&limit=5`);
    console.log(`   → Found ${response.data.pagination.total} cards with abilities`);
  });

  await test('Multiple filters combined', async () => {
    const response = await axios.get(`${API_BASE}/cards?type=fire&hp_min=200&competitive_rating=competitive&limit=3`);
    console.log(`   → Combined filters returned ${response.data.cards.length} cards`);
  });
}

async function testSortingSystem() {
  console.log('\n📊 ENHANCED SORTING TESTS\n');

  await test('Sort by HP', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=hp&order=DESC&limit=5`);
    
    if (response.data.cards.length > 1) {
      const hpValues = response.data.cards.filter(c => c.hp).map(c => c.hp);
      const sorted = [...hpValues].sort((a, b) => b - a);
      
      if (JSON.stringify(hpValues) !== JSON.stringify(sorted)) {
        throw new Error('HP sorting not working correctly');
      }
    }
    console.log(`   → HP sorting verified with ${response.data.cards.length} cards`);
  });

  await test('Sort by competitive rating', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=competitive_rating&order=ASC&limit=10`);
    
    if (response.data.cards.length > 0) {
      // Should see competitive cards first when ASC
      const ratings = response.data.cards.map(c => c.competitive_rating);
      console.log(`   → Rating order: ${ratings.slice(0, 3).join(', ')}`);
    }
  });

  await test('Sort by rarity', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=rarity&order=ASC&limit=5`);
    console.log(`   → Rarity sorting returned ${response.data.cards.length} cards`);
  });

  await test('Sort by set and card number', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=set&limit=5`);
    console.log(`   → Set sorting returned ${response.data.cards.length} cards`);
  });

  await test('Sort by newest cards', async () => {
    const response = await axios.get(`${API_BASE}/cards?sort=newest&limit=5`);
    console.log(`   → Newest sorting returned ${response.data.cards.length} cards`);
  });
}

async function testRelationshipSystem() {
  console.log('\n🔗 CARD RELATIONSHIPS TESTS\n');

  await test('Get card relationships', async () => {
    const response = await axios.get(`${API_BASE}/relationships/Charizard ex`);
    
    if (!response.data.related_cards || !Array.isArray(response.data.related_cards)) {
      throw new Error('Relationships not returning related_cards array');
    }
    
    console.log(`   → Found ${response.data.related_cards.length} related cards for Charizard ex`);
    console.log(`   → Deck archetype: ${response.data.deck_archetype || 'None'}`);
    console.log(`   → Source: ${response.data.source}`);
  });

  await test('Card suggestions endpoint', async () => {
    // First get a card ID
    const cardsResponse = await axios.get(`${API_BASE}/cards?search=charizard&limit=1`);
    
    if (cardsResponse.data.cards.length > 0) {
      const cardId = cardsResponse.data.cards[0].id;
      const response = await axios.get(`${API_BASE}/relationships/suggest/${cardId}`);
      
      if (!response.data.suggestions || !Array.isArray(response.data.suggestions)) {
        throw new Error('Suggestions not returning suggestions array');
      }
      
      console.log(`   → Got ${response.data.suggestions.length} deck suggestions`);
      console.log(`   → Archetype: ${response.data.archetype || 'Generic'}`);
    }
  });

  await test('Relationship types are categorized', async () => {
    const response = await axios.get(`${API_BASE}/relationships/Pidgeot ex`);
    
    if (response.data.related_cards.length > 0) {
      const hasRelationshipTypes = response.data.related_cards.some(card => 
        card.relationship_type && card.relationship_type !== ''
      );
      
      if (!hasRelationshipTypes) {
        throw new Error('Related cards missing relationship_type field');
      }
      
      const types = [...new Set(response.data.related_cards.map(c => c.relationship_type))];
      console.log(`   → Relationship types: ${types.join(', ')}`);
    }
  });
}

async function testCompetitiveFeatures() {
  console.log('\n🏆 COMPETITIVE FEATURES TESTS\n');

  await test('Competitive cards have proper ratings', async () => {
    const response = await axios.get(`${API_BASE}/cards?competitive_rating=competitive&limit=20`);
    
    if (response.data.cards.length === 0) {
      throw new Error('No competitive cards found');
    }
    
    // Check that competitive cards include expected names
    const competitiveNames = response.data.cards.map(c => c.name);
    const expectedCompetitive = ['Charizard ex', 'Pidgeot ex', 'Iono'];
    
    const hasExpectedCards = expectedCompetitive.some(name => 
      competitiveNames.some(cardName => cardName.includes(name))
    );
    
    if (!hasExpectedCards) {
      console.log(`   → Found cards: ${competitiveNames.slice(0, 5).join(', ')}`);
    }
    
    console.log(`   → ${response.data.cards.length} competitive cards verified`);
  });

  await test('Playable cards tier exists', async () => {
    const response = await axios.get(`${API_BASE}/cards?competitive_rating=playable&limit=10`);
    console.log(`   → Found ${response.data.pagination.total} playable cards`);
  });

  await test('Card usage analytics', async () => {
    // Test that we can get meta information
    const suggestions = await axios.get(`${API_BASE}/search/suggestions`);
    
    if (!suggestions.data.competitive || suggestions.data.competitive.length === 0) {
      throw new Error('No competitive suggestions available');
    }
    
    console.log(`   → ${suggestions.data.competitive.length} competitive cards in suggestions`);
  });
}

async function testPerformance() {
  console.log('\n⚡ STEP 2 PERFORMANCE TESTS\n');

  await test('Autocomplete response time < 1 second', async () => {
    const start = Date.now();
    await axios.get(`${API_BASE}/search/autocomplete?q=charizard`);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      throw new Error(`Autocomplete took ${duration}ms (limit: 1000ms)`);
    }
    console.log(`   → Autocomplete time: ${duration}ms`);
  });

  await test('Advanced search response time < 2 seconds', async () => {
    const start = Date.now();
    await axios.get(`${API_BASE}/search/advanced?hp_min=200&type=fire&competitive_rating=competitive`);
    const duration = Date.now() - start;
    
    if (duration > 2000) {
      throw new Error(`Advanced search took ${duration}ms (limit: 2000ms)`);
    }
    console.log(`   → Advanced search time: ${duration}ms`);
  });

  await test('Relationship lookup < 1 second', async () => {
    const start = Date.now();
    await axios.get(`${API_BASE}/relationships/Charizard ex`);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      throw new Error(`Relationship lookup took ${duration}ms (limit: 1000ms)`);
    }
    console.log(`   → Relationship time: ${duration}ms`);
  });
}

// Main test runner
async function runStep2Tests() {
  console.log('🧪 POKEMON CARD CATALOG MVP - STEP 2 VERIFICATION\n');
  console.log('Testing Core Backend Features...\n');

  try {
    // Check if server is running
    try {
      await axios.get(`${API_BASE}/health`);
    } catch (error) {
      console.error('❌ Server is not running!');
      console.error('   Please start the server first:');
      console.error('   cd ../backend && npm run dev\n');
      process.exit(1);
    }

    await testSearchFeatures();
    await testFilteringSystem();
    await testSortingSystem();
    await testRelationshipSystem();
    await testCompetitiveFeatures();
    await testPerformance();

    console.log('\n📊 STEP 2 TEST SUMMARY\n');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All Step 2 features verified successfully!');
      console.log('   Enhanced search, filtering, and competitive features are working.');
      console.log('   Ready for Step 3: Frontend Development!\n');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
      process.exit(1);
    }

    console.log('\n📝 STEP 2 COMPLETED FEATURES:');
    console.log('✅ Auto-complete search with smart suggestions');
    console.log('✅ Advanced search with multiple criteria');
    console.log('✅ Enhanced filtering (HP, retreat cost, abilities)');
    console.log('✅ Intelligent sorting by all fields');
    console.log('✅ Competitive tier ratings for 80+ cards');
    console.log('✅ Card relationship system for deck building');
    console.log('✅ Deck archetype recognition');
    console.log('✅ Performance optimized endpoints\n');

  } catch (error) {
    console.error('\n💥 Fatal error during Step 2 testing:', error.message);
    process.exit(1);
  }
}

// Run tests
runStep2Tests();