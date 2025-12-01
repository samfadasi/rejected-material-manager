let users = [];
let userIdCounter = 1;

class User {
  static create(userData) {
    const user = {
      id: userIdCounter++,
      name: userData.name,
      email: userData.email,
      employeeId: userData.employeeId || `EMP-${String(userIdCounter).padStart(4, '0')}`,
      role: userData.role || 'user',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    return user;
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

  static seedAdmin() {
    const admin = this.create({
      name: 'Admin User',
      email: 'admin@rejected-material.local',
      employeeId: 'EMP-0001',
      role: 'admin'
    });
    return admin;
  }
}

module.exports = User;
