const User = require('../models/User');

function authMiddleware(req, res, next) {
  const userIdHeader = req.headers['x-user-id'];
  const employeeIdHeader = req.headers['x-employee-id'];

  if (!userIdHeader && !employeeIdHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No user information provided'
    });
  }

  let user = null;

  if (userIdHeader) {
    user = User.findById(parseInt(userIdHeader));
  } else if (employeeIdHeader) {
    user = User.findByEmployeeId(employeeIdHeader);
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - User not found'
    });
  }

  req.user = {
    id: user.id,
    name: user.name,
    employeeId: user.employeeId,
    role: user.role,
    email: user.email
  };

  next();
}

function optionalAuthMiddleware(req, res, next) {
  const userIdHeader = req.headers['x-user-id'];
  const employeeIdHeader = req.headers['x-employee-id'];

  if (userIdHeader || employeeIdHeader) {
    let user = null;
    if (userIdHeader) {
      user = User.findById(parseInt(userIdHeader));
    } else if (employeeIdHeader) {
      user = User.findByEmployeeId(employeeIdHeader);
    }

    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        email: user.email
      };
    }
  }

  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware };
