const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  climate: {
    type: String,
    required: [true, 'Climate description is required'],
    enum: ['tropical', 'temperate', 'continental', 'arctic', 'mediterranean', 'desert'],
    trim: true
  },
  climateDescription: {
    type: String,
    required: [true, 'Climate description is required'],
    trim: true
  },
  hotels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    class: {
      type: String,
      required: true,
      enum: ['economy', 'standard', 'luxury', 'premium'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  aiGeneratedImage: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

destinationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Destination', destinationSchema);

