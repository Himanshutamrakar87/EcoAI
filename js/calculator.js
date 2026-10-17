/**
 * EcoAI - Carbon Footprint Calculator Module
 * 
 * Performs deterministic client-side numerical carbon footprint estimations
 * using verified emission factors from IPCC, IEA, and CEA guidelines.
 * 
 * Educational Disclaimer:
 * Calculations are approximate educational estimations intended to build
 * carbon awareness and highlight relative lifestyle impacts. They do not
 * constitute an ISO 14064 or GHG Protocol certified corporate carbon audit.
 */

import { Storage } from './storage.js';

// Documented Emission Factors (kg CO2 equivalent per unit)
export const EMISSION_FACTORS = {
  // Electricity Grid Average (CEA India / Global Mixed Thermal Grid Baseline)
  ELECTRICITY_PER_KWH: 0.71, // kg CO2e per kWh

  // Transport Factors (kg CO2e per passenger-kilometer)
  // Sources: IPCC Mobile Combustion Guidelines, UK DEFRA/DESNZ GHG Conversion Factors, urban transit studies
  TRANSPORT_PER_KM: {
    walking_bicycle: 0.000,
    electric_metro: 0.035,
    public_bus: 0.065,
    electric_two_wheeler: 0.018,
    petrol_two_wheeler: 0.046, // ~50 km/L motorcycle
    electric_car: 0.062,      // Grid electricity charged
    petrol_car_solo: 0.165,   // ~14 km/L petrol hatchback/sedan
    diesel_car_solo: 0.175,   // ~16 km/L diesel vehicle
    shared_cab_auto: 0.085    // Shared occupancy urban auto/cab
  },

  // Cooking Fuel (LPG cylinder 14.2 kg contains approx 42.5 kg CO2e when burned)
  LPG_CYLINDER_MONTHLY: 42.5, // kg CO2e per full cylinder

  // Diet Baseline Impact (kg CO2e per day, based on Oxford / Poore & Nemecek studies)
  DIET_DAILY: {
    vegan: 1.5,
    vegetarian: 1.8,
    low_meat: 2.4,
    high_meat: 3.3
  },

  // Global & National Benchmarks for Educational Comparison (tonnes CO2e/year)
  BENCHMARKS: {
    INDIA_AVERAGE_YEARLY: 1.9,    // Tonnes per capita per year
    GLOBAL_AVERAGE_YEARLY: 4.7,   // Tonnes per capita per year
    PARIS_AGREEMENT_TARGET_2030: 2.0 // Target per capita to limit warming to 1.5C
  }
};

let carbonChartInstance = null;

/**
 * Calculate detailed carbon footprint based on user inputs
 */
export function calculateFootprint(inputs) {
  const {
    dailyKm = 10,
    transportMode = 'public_bus',
    monthlyKwh = 120,
    householdMembers = 1,
    lpgCylindersPerMonth = 0.5,
    dietType = 'vegetarian'
  } = inputs;

  const validMembers = Math.max(1, parseInt(householdMembers, 10) || 1);

  // 1. Transportation Emissions
  const transportFactor = EMISSION_FACTORS.TRANSPORT_PER_KM[transportMode] ?? 0.065;
  const dailyTransportKg = (parseFloat(dailyKm) || 0) * transportFactor;
  const monthlyTransportKg = dailyTransportKg * 30;
  const yearlyTransportKg = dailyTransportKg * 365;

  // 2. Household Electricity Emissions (apportioned per member)
  const totalMonthlyElectricityKg = (parseFloat(monthlyKwh) || 0) * EMISSION_FACTORS.ELECTRICITY_PER_KWH;
  const monthlyElectricityKg = totalMonthlyElectricityKg / validMembers;
  const dailyElectricityKg = monthlyElectricityKg / 30;
  const yearlyElectricityKg = monthlyElectricityKg * 12;

  // 3. Cooking Energy / Gas Emissions (apportioned per member)
  const totalMonthlyLpgKg = (parseFloat(lpgCylindersPerMonth) || 0) * EMISSION_FACTORS.LPG_CYLINDER_MONTHLY;
  const monthlyLpgKg = totalMonthlyLpgKg / validMembers;
  const dailyLpgKg = monthlyLpgKg / 30;
  const yearlyLpgKg = monthlyLpgKg * 12;

  // 4. Dietary Footprint
  const dailyDietKg = EMISSION_FACTORS.DIET_DAILY[dietType] ?? 1.8;
  const monthlyDietKg = dailyDietKg * 30;
  const yearlyDietKg = dailyDietKg * 365;

  // Aggregate Totals
  const totalDailyKg = dailyTransportKg + dailyElectricityKg + dailyLpgKg + dailyDietKg;
  const totalMonthlyKg = totalDailyKg * 30;
  const totalYearlyKg = totalDailyKg * 365;
  const totalYearlyTonnes = totalYearlyKg / 1000;

  // Category percentages
  const transportPct = Math.round((dailyTransportKg / (totalDailyKg || 1)) * 100);
  const electricityPct = Math.round((dailyElectricityKg / (totalDailyKg || 1)) * 100);
  const cookingPct = Math.round((dailyLpgKg / (totalDailyKg || 1)) * 100);
  const dietPct = 100 - (transportPct + electricityPct + cookingPct);

  // Generate actionable tips tailored to highest contributors
  const recommendations = generateRecommendations({
    dailyTransportKg,
    monthlyElectricityKg,
    dietType,
    transportMode,
    monthlyKwh
  });

  const result = {
    dailyKg: Number(totalDailyKg.toFixed(2)),
    monthlyKg: Number(totalMonthlyKg.toFixed(1)),
    yearlyTonnes: Number(totalYearlyTonnes.toFixed(2)),
    categories: {
      transport: {
        dailyKg: Number(dailyTransportKg.toFixed(2)),
        monthlyKg: Number(monthlyTransportKg.toFixed(1)),
        yearlyKg: Number(yearlyTransportKg.toFixed(1)),
        percent: transportPct
      },
      electricity: {
        dailyKg: Number(dailyElectricityKg.toFixed(2)),
        monthlyKg: Number(monthlyElectricityKg.toFixed(1)),
        yearlyKg: Number(yearlyElectricityKg.toFixed(1)),
        percent: electricityPct
      },
      cooking: {
        dailyKg: Number(dailyLpgKg.toFixed(2)),
        monthlyKg: Number(monthlyLpgKg.toFixed(1)),
        yearlyKg: Number(yearlyLpgKg.toFixed(1)),
        percent: cookingPct
      },
      diet: {
        dailyKg: Number(dailyDietKg.toFixed(2)),
        monthlyKg: Number(monthlyDietKg.toFixed(1)),
        yearlyKg: Number(yearlyDietKg.toFixed(1)),
        percent: dietPct
      }
    },
    recommendations,
    benchmarks: EMISSION_FACTORS.BENCHMARKS
  };

  // Persist result in LocalStorage for student review
  Storage.saveCarbonCalculation({
    yearlyTonnes: result.yearlyTonnes,
    monthlyKg: result.monthlyKg,
    transportMode,
    monthlyKwh
  });

  return result;
}

