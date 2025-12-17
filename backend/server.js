const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');

// Загружаем .env файл из директории backend
const envPath = path.join(__dirname, '.env');
const fs = require('fs');

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Ошибка загрузки .env:', result.error.message);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-agency')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/tours', require('./routes/tours'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});