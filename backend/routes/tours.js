const express = require('express');
const { body, validationResult } = require('express-validator');
const Tour = require('../models/Tour');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tours (with search and sort)
router.get('/', async (req, res) => {
  try {
    const { search, sortBy = 'departureDate', sortOrder = 'asc', minPrice, maxPrice, duration } = req.query;
    
    let query = { available: true };
    
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'hotel.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (duration) {
      query.duration = Number(duration);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tours = await Tour.find(query)
      .populate('destination')
      .sort(sortOptions);
    res.json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single tour
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('destination');
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json(tour);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create tour (auth required)
router.post('/', auth, [
  body('destination').isMongoId(),
  body('hotel.name').trim().notEmpty(),
  body('hotel.class').isIn(['economy', 'standard', 'luxury', 'premium']),
  body('duration').isIn([1, 2, 4]),
  body('price').isFloat({ min: 0 }),
  body('departureDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tour = new Tour({
      ...req.body,
      createdBy: req.user._id
    });
    await tour.save();
    const populatedTour = await Tour.findById(tour._id).populate('destination');
    res.status(201).json(populatedTour);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update tour (auth required)
router.put('/:id', auth, [
  body('duration').optional().isIn([1, 2, 4]),
  body('price').optional().isFloat({ min: 0 }),
  body('hotel.class').optional().isIn(['economy', 'standard', 'luxury', 'premium'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('destination');
    
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    
    res.json(tour);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete tour (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

