const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const { verifyToken, requireRole } = require('../middleware/ncrAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'ncr-manager-secret-key-2025';

router.post('/register', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, employee_id, password, role } = req.body;

    if (!name || !email || !password || !employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, employee ID, and password are required'
      });
    }

    const validRoles = ['INSPECTOR', 'ENGINEER', 'MANAGER', 'ADMIN'];
    const userRole = validRoles.includes(role) ? role : 'INSPECTOR';

    const newUser = await UserModel.create({
      name,
      email,
      employee_id,
      password,
      role: userRole
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        employee_id: newUser.employee_id,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, employee_id, password } = req.body;

    if (!name || !email || !password || !employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, employee ID, and password are required'
      });
    }

    const newUser = await UserModel.create({
      name,
      email,
      employee_id,
      password,
      role: 'INSPECTOR'
    });

    const token = jwt.sign(
      {
        userId: newUser.id,
        name: newUser.name,
        employee_id: newUser.employee_id,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        employee_id: newUser.employee_id,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        employee_id: user.employee_id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
