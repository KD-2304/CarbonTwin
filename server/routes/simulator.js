const express = require('express');
const auth = require('../middleware/auth');
const { EMISSION_FACTORS, getEquivalencies } = require('../services/scoreService');

const router = express.Router();

// POST /api/simulator/calculate
router.post('/calculate', auth, (req, res) => {
  try {
    const { currentAnswers, modifications } = req.body;

    if (!currentAnswers) {
      return res.status(400).json({ error: 'Current quiz answers are required' });
    }

    // Calculate current score from answers
    const { calculateBaselineScore } = require('../services/scoreService');
    const current = calculateBaselineScore(currentAnswers);

    // Apply modifications and recalculate
    const modified = { ...currentAnswers };

    if (modifications.goVegetarian) {
      modified.diet = 'vegetarian';
    }
    if (modifications.goVegan) {
      modified.diet = 'vegan';
    }
    if (modifications.cycleInsteadOfDrive) {
      modified.transport = {
        ...modified.transport,
        mode: 'bike',
        weeklyKm: modified.transport.weeklyKm * (modifications.cycleDays || 3) / 7
      };
    }
    if (modifications.cutLongHaulFlight) {
      modified.flights = {
        ...modified.flights,
        longHaul: Math.max(0, modified.flights.longHaul - 1)
      };
    }
    if (modifications.cutShortHaulFlight) {
      modified.flights = {
        ...modified.flights,
        shortHaul: Math.max(0, modified.flights.shortHaul - 1)
      };
    }
    if (modifications.switchToRenewable) {
      modified.energy = { ...modified.energy, source: 'renewable' };
    }
    if (modifications.reduceShoppingToMinimal) {
      modified.shopping = 'minimal';
    }

    const simulated = calculateBaselineScore(modified);
    const savings = current.total - simulated.total;

    res.json({
      currentScore: current.total,
      simulatedScore: simulated.total,
      savings,
      currentBreakdown: current.breakdown,
      simulatedBreakdown: simulated.breakdown,
      equivalencies: getEquivalencies(savings)
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: 'Calculation error' });
  }
});

module.exports = router;
