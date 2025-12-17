const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Client = require('../models/Client');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all clients (with search and sort)
router.get('/', async (req, res) => {
  try {
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const clients = await Client.find(query).sort(sortOptions);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create client (auth required)
router.post('/', auth, [
  body('lastName').trim().isLength({ min: 2 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('address').trim().notEmpty(),
  body('phone').matches(/^[\d\s\-\+\(\)]+$/),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = new Client({
      ...req.body,
      createdBy: req.user._id
    });
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update client (auth required)
router.put('/:id', auth, [
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().matches(/^[\d\s\-\+\(\)]+$/),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete client (auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

