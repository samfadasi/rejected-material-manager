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
      shift,
      processArea
    } = req.body;

    const imageFiles = req.files ? req.files.map(f => f.filename) : [];

    const rejection = RejectionModel.createRejection(
      {
        materialType,
        materialName,
        supplierName,
        defectCategory,
        defectDescription,
        quantityRejected,
        shift,
        processArea
      },
      imageFiles
    );

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الرفض بنجاح',
      data: rejection
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'خطأ في تسجيل الرفض',
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
      message: 'خطأ في جلب البيانات',
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
        message: 'لم يتم العثور على الرفض'
      });
    }
    res.status(200).json({
      success: true,
      data: rejection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البيانات',
      error: error.message
    });
  }
};

exports.deleteRejection = (req, res) => {
  try {
    RejectionModel.deleteRejection(req.params.id);
    res.status(200).json({
      success: true,
      message: 'تم حذف الرفض بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الرفض',
      error: error.message
    });
  }
};
