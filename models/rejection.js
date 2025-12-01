let rejections = [];
let adminUser = null;
let idCounter = 1;

class RejectionModel {
  static createRejection(data, imageFiles = []) {
    const rejection = {
      id: idCounter++,
      materialType: data.materialType,
      materialName: data.materialName,
      supplierName: data.supplierName,
      defectCategory: data.defectCategory,
      defectDescription: data.defectDescription,
      quantityRejected: data.quantityRejected,
      quantityUnit: data.quantityUnit,
      processArea: data.processArea,
      shiftCode: data.shiftCode,
      shiftTime: data.shiftTime,
      inspectorName: data.inspectorName,
      inspectorEmployeeId: data.inspectorEmployeeId,
      rejectionDateTime: data.rejectionDateTime ? new Date(data.rejectionDateTime).toISOString() : new Date().toISOString(),
      enteredByUser: data.enteredByUser || null,
      enteredByName: data.enteredByName || null,
      enteredByEmployeeId: data.enteredByEmployeeId || null,
      images: imageFiles || [],
      createdAt: new Date().toISOString()
    };
    rejections.push(rejection);
    return rejection;
  }

  static getAllRejections() {
    return rejections;
  }

  static getRejectionById(id) {
    return rejections.find(r => r.id === parseInt(id));
  }

  static deleteRejection(id) {
    rejections = rejections.filter(r => r.id !== parseInt(id));
    return true;
  }

  static seedAdmin() {
    adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@rejected-material.local',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    return adminUser;
  }

  static getAdmin() {
    return adminUser;
  }
}

module.exports = RejectionModel;
