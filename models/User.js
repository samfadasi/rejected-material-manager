const bcrypt = require('bcrypt');

let users = [];
let userIdCounter = 1;

class User {
  static async create(userData) {
    const existingUser = this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const passwordHash = userData.passwordHash ? await bcrypt.hash(userData.passwordHash, 10) : null;

    const user = {
      id: userIdCounter++,
      name: userData.name,
      email: userData.email,
      employeeId: userData.employeeId || `EMP-${String(userIdCounter).padStart(4, '0')}`,
      passwordHash: passwordHash,
      role: userData.role || 'INSPECTOR',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    return user;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static findById(id) {
    return users.find(u => u.id === parseInt(id));
  }

  static findByEmail(email) {
    return users.find(u => u.email === email);
  }

  static findByEmployeeId(employeeId) {
    return users.find(u => u.employeeId === employeeId);
  }

  static getAll() {
    return users;
  }

  static async seedAdmin() {
    const admin = await this.create({
      name: 'Admin User',
      email: 'admin@rejected-material.local',
      employeeId: 'EMP-0001',
      passwordHash: 'admin123',
      role: 'ADMIN'
    });
    return admin;
  }
}

module.exports = User;
