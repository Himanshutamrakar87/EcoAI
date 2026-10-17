/**
 * EcoAI - Green Challenges Module
 * 
 * Provides an engaging gamified checklist for students and citizens to form
 * lasting sustainable habits.
 * 
 * Scientific / Academic Disclaimer:
 * Completing these challenges represents self-reported lifestyle habits.
 * User-reported completions build ecological awareness and behavioral discipline,
 * but do not represent formally metered or verified carbon credits.
 */

import { Storage } from './storage.js';

export const INITIAL_CHALLENGES = [
  {
    id: 'ch_plastic_free',
    title: 'Zero Single-Use Plastic Day',
    category: 'Waste',
    icon: 'shopping-bag',
    difficulty: 'Easy',
    impactLevel: 'Medium',
    description: 'Refuse all disposable plastic bags, plastic straws, and disposable cutlery today. Carry your own cloth bag.',
    sdgTarget: 'Target 12.5 (Reduce Waste)',
    completed: false
  },
  {
    id: 'ch_reusable_bottle',
    title: 'Carry a Reusable Water Bottle',
    category: 'Conservation',
    icon: 'droplet',
    difficulty: 'Easy',
    impactLevel: 'High',
    description: 'Fill a durable steel or glass water bottle before leaving home/dorm. Avoid purchasing PET bottled water.',
    sdgTarget: 'Target 14.1 (Marine Pollution)',
    completed: false
  },
  {
    id: 'ch_phantom_power',
    title: 'Vampire Power Shutdown',
    category: 'Energy',
    icon: 'zap-off',
    difficulty: 'Easy',
    impactLevel: 'Medium',
    description: 'Switch off all wall power sockets and chargers when devices are not in active use (laptops, TVs, gaming consoles).',
    sdgTarget: 'Target 7.3 (Energy Efficiency)',
    completed: false
  },
  {
    id: 'ch_public_transit',
    title: 'Green Commute Challenge',
    category: 'Transport',
    icon: 'bus',
    difficulty: 'Medium',
    impactLevel: 'High',
    description: 'Commute via public bus, metro, bicycle, or walking instead of private motorized solo travel today.',
    sdgTarget: 'Target 11.2 (Sustainable Transport)',
    completed: false
  },
  {
    id: 'ch_waste_segregation',
    title: 'Dual-Bin Waste Segregation',
    category: 'Waste',
    icon: 'recycle',
    difficulty: 'Easy',
    impactLevel: 'Medium',
    description: 'Properly segregate wet biodegradable food scraps from clean dry recyclables (paper, plastic bottles, cans).',
    sdgTarget: 'Target 12.5 (Prevention & Recycling)',
    completed: false
  },
  {
    id: 'ch_food_waste',
    title: 'Zero Plate Food Waste',
    category: 'Food',
    icon: 'utensils',
    difficulty: 'Easy',
    impactLevel: 'High',
    description: 'Serve only what you will finish. Take leftovers home in reusable containers to prevent organic landfill decomposition.',
    sdgTarget: 'Target 12.3 (Halve Food Waste)',
    completed: false
  },
  {
    id: 'ch_bucket_bath',
    title: '5-Minute Water Conservation Shower',
    category: 'Water',
    icon: 'shower-head',
    difficulty: 'Medium',
    impactLevel: 'Medium',
    description: 'Keep your shower under 5 minutes or use a bucket bath. Turn off the faucet while brushing teeth and soaping.',
    sdgTarget: 'Target 6.4 (Water Efficiency)',
    completed: false
  },
  {
    id: 'ch_plant_care',
    title: 'Plant Care & Urban Greenery',
    category: 'Biodiversity',
    icon: 'sprout',
    difficulty: 'Easy',
    impactLevel: 'Low',
    description: 'Water indoor or campus plants with leftover clean rinsing water. Check soil moisture and promote photosynthesis.',
    sdgTarget: 'Target 15.2 (Forests & Green Spaces)',
    completed: false
  },
  {
    id: 'ch_digital_cleanup',
    title: 'Digital Carbon Declutter',
    category: 'Energy',
    icon: 'database',
    difficulty: 'Medium',
    impactLevel: 'Low',
    description: 'Delete 50 redundant emails, unsubscribe from junk newsletters, and clean inactive cloud backups to reduce data center power.',
    sdgTarget: 'Target 13.3 (Climate Education)',
    completed: false
  }
];

export class ChallengesManager {
  constructor() {
    this.challenges = this.loadState();
  }

  loadState() {
    const saved = Storage.getChallenges();
    if (saved && Array.isArray(saved.items)) {
      // Merge with default list in case new challenges were added
      return INITIAL_CHALLENGES.map(def => {
        const found = saved.items.find(i => i.id === def.id);
        return found ? { ...def, completed: !!found.completed } : def;
      });
    }
    return INITIAL_CHALLENGES.map(c => ({ ...c }));
  }

  saveState() {
    Storage.saveChallenges({
      items: this.challenges.map(c => ({ id: c.id, completed: c.completed })),
      lastUpdated: new Date().toISOString()
    });
  }

  toggleChallenge(id) {
    const challenge = this.challenges.find(c => c.id === id);
    if (challenge) {
      challenge.completed = !challenge.completed;
      this.saveState();
      return challenge;
    }
    return null;
  }

  getProgress() {
    const total = this.challenges.length;
    const completed = this.challenges.filter(c => c.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let levelTitle = 'Eco Novice';
    let levelBadge = '🌱';
    if (percentage >= 80) {
      levelTitle = 'Climate Champion';
      levelBadge = '🏆';
    } else if (percentage >= 50) {
      levelTitle = 'Sustainability Advocate';
      levelBadge = '🌿';
    } else if (percentage >= 20) {
      levelTitle = 'Green Explorer';
      levelBadge = '🍃';
    }

    return {
      total,
      completed,
      percentage,
      levelTitle,
      levelBadge
    };
  }

  getDailyChallenge() {
    // Selects a deterministic daily challenge based on day of month
    const day = new Date().getDate();
    const index = day % this.challenges.length;
    return this.challenges[index];
  }

  resetAll() {
    this.challenges = INITIAL_CHALLENGES.map(c => ({ ...c, completed: false }));
    Storage.resetChallenges();
    return this.getProgress();
  }
}
