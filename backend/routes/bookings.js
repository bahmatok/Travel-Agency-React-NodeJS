const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all bookings (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', sortOrder = 'desc', status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const bookings = await Booking.find(query)
      .populate('client')
      .populate('tours.tour')
      .sort(sortOptions);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single booking (auth required)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client')
      .populate('tours.tour');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create booking (auth required)
router.post('/', auth, [
  body('client').isMongoId(),
  body('tours').isArray({ min: 1 }),
  body('tours.*.tour').isMongoId(),
  body('tours.*.quantity').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculate total price
    let totalPrice = 0;
    for (const tourItem of req.body.tours) {
      const tour = await Tour.findById(tourItem.tour);
      if (!tour || !tour.available) {
        return res.status(400).json({ message: `Tour ${tourItem.tour} is not available` });
      }
      totalPrice += tour.price * (tourItem.quantity || 1);
    }

    const booking = new Booking({
      ...req.body,
      totalPrice,
      createdBy: req.user._id
    });
    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate('client')
      .populate('tours.tour');
    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking (auth required)
router.put('/:id', auth, [
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client')
      .populate('tours.tour');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete booking (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

