/**
 * Dynamic Emission Factors Configuration
 * 
 * All baseline emission factors are based on peer-reviewed research and
 * international organization data (IPCC, EPA, DEFRA).
 * Values can be customized dynamically using environment variables.
 */

const EMISSION_FACTORS = {
  transport: {
    car_petrol: parseFloat(process.env.EMISSION_TRANSPORT_CAR_PETROL) || 0.21,
    car_diesel: parseFloat(process.env.EMISSION_TRANSPORT_CAR_DIESEL) || 0.17,
    car_electric: parseFloat(process.env.EMISSION_TRANSPORT_CAR_ELECTRIC) || 0.05,
    bike: parseFloat(process.env.EMISSION_TRANSPORT_BIKE) || 0.0,
    public_transit: parseFloat(process.env.EMISSION_TRANSPORT_PUBLIC_TRANSIT) || 0.089,
    walk: parseFloat(process.env.EMISSION_TRANSPORT_WALK) || 0.0
  },
  diet: {
    vegan: parseInt(process.env.EMISSION_DIET_VEGAN, 10) || 1500,
    vegetarian: parseInt(process.env.EMISSION_DIET_VEGETARIAN, 10) || 1700,
    pescatarian: parseInt(process.env.EMISSION_DIET_PESCATARIAN, 10) || 1900,
    omnivore: parseInt(process.env.EMISSION_DIET_OMNIVORE, 10) || 2500,
    heavy_meat: parseInt(process.env.EMISSION_DIET_HEAVY_MEAT, 10) || 3300
  },
  energy: {
    renewable: parseFloat(process.env.EMISSION_ENERGY_RENEWABLE) || 0.05,
    mixed: parseFloat(process.env.EMISSION_ENERGY_MIXED) || 0.23,
    coal: parseFloat(process.env.EMISSION_ENERGY_COAL) || 0.82
  },
  shopping: {
    minimal: parseInt(process.env.EMISSION_SHOPPING_MINIMAL, 10) || 500,
    average: parseInt(process.env.EMISSION_SHOPPING_AVERAGE, 10) || 1200,
    frequent: parseInt(process.env.EMISSION_SHOPPING_FREQUENT, 10) || 2400
  },
  flights: {
    shortHaul: parseInt(process.env.EMISSION_FLIGHTS_SHORTHAUL, 10) || 255,
    longHaul: parseInt(process.env.EMISSION_FLIGHTS_LONGHAUL, 10) || 1620
  },
  actions: {
    transport: {
      took_car: null,
      public_transit: parseFloat(process.env.ACTION_TRANSPORT_PUBLIC_TRANSIT) || -0.3,
      cycled_walked: null,
      work_from_home: parseFloat(process.env.ACTION_TRANSPORT_WORK_FROM_HOME) || -1.2
    },
    meal: {
      vegan_meal: parseFloat(process.env.ACTION_MEAL_VEGAN_MEAL) || -0.5,
      vegetarian_meal: parseFloat(process.env.ACTION_MEAL_VEGETARIAN_MEAL) || -0.3,
      meat_meal: parseFloat(process.env.ACTION_MEAL_MEAT_MEAL) || 0.8,
      local_produce: parseFloat(process.env.ACTION_MEAL_LOCAL_PRODUCE) || -0.2
    },
    home: {
      ac_off_4hrs: parseFloat(process.env.ACTION_HOME_AC_OFF_4HRS) || -0.4,
      air_dry_laundry: parseFloat(process.env.ACTION_HOME_AIR_DRY_LAUNDRY) || -0.7,
      reduced_heating: parseFloat(process.env.ACTION_HOME_REDUCED_HEATING) || -0.5
    },
    shopping: {
      secondhand_item: parseFloat(process.env.ACTION_SHOPPING_SECONDHAND_ITEM) || -1.2,
      avoid_plastic: parseFloat(process.env.ACTION_SHOPPING_AVOID_PLASTIC) || -0.1,
      new_electronics: parseFloat(process.env.ACTION_SHOPPING_NEW_ELECTRONICS) || 30
    }
  }
};

module.exports = {
  EMISSION_FACTORS
};
