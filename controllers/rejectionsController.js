const RejectionModel = require('../models/rejection');

exports.createRejection = (req, res) => {
  try {
    const {
      materialType,
      materialName,
      supplierName,
      defectCategory,
      defectDescription,
      quantityRejected,
      shiftCode,
      shiftTime,
      processArea,
      inspectorName,
      inspectorEmployeeId
    } = req.body;

    const imageFiles = req.files ? req.files.map(f => f.filename) : [];

    const userInfo = req.user || {};

    const rejection = RejectionModel.createRejection(
      {
        materialType,
        materialName,
        supplierName,
        defectCategory,
        defectDescription,
        quantityRejected,
        shiftCode,
        shiftTime,
        processArea,
        inspectorName,
        inspectorEmployeeId,
        enteredByUser: userInfo.id || null,
        enteredByName: userInfo.name || null,
        enteredByEmployeeId: userInfo.employeeId || null
      },
      imageFiles
    );

    res.status(201).json({
      success: true,
      message: 'Rejection submitted successfully',
      data: rejection
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error submitting rejection',
      error: error.message
    });
  }
};

exports.getAllRejections = (req, res) => {
  try {
    const rejections = RejectionModel.getAllRejections();
    res.status(200).json({
      success: true,
      data: rejections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
};

exports.getRejection = (req, res) => {
  try {
    const rejection = RejectionModel.getRejectionById(req.params.id);
    if (!rejection) {
      return res.status(404).json({
        success: false,
        message: 'Rejection not found'
      });
    }
    res.status(200).json({
      success: true,
      data: rejection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
};

exports.deleteRejection = (req, res) => {
  try {
    RejectionModel.deleteRejection(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Rejection deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting rejection',
      error: error.message
    });
  }
};
