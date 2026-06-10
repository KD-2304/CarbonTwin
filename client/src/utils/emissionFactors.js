/**
 * Emission factors for client-side calculations
 * Sources cited in tooltips throughout the app
 */

export const EMISSION_FACTORS = {
  transport: {
    car_petrol: { factor: 0.21, unit: 'kg CO₂/km', source: 'UK DEFRA 2023' },
    car_diesel: { factor: 0.17, unit: 'kg CO₂/km', source: 'UK DEFRA 2023' },
    car_electric: { factor: 0.05, unit: 'kg CO₂/km', source: 'IEA 2023 (incl. grid mix)' },
    bike: { factor: 0, unit: 'kg CO₂/km', source: 'Zero direct emissions' },
    public_transit: { factor: 0.089, unit: 'kg CO₂/km', source: 'DEFRA avg bus/train per pax-km' },
    walk: { factor: 0, unit: 'kg CO₂/km', source: 'Zero direct emissions' }
  },
  diet: {
    vegan: { annual: 1500, source: 'Poore & Nemecek, Science 2018' },
    vegetarian: { annual: 1700, source: 'Scarborough et al., 2014' },
    pescatarian: { annual: 1900, source: 'Scarborough et al., 2014' },
    omnivore: { annual: 2500, source: 'Poore & Nemecek, Science 2018' },
    heavy_meat: { annual: 3300, source: 'Poore & Nemecek, Science 2018' }
  },
  energy: {
    renewable: { factor: 0.05, unit: 'kg CO₂/kWh', source: 'IPCC 2021 (lifecycle)' },
    mixed: { factor: 0.23, unit: 'kg CO₂/kWh', source: 'IEA global avg grid mix' },
    coal: { factor: 0.82, unit: 'kg CO₂/kWh', source: 'IPCC 2021' }
  },
  shopping: {
    minimal: { annual: 500, source: 'WRAP, Ellen MacArthur Foundation' },
    average: { annual: 1200, source: 'WRAP, Ellen MacArthur Foundation' },
    frequent: { annual: 2400, source: 'WRAP, Ellen MacArthur Foundation' }
  },
  flights: {
    shortHaul: { perFlight: 255, source: 'ICAO Carbon Emissions Calculator' },
    longHaul: { perFlight: 1620, source: 'ICAO (incl. radiative forcing)' }
  }
};

export const BENCHMARKS = {
  world_average: { value: 4000, label: 'World Average' },
  india_average: { value: 1800, label: 'India Average' },
  paris_target: { value: 2000, label: 'Paris Agreement Target' },
  eu_average: { value: 6800, label: 'EU Average' },
  us_average: { value: 16000, label: 'US Average' }
};

export const ACTION_OPTIONS = {
  transport: [
    { id: 'took_car', label: 'Took car', needsKm: true, icon: '🚗' },
    { id: 'public_transit', label: 'Took public transit', delta: -0.3, icon: '🚌' },
    { id: 'cycled_walked', label: 'Cycled or walked', needsKm: true, icon: '🚴' },
    { id: 'work_from_home', label: 'Worked from home', delta: -1.2, icon: '🏠' }
  ],
  meal: [
    { id: 'vegan_meal', label: 'Vegan meal', delta: -0.5, icon: '🥬' },
    { id: 'vegetarian_meal', label: 'Vegetarian meal', delta: -0.3, icon: '🥗' },
    { id: 'meat_meal', label: 'Meat meal', delta: 0.8, icon: '🥩' },
    { id: 'local_produce', label: 'Bought local produce', delta: -0.2, icon: '🧑‍🌾' }
  ],
  home: [
    { id: 'ac_off_4hrs', label: 'Turned off AC for 4hrs', delta: -0.4, icon: '❄️' },
    { id: 'air_dry_laundry', label: 'Air-dried laundry', delta: -0.7, icon: '👕' },
    { id: 'reduced_heating', label: 'Reduced heating', delta: -0.5, icon: '🔥' }
  ],
  shopping: [
    { id: 'secondhand_item', label: 'Bought second-hand', delta: -1.2, icon: '♻️' },
    { id: 'avoid_plastic', label: 'Avoided single-use plastic', delta: -0.1, icon: '🚫' },
    { id: 'new_electronics', label: 'Bought new electronics', delta: 30, icon: '💻' }
  ]
};