/**
 * Generate practical emission reduction recommendations
 */
function generateRecommendations({ dailyTransportKg, monthlyElectricityKg, dietType, transportMode, monthlyKwh }) {
  const tips = [];

  if (transportMode === 'petrol_car_solo' || transportMode === 'diesel_car_solo') {
    tips.push({
      category: 'Transport',
      icon: 'car',
      title: 'Shift 2 Days to Public Transit or Carpooling',
      impact: 'High Impact (~250-400 kg CO2e saved annually)',
      description: 'Switching solo car commutes to metro, campus bus, or bicycle just twice a week reduces transport emissions by up to 40%.'
    });
  } else if (transportMode === 'petrol_two_wheeler') {
    tips.push({
      category: 'Transport',
      icon: 'bike',
      title: 'Optimize Bike Commute & Tire Pressure',
      impact: 'Medium Impact (~60-100 kg CO2e saved annually)',
      description: 'Maintaining proper tire pressure and smooth acceleration improves fuel efficiency by 12-15%. Consider cycling for trips under 3 km.'
    });
  }

  if (monthlyKwh > 150) {
    tips.push({
      category: 'Electricity',
      icon: 'zap',
      title: 'Target Idle Phantom Power & AC Temperature',
      impact: 'High Impact (~150-250 kg CO2e saved annually)',
      description: 'Setting air conditioning to 24-26°C instead of 18°C saves 6% electricity per degree. Turn off standby switches on computers and gaming consoles.'
    });
  } else {
    tips.push({
      category: 'Electricity',
      icon: 'lightbulb',
      title: 'Upgrade Remaining Bulbs to High-Efficiency LEDs',
      impact: 'Low-to-Medium Impact (~40 kg CO2e saved)',
      description: 'LED lights use up to 80% less energy than incandescent and compact fluorescent bulbs with a much longer lifespan.'
    });
  }

  if (dietType === 'high_meat' || dietType === 'low_meat') {
    tips.push({
      category: 'Food',
      icon: 'utensils',
      title: 'Try "Meatless Mondays" / Plant-Forward Days',
      impact: 'High Impact (~200 kg CO2e saved annually)',
      description: 'Plant proteins (pulses, lentils, soybeans) require significantly less land, water, and produce far fewer greenhouse gases than livestock.'
    });
  } else {
    tips.push({
      category: 'Food',
      icon: 'apple',
      title: 'Zero-Food-Waste Kitchen Practices',
      impact: 'Medium Impact (~80 kg CO2e saved annually)',
      description: 'Composting vegetable peels and planning meals avoids methane generation in municipal landfills.'
    });
  }

  return tips;
}

/**
 * Render or update Chart.js donut chart for carbon category breakdown
 */
export function renderCarbonChart(canvasElement, categoriesData) {
  if (!canvasElement || typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded or canvas element missing');
    return;
  }

  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;

  if (carbonChartInstance) {
    carbonChartInstance.destroy();
  }

  const data = [
    categoriesData.transport.monthlyKg,
    categoriesData.electricity.monthlyKg,
    categoriesData.cooking.monthlyKg,
    categoriesData.diet.monthlyKg
  ];

  carbonChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Electricity', 'Cooking (LPG)', 'Diet Baseline'],
      datasets: [{
        data: data,
        backgroundColor: [
          '#16A34A', // Eco Green
          '#F59E0B', // Amber
          '#0284C7', // Sky Blue
          '#10B981'  // Emerald
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 14,
            padding: 16,
            font: {
              family: 'system-ui, -apple-system, sans-serif',
              size: 13,
              weight: '500'
            },
            color: '#334155'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return ` ${label}: ${value.toFixed(1)} kg CO2e / month`;
            }
          }
        }
      },
      cutout: '68%'
    }
  });

  return carbonChartInstance;
}
