const express = require('express');
const { body, validationResult } = require('express-validator');
const Destination = require('../models/Destination');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all destinations (with search and sort)
router.get('/', async (req, res) => {
  try {
    const { search, sortBy = 'country', sortOrder = 'asc' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { climate: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const destinations = await Destination.find(query).sort(sortOptions);
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single destination
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create destination (auth required)
router.post('/', auth, [
  body('country').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('climate').isIn(['tropical', 'temperate', 'continental', 'arctic', 'mediterranean', 'desert']),
  body('climateDescription').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const destination = new Destination({
      ...req.body,
      createdBy: req.user._id
    });
    await destination.save();
    res.status(201).json(destination);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update destination (auth required)
router.put('/:id', auth, [
  body('climate').optional().isIn(['tropical', 'temperate', 'continental', 'arctic', 'mediterranean', 'desert'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete destination (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

