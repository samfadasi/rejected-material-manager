const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rejected-material-secret-key-2025';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      employeeId: decoded.employeeId,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid token'
    });
  }
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        name: decoded.name,
        employeeId: decoded.employeeId,
        role: decoded.role
      };
    } catch (error) {
      // Token invalid, but optional so continue
    }
  }

  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware };
