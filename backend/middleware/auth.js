const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('Token length:', token.length);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      console.log('Token decoded successfully, userId:', decoded.userId);
      
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.error('User not found for userId:', decoded.userId);
        return res.status(401).json({ message: 'Token is not valid - user not found' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', error: 'TokenExpiredError' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token', error: 'JsonWebTokenError' });
      } else {
        return res.status(401).json({ message: 'Token verification failed', error: jwtError.message });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

module.exports = auth;

