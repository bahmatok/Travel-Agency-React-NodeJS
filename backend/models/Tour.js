const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: [true, 'Destination is required']
  },
  hotel: {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true
    },
    class: {
      type: String,
      required: true,
      enum: ['economy', 'standard', 'luxury', 'premium']
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    validate: {
      validator: function(v) {
        return [1, 2, 4].includes(v);
      },
      message: 'Duration must be 1, 2, or 4 weeks'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required']
  },
  available: {
    type: Boolean,
    default: true
  },
  description: {
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
  },
  generatedImage: {
    type: String, // Base64 изображение или URL
    default: null
  },
  imagePrompt: {
    type: String, // Промпт, использованный для генерации
    default: null
  }
});

tourSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tour', tourSchema);

