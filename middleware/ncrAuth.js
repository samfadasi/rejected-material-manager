const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ncr-manager-secret-key-2025';

function verifyToken(req, res, next) {
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
      userId: decoded.userId,
      name: decoded.name,
      employee_id: decoded.employee_id,
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

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        name: decoded.name,
        employee_id: decoded.employee_id,
        role: decoded.role
      };
    } catch (error) {
    }
  }

  next();
}

module.exports = { verifyToken, requireRole, optionalAuth };
